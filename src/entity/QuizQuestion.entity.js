const {formatDate, formatTime} = require("../utils/dateFormatters");

module.exports = (sequelize, Sequelize) => {
    const QuizQuestion = sequelize.define("quiz_question", {
        quizQuestionId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "quiz_question_id",
        },
        courseQuizId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course_quiz",
                key: "course_quiz_id",
            },
            field: "course_quiz_id",
            allowNull: false,
        },
        courseId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course",
                key: "course_id",
            },
            field: "course_id",
            allowNull: false,
        },
        courseContentId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course_content",
                key: "course_content_id",
            },
            field: "course_content_id",
            allowNull: false,
        },
        quizQuestionTitle: {
            type: Sequelize.TEXT,
            field: "quiz_question_title",
            allowNull: false,
        },
        quizQuestionNote: {
            type: Sequelize.TEXT,
            field: "quiz_question_note",
        },
        quizQuestionType: {
            type: Sequelize.ENUM('MULTIPLE_CHOICE', 'SINGLE_CHOICE', 'INPUT_BOX'),
            field: "quiz_question_type",
            allowNull: false,
            defaultValue: 'SINGLE_CHOICE'
        },
        quizQuestionOption: {
            type: Sequelize.JSONB,
            field: "quiz_question_options",
            allowNull: false,
        },
        quizQuestionCorrectAnswer: {
            type: Sequelize.JSONB,
            field: "quiz_question_correct_answer",
            allowNull: false,
        },
        quizQuestionPosPoint: {
            type: Sequelize.INTEGER,
            field: "quiz_question_pos_points",
            defaultValue: 1
        },
        quizQuestionNegPoint: {
            type: Sequelize.INTEGER,
            field: "quiz_question_neg_points",
            defaultValue: 0
        },
        // isQuestionTimed: {
        //     type: Sequelize.BOOLEAN,
        //     field: "quiz_question_is_timed",
        //     defaultValue: false,
        // },
        // quizQuestionTimer: {
        //     type: Sequelize.INTEGER,
        //     field: "quiz_question_timer_seconds"
        // },
        questionSequence: {
            type: Sequelize.INTEGER,
            field: "quiz_question_sequence",
            allowNull: false
        },
        // isActive: {
        //     type: Sequelize.BOOLEAN,
        //     field: "quiz_question_is_active",
        //     defaultValue: true,
        // },
        difficultyLevel: {
            type: Sequelize.ENUM('EASY', 'MEDIUM', 'HARD'),
            field: "quiz_question_difficulty",
            defaultValue: 'MEDIUM'
        },
        explanation: {
            type: Sequelize.TEXT,
            field: "quiz_question_explanation",
        },
        metadata: {
            type: Sequelize.JSONB,
            field: "quiz_question_metadata",
            defaultValue: {}
        },
        v_created_date: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatDate(this.quiz_question_created_at);
            },
        },
        v_created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatTime(this.quiz_question_created_at);
            },
        },
        v_updated_date: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatDate(this.quiz_question_updated_at);
            },
        },
        v_updated_time: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatTime(this.quiz_question_updated_at);
            },
        },
    }, {
        timestamps: true,
        createdAt: "quiz_question_created_at",
        updatedAt: "quiz_question_updated_at",
        deletedAt: "quiz_question_deleted_at",
        // paranoid: true,
        indexes: [
            {
                fields: ['course_quiz_id']
            },
            {
                fields: ['course_id']
            },
            {
                fields: ['quiz_question_sequence']
            },
            {
                unique: true,
                fields: ['course_quiz_id', 'quiz_question_sequence']
            }
        ]
    });
    
    return QuizQuestion;
};

