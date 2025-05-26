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
    return CourseQuiz;
};

