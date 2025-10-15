const logger = require('../config/winston.config.js');
const OrganizationService = require('../service/Organization.service.js');
 
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
 

module.exports = {
    // Organization Management - keep only what we need
    registerOrganization,
    updateOrganization,
    
    
    getUserOrganizations,
    
 
};
