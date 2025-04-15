module.exports = (sequelize, Sequelize) => {
    const InterviewLog = sequelize.define("interview_log", {
        interviewLogId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "interview_log_id",
        },
        userId: {
            type: Sequelize.INTEGER,
            references: {
                model: "user",
                key: "user_id",
            },
            field: "interview_log_user_id",
        },
        interviewLogDate: {
            type: Sequelize.DATE,
            field: "interview_log_date",
        },
        interviewLogTime: {
            type: Sequelize.TIME,
            field: "interview_log_time",
        },
        interviewLogStatus : {
            type: Sequelize.STRING(100),
            field: "interview_log_status",
        },
        interviewLogMode: {
            type: Sequelize.STRING(500),
            field: "interview_log_mode",
        },
        interviewLogUrl: {
            type: Sequelize.STRING(100),
            field: "interview_log_url",
        },
        courseTopicId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course_topic",
                key: "course_topic_id",
            },
            field: "interview_log_topic_id",
        },
        courseId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course",
                key: "course_id",
            },
            field: "interview_log_course_id",
        },
        created_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.interview_log_created_at) return null;
                const date = new Date(this.interview_log_created_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.interview_log_created_at) return null;
                return this.interview_log_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },

        updated_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.interview_log_updated_at) return null;
                const date = new Date(this.interview_log_updated_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        updated_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.interview_log_updated_at) return null;
                return this.interview_log_updated_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },
    } , {
        timestamps: true,
        createdAt: "interview_log_created_at",
        updatedAt: "interview_log_updated_at",
    });
    return InterviewLog;
};

