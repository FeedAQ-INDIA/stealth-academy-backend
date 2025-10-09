// CourseStudyGroupContent.entity.js
// Entity for managing content within study groups

const { formatDate, formatTime } = require("../utils/dateFormatters");

module.exports = (sequelize, Sequelize) => {
  const CourseStudyGroupContent = sequelize.define(
    "course_study_group_content",
    {
      courseStudyGroupContentId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: "course_study_group_content_id",
      },
      courseStudyGroupId: {
        type: Sequelize.INTEGER,
        field: "course_study_group_content_group_id",
        allowNull: false,
        references: {
          model: "course_study_group",
          key: "course_study_group_id",
        },
      },
      courseId: {
        type: Sequelize.INTEGER,
        field: "course_study_group_content_course_id",
        allowNull: false,
        references: {
          model: "course",
          key: "course_id",
        },
      },
      createdBy: {
        type: Sequelize.INTEGER,
        field: "course_study_group_content_created_by",
        allowNull: false,
        references: {
          model: "user",
          key: "user_id",
        },
      },
      lastModifiedBy: {
        type: Sequelize.INTEGER,
        field: "course_study_group_content_last_modified_by",
        allowNull: true,
        references: {
          model: "user",
          key: "user_id",
        },
      },
      v_created_date: {
        type: Sequelize.VIRTUAL,
        get() {
          return formatDate(this.course_study_group_content_created_at);
        },
      },
      v_created_time: {
        type: Sequelize.VIRTUAL,
        get() {
          return formatTime(this.course_study_group_content_created_at);
        },
      },
      v_updated_date: {
        type: Sequelize.VIRTUAL,
        get() {
          return formatDate(this.course_study_group_content_updated_at);
        },
      },
      v_updated_time: {
        type: Sequelize.VIRTUAL,
        get() {
          return formatTime(this.course_study_group_content_updated_at);
        },
      },
    },
    {
      timestamps: true,
      createdAt: "course_study_group_content_created_at",
      updatedAt: "course_study_group_content_updated_at",
      // paranoid: true,
      deletedAt: "course_study_group_content_deleted_at",
      indexes: [
        {
          fields: ['course_study_group_content_group_id']
        },
        {
          fields: ['course_study_group_content_course_id']
        },
      ]
    }
  );

  return CourseStudyGroupContent;
};
