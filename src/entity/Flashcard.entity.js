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
        cardType: {
            type: Sequelize.ENUM("BASIC", "MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK"),
            field: "flashcard_type",
            defaultValue: "BASIC"
        },
        tags: {
            type: Sequelize.JSON,
            field: "flashcard_tags",
            defaultValue: []
        },
        hints: {
            type: Sequelize.JSON,
            field: "flashcard_hints",
            defaultValue: []
        },
        orderIndex: {
            type: Sequelize.INTEGER,
            field: "flashcard_order_index",
            defaultValue: 0,
        },
        isActive: {
            type: Sequelize.BOOLEAN,
            field: "flashcard_is_active",
            defaultValue: true
        },
        status: {
            type: Sequelize.ENUM("DRAFT", "PUBLISHED", "ARCHIVED"),
            field: "flashcard_status",
            defaultValue: "DRAFT"
        },
        reviewCount: {
            type: Sequelize.INTEGER,
            field: "flashcard_review_count",
            defaultValue: 0
        },
        correctCount: {
            type: Sequelize.INTEGER,
            field: "flashcard_correct_count",
            defaultValue: 0
        },
        lastReviewed: {
            type: Sequelize.DATE,
            field: "flashcard_last_reviewed",
            allowNull: true
        },
        nextReviewDate: {
            type: Sequelize.DATE,
            field: "flashcard_next_review_date",
            allowNull: true
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
        v_success_rate: {
            type: Sequelize.VIRTUAL,
            get() {
                if (this.reviewCount === 0) return 0;
                return Math.round((this.correctCount / this.reviewCount) * 100);
            }
        },
        v_last_reviewed_formatted: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.lastReviewed) return 'Never';
                return formatDate(this.lastReviewed);
            }
        }
    }, {
        timestamps: true,
        createdAt: "flashcard_created_at",
        updatedAt: "flashcard_updated_at",
        paranoid: true, // Enable soft deletes
        deletedAt: "flashcard_deleted_at",
        indexes: [
            {
                fields: ['course_flashcard_id']
            },
            {
                fields: ['flashcard_status']
            },
            {
                fields: ['flashcard_difficulty']
            },
            {
                fields: ['flashcard_type']
            },
            {
                fields: ['flashcard_order_index']
            },
            {
                fields: ['flashcard_is_active']
            },
            {
                fields: ['flashcard_last_reviewed']
            },
            {
                fields: ['flashcard_next_review_date']
            }
        ],
    });

    return Flashcard;
};
