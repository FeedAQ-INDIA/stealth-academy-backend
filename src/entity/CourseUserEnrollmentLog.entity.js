const {formatDate, formatTime} = require("../utils/dateFormatters");

module.exports = (sequelize, Sequelize) => {
    const CourseUserEnrollmentLog = sequelize.define("cue_log", {
        cueLogId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "cue_log_id",
        },
        userId: {
            type: Sequelize.INTEGER,
            references: {
                model: "user",
                key: "user_id",
            },
            field: "cue_log_user_id",
        },
        courseId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course",
                key: "course_id",
            },
            field: "cue_log_course_id",
        },
        courseContentId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course_content",
                key: "course_content_id",
            },
            field: "cue_log_course_content_id",
        },
        enrollmentStatus: {
            type: Sequelize.ENUM('NOT STARTED','IN PROGRESS','PAUSED', 'COMPLETED'),
            field: "cue_log_status",
        },
        v_created_date: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatDate(this.cue_log_created_at)
            },
        },
        v_created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatTime(this.cue_log_created_at)
            },
        },

        v_updated_date: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatDate(this.cue_log_updated_at)
            },
        },
        v_updated_time: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatTime(this.cue_log_updated_at)
            },
        },
    } , {
        timestamps: true,
        createdAt: "cue_log_created_at",
        updatedAt: "cue_log_updated_at",
    });
    return CourseUserEnrollmentLog;
};

