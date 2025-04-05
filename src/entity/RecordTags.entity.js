module.exports = (sequelize, Sequelize) => {
    const RecordTags = sequelize.define(
        "record_tags",
        {
            recordId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "record",
                    key: "rec_id",
                },
                field: "rectag_rec_id",
            },
            tagId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "tags",
                    key: "tag_id",
                },
                field: "rectag_tag_id",
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "rectag_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false,
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "workspace",
                    key: "w_id",
                },
                field: "rectag_w_id",
            },
             
            addedBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "rectag_added_by",
            },
 
        },
        {
            timestamps: true,
            createdAt: "rectag_created_at",
            updatedAt: "rectag_updated_at",
        }
    );
    return RecordTags;
};
  