// UserLearningSchedule.entity.js
// Entity for managing a user's learning schedule for courses

const { formatDate, formatTime } = require("../utils/dateFormatters");
 
module.exports = (sequelize, Sequelize) => {

const UserLearningSchedule = sequelize.define("user_learning_schedule", {
  userLearningScheduleId: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: "user_learning_schedule_id",
  },
  userId: {
    type: Sequelize.INTEGER,
    field: "learning_schedule_user_id",
    allowNull: false,
    references: {
      model: "Users",
      key: "id",
    },
  },
  courseId: {
    type: Sequelize.INTEGER,
    field: "learning_schedule_course_id",
    allowNull: false,
    references: {
      model: "Courses",
      key: "id",
    },
  },
  scheduledDate: {
    type: Sequelize.DATEONLY,
    field: "learning_schedule_date",
    allowNull: false,
  },
  topic: {
    type: Sequelize.STRING(200),
    field: "learning_schedule_topic",
    allowNull: false,
  },
  notes: {
    type: Sequelize.TEXT,
    field: "learning_schedule_notes",
    allowNull: true,
  },
  status: {
    type: Sequelize.ENUM("PENDING", "COMPLETED", "SKIPPED"),
    field: "learning_schedule_status",
    defaultValue: "PENDING",
  },
  isActive: {
    type: Sequelize.BOOLEAN,
    field: "learning_schedule_is_active",
    defaultValue: true
  },
  metadata: {
    type: Sequelize.JSONB,
    field: "learning_schedule_metadata",
    defaultValue: {}
  },
  v_created_date: {
    type: Sequelize.VIRTUAL,
    get() {
      return formatDate(this.learning_schedule_created_at);
    },
  },
  v_created_time: {
    type: Sequelize.VIRTUAL,
    get() {
      return formatTime(this.learning_schedule_created_at);
    },
  },
  v_updated_date: {
    type: Sequelize.VIRTUAL,
    get() {
      return formatDate(this.learning_schedule_updated_at);
    },
  },
  v_updated_time: {
    type: Sequelize.VIRTUAL,
    get() {
      return formatTime(this.learning_schedule_updated_at);
    },
  },
  v_topic_preview: {
    type: Sequelize.VIRTUAL,
    get() {
      if (!this.topic) return '';
      return this.topic.length > 100 
        ? this.topic.substring(0, 100) + '...'
        : this.topic;
    }
  }
}, {
  timestamps: true,
  createdAt: "learning_schedule_created_at",
  updatedAt: "learning_schedule_updated_at",
  paranoid: true,
  deletedAt: "learning_schedule_deleted_at",
 
});

return UserLearningSchedule;
}

 