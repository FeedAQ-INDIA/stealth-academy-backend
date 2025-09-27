const logger = require("../config/winston.config");
const db = require("../entity/index.js");
const { getUserCreditBalance, addCreditTransaction } = require("./CreditService.service.js");
const urlEmbeddabilityService = require("./UrlEmbeddability.service.js");

/**
 * Unified Course Creation Service
 * Handles both YouTube and non-YouTube URL processing for course creation
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
      logger.error(`Error processing YouTube URL ${url}:`, error.message);
      errors.push(`Error processing ${url}: ${error.message}`);
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
 * Create course content and videos from YouTube data
 * @param {Object} course - Course record
 * @param {Array} videos - YouTube video data
 * @param {Object} transaction - Database transaction
 * @returns {Promise<Array>} - Created content and video records
 */
async function createYouTubeContent(course, videos, transaction) {
  logger.info(`🎬 Creating YouTube content for ${videos.length} videos`);
  
  const createdItems = [];
  
  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    const sequence = i + 1;
    
    // Create course content
    const courseContent = await db.CourseContent.create({
      courseId: course.courseId,
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
      }
    }, { transaction });

    // Create course video
    const courseVideo = await db.CourseVideo.create({
      userId: course.userId,
      courseId: course.courseId,
      courseContentId: courseContent.courseContentId,
      courseVideoTitle: video.videoTitle,
      courseVideoDescription: video.videoDescription || '',
      courseVideoUrl: video.videoUrl,
      duration: video.duration,
      thumbnailUrl: video.thumbnailUrl,
      isPreview: false,
      status: "READY"
    }, { transaction });

    createdItems.push({
      content: courseContent,
      video: courseVideo,
      type: 'youtube'
    });
    
    logger.info(`✅ Created YouTube content ${sequence}: ${video.videoTitle}`);
  }
  
  return createdItems;
}

/**
 * Create course content and written entries from non-YouTube URLs
 * @param {Object} course - Course record
 * @param {Array} urlData - Non-YouTube URL data
 * @param {number} startSequence - Starting sequence number
 * @param {Object} transaction - Database transaction
 * @returns {Promise<Array>} - Created content and written records
 */
async function createWrittenContent(course, urlData, startSequence, transaction) {
  logger.info(`📝 Creating written content for ${urlData.length} URLs`);
  
  const createdItems = [];
  
  for (let i = 0; i < urlData.length; i++) {
    const data = urlData[i];
    const sequence = startSequence + i;
    
    // Create course content
    const courseContent = await db.CourseContent.create({
      courseId: course.courseId,
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
      }
    }, { transaction });

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

    // Create course written entry
    const courseWritten = await db.CourseWritten.create({
      userId: course.userId,
      courseId: course.courseId,
      courseContentId: courseContent.courseContentId,
      courseWrittenTitle: `Written Content ${sequence}`,
      courseWrittenDescription: `External content from: ${data.url}`,
      courseWrittenContent: courseWrittenContent,
      courseWrittenEmbedUrl: data.url,
      courseWrittenUrlIsEmbeddable: data.isEmbeddable,
      metadata: {
        originalUrl: data.url,
        embeddabilityCheck: data.embeddabilityResult,
        createdAt: new Date().toISOString(),
        isEmbeddable: data.isEmbeddable
      }
    }, { transaction });

    createdItems.push({
      content: courseContent,
      written: courseWritten,
      type: 'written'
    });
    
    const embeddableStatus = data.isEmbeddable ? '✅' : '⚠️';
    logger.info(`${embeddableStatus} Created written content ${sequence}: ${data.url}`);
  }
  
  return createdItems;
}

