const express = require("express");
const router = express.Router();
const userGoalController = require("../controller/UserGoal.controller");
const authMiddleware = require("../middleware/authMiddleware");
const publicauthenticationMiddleware = require("../middleware/publicMiddleware");

// Create new goal
router.post("/goal/createOrUpdate", authMiddleware, userGoalController.saveUserGoal);

 
// Get user's goals with optional filters
router.post("/goal/search", authMiddleware, userGoalController.getUserGoals);

module.exports = router;
