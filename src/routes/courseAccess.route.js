const express = require("express");
const router = express.Router();
const courseAccessController = require("../controller/CourseAccess.controller");
const authMiddleware = require("../middleware/authMiddleware");

// Apply authentication middleware to all routes
router.use(authMiddleware);


/**
 * @route POST /api/courseAccess/revokeAccess
 * @desc Revoke access to a course
 * @access Private
 */
router.post("/revokeAccess", courseAccessController.revokeAccess);

/**
 * @route POST /api/courseAccess/updateUserAccess
 * @desc Update access level or expiration for a user
 * @access Private
 */
router.post("/updateUserAccess", courseAccessController.updateAccess);

/**
 * @route GET /api/courseAccess/getCourseMembers/:courseId
 * @desc Get all access records for a course
 * @access Private
 */
router.get("/getCourseMembers/:courseId", courseAccessController.getCourseAccess);

/**
 * @route GET /api/courseAccess/getInvitedMembers/:courseId
 * @desc Get all invited members for a course
 * @access Private
 */
router.get("/getInvitedMembers/:courseId", courseAccessController.getInvitedMembers);

/**
 * @route POST /api/courseAccess/inviteUser
 * @desc Invite users to a course
 * @access Private
 */
router.post("/inviteUser", courseAccessController.inviteUser);

/**
 * @route POST /api/courseAccess/acceptInvite
 * @desc Accept a course invitation
 * @access Private
 */
router.post("/acceptInvite", courseAccessController.acceptInvite);

/**
 * @route POST /api/courseAccess/declineInvite
 * @desc Decline a course invitation
 * @access Private
 */
router.post("/declineInvite", courseAccessController.declineInvite);

/**
 * @route POST /api/courseAccess/cancelInvite
 * @desc Cancel a course invitation (by the inviter)
 * @access Private
 */
router.post("/revokeInvite", courseAccessController.revokeInvite);

module.exports = router;
