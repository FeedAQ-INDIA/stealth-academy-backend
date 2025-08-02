module.exports = (sequelize, Sequelize) => {
  const ListeningSubmission = sequelize.define("listening_submission", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "listening_submission_id",
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "user",
        key: "user_id",
      },
      field: "listening_submission_user_id",
    },
    clipId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "listening_clip",
        key: "listening_clip_id",
      },
      field: "listening_submission_clip_id",
    },
    answers: {
      type: Sequelize.JSON,
      allowNull: false,
      field: "listening_submission_answers",
    },
    submittedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      field: "listening_submission_submitted_at",
    },
    aiReportJson: {
      type: Sequelize.JSON,
      allowNull: true,
      field: "listening_submission_ai_report_json",
    },
  }, {
    timestamps: true,
    createdAt: "listening_submission_created_at",
    updatedAt: "listening_submission_updated_at",
  });

  return ListeningSubmission;
};