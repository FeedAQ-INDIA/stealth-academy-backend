const jwt = require("jsonwebtoken");
const lodash = require("lodash");
const logger = require("../config/winston.config");
const CourseBuilderService = require("../service/CourseBuilder.service.js");


async function registerBuilder(req, res) {
    try {
        logger.info('Course builder registration request received', { 
            body: req.body, 
            userId: req.user?.userId 
        });
        
        const { title, description, orgId } = req.body;
        const userId = req.user?.userId;

        // Validate required fields
        if (!title || !description) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: title and description are required'
            });
        }

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User ID is required for creating course builder'
            });
        }

        // Create course builder payload with basic information
        const courseBuilderPayload = {
            courseBuilderId: null,
            userId,
            orgId,
            status: 'DRAFT',
            courseBuilderData: {
                courseTitle: title,
                courseDescription: description
            }
        };
        
        const result = await CourseBuilderService.createOrUpdateCourseBuilder(courseBuilderPayload);
        
        logger.info('Course builder registered successfully', { 
            id: result.data.courseBuilderId,
            operation: result.operation
        });
        
        return res.status(201).json({
            success: true,
            message: 'Course builder registered successfully',
            operation: result.operation,
            data: result.data
        });
        
    } catch (error) {
        logger.error('Error in registerBuilder controller:', error);
        
        if (error.message === 'User ID is required for creating course builder') {
            return res.status(400).json({
                success: false,
                message: 'User ID is required for creating course builder'
            });
        }
        
        return res.status(400).json({
            success: false,
            message: error.message || 'Failed to register course builder',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}


async function createCourseBuilder(req, res) {
    try {
        logger.info('CourseBuilder create request received', { 
            body: req.body, 
            userId: req.user?.userId 
        });
        
        const { status, courseBuilderData, orgId, processUrls = true, createCourse = true } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User ID is required for creating course builder'
            });
        }

        // Check if this is a create request with URL processing
        if (processUrls && createCourse && courseBuilderData) {
            // This is a CREATE request - process URLs and create course
            logger.info('Processing create request with URL processing and course creation');
            
            const { courseTitle, courseDescription, contentUrlsList } = courseBuilderData;
            
            // Validate required fields for course creation
            if (!courseTitle || !courseDescription || !contentUrlsList || !Array.isArray(contentUrlsList) || contentUrlsList.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: courseTitle, courseDescription, or contentUrlsList'
                });
            }

            // Process URLs and create course using the service
            // Process URLs (service returns a wrapper with courseBuilderData inside)
            const processedResult = await CourseBuilderService.processUrlsAndCreateCourse({
                userId,
                orgId,
                courseBuilderData
            });
 

            // Create course builder record with all the data
            const courseBuilderPayload = {
                courseBuilderId: null,
                userId,
                orgId,
                status: 'DRAFT',
                courseBuilderData: processedResult
            };
            
            const result = await CourseBuilderService.createOrUpdateCourseBuilder(courseBuilderPayload);
            
            logger.info('CourseBuilder created with course data', { 
                id: result.data.courseBuilderId
            });
            
            // To avoid duplicacy: courseDetail exists inside courseBuilderData.courseDetail.
            // We will return it only once at top-level (courseDetail) and remove it from the nested structure in the response.
 

            return res.status(201).json({
                success: true,
                message: 'Course builder created and course data prepared successfully',
                operation: 'create_with_course_data',
                data: result.data
            });
        } else {
            // Regular create without URL processing
            const courseBuilderPayload = {
                courseBuilderId: null,
                userId,
                orgId,
                status: status || 'DRAFT',
                courseBuilderData: courseBuilderData || {}
            };
            
            const result = await CourseBuilderService.createOrUpdateCourseBuilder(courseBuilderPayload);
            
            logger.info(`CourseBuilder ${result.operation} successful`, { 
                id: result.data.courseBuilderId,
                operation: result.operation
            });
            
            return res.status(201).json({
                success: true,
                message: 'Course builder created successfully',
                operation: result.operation,
                data: result.data
            });
        }
        
    } catch (error) {
        logger.error('Error in createCourseBuilder controller:', error);
        
        if (error.message === 'User ID is required for creating course builder') {
            return res.status(400).json({
                success: false,
                message: 'User ID is required for creating course builder'
            });
        }

        if (error.message === "Insufficient credit balance") {
            return res.status(402).json({
                success: false,
                message: "Insufficient credit balance. You need at least 30 credits to create a course."
            });
        }

        if (error.message === "No valid content found in the provided URLs") {
            return res.status(400).json({
                success: false,
                message: "No valid content found in the provided URLs. Please check your links."
            });
        }

        if (error.message?.includes("YOUTUBE_API_KEY not configured")) {
            return res.status(500).json({
                success: false,
                message: "YouTube API is not properly configured. Please contact administrator."
            });
        }

        if (error.message?.includes("YouTube API error")) {
            return res.status(502).json({
                success: false,
                message: "Failed to fetch data from YouTube API. Please try again later."
            });
        }
        
        return res.status(400).json({
            success: false,
            message: error.message || 'Failed to create course builder',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}


async function updateCourseBuilder(req, res) {
    try {
        logger.info('CourseBuilder update request received', { 
            body: req.body, 
            userId: req.user?.userId 
        });
        
        const { courseBuilderId, status, courseBuilderData, orgId } = req.body;
        const userId = req.user?.userId;

        // For updates, courseBuilderId is required
        if (!courseBuilderId || !Number.isInteger(parseInt(courseBuilderId))) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or missing course builder ID'
            });
        }

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User ID is required for updating course builder'
            });
        }

        // Update course builder
        const courseBuilderPayload = {
            courseBuilderId: parseInt(courseBuilderId),
            userId,
            orgId,
            status: status || 'DRAFT',
            courseBuilderData: courseBuilderData || {}
        };
        
        const result = await CourseBuilderService.createOrUpdateCourseBuilder(courseBuilderPayload);
        
        logger.info(`CourseBuilder ${result.operation} successful`, { 
            id: result.data.courseBuilderId,
            operation: result.operation
        });
        
        return res.status(200).json({
            success: true,
            message: 'Course builder updated successfully',
            operation: result.operation,
            data: result.data
        });
        
    } catch (error) {
        logger.error('Error in updateCourseBuilder controller:', error);
        
        if (error.message === 'Course builder not found') {
            return res.status(404).json({
                success: false,
                message: 'Course builder not found'
            });
        }
        
        if (error.message === 'User ID is required for creating course builder') {
            return res.status(400).json({
                success: false,
                message: 'User ID is required for updating course builder'
            });
        }
        
        return res.status(400).json({
            success: false,
            message: error.message || 'Failed to update course builder',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}


async function createOrUpdateCourseBuilder(req, res) {
    try {
        logger.info('CourseBuilder create/update request received (legacy)', { 
            body: req.body, 
            userId: req.user?.userId 
        });
        
        const { courseBuilderId } = req.body;

        // Determine if this is create or update and delegate to appropriate function
        if (courseBuilderId) {
            return await updateCourseBuilder(req, res);
        } else {
            return await createCourseBuilder(req, res);
        }
        
    } catch (error) {
        logger.error('Error in createOrUpdateCourseBuilder controller:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Failed to process course builder request',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}


async function getCourseBuilderById(req, res) {
    try {
        const { courseBuilderId } = req.params;
        const userId = req.user?.userId; // assuming auth middleware attaches user

        if (!courseBuilderId || isNaN(parseInt(courseBuilderId))) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or missing courseBuilderId parameter'
            });
        }
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: user context missing'
            });
        }

        const courseBuilder = await CourseBuilderService.getCourseBuilder(parseInt(courseBuilderId), userId);

        return res.status(200).json({
            success: true,
            message: 'Course builder fetched successfully',
            data: courseBuilder
        });
    } catch (error) {
        logger.error('Error in getCourseBuilderById controller:', error);
        if (error.message === 'Course builder not found or access denied') {
            return res.status(404).json({
                success: false,
                message: 'Course builder not found'
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch course builder',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}


async function importFromYoutube(req, res) {
    try {
        logger.info('YouTube import request received', { 
            body: req.body, 
            userId: req.user?.userId 
        });
        
        const { playlistUrl } = req.body;
        const userId = req.user?.userId;

        // Validate required fields
        if (!playlistUrl) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: playlistUrl is required'
            });
        }

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User ID is required for importing from YouTube'
            });
        }

        // Validate YouTube URL
        if (!CourseBuilderService.isYouTubeUrl(playlistUrl)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid YouTube URL provided'
            });
        }

        // Extract playlist ID
        const playlistId = CourseBuilderService.extractPlaylistIdFromUrl(playlistUrl);
        if (!playlistId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid YouTube playlist URL. Please provide a valid playlist URL.'
            });
        }

        // Process the YouTube playlist and get course content
        const result = await CourseBuilderService.processYouTubeUrls([playlistUrl]);
        
        if (result.errors && result.errors.length > 0) {
            logger.warn('YouTube import completed with errors', { errors: result.errors });
        }

        if (!result.videos || result.videos.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No videos found in the provided YouTube playlist'
            });
        }

        // Convert videos to course content format
        const courseContentArray = CourseBuilderService.prepareYouTubeContentData(
            { courseId: 'temp_course_id', userId }, 
            result.videos, 
            1
        );

        logger.info('YouTube import completed successfully', { 
            playlistId,
            videoCount: result.videos.length,
            contentItemsCount: courseContentArray.length
        });
        
        return res.status(200).json({
            success: true,
            message: 'YouTube playlist imported successfully',
            data: {
                playlistId,
                totalVideos: result.videos.length,
                courseContent: courseContentArray,
                errors: result.errors || []
            }
        });
        
    } catch (error) {
        logger.error('Error in importFromYoutube controller:', error);
        
        if (error.message?.includes("YOUTUBE_API_KEY not configured")) {
            return res.status(500).json({
                success: false,
                message: "YouTube API is not properly configured. Please contact administrator."
            });
        }

        if (error.message?.includes("YouTube API error")) {
            return res.status(502).json({
                success: false,
                message: "Failed to fetch data from YouTube API. Please try again later."
            });
        }

        if (error.message === "No valid content found in the provided URLs") {
            return res.status(404).json({
                success: false,
                message: "No valid videos found in the provided YouTube playlist."
            });
        }
        
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to import from YouTube',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}

module.exports = {
    registerBuilder,
    createCourseBuilder,
    updateCourseBuilder,
    createOrUpdateCourseBuilder, // Legacy support
    getCourseBuilderById,
    importFromYoutube
};