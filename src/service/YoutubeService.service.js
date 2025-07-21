const {Op, fn, col, QueryTypes} = require("sequelize");
const db = require("../entity/index.js");
const lodash = require("lodash");
const logger = require("../config/winston.config.js");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const {toJSON} = require("lodash/seq");

async function fetchPlaylistMetadata(playlistId, apiKey) {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${apiKey}`);
    const data = await res.json();
    return data.items?.[0];
}


async function fetchPlaylistItems(playlistId, apiKey) {
    const items = [];
    let nextPageToken = '';

    do {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}&pageToken=${nextPageToken}`);
        const data = await res.json();
        items.push(...data.items);
        nextPageToken = data.nextPageToken;
    } while (nextPageToken);

    return items;
}


async function fetchVideoDetails(videoIds, apiKey) {
    const chunks = [];
    for (let i = 0; i < videoIds.length; i += 50) {
        chunks.push(videoIds.slice(i, i + 50));
    }

    const allData = [];
    for (const chunk of chunks) {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${chunk.join(',')}&key=${apiKey}`);
        const data = await res.json();
        allData.push(...data.items);
    }

    return allData;
}


function parseISO8601Duration(duration) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    const [, hours = 0, minutes = 0, seconds = 0] = match.map(x => parseInt(x) || 0);
    return hours * 3600 + minutes * 60 + seconds;
}
async function importPlaylistToDatabase(req, res) {
    const apiKey = 'AIzaSyB0e1y1sDQmdC3Cm4zjRZIFMh9gAMs02Gg';
    const { playlistId } = req.body;
    const userId = req.user.userId;

    const t = await db.sequelize.transaction();

    try {
        const playlistMeta = await fetchPlaylistMetadata(playlistId, apiKey);
        const playlistItems = await fetchPlaylistItems(playlistId, apiKey);
        const videoIds = playlistItems.map(item => item.contentDetails.videoId);
        const videoDetails = await fetchVideoDetails(videoIds, apiKey);

        const course = await db.Course.create({
            userId,
            courseTitle: playlistMeta.snippet.title,
            courseDescription: playlistMeta.snippet.description,
            courseIsLocked: false,
            courseImageUrl: playlistMeta.snippet.thumbnails?.high?.url,
            courseDuration: 0, // temporary
            courseSourceChannel: playlistMeta.snippet.channelTitle,
            courseSourceMode: "YOUTUBE",
            deliveryMode: "ONLINE",
            status: "DRAFT",
            metadata: playlistMeta
        }, { transaction: t });

        let totalDuration = 0;
        const contentList = [];
        const videoList = [];

        for (let i = 0; i < playlistItems.length; i++) {
            const item = playlistItems[i];
            const videoId = item.contentDetails.videoId;
            const snippet = item.snippet;
            const videoMeta = videoDetails.find(v => v.id === videoId);
            const durationSeconds = parseISO8601Duration(videoMeta.contentDetails.duration);
            totalDuration += durationSeconds;

            const courseContent = {
                userId,
                courseId: course.courseId,
                courseContentTitle: snippet.title,
                courseContentType: "CourseVideo",
                courseSourceMode: "YOUTUBE",
                courseContentSequence: i + 1,
                coursecontentIsLicensed: false,
                courseContentDuration: durationSeconds,
                isActive: true,
                metadata: item
            };

            contentList.push(courseContent);
        }

        // Bulk insert course content
        const createdContents = await db.CourseContent.bulkCreate(contentList, {
            transaction: t,
            returning: true
        });

        // Prepare course videos
        for (let i = 0; i < createdContents.length; i++) {
            const content = createdContents[i];
            const item = playlistItems[i];
            const videoId = item.contentDetails.videoId;
            const snippet = item.snippet;
            const videoMeta = videoDetails.find(v => v.id === videoId);
            const durationSeconds = parseISO8601Duration(videoMeta.contentDetails.duration);

            videoList.push({
                courseId: course.courseId,
                courseContentId: content.courseContentId,
                userId,
                courseVideoTitle: snippet.title,
                courseVideoDescription: snippet.description,
                courseVideoUrl: `https://www.youtube.com/watch?v=${videoId}`,
                duration: durationSeconds,
                thumbnailUrl: snippet.thumbnails?.high?.url,
                isPreview: false,
                status: "READY"
            });
        }

        // Bulk insert course videos
        await db.CourseVideo.bulkCreate(videoList, { transaction: t });

        // Update course duration
        await course.update({ courseDuration: totalDuration }, { transaction: t });

        await t.commit();

        res.json({ course });

    } catch (error) {
        await t.rollback();
        console.error("Error importing playlist:", error);
        res.status(500).json({ error: "Failed to import playlist" });
    }
}


module.exports = {
    importPlaylistToDatabase
};

