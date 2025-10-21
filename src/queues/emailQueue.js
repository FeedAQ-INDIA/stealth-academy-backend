const { Queue } = require('bullmq');
const { getRedisConfig } = require('../config/redis.config');
const logger = require('../config/winston.config.js');

/**
 * Email Queue Configuration
 * Handles all email-related jobs asynchronously
 * Using official redis package with BullMQ
 */

let emailQueue = null;

const getEmailQueue = () => {
    if (emailQueue) {
        return emailQueue;
    }

    try {
        // BullMQ will create its own connection using the config
        const connection = getRedisConfig();

        emailQueue = new Queue('email-queue', {
            connection,
            defaultJobOptions: {
                attempts: 3, // Retry failed jobs up to 3 times
                backoff: {
                    type: 'exponential',
                    delay: 2000 // Start with 2 seconds, then 4s, 8s, etc.
                },
                removeOnComplete: {
                    age: 24 * 3600, // Keep completed jobs for 24 hours
                    count: 1000 // Keep last 1000 completed jobs
                },
                removeOnFail: {
                    age: 7 * 24 * 3600 // Keep failed jobs for 7 days
                }
            }
        });

        // Queue event listeners
        emailQueue.on('error', (error) => {
            logger.error('Email queue error:', error);
        });

        logger.info('Email queue initialized successfully');

        return emailQueue;
    } catch (error) {
        logger.error('Failed to initialize email queue:', error);
        throw error;
    }
};

/**
 * Add a course invite email job to the queue
 * @param {Object} emailData - Email data for course invitation
 * @returns {Promise<Object>} Job object
 */
const addCourseInviteEmailJob = async (emailData) => {
    const queue = getEmailQueue();
    
    try {
        const job = await queue.add('course-invite', emailData, {
            priority: 1, // Higher priority for invites
            removeOnComplete: true,
            removeOnFail: false
        });

        logger.info(`Course invite email job added to queue: ${job.id}`);
        return job;
    } catch (error) {
        logger.error('Failed to add course invite email job:', error);
        throw error;
    }
};

/**
 * Add a generic email job to the queue
 * @param {Object} emailData - Email data
 * @returns {Promise<Object>} Job object
 */
const addEmailJob = async (emailData, options = {}) => {
    const queue = getEmailQueue();
    
    try {
        const job = await queue.add('send-email', emailData, {
            priority: options.priority || 5,
            delay: options.delay || 0,
            removeOnComplete: true,
            removeOnFail: false
        });

        logger.info(`Email job added to queue: ${job.id}`);
        return job;
    } catch (error) {
        logger.error('Failed to add email job:', error);
        throw error;
    }
};

/**
 * Add a test email job to the queue
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @returns {Promise<Object>} Job object
 */
const addTestEmailJob = async (to, subject = 'Test Email') => {
    const queue = getEmailQueue();
    
    try {
        const job = await queue.add('test-email', { to, subject }, {
            priority: 10, // Lower priority for test emails
            removeOnComplete: true
        });

        logger.info(`Test email job added to queue: ${job.id}`);
        return job;
    } catch (error) {
        logger.error('Failed to add test email job:', error);
        throw error;
    }
};

/**
 * Get queue metrics and statistics
 * @returns {Promise<Object>} Queue statistics
 */
const getQueueStats = async () => {
    const queue = getEmailQueue();
    
    try {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
            queue.getWaitingCount(),
            queue.getActiveCount(),
            queue.getCompletedCount(),
            queue.getFailedCount(),
            queue.getDelayedCount()
        ]);

        return {
            waiting,
            active,
            completed,
            failed,
            delayed,
            total: waiting + active + completed + failed + delayed
        };
    } catch (error) {
        logger.error('Failed to get queue stats:', error);
        throw error;
    }
};

/**
 * Clean old jobs from the queue
 * @param {number} grace - Grace period in milliseconds
 * @returns {Promise<void>}
 */
const cleanQueue = async (grace = 24 * 3600 * 1000) => {
    const queue = getEmailQueue();
    
    try {
        await queue.clean(grace, 1000, 'completed');
        await queue.clean(7 * 24 * 3600 * 1000, 1000, 'failed');
        logger.info('Email queue cleaned successfully');
    } catch (error) {
        logger.error('Failed to clean email queue:', error);
        throw error;
    }
};

/**
 * Close the queue connection
 * @returns {Promise<void>}
 */
const closeQueue = async () => {
    if (emailQueue) {
        try {
            await emailQueue.close();
            emailQueue = null;
            logger.info('Email queue closed successfully');
        } catch (error) {
            logger.error('Failed to close email queue:', error);
            throw error;
        }
    }
};

module.exports = {
    getEmailQueue,
    addCourseInviteEmailJob,
    addEmailJob,
    addTestEmailJob,
    getQueueStats,
    cleanQueue,
    closeQueue
};
