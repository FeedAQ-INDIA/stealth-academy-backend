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
router.post("/removeMember", courseStudyGroupController.removeMemberFromStudyGroup);

// Add content to study group
router.post("/addContent", courseStudyGroupController.addContentToStudyGroup);

// Remove content from study group
router.post("/removeContent", courseStudyGroupController.removeContentFromStudyGroup);

// Get all study groups
router.get("/getAllCourseStudyGroup", courseStudyGroupController.getAllCourseStudyGroup);

// Get study group details by ID
router.get("/getCourseStudyGroupDetailById/:courseStudyGroupId", courseStudyGroupController.getStudyGroupDetails);

// Delete study group
router.post("/deleteStudyGroup", courseStudyGroupController.deleteStudyGroup);

module.exports = router;