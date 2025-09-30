// CourseStudyGroup.entity.js
// Entity for managing study groups within a course

const { formatDate, formatTime } = require("../utils/dateFormatters");

module.exports = (sequelize, Sequelize) => {
  const CourseStudyGroupUser = sequelize.define(
    "course_study_group_user",
    {
      courseStudyGroupUserId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: "course_study_group_user_id",
      },
      courseId: {
        type: Sequelize.INTEGER,
        field: "course_study_group_user_course_id",
        allowNull: false,
        references: {
          model: "Courses",
          key: "id",
        },
      },
      groupName: {
        type: Sequelize.STRING(200),
        field: "course_study_group_user_name",
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        field: "course_study_group_user_description",
        allowNull: true,
      },
      createdBy: {
        type: Sequelize.INTEGER,
        field: "course_study_group_user_created_by",
        allowNull: false,
        references: {
          model: "user",
          key: "user_id",
        },
      },
      ownedBy: {
        type: Sequelize.INTEGER,
        field: "course_study_group_user_owned_by",
        allowNull: false,
        references: {
          model: "user",
          key: "user_id",
        },
      },
      organizationId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "organization",
          key: "org_id",
        },
        field: "course_study_group_user_org_id",
      },
      analyticsVisibility: {
        type: Sequelize.JSONB,
        field: "course_study_group_user_analytics_visibility",
      },
      metadata: {
        type: Sequelize.JSONB,
        field: "course_study_group_user_metadata",
      },
      v_created_date: {
        type: Sequelize.VIRTUAL,
        get() {
          return formatDate(this.course_study_group_user_created_at);
        },
      },
      v_created_time: {
        type: Sequelize.VIRTUAL,
        get() {
          return formatTime(this.course_study_group_user_created_at);
        },
      },
      v_updated_date: {
        type: Sequelize.VIRTUAL,
        get() {
          return formatDate(this.course_study_group_user_updated_at);
        },
      },
      v_updated_time: {
        type: Sequelize.VIRTUAL,
        get() {
          return formatTime(this.course_study_group_user_updated_at);
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
      createdAt: "course_study_group_user_created_at",
      updatedAt: "course_study_group_user_updated_at",
      paranoid: true,
      deletedAt: "course_study_group_user_deleted_at",
            indexes: [
            {
                name: 'idx_c_unique_access',
                unique: true,
                fields: ['course_access_course_id', 'course_access_user_id', 'course_access_org_id']
            }
      ]
    }
  );
  return CourseStudyGroupUser;
};
