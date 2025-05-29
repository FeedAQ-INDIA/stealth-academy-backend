module.exports = (sequelize, Sequelize) => {
    const CourseSchedule = sequelize.define("course_schedule", {
        courseScheduleId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "course_schedule_id",
        },
        courseId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course",
                key: "course_id",
            },
            field: "course_schedule_course_id",
        },
        scheduledTitle: {
            type: Sequelize.STRING(60),
            field: "course_schedule_title",
        },
        scheduledTutor: {
            type: Sequelize.STRING(50),
            field: "course_schedule_tutor",
        },
        scheduledUrl: {
            type: Sequelize.STRING(100),
            field: "course_schedule_url",
        },
        scheduledDeliveryMedium: {
            type: Sequelize.ENUM("MICROSOFT TEAMS", "ZOOM", "WEBEX", "GMEET"),
            field: "course_schedule_medium",
        },
        scheduledDeliveryMode: {
            type: Sequelize.ENUM("ONLINE", "OFFLINE", "HYBRID"),
            field: "course_schedule_del_mode",
        },
        scheduledDescription: {
            type: Sequelize.TEXT,
            field: "course_schedule_description",
        },
        scheduledStartDateTime: {
            type: Sequelize.DATE,
            field: "course_schedule_start_date",
        },
        scheduledEndDateTime: {
            type: Sequelize.DATE,
            field: "course_schedule_end_date",
        },
        v_scheduled_end_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.scheduledEndDateTime) return null;
                const date = new Date(this.scheduledEndDateTime);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        v_scheduled_end_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.scheduledEndDateTime) return null;
                return this.scheduledEndDateTime.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },
        v_scheduled_start_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.scheduledStartDateTime) return null;
                const date = new Date(this.scheduledStartDateTime);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        v_scheduled_start_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.scheduledStartDateTime) return null;
                return this.scheduledStartDateTime.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },
        v_created_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.course_schedule_created_at) return null;
                const date = new Date(this.course_schedule_created_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        v_created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.course_schedule_created_at) return null;
                return this.course_schedule_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },

        v_updated_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.course_schedule_updated_at) return null;
                const date = new Date(this.course_schedule_updated_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        v_updated_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.course_schedule_updated_at) return null;
                return this.course_schedule_updated_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },
    } , {
        timestamps: true,
        createdAt: "course_schedule_created_at",
        updatedAt: "course_schedule_updated_at",
    });
    return CourseSchedule;
};


