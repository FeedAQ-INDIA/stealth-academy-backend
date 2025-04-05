module.exports = (sequelize, Sequelize) => {
    const StakeholderWorkspace = sequelize.define("stakeholder_workspace", {
        stakeholderId: {
            type: Sequelize.INTEGER,
            references: {
                model: "stakeholder",
                key: "stkhld_id",
            },
            field: "stkhldw_stkhld_id",
            allowNull: false,
            primaryKey: true, // Part of the composite key
        },
        workspaceId: {
            type: Sequelize.INTEGER,
            field: "stkhldw_w_id",
            references: {
                model: "workspace",
                key: "w_id",
            },
            allowNull: false,
            primaryKey: true, // Part of the composite key
        },
        orgId: {
            type: Sequelize.INTEGER,
            field: "stkhldw_org_id",
            references: {
                model: "org",
                key: "org_id",
            },
            allowNull: false
        },
    }, {
        timestamps: true,
        createdAt: "stkhldw_created_at",
        updatedAt: "stkhldw_updated_at",
    });
    return StakeholderWorkspace;
};
