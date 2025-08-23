const {Op, fn, col, QueryTypes} = require("sequelize");
const db = require("../entity/index.js");
const lodash = require("lodash");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("../config/winston.config.js");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const {toJSON} = require("lodash/seq");

// Cache for API responses
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Gemini AI Configuration
let genAI = null;

function initializeGeminiAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.warn("⚠️ GEMINI_API_KEY not configured - Gemini features will be disabled");
    return null;
  }

  try {
    genAI = new GoogleGenerativeAI(apiKey);
    logger.info("✅ Google Generative AI SDK initialized successfully");
    return genAI;
  } catch (error) {
    logger.error("❌ Failed to initialize Google Generative AI SDK:", error.message);
    return null;
  }
}

// Initialize on module load
initializeGeminiAI();

// Gemini AI Functions
async function callGeminiAPI(prompt) {
  if (!genAI) {
    logger.error("❌ Google Generative AI SDK not initialized");
    throw new Error("Google Generative AI SDK not initialized - check GEMINI_API_KEY");
  }

  logger.info("🤖 Calling Gemini API using SDK...");

  try {
    // Get the model with configuration
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-latest",
      generationConfig: {
        temperature: 0.3,
        topK: 20,
        topP: 0.8,
        maxOutputTokens: 4096,
        responseMimeType: "application/json", // Force JSON response
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_ONLY_HIGH",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH", 
          threshold: "BLOCK_ONLY_HIGH",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_ONLY_HIGH",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_ONLY_HIGH",
        },
      ],
    });

    logger.info("📤 Sending prompt to Gemini...");
    
    // Generate content using the SDK
    const result = await model.generateContent(prompt);
    const response = result.response;
    
    if (!response) {
      logger.error("❌ No response received from Gemini API");
      throw new Error("No response received from Gemini API");
    }

    const content = response.text();
    
    if (!content) {
      logger.error("❌ Empty response content from Gemini API");
      throw new Error("Empty response content from Gemini API");
    }

    logger.info(`📝 Received content length: ${content.length} characters`);
    
    return parseGeminiContent(content);
    
  } catch (error) {
    // Handle specific Google AI errors
    if (error.message?.includes('API_KEY')) {
      logger.error(`🔑 API Key Error: ${error.message}`);
      throw new Error(`API Key Error: ${error.message}`);
    } else if (error.message?.includes('QUOTA_EXCEEDED') || error.message?.includes('quota')) {
      logger.error(`📊 Quota Exceeded: ${error.message}`);
      throw new Error(`Quota Exceeded: ${error.message}`);
    } else if (error.message?.includes('RATE_LIMIT') || error.message?.includes('rate limit')) {
      logger.error(`⏰ Rate Limited: ${error.message}`);
      throw new Error(`Rate Limited: ${error.message}`);
    } else if (error.message?.includes('SAFETY')) {
      logger.error(`🛡️ Content Safety Error: ${error.message}`);
      throw new Error(`Content Safety Error: ${error.message}`);
    } else if (error.message?.includes('BLOCKED')) {
      logger.error(`🚫 Content Blocked: ${error.message}`);
      throw new Error(`Content Blocked: ${error.message}`);
    } else {
      logger.error("💥 Error calling Gemini API:", error.message);
      throw error;
    }
  }
}

