const logger = require("../config/winston.config.js");
const { publishCourseFromBuilderPayload } = require("../service/PublishCourse.service.js");

async function publishCourse(req, res) {
  try {
    logger.info('publishCourse request received');
    const result = await publishCourseFromBuilderPayload(req.body, req.user?.userId);
    return res.status(201).json(result);
  } catch (error) {
    const statusCode = (error.message === 'userId missing in payload' || error.message.includes('courseDetail missing')) ? 400 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to publish course'
    });
  }
}

module.exports = { publishCourse };
