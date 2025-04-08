module.exports = (sequelize, Sequelize) => {
    const CourseVideo = sequelize.define("course_video", {
        courseVideoId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "course_video_id",
        },
        courseVideoTitle: {
            type: Sequelize.STRING(500),
            field: "course_video_title",
        },
        courseVideoDescription: {
            type: Sequelize.STRING(500),
            field: "course_video_description",
        },

        courseVideoSource: {
            type: Sequelize.STRING(500),
            field: "course_video_source",
        },
        courseVideoUrl: {
            type: Sequelize.STRING(500),
            field: "course_video_url",
        },
        courseVideoDescription: {
            type: Sequelize.STRING(500),
            field: "course_video_description",
        },
        courseTopicId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course_topic",
                key: "course_topic_id",
            },
            field: "course_video_topic_id",
        },
        courseId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course",
                key: "course_id",
            },
            field: "course_video_course_id",
        },
        created_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.course_video_created_at) return null;
                const date = new Date(this.course_video_created_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.course_video_created_at) return null;
                return this.course_video_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },

        updated_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.course_video_updated_at) return null;
                const date = new Date(this.course_video_updated_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        updated_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.course_video_updated_at) return null;
                return this.course_video_updated_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },
    } , {
        timestamps: true,
        createdAt: "course_video_created_at",
        updatedAt: "course_video_updated_at",
    });
    return CourseVideo;
};

