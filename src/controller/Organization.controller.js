const db = require("../config/db.config.js");
const Organization = db.organization;
const Group = db.group;
const GroupUser = db.group_user;
const OrganizationUser = db.organizationUser;
const User = db.user;
const logger = require('../config/winston.config.js');

// Register a new organization
exports.registerOrganization = async (req, res) => {
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
            metadata
        } = req.body;

        // Validate required fields
        if (!orgName || !orgEmail) {
            return res.status(400).json({
                success: false,
                message: "Organization name and email are required"
            });
        }

        // Check if organization with same email already exists
        const existingOrg = await Organization.findOne({
            where: { orgEmail }
        });

        if (existingOrg) {
            return res.status(409).json({
                success: false,
                message: "Organization with this email already exists"
            });
        }

        // Create new organization
        const organization = await Organization.create({
            orgName,
            orgEmail,
            orgContactNo,
            orgDomain,
            orgAddress,
            orgCity,
            orgState,
            orgCountry,
            orgPincode,
            metadata: metadata || {}
        });

        return res.status(201).json({
            success: true,
            message: "Organization registered successfully",
            data: organization
        });

    } catch (error) {
        logger.error('Error in registerOrganization:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Update organization profile
exports.updateOrganization = async (req, res) => {
    try {
        const { orgId } = req.params;
        const updateData = req.body;

        // Check if organization exists
        const organization = await Organization.findByPk(orgId);
        
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization not found"
            });
        }

        // Update organization
        await organization.update(updateData);

        return res.status(200).json({
            success: true,
            message: "Organization updated successfully",
            data: organization
        });

    } catch (error) {
        logger.error('Error in updateOrganization:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get organization details
exports.getOrganization = async (req, res) => {
    try {
        const { orgId } = req.params;

        const organization = await Organization.findByPk(orgId);
        
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: organization
        });

    } catch (error) {
        logger.error('Error in getOrganization:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};
