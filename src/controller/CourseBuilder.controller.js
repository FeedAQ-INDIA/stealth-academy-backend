const jwt = require("jsonwebtoken");
const lodash = require("lodash");
const logger = require("../config/winston.config");
const CourseBuilderService = require("../service/CourseBuilder.service.js");

/**
 * Create or update course builder with integrated URL processing and course creation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function createOrUpdateCourseBuilder(req, res) {
    try {
        logger.info('CourseBuilder create/update request received', { 
            body: req.body, 
            userId: req.user?.userId 
        });
        
        const { courseBuilderId, status, courseBuilderData, orgId, processUrls = true, createCourse = true } = req.body;
        const userId = req.user?.userId;

        // For updates, courseBuilderId is required
        if (courseBuilderId && !Number.isInteger(parseInt(courseBuilderId))) {
            return res.status(400).json({
                success: false,
                message: 'Invalid course builder ID format'
            });
        }

        // Check if this is a create request with URL processing
        if (!courseBuilderId && processUrls && createCourse && courseBuilderData) {
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
            const publishResult = await CourseBuilderService.processUrlsAndCreateCourse({
                userId,
                orgId,
                courseBuilderData
            });

            // Store the entire processing result in courseBuilderData with DB-like structure
            const enrichedCourseBuilderData = {
                ...courseBuilderData,
                processedAt: new Date().toISOString(),
                processedUrls: publishResult.processing,
                processingStatus: 'COMPLETED',
                // Store complete course data in DB-like format
                courseDetail: publishResult.course,
                courseContent: publishResult.courseContent,
                courseContentDetails: publishResult.courseContentDetails,
                // Additional processing metadata
                urlProcessingResults: {
                    youtubeVideos: publishResult.courseContent.filter(item => item.type === 'youtube'),
                    writtenContent: publishResult.courseContent.filter(item => item.type === 'written'),
                    totalProcessed: publishResult.processing.totalUrlsProcessed,
                    errors: publishResult.processing.youtubeErrors,
                    nonEmbeddableUrls: publishResult.processing.nonEmbeddableUrls
                }
            };

            // Create course builder record with all the data
            const courseBuilderPayload = {
                courseBuilderId: null,
                userId,
                orgId,
                status: 'PUBLISHED',
                courseBuilderData: enrichedCourseBuilderData
            };
            
            const result = await CourseBuilderService.createOrUpdateCourseBuilder(courseBuilderPayload);
            
            logger.info('CourseBuilder created with course publication', { 
                id: result.data.courseBuilderId,
                courseId: publishResult.course.courseId
            });
            
            return res.status(201).json({
                success: true,
                message: 'Course builder created and course data prepared successfully',
                operation: 'create_with_course_data',
                data: {
                    courseBuilder: result.data,
                    course: publishResult.course,
                    courseContent: publishResult.courseContent,
                    courseContentDetails: publishResult.courseContentDetails,
                    processing: publishResult.processing
                }
            });
        } else {
            // Regular create/update without URL processing
            const courseBuilderPayload = {
                courseBuilderId: courseBuilderId ? parseInt(courseBuilderId) : null,
                userId,
                orgId,
                status: status || 'DRAFT',
                courseBuilderData: courseBuilderData || {}
            };
            
            const result = await CourseBuilderService.createOrUpdateCourseBuilder(courseBuilderPayload);
            
            const isUpdate = result.operation === 'update';
            const statusCode = isUpdate ? 200 : 201;
            const message = isUpdate 
                ? 'Course builder updated successfully' 
                : 'Course builder created successfully';
            
            logger.info(`CourseBuilder ${result.operation} successful`, { 
                id: result.data.courseBuilderId,
                operation: result.operation
            });
            
            return res.status(statusCode).json({
                success: true,
                message,
                operation: result.operation,
                data: result.data
            });
        }
        
    } catch (error) {
        logger.error('Error in createOrUpdateCourseBuilder controller:', error);
        
        if (error.message === 'Course builder not found') {
            return res.status(404).json({
                success: false,
                message: 'Course builder not found'
            });
        }
        
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
            message: error.message || 'Failed to process course builder request',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}

/**
 * Get course builder by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
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

module.exports = {
    createOrUpdateCourseBuilder,
    getCourseBuilderById
};