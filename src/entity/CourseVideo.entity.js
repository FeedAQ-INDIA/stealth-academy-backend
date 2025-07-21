const { formatDate, formatTime } = require("../utils/dateFormatters");

module.exports = (sequelize, Sequelize) => {
    const CourseVideo = sequelize.define("course_video", {
        courseVideoId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "course_video_id",
        },
        courseId: {
            type: Sequelize.INTEGER,
            field: "course_video_course_id",
            allowNull: false,
        },
        courseContentId: {
            type: Sequelize.INTEGER,
            field: "course_video_content_id",
            allowNull: false,
        },
        userId: {
            type: Sequelize.INTEGER,
            field: "course_video_user_id",
            allowNull: false,
        },
        courseVideoTitle: {
            type: Sequelize.STRING(200),
            field: "course_video_title",
            allowNull: false,
        },
        courseVideoDescription: {
            type: Sequelize.TEXT,
            field: "course_video_description",
        },
        courseVideoUrl: {
            type: Sequelize.STRING(500),
            field: "course_video_url",
            allowNull: false,
        },
        duration: {
            type: Sequelize.INTEGER, // in seconds
            field: "course_video_duration",
            allowNull: false,
            defaultValue: 0,
        },
        thumbnailUrl: {
            type: Sequelize.STRING(500),
            field: "course_video_thumbnail_url",
        },
        isPreview: {
            type: Sequelize.BOOLEAN,
            field: "course_video_is_preview",
            defaultValue: false
        },
        status: {
            type: Sequelize.ENUM("PENDING", "PROCESSING", "READY", "FAILED"),
            field: "course_video_status",
            defaultValue: "PENDING"
        },
        metadata: {
            type: Sequelize.JSONB,
            field: "course_video_metadata",
            defaultValue: {}
        },
        v_created_date: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatDate(this.course_video_created_at);
            },
        },
        v_created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatTime(this.course_video_created_at);
            },
        },
        v_updated_date: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatDate(this.course_video_updated_at);
            },
        },
        v_updated_time: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatTime(this.course_video_updated_at);
            },
        },
        v_duration_formatted: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.duration) return '00:00';
                const minutes = Math.floor(this.duration / 60);
                const seconds = this.duration % 60;
                return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }
    }, {
        timestamps: true,
        createdAt: "course_video_created_at",
        updatedAt: "course_video_updated_at",
        paranoid: true, // Enable soft deletes
        indexes: [
            {
                fields: ['course_video_course_id']
            },
            {
                fields: ['course_video_content_id']
            },
            {
                fields: ['course_video_status']
            },
            {
                fields: ['course_video_is_preview']
            }
        ],

    });



    return CourseVideo;
};

