const jwt = require("jsonwebtoken");
const lodash = require("lodash");
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const logger = require("../config/winston.config");
const AcademyService = require("../service/AcademyService.service.js");


async function getUser(req, res, next) {
    const {} = req.body;
    try {
        let val = await AcademyService.getUser(req.user.userId);
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
async function saveWritingSubmission(req, res) {
    try {
        const { userId, promptId, submissionText } = req.body;
        console.log('Controller received:', { userId, promptId, submissionText }); // Debug log
        if (!userId || !Number.isInteger(userId)) {
            return res.status(400).json({ message: 'Invalid or missing userId' });
        }
        const response = await AcademyService.saveWritingSubmission(userId, promptId, submissionText);
        res.status(200).json({ status: 200, message: "Success", data: response });
    } catch (error) {
        logger.error(error);
        res.status(500).json({ message: error.message });
    }
}

async function getWritingSubmission(req, res) {
    try {
        const { userId, submissionId } = req.body;
        console.log('Controller received:', { userId, submissionId }); // Debug log
        if (!userId || !Number.isInteger(userId)) {
            return res.status(400).json({ message: 'Invalid or missing userId' });
        }
        if (!submissionId || !Number.isInteger(submissionId)) {
            return res.status(400).json({ message: 'Invalid or missing submissionId' });
        }
        const response = await AcademyService.getWritingSubmission(userId, submissionId);
        res.status(200).json({ status: 200, message: "Success", data: response });
    } catch (error) {
        logger.error(error);
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    getUser,
    saveWritingSubmission,
    getWritingSubmission
};

