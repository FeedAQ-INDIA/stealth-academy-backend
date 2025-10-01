const db = require("../entity/index.js");
const logger = require("../config/winston.config.js");
const urlEmbeddabilityService = require("./UrlEmbeddability.service.js");

/**
 * NOTE: This file has been refactored for simplicity & reduced duplication.
 * Public API (exported functions) remains unchanged.
 * Key improvements:
 *  - Central helpers (timestamps, URL classification, batching video API calls)
 *  - Reduced repetition in preview & processing flows
 *  - Playlist video fetch now batched for fewer API calls
 *  - Clear, smaller focused utilities
 */

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
  if (typeof duration !== 'string') return 0;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const [, h, m, s] = match;
  return (parseInt(h) || 0) * 3600 + (parseInt(m) || 0) * 60 + (parseInt(s) || 0);
}

/** Generate a standard timestamp bundle */
function buildTimestampBundle(date = new Date()) {
  const iso = date.toISOString();
  return {
    iso,
    date: iso.substring(0, 10),
    time: iso.substring(11, 19)
  };
}

/** Classify URLs into YouTube vs non-YouTube */
function classifyUrls(urls = []) {
  const youtube = [];
  const external = [];
  for (const u of urls) (isYouTubeUrl(u) ? youtube : external).push(u);
  return { youtube, external };
}

// Removed detailed video fetching per simplification requirement

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
    /**
     * Simplified implementation per requirement:
     *  - Only ONE YouTube Data API endpoint is used: playlistItems
     *  - We DO NOT call `playlists` (for metadata) or `videos` (for detailed video data / duration)
     *  - Duration / processing status / privacy status will NOT be available (set to 0 / omitted)
     *  - This trades completeness for fewer quota units & simplified logic.
     */

    const items = [];
    let nextPageToken = '';
    do {
      const itemsUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
      const itemsResponse = await fetch(itemsUrl);
      if (!itemsResponse.ok) {
        throw new Error(`YouTube API error: ${itemsResponse.status} ${itemsResponse.statusText}`);
      }
      const itemsData = await itemsResponse.json();
      if (!itemsData.items) break;
      items.push(...itemsData.items);
      nextPageToken = itemsData.nextPageToken;
    } while (nextPageToken);

    if (items.length === 0) {
      logger.warn(`Playlist empty or inaccessible: ${playlistId}`);
      return null;
    }

    // Collect video IDs then fetch details (durations etc.)
    const videoIds = items
      .map(it => it?.contentDetails?.videoId)
      .filter(Boolean);

    let detailsMap = {};
    if (videoIds.length) {
      try {
        const details = await fetchVideoDetails(videoIds);
        detailsMap = details.reduce((acc, d) => { acc[d.videoId] = d; return acc; }, {});
      } catch (e) {
        logger.warn(`Failed to enrich playlist videos with durations: ${e.message}`);
      }
    }

    // Derive minimal playlist-level metadata from first item
    const first = items[0];
    const playlistTitle = first?.snippet?.playlistId ? `Playlist ${playlistId}` : (first?.snippet?.channelTitle || 'YouTube Playlist');

    const videos = items
      .filter(it => it?.contentDetails?.videoId && it?.snippet)
      .map(it => {
        const vid = it.contentDetails.videoId;
        const sn = it.snippet;
        const thumbs = sn.thumbnails || {};
        const thumb = thumbs.high?.url || thumbs.standard?.url || thumbs.maxres?.url || thumbs.medium?.url || thumbs.default?.url || null;
        const enriched = detailsMap[vid] || {};
        return {
          videoId: vid,
          videoTitle: enriched.videoTitle || sn.title || 'Untitled Video',
          videoDescription: enriched.videoDescription || sn.description || '',
          videoUrl: `https://www.youtube.com/watch?v=${vid}`,
          duration: typeof enriched.duration === 'number' ? enriched.duration : 0,
          thumbnailUrl: enriched.thumbnailUrl || thumb,
          channelTitle: enriched.channelTitle || sn.videoOwnerChannelTitle || sn.channelTitle || null,
          publishedAt: enriched.publishedAt || it.contentDetails?.videoPublishedAt || sn.publishedAt || null
        };
      })
      .filter(v => v.videoTitle && v.videoTitle.toLowerCase() !== 'deleted video');

    return {
      playlistId,
      playlistTitle: playlistTitle,
      playlistDescription: null,
      channelTitle: first?.snippet?.channelTitle || null,
      videos
    };
  } catch (error) {
    logger.error(`Error fetching playlist details for ${playlistId}:`, error.message);
    return null;
  }
}

