const logger = require('../config/winston.config.js');
const OrganizationService = require('../service/Organization.service.js');
const { ApiResponse } = require("../utils/responseFormatter");
 
// ========== ORGANIZATION MANAGEMENT ==========
 
// Register a new organization
// Business Rule: A user can create only 1 organization but can be part of multiple organizations
async function registerOrganization(req, res, next) {
    const apiResponse = new ApiResponse(req, res);
    
    try {
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

        // Validate required fields
        if (!orgName || !orgEmail) {
            return apiResponse
                .status(400)
                .withMessage("Organization name and email are required")
                .withError("Organization name and email are required", "MISSING_FIELDS", "registerOrganization")
                .error();
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
        
        apiResponse
            .status(201)
            .withMessage("Organization registered successfully")
            .withData({ organization: val })
            .withMeta({
                orgName,
                registeredBy: req.user?.userId
            })
            .success();
    } catch (err) {
        logger.error(`Error occurred while registering organization:`, err.message);
        
        apiResponse
            .status(500)
            .withMessage(err.message || "Failed to register organization")
            .withError(err.message, err.code || "REGISTER_ORGANIZATION_ERROR", "registerOrganization")
            .withMeta({
                orgName: req.body.orgName,
                attemptedBy: req.user?.userId
            })
            .error();
    }
}

// Update organization profile
async function updateOrganization(req, res, next) {
    const apiResponse = new ApiResponse(req, res);
    
    try {
        const { orgId } = req.params;
        const updateData = req.body;

        if (!orgId) {
            return apiResponse
                .status(400)
                .withMessage("orgId is required")
                .withError("orgId is required", "MISSING_PARAMETER", "updateOrganization")
                .error();
        }

        const val = await OrganizationService.updateOrganization(orgId, req.user?.userId, updateData);
        
        apiResponse
            .status(200)
            .withMessage("Organization updated successfully")
            .withData({ organization: val })
            .withMeta({
                orgId,
                updatedBy: req.user?.userId,
                updatedFields: Object.keys(updateData)
            })
            .success();
    } catch (err) {
        logger.error(`Error occurred while updating organization:`, err.message);
        
        apiResponse
            .status(500)
            .withMessage(err.message || "Failed to update organization")
            .withError(err.message, err.code || "UPDATE_ORGANIZATION_ERROR", "updateOrganization")
            .withMeta({
                orgId: req.params.orgId,
                updatedBy: req.user?.userId
            })
            .error();
    }
}

// ========== ORGANIZATION USER MANAGEMENT ==========

// Get user's organizations
async function getUserOrganizations(req, res, next) {
    const apiResponse = new ApiResponse(req, res);
    
    try {
        if (!req.user?.userId) {
            return apiResponse
                .status(401)
                .withMessage("Authentication required")
                .withError("Authentication required", "UNAUTHORIZED", "getUserOrganizations")
                .error();
        }

        const val = await OrganizationService.getUserOrganizations(req.user.userId);
        
        apiResponse
            .status(200)
            .withMessage("User organizations fetched successfully")
            .withData({ 
                organizations: val != null ? val : [],
                count: val?.length || 0
            })
            .withMeta({
                userId: req.user.userId
            })
            .success();
    } catch (err) {
        logger.error(`Error occurred while fetching user organizations:`, err.message);
        
        apiResponse
            .status(500)
            .withMessage(err.message || "Failed to fetch user organizations")
            .withError(err.message, err.code || "GET_USER_ORGANIZATIONS_ERROR", "getUserOrganizations")
            .withMeta({
                userId: req.user?.userId
            })
            .error();
    }
}
 

module.exports = {
    // Organization Management - keep only what we need
    registerOrganization,
    updateOrganization,
    
    
    getUserOrganizations,
    
 
};
