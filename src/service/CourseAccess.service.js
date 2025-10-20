const db = require("../entity");
const { Op } = require("sequelize");
const crypto = require("crypto");
const emailService = require("../utils/emailService");
const notificationService = require("./Notifications.service.js");

const CourseAccess = db.CourseAccess;
const Course = db.Course;
const User = db.User;
const Organization = db.Organization;
const OrganizationGroups = db.OrganizationGroups;
const OrganizationUserGroups = db.OrganizationUserGroups;
const CourseUserInvites = db.CourseUserInvites;

/**
 * Grant access to a course for a user or organization
 * @param {Object} accessData - The access grant data
 * @param {number} accessData.courseId - The course ID
 * @param {number} [accessData.userId] - The user ID (optional)
 * @param {number} [accessData.organizationId] - The organization ID (optional)
 * @param {string} accessData.accessLevel - Access level (OWN, SHARED, ADMIN, STUDY_GROUP)
 * @param {Date} [accessData.expiresAt] - Expiration date (optional)
 * @param {number} accessData.grantedByUserId - User ID who granted access
 * @param {number} [accessData.grantedByOrganizationId] - Organization ID that granted access
 * @returns {Promise<Object>} Created access record
 */
const grantAccess = async (accessData) => {
    const { 
        courseId, 
        userId, 
        organizationId, 
        accessLevel, 
        expiresAt,
        grantedByUserId,
        grantedByOrganizationId
    } = accessData;

    // Validate that either userId or organizationId is provided, but not both
    if ((!userId && !organizationId) || (userId && organizationId)) {
        throw new Error("Either userId or organizationId must be provided, but not both");
    }

    // Check if course exists
    const course = await Course.findByPk(courseId);
    if (!course) {
        throw new Error("Course not found");
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
        throw new Error("Access already granted");
    }

    // Create new access record
    const access = await CourseAccess.create({
        courseId,
        ...(userId ? { userId } : { organizationId }),
        accessLevel: accessLevel || "SHARED",
        expiresAt: expiresAt || null,
        grantedByUserId,
        grantedByOrganizationId,
        isActive: true
    });

    return access;
};

/**
 * Revoke access to a course
 * @param {number} courseAccessId - The course access ID to revoke
 * @returns {Promise<void>}
 */
const revokeAccess = async (courseAccessId) => {
    const access = await CourseAccess.findByPk(courseAccessId);
    if (!access) {
        throw new Error("Access record not found");
    }

    // Soft delete the access record
    await access.destroy();
};

/**
 * Update access level or expiration
 * @param {number} courseAccessId - The course access ID
 * @param {Object} updateData - Data to update
 * @param {string} [updateData.accessLevel] - New access level
 * @param {Date} [updateData.expiresAt] - New expiration date
 * @returns {Promise<Object>} Updated access record
 */
const updateAccess = async (courseAccessId, updateData) => {
    const access = await CourseAccess.findByPk(courseAccessId);
    if (!access) {
        throw new Error("Access record not found");
    }

    const { accessLevel, expiresAt } = updateData;

    // Update access record
    await access.update({
        ...(accessLevel && { accessLevel }),
        ...(expiresAt !== undefined && { expiresAt })
    });

    return access;
};

/**
 * Get all access records for a course
 * @param {number} courseId - The course ID
 * @returns {Promise<Array>} Array of access records with user details
 */
const getCourseAccess = async (courseId) => {
    const access = await CourseAccess.findAll({
        where: { courseId, isActive: true },
        include: [
            {
                model: User,
                as: 'user',
            }
        ],
    });

    return access;
};


/**
 * Get all invited members for a course
 * @param {number} courseId - The course ID
 * @returns {Promise<Array>} Array of pending invites
 */
const getInvitedMembers = async (courseId) => {
    const invites = await CourseUserInvites.findAll({
        where: {
            courseId,
            inviteStatus: {
                [Op.ne]: 'ACCEPTED'
            }
        },
    });

    return invites;
};

/**
 * Invite users to a course
 * @param {Object} inviteData - The invite data
 * @param {number} inviteData.courseId - The course ID
 * @param {number} inviteData.userId - The user ID who is inviting
 * @param {number} [inviteData.orgId] - The organization ID (optional)
 * @param {Array} inviteData.invites - Array of invite objects
 * @returns {Promise<Object>} Result with successful and failed invites
 */
