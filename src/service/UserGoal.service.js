const db = require("../entity/index.js");
const logger = require("../config/winston.config.js");
const { Op } = require("sequelize");

const createGoal = async (params) => {
    const {
        userId,
        title,
        description,
        startDate,
        endDate,
        status = 'NOT_STARTED',
        progress = 0
    } = params;

    try {
        // Enhanced date validation
        if (startDate || endDate) {
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            const now = new Date();

            if (start && end && end < start) {
                throw new Error('End date cannot be before start date');
            }
            if (start && start < now) {
                throw new Error('Start date cannot be in the past');
            }
        }

        // Determine actual dates based on status
        let actualStartDate = null;
        let actualEndDate = null;
        let finalProgress = progress;

        switch(status) {
            case 'IN_PROGRESS':
                actualStartDate = new Date();
                break;
            case 'COMPLETED':
                actualStartDate = startDate || new Date();
                actualEndDate = new Date();
                finalProgress = 100;
                break;
            case 'ABANDONED':
                actualStartDate = startDate || new Date();
                actualEndDate = new Date();
                break;
        }

        // Create goal with enhanced fields
        const goal = await db.UserGoal.create({
            userId,
            title,
            description,
            startDate: startDate || null,
            endDate: endDate || null,
            status,
            progress: finalProgress,
            actualStartDate,
            actualEndDate
        });

        logger.info(`Goal created successfully for user ${userId}`);
        return goal;
    } catch (error) {
        logger.error(`Error creating goal: ${error.message}`);
        throw error;
    }
};

const updateGoal = async (params) => {
    const {
        userGoalId,
        userId,
        title,
        description,
        startDate,
        endDate,
        status,
        progress
    } = params;

    try {
        const goal = await db.UserGoal.findOne({
            where: {
                userGoalId,
                userId
            }
        });

        if (!goal) {
            throw new Error('Goal not found or user not authorized');
        }

        // Validate dates if being updated
        if (startDate || endDate) {
            const start = startDate ? new Date(startDate) : goal.startDate;
            const end = endDate ? new Date(endDate) : goal.endDate;
            
            if (start && end && end < start) {
                throw new Error('End date cannot be before start date');
            }
        }

        // Handle status transitions, progress and actual dates
        let updateData = {
            title: title || goal.title,
            description: description || goal.description,
            startDate: startDate || goal.startDate,
            endDate: endDate || goal.endDate,
            status: status || goal.status,
            progress: progress !== undefined ? progress : goal.progress,
            actualStartDate: goal.actualStartDate,
            actualEndDate: goal.actualEndDate
        };

        // Handle status transitions and actual dates
        if (status && status !== goal.status) {
            switch(status) {
                case 'IN_PROGRESS':
                    if (!updateData.actualStartDate) {
                        updateData.actualStartDate = new Date();
                    }
                    updateData.actualEndDate = null; // Reset end date if restarting
                    break;
                case 'COMPLETED':
                    if (!updateData.actualStartDate) {
                        updateData.actualStartDate = new Date();
                    }
                    updateData.actualEndDate = new Date();
                    updateData.progress = 100;
                    break;
                case 'ABANDONED':
                    if (!updateData.actualStartDate) {
                        updateData.actualStartDate = goal.startDate || new Date();
                    }
                    updateData.actualEndDate = new Date();
                    break;
                case 'NOT_STARTED':
                    // Reset actual dates if moving back to not started
                    updateData.actualStartDate = null;
                    updateData.actualEndDate = null;
                    updateData.progress = 0;
                    break;
            }
        }

        // Validate date consistency
        const dates = {
            start: updateData.startDate,
            end: updateData.endDate,
            actualStart: updateData.actualStartDate,
            actualEnd: updateData.actualEndDate
        };

        if (dates.actualStart && dates.actualEnd && dates.actualEnd < dates.actualStart) {
            throw new Error('Actual end date cannot be before actual start date');
        }

        if (status === 'IN_PROGRESS' && goal.status === 'NOT_STARTED') {
            updateData.actualStartDate = new Date();
        } else if (status === 'COMPLETED' && goal.status !== 'COMPLETED') {
            updateData.actualEndDate = new Date();
        }

        await goal.update(updateData);
        
        logger.info(`Goal ${userGoalId} updated successfully for user ${userId}`);
        return await db.UserGoal.findByPk(userGoalId);
    } catch (error) {
        logger.error(`Error updating goal: ${error.message}`);
        throw error;
    }
};

const getUserGoals = async (params) => {
    const {
        userId,
        status,
        startDate,
        endDate,
        progress,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        limit = 10,
        offset = 0,
        searchTerm
    } = params;

    try {
        let whereClause = { userId };

        if (status) {
            whereClause.status = status;
        }

        // Handle planned date range filtering
        if (startDate && endDate) {
            whereClause.startDate = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        // Handle actual date filtering
        if (params.actualStartFrom || params.actualStartTo) {
            whereClause.actualStartDate = {};
            if (params.actualStartFrom) {
                whereClause.actualStartDate[Op.gte] = new Date(params.actualStartFrom);
            }
            if (params.actualStartTo) {
                whereClause.actualStartDate[Op.lte] = new Date(params.actualStartTo);
            }
        }

        if (params.actualEndFrom || params.actualEndTo) {
            whereClause.actualEndDate = {};
            if (params.actualEndFrom) {
                whereClause.actualEndDate[Op.gte] = new Date(params.actualEndFrom);
            }
            if (params.actualEndTo) {
                whereClause.actualEndDate[Op.lte] = new Date(params.actualEndTo);
            }
        }

        if (progress !== undefined) {
            whereClause.progress = {
                [Op.gte]: progress
            };
        }

        if (searchTerm) {
            whereClause = {
                ...whereClause,
                [Op.or]: [
                    { title: { [Op.like]: `%${searchTerm}%` } },
                    { description: { [Op.like]: `%${searchTerm}%` } }
                ]
            };
        }

        const goals = await db.UserGoal.findAll({
            where: whereClause,
            order: [[sortBy, sortOrder]],
            limit,
            offset,
        });

        logger.info(`Retrieved ${goals.length} goals for user ${userId}`);
        return goals;
    } catch (error) {
        logger.error(`Error fetching goals: ${error.message}`);
        throw error;
    }
};

module.exports = {
    createGoal,
    updateGoal,
    getUserGoals
};
