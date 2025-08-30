// --- UserLearningSchedule CRUD and Query ---
const db = require("../entity/index.js");
const jwt = require("jsonwebtoken");
const lodash = require("lodash");
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const logger = require("../config/winston.config");
const UserLearningScheduleService= require('../service/UserLearningSchedule.service');

// Create or update a user learning schedule entry
async function createOrUpdateUserLearningSchedule(req, res, next) {
  try {
    const {
      userLearningScheduleId,
      learningItemId,
      learningItemType,
      title,
      description,
      scheduledLink,
      scheduledStartDate,
      scheduledEndDate,
      metadata
    } = req.body;

    const userId = req.user.userId;

    // Enhanced validation
    const requiredFields = {
      // learningItemId,
      // learningItemType,
      title,
      scheduledStartDate,
      scheduledEndDate
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([field]) => field);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        fields: missingFields
      });
    }

    // Validate learning item type
    const validTypes = ['COURSE', 'VIDEO', 'ARTICLE', 'QUIZ', 'PRACTICE'];
    if (learningItemType && learningItemId && !validTypes.includes(learningItemType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid learning item type. Must be one of: ${validTypes.join(', ')}`
      });
    }

 

    const scheduleData = {
      userLearningScheduleId,
      userId,
      learningItemId,
      learningItemType,
      title,
      description,
      scheduledLink,
      scheduledStartDate,
      scheduledEndDate,
      metadata
    };

    const result = await UserLearningScheduleService.createOrUpdateSchedule(scheduleData);
    return res.status(200).json(result);

  } catch (error) {
    console.log(error)
    logger.error("Error in createOrUpdateUserLearningSchedule:", error);
    
    if (error.message.includes('Schedule conflicts')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: "An error occurred while processing your request",
      error: error.message
    });
  }
}

// Delete a user learning schedule entry
async function deleteUserLearningSchedule(req, res, next) {
  try {
    const { id } = req.body;
    const entry = await db.UserLearningSchedule.findByPk(id);
    if (!entry) return res.status(404).json({ success: false, message: "Entry not found." });
    await entry.destroy();
    return res.json({ success: true, message: "Entry deleted." });
  } catch (error) {
    logger.error("Error in deleteUserLearningSchedule:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// Get entries by userId and date (optionally date range)
async function getUserLearningScheduleByUserAndDate(req, res, next) {
  try {
     const userId = req.user.userId;
    const { date, startDate, endDate } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: "userId is required." });
    let where = { userId };
    if (date) {
      where.scheduledStartDate = date;
    } else if (startDate && endDate) {
      where.scheduledStartDate = { [db.Sequelize.Op.between]: [startDate, endDate] };
    }
    const entries = await db.UserLearningSchedule.findAll({ where });
    return res.json({ success: true, data: entries });
  } catch (error) {
    logger.error("Error in getUserLearningScheduleByUserAndDate:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
 
module.exports = {
 
  createOrUpdateUserLearningSchedule,
  deleteUserLearningSchedule,
  getUserLearningScheduleByUserAndDate,
};
