module.exports = (sequelize, Sequelize) => {
    const ComprehensionReading = sequelize.define("comprehension_reading", {
        comprehensionReadingId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "comprehension_reading_id",
        },
        comprehensionReadingDescription: {
            type: Sequelize.TEXT,
            field: "comprehension_reading_description",
        },
        comprehensionReadingContent: {
            type: Sequelize.TEXT,
            field: "comprehension_reading_content",
        },
        courseTopicId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course_topic",
                key: "course_topic_id",
            },
            field: "comprehension_reading_topic_id",
        },
        courseId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course",
                key: "course_id",
            },
            field: "comprehension_reading_course_id",
        },
        created_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.comprehension_reading_created_at) return null;
                const date = new Date(this.comprehension_reading_created_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.comprehension_reading_created_at) return null;
                return this.comprehension_reading_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },

        updated_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.comprehension_reading_updated_at) return null;
                const date = new Date(this.comprehension_reading_updated_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        updated_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.comprehension_reading_updated_at) return null;
                return this.comprehension_reading_updated_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },
    } , {
        timestamps: true,
        createdAt: "comprehension_reading_created_at",
        updatedAt: "comprehension_reading_updated_at",
    });
    return ComprehensionReading;
};

