const { formatDate, formatTime } = require("../utils/dateFormatters");

module.exports = (sequelize, Sequelize) => {
  const Course = sequelize.define("course", {
    courseId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "course_id",
    },
    userId: {
      type: Sequelize.INTEGER,
      field: "course_user_id",
      references: {
        model: "user",
        key: "user_id",
      },
    },
    orgId: {
      type: Sequelize.INTEGER,
      field: "course_org_id",
      references: {
        model: "organization",
        key: "org_id",
      },
    },
    // isMarketplaceFlag: {
    //   type: Sequelize.BOOLEAN,
    //   field: "is_marketplace_flag",
    //   defaultValue: false,
    // },
    courseTitle: {
      type: Sequelize.STRING(100),
      field: "course_title",
      allowNull: false,
    },
    courseDescription: {
      type: Sequelize.TEXT,
      field: "course_description",
    },
    courseImageUrl: {
      type: Sequelize.STRING(500),
      field: "course_image_url",
    },
    courseDuration: {
      type: Sequelize.INTEGER,
      field: "course_duration",
      allowNull: false
    },
    courseValidity: {
      type: Sequelize.INTEGER,
      field: "course_validity"
    },
    courseSourceChannel: {
      type: Sequelize.STRING(100),
      field: "course_source_channel",
    },
    // courseSourceMode: {
    //   type: Sequelize.ENUM("YOUTUBE", "VIMEO", "CUSTOM"),
    //   field: "course_source_mode",
    //   allowNull: false,
    // },
    courseType: {
      type: Sequelize.ENUM("BYOC", "INSTRUCTOR_LED"),
      field: "course_delivery_mode",
      allowNull: false,
      defaultValue: "BYOC",
    },
    deliveryMode: {
      type: Sequelize.ENUM("ONLINE", "OFFLINE", "HYBRID"),
      field: "course_delivery_mode",
      allowNull: false,
      defaultValue: "ONLINE",
    },
    status: {
      type: Sequelize.ENUM("DRAFT", "PUBLISHED","ACTIVE", "INACTIVE", "ARCHIVED"),
      field: "course_status",
      defaultValue: "DRAFT",
    },
    metadata: {
      type: Sequelize.JSONB,
      field: "course_metadata",
      allowNull: true,
      defaultValue: {}
    },
    v_created_date: {
      type: Sequelize.VIRTUAL,
      get() {
        return formatDate(this.course_created_at);
      },
    },
    v_created_time: {
      type: Sequelize.VIRTUAL,
      get() {
        return formatTime(this.course_created_at);
      },
    },
    v_updated_date: {
      type: Sequelize.VIRTUAL,
      get() {
        return formatDate(this.course_updated_at);
      },
    },
    v_updated_time: {
      type: Sequelize.VIRTUAL,
      get() {
        return formatTime(this.course_updated_at);
      },
    },
  }, {
    timestamps: true,
    createdAt: "course_created_at",
    updatedAt: "course_updated_at",
    deletedAt: "course_deleted_at",
    paranoid: true, // Enable soft deletes
    indexes: [
      {
        fields: ['course_user_id']
      },
      {
        fields: ['course_org_id']
      },
      {
        fields: ['course_status']
      }, 
    ],
  });

 

  return Course;
};


