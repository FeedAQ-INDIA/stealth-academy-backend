const db = require("../entity");
const { Op } = require("sequelize");
const { handleError } = require("../utils/errorHandler");
const crypto = require("crypto");
const emailService = require("../utils/emailService");
const notificationService = require("../service/Notifications.service.js");

const CourseAccess = db.CourseAccess;
const Course = db.Course;
const User = db.User;
const Organization = db.Organization;
const OrganizationGroups = db.OrganizationGroups;
const OrganizationUserGroups = db.OrganizationUserGroups;
const CourseUserInvites = db.CourseUserInvites;

/**
 * Grant access to a course for a user or organization
 */
exports.grantAccess = async (req, res) => {
    try {
        const { courseId, userId, organizationId, accessLevel, expiresAt } = req.body;

        // Validate that either userId or organizationId is provided, but not both
        if ((!userId && !organizationId) || (userId && organizationId)) {
            return res.status(400).json({
                message: "Either userId or organizationId must be provided, but not both"
            });
        }

        // Check if course exists
        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Check if access already exists
        const existingAccess = await CourseAccess.findOne({
            where: {
                courseId,
                ...(userId ? { userId } : { organizationId }),
                isActive: true
            }
        });

        if (existingAccess) {
            return res.status(400).json({
                message: "Access already granted"
            });
        }

        // Create new access record
        const access = await CourseAccess.create({
            courseId,
            ...(userId ? { userId } : { organizationId }),
            accessLevel: accessLevel || "SHARED",
            expiresAt: expiresAt || null,
            grantedByUserId: req.user.userId,
            grantedByOrganizationId: req.user.organizationId,
            isActive: true
        });

        res.status(201).json({
            message: "Access granted successfully",
            data: access
        });
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * Revoke access to a course
 */
exports.revokeAccess = async (req, res) => {
    try {
        const { userId, courseId, courseAccessId } = req.body;

        const access = await CourseAccess.findByPk(courseAccessId);
        if (!access) {
            return res.status(404).json({ message: "Access record not found" });
        }

        // Soft delete the access record
        await access.destroy();

        res.json({
            message: "Access revoked successfully"
        });
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * Update access level or expiration
 */
exports.updateAccess = async (req, res) => {
    try {
        const { courseAccessId, accessLevel} = req.body;

        const access = await db.CourseAccess.findByPk(courseAccessId);
        if (!access) {
            return res.status(404).json({ message: "Access record not found" });
        }

        // Update access record
        await access.update({
            ...(accessLevel && { accessLevel }),
        });

        res.json({
            message: "Access updated successfully",
            data: access
        });
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * Get all access records for a course
 */
exports.getCourseAccess = async (req, res) => {
    try {
        const { courseId } = req.params;

        const access = await CourseAccess.findAll({
            where: { courseId, isActive: true },
            include: [
                {
                    model: User,
                    as: 'user',
                },
            ]
        });

        res.json({
            data: access
        });
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * Get all courses a user has access to
 */
exports.getUserCourseAccess = async (req, res) => {
    try {
        const { userId } = req.params;

        // Get user's direct access and organizational access
        const access = await CourseAccess.findAll({
            where: {
                isActive: true,
                [Op.or]: [
                    { userId },
                    {
                        organizationId: {
                            [Op.in]: await getUserOrganizationIds(userId)
                        }
                    }
                ]
            },
            include: [{
                model: Course,
                as: 'course'
            }]
        });

        res.json({
            data: access
        });
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * Check if a user has access to a course
 */
exports.checkAccess = async (req, res) => {
    try {
        const { courseId } = req.params;

        const userId = req.user.userId;


        const access = await db.CourseAccess.findOne({
            where: {
                courseId,
                isActive: true,
                userId
            }
        });

        res.json({
            hasAccess: !!access,
            accessDetails: access
        });
    } catch (error) {
        handleError(res, error);
    }
};


/**
 * Get all invited members for a course
 */
exports.getInvitedMembers = async (req, res) => {
    try {
        const { courseId } = req.params;

        const userId = req.user.userId;


        const invites = await db.CourseUserInvites.findAll({
            where: {
                courseId,
                inviteStatus: {
                    [Op.ne]: 'ACCEPTED'
                }
            }
        });

        res.json({
            invites : invites
        });
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * Invite users to a course
 */
exports.inviteUser = async (req, res) => {
    try {
        const { courseId, orgId, invites } = req.body;

        const userId = req.user.userId;

        // Validate required fields
        if (!courseId || !userId || !Array.isArray(invites) || invites.length === 0) {
            return res.status(400).json({
                message: "courseId, userId, and invites array are required"
            });
        }

        // Validate invites array structure
        for (const invite of invites) {
            if (!invite.email || !invite.accessLevel) {
                return res.status(400).json({
                    message: "Each invite must have email and accessLevel"
                });
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(invite.email)) {
                return res.status(400).json({
                    message: `Invalid email format: ${invite.email}`
                });
            }

            // Validate access level
            const validAccessLevels = ["OWN", "SHARED", "ADMIN", "STUDY_GROUP"];
            if (!validAccessLevels.includes(invite.accessLevel)) {
                return res.status(400).json({
                    message: `Invalid access level: ${invite.accessLevel}. Must be one of: ${validAccessLevels.join(", ")}`
                });
            }
        }

                // Get inviter details
        const inviter = await User.findByPk(userId);

        if (!inviter) {
            return res.status(404).json({ message: "Inviter user not found" });
        }

        // Check if course exists
        const course = await Course.findByPk(courseId, {
            include: [{
                model: User,
                as: 'instructor',
            }]
        });
        
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Check if user has permission to invite (course owner or admin)
        const userAccess = await CourseAccess.findOne({
            where: {
                courseId,
                userId,
                isActive: true,
                accessLevel: { [Op.in]: ["OWN", "ADMIN"] }
            }
        });

        if (!userAccess) {
            return res.status(403).json({
                message: "You don't have permission to invite users to this course"
            });
        }



        const successfulInvites = [];
        const failedInvites = [];

        // Process each invite
        for (const invite of invites) {
            try {
                // Check if user is already invited (pending invite)
                const existingInvite = await CourseUserInvites.findOne({
                    where: {
                        courseId,
                        inviteeEmail: invite.email.toLowerCase(),
                        inviteStatus: 'PENDING'
                    }
                });

                if (existingInvite) {
                    failedInvites.push({
                        email: invite.email,
                        reason: "User already has a pending invite for this course"
                    });
                    continue;
                }

                // Check if user already has access to the course
                const existingUser = await User.findOne({
                    where: { email: invite.email.toLowerCase() }
                });

                if (existingUser) {
                    const existingAccess = await CourseAccess.findOne({
                        where: {
                            courseId,
                            userId: existingUser.userId,
                            isActive: true
                        }
                    });

                    if (existingAccess) {
                        failedInvites.push({
                            email: invite.email,
                            reason: "User already has access to this course"
                        });
                        continue;
                    }
                }

                // Generate unique invite token
                const inviteToken = crypto.randomBytes(32).toString('hex');
                
                // Set expiration to 7 days from now
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 7);

                // Create invite record
                const inviteRecord = await CourseUserInvites.create({
                    courseId,
                    invitedByUserId: userId,
                    organizationId: orgId || null,
                    inviteeEmail: invite.email.toLowerCase(),
                    accessLevel: invite.accessLevel,
                    inviteToken,
                    expiresAt
                });

                // Prepare email data
                const emailData = {
                    courseName: course.courseTitle || course.courseName || 'Course',
                    courseDescription: course.courseDescription || '',
                    inviterName: `${inviter.firstName} ${inviter.lastName}`.trim() || inviter.email,
                    inviterEmail: inviter.email,
                    inviteeEmail: invite.email,
                    accessLevel: invite.accessLevel,
                    inviteToken,
                    expiresAt,
                    acceptUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-course-invite?token=${inviteToken}`,
                    message: invite.message || null
                };

                // Send invitation email
                try {
                    await sendCourseInviteEmail(emailData);
                    
                    // Update invite record with email sent timestamp
                    await inviteRecord.update({
                        emailSentAt: new Date()
                    });

                    notificationService.createNotification({
                        userId: userId,
                        title: `Invitation to join course: ${course.courseTitle}`,
                        notificationType: 'COURSE_INVITE',
                        notificationReq: {
                            email: invite.email,
                            courseId: courseId,
                            inviteToken: inviteToken,
                            expiresAt:expiresAt,
                            inviteId: inviteRecord.inviteId
                        },
                        isActionRequired: true
                    }); 

                    successfulInvites.push({
                        email: invite.email,
                        accessLevel: invite.accessLevel,
                        inviteId: inviteRecord.inviteId,
                        token: inviteToken
                    });
                } catch (emailError) {
                    console.error('Failed to send invite email:', emailError);
                    
                    // Still consider invite successful even if email fails
                    successfulInvites.push({
                        email: invite.email,
                        accessLevel: invite.accessLevel,
                        inviteId: inviteRecord.inviteId,
                        token: inviteToken,
                        emailStatus: 'failed'
                    });
                }

            } catch (error) {
                console.error(`Failed to process invite for ${invite.email}:`, error);
                failedInvites.push({
                    email: invite.email,
                    reason: "Failed to create invite record"
                });
            }
        }

        res.status(201).json({
            message: "Invite process completed",
            data: {
                successful: successfulInvites,
                failed: failedInvites,
                totalInvites: invites.length,
                successCount: successfulInvites.length,
                failureCount: failedInvites.length
            }
        });

    } catch (error) {
        handleError(res, error);
    }
};

// Helper function to send course invite email
async function sendCourseInviteEmail(emailData) {
    const {
        courseName,
        courseDescription,
        inviterName,
        inviterEmail,
        inviteeEmail,
        accessLevel,
        acceptUrl,
        expiresAt,
        message
    } = emailData;

    const expirationDate = new Date(expiresAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Course Invitation</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #ffffff; padding: 30px; border: 1px solid #e9ecef; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #6c757d; }
            .btn { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .btn:hover { background-color: #0056b3; }
            .alert { background-color: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 4px; margin: 15px 0; }
            .access-badge { background-color: #e9ecef; color: #495057; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .course-info { background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0; color: #007bff;">Course Invitation</h1>
            </div>
            
            <div class="content">
                <h2>You're invited to join a course!</h2>
                
                <p>Hello!</p>
                
                <p><strong>${inviterName}</strong> has invited you to join the course:</p>
                
                <div class="course-info">
                    <h3 style="margin: 0 0 10px 0;">${courseName}</h3>
                    ${courseDescription ? `<p style="margin: 0; color: #666;">${courseDescription}</p>` : ''}
                    <p style="margin: 10px 0 0 0;"><strong>Access Level:</strong> <span class="access-badge">${accessLevel}</span></p>
                </div>
                
                ${message ? `<div class="alert"><strong>Personal Message:</strong><br>${message}</div>` : ''}
                
                <p>Click the button below to accept this invitation and start learning:</p>
                
                <div style="text-align: center;">
                    <a href="${acceptUrl}" class="btn">Accept Invitation</a>
                </div>
                
                <div class="alert">
                    <strong>Important:</strong> This invitation will expire on <strong>${expirationDate}</strong>. 
                    Please accept it before then to access the course.
                </div>
                
                <p>If you can't click the button above, you can copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">${acceptUrl}</p>
                
                <p>If you don't want to join this course, you can safely ignore this email.</p>
                
                <p>For any questions, please contact <strong>${inviterEmail}</strong></p>
            </div>
            
            <div class="footer">
                <p>This invitation was sent through FeedAQ Academy.</p>
                <p>&copy; ${new Date().getFullYear()} FeedAQ Academy. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    const mailOptions = {
        from: `"Huskite" <${process.env.SMTP_USER}>`,
        to: inviteeEmail,
        subject: `Invitation to join "${courseName}"`,
        html: emailHtml,
        replyTo: inviterEmail
    };

    try {
        await emailService.sendEmail({
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject,
            html: mailOptions.html,
            replyTo: mailOptions.replyTo
        });
    } catch (error) {
        console.log('Email service not configured or failed to send:', error);
        throw error;
    }
}

// Helper function to get all organization IDs a user belongs to
async function getUserOrganizationIds(userId) {
    const orgUsers = await db.rganizationUser.findAll({
        where: {
            userId,
            status: 'ACTIVE'
        }
    });
    return orgUsers.map(ou => ou.orgId);
}
