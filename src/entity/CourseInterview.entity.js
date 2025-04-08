module.exports = (sequelize, Sequelize) => {
    const CourseInterview = sequelize.define("course_interview", {
        courseInterviewId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "course_interview_id",
        },
        userId: {
            type: Sequelize.INTEGER,
            references: {
                model: "user",
                key: "user_id",
            },
            field: "course_interview_user_id",
        },
        courseInterviewDate: {
            type: Sequelize.DATE,
            field: "course_interview_date",
        },
        courseInterviewTime: {
            type: Sequelize.TIME,
            field: "course_interview_time",
        },
        courseInterviewStatus : {
            type: Sequelize.STRING(100),
            field: "course_interview_status",
        },
        courseInterviewMode: {
            type: Sequelize.STRING(500),
            field: "course_interview_mode",
        },
        courseInterviewUrl: {
            type: Sequelize.STRING(500),
            field: "course_interview_url",
        },
        courseTopicId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course_topic",
                key: "course_topic_id",
            },
            field: "course_interview_topic_id",
        },
        courseId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course",
                key: "course_id",
            },
            field: "course_interview_course_id",
        },
        created_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.course_interview_created_at) return null;
                const date = new Date(this.course_interview_created_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.course_interview_created_at) return null;
                return this.course_interview_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },

        updated_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.course_interview_updated_at) return null;
                const date = new Date(this.course_interview_updated_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        updated_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.course_interview_updated_at) return null;
                return this.course_interview_updated_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },
    } , {
        timestamps: true,
        createdAt: "course_interview_created_at",
        updatedAt: "course_interview_updated_at",
    });
    return CourseInterview;
};