/**
 * Fetch details (duration, title, etc.) for multiple video IDs using a single or batched YouTube API call
 * @param {string[]} videoIds
 * @returns {Promise<Array<{videoId:string,duration:number,videoTitle:string,videoDescription:string,thumbnailUrl:string,channelTitle:string,publishedAt:string}>>}
 */
async function fetchVideoDetails(videoIds = []) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('YOUTUBE_API_KEY not configured');
  const uniqueIds = [...new Set(videoIds.filter(Boolean))];
  if (!uniqueIds.length) return [];

  const results = [];
  // API supports up to 50 IDs per request
  for (let i = 0; i < uniqueIds.length; i += 50) {
    const batch = uniqueIds.slice(i, i + 50);
    const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${batch.join(',')}&key=${apiKey}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = await res.json();
      (data.items || []).forEach(item => {
        const vid = item.id;
        const durationIso = item.contentDetails?.duration;
        const durationSecs = parseISO8601Duration(durationIso);
        const sn = item.snippet || {};
        const thumbs = sn.thumbnails || {};
        const thumb = thumbs.maxres?.url || thumbs.standard?.url || thumbs.high?.url || thumbs.medium?.url || thumbs.default?.url || null;
        results.push({
          videoId: vid,
            duration: durationSecs,
          videoTitle: sn.title || `Video ${vid}`,
          videoDescription: sn.description || '',
          thumbnailUrl: thumb,
          channelTitle: sn.channelTitle || null,
          publishedAt: sn.publishedAt || null
        });
      });
    } catch (e) {
      logger.warn(`Failed to fetch video details batch: ${e.message}`);
    }
  }
  return results;
}

/**
 * Process YouTube URLs and extract video/playlist data
 * @param {Array<string>} youtubeUrls - Array of YouTube URLs
 * @returns {Promise<Array>} - Array of video objects
 */
