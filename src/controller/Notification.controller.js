const logger = require("../config/winston.config");
const NotificationService = require("../service/Notifications.service.js");
const { ApiResponse } = require("../utils/responseFormatter");

/**
 * Get notifications for the authenticated user
 * @route POST /api/notifications/getNotifications
 */
async function getNotifications(req, res, next) {
  const apiResponse = new ApiResponse(req, res);
  
  try {
    const { limit, offset } = req.body;
    const userId = req.user.userId;

    const options = {};
    if (limit) options.limit = parseInt(limit);
    if (offset) options.offset = parseInt(offset);

    const result = await NotificationService.getUserNotifications(userId, options);

    apiResponse
      .status(200)
      .withMessage("Notifications fetched successfully")
      .withData({ 
        notifications: result,
        count: result?.length || 0
      })
      .withMeta({
        userId,
        limit: options.limit,
        offset: options.offset
      })
      .success();
  } catch (err) {
    logger.error(`Error occurred while fetching notifications:`, err.message);
    
    apiResponse
      .status(500)
      .withMessage(err.message || "Failed to fetch notifications")
      .withError(err.message, err.code || "GET_NOTIFICATIONS_ERROR", "getNotifications")
      .withMeta({
        userId: req.user?.userId
      })
      .error();
  }
}

/**
 * Archive notifications for the authenticated user
 * @route POST /api/notifications/archiveNotifications
 */
async function archiveNotifications(req, res, next) {
  const apiResponse = new ApiResponse(req, res);
  
  try {
    const { notificationIds } = req.body;
    const userId = req.user.userId;

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return apiResponse
        .status(400)
        .withMessage("notificationIds is required and must be a non-empty array")
        .withError("notificationIds is required and must be a non-empty array", "INVALID_INPUT", "archiveNotifications")
        .error();
    }

    const updatedCount = await NotificationService.archiveNotifications(userId, notificationIds);

    apiResponse
      .status(200)
      .withMessage("Notifications archived successfully")
      .withData({ 
        updatedCount,
        notificationIds
      })
      .withMeta({
        userId,
        archivedCount: updatedCount,
        requestedCount: notificationIds.length
      })
      .success();
  } catch (err) {
    logger.error(`Error occurred while archiving notifications:`, err.message);
    
    apiResponse
      .status(500)
      .withMessage(err.message || "Failed to archive notifications")
      .withError(err.message, err.code || "ARCHIVE_NOTIFICATIONS_ERROR", "archiveNotifications")
      .withMeta({
        userId: req.user?.userId,
        notificationIds: req.body.notificationIds
      })
      .error();
  }
}

/**
 * Mark notifications as read for the authenticated user
 * @route POST /api/notifications/markAsRead
 */
async function markNotificationsAsRead(req, res, next) {
  const apiResponse = new ApiResponse(req, res);
  
  try {
    const { notificationIds } = req.body;
    const userId = req.user.userId;

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return apiResponse
        .status(400)
        .withMessage("notificationIds is required and must be a non-empty array")
        .withError("notificationIds is required and must be a non-empty array", "INVALID_INPUT", "markNotificationsAsRead")
        .error();
    }

    const updatedCount = await NotificationService.markNotificationsAsRead(userId, notificationIds);

    apiResponse
      .status(200)
      .withMessage("Notifications marked as read successfully")
      .withData({ 
        updatedCount,
        notificationIds
      })
      .withMeta({
        userId,
        markedCount: updatedCount,
        requestedCount: notificationIds.length
      })
      .success();
  } catch (err) {
    logger.error(`Error occurred while marking notifications as read:`, err.message);
    
    apiResponse
      .status(500)
      .withMessage(err.message || "Failed to mark notifications as read")
      .withError(err.message, err.code || "MARK_NOTIFICATIONS_READ_ERROR", "markNotificationsAsRead")
      .withMeta({
        userId: req.user?.userId,
        notificationIds: req.body.notificationIds
      })
      .error();
  }
}

module.exports = {
  getNotifications,
  archiveNotifications,
  markNotificationsAsRead
};
