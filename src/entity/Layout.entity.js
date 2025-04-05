module.exports = (sequelize, Sequelize) => {
    const Layout = sequelize.define(
        "layout",
        {
            layoutId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "layout_id",
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "workspace",
                    key: "w_id",
                },
                field: "layout_w_id",
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "layout_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false
            },
            layoutName: {
                type: Sequelize.STRING,
                field: "layout_key",
                set(value) {
                    this.setDataValue('layoutName', value.toUpperCase());
                }
            },
            layoutStatus: {
                type: Sequelize.STRING,
                field: "layout_status",
                allowNull:false,
                defaultValue: 'ACTIVE',
                set(value) {
                    this.setDataValue('layoutStatus', value.toUpperCase());
                }
            },
            layoutDescription : {
                type: Sequelize.STRING,
                field: "layout_description",
            },
            layoutSchema : {
                type: Sequelize.STRING,
                field: "layout_schema",
            },
            layoutType : {
                type: Sequelize.STRING,
                field: "layout_type",
            },
            statusConfigurationId: {
                type: Sequelize.INTEGER,
                field: "layout_statusconf_id",
                references: {
                    model: "status_configuration",
                    key: "statusconf_id",
                },
                allowNull: true
            },
            createdBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "layout_created_by",
            },
        },
        {
            timestamps: true,
            createdAt: "layout_created_at",
            updatedAt: "layout_updated_at",

        }
    );
    return Layout;
};
