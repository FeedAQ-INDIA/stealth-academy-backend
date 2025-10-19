const logger = require("../config/winston.config");
const CourseAccessService = require("../service/CourseAccess.service");

/**
 * Grant access to a course for a user or organization
 * @route POST /api/courseAccess/grantAccess
 */
async function grantAccess(req, res, next) {
    try {
        const { courseId, userId, organizationId, accessLevel, expiresAt } = req.body;

        const accessData = {
            courseId,
            userId,
            organizationId,
            accessLevel,
            expiresAt,
            grantedByUserId: req.user.userId,
            grantedByOrganizationId: req.user.organizationId
        };

        const access = await CourseAccessService.grantAccess(accessData);

        res.status(201).send({
            status: 201,
            message: "Access granted successfully",
            data: access
        });
    } catch (err) {
        logger.error(`Error occurred while granting access:`, err.message);
        
        if (err.message === "Course not found") {
            return res.status(404).send({
                status: 404,
                message: err.message
            });
        }
        
        if (err.message.includes("Either userId or organizationId") || 
            err.message === "Access already granted") {
            return res.status(400).send({
                status: 400,
                message: err.message
            });
        }

        res.status(500).send({
            status: 500,
            message: err.message || "Error occurred while granting access"
        });
        next(err);
    }
}


/**
 * Revoke access to a course
 * @route POST /api/courseAccess/revokeAccess
 */
async function revokeAccess(req, res, next) {
    try {
        const { courseAccessId } = req.body;

        if (!courseAccessId) {
            return res.status(400).send({
                status: 400,
                message: "courseAccessId is required"
            });
        }

        await CourseAccessService.revokeAccess(courseAccessId);

        res.status(200).send({
            status: 200,
            message: "Access revoked successfully"
        });
    } catch (err) {
        logger.error(`Error occurred while revoking access:`, err.message);
        
        if (err.message === "Access record not found") {
            return res.status(404).send({
                status: 404,
                message: err.message
            });
        }

        res.status(500).send({
            status: 500,
            message: err.message || "Error occurred while revoking access"
        });
        next(err);
    }
}

/**
 * Update access level or expiration
 * @route POST /api/courseAccess/updateUserAccess
 */
async function updateAccess(req, res, next) {
    try {
        const { courseAccessId, accessLevel, expiresAt } = req.body;

        if (!courseAccessId) {
            return res.status(400).send({
                status: 400,
                message: "courseAccessId is required"
            });
        }

        const updateData = {};
        if (accessLevel) updateData.accessLevel = accessLevel;
        if (expiresAt !== undefined) updateData.expiresAt = expiresAt;

        const access = await CourseAccessService.updateAccess(courseAccessId, updateData);

        res.status(200).send({
            status: 200,
            message: "Access updated successfully",
            data: access
        });
    } catch (err) {
        logger.error(`Error occurred while updating access:`, err.message);
        
        if (err.message === "Access record not found") {
            return res.status(404).send({
                status: 404,
                message: err.message
            });
        }

        res.status(500).send({
            status: 500,
            message: err.message || "Error occurred while updating access"
        });
        next(err);
    }
}

/**
 * Get all access records for a course
 * @route GET /api/courseAccess/getCourseMembers/:courseId
 */
async function getCourseAccess(req, res, next) {
    try {
        const { courseId } = req.params;

        if (!courseId) {
            return res.status(400).send({
                status: 400,
                message: "courseId is required"
            });
        }

        const access = await CourseAccessService.getCourseAccess(courseId);

        res.status(200).send({
            status: 200,
            message: "Course access records fetched successfully",
            data: access
        });
    } catch (err) {
        logger.error(`Error occurred while fetching course access:`, err.message);
        res.status(500).send({
            status: 500,
            message: err.message || "Error occurred while fetching course access"
        });
        next(err);
    }
}

/**
 * Get all courses a user has access to
 * @route GET /api/courseAccess/getUserCourseAccess/:userId
 */
async function getUserCourseAccess(req, res, next) {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).send({
                status: 400,
                message: "userId is required"
            });
        }

        const access = await CourseAccessService.getUserCourseAccess(userId);

        res.status(200).send({
            status: 200,
            message: "User course access records fetched successfully",
            data: access
        });
    } catch (err) {
        logger.error(`Error occurred while fetching user course access:`, err.message);
        res.status(500).send({
            status: 500,
            message: err.message || "Error occurred while fetching user course access"
        });
        next(err);
    }
}

/**
 * Check if a user has access to a course
 * @route GET /api/courseAccess/checkCourseAccess/:courseId
 */
async function checkAccess(req, res, next) {
    try {
        const { courseId } = req.params;
        const userId = req.user.userId;

        if (!courseId) {
            return res.status(400).send({
                status: 400,
                message: "courseId is required"
            });
        }

        const result = await CourseAccessService.checkAccess(courseId, userId);

        res.status(200).send({
            status: 200,
            message: "Access check completed",
            data: result
        });
    } catch (err) {
        logger.error(`Error occurred while checking access:`, err.message);
        res.status(500).send({
            status: 500,
            message: err.message || "Error occurred while checking access"
        });
        next(err);
    }
}

/**
 * Get all invited members for a course
 * @route GET /api/courseAccess/getInvitedMembers/:courseId
 */
