const {QueryTypes} = require("sequelize");
const db = require("../entity/index.js");
const lodash = require("lodash");
const logger = require("../config/winston.config.js");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const {toJSON} = require("lodash/seq");
const DynamicService = require("./DynamicService.service");

 


const createOrUpdateSchedule = async (params) => {
      const {
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
        } = params;
        
        try {
      

        // Validate dates
        const startDate = new Date(scheduledStartDate);
        const endDate = new Date(scheduledEndDate);
        if (endDate < startDate) {
            throw new Error('End date cannot be before start date');
        }

        let schedule;
        if (userLearningScheduleId) {
            // Update existing schedule
            schedule = await db.UserLearningSchedule.update({
                userId,
                learningItemId,
                learningItemType,
                title,
                description,
                scheduledLink,
                scheduledStartDate,
                scheduledEndDate,
                metadata
            }, {
                where: { userLearningScheduleId: userLearningScheduleId },
                returning: true
            });
            
            if (!schedule[0]) {
                throw new Error('Schedule not found');
            }
            schedule = schedule[1][0]; // Get the updated record
        } else {
            // Create new schedule
            schedule = await db.UserLearningSchedule.create({
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

        return {
            success: true,
            message: `Schedule ${userLearningScheduleId ? 'updated' : 'created'} successfully`,
            data: schedule
        };
    } catch (error) {
            console.log(error)
        logger.error('Error in createOrUpdateSchedule:', error);
        throw new Error(`Failed to ${userLearningScheduleId ? 'update' : 'create'} schedule: ${error.message}`);
    }
};

const deleteSchedule = async (scheduleId, userId) => {
    try {
        const schedule = await db.UserLearningSchedule.findOne({
            where: { id: scheduleId, userId }
        });

        if (!schedule) {
            throw new Error('Schedule not found or unauthorized');
        }

        await schedule.destroy();
        return {
            success: true,
            message: 'Schedule deleted successfully'
        };
    } catch (error) {
        logger.error('Error in deleteSchedule:', error);
        throw new Error(`Failed to delete schedule: ${error.message}`);
    }
};

const getScheduleByDateRange = async (userId, startDate, endDate) => {
    try {
        const where = { userId };
        if (startDate && endDate) {
            where.scheduledStartDate = { [db.Sequelize.Op.between]: [startDate, endDate] };
        }

        const schedules = await db.UserLearningSchedule.findAll({
            where,
            order: [['scheduledStartDate', 'ASC']]
        });

        return {
            success: true,
            data: schedules
        };
    } catch (error) {
        logger.error('Error in getScheduleByDateRange:', error);
        throw new Error(`Failed to fetch schedules: ${error.message}`);
    }
};

 
 

module.exports = {
     deleteSchedule,
 getScheduleByDateRange,
 createOrUpdateSchedule
 };

