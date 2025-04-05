module.exports = (sequelize, Sequelize) => {
  const WorkspaceMetadata = sequelize.define("workspace_metadata", {
    workspaceMetadataId: {
      type: Sequelize.INTEGER,
      field: "wm_id",
      primaryKey: true,
      autoIncrement: true,
    },
    orgId: {
      type: Sequelize.INTEGER,
      field: "wm_org_id",
      references: {
        model: "org",
        key: "org_id",
      },
      allowNull: false
    },
    workspaceId: {
      type: Sequelize.INTEGER,
      field: "wm_w_id",
      references: {
        model: "workspace",
        key: "w_id",
      },
      allowNull: false,
    },
    title: {
      type: Sequelize.STRING,
      field: "wm_title",
    },
    queryName: {
      type: Sequelize.STRING,
      allowNull: false,
      field: "wm_query_name",
    },
    key: {
      type: Sequelize.STRING,
      field: "wm_key",
    },
    value: {
      type: Sequelize.STRING,
      field: "wm_value",
    }
  } , {
    timestamps: true,
    createdAt: "wm_created_at",
    updatedAt: "wm_updated_at",
  });
  return WorkspaceMetadata;
};
