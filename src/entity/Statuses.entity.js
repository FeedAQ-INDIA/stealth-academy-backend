module.exports = (sequelize, Sequelize) => {
    const Statuses = sequelize.define(
        "statuses",
        {
            statusId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "statuses_id",
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "workspace",
                    key: "w_id",
                },
                field: "statuses_w_id",
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "statuses_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false
            },
            statusConfigurationId: {
                type: Sequelize.INTEGER,
                field: "statuses_statusconf_id",
                references: {
                    model: "status_configuration",
                    key: "statusconf_id",
                },
                allowNull: false
            },

            statusName: {
                type: Sequelize.STRING,
                field: "statuses_name",
                allowNull: false,
                set(value) {
                    this.setDataValue('statusName', value.toUpperCase());
                }
            },

            statusColor: {
                type: Sequelize.STRING,
                field: "statuses_color",
                allowNull: false
            },

            createdBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "statuses_created_by",
            },
        },
        {
            timestamps: true,
            createdAt: "statuses_created_at",
            updatedAt: "statuses_updated_at",
        }
    );
    return Statuses;
};
