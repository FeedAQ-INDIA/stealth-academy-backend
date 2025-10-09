module.exports = (sequelize, Sequelize) => {
    const Group = sequelize.define(
        "group",
        {
            groupId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "group_id",
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "org_id",
                allowNull: false
                // Removed direct references - will be handled by associations
            },
            groupName: {
                type: Sequelize.STRING(100),
                field: "group_name",
                allowNull: false
            },
            description: {
                type: Sequelize.TEXT,
                field: "description"
            },
            status: {
                type: Sequelize.ENUM("ACTIVE", "INACTIVE"),
                field: "status",
                defaultValue: "ACTIVE"
            },
            metadata: {
                type: Sequelize.JSONB,
                field: "metadata",
                defaultValue: {}
            }
        },
        {
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
            deletedAt: "deleted_at",
            // paranoid: true,
            indexes: [
                {
                    fields: ['org_id']
                },
                {
                    fields: ['group_name']
                },
                {
                    fields: ['status']
                }
            ]
        }
    );
    return Group;
};
