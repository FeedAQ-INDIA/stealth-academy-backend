module.exports = (sequelize, Sequelize) => {
  const WritingType = sequelize.define("writing_type", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "writing_type_id",
    },
    name: {
      type: Sequelize.ENUM("Expository", "Descriptive", "Persuasive", "Narrative", "Informal Email", "Formal Email"),
      allowNull: false,
      field: "writing_type_name",
    },
  }, {
    timestamps: true,
    createdAt: "writing_type_created_at",
    updatedAt: "writing_type_updated_at",
  });

  return WritingType;
};