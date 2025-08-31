// UserGoal.entity.js
// Entity for managing user's learning and career goals

 
module.exports = (sequelize, Sequelize) => {
    const UserGoal = sequelize.define("user_goal", {
        userGoalId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "user_goal_id"
        },
        userId: {
            type: Sequelize.INTEGER,
            field: "goal_user_id",
            allowNull: false,
            references: {
                model: "user",
                key: "user_id"
            }
        },
        title: {
            type: Sequelize.STRING(200),
            field: "goal_title",
            allowNull: false
        },
        description: {
            type: Sequelize.TEXT,
            field: "goal_description",
            allowNull: true
        },
        startDate: {
            type: Sequelize.DATE,
            field: "goal_start_date",
            allowNull: true,
        },
        actualStartDate: {
            type: Sequelize.DATE,
            field: "goal_actual_start_date",
            allowNull: true,
        },
        endDate: {
            type: Sequelize.DATE,
            field: "goal_end_date",
            allowNull: true,
        },
        actualEndDate: {
            type: Sequelize.DATE,
            field: "goal_actual_end_date",
            allowNull: true,
        },
        status: {
            type: Sequelize.ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED'),
            field: "goal_status",
            defaultValue: 'NOT_STARTED'
        },
        progress: {
            type: Sequelize.INTEGER,
            field: "goal_progress",
            allowNull: false,
            defaultValue: 0
        },
        createdAt: {
            type: Sequelize.DATE,
            field: "goal_created_at",
            defaultValue: Sequelize.NOW
        },
        updatedAt: {
            type: Sequelize.DATE,
            field: "goal_updated_at",
            defaultValue: Sequelize.NOW
        }
    }, {
        tableName: "user_goal",
        timestamps: true,
        createdAt: "goal_created_at",
        updatedAt: "goal_updated_at"
    });

    return UserGoal;
};
