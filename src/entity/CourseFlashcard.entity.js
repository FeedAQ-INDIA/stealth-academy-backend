const { formatDate, formatTime } = require("../utils/dateFormatters");

module.exports = (sequelize, Sequelize) => {
    const CourseFlashcard = sequelize.define("course_flashcard", {
        courseFlashcardId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "course_flashcard_id",
        },
        courseId: {
            type: Sequelize.INTEGER,
            field: "flashcard_course_id",
            allowNull: false,
        },
        courseContentId: {
            type: Sequelize.INTEGER,
            field: "flashcard_content_id",
            allowNull: false,
        },
        userId: {
            type: Sequelize.INTEGER,
            field: "flashcard_user_id",
            allowNull: false,
        },
        setTitle: {
            type: Sequelize.STRING(200),
            field: "flashcard_set_title",
            allowNull: false,
        },
        setDescription: {
            type: Sequelize.TEXT,
            field: "flashcard_set_description",
            allowNull: true,
        },
        setDifficulty: {
            type: Sequelize.ENUM("EASY", "MEDIUM", "HARD", "MIXED"),
            field: "flashcard_set_difficulty",
            defaultValue: "MEDIUM"
        },
        setTags: {
            type: Sequelize.JSON,
            field: "flashcard_set_tags",
            defaultValue: []
        },
        setCategory: {
            type: Sequelize.STRING(100),
            field: "flashcard_set_category",
            allowNull: true,
        },
        estimatedDuration: {
            type: Sequelize.INTEGER,
            field: "flashcard_estimated_duration_minutes",
            defaultValue: 15,
            comment: "Estimated time to complete the flashcard set in minutes"
        },
        totalFlashcards: {
            type: Sequelize.INTEGER,
            field: "flashcard_total_count",
            defaultValue: 0,
            comment: "Total number of flashcards in this set"
        },
        learningObjectives: {
            type: Sequelize.JSON,
            field: "flashcard_learning_objectives",
            defaultValue: [],
            comment: "Array of learning objectives for this flashcard set"
        },
        orderIndex: {
            type: Sequelize.INTEGER,
            field: "flashcard_set_order_index",
            defaultValue: 0,
        },
        isActive: {
            type: Sequelize.BOOLEAN,
            field: "flashcard_set_is_active",
            defaultValue: true
        },
        status: {
            type: Sequelize.ENUM("DRAFT", "PUBLISHED", "ARCHIVED"),
            field: "flashcard_set_status",
            defaultValue: "DRAFT"
        },
        visibility: {
            type: Sequelize.ENUM("PUBLIC", "PRIVATE", "COURSE_ONLY"),
            field: "flashcard_set_visibility",
            defaultValue: "COURSE_ONLY"
        },
        allowShuffling: {
            type: Sequelize.BOOLEAN,
            field: "flashcard_allow_shuffling",
            defaultValue: true,
            comment: "Whether cards in this set can be shuffled for practice"
        },
        requireSequentialOrder: {
            type: Sequelize.BOOLEAN,
            field: "flashcard_require_sequential",
            defaultValue: false,
            comment: "Whether cards must be studied in a specific order"
        },
        passingScore: {
            type: Sequelize.INTEGER,
            field: "flashcard_passing_score_percentage",
            defaultValue: 70,
            comment: "Percentage score required to pass this flashcard set"
        },
        maxAttemptsPerSession: {
            type: Sequelize.INTEGER,
            field: "flashcard_max_attempts_per_session",
            defaultValue: 3,
            comment: "Maximum number of attempts allowed per study session"
        },
        metadata: {
            type: Sequelize.JSONB,
            field: "flashcard_set_metadata",
            defaultValue: {}
        },
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
        v_set_description_preview: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.setDescription) return '';
                return this.setDescription.length > 150 
                    ? this.setDescription.substring(0, 150) + '...'
                    : this.setDescription;
            }
        },
        v_completion_status: {
            type: Sequelize.VIRTUAL,
            get() {
                // This would be calculated based on associated flashcard progress
                // For now, return basic status
                return this.status === 'PUBLISHED' ? 'Available' : 'In Progress';
            }
        },
        v_estimated_duration_formatted: {
            type: Sequelize.VIRTUAL,
            get() {
                const minutes = this.estimatedDuration || 0;
                if (minutes < 60) return `${minutes} min`;
                const hours = Math.floor(minutes / 60);
                const mins = minutes % 60;
                return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
            }
        },
        v_difficulty_badge: {
            type: Sequelize.VIRTUAL,
            get() {
                const difficultyMap = {
                    'EASY': '🟢 Easy',
                    'MEDIUM': '🟡 Medium', 
                    'HARD': '🔴 Hard',
                    'MIXED': '🔵 Mixed'
                };
                return difficultyMap[this.setDifficulty] || '🟡 Medium';
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
                fields: ['flashcard_course_id']
            },
            {
                fields: ['flashcard_content_id']
            },
            {
                fields: ['flashcard_set_status']
            },
            {
                fields: ['flashcard_set_difficulty']
            },
            {
                fields: ['flashcard_set_category']
            },
            {
                fields: ['flashcard_set_order_index']
            },
            {
                fields: ['flashcard_set_visibility']
            },
            {
                fields: ['flashcard_set_is_active']
            },
            {
                fields: ['flashcard_user_id']
            }
        ],

    });



    return CourseFlashcard;
};

