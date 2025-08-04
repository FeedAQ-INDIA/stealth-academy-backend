const {formatDate, formatTime} = require("../utils/dateFormatters");

module.exports = (sequelize, Sequelize) => {
    const CourseUserEnrollmentLog = sequelize.define("course_user_enrollment_log", {
        logId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "log_id",
        },
        userId: {
            type: Sequelize.INTEGER,
            references: {
                model: "user",
                key: "user_id",
            },
            field: "log_user_id",
            allowNull: false,
        },
        courseId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course",
                key: "course_id",
            },
            field: "log_course_id",
            allowNull: false,
        },
        courseContentId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course_content",
                key: "course_content_id",
            },
            field: "log_course_content_id",
        },
        activityType: {
            type: Sequelize.ENUM(
                'ENROLLMENT', 
                'CONTENT_START', 
                'CONTENT_PROGRESS', 
                'CONTENT_COMPLETE',
                'QUIZ_START',
                'QUIZ_SUBMIT',
                'COURSE_COMPLETE',
                'CERTIFICATE_ISSUED',
                'LOGIN',
                'LOGOUT'
            ),
            field: "log_activity_type",
            allowNull: false,
        },
        activityDuration: {
            type: Sequelize.INTEGER,
            field: "log_activity_duration",
            comment: "Duration in seconds",
        },
        progressBefore: {
            type: Sequelize.DECIMAL(5,2),
            field: "log_progress_before"
        },
        progressAfter: {
            type: Sequelize.DECIMAL(5,2),
            field: "log_progress_after"
        },
        deviceInfo: {
            type: Sequelize.STRING(100),
            field: "log_device_info",
        },
        ipAddress: {
            type: Sequelize.STRING(45),
            field: "log_ip_address",
        },
        metadata: {
            type: Sequelize.JSONB,
            field: "log_metadata",
            defaultValue: {}
        },
        v_created_date: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatDate(this.log_created_at);
            },
        },
        v_created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatTime(this.log_created_at);
            },
        },
        v_updated_date: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatDate(this.log_updated_at);
            },
        },
        v_updated_time: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatTime(this.log_updated_at);
            },
        },
    }, {
        timestamps: true,
        createdAt: "log_created_at",
        updatedAt: "log_updated_at",
        indexes: [
            {
                fields: ['log_user_id']
            },
            {
                fields: ['log_course_id']
            },
            {
                fields: ['log_activity_type']
            },
            {
                fields: ['log_created_at']
            },
            {
                fields: ['log_user_id', 'log_course_id']
            }
        ]
    });
    
    return CourseUserEnrollmentLog;
};

