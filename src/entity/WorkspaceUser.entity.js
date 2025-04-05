module.exports = (sequelize, Sequelize) => {
    const WorkspaceUser = sequelize.define(
        "workspace_user",
        {
            userId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "wu_u_id",
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "wu_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                field: "wu_w_id",
                references: {
                    model: "workspace",
                    key: "w_id",
                },
            },
            contextConfigurationId: {
                type: Sequelize.INTEGER,
                field: "u_cxtconf_id",
                references: {
                    model: "context_configuration",
                    key: "cxtconf_id",
                },
                allowNull: true
            },
            userWorkspaceRole: {
                type: Sequelize.STRING,
                field: "wu_user_workspace_role",
            },
            userInviteBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "wu_invited_by",
            },
        },
        {
            timestamps: true,
            createdAt: "wu_created_at",
            updatedAt: "wu_updated_at",
        }
    );
    return WorkspaceUser;
};
  