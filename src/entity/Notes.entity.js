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
        comment: "Stores file attachments and other metadata. Schema: { attachments: [{fileId, fileName, fileUrl, mimeType, fileSize}], hasAttachments: boolean, attachmentCount: number, ...otherData }"
      },
      // Virtual fields for attachment info
      v_has_attachments: {
        type: Sequelize.VIRTUAL,
        get() {
          return this.metadata?.hasAttachments || false;
        },
      },
      v_attachment_count: {
        type: Sequelize.VIRTUAL,
        get() {
          return this.metadata?.attachmentCount || 0;
        },
      },
      v_attachment_types: {
        type: Sequelize.VIRTUAL,
        get() {
          const attachments = this.metadata?.attachments || [];
          return [...new Set(attachments.map(a => a.mimeType?.split('/')[0]).filter(Boolean))];
        },
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
      // paranoid: true,
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
        {
          fields: ["note_created_at"],
          name: "idx_notes_created_at"
        },
        {
          fields: ["note_user_id", "note_course_id"],
          name: "idx_notes_user_course"
        },
        {
          // JSONB index for attachment queries
          fields: [
            {
              name: "note_metadata",
              operator: "jsonb_path_ops"
            }
          ],
          using: "gin",
          name: "idx_notes_metadata_gin"
        }
      ],
    }
  );
  return Notes;
};
