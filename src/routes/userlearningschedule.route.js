// UserLearningSchedule.routes.js
// Routes for UserLearningSchedule CRUD operations

const express = require("express");
const router = express.Router();
const userLearningScheduleController = require("../controller/UserLearningSchedule.controller");
const authMiddleware = require("../middleware/authMiddleware");
const publicauthenticationMiddleware = require("../middleware/publicMiddleware");

// Create or update
router.post("/createOrUpdateUserLearningSchedule", authMiddleware, userLearningScheduleController.createOrUpdateUserLearningSchedule);

// Delete
router.post("/deleteUserLearningSchedule/:id", authMiddleware, userLearningScheduleController.deleteUserLearningSchedule);

// Get by userId and date/date range
router.post("/getUserLearningSchedule", authMiddleware, userLearningScheduleController.getUserLearningScheduleByUserAndDate);

module.exports = router;
