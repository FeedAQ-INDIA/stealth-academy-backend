const express = require("express");
const router = express.Router();
const orgGroupController = require("../controller/OrgGroup.controller.js");
const authMiddleware = require("../middleware/authMiddleware");
const OrgGroupValidator = require("../middleware/orgGroupValidator");

// ============= ORGANIZATION USER MANAGEMENT =============

// Add user to organization
router.post("/organization/:orgId/users", 
    authMiddleware, 
    OrgGroupValidator.validateAddUserToOrg, 
    orgGroupController.addUserToOrg
);

// Remove user from organization
router.delete("/organization/:orgId/users/:userId", 
    authMiddleware, 
    OrgGroupValidator.validateIdParams, 
    orgGroupController.removeUserFromOrg
);

// Update user role in organization
router.put("/organization/:orgId/users/:userId/role", 
    authMiddleware, 
    OrgGroupValidator.validateIdParams,
    OrgGroupValidator.validateUpdateRole, 
    orgGroupController.updateUserRoleInOrg
);

// Get organization users
router.get("/organization/:orgId/users", 
    authMiddleware, 
    OrgGroupValidator.validateIdParams,
    OrgGroupValidator.validateQueryParams, 
    orgGroupController.getOrganizationUsers
);

// ============= GROUP MANAGEMENT =============

// Create a new group in organization
router.post("/organization/:orgId/groups", 
    authMiddleware, 
    OrgGroupValidator.validateCreateGroup, 
    orgGroupController.createGroup
);

// Update group
router.put("/groups/:groupId", 
    authMiddleware, 
    OrgGroupValidator.validateUpdateGroup, 
    orgGroupController.updateGroup
);

// Delete group
router.delete("/groups/:groupId", 
    authMiddleware, 
    OrgGroupValidator.validateIdParams, 
    orgGroupController.deleteGroup
);

// Get organization groups
router.get("/organization/:orgId/groups", 
    authMiddleware, 
    OrgGroupValidator.validateIdParams,
    OrgGroupValidator.validateQueryParams, 
    orgGroupController.getOrgGroups
);

// Get group by ID
router.get("/groups/:groupId", 
    authMiddleware, 
    OrgGroupValidator.validateIdParams,
    OrgGroupValidator.validateQueryParams, 
    orgGroupController.getGroupById
);

// ============= GROUP MEMBERSHIP MANAGEMENT =============

// Add users to a group
router.post("/groups/:groupId/users", 
    authMiddleware, 
    OrgGroupValidator.validateAddUsersToGroup, 
    orgGroupController.addUsersToGroup
);

// Remove user from group
router.delete("/groups/:groupId/users/:userId", 
    authMiddleware, 
    OrgGroupValidator.validateIdParams, 
    orgGroupController.removeUserFromGroup
);

// Update user role in group
router.put("/groups/:groupId/users/:userId/role", 
    authMiddleware, 
    OrgGroupValidator.validateIdParams,
    OrgGroupValidator.validateUpdateRole, 
    orgGroupController.updateUserRoleInGroup
);

// Get group members
router.get("/groups/:groupId/users", 
    authMiddleware, 
    OrgGroupValidator.validateIdParams, 
    orgGroupController.getGroupMembers
);

// Get user groups
router.get("/users/:userId/groups", 
    authMiddleware, 
    OrgGroupValidator.validateIdParams,
    OrgGroupValidator.validateQueryParams, 
    orgGroupController.getUserGroups
);

module.exports = router;
