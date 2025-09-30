const { QueryTypes, Op } = require("sequelize");
const db = require("../entity/index.js");
const lodash = require("lodash");
const logger = require("../config/winston.config.js");
const { getUserCreditBalance, addCreditTransaction } = require("./CreditService.service.js");
const urlEmbeddabilityService = require("./UrlEmbeddability.service.js");

/**
 * Integrated Course Builder Service
 * Handles course builder drafts and URL processing for course creation
 */

/**
 * Check if a URL is a YouTube URL
 * @param {string} url - The URL to check
 * @returns {boolean} - True if the URL is a YouTube URL
 */
function isYouTubeUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\//,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\//,
    /(?:https?:\/\/)?youtu\.be\//,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/playlist\?/
  ];
  
  return patterns.some(pattern => pattern.test(url));
}

/**
 * Extract video ID from YouTube URL
 * @param {string} url - YouTube URL
 * @returns {string|null} - Video ID or null
 */
function extractVideoIdFromUrl(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }
  
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // If it's already a video ID (11 characters)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }
  
  return null;
}

/**
 * Extract playlist ID from YouTube URL
 * @param {string} url - YouTube URL
 * @returns {string|null} - Playlist ID or null
 */
function extractPlaylistIdFromUrl(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }
  
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*list=([a-zA-Z0-9_-]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // If it's already a playlist ID (starts with PL, UU, or FL)
  if (/^(PL|UU|FL)[a-zA-Z0-9_-]{16,}$/.test(url)) {
    return url;
  }
  
  return null;
}

/**
 * Parse ISO 8601 duration to seconds
 * @param {string} duration - ISO 8601 duration (PT1H2M3S)
 * @returns {number} - Duration in seconds
 */
function parseISO8601Duration(duration) {
  if (!duration || typeof duration !== 'string') {
    logger.warn(`Invalid duration format: ${duration}, returning 0`);
    return 0;
  }
  
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  
  if (!match) {
    logger.warn(`Duration format not recognized: ${duration}, returning 0`);
    return 0;
  }
  
  const [, hours = 0, minutes = 0, seconds = 0] = match.map(x => parseInt(x) || 0);
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Fetch video details from YouTube API
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object|null>} - Video details or null if not found
 */
async function fetchVideoDetails(videoId) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY not configured");
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status&id=${videoId}&key=${apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.items?.length) {
      logger.warn(`Video not found or is private: ${videoId}`);
      return null;
    }
    
    const video = data.items[0];
    
    // Check if video is available
    if (video.status.uploadStatus !== 'processed' || video.status.privacyStatus === 'private') {
      logger.warn(`Video not available: ${videoId}`);
      return null;
    }
    
    return {
      videoId: video.id,
      videoTitle: video.snippet.title,
      videoDescription: video.snippet.description,
      videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
      duration: parseISO8601Duration(video.contentDetails.duration),
      thumbnailUrl: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.default?.url,
      channelTitle: video.snippet.channelTitle,
      publishedAt: video.snippet.publishedAt
    };
  } catch (error) {
    logger.error(`Error fetching video details for ${videoId}:`, error.message);
    return null;
  }
}

/**
 * Fetch playlist details and videos from YouTube API
 * @param {string} playlistId - YouTube playlist ID
 * @returns {Promise<Object|null>} - Playlist details with videos or null if not found
 */
async function fetchPlaylistDetails(playlistId) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY not configured");
  }

  try {
    // Fetch playlist metadata
    const playlistUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${apiKey}`;
    const playlistResponse = await fetch(playlistUrl);
    
    if (!playlistResponse.ok) {
      throw new Error(`YouTube API error: ${playlistResponse.status} ${playlistResponse.statusText}`);
    }
    
    const playlistData = await playlistResponse.json();
    
    if (!playlistData.items?.length) {
      logger.warn(`Playlist not found or is private: ${playlistId}`);
      return null;
    }
    
    const playlist = playlistData.items[0];
    
    // Fetch playlist items
    const items = [];
    let nextPageToken = '';

    do {
      const itemsUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}&pageToken=${nextPageToken}`;
      const itemsResponse = await fetch(itemsUrl);
      
      if (!itemsResponse.ok) {
        throw new Error(`YouTube API error: ${itemsResponse.status} ${itemsResponse.statusText}`);
      }
      
      const itemsData = await itemsResponse.json();
      
      if (!itemsData.items) {
        break;
      }
      
      items.push(...itemsData.items);
      nextPageToken = itemsData.nextPageToken;
    } while (nextPageToken);

    // Extract video IDs and fetch details
    const videoIds = items.map(item => item.contentDetails.videoId);
    const videos = [];
    
    for (const videoId of videoIds) {
      const videoDetails = await fetchVideoDetails(videoId);
      if (videoDetails) {
        videos.push(videoDetails);
      }
    }

    return {
      playlistId: playlist.id,
      playlistTitle: playlist.snippet.title,
      playlistDescription: playlist.snippet.description,
      channelTitle: playlist.snippet.channelTitle,
      videos: videos
    };
  } catch (error) {
    logger.error(`Error fetching playlist details for ${playlistId}:`, error.message);
    return null;
  }
}

