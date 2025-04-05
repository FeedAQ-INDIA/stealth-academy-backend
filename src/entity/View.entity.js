module.exports = (sequelize, Sequelize) => {
    const View = sequelize.define(
        "view",
        {
            viewId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "view_id",
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "workspace",
                    key: "w_id",
                },
                field: "view_w_id",
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "view_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false
            },
            viewName: {
                type: Sequelize.STRING,
                field: "view_name",
            },
            viewDescription: {
                type: Sequelize.STRING,
                field: "view_description",
            },
            viewRule: {
                type: Sequelize.STRING,
                field: "view_rule",
            },
            createdBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "view_created_by",
            },
        },
        {
            timestamps: true,
            createdAt: "view_created_at",
            updatedAt: "view_updated_at",
        }
    );
    return View;
};
