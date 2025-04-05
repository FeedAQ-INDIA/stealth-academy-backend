module.exports = (sequelize, Sequelize) => {
  const Session = sequelize.define(
    "session",
    {
      sessionId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: "s_id",
      },
      workspaceId: {
        type: Sequelize.INTEGER,
        field: "s_w_id",
        references: {
          model: "workspace",
          key: "w_id",
        },
        allowNull: false,
      },
      orgId: {
        type: Sequelize.INTEGER,
        field: "s_org_id",
        references: {
          model: "org",
          key: "org_id",
        },
        allowNull: false
      },
    },
    {
      timestamps: true,
      createdAt: "s_created_at",
      updatedAt: "s_updated_at",
    }
  );
  return Session;
};
