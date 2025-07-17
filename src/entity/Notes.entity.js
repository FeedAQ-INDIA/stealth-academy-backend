const {formatDate, formatTime} = require("../utils/dateFormatters");
module.exports = (sequelize, Sequelize) => {
    const Notes = sequelize.define(
        "notes",
        {
            notesId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "notes_id",
            },
            userId: {
                type: Sequelize.INTEGER,
                field: "notes_user_id",
                references: {
                    model: "user",
                    key: "user_id",
                },
                allowNull: false,
            },
            courseContentId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "course_content",
                    key: "course_content_id",
                },
                field: "notes_course_content_id",
            },
            courseId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "course",
                    key: "course_id",
                },
                field: "notes_course_id",
            },

            notesText: {
                type: Sequelize.TEXT,
                field: "notes_text",
                allowNull: false,
            },
            v_created_date: {
                type: Sequelize.VIRTUAL,
                get() {
                    return formatDate(this.notes_created_at)

                },
            },
            v_created_time: {
                type: Sequelize.VIRTUAL,
                get() {
                    return formatTime(this.notes_created_at)

                },
            },

            v_updated_date: {
                type: Sequelize.VIRTUAL,
                get() {
                    return formatDate(this.notes_updated_at)

                },
            },
            v_updated_time: {
                type: Sequelize.VIRTUAL,
                get() {
                    return formatTime(this.notes_updated_at)
                },
            },
        },
        {
            timestamps: true,
            createdAt: "notes_created_at",
            updatedAt: "notes_updated_at",
        }
    );
    return Notes;
};
