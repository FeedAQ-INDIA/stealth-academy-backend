module.exports = (sequelize, Sequelize) => {
    const GroupUser = sequelize.define(
        "group_user",
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "id",
            },
            groupId: {
                type: Sequelize.INTEGER,
                field: "group_id",
                allowNull: false
                // Removed direct references - will be handled by associations
            },
            userId: {
                type: Sequelize.INTEGER,
                field: "user_id",
                allowNull: false
                // Removed direct references - will be handled by associations
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "org_id",
                allowNull: false
                // Removed direct references - will be handled by associations
            },
            role: {
                type: Sequelize.ENUM("MEMBER", "ADMIN"),
                field: "role",
                defaultValue: "MEMBER"
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
                    fields: ['group_id']
                },
                {
                    fields: ['user_id']
                },
                {
                    unique: true,
                    fields: ['group_id', 'user_id']
                }
            ]
        }
    );
    return GroupUser;
};
