const express = require("express");
const router = express.Router();
const genericController = require("../controller/Generic.controller.js");
const notesController = require("../controller/Notes.controller.js");
const youtubeService = require("../service/YoutubeService.service.js");
const youtubeController = require("../controller/Youtube.controller.js");
 const authMiddleware = require("../middleware/authMiddleware");
const publicauthenticationMiddleware = require("../middleware/publicMiddleware");
const { optionalFileUpload } = require("../middleware/fileUploadMiddleware");
const logger = require('../config/winston.config.js')

router.get("/ping", function (req, res) {
    res.status(200).send({message: "Ping Successful"});
});

router.post("/getUser", authMiddleware, genericController.getUser);

router.post("/browseCourse", publicauthenticationMiddleware, genericController.searchRecord);
router.post("/searchCourse", publicauthenticationMiddleware, genericController.searchRecord);
router.post("/isUserCourseEnrolled", authMiddleware, genericController.isUserCourseEnrolled);
router.post("/userCourseEnrollment", authMiddleware, genericController.userCourseEnrollment);
router.post("/userCourseDisrollment", authMiddleware, genericController.userCourseDisrollment);
router.post("/saveUserDetail", authMiddleware, genericController.saveUserDetail);
router.post("/getCourseDetail", authMiddleware, genericController.getCourseDetail);

router.post("/saveNote", 
    authMiddleware, 
    ...optionalFileUpload('files', 5), 
    notesController.saveNote
);
router.post("/deleteNote", authMiddleware, notesController.deleteNote);
router.get("/getNote/:id", authMiddleware, notesController.getNoteWithFiles);
router.post("/getUserNotes", authMiddleware, notesController.getUserNotesWithFiles);

router.post("/saveUserCourseContentProgress", authMiddleware, genericController.saveUserCourseContentProgress);
router.post("/deleteUserCourseContentProgress", authMiddleware, genericController.deleteUserCourseContentProgress);
router.post("/getCourseProgress", authMiddleware, genericController.getCourseProgress);
router.post("/submitQuiz", authMiddleware, genericController.submitQuiz);
router.post("/clearQuizResult", authMiddleware, genericController.clearQuizResult);

router.post("/deleteCourse", authMiddleware, genericController.deleteCourse);

router.post("/createCourseFromUrls", authMiddleware, youtubeController.createCourseFromUrls);
 



module.exports = router;
