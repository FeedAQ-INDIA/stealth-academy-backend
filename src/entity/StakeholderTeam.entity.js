module.exports = (sequelize, Sequelize) => {
    const StakeholderTags = sequelize.define(
        "stakeholder_team",
        {
            stakeholderId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "stakeholder",
                    key: "stkhld_id",
                },
                field: "stkhldteam_stkhld_id",
            },
            teamId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "team",
                    key: "team_id",
                },
                field: "stkhldteam_team_id",
            },


            addedBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "stkhldteam_added_by",
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "stkhldteam_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                field: "stkhldteam_w_id",
                references: {
                    model: "workspace",
                    key: "w_id",
                },
                allowNull: false,
            },
        },
        {
            timestamps: true,
            createdAt: "stkhldteam_created_at",
            updatedAt: "stkhldteam_updated_at",
        }
    );
    return StakeholderTags;
};
  