module.exports = (sequelize, Sequelize) => {
    const OrganizationUser = sequelize.define(
        "organization_user",
        {
            orgUserId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "org_user_id",
            },
            orgId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "organization",
                    key: "org_id",
                },
                field: "org_user_org_id",
                allowNull: false,
            },
            userId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "user_id",
                },
                field: "org_user_user_id",
                allowNull: false,
            },
            userRole: {
                type: Sequelize.ENUM('ADMIN', 'MANAGER', 'INSTRUCTOR', 'MEMBER'),
                field: "org_user_role",
                allowNull: false,
                defaultValue: 'MEMBER'
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
                defaultValue: Sequelize.NOW
            },
            joinedAt: {
                type: Sequelize.DATE,
                field: "org_user_joined_at",
            },
            status: {
                type: Sequelize.ENUM('PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED'),
                field: "org_user_status",
                defaultValue: 'PENDING'
            },
            permissions: {
                type: Sequelize.JSONB,
                field: "org_user_permissions",
                defaultValue: {}
            },
            metadata: {
                type: Sequelize.JSONB,
                field: "org_user_metadata",
                defaultValue: {}
            }
        },
        {
            timestamps: true,
            createdAt: "org_user_created_at",
            updatedAt: "org_user_updated_at",
            deletedAt: "org_user_deleted_at",
            // paranoid: true,
            indexes: [
                {
                    unique: true,
                    fields: ['org_user_org_id', 'org_user_user_id']
                },
                {
                    fields: ['org_user_role']
                },
                {
                    fields: ['org_user_status']
                },
                {
                    fields: ['org_user_invited_by']
                }
            ]
        }
    );
    return OrganizationUser;
};
  