function parseGeminiContent(content) {
  logger.info("🔧 Parsing Gemini content...");
  
  // Log the raw content for debugging (truncated for readability)
  logger.info(`📝 Raw content preview: ${content.substring(0, 200)}...`);
  
  let cleanContent = content
    // .replace(/```json\s*/gi, '')
    // .replace(/```\s*/g, '')
    // .replace(/^\s*[\r\n]+/gm, '') // Remove empty lines
    .trim();

  try {
    const parsed = JSON.parse(cleanContent);
    logger.info("✅ Successfully parsed content as JSON");
    console.log(parsed)
    return parsed;
  } catch (firstError) {
    logger.warn(`⚠️ Initial JSON parse failed: ${firstError.message}`);
    logger.warn("🔍 Attempting JSON extraction...");
    
    // Try to find the JSON object more robustly
    const jsonPatterns = [
      /\{[\s\S]*\}/,  // Match any content between first { and last }
      /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/,  // Nested braces pattern
    ];
    
    for (const pattern of jsonPatterns) {
      const match = content.match(pattern);
      if (match) {
        try {
          const extracted = match[0];
          logger.info(`🎯 Trying extracted JSON: ${extracted.substring(0, 100)}...`);
          const parsed = JSON.parse(extracted);
          logger.info("✅ Successfully parsed extracted JSON");
          return parsed;
        } catch (extractError) {
          logger.warn(`❌ Pattern extraction failed: ${extractError.message}`);
          continue;
        }
      }
    }
    
    // Fallback to the original brace counting method
    const startIndex = content.indexOf('{');
    if (startIndex === -1) {
      logger.error("❌ No JSON object found in Gemini response");
      logger.error(`📋 Full content: ${content}`);
      throw new Error("No JSON object found in Gemini response");
    }
    
    let braceCount = 0;
    let maxEnd = startIndex;
    
    for (let i = startIndex; i < content.length; i++) {
      if (content[i] === '{') braceCount++;
      else if (content[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          maxEnd = i;
          break;
        }
      }
    }
    
    try {
      const extracted = content.substring(startIndex, maxEnd + 1);
      logger.info(`🔧 Final extraction attempt: ${extracted.substring(0, 100)}...`);
      const parsed = JSON.parse(extracted);
      logger.info("✅ Successfully parsed with brace counting");
      return parsed;
    } catch (finalError) {
      logger.error(`❌ All parsing methods failed. Final error: ${finalError.message}`);
      logger.error(`📋 Problematic content: ${content}`);
      throw new Error(`Failed to parse Gemini response as JSON: ${finalError.message}`);
    }
  }
}

function buildPrompt(videoArray, courseInfo) {
  const maxVideosPerRequest = 3;
  const limitedVideoData = videoArray.slice(0, maxVideosPerRequest);

  const prompt = `You are an expert educational content creator. Analyze these YouTube videos and create structured educational materials.

COURSE DETAILS:
Title: ${courseInfo.courseTitle}
Description: ${courseInfo.courseDescription}
Channel: ${courseInfo.courseSourceChannel}

VIDEOS TO ANALYZE:
${limitedVideoData.map((video, index) => `
${index + 1}. "${video.videoTitle}"
   Duration: ${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, "0")}
   Description: ${video.videoDescription ? video.videoDescription.substring(0, 300) + (video.videoDescription.length > 300 ? "..." : "") : "No description"}
   Video ID: ${video.videoId}
`).join("")}

CRITICAL INSTRUCTIONS:
- You MUST respond with ONLY valid JSON
- Do NOT include any markdown formatting, code blocks, or explanatory text
- Do NOT wrap the JSON in \`\`\`json or \`\`\` tags
- Start your response directly with the opening { character
- End your response directly with the closing } character

Return ONLY valid JSON with this exact structure:

{
  "courseAnalysis": {
    "overallTheme": "Main course topic",
    "skillLevel": "BEGINNER",
    "estimatedCompletionTime": "2 hours"
  },
  "videoContents": [
    {
      "videoId": "video_id_here",
      "videoTitle": "video_title_here",
      "contentSequence": 1,
      "topicContent": {
        "title": "Clear lesson title",
        "summary": "Brief summary (100-200 words)",
        "learningObjectives": ["Learn concept A", "Understand technique B"],
        "detailedContent": "Detailed explanation with examples"
      },
      "flashcards": [
        {
          "question": "What is the main concept?",
          "answer": "Clear, concise answer",
          "explanation": "Why this answer is correct",
          "difficulty": "EASY"
        }
      ],
      "quizQuestions": [
        {
          "question": "Multiple choice question?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0,
          "explanation": "Explanation of correct answer",
          "difficulty": "MEDIUM"
        }
      ]
    }
  ]
}

REQUIREMENTS:
- Create 4-6 flashcards per video
- Create 4-6 quiz questions per video
- Use difficulty levels: EASY, MEDIUM, HARD
- Return ONLY the JSON object, no other text
- Do NOT include any explanations, comments, or markdown formatting
- Start directly with { and end directly with }`;

  return prompt;
}

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

