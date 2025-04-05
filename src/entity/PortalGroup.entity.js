module.exports = (sequelize, Sequelize) => {
    const PortalGroup = sequelize.define(
        "portal_group",
        {
            portalGroupId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "portalgroup_id",
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "workspace",
                    key: "w_id",
                },
                field: "portalgroup_w_id",
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "portalgroup_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false
            },
            portalId: {
                type: Sequelize.INTEGER,
                field: "portalgroup_portal_id",
                references: {
                    model: "workspace_portal",
                    key: "portal_id",
                },
                allowNull: false
            },
            portalGroupName: {
                type: Sequelize.STRING,
                field: "portalgroup_name",

            },
            portalGroupDescription: {
                type: Sequelize.STRING,
                field: "portalgroup_description",
            },

        },
        {
            timestamps: true,
            createdAt: "portalgroup_created_at",
            updatedAt: "portalgroup_updated_at",
        }
    );
    return PortalGroup;
};
