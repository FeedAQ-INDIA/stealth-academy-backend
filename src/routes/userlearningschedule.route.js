const express = require("express");
const router = express.Router();
const userLearningScheduleController = require("../controller/UserLearningSchedule.controller");
const authMiddleware = require("../middleware/authMiddleware");
const publicauthenticationMiddleware = require("../middleware/publicMiddleware");

// Create new schedule
router.post("/schedule/create", authMiddleware, userLearningScheduleController.createOrUpdateUserLearningSchedule);

// Update existing schedule
router.post("/schedule/update", authMiddleware, userLearningScheduleController.createOrUpdateUserLearningSchedule);

// Delete schedule
router.post("/schedule/delete", authMiddleware, userLearningScheduleController.deleteUserLearningSchedule);

// Get user's schedule by date range
router.post("/schedule/search", authMiddleware, userLearningScheduleController.getUserLearningScheduleByUserAndDate);


module.exports = router;
