module.exports = (sequelize, Sequelize) => {
    const Counselling = sequelize.define("counselling", {
        counsellingId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "counselling_id",
        },
        userId: {
            type: Sequelize.INTEGER,
            references: {
                model: "user",
                key: "user_id",
            },
            field: "counselling_user_id",
        },
        counsellingDate: {
            type: Sequelize.DATE,
            field: "counselling_date",
        },
        counsellingTime: {
            type: Sequelize.TIME,
            field: "counselling_time",
        },
        counsellingStatus : {
            type: Sequelize.ENUM('REQUESTED','APPROVED','SCHEDULED', 'COMPLETED', 'CANCELLED'),
            field: "counselling_status",
        },
        counsellingMode: {
            type: Sequelize.ENUM("ONLINE", "OFFLINE", "HYBRID"),
            field: "counselling_mode",
        },
        counsellingUrl: {
            type: Sequelize.STRING(100),
            field: "counselling_url",
        },
        counsellingLanguage: {
            type: Sequelize.STRING(100),
            field: "counselling_language",
        },
        counsellingBackground: {
            type: Sequelize.STRING(100),
            field: "counselling_background",
        },
        counsellingTopic: {
            type: Sequelize.STRING(100),
            field: "counselling_topic",
        },
        counsellingNote: {
            type: Sequelize.STRING(300),
            field: "counselling_note",
        },
        counsellingCancelReason: {
            type: Sequelize.STRING(100),
            field: "counselling_cancel_reason",
        },
        created_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.counselling_created_at) return null;
                const date = new Date(this.counselling_created_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.counselling_created_at) return null;
                return this.counselling_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },

        updated_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.counselling_updated_at) return null;
                const date = new Date(this.counselling_updated_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        updated_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.counselling_updated_at) return null;
                return this.counselling_updated_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },
    } , {
        timestamps: true,
        createdAt: "counselling_created_at",
        updatedAt: "counselling_updated_at",
    });
    return Counselling;
};

