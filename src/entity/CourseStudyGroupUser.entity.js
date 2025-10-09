// CourseStudyGroupUser.entity.js
// Junction table for many-to-many mapping between users and study groups

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
      courseStudyGroupId: {
        type: Sequelize.INTEGER,
        field: "course_study_group_id",
        allowNull: false,
        references: {
          model: "course_study_group",
          key: "course_study_group_id",
        },
      },
      userId: {
        type: Sequelize.INTEGER,
        field: "user_id",
        allowNull: false,
        references: {
          model: "user",
          key: "user_id",
        },
      },
      role: {
        type: Sequelize.ENUM('MEMBER', 'ADMIN', 'OWNER'),
        field: "user_role",
        allowNull: false,
        defaultValue: 'MEMBER',
      },
      joinedAt: {
        type: Sequelize.DATE,
        field: "joined_at",
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      invitedBy: {
        type: Sequelize.INTEGER,
        field: "invited_by",
        allowNull: true,
        references: {
          model: "user",
          key: "user_id",
        },
      },
      v_joined_date: {
        type: Sequelize.VIRTUAL,
        get() {
          return formatDate(this.joined_at);
        },
      },
      v_joined_time: {
        type: Sequelize.VIRTUAL,
        get() {
          return formatTime(this.joined_at);
        },
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
    },
    {
      timestamps: true,
      createdAt: "course_study_group_user_created_at",
      updatedAt: "course_study_group_user_updated_at",
      // paranoid: true,
      deletedAt: "course_study_group_user_deleted_at",
      indexes: [
        {
          name: 'idx_unique_group_user',
          unique: true,
          fields: ['course_study_group_id', 'user_id']
        },
        {
          name: 'idx_group_id',
          fields: ['course_study_group_id']
        },
        {
          name: 'idx_user_id',
          fields: ['user_id']
        },
        
      ]
    }
  );
  return CourseStudyGroupUser;
};
