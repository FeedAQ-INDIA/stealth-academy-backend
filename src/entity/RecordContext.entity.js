module.exports = (sequelize, Sequelize) => {
    const RecordContext = sequelize.define("record_context", {
        recordContextId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "reccxt_id",
        },
        orgId: {
            type: Sequelize.INTEGER,
            field: "reccxt_org_id",
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
            field: "reccxt_w_id",
        },
        recordId: {
            type: Sequelize.INTEGER,
            references: {
                model: "record",
                key: "rec_id",
            },
            field: "reccxt_record_id",
        },
        fieldKey: {
            type: Sequelize.STRING,
            field: "wfield_key",
        },
        fieldId: {
            type: Sequelize.INTEGER,
            references: {
                model: "workspace_field",
                key: "wfield_id",
            },
            field: "reccxt_wfield_id",
        },
        orgFieldId: {
            type: Sequelize.INTEGER,
            references: {
                model: "org_field",
                key: "orgfield_id",
            },
            field: "reccxt_orgfield_id",
        },
        fieldValue: {
            type: Sequelize.STRING,
            field: "reccxt_field_value",
        },
        updatedBy: {
            type: Sequelize.INTEGER,
            references: {
                model: "user",
                key: "u_id",
            },
            field: "reccxt_updated_by",
        },
    }, {
        timestamps: true,
        createdAt: "reccxt_created_at",
        updatedAt: "reccxt_updated_at",
    });
    return RecordContext;
};
