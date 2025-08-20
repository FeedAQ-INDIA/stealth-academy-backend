const express = require("express");
const router = express.Router();
const genericController = require("../controller/Generic.controller.js");
const authMiddleware = require("../middleware/authMiddleware");
 
const { validate } = require("../middleware/validate.middleware.js");

const publicauthenticationMiddleware = require("../middleware/publicMiddleware");
 const logger = require('../config/winston.config.js')

router.get("/ping", function (req, res) {
    res.status(200).send({message: "Ping Successful"});
});

router.post("/getUser", authMiddleware, genericController.getUser);


// router.all("/dynamic/:entity/:operation",  genericController.dynamicApi);
router.post("/search",  genericController.searchRecord);
router.post("/processWritingConfig",  genericController.processWritingConfig); 
router.post("/getWritingPrompts", genericController.getWritingPrompts);
// New route to save a writing prompt
router.post("/saveWritingPrompt", genericController.saveWritingPrompt); 
// resfresh question 
router.post("/getNextWritingPrompt", genericController.getNextWritingPrompt);
// save data in writingsubmission 
// common.route.js
router.post("/saveWritingSubmission", genericController.saveWritingSubmission);

// --- New route for saving ReadingTopic ---
router.post("/saveReadingTopic", genericController.saveReadingTopic);
// --- New route for getting a ReadingTopic ---
router.post("/getReadingTopic", genericController.getReadingTopic);
// --- New route for getting the next ReadingTopic ---
router.post("/getNextReadingTopic", genericController.getNextReadingTopic);

router.post("/saveReadingSubmission", genericController.saveReadingSubmission);

//  --- New route for saving SpeakingTopic ---
router.post("/saveSpeakingTopic", genericController.saveSpeakingTopic);

// upload audio file to supabase 
router.post(
    "/uploadAudio", 
    genericController.upload.single('audio'), 
    genericController.uploadAudio
);

// --- New route for getting a SpeakingTopic ---
router.post("/getSpeakingTopic", genericController.getSpeakingTopic);
//  --- New route for saving SpeakingTopic ---
router.post("/saveSpeakingTopic", genericController.saveSpeakingTopic);
// --- New route for getting the next SpeakingTopic ---
router.post("/getNextSpeakingTopic", genericController.getNextSpeakingTopic);

router.post(
    "/uploadSpeakingAudio", 
    genericController.upload.single('audio'), 
    genericController.uploadSpeakingAudioFile
);
router.post("/getGeminiResponse", genericController.getGeminiResponse);
router.post("/saveTopicSelect", genericController.saveTopicSelect);
module.exports = router;
