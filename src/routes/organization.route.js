const express = require("express");
const router = express.Router();
const organizationController = require("../controller/Organization.controller.js");
const authMiddleware = require("../middleware/authMiddleware");
const { 
    validateOrganizationRegistration,
 
} = require("../middleware/organizationValidation");

// ========== ORGANIZATION MANAGEMENT ==========

 

// Register a new organization
router.post("/registerOrg", 
    authMiddleware,
    validateOrganizationRegistration,
    organizationController.registerOrganization
);

// Get all organizations (with pagination and filters)
router.get("/organizations", 
    authMiddleware, 
    organizationController.getAllOrganizations
);

// Get organization details
router.get("/organization/:orgId", 
    authMiddleware, 
    organizationController.getOrganization
);

// Update organization profile
router.put("/organization/:orgId", 
    authMiddleware, 
    organizationController.updateOrganization
);

// Delete organization (soft delete)
router.delete("/organization/:orgId", 
    authMiddleware, 
    organizationController.deleteOrganization
);

// Update organization status (ACTIVE/INACTIVE/SUSPENDED)
router.patch("/organization/:orgId/status", 
    authMiddleware, 
    organizationController.updateOrganizationStatus
);

// Get organization statistics/dashboard data
router.get("/organization/:orgId/stats", 
    authMiddleware, 
    organizationController.getOrganizationStats
);

// ========== ORGANIZATION USER MANAGEMENT ==========

// Invite user to organization
router.post("/organization/:orgId/invite", 
    authMiddleware, 
    organizationController.inviteUserToOrganization
);

// Accept organization invitation
router.post("/organization/:orgId/accept-invite", 
    authMiddleware, 
    organizationController.acceptOrganizationInvite
);

// Reject organization invitation
router.post("/organization/:orgId/reject-invite", 
    authMiddleware, 
    organizationController.rejectOrganizationInvite
);

// Get all users in organization
router.get("/organization/:orgId/users", 
    authMiddleware, 
    organizationController.getOrganizationUsers
);

// Get specific user details in organization
router.get("/organization/:orgId/users/:userId", 
    authMiddleware, 
    organizationController.getOrganizationUser
);

// Update user role in organization
router.put("/organization/:orgId/users/:userId/role", 
    authMiddleware, 
    organizationController.updateUserRole
);

// Update user status in organization
router.patch("/organization/:orgId/users/:userId/status", 
    authMiddleware, 
    organizationController.updateUserStatus
);

// Remove user from organization
router.delete("/organization/:orgId/users/:userId", 
    authMiddleware, 
    organizationController.removeUserFromOrganization
);

// Get user's organizations
router.get("/user/organizations", 
    authMiddleware, 
    organizationController.getUserOrganizations
);

// ========== ORGANIZATION GROUPS MANAGEMENT ==========

// Create group in organization
router.post("/organization/:orgId/groups", 
    authMiddleware, 
    organizationController.createGroup
);

// Get all groups in organization
router.get("/organization/:orgId/groups", 
    authMiddleware, 
    organizationController.getOrganizationGroups
);

// Get specific group details
router.get("/organization/:orgId/groups/:groupId", 
    authMiddleware, 
    organizationController.getGroup
);

// Update group details
router.put("/organization/:orgId/groups/:groupId", 
    authMiddleware, 
    organizationController.updateGroup
);

// Delete group
router.delete("/organization/:orgId/groups/:groupId", 
    authMiddleware, 
    organizationController.deleteGroup
);

// Add users to group
router.post("/organization/:orgId/groups/:groupId/users", 
    authMiddleware, 
    organizationController.addUsersToGroup
);

// Remove user from group
router.delete("/organization/:orgId/groups/:groupId/users/:userId", 
    authMiddleware, 
    organizationController.removeUserFromGroup
);

// Get group members
router.get("/organization/:orgId/groups/:groupId/users", 
    authMiddleware, 
    organizationController.getGroupMembers
);

// ========== BULK OPERATIONS ==========

// Bulk invite users to organization
router.post("/organization/:orgId/bulk-invite", 
    authMiddleware, 
    organizationController.bulkInviteUsers
);

// Bulk update user roles
router.patch("/organization/:orgId/bulk-update-roles", 
    authMiddleware, 
    organizationController.bulkUpdateUserRoles
);

// Export organization data
router.get("/organization/:orgId/export", 
    authMiddleware, 
    organizationController.exportOrganizationData
);

// ========== SEARCH AND FILTER ==========

// Search organizations
router.get("/search/organizations", 
    authMiddleware, 
    organizationController.searchOrganizations
);

// Search users within organization
router.get("/organization/:orgId/search/users", 
    authMiddleware, 
    organizationController.searchOrganizationUsers
);

// Search groups within organization
router.get("/organization/:orgId/search/groups", 
    authMiddleware, 
    organizationController.searchOrganizationGroups
);

module.exports = router;
