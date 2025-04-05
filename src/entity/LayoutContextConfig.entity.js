module.exports = (sequelize, Sequelize) => {
    const LayoutContextConfig = sequelize.define(
        "layout_context_config",
        {
            contextConfigurationId: {
                type: Sequelize.INTEGER,
                primaryKey: true,  // ✅ Set as part of composite primary key
                references: {
                    model: "context_configuration",
                    key: "cxtconf_id",
                },
                field: "layoutcxtconfig_cxtconf_id",
            },
            layoutId: {
                type: Sequelize.INTEGER,
                primaryKey: true,  // ✅ Set as part of composite primary key
                references: {
                    model: "layout",
                    key: "layout_id",
                },
                field: "layoutcxtconfig_layout_id",
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "layoutcxtconfig_org_id",
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
                field: "layoutcxtconfig_w_id",
            },
        },
        {
            timestamps: true,
            createdAt: "layoutcxtconfig_created_at",
            updatedAt: "layoutcxtconfig_updated_at",
        }
    );
    return LayoutContextConfig;
};

