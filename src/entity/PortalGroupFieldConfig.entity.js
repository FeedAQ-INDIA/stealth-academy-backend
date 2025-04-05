module.exports = (sequelize, Sequelize) => {
    const PortalGroupFieldConfig = sequelize.define(
        "portal_field_config",
        {
            portalGroupId: {
                type: Sequelize.INTEGER,
                primaryKey: true,  // ✅ Set as part of composite primary key
                references: {
                    model: "portal_group",
                    key: "portalgroup_id",
                },
                field: "portalfield_group_id",
            },

            portalId: {
                type: Sequelize.INTEGER,
                field: "portalfield_portal_id",
                references: {
                    model: "workspace_portal",
                    key: "portal_id",
                },
                allowNull: false
            },
            contextConfigurationId: {
                type: Sequelize.INTEGER,
                primaryKey: true,  // ✅ Set as part of composite primary key
                references: {
                    model: "context_configuration",
                    key: "cxtconf_id",
                },
                field: "portalfield_cxtconf_id",
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "portalfield_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false,
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "workspace",
                    key: "w_id",
                },
                field: "portalfield_w_id",
            },
        },
        {
            timestamps: true,
            createdAt: "portalgroup_created_at",
            updatedAt: "portalgroup_updated_at",
        }
    );
    return PortalGroupFieldConfig;
};
