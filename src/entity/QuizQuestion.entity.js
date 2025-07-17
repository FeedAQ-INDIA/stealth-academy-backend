const {formatDate, formatTime} = require("../utils/dateFormatters");

module.exports = (sequelize, Sequelize) => {
    const QuizQuestion = sequelize.define("quiz_question", {
        quizQuestionId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "course_quiz_id",
        },
        quizQuestionTitle: {
            type: Sequelize.TEXT,
            field: "course_quiz_title",
        },
        quizQuestionNote: {
            type: Sequelize.STRING(100),
            field: "course_quiz_note",
        },
        quizQuestionOption: {
            type: Sequelize.ARRAY(Sequelize.STRING),
            field: "course_quiz_option",
        },
        quizQuestionCorrectAnswer: {
            type: Sequelize.ARRAY(Sequelize.STRING),
            field: "course_quiz_answer",
        },
        quizQuestionPosPoint: {
            type: Sequelize.INTEGER,
            field: "course_quiz_pos_point",
        },
        quizQuestionNegPoint: {
            type: Sequelize.INTEGER,
            field: "course_quiz_neg_point",
        },
        isQuestionTimed: {
            type: Sequelize.BOOLEAN,
            field: "course_quiz_is_timed",
        },
        quizQuestionTimer: {
            type: Sequelize.INTEGER,
            field: "course_quiz_timer",
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
        courseQuizId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course_quiz",
                key: "course_quiz_id",
            },
            field: "course_quiz_quiz_id",
        },
        v_created_date: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatTime(this.course_quiz_created_at)

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
    return QuizQuestion;
};

