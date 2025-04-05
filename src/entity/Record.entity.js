module.exports = (sequelize, Sequelize) => {
    const Record = sequelize.define(
        "record",
        {
            recordId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "rec_id",
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "workspace",
                    key: "w_id",
                },
                field: "rec_w_id",
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "rec_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false
            },
            sessionId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "session",
                    key: "s_id",
                },
                field: "rec_s_id",
            },
            reportedBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "stakeholder",
                    key: "stkhld_id",
                },
                field: "rec_reported_by",
            },
            submittedBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "stakeholder",
                    key: "stkhld_id",
                },
                field: "rec_submitted_by",
            },
            channelId: {
                type: Sequelize.INTEGER,
                field: "rec_chn_id",
            },
            interactionType: {
                type: Sequelize.ENUM("call", "email", "chat", "whatsapp", "social_post", "social_comment", "form_submission"),
                field: "rec_interaction_type",
            },
            channelType: {
                type: Sequelize.ENUM("self_service", "email", "phone", "chat", "instant_messaging", "social"),
                field: "rec_channel_type",
            },
            recordType: {
                type: Sequelize.STRING, //chat, rating, text
                field: "rec_type",
            },
            recordSource: {
                type: Sequelize.STRING, //chat, rating, text
                field: "rec_source",
            },
            recordStatus: {
                type: Sequelize.INTEGER, //INPROGRESS, READY,
                field: "rec_status",
                references: {
                    model: "statuses",
                    key: "statuses_id",
                },
                allowNull:false
            },
            recordTitle: {
                type: Sequelize.STRING, //INPROGRESS, READY,
                field: "rec_title",
                set(value) {
                    this.setDataValue('recordTitle', value.toUpperCase());
                }
            },
            recordDescription: {
                type: Sequelize.STRING, //INPROGRESS, READY,
                field: "rec_description",
            },
            recordType: {
                type: Sequelize.STRING, //
                field: "rec_type",
            },
            recordClassification: {
                type: Sequelize.STRING, //
                field: "rec_classification",
                set(value) {
                    this.setDataValue('recordClassification', value.toUpperCase());
                }
            },
            parentRecord: {
                type: Sequelize.INTEGER, //
                references: {
                    model: "record",
                    key: "rec_id",
                },
                field: "rec_parent_id",
            },
            recordPriority: {
                type: Sequelize.STRING, //
                field: "rec_priority",
            },
            layoutId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "layout",
                    key: "layout_id",
                },
                field: "rec_layout_id",
            },
            statusConfigurationId: {
                type: Sequelize.INTEGER,
                field: "rec_statusconf_id",
                references: {
                    model: "status_configuration",
                    key: "statusconf_id",
                },
                allowNull: true
            },
            assignee: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "rec_assignee",
            },
            created_date: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.rec_created_at) return null;
                    const date = new Date(this.rec_created_at);
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = date.toLocaleString("en-US", { month: "short" });
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
                },
            },
            created_time: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.rec_created_at) return null;
                    return this.rec_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
                },
            },

            updated_date: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.rec_updated_at) return null;
                    const date = new Date(this.rec_updated_at);
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = date.toLocaleString("en-US", { month: "short" });
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
                },
            },
            updated_time: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.rec_updated_at) return null;
                    return this.rec_updated_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
                },
            },
        },
        {
            timestamps: true,
            createdAt: "rec_created_at",
            updatedAt: "rec_updated_at",
        }
    );
    return Record;
};