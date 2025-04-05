module.exports = (sequelize, Sequelize) => {
  const ZomatoIntegration = sequelize.define(
    "zomato_integration",
    {
      zomatoIntegrationId: {
        type: Sequelize.INTEGER,
        field: "zomatointegration_id", 
         primaryKey: true,
        autoIncrement: true,

      },
      workspaceId: {
        type: Sequelize.INTEGER,
        field: "zomatointegration_w_id",
        references: {
          model: "workspace",
          key: "w_id",
        },
      },
      orgId: {
        type: Sequelize.INTEGER,
        field: "zomatointegration_org_id",
        references: {
          model: "org",
          key: "org_id",
        },
      },
      storeId: {
        type: Sequelize.INTEGER,
        field: "zomatointegration_store_id",
      },
    },
    {
      timestamps: true,
      createdAt: "zomatointegration_created_at",
      updatedAt: "zomatointegration_updated_at",
    }
  );
  return ZomatoIntegration;
};
