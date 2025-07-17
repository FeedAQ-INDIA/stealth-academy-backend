const {formatDate, formatTime} = require("../utils/dateFormatters");

module.exports = (sequelize, Sequelize) => {
    const QuizResultLog = sequelize.define("quiz_result_log", {
        quizResultId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "quiz_result_id",
        },
        quizResultSnapshot: {
            type: Sequelize.JSON,
            field: "quiz_result_snap",
        },
        quizResultPoint: {
            type: Sequelize.INTEGER,
            field: "quiz_result_point",
        },
        totalPoints: {
            type: Sequelize.INTEGER,
            field: "quiz_result_tot_point",
        },
        isPassed: {
            type: Sequelize.BOOLEAN,
            field: "quiz_result_is_passed",
        },
        userId: {
            type: Sequelize.INTEGER,
            references: {
                model: "user",
                key: "user_id",
            },
            field: "quiz_result_user_id",
        },
        courseId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course",
                key: "course_id",
            },
            field: "quiz_result_course_id",
        },
        courseQuizId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course_quiz",
                key: "course_quiz_id",
            },
            field: "quiz_result_quiz_id",
        },
        v_created_date: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatDate(this.quiz_result_created_at)

            },
        },
        v_created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatTime(this.quiz_result_created_at)

            },
        },

        v_updated_date: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatDate(this.quiz_result_updated_at)

            },
        },
        v_updated_time: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatTime(this.quiz_result_updated_at)

            },
        },
    } , {
        timestamps: true,
        createdAt: "quiz_result_created_at",
        updatedAt: "quiz_result_updated_at",
    });
    return QuizResultLog;
};

