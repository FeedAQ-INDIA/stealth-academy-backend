module.exports = (sequelize, Sequelize) => {
    const StatusConfiguration = sequelize.define(
        "status_configuration",
        {
            statusConfigurationId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "statusconf_id",
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "workspace",
                    key: "w_id",
                },
                field: "statusconf_w_id",
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "statusconf_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false
            },
            statusConfigurationStatus: {
                type: Sequelize.STRING,
                field: "statusconf_status",
                allowNull:false,
                defaultValue: 'DRAFT'
            },
            statusConfigurationName: {
                type: Sequelize.STRING,
                field: "statusconf_name",  set(value) {
                    this.setDataValue('statusConfigurationName', value.toUpperCase());
                }
            },
            statusConfigurationDescription: {
                type: Sequelize.STRING,
                field: "statusconf_description",
            },
            defaultStatus: {
                type: Sequelize.INTEGER,
                field: "statusconf_default_status",
                references: {
                    model: "statuses",
                    key: "statuses_id",
                },
                allowNull:true
            },
            entryStatus: {
                type: Sequelize.INTEGER,
                field: "statusconf_entry_status",
                references: {
                    model: "statuses",
                    key: "statuses_id",
                },
                allowNull:true
            },
            createdBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "statusconf_created_by",
            },
        },
        {
            timestamps: true,
            createdAt: "statusconf_created_at",
            updatedAt: "statusconf_updated_at",
        }
    );
    return StatusConfiguration;
};
