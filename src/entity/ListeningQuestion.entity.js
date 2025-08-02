
module.exports = (sequelize, Sequelize) => {
  const ListeningQuestion = sequelize.define("listening_question", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "listening_question_id",
    },
    clipId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "listening_clip",
        key: "listening_clip_id",
      },
      field: "listening_question_clip_id",
    },
    questionText: {
      type: Sequelize.TEXT,
      allowNull: false,
      field: "listening_question_text",
    },
    options: {
      type: Sequelize.JSON,
      allowNull: false,
      field: "listening_question_options",
    },
    correctAnswer: {
      type: Sequelize.STRING(100),
      allowNull: false,
      field: "listening_question_correct_answer",
    },
  }, {
    timestamps: true,
    createdAt: "listening_question_created_at",
    updatedAt: "listening_question_updated_at",
  });

  return ListeningQuestion;
};
