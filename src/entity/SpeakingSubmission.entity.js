module.exports = (sequelize, Sequelize) => {
  const SpeakingSubmission = sequelize.define("speaking_submission", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "speaking_submission_id",
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "user",
        key: "user_id",
      },
      field: "speaking_submission_user_id",
    },
    topicId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "speaking_topic",
        key: "speaking_topic_id",
      },
      field: "speaking_submission_topic_id",
    },
    audioUrl: {
      type: Sequelize.STRING(255),
      allowNull: false,
      field: "speaking_submission_audio_url",
    },
    submittedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      field: "speaking_submission_submitted_at",
    },
    // New metrics added as separate columns
    audioDuration: {
      type: Sequelize.FLOAT, // Storing in seconds, can be float for decimals
      allowNull: true,
      field: "speaking_submission_audio_duration",
    },
    
    pauseCount: {
      type: Sequelize.INTEGER,
      allowNull: true,
      field: "speaking_submission_pause_count",
    },
    aiReportJson: {
      type: Sequelize.JSON,
      allowNull: true,
      field: "speaking_submission_ai_report_json",
    },
  }, {
    timestamps: true,
    createdAt: "speaking_submission_created_at",
    updatedAt: "speaking_submission_updated_at",
  });

  return SpeakingSubmission;
};
