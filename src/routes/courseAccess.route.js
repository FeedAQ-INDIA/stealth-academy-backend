const express = require("express");
const router = express.Router();
const courseAccessController = require("../controller/CourseAccess.controller");
const authMiddleware = require("../middleware/authMiddleware");

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Grant access to a course
router.post("/grant", courseAccessController.grantAccess);

// Revoke access to a course
router.delete("/:courseAccessId", courseAccessController.revokeAccess);

// Update access level or expiration
router.put("/:courseAccessId", courseAccessController.updateAccess);

// Get all access records for a course
router.get("/course/:courseId", courseAccessController.getCourseAccess);

// Get all courses a user has access to
router.get("/user/:userId", courseAccessController.getUserCourseAccess);

// Check if a user has access to a course
router.get("/check/:userId/:courseId", courseAccessController.checkAccess);

module.exports = router;
