const {Op, fn, col, QueryTypes} = require("sequelize");
const db = require("../entity/index.js");
const lodash = require("lodash");
const logger = require("../config/winston.config.js");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const {toJSON} = require("lodash/seq");
const geminiAIService = require("./GeminiAI.service.js");

// Cache for API responses
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryOperation(operation, retries = MAX_RETRIES) {
    for (let i = 0; i < retries; i++) {
        try {
            return await operation();
        } catch (error) {
            if (i === retries - 1) throw error;
            await sleep(RETRY_DELAY * Math.pow(2, i));
        }
    }
}

function validatePlaylistId(playlistId) {
    if (!playlistId || typeof playlistId !== 'string') {
        throw new Error('Invalid playlist ID');
    }
    // YouTube playlist IDs typically start with PL, UU, or FL
    const playlistRegex = /^(PL|UU|FL)[a-zA-Z0-9_-]{16,}$/;
    if (!playlistRegex.test(playlistId)) {
        throw new Error('Invalid YouTube playlist ID format');
    }
}

function validateVideoId(videoId) {
    if (!videoId || typeof videoId !== 'string') {
        throw new Error('Invalid video ID');
    }
    // YouTube video IDs are typically 11 characters
    const videoRegex = /^[a-zA-Z0-9_-]{11}$/;
    if (!videoRegex.test(videoId)) {
        throw new Error('Invalid YouTube video ID format');
    }
}

