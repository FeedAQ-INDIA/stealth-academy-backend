module.exports = (sequelize, Sequelize) => {
  const Org = sequelize.define(
    "org",
    {
      orgId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: "org_id",
      },
      orgName: {
        type: Sequelize.STRING,
        field: "org_first_name",
          set(value) {
              this.setDataValue('orgName', value.toUpperCase());
          }
      },
      orgEmail: {
        type: Sequelize.STRING,
        field: "org_email",
          set(value) {
              this.setDataValue('orgEmail', value.toLowerCase());
          }
      },
      orgNumber: {
        type: Sequelize.STRING,
        field: "org_number",
      },
      orgHeadCount: {
        type: Sequelize.STRING,
        field: "org_head_count",
      },
      orgDomain: {
        type: Sequelize.STRING,
        field: "org_domain",
          set(value) {
              this.setDataValue('orgDomain', value.toLowerCase());
          }
      }
    },
    {
      timestamps: true,
      createdAt: "org_created_at",
      updatedAt: "org_updated_at",
    }
  );
  return Org;
};
