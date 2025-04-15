module.exports = (sequelize, Sequelize) => {
    const ResumeCounselling = sequelize.define("resumecounselling", {
        resumeCounsellingId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "resumecounselling_id",
        },
        userId: {
            type: Sequelize.INTEGER,
            references: {
                model: "user",
                key: "user_id",
            },
            field: "resumecounselling_user_id",
        },
        resumeCounsellingAttachUrl : {
            type: Sequelize.STRING(100),
            field: "resumecounselling_url",
        },
        resumeCounsellingDate: {
            type: Sequelize.DATE,
            field: "resumecounselling_date",
        },
        resumeCounsellingTime: {
            type: Sequelize.TIME,
            field: "resumecounselling_time",
        },
        resumeCounsellingStatus : {
            type: Sequelize.STRING(100),
            field: "resumecounselling_status",
        },
        resumeCounsellingMode: {
            type: Sequelize.STRING(100),
            field: "resumecounselling_mode",
        },
        resumeCounsellingUrl: {
            type: Sequelize.STRING(100),
            field: "resumecounselling_url",
        },
        created_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.resumecounselling_created_at) return null;
                const date = new Date(this.resumecounselling_created_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.resumecounselling_created_at) return null;
                return this.resumecounselling_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },

        updated_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.resumecounselling_updated_at) return null;
                const date = new Date(this.resumecounselling_updated_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        updated_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.resumecounselling_updated_at) return null;
                return this.resumecounselling_updated_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },
    } , {
        timestamps: true,
        createdAt: "resumecounselling_created_at",
        updatedAt: "resumecounselling_updated_at",
    });
    return ResumeCounselling;
};

