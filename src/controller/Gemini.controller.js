const jwt = require("jsonwebtoken");
const lodash = require("lodash");
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const logger = require("../config/winston.config");
const GeminiService = require("../service/GeminiService.service.js");
const YoutubeService = require("../service/YoutubeService.service.js");

const buildPrompt = async (req, res) => {
    const {
        items  } = req.body;
     try {
        let val = await GeminiService.buildPrompt(req?.user?.userId,items);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}

const generateEducationalContent = async (req, res) => {
    const { courseId } = req.body;
    const userId = req.user.userId;

    try {
        // Validate required parameters
        if (!courseId) {
            return res.status(400).json({
                error: "Invalid Request",
                message: "courseId is required"
            });
        }

        // Validate that only allowed fields are present in the request
        const allowedFields = ['courseId'];
        const extraFields = Object.keys(req.body).filter(key => !allowedFields.includes(key));
        if (extraFields.length > 0) {
            return res.status(400).json({
                error: "Invalid Request",
                message: `Invalid fields in request: ${extraFields.join(', ')}. Only courseId is allowed.`
            });
        }

        logger.info(`Starting educational content generation for course ${courseId} by user ${userId}`);

        const result = await YoutubeService.generateEducationalContent(courseId, userId);

        logger.info(`Educational content generation completed successfully for course ${courseId}`);

        return res.status(200).json({
            status: 200,
            message: "Educational content generated successfully",
            data: result
        });

    } catch (error) {
        logger.error(`Error generating educational content for course ${courseId}:`, error);
        
        // Handle specific error types
        if (error.message.includes('Course not found')) {
            return res.status(404).json({
                error: "Course Not Found",
                message: "The specified course does not exist or you don't have access to it"
            });
        }
        
        if (error.message.includes('No video content found')) {
            return res.status(400).json({
                error: "No Content Available",
                message: "No video content found in the course to analyze"
            });
        }
        
        if (error.message.includes('GEMINI_API_KEY not configured')) {
            return res.status(500).json({
                error: "Configuration Error",
                message: "AI service is not properly configured"
            });
        }

        return res.status(500).json({
            error: "Content Generation Failed",
            message: error.message || "An error occurred while generating educational content"
        });
    }
}


module.exports = {
    buildPrompt,
    generateEducationalContent
};