async function getInvitedMembers(req, res, next) {
    try {
        const { courseId } = req.params;

        if (!courseId) {
            return res.status(400).send({
                status: 400,
                message: "courseId is required"
            });
        }

        const invites = await CourseAccessService.getInvitedMembers(courseId);

        res.status(200).send({
            status: 200,
            message: "Invited members fetched successfully",
            data: invites
        });
    } catch (err) {
        logger.error(`Error occurred while fetching invited members:`, err.message);
        res.status(500).send({
            status: 500,
            message: err.message || "Error occurred while fetching invited members"
        });
        next(err);
    }
}

/**
 * Invite users to a course
 * @route POST /api/courseAccess/inviteUser
 */
async function inviteUser(req, res, next) {
    try {
        const { courseId, orgId, invites } = req.body;
        const userId = req.user.userId;

        // Validate required fields
        if (!courseId || !Array.isArray(invites) || invites.length === 0) {
            return res.status(400).send({
                status: 400,
                message: "courseId and invites array are required"
            });
        }

        const inviteData = {
            courseId,
            userId,
            orgId,
            invites
        };

        const result = await CourseAccessService.inviteUsers(inviteData);

        res.status(201).send({
            status: 201,
            message: "Invite process completed",
            data: result
        });
    } catch (err) {
        logger.error(`Error occurred while inviting users:`, err.message);
        
        if (err.message.includes("email") || 
            err.message.includes("accessLevel") ||
            err.message.includes("required")) {
            return res.status(400).send({
                status: 400,
                message: err.message
            });
        }
        
        if (err.message === "Course not found" || 
            err.message === "Inviter user not found") {
            return res.status(404).send({
                status: 404,
                message: err.message
            });
        }
        
        if (err.message.includes("permission")) {
            return res.status(403).send({
                status: 403,
                message: err.message
            });
        }

        res.status(500).send({
            status: 500,
            message: err.message || "Error occurred while inviting users"
        });
        next(err);
    }
}

/**
 * Accept a course invitation
 * @route POST /api/courseAccess/acceptInvite
 */
async function acceptInvite(req, res, next) {
    try {
        const { inviteId } = req.body;
        const userId = req.user.userId;

        if (!inviteId) {
            return res.status(400).send({
                status: 400,
                message: "inviteId is required"
            });
        }

        const result = await CourseAccessService.acceptInvite(inviteId, userId);

        res.status(200).send({
            status: 200,
            message: result.message,
            data: {
                access: result.access,
                course: result.course
            }
        });
    } catch (err) {
        logger.error(`Error occurred while accepting invite:`, err.message);
        
        if (err.message === "Invalid or expired invitation" || 
            err.message === "This invitation has expired") {
            return res.status(404).send({
                status: 404,
                message: err.message
            });
        }
        
        if (err.message === "User not found") {
            return res.status(404).send({
                status: 404,
                message: err.message
            });
        }
        
        if (err.message.includes("email address")) {
            return res.status(403).send({
                status: 403,
                message: err.message
            });
        }

        res.status(500).send({
            status: 500,
            message: err.message || "Error occurred while accepting invite"
        });
        next(err);
    }
}

/**
 * Decline a course invitation
 * @route POST /api/courseAccess/declineInvite
 */
async function declineInvite(req, res, next) {
    try {
        const { inviteId } = req.body;
        const userId = req.user.userId;

        if (!inviteId) {
            return res.status(400).send({
                status: 400,
                message: "inviteId is required"
            });
        }

        const result = await CourseAccessService.declineInvite(inviteId, userId);

        res.status(200).send({
            status: 200,
            message: result.message,
            data: result.invite
        });
    } catch (err) {
        logger.error(`Error occurred while declining invite:`, err.message);
        
        if (err.message === "Invalid or already processed invitation" || 
            err.message === "This invitation has expired") {
            return res.status(404).send({
                status: 404,
                message: err.message
            });
        }
        
        if (err.message === "User not found") {
            return res.status(404).send({
                status: 404,
                message: err.message
            });
        }
        
        if (err.message.includes("email address")) {
            return res.status(403).send({
                status: 403,
                message: err.message
            });
        }

        res.status(500).send({
            status: 500,
            message: err.message || "Error occurred while declining invite"
        });
        next(err);
    }
}

/**
 * Cancel a course invitation (by the inviter)
 * @route POST /api/courseAccess/cancelInvite
 */
async function cancelInvite(req, res, next) {
    try {
        const { inviteId } = req.body;
        const userId = req.user.userId;

        if (!inviteId) {
            return res.status(400).send({
                status: 400,
                message: "inviteId is required"
            });
        }

        const result = await CourseAccessService.cancelInvite(inviteId, userId);

        res.status(200).send({
            status: 200,
            message: result.message,
            data: result.invite
        });
    } catch (err) {
        logger.error(`Error occurred while cancelling invite:`, err.message);
        
        if (err.message === "Invalid or already processed invitation") {
            return res.status(404).send({
                status: 404,
                message: err.message
            });
        }
        
        if (err.message === "You can only cancel invitations that you sent") {
            return res.status(403).send({
                status: 403,
                message: err.message
            });
        }

        res.status(500).send({
            status: 500,
            message: err.message || "Error occurred while cancelling invite"
        });
        next(err);
    }
}

module.exports = {
    grantAccess,
    revokeAccess,
    updateAccess,
    getCourseAccess,
    getUserCourseAccess,
    checkAccess,
    getInvitedMembers,
    inviteUser,
    acceptInvite,
    declineInvite,
    cancelInvite
};

