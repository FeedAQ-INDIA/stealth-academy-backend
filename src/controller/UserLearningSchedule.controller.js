// --- UserLearningSchedule CRUD and Query ---
const db = require("../entity/index.js");
const jwt = require("jsonwebtoken");
const lodash = require("lodash");
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const logger = require("../config/winston.config");
 

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

    if (!userId || !learningItemId || !learningItemType || !title || !scheduledStartDate || !scheduledEndDate) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    let entry;
    if (userLearningScheduleId) {
      entry = await db.UserLearningSchedule.findByPk(userLearningScheduleId);
      if (!entry) return res.status(404).json({ success: false, message: "Entry not found." });
      await entry.update({
        userId,
        learningItemId,
        learningItemType,
        title,
        description,
        scheduledLink,
        scheduledStartDate,
        scheduledEndDate,
        metadata
      });
    } else {
      entry = await db.UserLearningSchedule.create({
        userId,
        learningItemId,
        learningItemType,
        title,
        description,
        scheduledLink,
        scheduledStartDate,
        scheduledEndDate,
        metadata
      });
    }
    return res.json({ success: true, data: entry });
  } catch (error) {
    logger.error("Error in createOrUpdateUserLearningSchedule:", error);
    return res.status(500).json({ success: false, message: error.message });
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