async function generateAIEducationalContent(videoArray, courseInfo) {
  logger.info("🤖 Generating AI educational content...");
  
  const prompt = buildPrompt(videoArray, courseInfo);
  
  // Check if Gemini AI is properly initialized
  if (!genAI) {
    logger.warn("⚠️ Gemini AI not initialized - skipping AI content generation");
    return {
      success: false,
      error: "Gemini AI not initialized - check GEMINI_API_KEY configuration",
      prompt: prompt
    };
  }
  
  try {
    const aiResponse = await callGeminiAPI(prompt);
    
    // Validate the response structure
    // validateAIContentStructure(aiResponse);
    
    logger.info("✅ AI content generated and validated successfully ",aiResponse);
    return {
      success: true,
      data: aiResponse,
      prompt: prompt
    };
  } catch (error) {
    logger.error("❌ Error generating AI content:", error.message);
    return {
      success: false,
      error: `Failed to generate AI educational content: ${error.message}`,
      prompt: prompt
    };
  }
}

function validateAIContentStructure(aiContent) {
  logger.info("🔍 Validating AI content structure...");
  
  if (!aiContent || typeof aiContent !== 'object') {
    throw new Error("AI content must be an object");
  }

  if (!aiContent.courseAnalysis) {
    throw new Error("Missing courseAnalysis in AI content");
  }

  if (!aiContent.videoContents || !Array.isArray(aiContent.videoContents)) {
    throw new Error("Missing or invalid videoContents array in AI content");
  }

  if (aiContent.videoContents.length === 0) {
    throw new Error("videoContents array is empty");
  }

  // Validate each video content
  for (let i = 0; i < aiContent.videoContents.length; i++) {
    const videoContent = aiContent.videoContents[i];
    
    if (!videoContent.videoId) {
      throw new Error(`Video content at index ${i} missing videoId`);
    }
    
    if (!videoContent.videoTitle) {
      throw new Error(`Video content at index ${i} missing videoTitle`);
    }
    
    if (!videoContent.topicContent) {
      throw new Error(`Video content at index ${i} missing topicContent`);
    }
    
    if (!videoContent.flashcards || !Array.isArray(videoContent.flashcards)) {
      throw new Error(`Video content at index ${i} missing or invalid flashcards array`);
    }
    
    if (!videoContent.quizQuestions || !Array.isArray(videoContent.quizQuestions)) {
      throw new Error(`Video content at index ${i} missing or invalid quizQuestions array`);
    }
  }

  logger.info("✅ AI content structure validation passed");
  return true;
}

