module.exports = (sequelize, Sequelize) => {
    const StatusesTransition = sequelize.define(
        "statuses_transition",
        {
            transitionId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "statusestransition_id",
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "workspace",
                    key: "w_id",
                },
                field: "statusestransition_w_id",
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "statusestransition_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false
            },
            statusConfigurationId: {
                type: Sequelize.INTEGER,
                field: "statusestransition_statusconf_id",
                references: {
                    model: "status_configuration",
                    key: "statusconf_id",
                },
                allowNull: false
            },

            fromStatus: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "statuses",
                    key: "statuses_id",
                },
                field: "statusestransition_from_status",
            },
            toStatus: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "statuses",
                    key: "statuses_id",
                },
                field: "statusestransition_to_status",
            },
            createdBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "statusestransition_created_by",
            },
        },
        {
            timestamps: true,
            createdAt: "statusestransition_created_at",
            updatedAt: "statusestransition_updated_at",
        }
    );
    return StatusesTransition;
};
