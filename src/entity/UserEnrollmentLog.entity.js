module.exports = (sequelize, Sequelize) => {
    const UserEnrollmentLog = sequelize.define("user_enrollment_log", {
        userEnrollmentLogId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "uel_id",
        },
        userEnrollmentId: {
            type: Sequelize.INTEGER,
            references: {
                model: "user_enrollment",
                key: "user_enrollment_id",
            },
            field: "uel_enrollment_id",
        },
        userId: {
            type: Sequelize.INTEGER,
            references: {
                model: "user",
                key: "user_id",
            },
            field: "uel_user_id",
        },
        webinarId: {
            type: Sequelize.INTEGER,
            references: {
                model: "webinar",
                key: "webinar_id",
            },
            field: "uel_webinar_id",
        },
        courseId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course",
                key: "course_id",
            },
            field: "uel_course_id",
        },
        courseTopicId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course_topic",
                key: "course_topic_id",
            },
            field: "uel_topic_id",
        },
        courseTopicContentId: {
            type: Sequelize.INTEGER,
            references: {
                model: "coursetopiccontent",
                key: "coursetopiccontent_id",
            },
            field: "uel_coursetopiccontent_id",
        },
        enrollmentStatus: {
            type: Sequelize.ENUM('NOT STARTED','IN PROGRESS','PAUSED', 'COMPLETED'),
            field: "uel_status",
        },
        v_created_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.uel_created_at) return null;
                const date = new Date(this.uel_created_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        v_created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.uel_created_at) return null;
                return this.uel_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },

        v_updated_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.uel_updated_at) return null;
                const date = new Date(this.uel_updated_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        v_updated_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.uel_updated_at) return null;
                return this.uel_updated_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },
    } , {
        timestamps: true,
        createdAt: "uel_created_at",
        updatedAt: "uel_updated_at",
    });
    return UserEnrollmentLog;
};

