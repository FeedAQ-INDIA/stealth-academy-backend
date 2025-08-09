const express = require("express");
const router = express.Router();
const orgGroupController = require("../controller/OrgGroup.controller.js");
const authMiddleware = require("../middleware/authMiddleware");

// Add user to organization
router.post("/organization/:orgId/users", authMiddleware, orgGroupController.addUserToOrg);

// Create a new group in organization
router.post("/organization/:orgId/groups", authMiddleware, orgGroupController.createGroup);

// Add users to a group
router.post("/groups/:groupId/users", authMiddleware, orgGroupController.addUsersToGroup);

// Get organization groups
router.get("/organization/:orgId/groups", authMiddleware, orgGroupController.getOrgGroups);

// Get group members
router.get("/groups/:groupId/users", authMiddleware, orgGroupController.getGroupMembers);

module.exports = router;
