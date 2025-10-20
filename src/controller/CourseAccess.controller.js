const logger = require("../config/winston.config");
const CourseAccessService = require("../service/CourseAccess.service");
const { ApiResponse } = require("../utils/responseFormatter");

/**
 * Grant access to a course for a user or organization
 * @route POST /api/courseAccess/grantAccess
 */
async function grantAccess(req, res, next) {
    const apiResponse = new ApiResponse(req, res);
    
    
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

        apiResponse
            .status(201)
            .withMessage("Access granted successfully")
            .withData({ access })
            .success();
    } catch (err) {
        logger.error(`Error occurred while granting access:`, err.message);
        apiResponse
            .status(err.message?.toLowerCase().includes('access already granted') ? 400 : 
                    err.message?.toLowerCase().includes('either userid or organizationid') ? 400 : 500)
            .withMessage(err.message || "Failed to grant access")
            .withError(err.message, err.code || "GRANT_ACCESS_ERROR", "grantAccess")
            .withMeta({
                courseId: req.body.courseId,
                accessLevel: req.body.accessLevel,
                attemptedBy: req.user?.userId
            })
            .error();
    }
}


/**
 * Revoke access to a course
 * @route POST /api/courseAccess/revokeAccess
 */
async function revokeAccess(req, res, next) {
    const apiResponse = new ApiResponse(req, res);
    
    try {
        const { courseAccessId } = req.body;

        if (!courseAccessId) {
            return apiResponse
                .status(400)
                .withMessage("courseAccessId is required")
                .withError("courseAccessId is required", "MISSING_FIELD", "revokeAccess")
                .error();
        }

        await CourseAccessService.revokeAccess(courseAccessId);

        apiResponse
            .status(200)
            .withMessage("Access revoked successfully")
            .withData({ courseAccessId, revoked: true })
            .withMeta({
                revokedBy: req.user.userId,
                revokedAt: new Date().toISOString()
            })
            .success();
    } catch (err) {
        logger.error(`Error occurred while revoking access:`, err.message);
        apiResponse
            .status(500)
            .withMessage(err.message || "Failed to revoke access")
            .withError(err.message, err.code || "REVOKE_ACCESS_ERROR", "revokeAccess")
            .withMeta({
                courseAccessId: req.body.courseAccessId,
                attemptedBy: req.user?.userId
            })
            .error();
    }
}

/**
 * Update access level or expiration
 * @route POST /api/courseAccess/updateUserAccess
 */
async function updateAccess(req, res, next) {
    const apiResponse = new ApiResponse(req, res);
    
    try {
        const { courseAccessId, accessLevel, expiresAt } = req.body;

        if (!courseAccessId) {
            return apiResponse
                .status(400)
                .withMessage("courseAccessId is required")
                .withError("courseAccessId is required", "MISSING_FIELD", "updateAccess")
                .error();
        }

        const updateData = {};
        if (accessLevel) updateData.accessLevel = accessLevel;
        if (expiresAt !== undefined) updateData.expiresAt = expiresAt;

        const access = await CourseAccessService.updateAccess(courseAccessId, updateData);

        apiResponse
            .status(200)
            .withMessage("Access updated successfully")
            .withData({ access })
            .withMeta({
                updatedFields: Object.keys(updateData),
                updatedBy: req.user.userId
            })
            .success();
    } catch (err) {
        logger.error(`Error occurred while updating access:`, err.message);
        apiResponse
            .status(500)
            .withMessage(err.message || "Failed to update access")
            .withError(err.message, err.code || "UPDATE_ACCESS_ERROR", "updateAccess")
            .withMeta({
                courseAccessId: req.body.courseAccessId,
                attemptedBy: req.user?.userId
            })
            .error();
    }
}

/**
 * Get all access records for a course
 * @route GET /api/courseAccess/getCourseMembers/:courseId
 */
async function getCourseAccess(req, res, next) {
    const apiResponse = new ApiResponse(req, res);
    
    try {
        const { courseId } = req.params;

        if (!courseId) {
            return apiResponse
                .status(400)
                .withMessage("courseId is required")
                .withError("courseId is required", "MISSING_FIELD", "getCourseAccess")
                .error();
        }

        const access = await CourseAccessService.getCourseAccess(courseId);

        apiResponse
            .status(200)
            .withMessage("Course access records fetched successfully")
            .withData({ accessRecords: access, count: access?.length || 0 })
            .withMeta({
                courseId,
                totalRecords: access?.length || 0
            })
            .success();
    } catch (err) {
        logger.error(`Error occurred while fetching course access:`, err.message);
        apiResponse
            .status(500)
            .withMessage(err.message || "Failed to fetch course access")
            .withError(err.message, err.code || "GET_COURSE_ACCESS_ERROR", "getCourseAccess")
            .withMeta({
                courseId: req.params.courseId,
                requestedBy: req.user?.userId
            })
            .error();
    }
}

/**
 * Get all courses a user has access to
 * @route GET /api/courseAccess/getUserCourseAccess/:userId
 */
