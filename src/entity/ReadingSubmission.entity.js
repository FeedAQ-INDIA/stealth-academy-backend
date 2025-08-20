module.exports = (sequelize, Sequelize) => {
  const ReadingSubmission = sequelize.define("reading_submission", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "reading_submission_id",
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "user",
        key: "user_id",
      },
      field: "reading_submission_user_id",
    },
    topicId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "reading_topic",
        key: "reading_topic_id",
      },
      field: "reading_submission_topic_id",
    },
    audioUrl: {
      type: Sequelize.STRING(255),
      allowNull: false,
      field: "reading_submission_audio_url",
    },
    submittedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      field: "reading_submission_submitted_at",
    },
    aiReportJson: {
      type: Sequelize.JSON,
      allowNull: true,
      field: "reading_submission_ai_report_json",
    },
    recordingDuration: {
      type: Sequelize.FLOAT,
      allowNull: true,
      field: "reading_submission_recording_duration",
    },
    attemptsCount: {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 1,
      field: "reading_submission_attempts_count",
    },
    
    
    
    userNotes: {
      type: Sequelize.TEXT,
      allowNull: true,
      field: "reading_submission_user_notes",
    },
  }, {
    timestamps: true,
    createdAt: "reading_submission_created_at",
    updatedAt: "reading_submission_updated_at",
  });

  return ReadingSubmission;
};