function extractVideoIdFromUrl(url) {
    if (!url || typeof url !== 'string') {
        return null;
    }
    
    // Handle various YouTube URL formats
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

function extractPlaylistIdFromUrl(url) {
    if (!url || typeof url !== 'string') {
        return null;
    }
    
    // Handle YouTube playlist URL formats
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

function parseContentUrls(contentUrls) {
    const playlistIds = [];
    const videoIds = [];
    const errors = [];
    
    if (!Array.isArray(contentUrls)) {
        throw new Error('contentUrls must be an array');
    }
    
    for (let i = 0; i < contentUrls.length; i++) {
        const url = contentUrls[i];
        
        if (!url || typeof url !== 'string') {
            errors.push(`Invalid URL at index ${i}: must be a string`);
            continue;
        }
        
        // Try to extract playlist ID first
        const playlistId = extractPlaylistIdFromUrl(url);
        if (playlistId) {
            try {
                validatePlaylistId(playlistId);
                if (!playlistIds.includes(playlistId)) {
                    playlistIds.push(playlistId);
                }
                continue;
            } catch (error) {
                errors.push(`Invalid playlist ID at index ${i}: ${error.message}`);
                continue;
            }
        }
        
        // Try to extract video ID
        const videoId = extractVideoIdFromUrl(url);
        if (videoId) {
            try {
                validateVideoId(videoId);
                if (!videoIds.includes(videoId)) {
                    videoIds.push(videoId);
                }
                continue;
            } catch (error) {
                errors.push(`Invalid video ID at index ${i}: ${error.message}`);
                continue;
            }
        }
        
        errors.push(`Unrecognized URL format at index ${i}: ${url}`);
    }
    
    if (errors.length > 0 && playlistIds.length === 0 && videoIds.length === 0) {
        throw new Error(`All URLs failed to parse: ${errors.join('; ')}`);
    }
    
    return { playlistIds, videoIds, errors };
}

async function fetchWithCache(url, ttl = CACHE_TTL) {
    if (cache.has(url)) {
        const cached = cache.get(url);
        if (Date.now() - cached.timestamp < ttl) {
            return cached.data;
        }
        cache.delete(url);
    }

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    
    cache.set(url, {
        data,
        timestamp: Date.now()
    });
    
    return data;
}

async function fetchPlaylistMetadata(playlistId, apiKey) {
    const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${apiKey}`;
    const data = await retryOperation(() => fetchWithCache(url));
    
    if (!data.items?.length) {
        throw new Error('Playlist not found or is private');
    }
    
    return data.items[0];
}

async function fetchPlaylistItems(playlistId, apiKey) {
    const items = [];
    let nextPageToken = '';

    do {
        const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}&pageToken=${nextPageToken}`;
        const data = await retryOperation(() => fetchWithCache(url));
        
        if (!data.items) {
            throw new Error('No items found in playlist');
        }
        
        items.push(...data.items);
        nextPageToken = data.nextPageToken;
    } while (nextPageToken);

    return items;
}

async function fetchVideoDetails(videoIds, apiKey) {
    const chunks = lodash.chunk(videoIds, 50);
    const allData = [];

    for (const chunk of chunks) {
        const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status&id=${chunk.join(',')}&key=${apiKey}`;
        const data = await retryOperation(() => fetchWithCache(url));
        
        if (!data.items) {
            logger.warn(`No video details found for IDs: ${chunk.join(',')}`);
            continue;
        }
        
        // Filter out unavailable videos
        const availableVideos = data.items.filter(video => 
            video.status.uploadStatus === 'processed' && 
            video.status.privacyStatus !== 'private'
        );
        
        allData.push(...availableVideos);
    }

    return allData;
}

async function fetchSingleVideoMetadata(videoId, apiKey) {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status&id=${videoId}&key=${apiKey}`;
    const data = await retryOperation(() => fetchWithCache(url));
    
    if (!data.items?.length) {
        throw new Error('Video not found or is private');
    }
    
    return data.items[0];
}

function parseISO8601Duration(duration) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    const [, hours = 0, minutes = 0, seconds = 0] = match.map(x => parseInt(x) || 0);
    return hours * 3600 + minutes * 60 + seconds;
}

async function importPlaylistToDatabase(req, res) {
    const apiKey = process.env.YOUTUBE_API_KEY || 'AIzaSyB0e1y1sDQmdC3Cm4zjRZIFMh9gAMs02Gg';
    if (!apiKey) {
        return res.status(500).json({
            error: "Configuration Error",
            message: "YouTube API key not configured"
        });
    }

    const { playlistIds, videoIds, contentUrl, courseTitle, courseDescription } = req.body;
    const userId = req.user.userId;
    
    let finalPlaylistIds = playlistIds || [];
    let finalVideoIds = videoIds || [];
    let parseErrors = [];

    // Handle contentUrl parameter - new flexible approach
    if (contentUrl && Array.isArray(contentUrl) && contentUrl.length > 0) {
        try {
            const parseResult = parseContentUrls(contentUrl);
            finalPlaylistIds = [...finalPlaylistIds, ...parseResult.playlistIds];
            finalVideoIds = [...finalVideoIds, ...parseResult.videoIds];
            parseErrors = parseResult.errors;
        } catch (error) {
            return res.status(400).json({
                error: "Invalid Content URLs",
                message: error.message
            });
        }
    }
    
    if (!finalPlaylistIds?.length && !finalVideoIds?.length) {
        return res.status(400).json({
            error: "Invalid Request",
            message: "At least one playlist ID, video ID, or contentUrl is required"
        });
    }

    // Validate that only allowed fields are present in the request
    const allowedFields = ['playlistIds', 'videoIds', 'contentUrl', 'courseTitle', 'courseDescription'];
    const extraFields = Object.keys(req.body).filter(key => !allowedFields.includes(key));
    if (extraFields.length > 0) {
        return res.status(400).json({
            error: "Invalid Request",
            message: `Invalid fields in request: ${extraFields.join(', ')}. Only playlistIds, videoIds, contentUrl, courseTitle, and courseDescription are allowed.`
        });
    }

    let transaction;
    try {
        // Start transaction
        transaction = await db.sequelize.transaction();

        let allPlaylistItems = [];
        let courseThumbnail = '';
        let courseChannelTitle = '';
        
        // Handle playlists
        if (finalPlaylistIds?.length) {
            for (const playlistId of finalPlaylistIds) {
                validatePlaylistId(playlistId);
                const playlistMeta = await fetchPlaylistMetadata(playlistId, apiKey);
                const items = await fetchPlaylistItems(playlistId, apiKey);
                
                // Use the first playlist's thumbnail and channel if not provided
                if (!courseThumbnail) {
                    courseThumbnail = playlistMeta.snippet.thumbnails?.high?.url || playlistMeta.snippet.thumbnails?.default?.url;
                    courseChannelTitle = playlistMeta.snippet.channelTitle;
                }
                
                allPlaylistItems.push(...items);
            }
        }

        // Handle individual videos
        let individualVideos = [];
        if (finalVideoIds?.length) {
            for (const videoId of finalVideoIds) {
                validateVideoId(videoId);
                const videoMeta = await fetchSingleVideoMetadata(videoId, apiKey);
                
                // Use the first video's thumbnail and channel if not provided and no playlists
                if (!courseThumbnail) {
                    courseThumbnail = videoMeta.snippet.thumbnails?.high?.url || videoMeta.snippet.thumbnails?.default?.url;
                    courseChannelTitle = videoMeta.snippet.channelTitle;
                }
                
                individualVideos.push({
                    snippet: videoMeta.snippet,
                    contentDetails: { videoId: videoId },
                    status: videoMeta.status
                });
            }
        }

        // Combine all videos
        const allVideos = [
            ...allPlaylistItems,
            ...individualVideos
        ];

        if (allVideos.length === 0) {
            throw new Error('No videos found in the provided playlists or video IDs');
        }

        // Get details for all videos
        const allVideoIds = allVideos.map(item => 
            item.contentDetails.videoId
        );
        const videoDetails = await fetchVideoDetails(allVideoIds, apiKey);

        // Check if we have any valid videos
        if (!videoDetails.length) {
            throw new Error('No available videos found in the provided sources');
        }

        // Get description from the first playlist or video
        let defaultCourseDescription = 'A course created from YouTube content';
        let defaultCourseTitle = courseTitle || '';
        if (finalPlaylistIds?.length) {
            const firstPlaylist = await fetchPlaylistMetadata(finalPlaylistIds[0], apiKey);
            defaultCourseDescription = firstPlaylist.snippet.description;
            defaultCourseTitle = firstPlaylist.snippet.title || defaultCourseTitle;
        } else if (finalVideoIds?.length) {
            const firstVideo = await fetchSingleVideoMetadata(finalVideoIds[0], apiKey);
            defaultCourseDescription = firstVideo.snippet.description;
            defaultCourseTitle = firstVideo.snippet.title || defaultCourseTitle;
        }

        // Handle potential duplicate course titles by ensuring uniqueness
        let finalCourseTitle = courseTitle || defaultCourseTitle || `YouTube Course ${new Date().toISOString().split('T')[0]}`;
        
        // Check if course title already exists for this user
        const existingCourse = await db.Course.findOne({
            where: {
                courseTitle: finalCourseTitle,
                userId: userId
            }
        });
        
        if (existingCourse) {
            // Append timestamp to make title unique
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            finalCourseTitle = `${finalCourseTitle} (${timestamp})`;
        }

        const course = await db.Course.create({
            userId,
            courseTitle: finalCourseTitle,
            courseDescription: courseDescription || defaultCourseDescription,
            courseIsLocked: false,
            courseImageUrl: courseThumbnail,
            courseDuration: 1, // Temporary value, will be updated with actual duration
            courseSourceChannel: courseChannelTitle,
            courseSourceMode: "YOUTUBE",
            deliveryMode: "ONLINE",
            status: "DRAFT",
            metadata: {
                playlistIds: finalPlaylistIds,
                videoIds: finalVideoIds,
                originalContentUrl: contentUrl,
                parseErrors: parseErrors.length > 0 ? parseErrors : undefined,
                importDate: new Date().toISOString()
            }
        }, { transaction });

        let totalDuration = 0;
        const contentList = [];

        // Process all available videos
        for (const videoDetail of videoDetails) {
            const videoId = videoDetail.id;
            const matchingVideo = allVideos.find(v => v.contentDetails.videoId === videoId);
            
            if (!matchingVideo) continue;
            
            const snippet = matchingVideo.snippet;
            const durationSeconds = parseISO8601Duration(videoDetail.contentDetails.duration);
            totalDuration += durationSeconds;

            const courseContent = {
                userId,
                courseId: course.courseId,
                courseContentTitle: snippet.title,
                courseContentType: "CourseVideo",
                courseSourceMode: "YOUTUBE",
                courseContentSequence: contentList.length + 1,
                coursecontentIsLicensed: false,
                courseContentDuration: durationSeconds,
                isActive: true,
                metadata: {
                    videoId,
                    ...snippet
                }
            };

            contentList.push(courseContent);
        }

        if (contentList.length === 0) {
            throw new Error('No available videos found in the provided sources');
        }

        // Bulk insert course content
        const createdContents = await db.CourseContent.bulkCreate(contentList, {
            transaction,
            returning: true
        });

        // Prepare and insert course videos
        const videoList = createdContents.map(content => {
            const videoId = content.metadata.videoId;
            const videoDetail = videoDetails.find(v => v.id === videoId);
            const matchingVideo = allVideos.find(v => v.contentDetails.videoId === videoId);
            const snippet = matchingVideo.snippet;

            return {
                courseId: course.courseId,
                courseContentId: content.courseContentId,
                userId,
                courseVideoTitle: snippet.title,
                courseVideoDescription: snippet.description || '',
                courseVideoUrl: `https://www.youtube.com/watch?v=${videoId}`,
                duration: parseISO8601Duration(videoDetail.contentDetails.duration),
                thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
                isPreview: false,
                status: "READY"
            };
        });

        // Bulk insert course videos
        await db.CourseVideo.bulkCreate(videoList, { transaction });

        // Update course duration
        await course.update({ courseDuration: totalDuration }, { transaction });

        // Create CourseAccess record for the course owner
        try {
            const courseAccess = await db.CourseAccess.create({
                courseId: course.courseId,
                userId: userId,
                accessLevel: "OWN",
                isActive: true,
                grantedByUserId: userId,
                metadata: {
                    grantedAt: new Date().toISOString(),
                    reason: "Course Owner - Auto-granted during course import",
                    source: "importPlaylistToDatabase"
                }
            }, { transaction });

            logger.info(`CourseAccess created for user ${userId} on course ${course.courseId} with OWN access level`);
        } catch (accessError) {
            logger.error(`Failed to create CourseAccess for user ${userId} on course ${course.courseId}:`, accessError);
            throw new Error(`Failed to grant course access: ${accessError.message}`);
        }

        // All operations successful, commit the transaction
        await transaction.commit();

        // Generate appropriate success message based on what was imported
        let successMessage = 'Successfully imported YouTube content: ';
        const messageParts = [];
        if (finalPlaylistIds?.length) {
            messageParts.push(`${finalPlaylistIds.length} playlist(s)`);
        }
        if (finalVideoIds?.length) {
            messageParts.push(`${finalVideoIds.length} individual video(s)`);
        }
        if (contentUrl?.length) {
            messageParts.push(`from ${contentUrl.length} URL(s)`);
        }
        successMessage += messageParts.join(' and ');
        
        if (parseErrors.length > 0) {
            successMessage += `. Note: ${parseErrors.length} URL(s) had parsing issues but were skipped.`;
        }
        
        logger.info(successMessage);
        
        return res.json({ 
            course,
            courseAccess: {
                message: "Course access granted to owner",
                accessLevel: "OWN",
                userId: userId
            },
            stats: {
                totalVideos: videoList.length,
                totalDuration: totalDuration,
                totalPlaylists: finalPlaylistIds?.length || 0,
                totalIndividualVideos: finalVideoIds?.length || 0,
                totalContentUrls: contentUrl?.length || 0,
                parseErrors: parseErrors.length,
                skippedVideos: allVideos.length - videoList.length
            },
            warnings: parseErrors.length > 0 ? parseErrors : undefined
        });

    } catch (error) {
        // Only attempt to rollback if we have a transaction and it hasn't been committed
        if (transaction && !transaction.finished) {
            await transaction.rollback();
        }
        logger.error("Error importing videos:", error);
        return res.status(500).json({ 
            error: "Failed to import videos",
            message: error.message,
            playlistIds: finalPlaylistIds,
            videoIds: finalVideoIds,
            contentUrl: contentUrl,
            parseErrors: parseErrors.length > 0 ? parseErrors : undefined
        });
    }
}

// Helper functions for createStructuredCourse
function parseISO8601Duration(duration) {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  const [, hours = 0, minutes = 0, seconds = 0] = match.map((x) => parseInt(x) || 0);
  return hours * 3600 + minutes * 60 + seconds;
}

async function fetchAllVideoData(parsedUrls) {
  const apiKey = process.env.YOUTUBE_API_KEY || 'AIzaSyB0e1y1sDQmdC3Cm4zjRZIFMh9gAMs02Gg';
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY not configured");
  }

  const allVideoIds = [...parsedUrls.videoIds];

  // Fetch videos from playlists
  for (const playlistId of parsedUrls.playlistIds) {
    try {
      const playlistItems = await fetchPlaylistItems(playlistId, apiKey);
      const playlistVideoIds = playlistItems.map(item => item.contentDetails.videoId);
      allVideoIds.push(...playlistVideoIds);
    } catch (error) {
      logger.error(`Error fetching playlist ${playlistId}:`, error.message);
    }
  }

  // Remove duplicates and fetch video details
  const uniqueVideoIds = [...new Set(allVideoIds)];
  const videoDetails = await fetchVideoDetails(uniqueVideoIds, apiKey);

  return videoDetails.map(video => ({
    videoId: video.id,
    videoTitle: video.snippet.title,
    videoDescription: video.snippet.description,
    videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
    duration: parseISO8601Duration(video.contentDetails.duration),
    thumbnailUrl: video.snippet.thumbnails?.maxres?.url || 
                  video.snippet.thumbnails?.high?.url || 
                  video.snippet.thumbnails?.medium?.url,
    channelTitle: video.snippet.channelTitle,
    publishedAt: video.snippet.publishedAt
  }));
}

