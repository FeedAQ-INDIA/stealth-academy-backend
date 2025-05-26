module.exports = (sequelize, Sequelize) => {
    const CourseTopic = sequelize.define("course_topic", {
        courseTopicId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "course_topic_id",
        },
        courseTopicTitle: {
            type: Sequelize.STRING(50),
            field: "course_topic_title",
            allowNull: false,
        },
        courseTopicSequence: {
            type: Sequelize.INTEGER,
            field: "course_topic_sequence",
            allowNull: false,
        },
        courseId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course",
                key: "course_id",
            },
            field: "course_topic_course_id",
        },
        v_created_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.course_topic_created_at) return null;
                const date = new Date(this.course_topic_created_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        v_created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.course_topic_created_at) return null;
                return this.course_topic_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },

        v_updated_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.course_topic_updated_at) return null;
                const date = new Date(this.course_topic_updated_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        v_updated_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.course_topic_updated_at) return null;
                return this.course_topic_updated_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },
    } , {
        timestamps: true,
        createdAt: "course_topic_created_at",
        updatedAt: "course_topic_updated_at",
    });
    return CourseTopic;
};

