module.exports = (sequelize, Sequelize) => {
    const UserStatusLink = sequelize.define(
        "userstatuslink",
        {
            userStatusId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "userstatus",
                    key: "userstatus_id",
                },
                field: "userstatuslink_userstatus_id",
            },
            userStatusGroupId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "userstatusgroup",
                    key: "userstatusgroup_id",
                },
                field: "userstatuslink_userstatusgroup_id",
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                field: "userstatuslink_w_id",
                references: {
                    model: "workspace",
                    key: "w_id",
                },
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "userstatuslink_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false,

            },

            addedBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "userstatuslink_added_by",
            },

        },
        {
            timestamps: true,
            createdAt: "userstatuslink_created_at",
            updatedAt: "userstatuslink_updated_at",
        }
    );
    return UserStatusLink;
};
