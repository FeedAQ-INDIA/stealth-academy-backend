const logger = require("../config/winston.config.js");
const { publishCourseFromBuilderPayload } = require("../service/PublishCourse.service.js");

async function publishCourse(req, res) {
  try {
    logger.info('publishCourse request received', { courseBuilderId: req.body?.courseBuilderId });
    
    if (!req.body?.courseBuilderId) {
      return res.status(400).json({
        success: false,
        message: 'courseBuilderId is required'
      });
    }

    const result = await publishCourseFromBuilderPayload(req.body, req.user?.userId);
    return res.status(201).json(result);
  } catch (error) {
    logger.error('Error in publishCourse controller', { error: error.message, stack: error.stack });
    
    let statusCode = 500;
    if (error.message.includes('courseBuilderId is required') || 
        error.message.includes('CourseBuilder not found') ||
        error.message.includes('courseDetail missing')) {
      statusCode = 400;
    } else if (error.message.includes('User mismatch') || 
               error.message.includes('cannot publish course for another user')) {
      statusCode = 403;
    } else if (error.message.includes('already been published')) {
      statusCode = 409;
    }
    
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to publish course'
    });
  }
}

module.exports = { publishCourse };
