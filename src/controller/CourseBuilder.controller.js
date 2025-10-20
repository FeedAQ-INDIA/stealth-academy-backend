const jwt = require("jsonwebtoken");
const lodash = require("lodash");
const logger = require("../config/winston.config");
const CourseBuilderService = require("../service/CourseBuilder.service.js");
const { ApiResponse } = require("../utils/responseFormatter");


async function registerBuilder(req, res) {
    const apiResponse = new ApiResponse(req, res);
    
    try {
        logger.info('Course builder registration request received', { 
            body: req.body, 
            userId: req.user?.userId 
        });
        
        const { title, description, orgId } = req.body;
        const userId = req.user?.userId;

        // Validate required fields
        if (!title || !description) {
            return apiResponse
                .status(400)
                .withMessage('Missing required fields: title and description are required')
                .withError('Missing required fields: title and description are required', 'MISSING_FIELDS', 'registerBuilder')
                .error();
        }

        if (!userId) {
            return apiResponse
                .status(401)
                .withMessage('User ID is required for creating course builder')
                .withError('User ID is required for creating course builder', 'UNAUTHORIZED', 'registerBuilder')
                .error();
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
        
        apiResponse
            .status(201)
            .withMessage('Course builder registered successfully')
            .withData({ 
                operation: result.operation,
                courseBuilder: result.data
            })
            .withMeta({
                courseBuilderId: result.data.courseBuilderId,
                operation: result.operation,
                userId
            })
            .success();
        
    } catch (error) {
        logger.error('Error in registerBuilder controller:', error);
        
        const errorMessage = error.message?.toLowerCase() || '';
        const status = errorMessage.includes('user id is required') ? 400 : 500;
        
        apiResponse
            .status(status)
            .withMessage(error.message || 'Failed to register course builder')
            .withError(error.message, error.code || 'REGISTER_BUILDER_ERROR', 'registerBuilder')
            .withMeta({
                userId: req.user?.userId,
                attemptedTitle: req.body.title
            })
            .error();
    }
}


async function createCourseBuilder(req, res) {
    const apiResponse = new ApiResponse(req, res);
    
    try {
        logger.info('CourseBuilder create request received', { 
            body: req.body, 
            userId: req.user?.userId 
        });
        
        const { status, courseBuilderData, orgId, processUrls = true, createCourse = true } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return apiResponse
                .status(401)
                .withMessage('User ID is required for creating course builder')
                .withError('User ID is required for creating course builder', 'UNAUTHORIZED', 'createCourseBuilder')
                .error();
        }

        // Check if this is a create request with URL processing
        if (processUrls && createCourse && courseBuilderData) {
            // This is a CREATE request - process URLs and create course
            logger.info('Processing create request with URL processing and course creation');
            
            const { courseTitle, courseDescription, contentUrlsList } = courseBuilderData;
            
            // Validate required fields for course creation
            if (!courseTitle || !courseDescription || !contentUrlsList || !Array.isArray(contentUrlsList) || contentUrlsList.length === 0) {
                return apiResponse
                    .status(400)
                    .withMessage('Missing required fields: courseTitle, courseDescription, or contentUrlsList')
                    .withError('Missing required fields: courseTitle, courseDescription, or contentUrlsList', 'MISSING_FIELDS', 'createCourseBuilder')
                    .error();
            }

            // Process URLs and create course using the service
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

            apiResponse
                .status(201)
                .withMessage('Course builder created and course data prepared successfully')
                .withData({ 
                    operation: 'create_with_course_data',
                    courseBuilder: result.data
                })
                .withMeta({
                    courseBuilderId: result.data.courseBuilderId,
                    operation: 'create_with_course_data',
                    userId,
                    urlsProcessed: contentUrlsList.length
                })
                .success();
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
            
            apiResponse
                .status(201)
                .withMessage('Course builder created successfully')
                .withData({ 
                    operation: result.operation,
                    courseBuilder: result.data
                })
                .withMeta({
                    courseBuilderId: result.data.courseBuilderId,
                    operation: result.operation,
                    userId
                })
                .success();
        }
        
    } catch (error) {
        logger.error('Error in createCourseBuilder controller:', error);
        
        const errorMessage = error.message?.toLowerCase() || '';
        const status = errorMessage.includes('user id is required') ? 400 :
                      errorMessage.includes('insufficient credit balance') ? 402 :
                      errorMessage.includes('no valid content found') ? 400 :
                      errorMessage.includes('youtube_api_key not configured') ? 500 :
                      errorMessage.includes('youtube api error') ? 502 : 400;
        
        apiResponse
            .status(status)
            .withMessage(error.message || 'Failed to create course builder')
            .withError(error.message, error.code || 'CREATE_COURSE_BUILDER_ERROR', 'createCourseBuilder')
            .withMeta({
                userId: req.user?.userId,
                processUrls: req.body.processUrls,
                createCourse: req.body.createCourse
            })
            .error();
    }
}


