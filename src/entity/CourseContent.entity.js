const { formatDate, formatTime } = require("../utils/dateFormatters");

module.exports = (sequelize, Sequelize) => {
    const CourseContent = sequelize.define("course_content", {
        courseContentId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "course_content_id",
        },
        courseId: {
            type: Sequelize.INTEGER,
            field: "course_content_course_id",
            allowNull: false,
            references: {
                model: "course",
                key: "course_id",
            },
        },
        courseContentTitle: {
            type: Sequelize.STRING(200),
            field: "course_content_title",
            allowNull: false,
        },
        courseContentType: {
            type: Sequelize.ENUM(
                'CourseVideo', 
                'CourseWritten', 
                'CourseQuiz'
            ),
            field: "course_content_type",
            allowNull: false,
        },
        courseSourceMode: {
            type: Sequelize.ENUM("YOUTUBE", "COMPANY"),
            field: "course_content_source_mode",
            allowNull: false,
        },
        courseContentSequence: {
            type: Sequelize.INTEGER,
            field: "course_content_seq",
            allowNull: false
        },
        coursecontentIsLicensed: {
            type: Sequelize.BOOLEAN,
            field: "course_content_is_licensed",
            allowNull: false,
            defaultValue: false
        },
        courseContentDuration: {
            type: Sequelize.INTEGER,
            field: "course_content_duration",
            allowNull: false
        },
        isActive: {
            type: Sequelize.BOOLEAN,
            field: "course_content_is_active",
            allowNull: false,
            defaultValue: true
        },
        metadata: {
            type: Sequelize.JSONB,
            field: "course_content_metadata",
            allowNull: true,
            defaultValue: {}
        },
        v_created_date: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatDate(this.course_content_created_at);
            },
        },
        v_created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatTime(this.course_content_created_at);
            },
        },
        v_updated_date: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatDate(this.course_content_updated_at);
            },
        },
        v_updated_time: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatTime(this.course_content_updated_at);
            },
        },
    }, {
        timestamps: true,
        createdAt: "course_content_created_at",
        updatedAt: "course_content_updated_at",
        deletedAt: "course_content_deleted_at",
        paranoid: true, // Enable soft deletes
        indexes: [
            {
                fields: ['course_content_course_id']
            },
            {
                fields: ['course_content_seq']
            },
            {
                unique: true,
                fields: ['course_content_course_id', 'course_content_seq']
            }
        ]
    });
 

    return CourseContent;
};

