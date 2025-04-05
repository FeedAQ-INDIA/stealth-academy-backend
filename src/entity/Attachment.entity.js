module.exports = (sequelize, Sequelize) => {
    const Attachment = sequelize.define(
        "attachment",
        {
            attachmentId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "attachment_id",
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "workspace",
                    key: "w_id",
                },
                field: "attachment_w_id",
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "attachment_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false
            },
            attachmentUrl : {
                type: Sequelize.STRING,
                field: "attachment_url",
                allowNull: false,
                validate: {
                    isUrl: true,
                },
            },
            attachmentFileType : {
                type: Sequelize.STRING,
                field: "attachment_file_type",
                allowNull: false
            },
            attachmentMimeType: {
                type: Sequelize.STRING,
                field: "attachment_mime_type",
                allowNull: false,
            },
            attachmentSize : {
                type: Sequelize.STRING,
                field: "attachment_size",
                allowNull: false
            },
            createdBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "attachment_created_by",
            }, 
            created_date: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.attachment_created_at) return null;
                    const date = new Date(this.attachment_created_at);
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = date.toLocaleString("en-US", { month: "short" });
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
                },
            },
            created_time: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.attachment_created_at) return null;
                    return this.attachment_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
                },
            },

            updated_date: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.attachment_updated_at) return null;
                    const date = new Date(this.attachment_updated_at);
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = date.toLocaleString("en-US", { month: "short" });
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
                },
            },
            updated_time: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.attachment_updated_at) return null;
                    return this.attachment_updated_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
                },
            },
        },
        {
            timestamps: true,
            createdAt: "attachment_created_at",
            updatedAt: "attachment_updated_at",
            paranoid: true,
            deletedAt: "attachment_deleted_at",
        }
    );
    return Attachment;
};
