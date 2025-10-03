const express = require("express");
const router = express.Router();
const organizationController = require("../controller/Organization.controller.js");
const authMiddleware = require("../middleware/authMiddleware");
const { 
    validateOrganizationRegistration,
 
} = require("../middleware/organizationValidation");
const { 
    validateInvitationData,
    validateInvitationToken
} = require("../middleware/invitationValidation");

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
    validateInvitationData,
    organizationController.inviteUserToOrganization
);

// Remove user from organization (delete member)
router.delete("/organization/:orgId/users/:userId", 
    authMiddleware, 
    organizationController.removeUserFromOrganization
);

// ========== INVITATION MANAGEMENT ==========

// Get invitation details by token (public route for email links)
router.get("/invite/:token", 
    validateInvitationToken,
    organizationController.getInvitationByToken
);

// Accept organization invitation
router.post("/invite/:token/accept", 
    authMiddleware,
    validateInvitationToken,
    organizationController.acceptOrganizationInvite
);

// Reject organization invitation
router.post("/invite/:token/reject", 
    validateInvitationToken,
    organizationController.rejectOrganizationInvite
);

module.exports = router;
