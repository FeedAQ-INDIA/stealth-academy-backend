// CourseStudyGroup.entity.js
// Entity for managing study groups within a course

const { formatDate, formatTime } = require("../utils/dateFormatters");
 
module.exports = (sequelize, Sequelize) => {
  const CourseStudyGroup = sequelize.define(
    "course_study_group",
    {
      courseStudyGroupId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: "course_study_group_id",
      },
      courseId: {
        type: Sequelize.INTEGER,
        field: "study_group_course_id",
        allowNull: false,
        references: {
          model: "Courses",
          key: "id",
        },
      },
      groupName: {
        type: Sequelize.STRING(200),
        field: "study_group_name",
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        field: "study_group_description",
        allowNull: true,
      },
      createdBy: {
        type: Sequelize.INTEGER,
        field: "study_group_created_by",
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        field: "study_group_is_active",
        defaultValue: true,
      },
      status: {
        type: Sequelize.ENUM("DRAFT", "ACTIVE", "ARCHIVED"),
        field: "study_group_status",
        defaultValue: "DRAFT",
      },
      analyticsVisibility: {
        type: Sequelize.JSONB,
        field: "study_group_analytics_visibility",
      },
      metadata: {
        type: Sequelize.JSONB,
        field: "study_group_metadata",
      },
      v_created_date: {
        type: Sequelize.VIRTUAL,
        get() {
          return formatDate(this.study_group_created_at);
        },
      },
      v_created_time: {
        type: Sequelize.VIRTUAL,
        get() {
          return formatTime(this.study_group_created_at);
        },
      },
      v_updated_date: {
        type: Sequelize.VIRTUAL,
        get() {
          return formatDate(this.study_group_updated_at);
        },
      },
      v_updated_time: {
        type: Sequelize.VIRTUAL,
        get() {
          return formatTime(this.study_group_updated_at);
        },
      },
      v_description_preview: {
        type: Sequelize.VIRTUAL,
        get() {
          if (!this.description) return "";
          return this.description.length > 150
            ? this.description.substring(0, 150) + "..."
            : this.description;
        },
      },
    },
    {
      timestamps: true,
      createdAt: "study_group_created_at",
      updatedAt: "study_group_updated_at",
      paranoid: true,
      deletedAt: "study_group_deleted_at",
    }
  );
  return CourseStudyGroup;
};
