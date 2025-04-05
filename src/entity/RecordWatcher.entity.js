module.exports = (sequelize, Sequelize) => {
    const RecordWatcher = sequelize.define(
        "record_watcher",
        {
            recordWatcherId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "recordwatcher_id",
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "workspace",
                    key: "w_id",
                },
                field: "recordwatcher_w_id",
            },
            orgId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "org",
                    key: "org_id",
                },
                field: "recordwatcher_org_id",
            },
            recordId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "record",
                    key: "rec_id",
                },
                field: "recordwatcher_rec_id",
            },
            watcherId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "recordwatcher_watcher_id",
            },
            createdBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "recordwatcher_created_by",
            },
        },
        {
            timestamps: true,
            createdAt: "recordwatcher_created_at",
            updatedAt: "recordwatcher_updated_at",
            indexes: [
                {
                    name: "idx_watcher_org_w_rec", // Shortened index name
                    unique: true,
                    fields: ["recordwatcher_org_id", "recordwatcher_w_id", "recordwatcher_rec_id", "recordwatcher_watcher_id"],
                },
            ],
        }
    );

    return RecordWatcher;
};
