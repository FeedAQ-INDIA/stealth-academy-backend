module.exports = (sequelize, Sequelize) => {
    const Webinar = sequelize.define("webinar", {
        webinarId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "webinar_id",
        },
        webinarTitle: {
            type: Sequelize.STRING(100),
            field: "webinar_title",
        },
        webinarDescription: {
            type: Sequelize.TEXT,
            field: "webinar_description",
        },
        webinarStructure: {
            type: Sequelize.TEXT,
            field: "webinar_structure",
        },
        webinarImageUrl: {
            type: Sequelize.ARRAY(Sequelize.STRING),
            field: "webinar_image_url",
        },
        webinarVideoUrl: {
            type: Sequelize.STRING(100),
            field: "webinar_video_url",
        },
        webinarDuration: {
            type: Sequelize.INTEGER,
            field: "webinar_duration",
        },
        webinarStartDate: {
            type: Sequelize.DATE,
            field: "webinar_start_date",
        },
        webinarEndDate: {
            type: Sequelize.DATE,
            field: "webinar_end_date",
        },
        webinarRegistrationStartDateTime: {
            type: Sequelize.DATE,
            field: "webinar_reg_start",
        },
        webinarRegistrationEndDateTime: {
            type: Sequelize.DATE,
            field: "webinar_reg_end",
        },
        webinarPresenter: {
            type: Sequelize.STRING(100),
            field: "webinar_presenter",
        },
        webinarSource: {
            type: Sequelize.ENUM("YOUTUBE"),
            field: "webinar_source",
        },
        webinarLanguage: {
            type: Sequelize.ENUM("ENGLISH"),
            field: "webinar_language",
        },
        webinarTags: {
            type: Sequelize.ARRAY(Sequelize.STRING),
            field: "webinar_tags",
        },
        webinarCost: {
            type: Sequelize.INTEGER,
            field: "webinar_cost",
        },
        created_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.webinar_created_at) return null;
                const date = new Date(this.webinar_created_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.webinar_created_at) return null;
                return this.webinar_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },

        updated_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.webinar_updated_at) return null;
                const date = new Date(this.webinar_updated_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        updated_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.webinar_updated_at) return null;
                return this.webinar_updated_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },
    } , {
        timestamps: true,
        createdAt: "webinar_created_at",
        updatedAt: "webinar_updated_at",
    });
    return Webinar;
};


