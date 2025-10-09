const { formatDate, formatTime } = require("../utils/dateFormatters");

module.exports = (sequelize, Sequelize) => {
    const Flashcard = sequelize.define("flashcard", {
        flashcardId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "flashcard_id",
        },
        courseFlashcardId: {
            type: Sequelize.INTEGER,
            field: "course_flashcard_id",
            allowNull: false,
            references: {
                model: 'course_flashcard',
                key: 'course_flashcard_id'
            }
        },
        question: {
            type: Sequelize.TEXT,
            field: "flashcard_question",
            allowNull: false,
        },
        answer: {
            type: Sequelize.TEXT,
            field: "flashcard_answer",
            allowNull: false,
        },
        explanation: {
            type: Sequelize.TEXT,
            field: "flashcard_explanation",
            allowNull: true,
        },
        difficulty: {
            type: Sequelize.ENUM("EASY", "MEDIUM", "HARD"),
            field: "flashcard_difficulty",
            defaultValue: "MEDIUM"
        }, 
        orderIndex: {
            type: Sequelize.INTEGER,
            field: "flashcard_order_index",
            defaultValue: 0,
        },
        metadata: {
            type: Sequelize.JSONB,
            field: "flashcard_metadata",
            defaultValue: {}
        },
        // Virtual fields for formatted dates
        v_created_date: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatDate(this.flashcard_created_at);
            },
        },
        v_created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatTime(this.flashcard_created_at);
            },
        },
        v_updated_date: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatDate(this.flashcard_updated_at);
            },
        },
        v_updated_time: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatTime(this.flashcard_updated_at);
            },
        },
        v_question_preview: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.question) return '';
                return this.question.length > 150 
                    ? this.question.substring(0, 150) + '...'
                    : this.question;
            }
        },
        v_answer_preview: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.answer) return '';
                return this.answer.length > 150 
                    ? this.answer.substring(0, 150) + '...'
                    : this.answer;
            }
        },
 
    }, {
        timestamps: true,
        createdAt: "flashcard_created_at",
        updatedAt: "flashcard_updated_at",
        // paranoid: true, // Enable soft deletes
        deletedAt: "flashcard_deleted_at",
        indexes: [
            {
                fields: ['course_flashcard_id']
            },
        ],
    });

    return Flashcard;
};
