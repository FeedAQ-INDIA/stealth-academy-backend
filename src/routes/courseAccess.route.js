const express = require("express");
const router = express.Router();
const courseAccessController = require("../controller/CourseAccess.controller");
const authMiddleware = require("../middleware/authMiddleware");

// Apply authentication middleware to all routes
router.use(authMiddleware);

router.post("/revokeAccess", courseAccessController.revokeAccess);
 
// Update access level or expiration
router.post("/updateUserAccess", courseAccessController.updateAccess);

// Get all access records for a course
router.get("/getCourseMembers/:courseId", courseAccessController.getCourseAccess);

// Check if a user has access to a course
router.get("/checkCourseAccess/:courseId", courseAccessController.checkAccess);


router.get("/getInvitedMembers/:courseId", courseAccessController.getInvitedMembers);



// Invite users to a course
router.post("/inviteUser", courseAccessController.inviteUser);

module.exports = router;
