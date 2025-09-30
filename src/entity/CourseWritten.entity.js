const { formatDate, formatTime } = require("../utils/dateFormatters");
module.exports = (sequelize, Sequelize) => {
    const CourseWritten = sequelize.define("course_written", {
        courseWrittenId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "course_written_id",
        },
        userId: {
            type: Sequelize.INTEGER,
            field: "course_written_user_id",
            references: {
                model: "user",
                key: "user_id",
            },
            allowNull: false,
        },
        courseId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course",
                key: "course_id",
            },
            field: "course_written_course_id",
        },
        courseContentId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course_content",
                key: "course_content_id",
            },
            field: "course_written_content_id",
        },
        courseWrittenTitle: {
            type: Sequelize.STRING,
            field: "course_written_title",
        },
        courseWrittenContent: {
            type: Sequelize.TEXT,
            field: "course_written_content",
        }, 
        courseWrittenEmbedUrl: {
            type: Sequelize.STRING(100),
            field: "course_written_embed_url",
        },
        courseWrittenUrlIsEmbeddable: {
            type: Sequelize.BOOLEAN,
            field: "course_written_url_is_embeddable",
        },
        metadata: {
            type: Sequelize.JSONB,
            field: "course_written_metadata",
            defaultValue: {}
        },

        v_created_date: {
            type: Sequelize.VIRTUAL,
            get() {
               return formatDate(this.course_written_created_at)
            },
        },
        v_created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatTime(this.course_written_created_at)
            },
        },

        v_updated_date: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatDate(this.course_written_updated_at)

            },
        },
        v_updated_time: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatTime(this.course_written_updated_at)

            },
        },
    } , {
        timestamps: true,
        createdAt: "course_written_created_at",
        updatedAt: "course_written_updated_at",
    });
    return CourseWritten;
};

