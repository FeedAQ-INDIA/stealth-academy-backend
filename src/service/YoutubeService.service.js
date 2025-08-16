const {Op, fn, col, QueryTypes} = require("sequelize");
const db = require("../entity/index.js");
const lodash = require("lodash");
const logger = require("../config/winston.config.js");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const {toJSON} = require("lodash/seq");

// Cache for API responses
const cache = new Map();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

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

        const course = await db.Course.create({
            userId,
            courseTitle: courseTitle || defaultCourseTitle || `YouTube Course ${new Date().toISOString().split('T')[0]}`,
            courseDescription: courseDescription || defaultCourseDescription,
            courseIsLocked: false,
            courseImageUrl: courseThumbnail,
            courseDuration: 0,
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

module.exports = {
    importPlaylistToDatabase,
    parseContentUrls,
    extractVideoIdFromUrl,
    extractPlaylistIdFromUrl
};