/**
 * Main API: Create structured course from content URLs
 * @param {Array<string>} contentUrlList - Array of YouTube video/playlist URLs
 * @param {string} contentTitle - Title for the course
 * @param {string} contentDescription - Description for the course
 * @param {number} userId - User ID creating the course
 * @returns {Object} - Created course with structured content
 */
async function createStructuredCourse(contentUrlList, contentTitle, contentDescription, userId) {
  let transaction;
  
  try {
    logger.info(`🚀 Creating structured course for user ${userId}`);
    logger.info(`📚 Course: "${contentTitle}"`);
    logger.info(`🔗 Processing ${contentUrlList.length} URLs`);

    // Validate inputs
    if (!Array.isArray(contentUrlList) || contentUrlList.length === 0) {
      throw new Error("contentUrlList must be a non-empty array");
    }
    
    if (!contentTitle || typeof contentTitle !== "string" || contentTitle.trim().length === 0) {
      throw new Error("contentTitle is required and must be a non-empty string");
    }
    
    if (!contentDescription || typeof contentDescription !== "string" || contentDescription.trim().length === 0) {
      throw new Error("contentDescription is required and must be a non-empty string");
    }

    // STEP 1: PULL DATA FROM YOUTUBE (All external API calls first)
    logger.info("🔍 STEP 1: Parsing content URLs...");
    const parsedUrls = parseContentUrls(contentUrlList);
    logger.info(`📊 Found ${parsedUrls.playlistIds.length} playlists and ${parsedUrls.videoIds.length} videos`);

    // Fetch all video data from YouTube API
    logger.info("📥 Fetching video data from YouTube API...");
    const videoArray = await fetchAllVideoData(parsedUrls);
    
    if (videoArray.length === 0) {
      throw new Error("No valid videos found in the provided URLs");
    }

    logger.info(`✅ Retrieved ${videoArray.length} videos from YouTube`);

    // STEP 2: TRIGGER AI CONTENT GENERATION (Independent of database operations)
    logger.info("🤖 STEP 2: Attempting to generate AI educational content...");
    const courseInfo = {
      courseTitle: contentTitle,
      courseDescription: contentDescription,
      courseSourceChannel: videoArray[0]?.channelTitle || "Mixed Sources"
    };
    
    let aiContent = null;
    let aiGenerationError = null;
    let aiPrompt = null;
    
    try {
      const aiResult = await geminiAIService.generateAIEducationalContent(videoArray, courseInfo);
      aiPrompt = aiResult.prompt; // Always capture the prompt
      
      if (aiResult.success) {
        aiContent = aiResult.data;
        logger.info("✅ AI educational content generated successfully");
      } else {
        aiGenerationError = aiResult.error;
        logger.warn("⚠️ AI content generation failed, continuing with course creation:", aiResult.error);
      }
    } catch (aiError) {
      logger.warn("⚠️ Unexpected error in AI content generation:", aiError.message);
      aiGenerationError = aiError.message;
      try {
        aiPrompt = geminiAIService.buildPrompt(videoArray, courseInfo);
      } catch (promptError) {
        logger.warn("⚠️ Could not build AI prompt:", promptError.message);
        aiPrompt = "Failed to generate prompt";
      }
    }

    // STEP 3: ARRANGE EVERYTHING AND START DATABASE PERSISTENCE
    logger.info("🔄 STEP 3: Starting database transaction for data persistence...");
    transaction = await db.sequelize.transaction();

    // Calculate total duration and select thumbnail
    const totalDuration = videoArray.reduce((sum, video) => sum + video.duration, 0);
    const courseImageUrl = videoArray[0]?.thumbnailUrl || null;
    const courseSourceChannel = videoArray[0]?.channelTitle || "Mixed Sources";

    // Create course record (ALWAYS persist course regardless of AI status)
    logger.info("💾 Creating course record...");
    let course;
    try {
      // Handle potential duplicate course titles by ensuring uniqueness
      let finalCourseTitle = contentTitle.trim();
      
      // Check if course title already exists for this user
      const existingCourse = await db.Course.findOne({
          where: {
              courseTitle: finalCourseTitle,
              userId: userId
          }
      });
      
      if (existingCourse) {
          // Append timestamp to make title unique
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          finalCourseTitle = `${finalCourseTitle} (${timestamp})`;
      }

      course = await db.Course.create({
        userId,
        courseTitle: finalCourseTitle,
        courseDescription: contentDescription.trim(),
        courseDuration: totalDuration,
        courseImageUrl,
        courseSourceChannel,
        courseSourceMode: 'YOUTUBE',
        deliveryMode: 'ONLINE',
        status: 'PUBLISHED',
        courseState: 'ACTIVE',
        metadata: {
          createdFrom: "YouTube URLs",
          videoCount: videoArray.length,
          totalDuration,
          coursePlatform: "YOUTUBE",
          courseType: "VIDEO_SERIES", 
          courseDifficulty: "BEGINNER",
          isPublic: false,
          createdAt: new Date().toISOString(),
          aiGenerationAttempted: aiContent !== null,
          aiGenerationSuccess: aiContent !== null,
          aiGenerationError: aiGenerationError || null
        }
      }, { transaction });
      logger.info(`✅ Course created with ID: ${course.courseId}`);
    } catch (courseError) {
      logger.error("❌ Error creating course record:", courseError.message);
      throw new Error(`Failed to create course: ${courseError.message}`);
    }

    // STEP 4: CREATE UNIFIED COURSE CONTENT (Videos, AI Content, and proper sequencing)
    logger.info("📝 Creating unified course content with proper sequencing...");
    let createdContentResult = null;
    
    try {
      // Use the new unified content creation method
      createdContentResult = await geminiAIService.createUnifiedCourseContent(
        course.courseId,
        userId,
        videoArray,
        aiContent, // This includes all AI-generated content (videos, flashcards, quizzes, written)
        transaction
      );
      
      logger.info(`✅ Successfully created unified course content:`);
      logger.info(`   - Videos: ${createdContentResult.videoContent.length}`);
      logger.info(`   - Written Content: ${createdContentResult.writtenContent.length}`);
      logger.info(`   - Flashcard Sets: ${createdContentResult.flashcardContent.length}`);
      logger.info(`   - Quiz Sets: ${createdContentResult.quizContent.length}`);
      logger.info(`   - Total Content Items: ${createdContentResult.totalContentItems}`);
      
      if (createdContentResult.errors.length > 0) {
        logger.warn(`⚠️ ${createdContentResult.errors.length} content creation errors occurred`);
        createdContentResult.errors.forEach(error => logger.warn(`   - ${error}`));
      }
      
    } catch (contentError) {
      logger.error("❌ Error creating unified course content:", contentError.message);
      throw new Error(`Failed to create course content: ${contentError.message}`);
    }

    // Create legacy format for backward compatibility
    const createdContentAndVideos = createdContentResult.videoContent.map(item => ({
      content: item.content,
      video: item.video
    }));

    // Create course access for the owner (ALWAYS create access)
    logger.info("🔐 Creating course access for owner...");
    
    try {
      // Check if course access already exists to avoid unique constraint violation
      const existingAccess = await db.CourseAccess.findOne({
        where: {
          courseId: course.courseId,
          userId: userId,
          organizationId: null // Assuming individual user access, not organization
        },
        transaction
      });

      if (existingAccess) {
        logger.info("✅ Course access already exists for owner, updating if needed");
        if (!existingAccess.isActive || existingAccess.accessLevel !== "OWN") {
          await existingAccess.update({
            accessLevel: "OWN",
            isActive: true,
            grantedByUserId: userId,
            metadata: {
              grantedAt: new Date().toISOString(),
              reason: "Course Owner - Auto-granted during course creation",
              source: "createStructuredCourse",
              updated: true
            }
          }, { transaction });
          logger.info("✅ Course access updated for owner");
        }
      } else {
        await db.CourseAccess.create({
          courseId: course.courseId,
          userId: userId,
          accessLevel: "OWN",
          isActive: true,
          grantedByUserId: userId,
          metadata: {
            grantedAt: new Date().toISOString(),
            reason: "Course Owner - Auto-granted during course creation",
            source: "createStructuredCourse"
          }
        }, { transaction });
        logger.info("✅ Course access created for owner");
      }
    } catch (accessError) {
      logger.error("❌ Error creating course access:", accessError.message);
      throw new Error(`Failed to create course access: ${accessError.message}`);
    }

    // STEP 5: COMMIT TRANSACTION
    logger.info("✅ Committing transaction - All course data will be persisted...");
    await transaction.commit();
    transaction = null; // Set to null to prevent rollback in catch block

    // Determine final status message
    let statusMessage = "🎉 Course created successfully!";
    let courseCreationSuccess = true;

    if (createdContentResult.errors.length > 0) {
      statusMessage += ` (with ${createdContentResult.errors.length} content creation warnings)`;
    }

    logger.info(statusMessage);

    // Prepare comprehensive content summary for return
    const contentSummary = {
      totalContentItems: createdContentResult.totalContentItems,
      videoContent: createdContentResult.videoContent.length,
      writtenContent: createdContentResult.writtenContent.length,
      flashcardSets: createdContentResult.flashcardContent.length,
      quizSets: createdContentResult.quizContent.length,
      totalFlashcards: createdContentResult.flashcardContent.reduce((sum, item) => sum + (item.totalFlashcards || 0), 0),
      totalQuizQuestions: createdContentResult.quizContent.reduce((sum, item) => sum + (item.totalQuestions || 0), 0),
      errors: createdContentResult.errors
    };

    return {
      success: courseCreationSuccess,
      message: statusMessage,
      course: {
        courseId: course.courseId,
        courseTitle: course.courseTitle,
        courseDescription: course.courseDescription,
        courseDuration: course.courseDuration,
        courseImageUrl: course.courseImageUrl,
        courseSourceChannel: course.courseSourceChannel,
        status: course.status,
        createdAt: course.createdAt
      },
      videoProcessed: {
        totalVideos: createdContentAndVideos.length,
        totalVideosAttempted: videoArray.length,
        videos: createdContentAndVideos.map(item => ({
          videoTitle: item.video.courseVideoTitle,
          videoId: item.content.metadata?.videoId,
          duration: item.video.duration,
          videoUrl: item.video.courseVideoUrl
        }))
      },
      contentCreated: contentSummary,
      aiGeneratedContent: aiContent ? {
        generationSuccessful: true,
        courseAnalysis: aiContent.courseAnalysis,
        totalVideoContents: aiContent.videoContents?.length || 0,
        contentSaved: contentSummary,
        prompt: aiPrompt
      } : {
        generationSuccessful: false,
        error: aiGenerationError,
        message: "AI content generation failed - course created with video content only",
        contentSaved: contentSummary,
        prompt: aiPrompt
      },
      warnings: [
        ...(parsedUrls.errors || []), 
        ...(aiGenerationError ? [`AI Generation: ${aiGenerationError}`] : []),
        ...(createdContentResult.errors || [])
      ].filter(Boolean)
    };

  } catch (error) {
    // Always rollback transaction if it exists
    if (transaction) {
      try {
        await transaction.rollback();
        logger.info("🔄 Transaction rolled back successfully");
      } catch (rollbackError) {
        logger.error("❌ Error rolling back transaction:", rollbackError.message);
      }
    }
    
    // Log detailed error information
    logger.error("❌ Error creating structured course:", error.message);
    logger.error("📋 Error stack:", error.stack);
    
    // Re-throw the error for the calling function to handle
    throw error;
  }
}

