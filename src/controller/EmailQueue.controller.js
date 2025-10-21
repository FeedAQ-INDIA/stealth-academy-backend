const { getQueueStats, cleanQueue } = require('../queues/emailQueue');
const emailService = require('../utils/emailService');
const logger = require('../config/winston.config');

/**
 * Email Queue Controller
 * Provides endpoints to manage and monitor the email queue
 */

/**
 * Get queue statistics
 * @route GET /api/email-queue/stats
 */
const getEmailQueueStats = async (req, res) => {
    try {
        const stats = await getQueueStats();

        res.status(200).json({
            success: true,
            data: stats,
            message: 'Queue statistics retrieved successfully'
        });
    } catch (error) {
        logger.error('Failed to get queue stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve queue statistics',
            error: error.message
        });
    }
};

/**
 * Clean old completed jobs from the queue
 * @route POST /api/email-queue/clean
 */
const cleanEmailQueue = async (req, res) => {
    try {
        const { gracePeriod = 24 * 3600 * 1000 } = req.body; // Default 24 hours

        await cleanQueue(gracePeriod);

        res.status(200).json({
            success: true,
            message: `Queue cleaned successfully. Removed jobs older than ${gracePeriod / 1000} seconds`
        });
    } catch (error) {
        logger.error('Failed to clean queue:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clean queue',
            error: error.message
        });
    }
};

/**
 * Send a test email
 * @route POST /api/email-queue/test
 */
const sendTestEmail = async (req, res) => {
    try {
        const { to, subject = 'Test Email from FeedAQ Academy' } = req.body;

        if (!to) {
            return res.status(400).json({
                success: false,
                message: 'Recipient email (to) is required'
            });
        }

        const result = await emailService.sendTestEmail(to, subject);

        res.status(200).json({
            success: true,
            data: result,
            message: 'Test email queued successfully'
        });
    } catch (error) {
        logger.error('Failed to send test email:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to queue test email',
            error: error.message
        });
    }
};

/**
 * Send a custom email
 * @route POST /api/email-queue/send
 */
const sendCustomEmail = async (req, res) => {
    try {
        const {
            to,
            subject,
            text,
            html,
            from,
            cc,
            bcc,
            replyTo,
            priority,
            delay
        } = req.body;

        // Validation
        if (!to || !subject) {
            return res.status(400).json({
                success: false,
                message: 'Recipient email (to) and subject are required'
            });
        }

        if (!text && !html) {
            return res.status(400).json({
                success: false,
                message: 'Either text or html content is required'
            });
        }

        const result = await emailService.sendEmail({
            to,
            subject,
            text,
            html,
            from,
            cc,
            bcc,
            replyTo
        }, {
            priority,
            delay
        });

        res.status(200).json({
            success: true,
            data: result,
            message: 'Email queued successfully'
        });
    } catch (error) {
        logger.error('Failed to send custom email:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to queue email',
            error: error.message
        });
    }
};

/**
 * Health check for email queue system
 * @route GET /api/email-queue/health
 */
const checkEmailQueueHealth = async (req, res) => {
    try {
        const { getRedisConnection } = require('../config/redis.config');
        
        // getRedisConnection is now async, need to await it
        const redis = await getRedisConnection();

        // Check Redis connection
        const redisPing = await redis.ping();
        const redisConnected = redisPing === 'PONG';

        // Get queue stats
        const stats = await getQueueStats();

        // Check if worker is processing jobs
        const workerHealthy = stats.active > 0 || stats.waiting === 0;

        const isHealthy = redisConnected && (stats.failed < 100); // Less than 100 failed jobs

        res.status(isHealthy ? 200 : 503).json({
            success: isHealthy,
            data: {
                redis: {
                    connected: redisConnected,
                    ping: redisPing
                },
                queue: stats,
                worker: {
                    healthy: workerHealthy,
                    status: stats.active > 0 ? 'processing' : 'idle'
                },
                smtp: {
                    configured: !!(process.env.SMTP_USER && process.env.SMTP_PASS)
                }
            },
            message: isHealthy ? 'Email queue system is healthy' : 'Email queue system has issues'
        });
    } catch (error) {
        logger.error('Health check failed:', error);
        res.status(503).json({
            success: false,
            message: 'Health check failed',
            error: error.message
        });
    }
};

module.exports = {
    getEmailQueueStats,
    cleanEmailQueue,
    sendTestEmail,
    sendCustomEmail,
    checkEmailQueueHealth
};
