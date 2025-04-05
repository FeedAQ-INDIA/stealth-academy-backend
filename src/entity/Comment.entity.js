module.exports = (sequelize, Sequelize) => {
    const Comment = sequelize.define(
        "comment",
        {
            commentId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "comm_id",
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                field: "comm_w_id",
                references: {
                    model: "workspace",
                    key: "w_id",
                },
            },
            recordId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "record",
                    key: "rec_id",
                },
                field: "comm_rec_id",
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "comm_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false,
            },
            commentedBy: {
                type: Sequelize.INTEGER,
                field: "comm_commented_by",
                references: {
                    model: "user",
                    key: "u_id",
                },
                allowNull: false,
            },
            comment: {
                type: Sequelize.STRING(3000),
                field: "comm_comment",
                allowNull: false,
            },
            created_date: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.comm_created_at) return null;
                    const date = new Date(this.comm_created_at);
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = date.toLocaleString("en-US", { month: "short" });
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
                },
            },
            created_time: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.comm_created_at) return null;
                    return this.comm_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
                },
            },

            updated_date: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.comm_updated_at) return null;
                    const date = new Date(this.comm_updated_at);
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = date.toLocaleString("en-US", { month: "short" });
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
                },
            },
            updated_time: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.comm_updated_at) return null;
                    return this.comm_updated_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
                },
            },
        },
        {
            timestamps: true,
            createdAt: "comm_created_at",
            updatedAt: "comm_updated_at",
        }
    );
    return Comment;
};
