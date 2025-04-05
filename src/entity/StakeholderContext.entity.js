module.exports = (sequelize, Sequelize) => {
    const StakeholderContext = sequelize.define("stakeholder_context", {
        stakeholderContextId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "stkhldcxt_id",
        },
        orgId: {
            type: Sequelize.INTEGER,
            field: "stkhldcxt_org_id",
            references: {
                model: "org",
                key: "org_id",
            },
            allowNull: false
        },
        workspaceId: {
            type: Sequelize.INTEGER,
            field: "stkhldcxt_w_id",
            references: {
                model: "workspace",
                key: "w_id",
            },
            allowNull: false,
        },
        stakeholderId: {
            type: Sequelize.INTEGER,
            references: {
                model: "stakeholder",
                key: "stkhld_id",
            },
            field: "stkhldcxt_stkhld_id",
        },
        fieldId: {
            type: Sequelize.INTEGER,
            references: {
                model: "workspace_field",
                key: "wfield_id",
            },
            field: "stkhldcxt_wfield_id",
        },
        orgFieldId: {
            type: Sequelize.INTEGER,
            references: {
                model: "org_field",
                key: "orgfield_id",
            },
            field: "stkhldcxt_orgfield_id",
        },
        fieldValue: {
            type: Sequelize.STRING,
            field: "stkhldcxt_field_value",
        },
        updatedBy: {
            type: Sequelize.INTEGER,
            references: {
                model: "user",
                key: "u_id",
            },
            field: "stkhldcxt_updated_by",
        },

    }, {
        timestamps: true,
        createdAt: "stkhldcxt_created_at",
        updatedAt: "stkhldcxt_updated_at",
    });
    return StakeholderContext;
};
