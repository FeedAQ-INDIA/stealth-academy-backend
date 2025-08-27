const logger = require("../config/winston.config");
const db = require("../entity/index.js");
const { getUserCreditBalance, addCreditTransaction } = require("../service/CreditService.service.js");
const YoutubeService = require("../service/YoutubeService.service.js");

/**
 * Creates a structured course from YouTube URLs
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function createCourseFromUrls(req, res, next) {
  const { contentUrlsList, courseTitle, courseDescription } = req.body;

  try {
    // Validate required fields
    if (
      !contentUrlsList ||
      !Array.isArray(contentUrlsList) ||
      contentUrlsList.length === 0
    ) {
      return res.status(400).send({
        status: 400,
        message: "contentUrlsList is required and must be a non-empty array",
      });
    }

    if (
      !courseTitle ||
      typeof courseTitle !== "string" ||
      courseTitle.trim().length === 0
    ) {
      return res.status(400).send({
        status: 400,
        message: "courseTitle is required and must be a non-empty string",
      });
    }

    if (
      !courseDescription ||
      typeof courseDescription !== "string" ||
      courseDescription.trim().length === 0
    ) {
      return res.status(400).send({
        status: 400,
        message: "courseDescription is required and must be a non-empty string",
      });
    }

    logger.info(
      `🎥 Creating course from YouTube URLs for user: ${req.user.userId}`
    );
    logger.info(`📚 Course Title: ${courseTitle}`);
    logger.info(`📝 Course Description: ${courseDescription}`);
    logger.info(`🔗 URLs Count: ${contentUrlsList.length}`);

    const userBal = await getUserCreditBalance(req.user.userId);
    let result;
    if (userBal >= 30) {
      // Call the YouTube service to create the structured course
     result = await YoutubeService.createStructuredCourse(
        contentUrlsList,
        courseTitle,
        courseDescription,
        req.user.userId
      );

       await addCreditTransaction({ userId: req.user.userId, transactionType: 'DEBIT', referenceType: 'BYOC_COURSE_CREATION', amount: 30.00, description: `Course created from YouTube URLs: ${courseTitle}`, metadata: null });
    } else {
      throw new Error("Insufficient credit balance");
    }

    logger.info("✅ Course created successfully via YouTube controller");

    res.status(200).send({
      status: 200,
      message: "Course created successfully from YouTube URLs",
      data: result,
    });
  } catch (err) {
    logger.error(`❌ Error creating course from YouTube URLs:`, {
      error: err.message,
      stack: err.stack,
      userId: req.user.userId,
      courseTitle,
      urlsCount: contentUrlsList?.length || 0,
    });

    // Handle specific error types
    if (err.message?.includes("YOUTUBE_API_KEY not configured")) {
      return res.status(500).send({
        status: 500,
        message:
          "YouTube API is not properly configured. Please contact administrator.",
      });
    }

    if (err.message?.includes("YouTube API error")) {
      return res.status(502).send({
        status: 502,
        message:
          "Failed to fetch data from YouTube API. Please try again later.",
      });
    }

    if (err.message?.includes("No valid videos found")) {
      return res.status(400).send({
        status: 400,
        message:
          "No valid YouTube videos found in the provided URLs. Please check your links.",
      });
    }

    if (
      err.message?.includes("Database error") ||
      err.message?.includes("SequelizeError")
    ) {
      return res.status(500).send({
        status: 500,
        message:
          "Database error occurred while creating the course. Please try again.",
      });
    }

    // Generic error response
    res.status(500).send({
      status: 500,
      message:
        err.message ||
        "An error occurred while creating the course from YouTube URLs.",
    });

    next(err);
  }
}

module.exports = {
  createCourseFromUrls,
};
