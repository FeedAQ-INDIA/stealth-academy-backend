const express = require("express");
const router = express.Router();
const genericController = require("../controller/Generic.controller.js");
const youtubeService = require("../service/YoutubeService.service.js");
const youtubeController = require("../controller/Youtube.controller.js");
const geminiController = require("../controller/Gemini.controller");
const authMiddleware = require("../middleware/authMiddleware");
const publicauthenticationMiddleware = require("../middleware/publicMiddleware");
const logger = require('../config/winston.config.js')

router.get("/ping", function (req, res) {
    res.status(200).send({message: "Ping Successful"});
});

 router.post("/getUser", authMiddleware, genericController.getUser);

// router.post("/fetchScheduledCourseMeet", authMiddleware, genericController.fetchScheduledCourseMeet);

router.post("/browseCourse", publicauthenticationMiddleware, genericController.searchRecord);
router.post("/searchCourse", publicauthenticationMiddleware, genericController.searchRecord);
router.post("/isUserCourseEnrolled", authMiddleware, genericController.isUserCourseEnrolled);
router.post("/userCourseEnrollment", authMiddleware, genericController.userCourseEnrollment);
router.post("/userCourseDisrollment", authMiddleware, genericController.userCourseDisrollment);
router.post("/saveUserDetail", authMiddleware, genericController.saveUserDetail);
router.post("/getCourseDetail", authMiddleware, genericController.getCourseDetail);
router.post("/saveNote", authMiddleware, genericController.saveNote);
router.post("/deleteNote", authMiddleware, genericController.deleteNote);
router.post("/saveUserCourseContentProgress", authMiddleware, genericController.saveUserCourseContentProgress);
router.post("/deleteUserCourseContentProgress", authMiddleware, genericController.deleteUserCourseContentProgress);
router.post("/submitQuiz", authMiddleware, genericController.submitQuiz);
router.post("/clearQuizResult", authMiddleware, genericController.clearQuizResult);

// router.post("/raiseInterviewRequest", authMiddleware, genericController.raiseInterviewRequest);

// router.post("/raiseCounsellingRequest", authMiddleware, genericController.raiseCounsellingRequest);

// Course Management Routes
router.post("/deleteCourse", authMiddleware, genericController.deleteCourse);

// YouTube API Routes - Single API endpoint
router.post("/createCourseFromUrls", authMiddleware, youtubeController.createCourseFromUrls);

// Gemini AI Routes
router.post("/buildPrompt", publicauthenticationMiddleware, geminiController.buildPrompt);

module.exports = router;
