module.exports = (sequelize, Sequelize) => {
    const RecordDataField = sequelize.define(
        "record_data_field",
        {
            recordDataFieldId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "recdfield_id",
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "workspace",
                    key: "w_id",
                },
                field: "recdfield_w_id",
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "recdfield_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false
            },
            fieldKey: {
                type: Sequelize.STRING,
                field: "recdfield_key",
                set(value) {
                    this.setDataValue('fieldKey', value.toLowerCase());
                }
            },
            fieldParent: {
                type: Sequelize.STRING,
                field: "recdfield_parent",
                defaultValue : null
            },
            fieldLabel: {
                type: Sequelize.STRING,
                field: "recdfield_label",
                set(value) {
                    this.setDataValue('fieldLabel', value.toUpperCase());
                }
            },
            fieldType: {
                type: Sequelize.STRING,
                field: "recdfield_field_type",
                set(value) {
                    this.setDataValue('fieldType', value.toUpperCase());
                }
            },
            fieldOption: {
                type: Sequelize.STRING,
                field: "recdfield_option",
            },
            fieldRegex: {
                type: Sequelize.STRING,
                field: "recdfield_regex",
            },
            fieldIsMandatory: {
                type: Sequelize.BOOLEAN,
                field: "recdfield_is_mandatory",
            },
            layoutId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "layout",
                    key: "layout_id",
                },
                field: "recdfield_layout_id",
            },
            createdBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "recdfield_created_by",
            },
        },
        {
            timestamps: true,
            createdAt: "recdfield_created_at",
            updatedAt: "recdfield_updated_at",
            indexes: [
                {
                    unique: true,
                    fields: ["recdfield_key", "recdfield_w_id", "recdfield_org_id"], // Enforces uniqueness on (fieldKey, orgId)
                },
            ],
        }
    );
    return RecordDataField;
};
