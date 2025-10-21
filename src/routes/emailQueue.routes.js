const express = require('express');
const router = express.Router();
const emailQueueController = require('../controller/EmailQueue.controller');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * Email Queue Management Routes
 * All routes require authentication
 */

/**
 * @route GET /api/email-queue/health
 * @desc Check email queue system health
 * @access Public
 */
router.get('/health', emailQueueController.checkEmailQueueHealth);

/**
 * @route GET /api/email-queue/stats
 * @desc Get email queue statistics
 * @access Private (Admin only recommended)
 */
router.get('/stats', authMiddleware, emailQueueController.getEmailQueueStats);

/**
 * @route POST /api/email-queue/clean
 * @desc Clean old jobs from queue
 * @access Private (Admin only)
 */
router.post('/clean', authMiddleware, emailQueueController.cleanEmailQueue);

/**
 * @route POST /api/email-queue/test
 * @desc Send a test email
 * @access Private (Admin only)
 * @body { to: string, subject?: string }
 */
router.post('/test', authMiddleware, emailQueueController.sendTestEmail);

/**
 * @route POST /api/email-queue/send
 * @desc Send a custom email
 * @access Private (Admin only)
 * @body { to: string, subject: string, text?: string, html?: string, ... }
 */
router.post('/send', authMiddleware, emailQueueController.sendCustomEmail);

module.exports = router;