/**
 * Process YouTube URLs and extract video/playlist data
 * @param {Array<string>} youtubeUrls - Array of YouTube URLs
 * @returns {Promise<Array>} - Array of video objects
 */
async function processYouTubeUrls(youtubeUrls) {
  logger.info(`🎬 Processing ${youtubeUrls.length} YouTube URLs`);
  
  const allVideos = [];
  const errors = [];

  for (const url of youtubeUrls) {
    try {
      // Check if it's a playlist
      const playlistId = extractPlaylistIdFromUrl(url);
      if (playlistId) {
        logger.info(`📋 Processing playlist: ${playlistId}`);
        const playlistData = await fetchPlaylistDetails(playlistId);
        if (playlistData && playlistData.videos.length > 0) {
          allVideos.push(...playlistData.videos);
          logger.info(`✅ Added ${playlistData.videos.length} videos from playlist`);
        } else {
          errors.push(`Failed to fetch playlist: ${url}`);
        }
        continue;
      }

      // Check if it's a video
      const videoId = extractVideoIdFromUrl(url);
      if (videoId) {
        logger.info(`🎥 Processing video: ${videoId}`);
        const videoData = await fetchVideoDetails(videoId);
        if (videoData) {
          allVideos.push(videoData);
          logger.info(`✅ Added video: ${videoData.videoTitle}`);
        } else {
          errors.push(`Failed to fetch video: ${url}`);
        }
        continue;
      }

      errors.push(`Unrecognized YouTube URL format: ${url}`);
    } catch (error) {
      logger.error(`Error processing YouTube URL ${url}:`, error);
      errors.push(`Error processing ${url}: ${error}`);
    }
  }

  logger.info(`🎬 YouTube processing complete: ${allVideos.length} videos, ${errors.length} errors`);
  return { videos: allVideos, errors };
}

/**
 * Process non-YouTube URLs for written content
 * @param {Array<string>} nonYoutubeUrls - Array of non-YouTube URLs
 * @returns {Promise<Object>} - Processing results
 */
async function processNonYouTubeUrls(nonYoutubeUrls) {
  logger.info(`📝 Processing ${nonYoutubeUrls.length} non-YouTube URLs`);
  
  // Check URL embeddability
  const embeddabilityResults = await urlEmbeddabilityService.checkMultipleUrls(nonYoutubeUrls);
  
  const embeddableUrls = [];
  const nonEmbeddableUrls = [];
  
  embeddabilityResults.forEach((result, index) => {
    const urlData = {
      url: nonYoutubeUrls[index],
      embeddabilityResult: result,
      isEmbeddable: result.embeddable === true
    };
    
    if (result.embeddable === true) {
      embeddableUrls.push(urlData);
    } else {
      nonEmbeddableUrls.push(urlData);
      logger.warn(`⚠️ URL not embeddable: ${nonYoutubeUrls[index]} - ${result.reason}`);
    }
  });

  logger.info(`📝 Non-YouTube processing complete: ${embeddableUrls.length} embeddable, ${nonEmbeddableUrls.length} non-embeddable`);
  
  return {
    embeddableUrls,
    nonEmbeddableUrls,
    allUrls: [...embeddableUrls, ...nonEmbeddableUrls]
  };
}

/**
 * Create or update course builder draft
 * @param {Object} payload - Course builder payload
 * @returns {Promise<Object>} - Created or updated course builder
 */
