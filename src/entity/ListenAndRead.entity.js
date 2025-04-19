module.exports = (sequelize, Sequelize) => {
    const ListenAndReading = sequelize.define("listen_read", {
        listenReadId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "listen_read_id",
        },
        listenReadDescription: {
            type: Sequelize.TEXT,
            field: "listen_read_description",
        },
        listenReadContentUrl: {
            type: Sequelize.STRING(100),
            field: "listen_read_url",
        },
        courseTopicId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course_topic",
                key: "course_topic_id",
            },
            field: "listen_read_topic_id",
        },
        courseId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course",
                key: "course_id",
            },
            field: "listen_read_course_id",
        },
        created_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.listen_read_created_at) return null;
                const date = new Date(this.listen_read_created_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.listen_read_created_at) return null;
                return this.listen_read_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },

        updated_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.listen_read_updated_at) return null;
                const date = new Date(this.listen_read_updated_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        updated_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.listen_read_updated_at) return null;
                return this.listen_read_updated_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },
    } , {
        timestamps: true,
        createdAt: "listen_read_created_at",
        updatedAt: "listen_read_updated_at",
    });
    return ListenAndReading;
};

