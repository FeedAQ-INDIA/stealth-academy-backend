const { formatDate, formatTime } = require("../utils/dateFormatters");

module.exports = (sequelize, Sequelize) => {
    const CourseUserInvites = sequelize.define("course_user_invites", {
        inviteId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "invite_id",
        },
        courseId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: "course",
                key: "course_id",
            },
            field: "invite_course_id",
        },
        invitedByUserId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: "user",
                key: "user_id",
            },
            field: "invite_invited_by_user_id",
        },
        organizationId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: "organization",
                key: "org_id",
            },
            field: "invite_organization_id",
        },
        inviteeEmail: {
            type: Sequelize.STRING(255),
            allowNull: false,
            field: "invite_invitee_email",
            validate: {
                isEmail: true,
            }
        },
        accessLevel: {
            type: Sequelize.ENUM("OWN", "SHARED", "ADMIN", "STUDY_GROUP"),
            defaultValue: "SHARED",
            field: "invite_access_level",
            allowNull: false,
        },
        inviteStatus: {
            type: Sequelize.ENUM("PENDING", "ACCEPTED", "DECLINED", "EXPIRED", "CANCELLED"),
            defaultValue: "PENDING",
            field: "invite_status",
            allowNull: false,
        },
        inviteToken: {
            type: Sequelize.STRING(255),
            allowNull: false,
            unique: true,
            field: "invite_token",
        },
        expiresAt: {
            type: Sequelize.DATE,
            allowNull: false,
            field: "invite_expires_at",
        },
        acceptedAt: {
            type: Sequelize.DATE,
            allowNull: true,
            field: "invite_accepted_at",
        },
        acceptedByUserId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: "user",
                key: "user_id",
            },
            field: "invite_accepted_by_user_id",
        },
        emailSentAt: {
            type: Sequelize.DATE,
            allowNull: true,
            field: "invite_email_sent_at",
        },
        remindersSent: {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            field: "invite_reminders_sent",
        },
        lastReminderSentAt: {
            type: Sequelize.DATE,
            allowNull: true,
            field: "invite_last_reminder_sent_at",
        },
        metadata: {
            type: Sequelize.JSONB,
            field: "invite_metadata",
            defaultValue: {}
        },
        v_created_date: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatDate(this.invite_created_at);
            },
        },
        v_created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatTime(this.invite_created_at);
            },
        },
        v_updated_date: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatDate(this.invite_updated_at);
            },
        },
        v_updated_time: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatTime(this.invite_updated_at);
            },
        },
    }, {
        timestamps: true,
        createdAt: "invite_created_at",
        updatedAt: "invite_updated_at",
        deletedAt: "invite_deleted_at",
        paranoid: true, // Enable soft deletes
        indexes: [
            {
                name: 'idx_cui_course_id',
                fields: ['invite_course_id']
            },
            {
                name: 'idx_cui_invited_by_user_id',
                fields: ['invite_invited_by_user_id']
            },
            {
                name: 'idx_cui_invitee_email',
                fields: ['invite_invitee_email']
            },
            {
                name: 'idx_cui_invite_status',
                fields: ['invite_status']
            },
            {
                name: 'idx_cui_invite_token',
                unique: true,
                fields: ['invite_token']
            },
            {
                name: 'idx_cui_expires_at',
                fields: ['invite_expires_at']
            },
            {
                name: 'idx_cui_unique_pending_invite',
                unique: true,
                fields: ['invite_course_id', 'invite_invitee_email', 'invite_status'],
                where: {
                    invite_status: 'PENDING',
                    invite_deleted_at: null
                }
            }
        ]
    });
 
    return CourseUserInvites;
};