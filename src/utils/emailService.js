const nodemailer = require('nodemailer');
const logger = require('../config/winston.config.js');

let transporter = null;

const initializeTransporter = async () => {
    try {
        // Configure transporter based on environment variables
        const emailConfig = {
            host: process.env.SMTP_HOST || 'smtp.hostinger.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true' || false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            // Additional options for better compatibility
            tls: {
                rejectUnauthorized: false // For development/testing
            },
            connectionTimeout: 60000, // 60 seconds
            greetingTimeout: 30000,   // 30 seconds
            socketTimeout: 60000      // 60 seconds
        };

        // If no SMTP credentials are provided, use ethereal for testing
        if (!emailConfig.auth.user || !emailConfig.auth.pass) {
            logger.warn('SMTP credentials not found. Email service will be in test mode.');
            transporter = null;
            return;
        }

        transporter = nodemailer.createTransport(emailConfig);
        
        // Verify connection
        transporter.verify((error, success) => {
            if (error) {
                logger.error('Email service verification failed:', error);
                transporter = null;
            } else {
                logger.info('Email service is ready to send messages');
            }
        });
    } catch (error) {
        logger.error('Failed to initialize email service:', error);
        transporter = null;
    }
};



 

const sendEmail = async ({
    to,
    subject,
    text,
    html,
    from = process.env.SMTP_USER,
    cc,
    bcc,
    attachments,
    replyTo
}) => {
    try {
        if (!transporter) {
            await initializeTransporter();
        }

        const mailOptions = {
            from,
            to,
            subject,
            text,
            html,
            ...(cc && { cc }),
            ...(bcc && { bcc }),
            ...(attachments && { attachments }),
            ...(replyTo && { replyTo })
        };

        const result = await transporter.sendMail(mailOptions);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        logger.error('Failed to send email:', error);
        throw error;
    }
};

const sendTestEmail = async (to, subject = 'Test Email') => {
    return sendEmail({
        to,
        subject,
        html: '<h1>Test Email</h1><p>Email service is working correctly!</p>'
    });
};

// Initialize the transporter when the module is loaded
initializeTransporter();

module.exports = {
    sendEmail,
    sendTestEmail,
    initializeTransporter // Exported in case re-initialization is needed
};