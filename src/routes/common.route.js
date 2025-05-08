const express = require("express");
const router = express.Router();
const genericController = require("../controller/Generic.controller.js");
 const authMiddleware = require("../middleware/authMiddleware");
 const logger = require('../config/winston.config.js')

router.get("/ping", function (req, res) {
    res.status(200).send({message: "Ping Successful"});
});

 router.post("/getUser", authMiddleware, genericController.getUser);

router.post("/searchCourse", authMiddleware, genericController.searchRecord);
router.post("/enrollStatus", authMiddleware, genericController.enrollStatus);
router.post("/enroll", authMiddleware, genericController.enrollUserCourse);
router.post("/disroll", authMiddleware, genericController.disrollUserCourse);
router.post("/saveUserDetail", authMiddleware, genericController.saveUserDetail);
router.post("/getCourseDetail", authMiddleware, genericController.getCourseDetail);
router.post("/saveNote", authMiddleware, genericController.saveNote);
router.post("/deleteNote", authMiddleware, genericController.deleteNote);
router.post("/saveUserEnrollmentData", authMiddleware, genericController.saveUserEnrollmentData);
router.post("/deleteUserEnrollmentData", authMiddleware, genericController.deleteUserEnrollmentData);
router.post("/submitQuiz", authMiddleware, genericController.submitQuiz);
router.post("/clearQuizResult", authMiddleware, genericController.clearQuizResult);

router.post("/raiseInterviewRequest", authMiddleware, genericController.raiseInterviewRequest);


module.exports = router;
