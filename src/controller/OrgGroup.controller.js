const db = require("../config/db.config.js");
const Group = db.group;
const GroupUser = db.group_user;
const Organization = db.organization;
const OrganizationUser = db.organizationUser;
const User = db.user;
const logger = require('../config/winston.config.js');

// Add user to organization
exports.addUserToOrg = async (req, res) => {
    try {
        const { orgId } = req.params;
        const { userId, role } = req.body;

        // Check if organization exists
        const organization = await Organization.findByPk(orgId);
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization not found"
            });
        }

        // Check if user exists
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check if user is already in organization
        const existingOrgUser = await OrganizationUser.findOne({
            where: { orgId, userId }
        });

        if (existingOrgUser) {
            return res.status(409).json({
                success: false,
                message: "User is already part of this organization"
            });
        }

        // Add user to organization
        const orgUser = await OrganizationUser.create({
            orgId,
            userId,
            role: role || 'MEMBER'
        });

        return res.status(201).json({
            success: true,
            message: "User added to organization successfully",
            data: orgUser
        });

    } catch (error) {
        logger.error('Error in addUserToOrg:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Create a new group in organization
exports.createGroup = async (req, res) => {
    try {
        const { orgId } = req.params;
        const { groupName, description, metadata } = req.body;

        // Check if organization exists
        const organization = await Organization.findByPk(orgId);
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization not found"
            });
        }

        // Check if group name already exists in this organization
        const existingGroup = await Group.findOne({
            where: { orgId, groupName }
        });

        if (existingGroup) {
            return res.status(409).json({
                success: false,
                message: "Group with this name already exists in the organization"
            });
        }

        // Create new group
        const group = await Group.create({
            orgId,
            groupName,
            description,
            metadata: metadata || {}
        });

        return res.status(201).json({
            success: true,
            message: "Group created successfully",
            data: group
        });

    } catch (error) {
        logger.error('Error in createGroup:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Add users to a group
exports.addUsersToGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { userIds } = req.body;

        // Check if group exists
        const group = await Group.findByPk(groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        // Check if all users exist and are part of the organization
        const orgId = group.orgId;
        const orgUsers = await OrganizationUser.findAll({
            where: {
                orgId,
                userId: userIds
            }
        });

        if (orgUsers.length !== userIds.length) {
            return res.status(400).json({
                success: false,
                message: "Some users are not part of the organization"
            });
        }

        // Add users to group
        const groupUsers = await Promise.all(
            userIds.map(async (userId) => {
                return GroupUser.findOrCreate({
                    where: { groupId, userId },
                    defaults: { role: 'MEMBER' }
                });
            })
        );

        return res.status(200).json({
            success: true,
            message: "Users added to group successfully",
            data: groupUsers.map(([groupUser]) => groupUser)
        });

    } catch (error) {
        logger.error('Error in addUsersToGroup:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get organization groups
exports.getOrgGroups = async (req, res) => {
    try {
        const { orgId } = req.params;

        const groups = await Group.findAll({
            where: { orgId }
        });

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

// Get group members
exports.getGroupMembers = async (req, res) => {
    try {
        const { groupId } = req.params;

        const groupUsers = await GroupUser.findAll({
            where: { groupId },
            include: [{
                model: User,
                attributes: ['userId', 'firstName', 'lastName', 'email']
            }]
        });

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
