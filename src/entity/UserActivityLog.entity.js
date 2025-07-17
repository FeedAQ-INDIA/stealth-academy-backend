const {formatDate, formatTime} = require("../utils/dateFormatters");

module.exports = (sequelize, Sequelize) => {
    const UserActivityLog = sequelize.define("user_activity_log", {
        userActivityLogId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "user_activity_log_id",
        },
        userId: {
            type: Sequelize.INTEGER,
            references: {
                model: "user",
                key: "user_id",
            },
            field: "user_activity_log_user_id",
        },
        courseId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course",
                key: "course_id",
            },
            field: "user_activity_log_course_id",
        },
        courseContentId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course_content",
                key: "course_content_id",
            },
            field: "user_activity_log_course_content_id",
        },
        enrollmentStatus: {
            type: Sequelize.ENUM('NOT STARTED','IN PROGRESS','PAUSED', 'COMPLETED'),
            field: "user_activity_log_status",
        },
        v_created_date: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatDate(this.user_activity_log_created_at)

            },
        },
        v_created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatTime(this.user_activity_log_created_at)

            },
        },

        v_updated_date: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatDate(this.user_activity_log_updated_at)

            },
        },
        v_updated_time: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatTime(this.user_activity_log_updated_at)

            },
        },
    } , {
        timestamps: true,
        createdAt: "user_activity_log_created_at",
        updatedAt: "user_activity_log_updated_at",
    });
    return UserActivityLog;
};

