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
 

module.exports = router;
