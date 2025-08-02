

module.exports = (sequelize, Sequelize) => {
  const UserFile = sequelize.define("user_file", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "user_file_id",
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "user",
        key: "user_id",
      },
      field: "user_file_user_id",
    },
    fileUrl: {
      type: Sequelize.STRING(255),
      allowNull: false,
      field: "user_file_url",
    },
    fileType: {
      type: Sequelize.STRING(50),
      allowNull: false,
      field: "user_file_type",
    },
    uploadedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
      field: "user_file_uploaded_at",
    },
  }, {
    timestamps: false // using custom uploadedAt field
  });

  return UserFile;
};
