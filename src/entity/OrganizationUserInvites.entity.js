module.exports = (sequelize, Sequelize) => {
    const OrganizationUserInvites = sequelize.define(
        "organization_user_invites",
        {
            inviteId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "invite_id",
            },
            orgId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "organization",
                    key: "org_id",
                },
                field: "invite_org_id",
                allowNull: false,
            },
            invitedEmail: {
                type: Sequelize.STRING(100),
                field: "invited_email",
                allowNull: false
            },
            invitedBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "user_id",
                },
                field: "invited_by",
                allowNull: false,
            },
            invitedRole: {
                type: Sequelize.ENUM('ADMIN', 'MANAGER', 'INSTRUCTOR', 'MEMBER'),
                field: "invited_role",
                allowNull: false,
                defaultValue: 'MEMBER'
            },
            inviteStatus: {
                type: Sequelize.ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED'),
                field: "invite_status",
                defaultValue: 'PENDING'
            },
            inviteToken: {
                type: Sequelize.STRING(255),
                field: "invite_token",
                allowNull: false,
                unique: true
            },
            expiresAt: {
                type: Sequelize.DATE,
                field: "invite_expires_at",
                allowNull: false
            },
            acceptedAt: {
                type: Sequelize.DATE,
                field: "invite_accepted_at",
            },
            acceptedBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "user_id",
                },
                field: "accepted_by",
            },
            declinedAt: {
                type: Sequelize.DATE,
                field: "invite_declined_at",
            },
            cancelledAt: {
                type: Sequelize.DATE,
                field: "invite_cancelled_at",
            },
            cancelledBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "user_id",
                },
                field: "cancelled_by",
            },
            inviteMessage: {
                type: Sequelize.TEXT,
                field: "invite_message",
            },
            metadata: {
                type: Sequelize.JSONB,
                field: "invite_metadata",
                defaultValue: {}
            },
            // Virtual field to check if invite is still valid
            isValid: {
                type: Sequelize.VIRTUAL,
                get() {
                    const now = new Date();
                    return this.inviteStatus === 'PENDING' && 
                           this.expiresAt && 
                           new Date(this.expiresAt) > now;
                }
            }
        },
        {
            timestamps: true,
            createdAt: "invite_created_at",
            updatedAt: "invite_updated_at",
            deletedAt: "invite_deleted_at",
            paranoid: true,
            indexes: [
                {
                    fields: ['invite_org_id']
                },
                {
                    fields: ['invited_email']
                },
                {
                    fields: ['invited_by']
                },
                {
                    fields: ['invite_status']
                },
                {
                    fields: ['invite_token']
                },
                {
                    fields: ['invite_expires_at']
                },
                {
                    unique: true,
                    fields: ['invite_org_id', 'invited_email'],
                    where: {
                        invite_status: 'PENDING'
                    },
                    name: 'unique_pending_invite_per_org_email'
                }
            ]
        }
    );
    return OrganizationUserInvites;
};