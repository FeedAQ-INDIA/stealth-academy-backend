const db = require("../entity/index.js");
const Organization = db.Organization;
const OrganizationGroups = db.OrganizationGroups;
const OrganizationUserGroups = db.OrganizationUserGroups;
const OrganizationUser = db.OrganizationUser;
const User = db.User;
const logger = require('../config/winston.config.js');
const orgGroupService = require('../service/OrgGroup.service.js');

// ============= ORGANIZATION USER MANAGEMENT =============

// Add user to organization
exports.addUserToOrg = async (req, res) => {
    try {
        const { orgId } = req.params;
        const { userId, role, invitedBy } = req.body;

        const orgUser = await orgGroupService.addUserToOrganization(orgId, userId, role, invitedBy);

        return res.status(201).json({
            success: true,
            message: "User added to organization successfully",
            data: orgUser
        });

    } catch (error) {
        logger.error('Error in addUserToOrg:', error);
        return res.status(error.message.includes('not found') ? 404 : 
                         error.message.includes('already part') ? 409 : 500).json({
            success: false,
            message: error.message,
            error: error.message
        });
    }
};

// Remove user from organization
exports.removeUserFromOrg = async (req, res) => {
    try {
        const { orgId, userId } = req.params;

        const result = await orgGroupService.removeUserFromOrganization(orgId, userId);

        return res.status(200).json({
            success: true,
            message: result.message
        });

    } catch (error) {
        logger.error('Error in removeUserFromOrg:', error);
        return res.status(error.message.includes('not part') ? 404 : 500).json({
            success: false,
            message: error.message,
            error: error.message
        });
    }
};

// Update user role in organization
exports.updateUserRoleInOrg = async (req, res) => {
    try {
        const { orgId, userId } = req.params;
        const { role } = req.body;

        const orgUser = await orgGroupService.updateUserRoleInOrganization(orgId, userId, role);

        return res.status(200).json({
            success: true,
            message: "User role updated successfully",
            data: orgUser
        });

    } catch (error) {
        logger.error('Error in updateUserRoleInOrg:', error);
        return res.status(error.message.includes('not part') ? 404 : 500).json({
            success: false,
            message: error.message,
            error: error.message
        });
    }
};

// Get organization users
exports.getOrganizationUsers = async (req, res) => {
    try {
        const { orgId } = req.params;
        const { includeGroups } = req.query;

        const users = await orgGroupService.getOrganizationUsers(orgId, includeGroups === 'true');

        return res.status(200).json({
            success: true,
            data: users
        });

    } catch (error) {
        logger.error('Error in getOrganizationUsers:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// ============= GROUP MANAGEMENT =============

// Create a new group in organization
exports.createGroup = async (req, res) => {
    try {
        const { orgId } = req.params;
        const { groupName, description, metadata } = req.body;

        const group = await orgGroupService.createGroup(orgId, groupName, description, metadata);

        return res.status(201).json({
            success: true,
            message: "Group created successfully",
            data: group
        });

    } catch (error) {
        logger.error('Error in createGroup:', error);
        return res.status(error.message.includes('not found') ? 404 : 
                         error.message.includes('already exists') ? 409 : 500).json({
            success: false,
            message: error.message,
            error: error.message
        });
    }
};

// Update group
exports.updateGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const updates = req.body;

        const group = await orgGroupService.updateGroup(groupId, updates);

        return res.status(200).json({
            success: true,
            message: "Group updated successfully",
            data: group
        });

    } catch (error) {
        logger.error('Error in updateGroup:', error);
        return res.status(error.message.includes('not found') ? 404 : 
                         error.message.includes('already exists') ? 409 : 500).json({
            success: false,
            message: error.message,
            error: error.message
        });
    }
};

// Delete group
exports.deleteGroup = async (req, res) => {
    try {
        const { groupId } = req.params;

        const result = await orgGroupService.deleteGroup(groupId);

        return res.status(200).json({
            success: true,
            message: result.message
        });

    } catch (error) {
        logger.error('Error in deleteGroup:', error);
        return res.status(error.message.includes('not found') ? 404 : 500).json({
            success: false,
            message: error.message,
            error: error.message
        });
    }
};

// Get organization groups
exports.getOrgGroups = async (req, res) => {
    try {
        const { orgId } = req.params;
        const { includeMembers } = req.query;

        const groups = await orgGroupService.getOrganizationGroups(orgId, includeMembers === 'true');

        return res.status(200).json({
            success: true,
            data: groups
        });

    } catch (error) {
        logger.error('Error in getOrgGroups:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get group by ID
exports.getGroupById = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { includeMembers } = req.query;

        const group = await orgGroupService.getGroupById(groupId, includeMembers === 'true');

        return res.status(200).json({
            success: true,
            data: group
        });

    } catch (error) {
        logger.error('Error in getGroupById:', error);
        return res.status(error.message.includes('not found') ? 404 : 500).json({
            success: false,
            message: error.message,
            error: error.message
        });
    }
};

// ============= GROUP MEMBERSHIP MANAGEMENT =============

// Add users to a group
exports.addUsersToGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { userIds, role } = req.body;

        const groupUsers = await orgGroupService.addUsersToGroup(groupId, userIds, role);

        return res.status(200).json({
            success: true,
            message: "Users added to group successfully",
            data: groupUsers
        });

    } catch (error) {
        logger.error('Error in addUsersToGroup:', error);
        return res.status(error.message.includes('not found') ? 404 : 
                         error.message.includes('not part') ? 400 : 500).json({
            success: false,
            message: error.message,
            error: error.message
        });
    }
};

// Remove user from group
exports.removeUserFromGroup = async (req, res) => {
    try {
        const { groupId, userId } = req.params;

        const result = await orgGroupService.removeUserFromGroup(groupId, userId);

        return res.status(200).json({
            success: true,
            message: result.message
        });

    } catch (error) {
        logger.error('Error in removeUserFromGroup:', error);
        return res.status(error.message.includes('not a member') ? 404 : 500).json({
            success: false,
            message: error.message,
            error: error.message
        });
    }
};

// Update user role in group
exports.updateUserRoleInGroup = async (req, res) => {
    try {
        const { groupId, userId } = req.params;
        const { role } = req.body;

        const groupUser = await orgGroupService.updateUserRoleInGroup(groupId, userId, role);

        return res.status(200).json({
            success: true,
            message: "User role in group updated successfully",
            data: groupUser
        });

    } catch (error) {
        logger.error('Error in updateUserRoleInGroup:', error);
        return res.status(error.message.includes('not a member') ? 404 : 500).json({
            success: false,
            message: error.message,
            error: error.message
        });
    }
};

// Get group members
exports.getGroupMembers = async (req, res) => {
    try {
        const { groupId } = req.params;

        const groupUsers = await orgGroupService.getGroupMembers(groupId);

        return res.status(200).json({
            success: true,
            data: groupUsers
        });

    } catch (error) {
        logger.error('Error in getGroupMembers:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get user groups
exports.getUserGroups = async (req, res) => {
    try {
        const { userId } = req.params;
        const { orgId } = req.query;

        const userGroups = await orgGroupService.getUserGroups(userId, orgId);

        return res.status(200).json({
            success: true,
            data: userGroups
        });

    } catch (error) {
        logger.error('Error in getUserGroups:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};
