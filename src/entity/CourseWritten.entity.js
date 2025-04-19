module.exports = (sequelize, Sequelize) => {
    const CourseWritten = sequelize.define("course_written", {
        courseWrittenId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "course_written_id",
        },
        courseWrittenDescription: {
            type: Sequelize.TEXT,
            field: "course_written_description",
        },
        courseWrittenHtmlContent: {
            type: Sequelize.TEXT,
            field: "course_written_htmlcontent",
        },
        courseWrittenSource: {
            type: Sequelize.STRING(100),
            field: "course_written_source",
        },
        courseWrittenUrl: {
            type: Sequelize.STRING(100),
            field: "course_written_url",
        },
        courseTopicId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course_topic",
                key: "course_topic_id",
            },
            field: "course_written_topic_id",
        },
        courseId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course",
                key: "course_id",
            },
            field: "course_written_course_id",
        },
        created_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.course_written_created_at) return null;
                const date = new Date(this.course_written_created_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.course_written_created_at) return null;
                return this.course_written_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },

        updated_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.course_written_updated_at) return null;
                const date = new Date(this.course_written_updated_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        updated_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.course_written_updated_at) return null;
                return this.course_written_updated_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },
    } , {
        timestamps: true,
        createdAt: "course_written_created_at",
        updatedAt: "course_written_updated_at",
    });
    return CourseWritten;
};

