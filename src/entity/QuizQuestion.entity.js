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
        courseTopicId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course_topic",
                key: "course_topic_id",
            },
            field: "course_quiz_topic_id",
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
                if (!this.course_quiz_created_at) return null;
                const date = new Date(this.course_quiz_created_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        v_created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.course_quiz_created_at) return null;
                return this.course_quiz_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },

        v_updated_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.course_quiz_updated_at) return null;
                const date = new Date(this.course_quiz_updated_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        v_updated_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.course_quiz_updated_at) return null;
                return this.course_quiz_updated_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },
    } , {
        timestamps: true,
        createdAt: "course_quiz_created_at",
        updatedAt: "course_quiz_updated_at",
    });
    return QuizQuestion;
};