async function updateCourseBuilder(req, res) {
    const apiResponse = new ApiResponse(req, res);
    
    try {
        logger.info('CourseBuilder update request received', { 
            body: req.body, 
            userId: req.user?.userId 
        });
        
        const { courseBuilderId, status, courseBuilderData, orgId } = req.body;
        const userId = req.user?.userId;

        // For updates, courseBuilderId is required
        if (!courseBuilderId || !Number.isInteger(parseInt(courseBuilderId))) {
            return apiResponse
                .status(400)
                .withMessage('Invalid or missing course builder ID')
                .withError('Invalid or missing course builder ID', 'INVALID_ID', 'updateCourseBuilder')
                .error();
        }

        if (!userId) {
            return apiResponse
                .status(401)
                .withMessage('User ID is required for updating course builder')
                .withError('User ID is required for updating course builder', 'UNAUTHORIZED', 'updateCourseBuilder')
                .error();
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
        
        apiResponse
            .status(200)
            .withMessage('Course builder updated successfully')
            .withData({ 
                operation: result.operation,
                courseBuilder: result.data
            })
            .withMeta({
                courseBuilderId: result.data.courseBuilderId,
                operation: result.operation,
                userId,
                updatedBy: userId
            })
            .success();
        
    } catch (error) {
        logger.error('Error in updateCourseBuilder controller:', error);
        
        const errorMessage = error.message?.toLowerCase() || '';
        const status = errorMessage.includes('course builder not found') ? 404 :
                      errorMessage.includes('user id is required') ? 400 : 400;
        
        apiResponse
            .status(status)
            .withMessage(error.message || 'Failed to update course builder')
            .withError(error.message, error.code || 'UPDATE_COURSE_BUILDER_ERROR', 'updateCourseBuilder')
            .withMeta({
                courseBuilderId: req.body.courseBuilderId,
                userId: req.user?.userId
            })
            .error();
    }
}


async function createOrUpdateCourseBuilder(req, res) {
    const apiResponse = new ApiResponse(req, res);
    
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
        
        apiResponse
            .status(400)
            .withMessage(error.message || 'Failed to process course builder request')
            .withError(error.message, error.code || 'COURSE_BUILDER_ERROR', 'createOrUpdateCourseBuilder')
            .withMeta({
                userId: req.user?.userId,
                courseBuilderId: req.body.courseBuilderId
            })
            .error();
    }
}


async function getCourseBuilderById(req, res) {
    const apiResponse = new ApiResponse(req, res);
    
    try {
        const { courseBuilderId } = req.params;
        const userId = req.user?.userId;

        if (!courseBuilderId || isNaN(parseInt(courseBuilderId))) {
            return apiResponse
                .status(400)
                .withMessage('Invalid or missing courseBuilderId parameter')
                .withError('Invalid or missing courseBuilderId parameter', 'INVALID_PARAMETER', 'getCourseBuilderById')
                .error();
        }
        
        if (!userId) {
            return apiResponse
                .status(401)
                .withMessage('Unauthorized: user context missing')
                .withError('Unauthorized: user context missing', 'UNAUTHORIZED', 'getCourseBuilderById')
                .error();
        }

        const courseBuilder = await CourseBuilderService.getCourseBuilder(parseInt(courseBuilderId), userId);

        apiResponse
            .status(200)
            .withMessage('Course builder fetched successfully')
            .withData({ courseBuilder })
            .withMeta({
                courseBuilderId: parseInt(courseBuilderId),
                userId
            })
            .success();
    } catch (error) {
        logger.error('Error in getCourseBuilderById controller:', error);
        
        const errorMessage = error.message?.toLowerCase() || '';
        const status = errorMessage.includes('not found') || errorMessage.includes('access denied') ? 404 : 500;
        
        apiResponse
            .status(status)
            .withMessage(error.message || 'Failed to fetch course builder')
            .withError(error.message, error.code || 'GET_COURSE_BUILDER_ERROR', 'getCourseBuilderById')
            .withMeta({
                courseBuilderId: req.params.courseBuilderId,
                userId: req.user?.userId
            })
            .error();
    }
}


