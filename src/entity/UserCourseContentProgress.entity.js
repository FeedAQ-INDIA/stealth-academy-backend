const {formatDate, formatTime} = require("../utils/dateFormatters");

module.exports = (sequelize, Sequelize) => {
    const UserCourseContentProgress = sequelize.define("user_course_content_progress", {
        progressId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "user_course_content_progress_id",
        },
        userId: {
            type: Sequelize.INTEGER,
            references: {
                model: "user",
                key: "user_id",
            },
            field: "user_course_content_progress_user_id",
            allowNull: false,
        },
        courseId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course",
                key: "course_id",
            },
            field: "user_course_content_progress_course_id",
            allowNull: false,
        },
        courseContentId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course_content",
                key: "course_content_id",
            },
            field: "user_course_content_progress_course_content_id",
        },
        progressStatus: {
            type: Sequelize.ENUM(
                'ENROLLED','IN_PROGRESS','PAUSED', 'COMPLETED', 'CERTIFIED', 'CERTIFICATE_ISSUED', 
            ),
            field: "user_course_content_progress_status",
            allowNull: false,
        },
        activityDuration: {
            type: Sequelize.INTEGER,
            field: "user_course_content_progress_activity_duration",
            comment: "Duration in seconds",
        }, 
        progressPercent: {
            type: Sequelize.DECIMAL(5,2),
            field: "user_course_content_progress_percent"
        },
        metadata: {
            type: Sequelize.JSONB,
            field: "user_course_content_progress_metadata",
            defaultValue: {}
        },
        v_created_date: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatDate(this.user_course_content_progress_created_at);
            },
        },
        v_created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatTime(this.user_course_content_progress_created_at);
            },
        },
        v_updated_date: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatDate(this.user_course_content_progress_updated_at);
            },
        },
        v_updated_time: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatTime(this.user_course_content_progress_updated_at);
            },
        },
    }, {
        timestamps: true,
        createdAt: "user_course_content_progress_created_at",
        updatedAt: "user_course_content_progress_updated_at",
        indexes: [
            {
                name: 'idx_ucp_user_id',
                fields: ['user_course_content_progress_user_id']
            },
            {
                name: 'idx_ucp_course_id',
                fields: ['user_course_content_progress_course_id']
            },
            {
                name: 'idx_ucp_created_at',
                fields: ['user_course_content_progress_created_at']
            },
            {
                name: 'idx_ucp_user_course',
                fields: ['user_course_content_progress_user_id', 'user_course_content_progress_course_id']
            }
        ]
    });
    
    return UserCourseContentProgress;
};

