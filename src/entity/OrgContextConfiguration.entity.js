module.exports = (sequelize, Sequelize) => {
    const OrgContextConfiguration = sequelize.define(
        "org_context_configuration",
        {
            orgContextConfigurationId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "orgcxtconf_id",
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "workspace",
                    key: "w_id",
                },
                field: "orgcxtconf_w_id",
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "orgcxtconf_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false
            },
            orgContextConfigurationStatus: {
                type: Sequelize.STRING,
                field: "orgcxtconf_status",
                allowNull:false,
                defaultValue: 'DRAFT'
            },
            orgContextConfigurationName: {
                type: Sequelize.STRING,
                field: "orgcxtconf_name",
            },
            orgContextConfigurationDescription: {
                type: Sequelize.STRING,
                field: "orgcxtconf_description",
            },
            createdBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "orgcxtconf_created_by",
            },
        },
        {
            timestamps: true,
            createdAt: "orgcxtconf_created_at",
            updatedAt: "orgcxtconf_updated_at",
        }
    );
    return OrgContextConfiguration;
};
