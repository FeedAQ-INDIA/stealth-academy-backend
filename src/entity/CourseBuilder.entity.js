const { formatDate, formatTime } = require("../utils/dateFormatters");

module.exports = (sequelize, Sequelize) => {
  const CourseBuilder = sequelize.define(
    "course_builder",
    {
      courseBuilderId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: "course_builder_id",
      },
      userId: {
        type: Sequelize.INTEGER,
        field: "course_builder_user_id",
        references: {
          model: "user",
          key: "user_id",
        },
      },
      orgId: {
        type: Sequelize.INTEGER,
        field: "course_builder_org_id",
        references: {
          model: "organization",
          key: "org_id",
        },
      },
      publishedCourseId: {
        type: Sequelize.INTEGER,
        field: "course_builder_pub_course_id",
        references: {
          model: "course",
          key: "course_id",
        },
      },
      status: {
        type: Sequelize.ENUM("DRAFT", "PUBLISHED"),
        field: "course_builder_status",
        defaultValue: "DRAFT",
      },
      courseBuilderData: {
        type: Sequelize.JSONB,
        field: "course_builder_data",
        allowNull: true,
        defaultValue: {},
      },
      v_created_date: {
        type: Sequelize.VIRTUAL,
        get() {
          return formatDate(this.course_builder_created_at);
        },
      },
      v_created_time: {
        type: Sequelize.VIRTUAL,
        get() {
          return formatTime(this.course_builder_created_at);
        },
      },
      v_updated_date: {
        type: Sequelize.VIRTUAL,
        get() {
          return formatDate(this.course_builder_updated_at);
        },
      },
      v_updated_time: {
        type: Sequelize.VIRTUAL,
        get() {
          return formatTime(this.course_builder_updated_at);
        },
      },
    },
    {
      timestamps: true,
      createdAt: "course_builder_created_at",
      updatedAt: "course_builder_updated_at",
      indexes: [
        {
          fields: ["course_builder_user_id"],
        },
        {
          fields: ["course_builder_org_id"],
        },
        {
          fields: ["course_builder_status"],
        },
      ],
    }
  );

  return CourseBuilder;
};