async function getUserCourseAccess(req, res, next) {
    const apiResponse = new ApiResponse(req, res);
    
    try {
        const { userId } = req.params;

        if (!userId) {
            return apiResponse
                .status(400)
                .withMessage("userId is required")
                .withError("userId is required", "MISSING_FIELD", "getUserCourseAccess")
                .error();
        }

        const access = await CourseAccessService.getUserCourseAccess(userId);

        apiResponse
            .status(200)
            .withMessage("User course access records fetched successfully")
            .withData({ accessRecords: access, count: access?.length || 0 })
            .withMeta({
                userId,
                totalCourses: access?.length || 0
            })
            .success();
    } catch (err) {
        logger.error(`Error occurred while fetching user course access:`, err.message);
        apiResponse
            .status(500)
            .withMessage(err.message || "Failed to fetch user course access")
            .withError(err.message, err.code || "GET_USER_COURSE_ACCESS_ERROR", "getUserCourseAccess")
            .withMeta({
                userId: req.params.userId,
                requestedBy: req.user?.userId
            })
            .error();
    }
}

/**
 * Check if a user has access to a course
 * @route GET /api/courseAccess/checkCourseAccess/:courseId
 */
async function checkAccess(req, res, next) {
    const apiResponse = new ApiResponse(req, res);
    
    try {
        const { courseId } = req.params;
        const userId = req.user.userId;

        if (!courseId) {
            return apiResponse
                .status(400)
                .withMessage("courseId is required")
                .withError("courseId is required", "MISSING_FIELD", "checkAccess")
                .error();
        }

        const result = await CourseAccessService.checkAccess(courseId, userId);

        apiResponse
            .status(200)
            .withMessage("Access check completed")
            .withData({
                hasAccess: result?.hasAccess || false,
                accessLevel: result?.accessLevel || null,
                details: result
            })
            .withMeta({
                courseId,
                userId,
                checkedAt: new Date().toISOString()
            })
            .success();
    } catch (err) {
        logger.error(`Error occurred while checking access:`, err.message);
        apiResponse
            .status(500)
            .withMessage(err.message || "Failed to check access")
            .withError(err.message, err.code || "CHECK_ACCESS_ERROR", "checkAccess")
            .withMeta({
                courseId: req.params.courseId,
                userId: req.user?.userId
            })
            .error();
    }
}

/**
 * Get all invited members for a course
 * @route GET /api/courseAccess/getInvitedMembers/:courseId
 */
async function getInvitedMembers(req, res, next) {
    const apiResponse = new ApiResponse(req, res);
    
    try {
        const { courseId } = req.params;

        if (!courseId) {
            return apiResponse
                .status(400)
                .withMessage("courseId is required")
                .withError("courseId is required", "MISSING_FIELD", "getInvitedMembers")
                .error();
        }

        const invites = await CourseAccessService.getInvitedMembers(courseId);

        apiResponse
            .status(200)
            .withMessage("Invited members fetched successfully")
            .withData({ invites, count: invites?.length || 0 })
            .withMeta({
                courseId,
                totalInvites: invites?.length || 0
            })
            .success();
    } catch (err) {
        logger.error(`Error occurred while fetching invited members:`, err.message);
        apiResponse
            .status(500)
            .withMessage(err.message || "Failed to fetch invited members")
            .withError(err.message, err.code || "GET_INVITED_MEMBERS_ERROR", "getInvitedMembers")
            .withMeta({
                courseId: req.params.courseId,
                requestedBy: req.user?.userId
            })
            .error();
    }
}

/**
 * Invite users to a course
 * @route POST /api/courseAccess/inviteUser
 */
async function inviteUser(req, res, next) {
    const apiResponse = new ApiResponse(req, res);
    
    try {
        const { courseId, orgId, invites } = req.body;
        const userId = req.user.userId;

        // Validate required fields
        if (!courseId || !Array.isArray(invites) || invites.length === 0) {
            return apiResponse
                .status(400)
                .withMessage("courseId and invites array are required")
                .withError("courseId and invites array are required", "MISSING_FIELDS", "inviteUser")
                .error();
        }

        const inviteData = {
            courseId,
            userId,
            orgId,
            invites
        };

        const result = await CourseAccessService.inviteUsers(inviteData);

        // Check if there were any failures and add warnings
        if (result.failed && result.failed.length > 0) {
            for (const failure of result.failed) {
                apiResponse.addWarning(
                    "INVITE_FAILED",
                    `Failed to invite ${failure.email}: ${failure.reason}`,
                    "inviteUser",
                    "medium"
                );
            }
        }

        apiResponse
            .status(201)
            .withMessage("Invite process completed")
            .withData({
                successful: result.successful || [],
                failed: result.failed || [],
                totalInvited: result.successful?.length || 0,
                totalFailed: result.failed?.length || 0
            })
            .withMeta({
                courseId,
                invitedBy: userId,
                totalRequested: invites.length
            })
            .success();
    } catch (err) {
        logger.error(`Error occurred while inviting users:`, err.message);
        const errorMessage = err.message?.toLowerCase() || '';
        const status = errorMessage.includes('email') || errorMessage.includes('accesslevel') || errorMessage.includes('required') ? 400 :
                      errorMessage.includes('inviter user not found') ? 404 :
                      errorMessage.includes('permission') ? 403 : 500;
        
        apiResponse
            .status(status)
            .withMessage(err.message || "Failed to invite users")
            .withError(err.message, err.code || "INVITE_USER_ERROR", "inviteUser")
            .withMeta({
                courseId: req.body.courseId,
                invitedBy: req.user?.userId,
                totalRequested: req.body.invites?.length || 0
            })
            .error();
    }
}

