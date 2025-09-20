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

// Update organization profile
router.put("/organization/:orgId", 
    authMiddleware, 
    organizationController.updateOrganization
);

// ========== ORGANIZATION USER MANAGEMENT ==========

// Get user's organizations (getAllOrg for user)
router.get("/user/organizations", 
    authMiddleware, 
    organizationController.getUserOrganizations
);

// Invite user to organization (add member)
router.post("/organization/:orgId/invite", 
    authMiddleware, 
    organizationController.inviteUserToOrganization
);

// Remove user from organization (delete member)
router.delete("/organization/:orgId/users/:userId", 
    authMiddleware, 
    organizationController.removeUserFromOrganization
);

module.exports = router;
