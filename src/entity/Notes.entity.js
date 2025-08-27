const { formatDate, formatTime } = require("../utils/dateFormatters");
module.exports = (sequelize, Sequelize) => {
  const Notes = sequelize.define(
    "notes",
    {
      noteId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: "note_id",
      },
      userId: {
        type: Sequelize.INTEGER,
        field: "note_user_id",
        references: {
          model: "user",
          key: "user_id",
        },
        allowNull: false,
      },
      courseId: {
        type: Sequelize.INTEGER,
        references: {
          model: "course",
          key: "course_id",
        },
        field: "note_course_id",
        allowNull: false,
      },
      courseContentId: {
        type: Sequelize.INTEGER,
        references: {
          model: "course_content",
          key: "course_content_id",
        },
        field: "note_course_content_id",
      },
      noteTitle: {
        type: Sequelize.STRING(200),
        field: "note_title",
      },
      noteContent: {
        type: Sequelize.TEXT,
        field: "note_content",
        allowNull: false,
      },
      noteRefTimestamp: {
        type: Sequelize.FLOAT,
        field: "note_ref_timestamp",
      },
      metadata: {
        type: Sequelize.JSONB,
        field: "note_metadata",
        defaultValue: {},
      },
      v_note_ref_timestamp: {
        type: Sequelize.VIRTUAL,
        get() {
          const totalSeconds = this.noteRefTimestamp || 0;
          // Calculate minutes and remaining seconds
          const minutes = Math.floor(totalSeconds / 60);
          const seconds = Math.floor(totalSeconds % 60);

          // Pad the seconds with a leading zero if needed
          const formattedSeconds = String(seconds).padStart(2, "0");

          // Return the formatted string
          return `${minutes}:${formattedSeconds}`;
        },
      },
      v_created_date: {
        type: Sequelize.VIRTUAL,
        get() {
          return formatDate(this.note_created_at);
        },
      },
      v_created_time: {
        type: Sequelize.VIRTUAL,
        get() {
          return formatTime(this.note_created_at);
        },
      },
      v_updated_date: {
        type: Sequelize.VIRTUAL,
        get() {
          return formatDate(this.note_updated_at);
        },
      },
      v_updated_time: {
        type: Sequelize.VIRTUAL,
        get() {
          return formatTime(this.note_updated_at);
        },
      },
    },
    {
      timestamps: true,
      createdAt: "note_created_at",
      updatedAt: "note_updated_at",
      deletedAt: "note_deleted_at",
      paranoid: true,
      indexes: [
        {
          fields: ["note_user_id"],
        },
        {
          fields: ["note_course_id"],
        },
        {
          fields: ["note_course_content_id"],
        },
      ],
    }
  );
  return Notes;
};
