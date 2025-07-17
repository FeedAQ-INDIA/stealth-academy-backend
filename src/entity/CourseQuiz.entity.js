const {formatDate, formatTime} = require("../utils/dateFormatters");

module.exports = (sequelize, Sequelize) => {
    const CourseQuiz = sequelize.define("course_quiz", {
        courseQuizId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "course_quiz_id",
        },
        courseQuizDescription: {
            type: Sequelize.TEXT,
            field: "course_quiz_description",
        },
        courseQuizType: {
            type: Sequelize.ENUM('CERTIFICATION', 'KNOWLEDGE CHECK'),
            field: "course_quiz_type",
            allowNull: false,
        },
        isQuizTimed: {
            type: Sequelize.BOOLEAN,
            field: "course_is_quiz_timed",
            allowNull: false,
        },
        courseQuizTimer: {
            type: Sequelize.INTEGER,
            field: "course_quiz_timer",
        },
        courseQuizPassPercent: {
            type: Sequelize.INTEGER,
            field: "course_quiz_pass_percent",
        },
        courseContentId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course_content",
                key: "course_content_id",
            },
            field: "course_quiz_content_id",
        },
        courseId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course",
                key: "course_id",
            },
            field: "course_quiz_course_id",
        },
        v_created_date: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatDate(this.course_quiz_created_at)

            },
        },
        v_created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatTime(this.course_quiz_created_at)

            },
        },

        v_updated_date: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatDate(this.course_quiz_updated_at)

            },
        },
        v_updated_time: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatTime(this.course_quiz_updated_at)

            },
        },
    } , {
        timestamps: true,
        createdAt: "course_quiz_created_at",
        updatedAt: "course_quiz_updated_at",
    });
    return CourseQuiz;
};

