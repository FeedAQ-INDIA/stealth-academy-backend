module.exports = (sequelize, Sequelize) => {
    const CourseQuiz = sequelize.define("course_quiz", {
        courseQuizId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "course_quiz_id",
        },
        courseQuizTitle: {
            type: Sequelize.STRING(500),
            field: "course_quiz_title",
        },
        courseQuizDescription: {
            type: Sequelize.STRING(500),
            field: "course_quiz_description",
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
        created_date: {
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
        created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.course_quiz_created_at) return null;
                return this.course_quiz_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },

        updated_date: {
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
        updated_time: {
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

