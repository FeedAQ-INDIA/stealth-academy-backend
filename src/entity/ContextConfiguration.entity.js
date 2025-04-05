module.exports = (sequelize, Sequelize) => {
    const ContextConfiguration = sequelize.define(
        "context_configuration",
        {
            contextConfigurationId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "cxtconf_id",
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "workspace",
                    key: "w_id",
                },
                field: "cxtconf_w_id",
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "cxtconf_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false
            },
            contextConfigurationStatus: {
                type: Sequelize.STRING,
                field: "cxtconf_status",
                allowNull:false,
                defaultValue: 'DRAFT'
            },
            contextConfigurationName: {
                type: Sequelize.STRING,
                field: "cxtconf_name",
                set(value) {
                    this.setDataValue('contextConfigurationName', value.toUpperCase());
                }
            },
            contextConfigurationSectionLabel: {
                type: Sequelize.STRING,
                field: "cxtconf_sec_label",
                set(value) {
                    this.setDataValue('contextConfigurationSectionLabel', value.toUpperCase());
                }
            },
            contextConfigurationDescription: {
                type: Sequelize.STRING,
                field: "cxtconf_description",
            },
            contextConfigurationType : {
                type: Sequelize.ENUM('RECORD DATA', 'RECORD', 'STAKEHOLDER', 'PRODUCT'),
                field: "cxtconf_type",
                set(value) {
                    this.setDataValue('contextConfigurationType', value.toUpperCase());
                }
            },
            createdBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "cxtconf_created_by",
            },
        },
        {
            timestamps: true,
            createdAt: "cxtconf_created_at",
            updatedAt: "cxtconf_updated_at",
        }
    );
    return ContextConfiguration;
};
