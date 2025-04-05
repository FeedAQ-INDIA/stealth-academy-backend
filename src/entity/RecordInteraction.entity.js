module.exports = (sequelize, Sequelize) => {
    const RecordInteraction = sequelize.define(
        "record_interaction",
        {
            recordInteractionId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "recinter_id",
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                field: "recinter_w_id",
                references: {
                    model: "workspace",
                    key: "w_id",
                },
            },

            orgId: {
                type: Sequelize.INTEGER,
                field: "recinter_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false,

            },
            recordId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "record",
                    key: "rec_id",
                },
                field: "recinter_rec_id",
            },
            interactionType: {
                type: Sequelize.ENUM("call", "email", "chat", "whatsapp", "social_post", "social_comment", "form_submission"),
                field: "recinter_type",
            },
            channelType: {
                type: Sequelize.ENUM("self_service", "email", "phone", "chat", "instant_messaging", "social"),
                field: "recinter_channel_type",
            },
            interactionSummary: {
                type: Sequelize.JSON,
                field: "recinter_json",
            },
            customerId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "recinter_customer",
            },
            userId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "recinter_user",
            },

            created_date: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.recinter_created_at) return null;
                    const date = new Date(this.recinter_created_at);
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = date.toLocaleString("en-US", { month: "short" });
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
                },
            },
            created_time: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.recinter_created_at) return null;
                    return this.recinter_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
                },
            },

            updated_date: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.recinter_updated_at) return null;
                    const date = new Date(this.recinter_updated_at);
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = date.toLocaleString("en-US", { month: "short" });
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
                },
            },
            updated_time: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.recinter_updated_at) return null;
                    return this.recinter_updated_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
                },
            },
        },
        {
            timestamps: true,
            createdAt: "recinter_created_at",
            updatedAt: "recinter_updated_at",
        }
    );
    return RecordInteraction;
};
