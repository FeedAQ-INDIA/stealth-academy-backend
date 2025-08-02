module.exports = (sequelize, Sequelize) => {
  const ListeningClip = sequelize.define("listening_clip", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "listening_clip_id",
    },
    level: {
      type: Sequelize.ENUM("beginner", "intermediate", "expert"),
      allowNull: false,
      field: "listening_clip_level",
    },
    title: {
      type: Sequelize.STRING(255),
      allowNull: false,
      field: "listening_clip_title",
    },
    audioUrl: {
      type: Sequelize.STRING(255),
      allowNull: false,
      field: "listening_clip_audio_url",
    },
    transcriptText: {
      type: Sequelize.TEXT,
      allowNull: true,
      field: "listening_clip_transcript_text",
    },
  }, {
    timestamps: true,
    createdAt: "listening_clip_created_at",
    updatedAt: "listening_clip_updated_at",
  });

  return ListeningClip;
};