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
                if (!this.quiz_result_created_at) return null;
                const date = new Date(this.quiz_result_created_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        v_created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.quiz_result_created_at) return null;
                return this.quiz_result_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },

        v_updated_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.quiz_result_updated_at) return null;
                const date = new Date(this.quiz_result_updated_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        v_updated_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.quiz_result_updated_at) return null;
                return this.quiz_result_updated_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },
    } , {
        timestamps: true,
        createdAt: "quiz_result_created_at",
        updatedAt: "quiz_result_updated_at",
    });
    return QuizResultLog;
};