/**
 * Generate educational content for an existing course
 * @param {number} courseId - Course ID to generate content for
 * @param {number} userId - User ID requesting the generation
 * @returns {Object} - Generated educational content results
 */
async function generateEducationalContent(courseId, userId) {
  let transaction;
  
  try {
    logger.info(`🤖 Generating educational content for course ${courseId} by user ${userId}`);

    // STEP 1: VALIDATE ACCESS AND PULL EXISTING DATA
    logger.info("🔍 STEP 1: Validating course access and pulling existing data...");
    
    // Validate that the course exists and user has access
    const course = await db.Course.findOne({
      where: { courseId },
      include: [
        {
          model: db.CourseAccess,
          where: { 
            userId,
            isActive: true,
            accessLevel: { [Op.in]: ['OWN', 'EDIT', 'VIEW'] }
          },
          required: true
        }
      ]
    });

    if (!course) {
      throw new Error('Course not found or access denied');
    }

    // Get course videos
    const courseVideos = await db.CourseVideo.findAll({
      where: { courseId },
      include: [
        {
          model: db.CourseContent,
          required: true
        }
      ],
      order: [['CourseContent', 'courseContentSequence', 'ASC']]
    });

    if (!courseVideos || courseVideos.length === 0) {
      throw new Error('No video content found in the course to analyze');
    }

    // Convert course videos to the format expected by AI generation
    const videoArray = courseVideos.map(courseVideo => ({
      videoId: courseVideo.CourseContent?.metadata?.videoId || extractVideoIdFromUrl(courseVideo.courseVideoUrl),
      videoTitle: courseVideo.courseVideoTitle,
      videoDescription: courseVideo.courseVideoDescription,
      videoUrl: courseVideo.courseVideoUrl,
      duration: courseVideo.duration,
      thumbnailUrl: courseVideo.thumbnailUrl,
      channelTitle: courseVideo.CourseContent?.metadata?.channelTitle || course.courseSourceChannel
    }));

    logger.info(`✅ Found ${videoArray.length} videos in course`);

    // STEP 2: TRIGGER AI CONTENT GENERATION
    logger.info("🤖 STEP 2: Generating AI educational content...");
    const courseInfo = {
      courseTitle: course.courseTitle,
      courseDescription: course.courseDescription,
      courseSourceChannel: course.courseSourceChannel
    };
    
    let aiContent = null;
    let aiGenerationError = null;
    let aiPrompt = null;
    
    try {
      const aiResult = await geminiAIService.generateAIEducationalContent(videoArray, courseInfo);
      aiPrompt = aiResult.prompt; // Always capture the prompt
      
      if (aiResult.success) {
        aiContent = aiResult.data;
        logger.info("✅ AI educational content generated successfully");
      } else {
        aiGenerationError = aiResult.error;
        logger.warn("⚠️ AI content generation failed:", aiResult.error);
      }
    } catch (aiError) {
      logger.warn("⚠️ Unexpected error in AI content generation:", aiError.message);
      aiGenerationError = aiError.message;
      try {
        aiPrompt = geminiAIService.buildPrompt(videoArray, courseInfo);
      } catch (promptError) {
        logger.warn("⚠️ Could not build AI prompt:", promptError.message);
        aiPrompt = "Failed to generate prompt";
      }
    }

    // If AI content generation failed, return early with error info but don't fail the operation
    if (!aiContent) {
      logger.info("⚠️ Returning without database operations due to AI generation failure");
      return {
        success: false,
        error: aiGenerationError,
        message: "AI content generation failed - no educational content was created",
        courseId,
        prompt: aiPrompt,
        videoProcessed: {
          totalVideos: videoArray.length,
          videos: videoArray.map(video => ({
            videoTitle: video.videoTitle,
            videoId: video.videoId,
            duration: video.duration
          }))
        }
      };
    }

    // STEP 3: START DATABASE TRANSACTION FOR AI CONTENT PERSISTENCE
    logger.info("🔄 STEP 3: Starting database transaction for AI content persistence...");
    transaction = await db.sequelize.transaction();

    // STEP 4: SAVE AI-GENERATED CONTENT TO DATABASE
    logger.info("💾 STEP 4: Saving AI-generated content...");
    let savedContent;
    try {
      savedContent = await geminiAIService.saveAIContentToDatabase(
        courseId, 
        userId, 
        aiContent, 
        videoArray, 
        transaction
      );
      logger.info("✅ AI-generated content saved successfully");
    } catch (aiContentError) {
      logger.warn("⚠️ Error saving AI-generated content:", aiContentError.message);
      savedContent = {
        errors: [`Failed to save AI content: ${aiContentError.message}`],
        topicContent: 0,
        flashcardSets: 0,
        totalFlashcards: 0,
        quizSets: 0,
        totalQuizQuestions: 0
      };
      // Don't throw error - we want to return the generated content even if saving failed
    }

    // Commit transaction
    await transaction.commit();
    transaction = null;

    logger.info("✅ Educational content generated and processed successfully");

    return {
      success: true,
      courseId,
      aiGeneratedContent: {
        generationSuccessful: true,
        courseAnalysis: aiContent.courseAnalysis,
        totalVideoContents: aiContent.videoContents?.length || 0,
        contentSaved: savedContent,
        prompt: aiPrompt
      },
      videoProcessed: {
        totalVideos: videoArray.length,
        videos: videoArray.map(video => ({
          videoTitle: video.videoTitle,
          videoId: video.videoId,
          duration: video.duration
        }))
      }
    };

  } catch (error) {
    // Always rollback transaction if it exists
    if (transaction) {
      try {
        await transaction.rollback();
        logger.info("🔄 Transaction rolled back successfully");
      } catch (rollbackError) {
        logger.error("❌ Error rolling back transaction:", rollbackError.message);
      }
    }
    
    logger.error("❌ Error generating educational content:", error.message);
    throw error;
  }
}

module.exports = {
    importPlaylistToDatabase,
    parseContentUrls,
    extractVideoIdFromUrl,
    extractPlaylistIdFromUrl,
    createStructuredCourse,
    generateEducationalContent
};
