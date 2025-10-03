const nodemailer = require('nodemailer');
const logger = require('../config/winston.config.js');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    initializeTransporter() {
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
                this.transporter = null;
                return;
            }

            this.transporter = nodemailer.createTransport(emailConfig);
            
            // Verify connection
            this.transporter.verify((error, success) => {
                if (error) {
                    logger.error('Email service verification failed:', error);
                    this.transporter = null;
                } else {
                    logger.info('Email service is ready to send messages');
                }
            });
        } catch (error) {
            logger.error('Failed to initialize email service:', error);
            this.transporter = null;
        }
    }

    async sendOrganizationInvite(inviteData) {
        try {
            const {
                organizationName,
                organizationEmail,
                invitedEmail,
                inviterEmail,
                inviteToken,
                userRole,
                expiresAt,
                acceptUrl,
                message
            } = inviteData;

            const emailHtml = this.generateInviteEmailTemplate({
                organizationName,
                inviterEmail,
                userRole,
                acceptUrl,
                expiresAt,
                message
            });

            const mailOptions = {
                from: `"${organizationName}" <${organizationEmail}>`,
                to: invitedEmail,
                subject: `Invitation to join ${organizationName}`,
                html: emailHtml,
                replyTo: inviterEmail
            };

            if (!this.transporter) {
                logger.warn('Email service not configured. Email would be sent with:', mailOptions);
                return {
                    success: true,
                    message: 'Email service not configured - invite created without email',
                    testMode: true
                };
            }

            const result = await this.transporter.sendMail(mailOptions);
            logger.info(`Organization invite email sent successfully to ${invitedEmail}`);
            
            return {
                success: true,
                messageId: result.messageId,
                message: 'Invite email sent successfully'
            };
        } catch (error) {
            logger.error('Failed to send organization invite email:', error);
            throw new Error(`Failed to send invite email: ${error.message}`);
        }
    }

    generateInviteEmailTemplate(data) {
        const {
            organizationName,
            inviterEmail,
             userRole,
            acceptUrl,
            expiresAt,
            message
        } = data;

        const expirationDate = new Date(expiresAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Organization Invitation</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background-color: #ffffff; padding: 30px; border: 1px solid #e9ecef; }
                .footer { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #6c757d; }
                .btn { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .btn:hover { background-color: #0056b3; }
                .alert { background-color: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 4px; margin: 15px 0; }
                .role-badge { background-color: #e9ecef; color: #495057; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0; color: #007bff;">You're Invited!</h1>
                </div>
                
                <div class="content">
                    <h2>Join ${organizationName}</h2>
                    
                    <p>Hello!</p>
                    
                    <p><strong>${inviterEmail}</strong> has invited you to join <strong>${organizationName}</strong> as a <span class="role-badge">${userRole}</span>.</p>
                    
                    ${message ? `<div class="alert"><strong>Personal Message:</strong><br>${message}</div>` : ''}
                    
                    <p>Click the button below to accept this invitation:</p>
                    
                    <div style="text-align: center;">
                        <a href="${acceptUrl}" class="btn">Accept Invitation</a>
                    </div>
                    
                    <div class="alert">
                        <strong>Important:</strong> This invitation will expire on <strong>${expirationDate}</strong>. 
                        Please accept it before then to join the organization.
                    </div>
                    
                    <p>If you can't click the button above, you can copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">${acceptUrl}</p>
                    
                    <p>If you don't want to join this organization, you can safely ignore this email.</p>
                </div>
                
                <div class="footer">
                    <p>This invitation was sent by ${organizationName}. If you have any questions, please contact them directly.</p>
                    <p>&copy; ${new Date().getFullYear()} FeedAQ Academy. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    async sendTestEmail(to, subject = 'Test Email') {
        try {
            const mailOptions = {
                from: process.env.SMTP_USER,
                to,
                subject,
                html: '<h1>Test Email</h1><p>Email service is working correctly!</p>'
            };

            if (!this.transporter) {
                throw new Error('Email service not configured');
            }

            const result = await this.transporter.sendMail(mailOptions);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            logger.error('Failed to send test email:', error);
            throw error;
        }
    }
}

module.exports = new EmailService();