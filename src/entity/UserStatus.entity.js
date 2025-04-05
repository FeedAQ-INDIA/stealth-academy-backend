module.exports = (sequelize, Sequelize) => {
    const UserStatus = sequelize.define(
        "userstatus",
        {
            userStatusId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "userstatus_id",
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                field: "userstatus_w_id",
                references: {
                    model: "workspace",
                    key: "w_id",
                },
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "userstatus_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false,

            },

            userStatusName: {
                type: Sequelize.STRING(100),
                field: "userstatus_name",
                allowNull: false,
            },
            userStatusColor: {
                type: Sequelize.STRING(15),
                field: "userstatus_color",
                allowNull: true,
            },
            createdBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "userstatus_created_by",
            },
            isSystemDefined: {
                type: Sequelize.BOOLEAN,
                defaultValue: false, // True for default statuses
            },
            created_date: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.userstatus_created_at) return null;
                    const date = new Date(this.userstatus_created_at);
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = date.toLocaleString("en-US", { month: "short" });
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
                },
            },
            created_time: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.userstatus_created_at) return null;
                    return this.userstatus_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
                },
            },

            updated_date: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.userstatus_updated_at) return null;
                    const date = new Date(this.userstatus_updated_at);
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = date.toLocaleString("en-US", { month: "short" });
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
                },
            },
            updated_time: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.userstatus_updated_at) return null;
                    return this.userstatus_updated_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
                },
            },
        },
        {
            timestamps: true,
            createdAt: "userstatus_created_at",
            updatedAt: "userstatus_updated_at",
        }
    );
    return UserStatus;
};
