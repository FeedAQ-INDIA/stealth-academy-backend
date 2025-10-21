const logger = require('../config/winston.config.js');
const { addEmailJob, addTestEmailJob, addCourseInviteEmailJob } = require('../queues/emailQueue');

/**
 * Email Service with BullMQ Queue Integration
 * All emails are now processed asynchronously through Redis queue
 */

/**
 * Send email using queue system
 * @param {Object} emailData - Email data
 * @param {string} emailData.to - Recipient email address
 * @param {string} emailData.subject - Email subject
 * @param {string} [emailData.text] - Plain text version
 * @param {string} [emailData.html] - HTML version
 * @param {string} [emailData.from] - Sender email (optional)
 * @param {string} [emailData.cc] - CC recipients (optional)
 * @param {string} [emailData.bcc] - BCC recipients (optional)
 * @param {Array} [emailData.attachments] - Email attachments (optional)
 * @param {string} [emailData.replyTo] - Reply-to address (optional)
 * @param {Object} [options] - Queue options
 * @param {number} [options.priority] - Job priority (1-10, lower is higher priority)
 * @param {number} [options.delay] - Delay in milliseconds before processing
 * @returns {Promise<Object>} Job information
 */
const sendEmail = async (emailData, options = {}) => {
    try {
        const {
            to,
            subject,
            text,
            html,
            from = process.env.SMTP_USER,
            cc,
            bcc,
            attachments,
            replyTo
        } = emailData;

        // Validate required fields
        if (!to || !subject) {
            throw new Error('Recipient email (to) and subject are required');
        }

        if (!text && !html) {
            throw new Error('Either text or html content is required');
        }

        // Add email job to queue
        const job = await addEmailJob({
            to,
            subject,
            text,
            html,
            from,
            ...(cc && { cc }),
            ...(bcc && { bcc }),
            ...(attachments && { attachments }),
            ...(replyTo && { replyTo })
        }, options);

        logger.info(`Email queued successfully: Job ID ${job.id} for ${to}`);

        return {
            success: true,
            jobId: job.id,
            message: 'Email queued for delivery',
            recipient: to
        };
    } catch (error) {
        logger.error('Failed to queue email:', error);
        throw error;
    }
};

/**
 * Send test email using queue
 * @param {string} to - Recipient email address
 * @param {string} [subject] - Email subject
 * @returns {Promise<Object>} Job information
 */
const sendTestEmail = async (to, subject = 'Test Email') => {
    try {
        const job = await addTestEmailJob(to, subject);

        logger.info(`Test email queued successfully: Job ID ${job.id} for ${to}`);

        return {
            success: true,
            jobId: job.id,
            message: 'Test email queued for delivery',
            recipient: to
        };
    } catch (error) {
        logger.error('Failed to queue test email:', error);
        throw error;
    }
};

/**
 * Send course invitation email using queue
 * @param {Object} emailData - Course invitation data
 * @returns {Promise<Object>} Job information
 */
const sendCourseInviteEmail = async (emailData) => {
    try {
        const {
            courseName,
            inviteeEmail,
            inviterName
        } = emailData;

        // Validate required fields
        if (!courseName || !inviteeEmail || !inviterName) {
            throw new Error('courseName, inviteeEmail, and inviterName are required');
        }

        // Add course invite email job to queue
        const job = await addCourseInviteEmailJob(emailData);

        logger.info(`Course invite email queued successfully: Job ID ${job.id} for ${inviteeEmail}`);

        return {
            success: true,
            jobId: job.id,
            message: 'Course invitation email queued for delivery',
            recipient: inviteeEmail
        };
    } catch (error) {
        logger.error('Failed to queue course invite email:', error);
        throw error;
    }
};

/**
 * Legacy function for backward compatibility
 * @deprecated Use the new queue-based methods instead
 */
const initializeTransporter = async () => {
    logger.warn('initializeTransporter is deprecated. Email service now uses queue system.');
    return { success: true, message: 'Using queue-based email system' };
};

module.exports = {
    sendEmail,
    sendTestEmail,
    sendCourseInviteEmail,
    initializeTransporter // Kept for backward compatibility
};