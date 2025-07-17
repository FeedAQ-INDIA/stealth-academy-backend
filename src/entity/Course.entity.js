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
      allowNull: false,
      references: {
        model: "user",
        key: "user_id",
      },
      onDelete: 'CASCADE'
    },
    courseTitle: {
      type: Sequelize.STRING(100),
      field: "course_title",
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [5, 100]
      }
    },
    courseDescription: {
      type: Sequelize.TEXT,
      field: "course_description",
    },
    courseIsLocked: {
      type: Sequelize.BOOLEAN,
      field: "course_is_locked",
      defaultValue: true,
    },
    courseImageUrl: {
      type: Sequelize.STRING(500),
      field: "course_image_url",
      validate: {
        isUrlArray(value) {
          if (value && !Array.isArray(value)) {
            throw new Error('courseImageUrl must be an array of URLs');
          }
          if (value) {
            value.forEach(url => {
              if (typeof url !== 'string' || url.length > 500) {
                throw new Error('Each URL must be a string with max length 500 characters');
              }
            });
          }
        }
      }
    },
    courseDuration: {
      type: Sequelize.INTEGER,
      field: "course_duration",
      allowNull: false,
      validate: {
        min: 0,
        isInt: true
      }
    },
    courseValidity: {
      type: Sequelize.INTEGER,
      field: "course_validity",
      validate: {
        min: 0,
        isInt: true
      }
    },
    courseSourceChannel: {
      type: Sequelize.STRING(100),
      field: "course_source_channel",
      validate: {
        len: [0, 100]
      }
    },
    courseSourceMode: {
      type: Sequelize.ENUM("YOUTUBE"),
      field: "course_source_mode",
      allowNull: false,
    },
    deliveryMode: {
      type: Sequelize.ENUM("ONLINE", "OFFLINE", "HYBRID"),
      field: "course_delivery_mode",
      allowNull: false,
      defaultValue: "ONLINE",
    },
    status: {
      type: Sequelize.ENUM("DRAFT", "PUBLISHED", "ARCHIVED"),
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
    paranoid: true, // Enable soft deletes
    indexes: [
      {
        fields: ['course_user_id']
      },
      {
        fields: ['course_title']
      },
      {
        fields: ['course_status']
      },
      {
        fields: ['course_delivery_mode']
      }
    ], 
  });

 

  return Course;
};


