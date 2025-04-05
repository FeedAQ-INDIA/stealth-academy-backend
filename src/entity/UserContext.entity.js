module.exports = (sequelize, Sequelize) => {
    const UserContext = sequelize.define("user_context", {
        userContextId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "usercxt_id",
        },
        workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: "workspace",
                key: "w_id",
            },
            field: "rec_w_id",
        },
        orgId: {
            type: Sequelize.INTEGER,
            field: "rec_org_id",
            references: {
                model: "org",
                key: "org_id",
            },
            allowNull: false
        },
        userId: {
            type: Sequelize.INTEGER,
            references: {
                model: "user",
                key: "u_id",
            },
            field: "usercxt_u_id",
        },
        fieldId: {
            type: Sequelize.INTEGER,
            references: {
                model: "workspace_field",
                key: "wfield_id",
            },
            field: "usercxt_wfield_id",
        },
        orgFieldId: {
            type: Sequelize.INTEGER,
            references: {
                model: "org_field",
                key: "orgfield_id",
            },
            field: "usercxt_orgfield_id",
        },
        fieldValue: {
            type: Sequelize.STRING,
            field: "usercxt_field_value",
        },
        updatedBy: {
            type: Sequelize.INTEGER,
            references: {
                model: "user",
                key: "u_id",
            },
            field: "usercxt_updated_by",
        },
    }, {
        timestamps: true,
        createdAt: "usercxt_created_at",
        updatedAt: "usercxt_updated_at",
    });
    return UserContext;
};
