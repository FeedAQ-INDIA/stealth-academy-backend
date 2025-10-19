const express = require("express");
const router = express.Router();
const notificationController = require("../controller/Notification.controller.js");
const authMiddleware = require("../middleware/authMiddleware");

/**
 * @route POST /api/notifications/getNotifications
 * @desc Get notifications for the authenticated user
 * @access Private
 */
router.post("/getNotifications", authMiddleware, notificationController.getNotifications);

/**
 * @route POST /api/notifications/archiveNotifications
 * @desc Archive notifications for the authenticated user
 * @access Private
 */
router.post("/archiveNotifications", authMiddleware, notificationController.archiveNotifications);

/**
 * @route POST /api/notifications/markAsRead
 * @desc Mark notifications as read for the authenticated user
 * @access Private
 */
router.post("/markAsRead", authMiddleware, notificationController.markNotificationsAsRead);

module.exports = router;