async function createOrUpdateCourseBuilder(payload) {
  const { courseBuilderId, userId, orgId, status, courseBuilderData } = payload || {};
  
  logger.info("Processing create or update course builder request", {
    courseBuilderId,
    userId,
    orgId,
    status,
    hasPayload: !!payload,
    hasData: !!courseBuilderData
  });

  try {
    let courseBuilder;
    let operation;

    if (courseBuilderId) {
      // Update existing course builder
      courseBuilder = await db.CourseBuilder.findOne({
        where: { courseBuilderId }
      });

      if (!courseBuilder) {
        throw new Error('Course builder not found');
      }

      // Update the course builder
      await courseBuilder.update({
        status: status || courseBuilder.status,
        courseBuilderData: courseBuilderData || courseBuilder.courseBuilderData,
        orgId: orgId !== undefined ? orgId : courseBuilder.orgId
      });

      operation = 'update';
      logger.info(`Course builder ${courseBuilderId} updated successfully`);
    } else {
      // Create new course builder
      if (!userId) {
        throw new Error('User ID is required for creating course builder');
      }

      courseBuilder = await db.CourseBuilder.create({
        userId,
        orgId: orgId || null,
        status: status || 'DRAFT',
        courseBuilderData: courseBuilderData || {}
      });

      operation = 'create';
      logger.info(`Course builder ${courseBuilder.courseBuilderId} created successfully`);
    }

    return {
      operation,
      data: courseBuilder
    };

  } catch (error) {
    logger.error("Error in createOrUpdateCourseBuilder:", error.message);
    throw error;
  }
}

/**
 * Get course builder by ID
 * @param {number} courseBuilderId - Course builder ID
 * @param {number} userId - User ID for access control
 * @returns {Promise<Object>} - Course builder data
 */
async function getCourseBuilder(courseBuilderId, userId) {
  try {
    logger.info(`Fetching course builder ${courseBuilderId} for user ${userId}`);

    const courseBuilder = await db.CourseBuilder.findOne({
      where: { 
        courseBuilderId,
        userId // Ensure user can only access their own course builders
      }
    });

    if (!courseBuilder) {
      throw new Error('Course builder not found or access denied');
    }

    return courseBuilder;
  } catch (error) {
    logger.error(`Error fetching course builder ${courseBuilderId}:`, error.message);
    throw error;
  }
}

/**
 * Get all course builders for a user
 * @param {number} userId - User ID
 * @param {Object} filters - Optional filters (orgId, status)
 * @returns {Promise<Array>} - Array of course builders
 */
async function getUserCourseBuilders(userId, filters = {}) {
  try {
    logger.info(`Fetching course builders for user ${userId}`, filters);

    const whereClause = { userId };
    
    if (filters.orgId) {
      whereClause.orgId = filters.orgId;
    }
    
    if (filters.status) {
      whereClause.status = filters.status;
    }

    const courseBuilders = await db.CourseBuilder.findAll({
      where: whereClause,
      order: [['course_builder_updated_at', 'DESC']]
    });

    return courseBuilders;
  } catch (error) {
    logger.error(`Error fetching course builders for user ${userId}:`, error.message);
    throw error;
  }
}

/**
 * Delete course builder
 * @param {number} courseBuilderId - Course builder ID
 * @param {number} userId - User ID for access control
 * @returns {Promise<boolean>} - Success status
 */
async function deleteCourseBuilder(courseBuilderId, userId) {
  try {
    logger.info(`Deleting course builder ${courseBuilderId} for user ${userId}`);

    const result = await db.CourseBuilder.destroy({
      where: { 
        courseBuilderId,
        userId // Ensure user can only delete their own course builders
      }
    });

    if (result === 0) {
      throw new Error('Course builder not found or access denied');
    }

    logger.info(`Course builder ${courseBuilderId} deleted successfully`);
    return true;
  } catch (error) {
    logger.error(`Error deleting course builder ${courseBuilderId}:`, error.message);
    throw error;
  }
}

/**
 * Process URLs from course builder data and preview content
 * @param {number} courseBuilderId - Course builder ID
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - URL processing results
 */
