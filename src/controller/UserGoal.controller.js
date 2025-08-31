const UserGoalService = require("../service/UserGoal.service");
const logger = require("../config/winston.config");

async function saveUserGoal(req, res, next) {
    try {
        const userId = req.user.userId;
        const userGoalId = req.params.userGoalId;
        const {
            title,
            description,
            startDate,
            endDate,
            status,
            progress
        } = req.body;

        // Enhanced validation for required fields and data types
        const requiredFields = {
            title: { value: title, type: 'string', maxLength: 200 },
            startDate: { value: startDate, type: 'date' }
        };

        const validationErrors = [];
        
        // Validate required fields and their types
        Object.entries(requiredFields).forEach(([field, config]) => {
            if (!config.value) {
                validationErrors.push(`${field} is required`);
            } else if (config.type === 'date' && isNaN(new Date(config.value).getTime())) {
                validationErrors.push(`${field} must be a valid date`);
            } else if (config.type === 'string' && config.maxLength && config.value.length > config.maxLength) {
                validationErrors.push(`${field} must not exceed ${config.maxLength} characters`);
            }
        });

        // Validate progress value if provided
        if (progress !== undefined && (progress < 0 || progress > 100)) {
            validationErrors.push('Progress must be between 0 and 100');
        }

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        const goalData = {
            userId,
            title,
            description,
            startDate,
            endDate,
            status,
            progress
        };

        let goal;
        if (userGoalId) {
            goalData.userGoalId = userGoalId;
            goal = await UserGoalService.updateGoal(goalData);
        } else {
            goal = await UserGoalService.createGoal(goalData);
        }

        res.status(userGoalId ? 200 : 201).json({
            success: true,
            message: `Goal ${userGoalId ? 'updated' : 'created'} successfully`,
            data: goal
        });

    } catch (error) {
        logger.error(`Error in saveUserGoal: ${error.message}`);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

async function getUserGoals(req, res, next) {
    try {
        const userId = req.user.userId;
        const { 
            status, 
            startDate, 
            endDate, 
            actualStartFrom,
            actualStartTo,
            actualEndFrom,
            actualEndTo,
            progress,
            sortBy,
            sortOrder,
            page = 1,
            limit = 10,
            searchTerm
        } = req.query;

        // Validate query parameters
        const allowedSortFields = ['createdAt', 'startDate', 'endDate', 'actualStartDate', 'actualEndDate', 'progress', 'title'];
        if (sortBy && !allowedSortFields.includes(sortBy)) {
            return res.status(400).json({
                success: false,
                message: `Invalid sort field. Allowed fields: ${allowedSortFields.join(', ')}`
            });
        }

        const offset = (page - 1) * limit;

        const goals = await UserGoalService.getUserGoals({
            userId,
            status,
            startDate,
            endDate,
            actualStartFrom,
            actualStartTo,
            actualEndFrom,
            actualEndTo,
            progress: progress ? parseInt(progress) : undefined,
            sortBy,
            sortOrder: sortOrder?.toUpperCase(),
            limit: parseInt(limit),
            offset,
            searchTerm
        });

        res.status(200).json({
            success: true,
            data: goals,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: goals.length
            }
        });

    } catch (error) {
        logger.error(`Error in getUserGoals: ${error.message}`);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = {
    saveUserGoal,
    getUserGoals
};