async function processYouTubeUrls(youtubeUrls) {
  logger.info(`🎬 Processing ${youtubeUrls.length} YouTube URLs`);
  if (!Array.isArray(youtubeUrls) || youtubeUrls.length === 0) return { videos: [], errors: [] };

  const videos = [];
  const errors = [];
  const singleVideoIds = [];

  for (const url of youtubeUrls) {
    const playlistId = extractPlaylistIdFromUrl(url);
    if (playlistId) {
      try {
        const data = await fetchPlaylistDetails(playlistId);
        if (data?.videos?.length) videos.push(...data.videos);
        else errors.push(`Empty playlist: ${url}`);
      } catch (e) {
        errors.push(`Playlist error: ${e.message}`);
      }
      continue;
    }
    const videoId = extractVideoIdFromUrl(url);
    if (videoId) {
      // Placeholder; will enrich after collecting all single IDs
      videos.push({
        videoId,
        videoTitle: `Video ${videoId}`,
        videoDescription: '',
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        duration: 0,
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        channelTitle: null,
        publishedAt: null,
        _needsEnrich: true
      });
      singleVideoIds.push(videoId);
    } else {
      errors.push(`Unrecognized URL: ${url}`);
    }
  }

  // Enrich single video placeholders with real details (durations etc.)
  if (singleVideoIds.length) {
    try {
      const details = await fetchVideoDetails(singleVideoIds);
      const detailsMap = details.reduce((acc, d) => { acc[d.videoId] = d; return acc; }, {});
      videos.forEach(v => {
        if (v._needsEnrich && detailsMap[v.videoId]) {
          const d = detailsMap[v.videoId];
          v.videoTitle = d.videoTitle || v.videoTitle;
          v.videoDescription = d.videoDescription || v.videoDescription;
          v.duration = typeof d.duration === 'number' ? d.duration : v.duration;
          v.thumbnailUrl = d.thumbnailUrl || v.thumbnailUrl;
          v.channelTitle = d.channelTitle || v.channelTitle;
          v.publishedAt = d.publishedAt || v.publishedAt;
          delete v._needsEnrich;
        }
      });
    } catch (e) {
      logger.warn(`Failed to enrich single video details: ${e.message}`);
    }
  }

  logger.info(`🎬 YouTube processing complete: ${videos.length} videos (simplified), ${errors.length} errors`);
  return { videos, errors };
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
  if (!Array.isArray(contentUrlsList) || contentUrlsList.length === 0) throw new Error('Content URLs list is empty or invalid');

  const { youtube: youtubeUrls, external: nonYoutubeUrls } = classifyUrls(contentUrlsList);

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

    // Build entity-like preview arrays (not persisted) to mirror CourseVideo / CourseWritten
  const ts = buildTimestampBundle();
    const courseVideoPreviews = youtubeResult.videos.map((v, idx) => ({
      courseVideoId: `temp_preview_video_${idx + 1}`,
      courseId: 'temp_course_id',
      courseContentId: null,
      userId: userId,
      courseVideoTitle: v.videoTitle,
      courseVideoDescription: v.videoDescription || '',
      courseVideoUrl: v.videoUrl,
      duration: v.duration,
      thumbnailUrl: v.thumbnailUrl,
      metadata: {
        videoId: v.videoId,
        channelTitle: v.channelTitle,
        publishedAt: v.publishedAt,
        sourcePlatform: 'YOUTUBE',
        preview: true
      },
  v_created_date: ts.date,
  v_created_time: ts.time,
  v_updated_date: ts.date,
  v_updated_time: ts.time
    }));

    const courseWrittenPreviews = (nonYoutubeResult.allUrls || []).map((d, idx) => ({
      courseWrittenId: `temp_preview_written_${idx + 1}`,
      userId: userId,
      courseId: 'temp_course_id',
      courseContentId: null,
      courseWrittenTitle: `External Resource ${idx + 1}`,
      courseWrittenContent: d.isEmbeddable ? `<iframe src="${d.url}" width="100%" height="400" frameborder="0"></iframe>` : null,
      courseWrittenEmbedUrl: d.url,
      courseWrittenUrlIsEmbeddable: d.isEmbeddable,
      metadata: {
        originalUrl: d.url,
        embeddabilityCheck: d.embeddabilityResult,
        isEmbeddable: d.isEmbeddable,
        sourcePlatform: 'EXTERNAL',
        preview: true
      },
      v_created_date: ts.date,
      v_created_time: ts.time,
      v_updated_date: ts.date,
      v_updated_time: ts.time
    }));

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
      },
      // Entity-shaped preview lists
      courseVideoPreviews,
      courseWrittenPreviews,
  _meta: { entityShape: true, preview: true, generatedAt: ts.iso }
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
  const { userId, orgId, courseBuilderData, courseBuilderId, status: overrideStatus } = payload;
  const { courseTitle, courseDescription, contentUrlsList } = courseBuilderData || {};

    logger.info(`Processing URLs and preparing course data for user ${userId}`);

    // Validate required fields
    if (!courseTitle || !courseDescription || !contentUrlsList || !Array.isArray(contentUrlsList) || contentUrlsList.length === 0) {
      throw new Error('Missing required course data: courseTitle, courseDescription, or contentUrlsList');
    }

  const { youtube: youtubeUrls, external: nonYoutubeUrls } = classifyUrls(contentUrlsList);

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

    // Prepare course data structure (not saving to DB) in entity shape
    logger.info("💾 Preparing course data structure (entity shape)...");
    let finalCourseTitle = courseTitle.trim();

    // Calculate total duration from YouTube videos
    const totalDuration = youtubeResult.videos.reduce((sum, video) => sum + video.duration, 0);

    // Derive representative thumbnail / image
    const courseImageUrl = youtubeResult.videos[0]?.thumbnailUrl || null;

    const derivedPlatform = youtubeUrls.length > 0 && nonYoutubeUrls.length > 0
      ? "MIXED"
      : youtubeUrls.length > 0 ? "YOUTUBE" : "EXTERNAL";
    const derivedContentType = youtubeUrls.length > 0 && nonYoutubeUrls.length > 0
      ? "MIXED_CONTENT"
      : youtubeUrls.length > 0 ? "YOUTUBE_CONTENT" : "WRITTEN_CONTENT";

    // Entity-aligned course object (simulated unsaved entity)
  const ts = buildTimestampBundle();
    const courseData = {
      // Core entity fields
      courseId: 'temp_course_id', // placeholder until persisted
      userId: userId,
      orgId: orgId || null,
      courseTitle: finalCourseTitle,
      courseDescription: courseDescription.trim(),
      courseImageUrl: courseImageUrl,
      courseDuration: totalDuration,
      courseValidity: null, // not derived here
      courseType: 'BYOC',
      deliveryMode: 'ONLINE',
      status: overrideStatus || 'DRAFT', // keep DRAFT until explicitly published
      metadata: {
        // createdFrom: 'CourseBuilderDirect',
        // urlCount: contentUrlsList.length,
        // youtubeUrlCount: youtubeUrls.length,
        // nonYoutubeUrlCount: nonYoutubeUrls.length,
        // coursePlatform: derivedPlatform,
        // courseContentComposition: derivedContentType,
        // courseDifficulty: 'BEGINNER',
        // temporary: true,
        // Non-entity fields moved into metadata to avoid polluting entity contract
  //       preview: {
  //         sourceMix: {
  //           youtube: youtubeUrls.length,
  //           external: nonYoutubeUrls.length
  //         }
  //       },
  // createdAt: ts.iso,
  // updatedAt: ts.iso
      },
      // Virtual-like placeholders (client may expect these when mirroring entity)
  v_created_date: ts.date,
  v_created_time: ts.time,
  v_updated_date: ts.date,
  v_updated_time: ts.time
    };

    logger.info(`✅ Course data structure prepared (entity shape): ${finalCourseTitle}`);

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

    // Derive courseSourceChannel (first video channelTitle or External Sources)
    const courseSourceChannel = youtubeResult.videos[0]?.channelTitle || (nonYoutubeResult.allUrls.length ? 'External Sources' : 'Mixed Sources');

    // Build courseContent array in requested simplified shape
    // New shapedCourseContent structure:
    // Each item is the full courseContent entity data plus a courseContentTypeDetail object
    // containing the related content entity (courseVideo, courseWritten, courseFlashcard, courseQuiz, etc.)
    const shapedCourseContent = courseContentData.map(item => {
      const contentEntity = { ...item.courseContent };
      let contentTypeDetail = {};
      switch (item.type) {
        case 'youtube':
          contentTypeDetail = { ...item.courseVideo };
          break;
        case 'written':
          contentTypeDetail = { ...item.courseWritten };
          break;
        case 'flashcard': // future support placeholder
          if (item.courseFlashcard) contentTypeDetail = { ...item.courseFlashcard };
          break;
        case 'quiz': // future support placeholder
          if (item.courseQuiz) contentTypeDetail = { ...item.courseQuiz };
          break;
        default:
          contentTypeDetail = {};
      }
      return {
        ...contentEntity,
        courseContentTypeDetail: contentTypeDetail
      };
    });

    const courseDetail = {
      orgId: orgId || null,
      status: courseData.status,
      userId: userId,
      courseId: courseData.courseId,
      isActive: true,
      isPublic: false,
      metadata: {
        isPublic: false,
        urlCount: courseData.metadata.urlCount,
        createdAt: courseData.metadata.createdAt,
        courseType: courseData.metadata.courseContentComposition, // semantic content type
        createdFrom: courseData.metadata.createdFrom,
        coursePlatform: courseData.metadata.coursePlatform,
        youtubeUrlCount: courseData.metadata.youtubeUrlCount,
        courseDifficulty: courseData.metadata.courseDifficulty,
        nonYoutubeUrlCount: courseData.metadata.nonYoutubeUrlCount
      },
      createdAt: courseData.metadata.createdAt,
      updatedAt: courseData.metadata.updatedAt,
      courseType: courseData.courseType,
      courseTitle: courseData.courseTitle,
      deliveryMode: courseData.deliveryMode,
      courseContent: shapedCourseContent,
      courseDuration: courseData.courseDuration,
      courseImageUrl: courseData.courseImageUrl,
      courseDescription: courseData.courseDescription,
      courseSourceChannel: courseSourceChannel
    };

  const finalResponse = {
      courseBuilderId: courseBuilderId || null,
      status: courseData.status,
      orgId: orgId || null,
      courseBuilderData: {
        courseTitle: courseData.courseTitle,
    processedAt: ts.iso,
        courseDetail: courseDetail,
        contentUrlsList: contentUrlsList,
        processingStatus: 'COMPLETED',
        courseDescription: courseData.courseDescription
      }
    };

    return finalResponse;

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
      metadata: {
        videoId: video.videoId,
        channelTitle: video.channelTitle,
        publishedAt: video.publishedAt,
        sourcePlatform: 'YOUTUBE'
      },
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
  isEmbeddable: data.isEmbeddable,
  sourcePlatform: 'EXTERNAL'
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
