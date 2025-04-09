module.exports = (sequelize, Sequelize) => {
    const CourseTopicContent = sequelize.define("coursetopiccontent", {
        courseTopicContentId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            field: "coursetopiccontent_id",
        },
        courseTopicId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course_topic",
                key: "course_topic_id",
            },
            field: "coursetopiccontent_topic_id",
        },
        courseId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course",
                key: "course_id",
            },
            field: "coursetopiccontent_course_id",
        },
        contentId: {
            type: Sequelize.STRING(50),
            field: "coursetopiccontent_content_id",
        },
        courseTopicContentType: {
            type: Sequelize.ENUM('video', 'written', 'interview', 'quiz'),
            field: "coursetopiccontent_type",
        },
        courseTopicContentSequence: {
            type: Sequelize.INTEGER,
            field: "coursetopiccontent_seq",
        },
        created_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.coursetopiccontent_created_at) return null;
                const date = new Date(this.coursetopiccontent_created_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.coursetopiccontent_created_at) return null;
                return this.coursetopiccontent_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },

        updated_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.coursetopiccontent_updated_at) return null;
                const date = new Date(this.coursetopiccontent_updated_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        updated_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.coursetopiccontent_updated_at) return null;
                return this.coursetopiccontent_updated_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },
    } , {
        timestamps: true,
        createdAt: "coursetopiccontent_created_at",
        updatedAt: "coursetopiccontent_updated_at",
    });
    return CourseTopicContent;
};

