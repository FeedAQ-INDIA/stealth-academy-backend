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

        estimatedDuration: {
            type: Sequelize.INTEGER,
            field: "flashcard_estimated_duration_minutes",
            defaultValue: 15,
            comment: "Estimated time to complete the flashcard set in minutes"
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
                fields: ['flashcard_user_id']
            }
        ],

    });



    return CourseFlashcard;
};