async function previewCourseBuilderContent(courseBuilderId, userId) {
  try {
    logger.info(`Previewing content for course builder ${courseBuilderId}`);

    // Get course builder
    const courseBuilder = await getCourseBuilder(courseBuilderId, userId);
    
    if (!courseBuilder.courseBuilderData || !courseBuilder.courseBuilderData.contentUrlsList) {
      throw new Error('No content URLs found in course builder data');
    }

    const { contentUrlsList } = courseBuilder.courseBuilderData;

    if (!Array.isArray(contentUrlsList) || contentUrlsList.length === 0) {
      throw new Error('Content URLs list is empty or invalid');
    }

    // Separate YouTube URLs from non-YouTube URLs
    const youtubeUrls = [];
    const nonYoutubeUrls = [];

    contentUrlsList.forEach((url) => {
      if (isYouTubeUrl(url)) {
        youtubeUrls.push(url);
      } else {
        nonYoutubeUrls.push(url);
      }
    });

    logger.info(`📊 URL Classification for builder ${courseBuilderId}:`);
    logger.info(`   - YouTube URLs: ${youtubeUrls.length}`);
    logger.info(`   - Non-YouTube URLs: ${nonYoutubeUrls.length}`);

    // Process YouTube URLs
    let youtubeResult = { videos: [], errors: [] };
    if (youtubeUrls.length > 0) {
      logger.info("🎬 Processing YouTube URLs for preview...");
      youtubeResult = await processYouTubeUrls(youtubeUrls);
    }

    // Process non-YouTube URLs
    let nonYoutubeResult = { allUrls: [] };
    if (nonYoutubeUrls.length > 0) {
      logger.info("📝 Processing non-YouTube URLs for preview...");
      nonYoutubeResult = await processNonYouTubeUrls(nonYoutubeUrls);
    }

    const previewData = {
      courseBuilderId,
      urlAnalysis: {
        totalUrls: contentUrlsList.length,
        youtubeUrls: youtubeUrls.length,
        nonYoutubeUrls: nonYoutubeUrls.length
      },
      youtubeContent: {
        videosFound: youtubeResult.videos.length,
        totalDuration: youtubeResult.videos.reduce((sum, video) => sum + video.duration, 0),
        videos: youtubeResult.videos.map(video => ({
          videoTitle: video.videoTitle,
          videoId: video.videoId,
          duration: video.duration,
          channelTitle: video.channelTitle
        })),
        errors: youtubeResult.errors
      },
      writtenContent: {
        totalUrls: nonYoutubeResult.allUrls?.length || 0,
        embeddableUrls: nonYoutubeResult.embeddableUrls?.length || 0,
        nonEmbeddableUrls: nonYoutubeResult.nonEmbeddableUrls?.length || 0,
        urls: nonYoutubeResult.allUrls?.map(urlData => ({
          url: urlData.url,
          isEmbeddable: urlData.isEmbeddable,
          reason: urlData.embeddabilityResult?.reason
        })) || []
      }
    };

    return previewData;
  } catch (error) {
    logger.error(`Error previewing course builder content:`, error.message);
    throw error;
  }
}

/**
 * Process URLs and prepare course data (does not save course to database)
 * @param {Object} payload - Contains userId, orgId, courseBuilderData
 * @returns {Promise<Object>} - Processed course data structure
 */