/**
 * Main function to create course from URLs
 * Handles both YouTube and non-YouTube URLs
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function createCourseFromUrls(req, res, next) {
  const { contentUrlsList, courseTitle, courseDescription } = req.body;
  let transaction;

  try {
    // Validate required fields
    if (!contentUrlsList || !Array.isArray(contentUrlsList) || contentUrlsList.length === 0) {
      return res.status(400).send({
        status: 400,
        message: "contentUrlsList is required and must be a non-empty array",
      });
    }

    if (!courseTitle || typeof courseTitle !== "string" || courseTitle.trim().length === 0) {
      return res.status(400).send({
        status: 400,
        message: "courseTitle is required and must be a non-empty string",
      });
    }

    if (!courseDescription || typeof courseDescription !== "string" || courseDescription.trim().length === 0) {
      return res.status(400).send({
        status: 400,
        message: "courseDescription is required and must be a non-empty string",
      });
    }

    logger.info(`🚀 Creating course from URLs for user: ${req.user.userId}`);
    logger.info(`📚 Course Title: ${courseTitle}`);
    logger.info(`🔗 URLs Count: ${contentUrlsList.length}`);

    // Check user credit balance
    const userBal = await getUserCreditBalance(req.user.userId);
    if (userBal < 30) {
      throw new Error("Insufficient credit balance");
    }

    // Separate YouTube URLs from non-YouTube URLs
    const youtubeUrls = [];
    const nonYoutubeUrls = [];

    contentUrlsList.forEach((url, index) => {
      if (isYouTubeUrl(url)) {
        youtubeUrls.push(url);
      } else {
        nonYoutubeUrls.push(url);
      }
    });

    logger.info(`📊 URL Classification:`);
    logger.info(`   - YouTube URLs: ${youtubeUrls.length}`);
    logger.info(`   - Non-YouTube URLs: ${nonYoutubeUrls.length}`);

    // Start transaction
    transaction = await db.sequelize.transaction();

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

    // Create course record
    logger.info("💾 Creating course record...");
    let finalCourseTitle = courseTitle.trim();
    
    // Check if course title already exists for this user
    const existingCourse = await db.Course.findOne({
      where: {
        courseTitle: finalCourseTitle,
        userId: req.user.userId
      },
      transaction
    });
    
    if (existingCourse) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      finalCourseTitle = `${finalCourseTitle} (${timestamp})`;
    }

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

    const course = await db.Course.create({
      userId: req.user.userId,
      courseTitle: finalCourseTitle,
      courseDescription: courseDescription.trim(),
      courseDuration: totalDuration,
      courseImageUrl: courseImageUrl,
      courseSourceChannel: courseSourceChannel,
      courseType: "BYOC",
      deliveryMode: 'ONLINE',
      status: 'PUBLISHED',
      metadata: {
        createdFrom: "Mixed URLs",
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
      }
    }, { transaction });

    logger.info(`✅ Course created with ID: ${course.courseId}`);

    // Create course content
    const allCreatedContent = [];
    let currentSequence = 1;

    // Create YouTube content first
    if (youtubeResult.videos.length > 0) {
      const youtubeContent = await createYouTubeContent(course, youtubeResult.videos, transaction);
      allCreatedContent.push(...youtubeContent);
      currentSequence += youtubeResult.videos.length;
    }

    // Create written content
    if (nonYoutubeResult.allUrls.length > 0) {
      const writtenContent = await createWrittenContent(course, nonYoutubeResult.allUrls, currentSequence, transaction);
      allCreatedContent.push(...writtenContent);
    }

    // Create course access for the owner
    logger.info("🔐 Creating course access for owner...");
    await db.CourseAccess.create({
      courseId: course.courseId,
      userId: req.user.userId,
      accessLevel: "OWN",
      isActive: true,
      grantedByUserId: req.user.userId,
      metadata: {
        grantedAt: new Date().toISOString(),
        reason: "Course Owner - Auto-granted during course creation",
        source: "createCourseFromUrls"
      }
    }, { transaction });

    // Deduct credits after successful course creation
    await addCreditTransaction({
      userId: req.user.userId,
      transactionType: 'DEBIT',
      referenceType: 'BYOC_COURSE_CREATION',
      amount: 30.00,
      description: `Course created from URLs: ${courseTitle}`,
      metadata: {
        youtubeUrlsCount: youtubeUrls.length,
        nonYoutubeUrlsCount: nonYoutubeUrls.length,
        totalUrlsCount: contentUrlsList.length,
        contentType: youtubeUrls.length > 0 && nonYoutubeUrls.length > 0 ? 'mixed' : 
                    youtubeUrls.length > 0 ? 'youtube' : 'written'
      }
    });

    // Commit transaction
    await transaction.commit();

    logger.info("✅ Course created successfully");

    // Prepare response
    const result = {
      success: true,
      course: {
        courseId: course.courseId,
        courseTitle: course.courseTitle,
        courseDescription: course.courseDescription,
        courseDuration: course.courseDuration,
        courseImageUrl: course.courseImageUrl,
        courseSourceChannel: course.courseSourceChannel,
        status: course.status
      },
      content: {
        totalItems: allCreatedContent.length,
        youtubeVideos: youtubeResult.videos.length,
        writtenContent: nonYoutubeResult.allUrls?.length || 0,
        embeddableUrls: nonYoutubeResult.embeddableUrls?.length || 0,
        nonEmbeddableUrls: nonYoutubeResult.nonEmbeddableUrls?.length || 0
      },
      processing: {
        totalUrlsProcessed: contentUrlsList.length,
        youtubeErrors: youtubeResult.errors,
        nonEmbeddableUrls: nonYoutubeResult.nonEmbeddableUrls || []
      }
    };

    res.status(200).send({
      status: 200,
      message: "Course created successfully from URLs",
      data: result,
    });

  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    
    logger.error(`❌ Error creating course from URLs:`, {
      error: error.message,
      stack: error.stack,
      userId: req.user.userId,
      courseTitle,
      urlsCount: contentUrlsList?.length || 0,
    });

    // Handle specific error types
    if (error.message?.includes("YOUTUBE_API_KEY not configured")) {
      return res.status(500).send({
        status: 500,
        message: "YouTube API is not properly configured. Please contact administrator.",
      });
    }

    if (error.message?.includes("YouTube API error")) {
      return res.status(502).send({
        status: 502,
        message: "Failed to fetch data from YouTube API. Please try again later.",
      });
    }

    if (error.message?.includes("Insufficient credit balance")) {
      return res.status(402).send({
        status: 402,
        message: "Insufficient credit balance. You need at least 30 credits to create a course.",
      });
    }

    if (error.message?.includes("No valid content found")) {
      return res.status(400).send({
        status: 400,
        message: "No valid content found in the provided URLs. Please check your links.",
      });
    }

    // Generic error response
    res.status(500).send({
      status: 500,
      message: error.message || "An error occurred while creating the course from URLs.",
    });

    next(error);
  }
}

module.exports = {
  createCourseFromUrls,
  isYouTubeUrl,
  extractVideoIdFromUrl,
  extractPlaylistIdFromUrl,
  processYouTubeUrls,
  processNonYouTubeUrls
};