const inviteUsers = async (inviteData) => {
    const { courseId, userId, orgId, invites } = inviteData;

    // Validate required fields
    if (!courseId || !userId || !Array.isArray(invites) || invites.length === 0) {
        throw new Error("courseId, userId, and invites array are required");
    }

    // Validate invites array structure
    for (const invite of invites) {
        if (!invite.email || !invite.accessLevel) {
            throw new Error("Each invite must have email and accessLevel");
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(invite.email)) {
            throw new Error(`Invalid email format: ${invite.email}`);
        }

        // Validate access level
        const validAccessLevels = ["OWN", "SHARED", "ADMIN", "STUDY_GROUP"];
        if (!validAccessLevels.includes(invite.accessLevel)) {
            throw new Error(`Invalid access level: ${invite.accessLevel}. Must be one of: ${validAccessLevels.join(", ")}`);
        }
    }

    // Get inviter details
    const inviter = await User.findByPk(userId);
    if (!inviter) {
        throw new Error("Inviter user not found");
    }

    // Check if course exists
    const course = await Course.findByPk(courseId, {
        include: [{
            model: User,
            as: 'instructor',
        }]
    });

    if (!course) {
        throw new Error("Course not found");
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
        throw new Error("You don't have permission to invite users to this course");
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
                expiresAt,
                acceptUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-course-invite?token=${inviteRecord.inviteId}`,
                message: invite.message || null
            };

            // Send invitation email
            try {
                await sendCourseInviteEmail(emailData);

                // Update invite record with email sent timestamp
                await inviteRecord.update({
                    emailSentAt: new Date()
                });

        

                  await notificationService.createNotification({
                            ...(existingUser.userId && { userId: existingUser.userId }),
                            notificationType: 'COURSE_INVITE',
                            notificationReq: {
                                email: invite.email,
                                courseId: courseId,
                                courseName: course.courseTitle || course.courseName,
                                inviterName: `${inviter.firstName} ${inviter.lastName}`.trim() || inviter.email,
                                expiresAt: expiresAt,
                                inviteId: inviteRecord.inviteId
                            },
                            isActionRequired: true
                        });

                successfulInvites.push({
                    email: invite.email,
                    accessLevel: invite.accessLevel,
                    inviteId: inviteRecord.inviteId,
                });
            } catch (emailError) {
                console.error('Failed to send invite email:', emailError);

                // Still consider invite successful even if email fails
                successfulInvites.push({
                    email: invite.email,
                    accessLevel: invite.accessLevel,
                    inviteId: inviteRecord.inviteId,
                    emailStatus: 'failed'
                });
            }

        } catch (error) {
            console.error(`Failed to process invite for ${invite.email}:`, error);
            failedInvites.push({
                email: invite.email,
                reason: error.message || "Failed to create invite record"
            });
        }
    }

    return {
        successful: successfulInvites,
        failed: failedInvites,
        totalInvites: invites.length,
        successCount: successfulInvites.length,
        failureCount: failedInvites.length
    };
};

/**
 * Helper function to send course invite email
 * @private
 */
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

    await emailService.sendEmail({
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        html: mailOptions.html,
        replyTo: mailOptions.replyTo
    });
}

/**
 * Accept a course invitation
 * @param {number} userId - The user ID accepting the invite
 * @returns {Promise<Object>} Result with access details
 */
const acceptInvite = async (inviteId, userId) => {
    // Find the invite by token
    const invite = await CourseUserInvites.findOne({
        where: {
            inviteId,
            inviteStatus: 'PENDING'
        },
        include: [{
            model: Course,
            as: 'course',
         }]
    });

    if (!invite) {
        throw new Error("Invalid or expired invitation");
    }

    // Check if invitation has expired
    if (new Date() > new Date(invite.expiresAt)) {
        // Update status to expired
        await invite.update({
            inviteStatus: 'EXPIRED'
        });
        throw new Error("This invitation has expired");
    }

    // Get the user accepting the invite
    const user = await User.findByPk(userId);
    if (!user) {
        throw new Error("User not found");
    }

    // Verify email matches (case-insensitive)
    if (user.email.toLowerCase() !== invite.inviteeEmail.toLowerCase()) {
        throw new Error("This invitation was sent to a different email address");
    }

    // Check if user already has access to this course
    const existingAccess = await CourseAccess.findOne({
        where: {
            courseId: invite.courseId,
            userId: userId,
            isActive: true
        }
    });

    if (existingAccess) {
        // Update invite status to accepted even though they already have access
        await invite.update({
            inviteStatus: 'ACCEPTED',
            acceptedAt: new Date(),
            acceptedByUserId: userId
        });
        
        return {
            message: "You already have access to this course",
            access: existingAccess,
            course: invite.course
        };
    }

    // Create the course access record
    const access = await CourseAccess.create({
        courseId: invite.courseId,
        userId: userId,
        accessLevel: invite.accessLevel,
        expiresAt: null, // No expiration for accepted invites unless specified
        grantedByUserId: invite.invitedByUserId,
        grantedByOrganizationId: invite.organizationId,
        isActive: true
    });

    // Update the invite status
    await invite.update({
        inviteStatus: 'ACCEPTED',
        acceptedAt: new Date(),
        acceptedByUserId: userId
    });

    // Create notification for the inviter
    try {
        await notificationService.createNotification({
            userId: invite.invitedByUserId,
            title: `${user.firstName || user.email} accepted your course invitation`,
            notificationType: 'COURSE_INVITE',
            notificationReq: {
                courseId: invite.courseId,
                courseName: invite.course?.courseTitle || invite.course?.courseName,
                acceptedByUserId: userId,
                acceptedByEmail: user.email,
                inviteId: invite.inviteId
            },
            isActionRequired: false
        });
    } catch (notifError) {
        console.error('Failed to create notification:', notifError);
        // Don't fail the invite acceptance if notification fails
    }

    return {
        message: "Invitation accepted successfully",
        access: access,
        course: invite.course
    };
};

/**
 * Decline a course invitation
 * @param {number} inviteId - The invite ID
 * @param {number} userId - The user ID declining the invite
 * @returns {Promise<Object>} Result with decline details
 */
const declineInvite = async (inviteId, userId) => {
    // Find the invite by ID
    const invite = await CourseUserInvites.findOne({
        where: {
            inviteId,
            inviteStatus: 'PENDING'
        },
        include: [{
            model: Course,
            as: 'course',
        }]
    });

    if (!invite) {
        throw new Error("Invalid or already processed invitation");
    }

    // Check if invitation has expired
    if (new Date() > new Date(invite.expiresAt)) {
        // Update status to expired
        await invite.update({
            inviteStatus: 'EXPIRED'
        });
        throw new Error("This invitation has expired");
    }

    // Get the user declining the invite
    const user = await User.findByPk(userId);
    if (!user) {
        throw new Error("User not found");
    }

    // Verify email matches (case-insensitive)
    if (user.email.toLowerCase() !== invite.inviteeEmail.toLowerCase()) {
        throw new Error("This invitation was sent to a different email address");
    }

    // Update the invite status to DECLINED
    await invite.update({
        inviteStatus: 'DECLINED',
        acceptedAt: new Date(), // Use acceptedAt as declinedAt timestamp
        acceptedByUserId: userId
    });

    // Create notification for the inviter
    try {
        await notificationService.createNotification({
            userId: invite.invitedByUserId,
            title: `${user.firstName || user.email} declined your course invitation`,
            notificationType: 'COURSE_INVITE',
            notificationReq: {
                courseId: invite.courseId,
                courseName: invite.course?.courseTitle || invite.course?.courseName,
                declinedByUserId: userId,
                declinedByEmail: user.email,
                inviteId: invite.inviteId
            },
            isActionRequired: false
        });
    } catch (notifError) {
        console.error('Failed to create notification:', notifError);
        // Don't fail the decline if notification fails
    }

    return {
        message: "Invitation declined successfully",
        invite: {
            inviteId: invite.inviteId,
            courseId: invite.courseId,
            courseName: invite.course?.courseTitle || invite.course?.courseName,
            status: 'DECLINED'
        }
    };
};

/**
 * Cancel a course invitation (by the inviter)
 * @param {number} inviteId - The invite ID to cancel
 * @param {number} userId - The user ID (must be the inviter)
 * @returns {Promise<Object>} Result with cancellation details
 */
const cancelInvite = async (inviteId, userId) => {
    // Find the invite by ID
    const invite = await CourseUserInvites.findOne({
        where: {
            inviteId,
            inviteStatus: 'PENDING'
        },
        include: [{
            model: Course,
            as: 'course',
        }]
    });

    if (!invite) {
        throw new Error("Invalid or already processed invitation");
    }

    // Verify that the user cancelling is the one who sent the invite
    if (invite.invitedByUserId !== userId) {
        throw new Error("You can only cancel invitations that you sent");
    }

    // Update the invite status to CANCELLED
    await invite.destroy();

    // Try to find the invitee user to send notification
    // const inviteeUser = await User.findOne({
    //     where: { email: invite.inviteeEmail.toLowerCase() }
    // });

    // Create notification for the invitee if they have an account
    // if (inviteeUser) {
    //     try {
    //         await notificationService.createNotification({
    //             userId: inviteeUser.userId,
    //             title: `Course invitation cancelled`,
    //             notificationType: 'COURSE_INVITE',
    //             notificationReq: {
    //                 courseId: invite.courseId,
    //                 courseName: invite.course?.courseTitle || invite.course?.courseName,
    //                 inviteId: invite.inviteId,
    //                 cancelledByUserId: userId
    //             },
    //             isActionRequired: false
    //         });
    //     } catch (notifError) {
    //         console.error('Failed to create notification:', notifError);
    //         // Don't fail the cancellation if notification fails
    //     }
    // }

    return {
        message: "Invitation cancelled successfully",
        invite: {
            inviteId: invite.inviteId,
            courseId: invite.courseId,
            courseName: invite.course?.courseTitle || invite.course?.courseName,
            inviteeEmail: invite.inviteeEmail,
            status: 'CANCELLED'
        }
    };
};



module.exports = {
    grantAccess,
    revokeAccess,
    updateAccess,
    getCourseAccess,
    getInvitedMembers,
    inviteUsers,
    acceptInvite,
    declineInvite,
    cancelInvite
};
