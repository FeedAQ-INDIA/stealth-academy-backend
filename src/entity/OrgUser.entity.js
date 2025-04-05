module.exports = (sequelize, Sequelize) => {
    const OrgUserWorkspace = sequelize.define(
        "org_user",
        {
            orgId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "org",
                    key: "org_id",
                },
                field: "ou_org_id",
            },
            userId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "ou_u_id",
            },
            userStatus: {
                type: Sequelize.INTEGER,
                references: {
                    model: "userstatusgroup",
                    key: "userstatusgroup_id",
                },
                field: "ou_userstatusgroup_id",
            },
            userOrgRole: {
                type: Sequelize.STRING,
                field: "ou_user_org_role",
            },

            jobTitle: {
                type: Sequelize.STRING(500),
                field: "ou_job_title",
            },
            department: {
                type: Sequelize.STRING(500),
                field: "ou_department",
            },
            organizationName: {
                type: Sequelize.STRING(500),
                field: "ou_organization_name",
            },
            baseLocation: {
                type: Sequelize.STRING(500),
                field: "ou_base_location",
            },
            language: {
                type: Sequelize.STRING(500),
                field: "ou_language",
            },
            timezone: {
                type: Sequelize.STRING(500),
                field: "ou_timezone",
            },

            userInviteBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "ou_invited_by",
            },
            userInvitedAt: {
                type: Sequelize.DATE,
                field: "ou_invited_at",
            }
        },
        {
            timestamps: true,
            createdAt: "ou_created_at",
            updatedAt: "ou_updated_at",
        }
    );
    return OrgUserWorkspace;
};
  