module.exports = (sequelize, Sequelize) => {
    const RecordViewer = sequelize.define(
        "record_viewer",
        {
            recordWatcherId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "recordviewer_id",
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "workspace",
                    key: "w_id",
                },
                field: "recordviewer_w_id",
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "recordviewer_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false
            },

            recordId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "record",
                    key: "rec_id",
                },
                field: "recordviewer_rec_id",
            },

            viewerId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "recordviewer_watcher_id",
            },

            createdBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "recordviewer_created_by",
            },

        },
        {
            timestamps: true,
            createdAt: "recordviewer_created_at",
            updatedAt: "recordviewer_updated_at",
        }
    );
    return RecordViewer;
};
