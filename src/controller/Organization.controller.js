const logger = require('../config/winston.config.js');
const OrganizationService = require('../service/Organization.service.js');
const OrgGroupService = require('../service/OrgGroup.service.js');

// ========== ORGANIZATION MANAGEMENT ==========

// Register a new organization
// Business Rule: A user can create only 1 organization but can be part of multiple organizations
async function registerOrganization(req, res, next) {
    const {
        orgName,
        orgEmail,
        orgContactNo,
        orgDomain,
        orgAddress,
        orgCity,
        orgState,
        orgCountry,
        orgPincode,
        orgType,
        orgIndustry,
        orgSize,
        orgWebsite,
        orgDescription,
        adminName,
        adminEmail,
        metadata
    } = req.body;

    try {
        // Validate required fields
        if (!orgName || !orgEmail) {
            return res.status(400).send({
                status: 400,
                message: "Organization name and email are required"
            });
        }

        const organizationData = {
            orgName,
            orgEmail,
            orgContactNo,
            orgDomain,
            orgAddress,
            orgCity,
            orgState,
            orgCountry,
            orgPincode,
            orgType,
            orgIndustry,
            orgSize,
            orgWebsite,
            orgDescription,
            adminName,
            adminEmail,
            metadata
        };

        const val = await OrganizationService.registerOrganization(req.user?.userId, organizationData);
        
        res.status(201).send({
            status: 201,
            message: "Organization registered successfully",
            data: val != null ? val : []
        });
    } catch (err) {
        console.error(`Error occurred while registering organization:`, err.message);
        res.status(500).send({
            status: 500,
            message: err.message || "Error occurred while registering the organization"
        });
        next(err);
    }
}

// Update organization profile
async function updateOrganization(req, res, next) {
    const { orgId } = req.params;
    const updateData = req.body;

    try {
        const val = await OrganizationService.updateOrganization(orgId, req.user?.userId, updateData);
        res.status(200).send({
            status: 200,
            message: "Organization updated successfully",
            data: val != null ? val : []
        });
    } catch (err) {
        console.error(`Error occurred while updating organization:`, err.message);
        res.status(500).send({
            status: 500,
            message: err.message || "Error occurred while updating organization"
        });
        next(err);
    }
}

// ========== ORGANIZATION USER MANAGEMENT ==========

// Get user's organizations
async function getUserOrganizations(req, res, next) {
    try {
        if (!req.user?.userId) {
            return res.status(401).send({
                status: 401,
                message: "Authentication required"
            });
        }

        const val = await OrganizationService.getUserOrganizations(req.user.userId);
        res.status(200).send({
            status: 200,
            message: "Success",
            data: val != null ? val : []
        });
    } catch (err) {
        console.error(`Error occurred while fetching user organizations:`, err.message);
        res.status(500).send({
            status: 500,
            message: err.message || "Error occurred while fetching user organizations"
        });
        next(err);
    }
}

// Invite user to organization
async function inviteUserToOrganization(req, res, next) {
    const { orgId } = req.params;
    const { email, userRole, permissions, message } = req.body;

    try {
        if (!email) {
            return res.status(400).send({
                status: 400,
                message: "Email is required"
            });
        }

        // Validate userRole if provided
        const validRoles = ['ADMIN', 'MANAGER', 'INSTRUCTOR', 'MEMBER'];
        if (userRole && !validRoles.includes(userRole)) {
            return res.status(400).send({
                status: 400,
                message: `Invalid user role. Must be one of: ${validRoles.join(', ')}`
            });
        }

        const invitationData = { email, userRole, permissions, message };
        const result = await OrganizationService.inviteUserToOrganization(orgId, req.user?.userId, invitationData);
        
        res.status(201).send({
            status: 201,
            message: result.message,
            data: {
                invitation: result.invitation,
                emailSent: result.emailSent,
                acceptUrl: result.acceptUrl
            }
        });
    } catch (err) {
        console.error(`Error occurred while inviting user:`, err.message);
        res.status(500).send({
            status: 500,
            message: err.message || "Error occurred while inviting user"
        });
        next(err);
    }
}

// Remove user from organization
async function removeUserFromOrganization(req, res, next) {
    const { orgId, userId } = req.params;
    
    try {
        if (!orgId || !userId) {
            return res.status(400).send({
                status: 400,
                message: "Organization ID and User ID are required"
            });
        }

        const val = await OrgGroupService.removeUserFromOrganization(orgId, userId);
        
        res.status(200).send({
            status: 200,
            message: "User removed from organization successfully",
            data: val != null ? val : []
        });
    } catch (err) {
        console.error(`Error occurred while removing user from organization:`, err.message);
        
        // Handle admin validation error specifically
        if (err.message === "Cannot remove the last admin from the organization. At least one admin must remain.") {
            return res.status(400).send({
                status: 400,
                message: err.message
            });
        }
        
        res.status(500).send({
            status: 500,
            message: err.message || "Error occurred while removing user from organization"
        });
        next(err);
    }
}

// Get invitation details by token
async function getInvitationByToken(req, res, next) {
    const { token } = req.params;
    
    try {
        if (!token) {
            return res.status(400).send({
                status: 400,
                message: "Invitation token is required"
            });
        }

        const invitation = await OrganizationService.getInvitationByToken(token);
        
        res.status(200).send({
            status: 200,
            message: "Invitation details retrieved successfully",
            data: invitation
        });
    } catch (err) {
        console.error(`Error occurred while getting invitation details:`, err.message);
        res.status(404).send({
            status: 404,
            message: err.message || "Invitation not found"
        });
        next(err);
    }
}

// Accept organization invitation
async function acceptOrganizationInvite(req, res, next) {
    const { token } = req.params;
    const { userId } = req.body; // Optional - if not provided, will use token's email
    
    try {
        if (!token) {
            return res.status(400).send({
                status: 400,
                message: "Invitation token is required"
            });
        }

        const result = await OrganizationService.acceptOrganizationInvite(token, userId || req.user?.userId);
        
        res.status(200).send({
            status: 200,
            message: result.message,
            data: result.membership
        });
    } catch (err) {
        console.error(`Error occurred while accepting invitation:`, err.message);
        res.status(400).send({
            status: 400,
            message: err.message || "Error occurred while accepting invitation"
        });
        next(err);
    }
}

// Reject organization invitation
async function rejectOrganizationInvite(req, res, next) {
    const { token } = req.params;
    
    try {
        if (!token) {
            return res.status(400).send({
                status: 400,
                message: "Invitation token is required"
            });
        }

        const result = await OrganizationService.rejectOrganizationInvite(token, req.user?.userId);
        
        res.status(200).send({
            status: 200,
            message: result.message,
            data: {}
        });
    } catch (err) {
        console.error(`Error occurred while rejecting invitation:`, err.message);
        res.status(400).send({
            status: 400,
            message: err.message || "Error occurred while rejecting invitation"
        });
        next(err);
    }
}

module.exports = {
    // Organization Management - keep only what we need
    registerOrganization,
    updateOrganization,
    
    // Organization User Management - keep only what we need
    inviteUserToOrganization,
    removeUserFromOrganization,
    getUserOrganizations,
    
    // Invitation Management
    getInvitationByToken,
    acceptOrganizationInvite,
    rejectOrganizationInvite
};
