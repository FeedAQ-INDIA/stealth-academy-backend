const {formatDate, formatTime} = require("../utils/dateFormatters");

module.exports = (sequelize, Sequelize) => {
    const UserCourseContentLog = sequelize.define("user_course_content_log", {
        logId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "user_course_content_log_id",
        },
        userId: {
            type: Sequelize.INTEGER,
            references: {
                model: "user",
                key: "user_id",
            },
            field: "user_course_content_log_user_id",
            allowNull: false,
        },
        courseId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course",
                key: "course_id",
            },
            field: "user_course_content_log_course_id",
            allowNull: false,
        },
        courseContentId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course_content",
                key: "course_content_id",
            },
            field: "user_course_content_log_course_content_id",
        },
        logStatus: {
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
            field: "user_course_content_log_status",
            allowNull: false,
        },
        activityDuration: {
            type: Sequelize.INTEGER,
            field: "user_course_content_log_activity_duration",
            comment: "Duration in seconds",
        },
        progressBefore: {
            type: Sequelize.DECIMAL(5,2),
            field: "user_course_content_log_progress_before"
        },
        progressAfter: {
            type: Sequelize.DECIMAL(5,2),
            field: "user_course_content_log_progress_after"
        },
        deviceInfo: {
            type: Sequelize.STRING(100),
            field: "user_course_content_log_device_info",
        },
        ipAddress: {
            type: Sequelize.STRING(45),
            field: "user_course_content_log_ip_address",
        },
        metadata: {
            type: Sequelize.JSONB,
            field: "user_course_content_log_metadata",
            defaultValue: {}
        },
        v_created_date: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatDate(this.user_course_content_log_created_at);
            },
        },
        v_created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatTime(this.user_course_content_log_created_at);
            },
        },
        v_updated_date: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatDate(this.user_course_content_log_updated_at);
            },
        },
        v_updated_time: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatTime(this.user_course_content_log_updated_at);
            },
        },
    }, {
        timestamps: true,
        createdAt: "user_course_content_log_created_at",
        updatedAt: "user_course_content_log_updated_at",
        indexes: [
            {
                fields: ['user_course_content_log_user_id']
            },
            {
                fields: ['user_course_content_log_course_id']
            },
            {
                fields: ['user_course_content_log_activity_type']
            },
            {
                fields: ['user_course_content_log_created_at']
            },
            {
                fields: ['user_course_content_log_user_id', 'user_course_content_log_course_id']
            }
        ]
    });
    
    return UserCourseContentLog;
};

