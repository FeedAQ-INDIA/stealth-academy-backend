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
        webinarImageUrl: {
            type: Sequelize.ARRAY(Sequelize.STRING),
            field: "webinar_image_url",
        },
        webinarVideoUrl: {
            type: Sequelize.STRING ,
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
            type: Sequelize.ARRAY(Sequelize.STRING),
            field: "webinar_presenter",
        },
        webinarMode: {
            type: Sequelize.ENUM("ONLINE", "OFFLINE", "HYBRID"),
            field: "webinar_mode",
        },
        webinarSource: {
            type: Sequelize.ENUM("MICROSOFT TEAMS", "ZOOM", "WEBEX", "GMEET"),
            field: "webinar_source",
        },
        webinarHostLocation: {
            type: Sequelize.TEXT,
            field: "webinar_host_location",
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
        v_webinar_start_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.webinarStartDate) return null;
                const date = new Date(this.webinarStartDate);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        v_webinar_start_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.webinarStartDate) return null;
                return this.webinarStartDate.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },
        v_webinar_end_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.webinarEndDate) return null;
                const date = new Date(this.webinarEndDate);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        v_webinar_end_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.webinarEndDate) return null;
                return this.webinarEndDate.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },
        v_webinar_registration_start_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.webinarRegistrationStartDateTime) return null;
                const date = new Date(this.webinarRegistrationStartDateTime);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        v_webinar_registration_start_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.webinarRegistrationStartDateTime) return null;
                return this.webinarRegistrationStartDateTime.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },
        v_webinar_registration_end_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.webinarRegistrationEndDateTime) return null;
                const date = new Date(this.webinarRegistrationEndDateTime);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        v_webinar_registration_end_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.webinarRegistrationEndDateTime) return null;
                return this.webinarRegistrationEndDateTime.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },
        v_created_date: {
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
        v_created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.webinar_created_at) return null;
                return this.webinar_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },

        v_updated_date: {
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
        v_updated_time: {
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