async function importFromYoutube(req, res) {
    const apiResponse = new ApiResponse(req, res);
    
    try {
        logger.info('YouTube import request received', { 
            body: req.body, 
            userId: req.user?.userId 
        });
        
        const { playlistUrl } = req.body;
        const userId = req.user?.userId;

        // Validate required fields
        if (!playlistUrl) {
            return apiResponse
                .status(400)
                .withMessage('Missing required field: playlistUrl is required')
                .withError('Missing required field: playlistUrl is required', 'MISSING_FIELD', 'importFromYoutube')
                .error();
        }

        if (!userId) {
            return apiResponse
                .status(401)
                .withMessage('User ID is required for importing from YouTube')
                .withError('User ID is required for importing from YouTube', 'UNAUTHORIZED', 'importFromYoutube')
                .error();
        }

        // Validate YouTube URL
        if (!CourseBuilderService.isYouTubeUrl(playlistUrl)) {
            return apiResponse
                .status(400)
                .withMessage('Invalid YouTube URL provided')
                .withError('Invalid YouTube URL provided', 'INVALID_URL', 'importFromYoutube')
                .error();
        }

        // Extract playlist ID
        const playlistId = CourseBuilderService.extractPlaylistIdFromUrl(playlistUrl);
        if (!playlistId) {
            return apiResponse
                .status(400)
                .withMessage('Invalid YouTube playlist URL. Please provide a valid playlist URL.')
                .withError('Invalid YouTube playlist URL', 'INVALID_PLAYLIST_URL', 'importFromYoutube')
                .error();
        }

        // Process the YouTube playlist and get course content
        const result = await CourseBuilderService.processYouTubeUrls([playlistUrl]);
        
        if (result.errors && result.errors.length > 0) {
            logger.warn('YouTube import completed with errors', { errors: result.errors });
            result.errors.forEach(error => {
                apiResponse.addWarning(
                    'YOUTUBE_IMPORT_ERROR',
                    error,
                    'importFromYoutube',
                    'medium'
                );
            });
        }

        if (!result.videos || result.videos.length === 0) {
            return apiResponse
                .status(404)
                .withMessage('No videos found in the provided YouTube playlist')
                .withError('No videos found in the provided YouTube playlist', 'NO_VIDEOS_FOUND', 'importFromYoutube')
                .error();
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
        
        apiResponse
            .status(200)
            .withMessage('YouTube playlist imported successfully')
            .withData({
                playlistId,
                totalVideos: result.videos.length,
                courseContent: courseContentArray,
                errors: result.errors || []
            })
            .withMeta({
                playlistId,
                videoCount: result.videos.length,
                contentItemsCount: courseContentArray.length,
                userId
            })
            .success();
        
    } catch (error) {
        logger.error('Error in importFromYoutube controller:', error);
        
        const errorMessage = error.message?.toLowerCase() || '';
        const status = errorMessage.includes('youtube_api_key not configured') ? 500 :
                      errorMessage.includes('youtube api error') ? 502 :
                      errorMessage.includes('no valid content found') ? 404 : 500;
        
        apiResponse
            .status(status)
            .withMessage(error.message || 'Failed to import from YouTube')
            .withError(error.message, error.code || 'YOUTUBE_IMPORT_ERROR', 'importFromYoutube')
            .withMeta({
                playlistUrl: req.body.playlistUrl,
                userId: req.user?.userId
            })
            .error();
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