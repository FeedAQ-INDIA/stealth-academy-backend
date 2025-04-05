module.exports = (sequelize, Sequelize) => {
    const TeamUser = sequelize.define(
        "team_user",
        {
            userId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "teamuser_u_id",
            },
            teamId: {
                type: Sequelize.INTEGER,
                field: "teamuser_w_id",
                references: {
                    model: "team",
                    key: "team_id",
                },
            },
            userInviteBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "teamuser_invited_by",
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "workspace",
                    key: "w_id",
                },
                field: "teamuser_w_id",
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "teamuser_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false
            },
        },
        {
            timestamps: true,
            createdAt: "teamuser_created_at",
            updatedAt: "teamuser_updated_at",
            indexes: [
                {
                    unique: true,
                    fields: ["teamuser_u_id", "teamuser_w_id"],
                },
            ],
        }
    );
    return TeamUser;
};
  