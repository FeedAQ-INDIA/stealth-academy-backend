const logger = require("../config/winston.config.js");
const { publishCourseFromBuilderPayload } = require("../service/PublishCourse.service.js");
const { ApiResponse } = require("../utils/responseFormatter");

async function publishCourse(req, res) {
  const apiResponse = new ApiResponse(req, res);
  
  try {
    logger.info('publishCourse request received', { courseBuilderId: req.body?.courseBuilderId });
    
    if (!req.body?.courseBuilderId) {
      return apiResponse
        .status(400)
        .withMessage('courseBuilderId is required')
        .withError('courseBuilderId is required', 'MISSING_FIELD', 'publishCourse')
        .error();
    }

    const result = await publishCourseFromBuilderPayload(req.body, req.user?.userId);
    
    apiResponse
      .status(201)
      .withMessage(result.message || 'Course published successfully')
      .withData(result.data || result)
      .withMeta({
        courseBuilderId: req.body.courseBuilderId,
        publishedBy: req.user?.userId,
        publishedAt: new Date().toISOString()
      })
      .success();
  } catch (error) {
    logger.error('Error in publishCourse controller', { error: error.message, stack: error.stack });
    
    const errorMessage = error.message?.toLowerCase() || '';
    const status = errorMessage.includes('coursebuilderId is required') || 
                  errorMessage.includes('coursebuilder not found') ||
                  errorMessage.includes('coursedetail missing') ? 400 :
                  errorMessage.includes('user mismatch') || 
                  errorMessage.includes('cannot publish course for another user') ? 403 :
                  errorMessage.includes('already been published') ? 409 : 500;
    
    apiResponse
      .status(status)
      .withMessage(error.message || 'Failed to publish course')
      .withError(error.message, error.code || 'PUBLISH_COURSE_ERROR', 'publishCourse')
      .withMeta({
        courseBuilderId: req.body?.courseBuilderId,
        attemptedBy: req.user?.userId
      })
      .error();
  }
}

module.exports = { publishCourse };
