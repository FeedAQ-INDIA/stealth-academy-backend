module.exports = (sequelize, Sequelize) => {
    const RecordLink = sequelize.define(
        "record_link",
        {
            recordLinkId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "reclink_id",
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: "workspace",
                    key: "w_id",
                },
                field: "reclink_w_id",
            },
            orgId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "org",
                    key: "org_id",
                },
                field: "reclink_org_id",
            },
            recordIdA: {
                type: Sequelize.INTEGER,
                references: {
                    model: "record",
                    key: "rec_id",
                },
                field: "reclink_rec_id_a",
            },
            recordIdB: {
                type: Sequelize.INTEGER,
                references: {
                    model: "record",
                    key: "rec_id",
                },
                field: "reclink_rec_id_b",
            },
            linkType: {
                type: Sequelize.ENUM(
                    'blocks', 'is_blocked_by', 'depends_on', 'is_depended_on_by',
                    'clones', 'is_cloned_by', 'duplicates', 'is_duplicated_by',
                    'relates_to', 'causes', 'is_caused_by', 'linked_to_known_issue',
                    'part_of_major_incident', 'resolved_by', 'change_implemented_by',
                    'change_approved_by', 'work_order_for', 'requires_approval_from',
                    'follow_up_for', 'escalated_from', 'escalated_to',
                    'transferred_from', 'transferred_to', 'merged_with'
                ),
                field: "reclink_link_type",
                set(value) {
                    this.setDataValue('linkType', value.toLowerCase());
                }
            },
            createdBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "reclink_created_by",
            },
        },
        {
            timestamps: true,
            createdAt: "reclink_created_at",
            updatedAt: "reclink_updated_at",
        }
    );

    RecordLink.addHook("beforeValidate", (recordLink) => {
        if (recordLink.recordIdA === recordLink.recordIdB) {
            throw new Error("A record cannot be linked to itself.");
        }
    });
    return RecordLink;
};
  