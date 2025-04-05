module.exports = (sequelize, Sequelize) => {
    const RecordData = sequelize.define(
        "record_data",
        {
            recordDataId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "recd_id",
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                field: "recd_w_id",
                references: {
                    model: "workspace",
                    key: "w_id",
                },
            },
            recordId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "record",
                    key: "rec_id",
                },
                field: "recd_rec_id",
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "recd_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false,

            },
            recordDataJSON: {
                type: Sequelize.JSON,
                field: "recd_json",
            },
            createdBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "recd_created_by",
            },
        },
        {
            timestamps: true,
            createdAt: "recd_created_at",
            updatedAt: "recd_updated_at",
        }
    );
    return RecordData;
};
