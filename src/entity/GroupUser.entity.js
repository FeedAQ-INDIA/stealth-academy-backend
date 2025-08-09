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
                allowNull: false,
                references: {
                    model: 'groups',
                    key: 'group_id'
                }
            },
            userId: {
                type: Sequelize.INTEGER,
                field: "user_id",
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'user_id'
                }
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
            paranoid: true,
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
