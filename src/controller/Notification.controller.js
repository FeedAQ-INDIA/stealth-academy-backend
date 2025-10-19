const logger = require("../config/winston.config");
const NotificationService = require("../service/Notifications.service.js");

/**
 * Get notifications for the authenticated user
 * @route POST /api/notifications/getNotifications
 */
async function getNotifications(req, res, next) {
  try {
    const { limit, offset } = req.body;
    const userId = req.user.userId;

    const options = {};
     if (limit) options.limit = parseInt(limit);
    if (offset) options.offset = parseInt(offset);

    const result = await NotificationService.getUserNotifications(userId, options);

    res.status(200).send({
      status: 200,
      message: "Notifications fetched successfully",
      data: result
    });
  } catch (err) {
    logger.error(`Error occurred while fetching notifications:`, err.message);
    res.status(500).send({
      status: 500,
      message: err.message || "Error occurred while fetching notifications"
    });
    next(err);
  }
}

/**
 * Archive notifications for the authenticated user
 * @route POST /api/notifications/archiveNotifications
 */
async function archiveNotifications(req, res, next) {
  try {
    const { notificationIds } = req.body;
    const userId = req.user.userId;

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).send({
        status: 400,
        message: "notificationIds is required and must be a non-empty array"
      });
    }

    const updatedCount = await NotificationService.archiveNotifications(userId, notificationIds);

    res.status(200).send({
      status: 200,
      message: "Notifications archived successfully",
      data: { updatedCount }
    });
  } catch (err) {
    logger.error(`Error occurred while archiving notifications:`, err.message);
    res.status(500).send({
      status: 500,
      message: err.message || "Error occurred while archiving notifications"
    });
    next(err);
  }
}

/**
 * Mark notifications as read for the authenticated user
 * @route POST /api/notifications/markAsRead
 */
async function markNotificationsAsRead(req, res, next) {
  try {
    const { notificationIds } = req.body;
    const userId = req.user.userId;

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).send({
        status: 400,
        message: "notificationIds is required and must be a non-empty array"
      });
    }

    const updatedCount = await NotificationService.markNotificationsAsRead(userId, notificationIds);

    res.status(200).send({
      status: 200,
      message: "Notifications marked as read successfully",
      data: { updatedCount }
    });
  } catch (err) {
    logger.error(`Error occurred while marking notifications as read:`, err.message);
    res.status(500).send({
      status: 500,
      message: err.message || "Error occurred while marking notifications as read"
    });
    next(err);
  }
}

module.exports = {
  getNotifications,
  archiveNotifications,
  markNotificationsAsRead
};
