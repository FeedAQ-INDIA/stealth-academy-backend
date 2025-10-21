const {formatDate, formatTime} = require("../utils/dateFormatters");

module.exports = (sequelize, Sequelize) => {
  const Notifications = sequelize.define("notifications", {
    notificationId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "notification_id",
    },
    userId: {
      type: Sequelize.INTEGER,
      field: "user_id",
      allowNull: true,
      references: {
        model: 'user',
        key: 'user_id'
      }
    },
    notificationType: {
      type: Sequelize.ENUM('COURSE_INVITE', 'COURSE_INVITE_DECLINED', 'COURSE_UPDATE', 'SYSTEM', 'CREDIT_UPDATE'),
      field: "notification_type",
      allowNull: false
    },
    notificationReq: {
      type: Sequelize.JSONB,
      field: "notification_req",
      defaultValue: {}
    },
    status: {
      type: Sequelize.ENUM('UNREAD', 'READ', 'ARCHIVED'),
      field: "notification_status",
      defaultValue: 'UNREAD'
    },
    isActionRequired: {
      type: Sequelize.BOOLEAN,
      field: "is_action_required",
      defaultValue: false
    },
    created_date: {
      type: Sequelize.VIRTUAL,
      get() {
        return formatDate(this.notification_created_at);
      },
    },
    v_created_time: {
      type: Sequelize.VIRTUAL,
      get() {
        return formatTime(this.notification_created_at);
      },
    },
    v_updated_date: {
      type: Sequelize.VIRTUAL,
      get() {
        return formatDate(this.notification_updated_at);
      },
    },
    v_updated_time: {
      type: Sequelize.VIRTUAL,
      get() {
        return formatTime(this.notification_updated_at);
      },
    },
  }, {
    timestamps: true,
    createdAt: "notification_created_at",
    updatedAt: "notification_updated_at",
    deletedAt: "notification_deleted_at",
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['notification_status']
      }
    ],
  });

  return Notifications;
};