async function saveAIContentToDatabase(courseId, userId, aiContent, videoArray, transaction) {
  const results = {
    topicContent: 0,
    flashcardSets: 0,
    totalFlashcards: 0,
    quizSets: 0,
    totalQuizQuestions: 0,
    errors: []
  };

  if (!aiContent.videoContents || !Array.isArray(aiContent.videoContents)) {
    throw new Error("Invalid AI content structure - missing videoContents array");
  }

  const courseContents = await db.CourseContent.findAll({
    where: { courseId },
    transaction
  });

  for (const videoContent of aiContent.videoContents) {
    try {
      const matchingContent = courseContents.find(content => 
        content.metadata?.videoId === videoContent.videoId ||
        content.courseContentTitle === videoContent.videoTitle
      );

      if (!matchingContent) {
        results.errors.push(`No matching course content found for video: ${videoContent.videoTitle}`);
        continue;
      }

      const courseContentId = matchingContent.courseContentId;

      // Create Topic Content (CourseWritten)
      if (videoContent.topicContent) {
        const htmlContent = `
          <div class="lesson-content">
            <h2>${videoContent.topicContent.title}</h2>
            <div class="summary">
              <h3>Summary</h3>
              <p>${videoContent.topicContent.summary}</p>
            </div>
            <div class="objectives">
              <h3>Learning Objectives</h3>
              <ul>${videoContent.topicContent.learningObjectives
                .map(obj => `<li>${obj}</li>`)
                .join("")}</ul>
            </div>
            <div class="content">
              <h3>Detailed Content</h3>
              <div>${videoContent.topicContent.detailedContent}</div>
            </div>
          </div>
        `;

        await db.CourseWritten.create({
          userId,
          courseId,
          courseContentId,
          courseWrittenDescription: videoContent.topicContent.summary,
          courseWrittenHtmlContent: htmlContent,
          courseWrittenSource: "GEMINI_AI",
          courseWrittenUrl: `https://www.youtube.com/watch?v=${videoContent.videoId}`
        }, { transaction });

        results.topicContent++;
      }

      // Create Flashcard Set
      if (videoContent.flashcards && videoContent.flashcards.length > 0) {
        const flashcardSet = await db.CourseFlashcard.create({
          courseId,
          courseContentId,
          userId,
          setTitle: `${videoContent.topicContent?.title || videoContent.videoTitle} - Flashcards`,
          setDescription: `AI-generated flashcards for: ${videoContent.topicContent?.title || videoContent.videoTitle}`,
          setDifficulty: "MIXED",
          setTags: videoContent.flashcards.flatMap(card => card.tags || []),
          setCategory: videoContent.flashcards[0]?.category || "General",
          totalFlashcards: videoContent.flashcards.length,
          isActive: true
        }, { transaction });

        const flashcardsToCreate = videoContent.flashcards.map(card => ({
          courseFlashcardId: flashcardSet.courseFlashcardId,
          question: card.question,
          answer: card.answer,
          explanation: card.explanation,
          difficulty: card.difficulty || "MEDIUM",
          cardType: card.cardType || "BASIC",
          tags: card.tags || [],
          isActive: true
        }));

        await db.Flashcard.bulkCreate(flashcardsToCreate, { transaction });

        results.flashcardSets++;
        results.totalFlashcards += videoContent.flashcards.length;
      }

      // Create Quiz
      if (videoContent.quizQuestions && videoContent.quizQuestions.length > 0) {
        try {
          const courseQuiz = await db.CourseQuiz.create({
            courseContentId,
            courseId,
            courseQuizDescription: `AI-generated quiz for: ${videoContent.topicContent?.title || videoContent.videoTitle}`,
            courseQuizType: "KNOWLEDGE CHECK",
            isQuizTimed: true,
            courseQuizTimer: videoContent.quizQuestions.length * 45,
            courseQuizPassPercent: 70
          }, { transaction });

          const questionsToCreate = videoContent.quizQuestions.map((question, index) => ({
            courseQuizId: courseQuiz.courseQuizId,
            courseId: courseId,
            courseContentId: courseContentId,
            quizQuestionTitle: question.question,
            quizQuestionType: "MULTIPLE_CHOICE",
            quizQuestionOption: question.options,
            quizQuestionCorrectAnswer: question.correctAnswer,
            questionSequence: index + 1,
            isQuestionTimed: true,
            quizQuestionTimer: question.timeLimit || 30
          }));

          await db.QuizQuestion.bulkCreate(questionsToCreate, { transaction });

          results.quizSets++;
          results.totalQuizQuestions += videoContent.quizQuestions.length;
        } catch (quizError) {
          logger.error(`❌ Error creating quiz for video ${videoContent.videoTitle}:`, quizError.message);
          results.errors.push(`Quiz creation failed for ${videoContent.videoTitle}: ${quizError.message}`);
          // Continue processing other content types
        }
      }

    } catch (error) {
      logger.error(`❌ Error processing AI content for video ${videoContent.videoTitle}:`, error);
      results.errors.push(`Error processing ${videoContent.videoTitle}: ${error.message}`);
    }
  }

  return results;
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

    // Parse content URLs and fetch video data BEFORE starting transaction
    logger.info("🔍 Parsing content URLs...");
    const parsedUrls = parseContentUrls(contentUrlList);
    logger.info(`📊 Found ${parsedUrls.playlistIds.length} playlists and ${parsedUrls.videoIds.length} videos`);

    // Fetch all video data from YouTube API
    logger.info("📥 Fetching video data from YouTube API...");
    const videoArray = await fetchAllVideoData(parsedUrls);
    
    if (videoArray.length === 0) {
      throw new Error("No valid videos found in the provided URLs");
    }

    logger.info(`✅ Retrieved ${videoArray.length} videos`);

    // Validate that we have at least some videos before proceeding
    if (videoArray.length === 0) {
      throw new Error("No valid videos found in the provided URLs");
    }

    // Generate AI educational content BEFORE starting transaction
    logger.info("🤖 Attempting to generate AI educational content...");
    const courseInfo = {
      courseTitle: contentTitle,
      courseDescription: contentDescription,
      courseSourceChannel: videoArray[0]?.channelTitle || "Mixed Sources"
    };
    
    let aiContent = null;
    let aiGenerationError = null;
    let aiPrompt = null;
    
    try {
      const aiResult = await generateAIEducationalContent(videoArray, courseInfo);
      aiPrompt = aiResult.prompt; // Always capture the prompt
      
      if (aiResult.success) {
        aiContent = aiResult.data;
        logger.info("✅ AI educational content generated successfully");
      } else {
        aiGenerationError = aiResult.error;
        logger.warn("⚠️ AI content generation failed, continuing with basic course creation:", aiResult.error);
      }
    } catch (aiError) {
      // Fallback for any unexpected errors
      logger.warn("⚠️ Unexpected error in AI content generation:", aiError.message);
      aiGenerationError = aiError.message;
      aiPrompt = buildPrompt(videoArray, courseInfo); // Ensure we have the prompt
    }

    // NOW start database transaction after all external API calls are complete
    logger.info("🔄 Starting database transaction...");
    transaction = await db.sequelize.transaction();

    // Calculate total duration and select thumbnail
    const totalDuration = videoArray.reduce((sum, video) => sum + video.duration, 0);
    const courseImageUrl = videoArray[0]?.thumbnailUrl || null;
    const courseSourceChannel = videoArray[0]?.channelTitle || "Mixed Sources";

    // Create course record
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
          createdAt: new Date().toISOString()
        }
      }, { transaction });
      logger.info(`✅ Course created with ID: ${course.courseId}`);
    } catch (courseError) {
      logger.error("❌ Error creating course record:", courseError.message);
      throw new Error(`Failed to create course: ${courseError.message}`);
    }

    // Create course content and videos
    logger.info("📝 Creating course content and videos...");
    const createdContentAndVideos = [];
    const videoProcessingErrors = [];

    try {
      for (let index = 0; index < videoArray.length; index++) {
        const video = videoArray[index];
        logger.info(`📹 Processing video ${index + 1}/${videoArray.length}: ${video.videoTitle}`);
        
        try {
          // Create course content first to get the auto-generated ID
          const courseContent = await db.CourseContent.create({
            courseId: course.courseId,
            courseContentTitle: video.videoTitle,
            courseContentType: "CourseVideo",
            courseContentSequence: index + 1,
            courseContentDuration: video.duration,
            courseSourceMode: "YOUTUBE",
            metadata: {
              videoId: video.videoId,
              originalUrl: video.videoUrl,
              channelTitle: video.channelTitle,
              publishedAt: video.publishedAt
            }
          }, { transaction });

          // Create course video with the courseContentId
          const courseVideo = await db.CourseVideo.create({
            courseContentId: courseContent.courseContentId,
            courseId: course.courseId,
            userId,
            courseVideoTitle: video.videoTitle,
            courseVideoDescription: video.videoDescription,
            courseVideoUrl: video.videoUrl,
            duration: video.duration,
            thumbnailUrl: video.thumbnailUrl,
            isPreview: false,
            status: "READY"
          }, { transaction });

          createdContentAndVideos.push({
            content: courseContent,
            video: courseVideo
          });
        } catch (videoError) {
          logger.warn(`⚠️ Error processing video ${video.videoTitle}:`, videoError.message);
          videoProcessingErrors.push(`${video.videoTitle}: ${videoError.message}`);
          // Continue with next video instead of failing completely
        }
      }
      
      if (createdContentAndVideos.length === 0) {
        throw new Error("Failed to process any videos successfully");
      }
      
      logger.info(`✅ Created ${createdContentAndVideos.length} course contents and videos`);
      if (videoProcessingErrors.length > 0) {
        logger.warn(`⚠️ ${videoProcessingErrors.length} videos failed to process`);
      }
    } catch (contentError) {
      logger.error("❌ Error creating course content/videos:", contentError.message);
      throw new Error(`Failed to create course content: ${contentError.message}`);
    }

    // Save AI-generated content to database (only if AI content was generated)
    let savedContent = null;
    if (aiContent) {
      logger.info("💾 Saving AI-generated content...");
      try {
        savedContent = await saveAIContentToDatabase(
          course.courseId, 
          userId, 
          aiContent, 
          videoArray, 
          transaction
        );
        logger.info("✅ AI-generated content saved successfully");
      } catch (aiContentError) {
        logger.warn("⚠️ Error saving AI-generated content, continuing without it:", aiContentError.message);
        // Don't throw error - continue with course creation
      }
    } else {
      logger.info("⚠️ Skipping AI content generation due to previous error");
    }

    // Create course access for the owner
    logger.info("🔐 Creating course access for owner...");
    try {
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
    } catch (accessError) {
      logger.error("❌ Error creating course access:", accessError.message);
      throw new Error(`Failed to create course access: ${accessError.message}`);
    }

    // Commit transaction
    logger.info("✅ Committing transaction...");
    await transaction.commit();
    transaction = null; // Set to null to prevent rollback in catch block

    logger.info("🎉 Course created successfully!");

    return {
      success: true,
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
      aiGeneratedContent: aiContent ? {
        courseAnalysis: aiContent.courseAnalysis,
        totalVideoContents: aiContent.videoContents?.length || 0,
        contentSaved: savedContent,
        prompt: aiPrompt // Use the captured prompt
      } : {
        error: aiGenerationError,
        message: "AI content generation failed - course created with video content only",
        contentSaved: null,
        prompt: aiPrompt // Include the prompt even when AI generation fails
      },
      warnings: [
        ...(parsedUrls.errors || []), 
        ...(aiGenerationError ? [`AI Generation: ${aiGenerationError}`] : []),
        ...(videoProcessingErrors || [])
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

    // Generate AI educational content
    logger.info("🤖 Generating AI educational content...");
    const courseInfo = {
      courseTitle: course.courseTitle,
      courseDescription: course.courseDescription,
      courseSourceChannel: course.courseSourceChannel
    };
    
    // Build the prompt that will be sent to AI
    let aiContent = null;
    let aiGenerationError = null;
    let aiPrompt = null;
    
    try {
      const aiResult = await generateAIEducationalContent(videoArray, courseInfo);
      aiPrompt = aiResult.prompt; // Always capture the prompt
      
      if (aiResult.success) {
        aiContent = aiResult.data;
        logger.info("✅ AI educational content generated successfully");
      } else {
        aiGenerationError = aiResult.error;
        logger.warn("⚠️ AI content generation failed:", aiResult.error);
      }
    } catch (aiError) {
      // Fallback for any unexpected errors
      logger.warn("⚠️ Unexpected error in AI content generation:", aiError.message);
      aiGenerationError = aiError.message;
      aiPrompt = buildPrompt(videoArray, courseInfo); // Ensure we have the prompt
    }

    // Only proceed with database operations if AI content was generated
    if (!aiContent) {
      logger.info("⚠️ Returning without saving AI content due to generation failure");
      return {
        success: false,
        error: aiGenerationError,
        message: "AI content generation failed - no educational content was created",
        courseId,
        prompt: aiPrompt, // Include the captured prompt
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

    // Start database transaction
    transaction = await db.sequelize.transaction();

    // Save AI-generated content to database
    logger.info("💾 Saving AI-generated content...");
    const savedContent = await saveAIContentToDatabase(
      courseId, 
      userId, 
      aiContent, 
      videoArray, 
      transaction
    );

    // Commit transaction
    await transaction.commit();
    transaction = null;

    logger.info("✅ Educational content generated and saved successfully");

    return {
      success: true,
      courseId,
      aiGeneratedContent: {
        courseAnalysis: aiContent.courseAnalysis,
        totalVideoContents: aiContent.videoContents?.length || 0,
        contentSaved: savedContent,
        prompt: generatedPrompt // Include the prompt that was sent to AI
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
