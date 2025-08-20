module.exports = (sequelize, Sequelize) => {
  const WritingSubmission = sequelize.define("writing_submission", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "writing_submission_id",
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "user",
        key: "user_id",
      },
      field: "writing_submission_user_id",
    },
    promptId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "writing_prompt",
        key: "writing_prompt_id",
      },
      field: "writing_submission_prompt_id",
    },
    responseText: {
      type: Sequelize.TEXT,
      allowNull: false,
      field: "writing_submission_response_text",
    },
    submittedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      field: "writing_submission_submitted_at",
    },
    aiReportJson: {
      type: Sequelize.JSON,
      allowNull: true,
      field: "writing_submission_ai_report_json",
    },
    typingSpeed: {
      type: Sequelize.FLOAT,
      allowNull: true,
      field: "writing_submission_typing_speed",
    },
    totalTime: {
      type: Sequelize.INTEGER,
      allowNull: true,
      field: "writing_submission_total_time",
    },
    editHistory: {
      type: Sequelize.JSON,
      allowNull: true,
      field: "writing_submission_edit_history",
    },
    lexicalDiversity: {
      type: Sequelize.FLOAT,
      allowNull: true,
      field: "writing_submission_lexical_diversity",
    },
    wordCount: {
      type: Sequelize.INTEGER,
      allowNull: true,
      field: "writing_submission_word_count",
    },
    avgSentenceLength: {
      type: Sequelize.FLOAT,
      allowNull: true,
      field: "writing_submission_avg_sentence_length",
    },
    questionThinkingTime: {
      type: Sequelize.INTEGER, // Time in milliseconds from page load to clicking 'Start'
      allowNull: true,
      field: "writing_submission_question_thinking_time",
    },
    answerThinkingTime: {
      type: Sequelize.INTEGER, // Time in milliseconds from clicking 'Start' to first keystroke
      allowNull: true,
      field: "writing_submission_answer_thinking_time",
    },
  }, {
    timestamps: true,
    createdAt: "writing_submission_created_at",
    updatedAt: "writing_submission_updated_at",
  });

  return WritingSubmission;
};