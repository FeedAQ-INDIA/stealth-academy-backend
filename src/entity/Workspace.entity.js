module.exports = (sequelize, Sequelize) => {
    const Workspace = sequelize.define(
        "workspace",
        {
            workspaceId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "w_id",
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "w_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false
            },
            name: {
                type: Sequelize.STRING,
                field: "w_name",
            },
            description: {
                type: Sequelize.STRING,
                field: "w_description",
            },
            status: {
                type: Sequelize.ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED'),
                field: "w_status",
            },
            url: {
                type: Sequelize.STRING,
                field: "w_url",
            },
            createdBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "w_created_by",
            },
            managedBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "w_managed_by",
            },
            defaultAssignee: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "w_default_assignee",
            },
            lastUpdatedBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "w_last_updated_by",
            },
            created_date: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.w_created_at) return null;
                    const date = new Date(this.w_created_at);
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = date.toLocaleString("en-US", { month: "short" });
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
                },
            },
            created_time: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.w_created_at) return null;
                    return this.w_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
                },
            },

            updated_date: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.w_updated_at) return null;
                    const date = new Date(this.w_updated_at);
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = date.toLocaleString("en-US", { month: "short" });
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
                },
            },
            updated_time: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.w_updated_at) return null;
                    return this.w_updated_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
                },
            },
        },
        {
            timestamps: true,
            createdAt: "w_created_at",
            updatedAt: "w_updated_at",
        }
    );
    return Workspace;
};
