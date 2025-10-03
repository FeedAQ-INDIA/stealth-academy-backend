const express = require("express");
const router = express.Router();
const courseStudyGroupController = require("../controller/CourseStudyGroup.controller");
const authMiddleware = require("../middleware/authMiddleware");

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Create or update study group
router.post("/createOrUpdate", courseStudyGroupController.createOrUpdateStudyGroup);

// Add member to study group
router.post("/addMember", courseStudyGroupController.addMemberToStudyGroup);

// Remove member from study group
router.delete("/:courseStudyGroupId/member/:userId", courseStudyGroupController.removeMemberFromStudyGroup);

// Add content to study group
router.post("/addContent", courseStudyGroupController.addContentToStudyGroup);

// Remove content from study group
router.delete("/:courseStudyGroupId/content/:courseId", courseStudyGroupController.removeContentFromStudyGroup);

// Get study group details
router.get("/:courseStudyGroupId", courseStudyGroupController.getStudyGroupDetails);

// Delete study group
router.delete("/:courseStudyGroupId", courseStudyGroupController.deleteStudyGroup);

module.exports = router;