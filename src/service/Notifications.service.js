const db = require("../entity/index.js");
const { Op } = require("sequelize");

/**
 * Create a new notification
 * @param {Object} notificationData - The notification data
 * @param {number} notificationData.userId - The user ID to send notification to
 * @param {string} notificationData.notificationType - Type of notification (COURSE_INVITE, STUDY_GROUP_INVITE, etc.)
 * @param {Object} notificationData.notificationReq - Additional notification data in JSON format
 * @param {boolean} notificationData.isActionRequired - Whether the notification requires user action
 * @returns {Promise<Object>} Created notification
 */
const createNotification = async ({ userId, notificationType, notificationReq = {}, isActionRequired = false }) => {
  try {
    // Validate required fields
    if (!userId || !notificationType) {
      throw new Error('userId and notificationType are required fields');
    }

    // Validate notification type against the enum values
    const validTypes = ['COURSE_INVITE', 'STUDY_GROUP_INVITE', 'COURSE_UPDATE', 'SYSTEM', 'CREDIT_UPDATE'];
    if (!validTypes.includes(notificationType)) {
      throw new Error(`Invalid notification type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Construct the notification entity
    const notificationEntity = {
      userId,
      notificationType,
      notificationReq,
      isActionRequired,
      status: 'UNREAD' // Default status for new notifications
    };

    // Create and return the notification
    const notification = await db.Notifications.create(notificationEntity);
    return notification;
  } catch (error) {
    throw new Error(`Failed to create notification: ${error.message}`);
  }
};

/**
 * Get notifications for a user
 * @param {number} userId - The user ID
 * @param {Object} options - Query options
 * @param {string} options.status - Filter by status (UNREAD, READ, ARCHIVED)
 * @param {number} options.limit - Number of notifications to return
 * @param {number} options.offset - Offset for pagination
 * @returns {Promise<Object>} Notifications with count
 */
const getUserNotifications = async (userId, options = {}) => {
  const { status, limit = 10, offset = 0 } = options;
  
  try {
    const query = {
      where: { userId , status:'UNREAD'  },
      order: [['notification_created_at', 'DESC']],
      limit,
      offset
    };

 

    const { count, rows } = await db.Notifications.findAndCountAll(query);
    return { total: count, notifications: rows, limit, offset };
  } catch (error) {
    throw new Error(`Failed to fetch notifications: ${error.message}`);
  }
};

/**
 * Mark notifications as read
 * @param {number} userId - The user ID
 * @param {number[]} notificationIds - Array of notification IDs to mark as read
 * @returns {Promise<number>} Number of notifications updated
 */
const markNotificationsAsRead = async (userId, notificationIds) => {
  try {
    const [updatedCount] = await db.Notifications.update(
      { status: 'READ' },
      {
        where: {
          userId,
          notificationId: {
            [Op.in]: notificationIds
          }
        }
      }
    );
    return updatedCount;
  } catch (error) {
    throw new Error(`Failed to mark notifications as read: ${error.message}`);
  }
};

/**
 * Archive notifications
 * @param {number} userId - The user ID
 * @param {number[]} notificationIds - Array of notification IDs to archive
 * @returns {Promise<number>} Number of notifications archived
 */
const archiveNotifications = async (userId, notificationIds) => {
  try {
    const [updatedCount] = await db.Notifications.update(
      { status: 'ARCHIVED' },
      {
        where: {
          userId,
          notificationId: {
            [Op.in]: notificationIds
          }
        }
      }
    );
    return updatedCount;
  } catch (error) {
    throw new Error(`Failed to archive notifications: ${error.message}`);
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  markNotificationsAsRead,
  archiveNotifications
};