async function processUrlsAndCreateCourse(payload) {
  try {
    const { userId, orgId, courseBuilderData } = payload;
    const { courseTitle, courseDescription, contentUrlsList } = courseBuilderData;

    logger.info(`Processing URLs and preparing course data for user ${userId}`);

    // Validate required fields
    if (!courseTitle || !courseDescription || !contentUrlsList || !Array.isArray(contentUrlsList) || contentUrlsList.length === 0) {
      throw new Error('Missing required course data: courseTitle, courseDescription, or contentUrlsList');
    }

    // Separate YouTube URLs from non-YouTube URLs
    const youtubeUrls = [];
    const nonYoutubeUrls = [];

    contentUrlsList.forEach((url) => {
      if (isYouTubeUrl(url)) {
        youtubeUrls.push(url);
      } else {
        nonYoutubeUrls.push(url);
      }
    });

    logger.info(`📊 URL Classification for processing:`);
    logger.info(`   - YouTube URLs: ${youtubeUrls.length}`);
    logger.info(`   - Non-YouTube URLs: ${nonYoutubeUrls.length}`);

    // Process YouTube URLs
    let youtubeResult = { videos: [], errors: [] };
    if (youtubeUrls.length > 0) {
      logger.info("🎬 Processing YouTube URLs...");
      youtubeResult = await processYouTubeUrls(youtubeUrls);
    }

    // Process non-YouTube URLs
    let nonYoutubeResult = { allUrls: [] };
    if (nonYoutubeUrls.length > 0) {
      logger.info("📝 Processing non-YouTube URLs...");
      nonYoutubeResult = await processNonYouTubeUrls(nonYoutubeUrls);
    }

    // Check if we have any content to create
    if (youtubeResult.videos.length === 0 && nonYoutubeResult.allUrls.length === 0) {
      throw new Error("No valid content found in the provided URLs");
    }

    // Prepare course data structure (not saving to DB)
    logger.info("💾 Preparing course data structure...");
    let finalCourseTitle = courseTitle.trim();
    
    // Calculate total duration from YouTube videos
    const totalDuration = youtubeResult.videos.reduce((sum, video) => sum + video.duration, 0);
    
    // Determine course source and image
    const courseImageUrl = youtubeResult.videos.length > 0 
      ? youtubeResult.videos[0].thumbnailUrl 
      : null;
    
    const courseSourceChannel = youtubeResult.videos.length > 0 
      ? youtubeResult.videos[0].channelTitle 
      : nonYoutubeResult.allUrls.length > 0 
        ? "External Sources" 
        : "Mixed Sources";

    // Prepare course structure (mirrors Course table)
    const courseData = {
      courseId: 'temp_course_id', // Temporary ID - will be actual ID when saved
      userId: userId,
      orgId: orgId || null,
      courseTitle: finalCourseTitle,
      courseDescription: courseDescription.trim(),
      courseDuration: totalDuration,
      courseImageUrl: courseImageUrl,
      courseSourceChannel: courseSourceChannel,
      courseType: "BYOC",
      deliveryMode: 'ONLINE',
      status: 'PUBLISHED',
      isActive: true,
      isPublic: false,
      metadata: {
        createdFrom: "CourseBuilderDirect",
        urlCount: contentUrlsList.length,
        youtubeUrlCount: youtubeUrls.length,
        nonYoutubeUrlCount: nonYoutubeUrls.length,
        coursePlatform: youtubeUrls.length > 0 && nonYoutubeUrls.length > 0 ? "MIXED" : 
                       youtubeUrls.length > 0 ? "YOUTUBE" : "EXTERNAL",
        courseType: youtubeUrls.length > 0 && nonYoutubeUrls.length > 0 ? "MIXED_CONTENT" :
                   youtubeUrls.length > 0 ? "YOUTUBE_CONTENT" : "WRITTEN_CONTENT",
        courseDifficulty: "BEGINNER",
        isPublic: false,
        createdAt: new Date().toISOString()
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    logger.info(`✅ Course data structure prepared: ${finalCourseTitle}`);

    // Prepare course content data structures
    const courseContentData = [];
    let currentSequence = 1;

    // Prepare YouTube content data
    if (youtubeResult.videos.length > 0) {
      const youtubeContentData = prepareYouTubeContentData(courseData, youtubeResult.videos, currentSequence);
      courseContentData.push(...youtubeContentData);
      currentSequence += youtubeResult.videos.length;
    }

    // Prepare written content data
    if (nonYoutubeResult.allUrls.length > 0) {
      const writtenContentData = prepareWrittenContentData(courseData, nonYoutubeResult.allUrls, currentSequence);
      courseContentData.push(...writtenContentData);
    }

    logger.info("✅ Course data processing completed without database saves");

    // Prepare simplified response structure
    const courseDetail = {
      ...courseData,
      courseContent: courseContentData.map(item => ({
        ...item.courseContent,
        courseContentTypeDetails: item.type === 'youtube' ? item.courseVideo : item.courseWritten
      }))
    };

    return courseDetail;

  } catch (error) {
    logger.error(`❌ Error processing URLs and preparing course data:`, error.message);
    throw error;
  }
}

/**
 * Helper function to prepare YouTube content data (not saving to database)
 */
function prepareYouTubeContentData(courseData, videos, startSequence = 1) {
  logger.info(`🎬 Preparing YouTube content data for ${videos.length} videos`);
  
  const contentItems = [];
  
  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    const sequence = startSequence + i;
    const tempContentId = `temp_content_${sequence}`; // Temporary ID for relationship
    
    // Prepare course content structure (mirrors CourseContent table)
    const courseContentData = {
      courseContentId: tempContentId,
      courseId: 'temp_course_id', // Will be assigned when course is actually created
      courseContentTitle: video.videoTitle,
      courseContentCategory: "Video Content",
      courseContentType: "CourseVideo",
      courseContentSequence: sequence,
      coursecontentIsLicensed: false,
      courseContentDuration: video.duration,
      isPublished: true,
      status: 'PUBLISHED',
      metadata: {
        videoId: video.videoId,
        contentType: "YOUTUBE_VIDEO",
        sequence: sequence
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Prepare course video structure (mirrors CourseVideo table)
    const courseVideoData = {
      courseVideoId: `temp_video_${sequence}`, // Temporary ID
      userId: courseData.userId,
      courseId: 'temp_course_id', // Will be assigned when course is actually created
      courseContentId: tempContentId, // Reference to course content
      courseVideoTitle: video.videoTitle,
      courseVideoDescription: video.videoDescription || '',
      courseVideoUrl: video.videoUrl,
      duration: video.duration,
      thumbnailUrl: video.thumbnailUrl,
      isPreview: false,
      status: "READY",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    contentItems.push({
      courseContent: courseContentData,
      courseVideo: courseVideoData,
      type: 'youtube',
      sequence: sequence,
      contentType: 'CourseVideo'
    });
    
    logger.info(`✅ Prepared YouTube content ${sequence}: ${video.videoTitle}`);
  }
  
  return contentItems;
}

/**
 * Helper function to prepare written content data (not saving to database)
 */
function prepareWrittenContentData(courseData, urlData, startSequence = 1) {
  logger.info(`📝 Preparing written content data for ${urlData.length} URLs`);
  
  const contentItems = [];
  
  for (let i = 0; i < urlData.length; i++) {
    const data = urlData[i];
    const sequence = startSequence + i;
    const tempContentId = `temp_content_${sequence}`; // Temporary ID for relationship
    
    // Prepare course content structure (mirrors CourseContent table)
    const courseContentData = {
      courseContentId: tempContentId,
      courseId: 'temp_course_id', // Will be assigned when course is actually created
      courseContentTitle: `Written Content ${sequence}: ${data.url}`,
      courseContentCategory: "Written Content",
      courseContentType: "CourseWritten",
      courseContentSequence: sequence,
      coursecontentIsLicensed: false,
      courseContentDuration: 0,
      isPublished: true,
      status: 'PUBLISHED',
      metadata: {
        contentType: "EXTERNAL_URL",
        embeddabilityCheck: data.embeddabilityResult,
        sequence: sequence,
        isEmbeddable: data.isEmbeddable
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Create different content based on embeddability
    let courseWrittenContent;
    if (data.isEmbeddable) {
      courseWrittenContent = `<iframe src="${data.url}" width="100%" height="600px" frameborder="0"></iframe>`;
    } else {
      courseWrittenContent = `
        <div style="padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px; background-color: #f9f9f9;">
          <h3>External Resource</h3>
          <p><strong>Note:</strong> This content cannot be embedded directly due to security restrictions.</p>
          <p><strong>Reason:</strong> ${data.embeddabilityResult.reason || 'Content security policy restrictions'}</p>
          <p>Please click the link below to access the content in a new tab:</p>
          <a href="${data.url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 3px; margin-top: 10px;">
            Open Content in New Tab
          </a>
          <br><br>
          <small><strong>URL:</strong> ${data.url}</small>
        </div>
      `;
    }

    // Prepare course written structure (mirrors CourseWritten table)
    const courseWrittenData = {
      courseWrittenId: `temp_written_${sequence}`, // Temporary ID
      userId: courseData.userId,
      courseId: 'temp_course_id', // Will be assigned when course is actually created
      courseContentId: tempContentId, // Reference to course content
      courseWrittenTitle: `Written Content ${sequence}`,
      courseWrittenContent: courseWrittenContent,
      courseWrittenEmbedUrl: data.url,
      courseWrittenUrlIsEmbeddable: data.isEmbeddable,
      metadata: {
        originalUrl: data.url,
        embeddabilityCheck: data.embeddabilityResult,
        createdAt: new Date().toISOString(),
        isEmbeddable: data.isEmbeddable
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    contentItems.push({
      courseContent: courseContentData,
      courseWritten: courseWrittenData,
      type: 'written',
      sequence: sequence,
      contentType: 'CourseWritten'
    });
    
    const embeddableStatus = data.isEmbeddable ? '✅' : '⚠️';
    logger.info(`${embeddableStatus} Prepared written content ${sequence}: ${data.url}`);
  }
  
  return contentItems;
}

module.exports = {
  // Course Builder CRUD operations
  createOrUpdateCourseBuilder,
  getCourseBuilder,
  getUserCourseBuilders,
  deleteCourseBuilder,
  
  // URL Processing and Course Creation
  processUrlsAndCreateCourse,
  previewCourseBuilderContent,
  
  // Utility functions
  isYouTubeUrl,
  extractVideoIdFromUrl,
  extractPlaylistIdFromUrl,
  processYouTubeUrls,
  processNonYouTubeUrls
};
