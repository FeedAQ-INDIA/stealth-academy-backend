module.exports = (sequelize, Sequelize) => {
    const UserStatusGroup = sequelize.define(
        "userstatusgroup",
        {
            userStatusGroupId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "userstatusgroup_id",
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                field: "userstatusgroup_w_id",
                references: {
                    model: "workspace",
                    key: "w_id",
                },
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "userstatusgroup_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false,

            },

            userStatusGroupName: {
                type: Sequelize.STRING(100),
                field: "userstatusgroup_name",
                allowNull: false,
            },
            createdBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "userstatusgroup_created_by",
            },
            isSystemDefined: {
                type: Sequelize.BOOLEAN,
                defaultValue: false, // True for default statuses
            },
            created_date: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.userstatusgroup_created_at) return null;
                    const date = new Date(this.userstatusgroup_created_at);
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = date.toLocaleString("en-US", { month: "short" });
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
                },
            },
            created_time: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.userstatusgroup_created_at) return null;
                    return this.userstatusgroup_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
                },
            },

            updated_date: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.userstatusgroup_updated_at) return null;
                    const date = new Date(this.userstatusgroup_updated_at);
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = date.toLocaleString("en-US", { month: "short" });
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
                },
            },
            updated_time: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.userstatusgroup_updated_at) return null;
                    return this.userstatusgroup_updated_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
                },
            },
        },
        {
            timestamps: true,
            createdAt: "userstatusgroup_created_at",
            updatedAt: "userstatusgroup_updated_at",
        }
    );
    return UserStatusGroup;
};
