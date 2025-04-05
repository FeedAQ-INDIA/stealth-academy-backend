module.exports = (sequelize, Sequelize) => {
    const WorkspacePortal = sequelize.define(
        "workspace_portal",
        {
            portalId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "portal_id",
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "workspace",
                    key: "w_id",
                },
                field: "portal_w_id",
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "portal_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false
            },
            portalName: {
                type: Sequelize.STRING,
                field: "portal_name",
                set(value) {
                    this.setDataValue('portalName', value.toUpperCase());
                }
            },
            portalDescription: {
                type: Sequelize.STRING,
                field: "portal_description",
            },
            createdBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "portal_created_by",
            },
        },
        {
            timestamps: true,
            createdAt: "portal_created_at",
            updatedAt: "portal_updated_at",
        }
    );
    return WorkspacePortal;
};
