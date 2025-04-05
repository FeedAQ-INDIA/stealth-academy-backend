module.exports = (sequelize, Sequelize) => {
    const WorkspaceField = sequelize.define(
        "workspace_field",
        {
            workspaceFieldId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "wfield_id",
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "workspace",
                    key: "w_id",
                },
                field: "wfield_w_id",
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "wfield_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false
            },
            fieldKey: {
                type: Sequelize.STRING,
                field: "wfield_key",
            },
            fieldStatus: {
                type: Sequelize.STRING,
                field: "wfield_status",
                allowNull:false,
                defaultValue: 'DRAFT'
            },
            fieldEntityType : {
                type: Sequelize.STRING,
                field: "wfield_entity_type",
            },
            fieldLabel: {
                type: Sequelize.STRING,
                field: "wfield_label",
            },
            fieldType: {
                type: Sequelize.STRING,
                field: "wfield_field_type",
            },
            fieldOption: {
                type: Sequelize.STRING,
                field: "wfield_option",
            },
            fieldToolTipText: {
                type: Sequelize.STRING,
                field: "wfield_tool_tip_text",
            },
            fieldRegex: {
                type: Sequelize.STRING,
                field: "wfield_regex",
            },
            fieldIsMandatory: {
                type: Sequelize.BOOLEAN,
                field: "wfield_is_mandatory",
            },
            fieldIsMandatoryInCreate: {
                type: Sequelize.BOOLEAN,
                field: "wfield_is_mandatory_in_create",
            },
            contextConfigurationId: {
                type: Sequelize.INTEGER,
                field: "wfield_cxtconf_id",
                references: {
                    model: "context_configuration",
                    key: "cxtconf_id",
                },
                allowNull: false
            },
            createdBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "wfield_created_by",
            },
        },
        {
            timestamps: true,
            createdAt: "wfield_created_at",
            updatedAt: "wfield_updated_at",
            indexes: [
                {
                    unique: true,
                    fields: ["wfield_key", "wfield_org_id"], // Enforces uniqueness on (fieldKey, orgId)
                },
            ],
        }
    );
    return WorkspaceField;
};
