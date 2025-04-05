module.exports = (sequelize, Sequelize) => {
    const StakeholderTags = sequelize.define(
        "stakeholder_tags",
        {
            stakeholderId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "stakeholder",
                    key: "stkhld_id",
                },
                field: "stkhldtag_stkhld_id",
            },
            tagId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "tags",
                    key: "tag_id",
                },
                field: "stkhldtag_tag_id",
            },


            addedBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "stkhldtag_added_by",
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "stkhldtag_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                field: "stkhldtag_w_id",
                references: {
                    model: "workspace",
                    key: "w_id",
                },
                allowNull: false,
            },
        },
        {
            timestamps: true,
            createdAt: "stkhldtag_created_at",
            updatedAt: "stkhldtag_updated_at",
        }
    );
    return StakeholderTags;
};
  