/**
 * Accept a course invitation
 * @route POST /api/courseAccess/acceptInvite
 */
async function acceptInvite(req, res, next) {
    const apiResponse = new ApiResponse(req, res);
    
    try {
        const { inviteId } = req.body;
        const userId = req.user.userId;

        if (!inviteId) {
            return apiResponse
                .status(400)
                .withMessage("inviteId is required")
                .withError("inviteId is required", "MISSING_FIELD", "acceptInvite")
                .error();
        }

        const result = await CourseAccessService.acceptInvite(inviteId, userId);

        apiResponse
            .status(200)
            .withMessage(result.message)
            .withData({
                access: result.access,
                course: result.course
            })
            .withMeta({
                inviteId,
                userId,
                acceptedAt: new Date().toISOString()
            })
            .success();
    } catch (err) {
        logger.error(`Error occurred while accepting invite:`, err.message);
        const errorMessage = err.message?.toLowerCase() || '';
        const status = errorMessage.includes('invalid or expired invitation') || errorMessage.includes('this invitation has expired') ? 404 :
                      errorMessage.includes('email address') ? 403 : 500;
        
        apiResponse
            .status(status)
            .withMessage(err.message || "Failed to accept invite")
            .withError(err.message, err.code || "ACCEPT_INVITE_ERROR", "acceptInvite")
            .withMeta({
                inviteId: req.body.inviteId,
                userId: req.user?.userId
            })
            .error();
    }
}

/**
 * Decline a course invitation
 * @route POST /api/courseAccess/declineInvite
 */
async function declineInvite(req, res, next) {
    const apiResponse = new ApiResponse(req, res);
    
    try {
        const { inviteId } = req.body;
        const userId = req.user.userId;

        if (!inviteId) {
            return apiResponse
                .status(400)
                .withMessage("inviteId is required")
                .withError("inviteId is required", "MISSING_FIELD", "declineInvite")
                .error();
        }

        const result = await CourseAccessService.declineInvite(inviteId, userId);

        apiResponse
            .status(200)
            .withMessage(result.message)
            .withData({ invite: result.invite })
            .withMeta({
                inviteId,
                userId,
                declinedAt: new Date().toISOString()
            })
            .success();
    } catch (err) {
        logger.error(`Error occurred while declining invite:`, err.message);
        const errorMessage = err.message?.toLowerCase() || '';
        const status = errorMessage.includes('invalid or already processed invitation') || errorMessage.includes('this invitation has expired') ? 404 :
                      errorMessage.includes('email address') ? 403 : 500;
        
        apiResponse
            .status(status)
            .withMessage(err.message || "Failed to decline invite")
            .withError(err.message, err.code || "DECLINE_INVITE_ERROR", "declineInvite")
            .withMeta({
                inviteId: req.body.inviteId,
                userId: req.user?.userId
            })
            .error();
    }
}

/**
 * Cancel a course invitation (by the inviter)
 * @route POST /api/courseAccess/cancelInvite
 */
async function cancelInvite(req, res, next) {
    const apiResponse = new ApiResponse(req, res);
    
    try {
        const { inviteId } = req.body;
        const userId = req.user.userId;

        if (!inviteId) {
            return apiResponse
                .status(400)
                .withMessage("inviteId is required")
                .withError("inviteId is required", "MISSING_FIELD", "cancelInvite")
                .error();
        }

        const result = await CourseAccessService.cancelInvite(inviteId, userId);

        apiResponse
            .status(200)
            .withMessage(result.message)
            .withData({ invite: result.invite })
            .withMeta({
                inviteId,
                cancelledBy: userId,
                cancelledAt: new Date().toISOString()
            })
            .success();
    } catch (err) {
        logger.error(`Error occurred while cancelling invite:`, err.message);
        const errorMessage = err.message?.toLowerCase() || '';
        const status = errorMessage.includes('invalid or already processed invitation') ? 404 :
                      errorMessage.includes('you can only cancel invitations that you sent') ? 403 : 500;
        
        apiResponse
            .status(status)
            .withMessage(err.message || "Failed to cancel invite")
            .withError(err.message, err.code || "CANCEL_INVITE_ERROR", "cancelInvite")
            .withMeta({
                inviteId: req.body.inviteId,
                cancelledBy: req.user?.userId
            })
            .error();
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

