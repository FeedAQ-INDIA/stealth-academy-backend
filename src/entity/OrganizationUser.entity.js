module.exports = (sequelize, Sequelize) => {
    const OrganizationUser = sequelize.define(
        "organization_user",
        {
            orgId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "organization",
                    key: "org_id",
                },
                field: "org_user_org_id",
            },
            userId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "user_id",
                },
                field: "org_user_user_id",
            },
            invitedBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "user_id",
                },
                field: "org_user_invited_by",
            },
            invitedAt: {
                type: Sequelize.DATE,
                field: "org_user_invited_at",
            }
        },
        {
            timestamps: true,
            createdAt: "org_user_created_at",
            updatedAt: "org_user_updated_at",
        }
    );
    return OrganizationUser;
};
  