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
    const { email, userRole, permissions } = req.body;

    try {
        if (!email) {
            return res.status(400).send({
                status: 400,
                message: "Email is required"
            });
        }

        const invitationData = { email, userRole, permissions };
        const val = await OrganizationService.inviteUserToOrganization(orgId, req.user?.userId, invitationData);
        
        res.status(201).send({
            status: 201,
            message: "User invited successfully",
            data: val != null ? val : []
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
        res.status(500).send({
            status: 500,
            message: err.message || "Error occurred while removing user from organization"
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
    getUserOrganizations
};
