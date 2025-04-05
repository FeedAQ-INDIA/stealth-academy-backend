module.exports = (sequelize, Sequelize) => {
    const UserInvite = sequelize.define(
        "user_invite",
        {
            userInviteEmail: {
                type: Sequelize.STRING(100),
                field: "uinv_email",
                primaryKey: true,
            },
            userInviteCode: {
                type: Sequelize.STRING(8),
                field: "uinv_code",
            },
            userInviteBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "uinv_by",
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "uinv_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false,
            },
            status: {
                type: Sequelize.STRING,
                field: "uinv_status",
                defaultValue: 'INVITED',
                allowNull: false,
            },
        },
        {
            timestamps: true,
            createdAt: "uinv_created_at",
            updatedAt: "uinv_updated_at",
        }
    );
    return UserInvite;
};
