const {formatDate, formatTime} = require("../utils/dateFormatters");

module.exports = (sequelize, Sequelize) => {
    const QuizResultLog = sequelize.define("quiz_result_log", {
        resultId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "result_id",
        },
        userId: {
            type: Sequelize.INTEGER,
            references: {
                model: "user",
                key: "user_id",
            },
            field: "result_user_id",
            allowNull: false,
        },
        courseId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course",
                key: "course_id",
            },
            field: "result_course_id",
            allowNull: false,
        },
        courseQuizId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course_quiz",
                key: "course_quiz_id",
            },
            field: "result_course_quiz_id",
            allowNull: false,
        },
        score: {
            type: Sequelize.DECIMAL(5,2),
            field: "result_score"
        },
        totalQuestions: {
            type: Sequelize.INTEGER,
            field: "result_total_questions"
        },
        correctAnswers: {
            type: Sequelize.INTEGER,
            field: "result_correct_answers"
        },
        timeTaken: {
            type: Sequelize.INTEGER,
            field: "result_time_taken",
            comment: "Time taken in seconds"
        },
        isPassed: {
            type: Sequelize.BOOLEAN,
            field: "result_is_passed",
            defaultValue: false,
        },
        answers: {
            type: Sequelize.JSONB,
            field: "result_answers",
            defaultValue: {}
        },
        metadata: {
            type: Sequelize.JSONB,
            field: "result_metadata",
            defaultValue: {}
        },
        v_created_date: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatDate(this.result_created_at);
            },
        },
        v_created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatTime(this.result_created_at);
            },
        },
        v_updated_date: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatDate(this.result_updated_at);
            },
        },
        v_updated_time: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatTime(this.result_updated_at);
            },
        },
    }, {
        timestamps: true,
        createdAt: "result_created_at",
        updatedAt: "result_updated_at",
        indexes: [
            {
                fields: ['result_user_id']
            },
            {
                fields: ['result_course_id']
            },
            {
                fields: ['result_course_quiz_id']
            },
            {
                fields: ['result_user_id', 'result_course_id']
            }
        ]
    });
    
    return QuizResultLog;
};

