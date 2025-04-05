module.exports = (sequelize, Sequelize) => {
    const OrgField = sequelize.define(
        "org_field",
        {
            orgFieldId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "orgfield_id",
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "workspace",
                    key: "w_id",
                },
                field: "orgfield_w_id",
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "orgfield_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false
            },
            fieldKey: {
                type: Sequelize.STRING,
                field: "wfield_key",
                set(value) {
                    this.setDataValue('fieldKey', value.toUpperCase());
                }
            },
            fieldStatus: {
                type: Sequelize.STRING,
                field: "orgfield_status",
                allowNull:false,
                defaultValue: 'DRAFT'
            },
            fieldEntityType : {
                type: Sequelize.STRING,
                field: "orgfield_entity_type",
            },
            fieldLabel: {
                type: Sequelize.STRING,
                field: "orgfield_key",
                set(value) {
                    this.setDataValue('fieldLabel', value.toUpperCase());
                }
            },
            fieldType: {
                type: Sequelize.STRING,
                field: "orgfield_field_type",
                set(value) {
                    this.setDataValue('fieldType', value.toUpperCase());
                }
            },
            fieldOption: {
                type: Sequelize.STRING,
                field: "orgfield_option",

            },
            fieldToolTipText: {
                type: Sequelize.STRING,
                field: "orgfield_tool_tip_text",
            },
            fieldIsMandatory: {
                type: Sequelize.BOOLEAN,
                field: "orgfield_is_mandatory",
            },
            contextConfigurationId: {
                type: Sequelize.INTEGER,
                field: "orgfield_cxtconf_id",
                references: {
                    model: "org_context_configuration",
                    key: "orgcxtconf_id",
                },
                allowNull: false
            },
            createdBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "orgfield_created_by",
            },
        },
        {
            timestamps: true,
            createdAt: "orgfield_created_at",
            updatedAt: "orgfield_updated_at",
        }
    );
    return OrgField;
};
