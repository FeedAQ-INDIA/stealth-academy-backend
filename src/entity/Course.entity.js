module.exports = (sequelize, Sequelize) => {
    const Course = sequelize.define("course", {
        courseId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "course_id",
        },
        courseTitle: {
            type: Sequelize.STRING(100),
            field: "course_title",
        },
        courseDescription: {
            type: Sequelize.TEXT,
            field: "course_description",
        },
        courseVideoUrl: {
            type: Sequelize.STRING(100),
            field: "course_video_url",
        },
        courseLevel: {
            type: Sequelize.STRING(100),
            field: "course_level",
        },
        courseDuration: {
            type: Sequelize.INTEGER,
            field: "course_duration",
         },
        courseTutor: {
            type: Sequelize.STRING(100),
            field: "course_tutor",
        },
        courseTags: {
            type: Sequelize.ARRAY(Sequelize.STRING),
            field: "course_tags",
        },
        courseCost: {
            type: Sequelize.INTEGER,
            field: "course_cost",
        },
        created_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.course_created_at) return null;
                const date = new Date(this.course_created_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.course_created_at) return null;
                return this.course_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },

        updated_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.course_updated_at) return null;
                const date = new Date(this.course_updated_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        updated_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.course_updated_at) return null;
                return this.course_updated_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },
    } , {
        timestamps: true,
        createdAt: "course_created_at",
        updatedAt: "course_updated_at",
    });
    return Course;
};


