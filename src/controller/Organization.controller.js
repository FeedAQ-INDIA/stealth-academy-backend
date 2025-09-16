const db = require("../entity/index.js");
 
 const logger = require('../config/winston.config.js');
const { Op } = require('sequelize');

// ========== ORGANIZATION MANAGEMENT ==========

// Register a new organization
// Business Rule: A user can create only 1 organization but can be part of multiple organizations
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
            return res.status(400).json({
                success: false,
                message: "db.Organization name and email are required",
                details: {
                    orgName: !orgName ? "db.Organization name is required" : null,
                    orgEmail: !orgEmail ? "db.Organization email is required" : null
                }
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(orgEmail)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format"
            });
        }

        // Validate admin email if provided
        if (adminEmail && !emailRegex.test(adminEmail)) {
            return res.status(400).json({
                success: false,
                message: "Invalid admin email format"
            });
        }
 

        // Check if user has already created an organization
        if (req.user && req.user.userId) {
            const userCreatedOrg = await db.OrganizationUser.findOne({
                where: {
                    userId: req.user.userId,
                    userRole: 'ADMIN',
                    invitedBy: null // This indicates the user created the org
                }
            });

            if (userCreatedOrg) {
                return res.status(409).json({
                    success: false,
                    message: "You can only create one organization. However, you can be part of multiple organizations as a member."
                });
            }
        }

        // Create new organization
        const organization = await db.Organization.create({
            orgName,
            orgEmail,
            orgContactNo,
            orgDomain,
            orgAddress,
            orgCity,
            orgState,
            orgCountry: orgCountry || "India",
            orgPincode,
            orgType,
            orgIndustry,
            orgSize,
            orgWebsite,
            orgDescription,
            adminName,
            adminEmail,
            metadata: metadata || {}
        });

        // Auto-add the creator as admin if userId is available from auth
        if (req.user && req.user.userId) {
            await db.OrganizationUser.create({
                orgId: organization.orgId,
                userId: req.user.userId,
                userRole: 'ADMIN',
                status: 'ACTIVE',
                joinedAt: new Date(),
                invitedBy: null // Null indicates this user created the organization
            });
        }

        return res.status(201).json({
            success: true,
            message: "db.Organization registered successfully",
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

// Get all organizations with pagination and filters
exports.getAllOrganizations = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            orgType,
            orgIndustry,
            orgStatus,
            sortBy = 'orgCreatedAt',
            sortOrder = 'DESC'
        } = req.query;

        const offset = (page - 1) * limit;
        
        let whereClause = {};
        
        // Add search filter
        if (search) {
            whereClause[Op.or] = [
                { orgName: { [Op.iLike]: `%${search}%` } },
                { orgDescription: { [Op.iLike]: `%${search}%` } },
                { orgIndustry: { [Op.iLike]: `%${search}%` } }
            ];
        }
        
        // Add type filter
        if (orgType) {
            whereClause.orgType = orgType;
        }
        
        // Add industry filter
        if (orgIndustry) {
            whereClause.orgIndustry = { [Op.iLike]: `%${orgIndustry}%` };
        }
        
        // Add status filter
        if (orgStatus) {
            whereClause.orgStatus = orgStatus;
        }

        const { count, rows: organizations } = await db.Organization.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [[sortBy, sortOrder.toUpperCase()]],
            attributes: { exclude: ['metadata'] } // Exclude large fields for listing
        });

        return res.status(200).json({
            success: true,
            data: {
                organizations,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(count / limit)
                }
            }
        });

    } catch (error) {
        logger.error('Error in getAllOrganizations:', error);
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
        const organization = await db.Organization.findByPk(orgId);
        
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "db.Organization not found"
            });
        }

        // Check if user has permission to update (admin or manager)
        if (req.user) {
            const userOrg = await db.OrganizationUser.findOne({
                where: {
                    orgId,
                    userId: req.user.userId,
                    userRole: { [Op.in]: ['ADMIN', 'MANAGER'] },
                    status: 'ACTIVE'
                }
            });

            if (!userOrg) {
                return res.status(403).json({
                    success: false,
                    message: "Insufficient permissions to update organization"
                });
            }
        }

        // Update organization
        await organization.update(updateData);

        return res.status(200).json({
            success: true,
            message: "db.Organization updated successfully",
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

        const organization = await db.Organization.findByPk(orgId, {
            include: [
                {
                    model: db.OrganizationUser,
                    as: 'organizationUsers',
                    include: [
                        {
                            model: db.User,
                            as: 'user',
                            attributes: ['userId', 'firstName', 'lastName', 'email']
                        }
                    ]
                }
            ]
        });
        
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "db.Organization not found"
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

// Delete organization (soft delete)
exports.deleteOrganization = async (req, res) => {
    try {
        const { orgId } = req.params;

        const organization = await db.Organization.findByPk(orgId);
        
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "db.Organization not found"
            });
        }

        // Check if user is admin
        if (req.user) {
            const userOrg = await db.OrganizationUser.findOne({
                where: {
                    orgId,
                    userId: req.user.userId,
                    userRole: 'ADMIN',
                    status: 'ACTIVE'
                }
            });

            if (!userOrg) {
                return res.status(403).json({
                    success: false,
                    message: "Only organization admins can delete the organization"
                });
            }
        }

        await organization.destroy(); // Soft delete

        return res.status(200).json({
            success: true,
            message: "db.Organization deleted successfully"
        });

    } catch (error) {
        logger.error('Error in deleteOrganization:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Update organization status
exports.updateOrganizationStatus = async (req, res) => {
    try {
        const { orgId } = req.params;
        const { status } = req.body;

        if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Must be ACTIVE, INACTIVE, or SUSPENDED"
            });
        }

        const organization = await db.Organization.findByPk(orgId);
        
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "db.Organization not found"
            });
        }

        await organization.update({ orgStatus: status });

        return res.status(200).json({
            success: true,
            message: "db.Organization status updated successfully",
            data: organization
        });

    } catch (error) {
        logger.error('Error in updateOrganizationStatus:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get organization statistics
exports.getOrganizationStats = async (req, res) => {
    try {
        const { orgId } = req.params;

        const organization = await db.Organization.findByPk(orgId);
        
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "db.Organization not found"
            });
        }

        // Get user counts by role
        const userStats = await db.OrganizationUser.findAll({
            where: { orgId },
            attributes: [
                'userRole',
                'status',
                [db.sequelize.fn('COUNT', db.sequelize.col('orgUserId')), 'count']
            ],
            group: ['userRole', 'status']
        });

        // Get group count
        const groupCount = await db.Group.count({
            where: { orgId }
        });

        // Get total user count
        const totalUsers = await db.OrganizationUser.count({
            where: { orgId }
        });

        const stats = {
            totalUsers,
            groupCount,
            usersByRole: userStats.reduce((acc, stat) => {
                const key = `${stat.userRole}_${stat.status}`;
                acc[key] = parseInt(stat.dataValues.count);
                return acc;
            }, {}),
            organizationInfo: {
                name: organization.orgName,
                status: organization.orgStatus,
                createdAt: organization.orgCreatedAt
            }
        };

        return res.status(200).json({
            success: true,
            data: stats
        });

    } catch (error) {
        logger.error('Error in getOrganizationStats:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// ========== ORGANIZATION USER MANAGEMENT ==========

// Invite user to organization
exports.inviteUserToOrganization = async (req, res) => {
    try {
        const { orgId } = req.params;
        const { email, userRole = 'MEMBER', permissions = {} } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        // Check if organization exists
        const organization = await db.Organization.findByPk(orgId);
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "db.Organization not found"
            });
        }

        // Find user by email
        const user = await db.User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "db.User not found"
            });
        }

        // Check if user is already in organization
        const existingMembership = await db.OrganizationUser.findOne({
            where: { orgId, userId: user.userId }
        });

        if (existingMembership) {
            return res.status(409).json({
                success: false,
                message: "db.User is already a member of this organization"
            });
        }

        // Create invitation
        const invitation = await db.OrganizationUser.create({
            orgId,
            userId: user.userId,
            userRole,
            invitedBy: req.user?.userId,
            status: 'PENDING',
            permissions
        });

        return res.status(201).json({
            success: true,
            message: "db.User invited successfully",
            data: invitation
        });

    } catch (error) {
        logger.error('Error in inviteUserToOrganization:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Accept organization invitation
exports.acceptOrganizationInvite = async (req, res) => {
    try {
        const { orgId } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "db.User not authenticated"
            });
        }

        const invitation = await db.OrganizationUser.findOne({
            where: {
                orgId,
                userId,
                status: 'PENDING'
            }
        });

        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: "No pending invitation found"
            });
        }

        await invitation.update({
            status: 'ACTIVE',
            joinedAt: new Date()
        });

        return res.status(200).json({
            success: true,
            message: "Invitation accepted successfully",
            data: invitation
        });

    } catch (error) {
        logger.error('Error in acceptOrganizationInvite:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Reject organization invitation
exports.rejectOrganizationInvite = async (req, res) => {
    try {
        const { orgId } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "db.User not authenticated"
            });
        }

        const invitation = await db.OrganizationUser.findOne({
            where: {
                orgId,
                userId,
                status: 'PENDING'
            }
        });

        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: "No pending invitation found"
            });
        }

        await invitation.destroy();

        return res.status(200).json({
            success: true,
            message: "Invitation rejected successfully"
        });

    } catch (error) {
        logger.error('Error in rejectOrganizationInvite:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get all users in organization
exports.getOrganizationUsers = async (req, res) => {
    try {
        const { orgId } = req.params;
        const { page = 1, limit = 10, role, status, search } = req.query;

        const offset = (page - 1) * limit;
        let whereClause = { orgId };

        if (role) {
            whereClause.userRole = role;
        }

        if (status) {
            whereClause.status = status;
        }

        let userWhereClause = {};
        if (search) {
            userWhereClause[Op.or] = [
                { firstName: { [Op.iLike]: `%${search}%` } },
                { lastName: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const { count, rows: organizationUsers } = await db.OrganizationUser.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: db.User,
                    as: 'user',
                    where: userWhereClause,
                    attributes: ['userId', 'firstName', 'lastName', 'email', 'profilePicture']
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['orgUserCreatedAt', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            data: {
                users: organizationUsers,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(count / limit)
                }
            }
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

// Get specific user details in organization
exports.getOrganizationUser = async (req, res) => {
    try {
        const { orgId, userId } = req.params;

        const organizationUser = await db.OrganizationUser.findOne({
            where: { orgId, userId },
            include: [
                {
                    model: db.User,
                    as: 'user',
                    attributes: ['userId', 'firstName', 'lastName', 'email', 'profilePicture']
                }
            ]
        });

        if (!organizationUser) {
            return res.status(404).json({
                success: false,
                message: "db.User not found in organization"
            });
        }

        return res.status(200).json({
            success: true,
            data: organizationUser
        });

    } catch (error) {
        logger.error('Error in getOrganizationUser:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Update user role in organization
exports.updateUserRole = async (req, res) => {
    try {
        const { orgId, userId } = req.params;
        const { userRole, permissions } = req.body;

        if (!['ADMIN', 'MANAGER', 'INSTRUCTOR', 'MEMBER'].includes(userRole)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role"
            });
        }

        const organizationUser = await db.OrganizationUser.findOne({
            where: { orgId, userId }
        });

        if (!organizationUser) {
            return res.status(404).json({
                success: false,
                message: "db.User not found in organization"
            });
        }

        await organizationUser.update({
            userRole,
            permissions: permissions || organizationUser.permissions
        });

        return res.status(200).json({
            success: true,
            message: "db.User role updated successfully",
            data: organizationUser
        });

    } catch (error) {
        logger.error('Error in updateUserRole:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Update user status in organization
exports.updateUserStatus = async (req, res) => {
    try {
        const { orgId, userId } = req.params;
        const { status } = req.body;

        if (!['PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status"
            });
        }

        const organizationUser = await db.OrganizationUser.findOne({
            where: { orgId, userId }
        });

        if (!organizationUser) {
            return res.status(404).json({
                success: false,
                message: "db.User not found in organization"
            });
        }

        await organizationUser.update({ status });

        return res.status(200).json({
            success: true,
            message: "db.User status updated successfully",
            data: organizationUser
        });

    } catch (error) {
        logger.error('Error in updateUserStatus:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Remove user from organization
exports.removeUserFromOrganization = async (req, res) => {
    try {
        const { orgId, userId } = req.params;

        const organizationUser = await db.OrganizationUser.findOne({
            where: { orgId, userId }
        });

        if (!organizationUser) {
            return res.status(404).json({
                success: false,
                message: "db.User not found in organization"
            });
        }

        await organizationUser.destroy();

        return res.status(200).json({
            success: true,
            message: "db.User removed from organization successfully"
        });

    } catch (error) {
        logger.error('Error in removeUserFromOrganization:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get user's organizations
exports.getUserOrganizations = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "db.User not authenticated"
            });
        }

        const userOrganizations = await db.OrganizationUser.findAll({
            where: { userId },
            include: [
                {
                    model: db.Organization,
                    as: 'organization',
                    attributes: ['orgId', 'orgName', 'orgDescription', 'orgType', 'orgStatus']
                }
            ]
        });

        return res.status(200).json({
            success: true,
            data: userOrganizations
        });

    } catch (error) {
        logger.error('Error in getUserOrganizations:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// ========== ORGANIZATION GROUPS MANAGEMENT ==========

// Create group in organization
exports.createGroup = async (req, res) => {
    try {
        const { orgId } = req.params;
        const { groupName, description, metadata } = req.body;

        if (!groupName) {
            return res.status(400).json({
                success: false,
                message: "db.Group name is required"
            });
        }

        // Check if organization exists
        const organization = await db.Organization.findByPk(orgId);
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "db.Organization not found"
            });
        }

        // Check if group name already exists in organization
        const existingGroup = await db.Group.findOne({
            where: { orgId, groupName }
        });

        if (existingGroup) {
            return res.status(409).json({
                success: false,
                message: "db.Group with this name already exists in the organization"
            });
        }

        const group = await db.Group.create({
            orgId,
            groupName,
            description,
            metadata: metadata || {}
        });

        return res.status(201).json({
            success: true,
            message: "db.Group created successfully",
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

// Get all groups in organization
exports.getOrganizationGroups = async (req, res) => {
    try {
        const { orgId } = req.params;
        const { page = 1, limit = 10, status, search } = req.query;

        const offset = (page - 1) * limit;
        let whereClause = { orgId };

        if (status) {
            whereClause.status = status;
        }

        if (search) {
            whereClause[Op.or] = [
                { groupName: { [Op.iLike]: `%${search}%` } },
                { description: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const { count, rows: groups } = await db.Group.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            data: {
                groups,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(count / limit)
                }
            }
        });

    } catch (error) {
        logger.error('Error in getOrganizationGroups:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get specific group details
exports.getGroup = async (req, res) => {
    try {
        const { orgId, groupId } = req.params;

        const group = await db.Group.findOne({
            where: { groupId, orgId },
            include: [
                {
                    model: db.GroupUser,
                    as: 'groupUsers',
                    include: [
                        {
                            model: db.User,
                            as: 'user',
                            attributes: ['userId', 'firstName', 'lastName', 'email']
                        }
                    ]
                }
            ]
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "db.Group not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: group
        });

    } catch (error) {
        logger.error('Error in getGroup:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Update group details
exports.updateGroup = async (req, res) => {
    try {
        const { orgId, groupId } = req.params;
        const updateData = req.body;

        const group = await db.Group.findOne({
            where: { groupId, orgId }
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "db.Group not found"
            });
        }

        await group.update(updateData);

        return res.status(200).json({
            success: true,
            message: "db.Group updated successfully",
            data: group
        });

    } catch (error) {
        logger.error('Error in updateGroup:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Delete group
exports.deleteGroup = async (req, res) => {
    try {
        const { orgId, groupId } = req.params;

        const group = await db.Group.findOne({
            where: { groupId, orgId }
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "db.Group not found"
            });
        }

        await group.destroy();

        return res.status(200).json({
            success: true,
            message: "db.Group deleted successfully"
        });

    } catch (error) {
        logger.error('Error in deleteGroup:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Add users to group
exports.addUsersToGroup = async (req, res) => {
    try {
        const { orgId, groupId } = req.params;
        const { userIds } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "db.User IDs array is required"
            });
        }

        // Check if group exists
        const group = await db.Group.findOne({
            where: { groupId, orgId }
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "db.Group not found"
            });
        }

        // Verify all users are members of the organization
        const orgUsers = await db.OrganizationUser.findAll({
            where: {
                orgId,
                userId: { [Op.in]: userIds },
                status: 'ACTIVE'
            }
        });

        if (orgUsers.length !== userIds.length) {
            return res.status(400).json({
                success: false,
                message: "Some users are not active members of the organization"
            });
        }

        // Add users to group (avoid duplicates)
        const groupUserData = userIds.map(userId => ({
            groupId,
            userId,
            addedBy: req.user?.userId
        }));

        await db.GroupUser.bulkCreate(groupUserData, {
            ignoreDuplicates: true
        });

        return res.status(200).json({
            success: true,
            message: "Users added to group successfully"
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

// Remove user from group
exports.removeUserFromGroup = async (req, res) => {
    try {
        const { orgId, groupId, userId } = req.params;

        // Verify group belongs to organization
        const group = await db.Group.findOne({
            where: { groupId, orgId }
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "db.Group not found"
            });
        }

        const groupUser = await db.GroupUser.findOne({
            where: { groupId, userId }
        });

        if (!groupUser) {
            return res.status(404).json({
                success: false,
                message: "db.User not found in group"
            });
        }

        await groupUser.destroy();

        return res.status(200).json({
            success: true,
            message: "db.User removed from group successfully"
        });

    } catch (error) {
        logger.error('Error in removeUserFromGroup:', error);
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
        const { orgId, groupId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const offset = (page - 1) * limit;

        // Verify group belongs to organization
        const group = await db.Group.findOne({
            where: { groupId, orgId }
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "db.Group not found"
            });
        }

        const { count, rows: groupUsers } = await db.GroupUser.findAndCountAll({
            where: { groupId },
            include: [
                {
                    model: db.User,
                    as: 'user',
                    attributes: ['userId', 'firstName', 'lastName', 'email', 'profilePicture']
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            data: {
                members: groupUsers,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(count / limit)
                }
            }
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

// ========== BULK OPERATIONS ==========

// Bulk invite users to organization
exports.bulkInviteUsers = async (req, res) => {
    try {
        const { orgId } = req.params;
        const { users, defaultRole = 'MEMBER' } = req.body;

        if (!Array.isArray(users) || users.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Users array is required"
            });
        }

        const results = {
            successful: [],
            failed: []
        };

        for (const userData of users) {
            try {
                const { email, userRole = defaultRole } = userData;
                
                // Find user by email
                const user = await db.User.findOne({ where: { email } });
                if (!user) {
                    results.failed.push({ email, reason: 'db.User not found' });
                    continue;
                }

                // Check if already a member
                const existingMembership = await db.OrganizationUser.findOne({
                    where: { orgId, userId: user.userId }
                });

                if (existingMembership) {
                    results.failed.push({ email, reason: 'Already a member' });
                    continue;
                }

                // Create invitation
                await db.OrganizationUser.create({
                    orgId,
                    userId: user.userId,
                    userRole,
                    invitedBy: req.user?.userId,
                    status: 'PENDING'
                });

                results.successful.push({ email, userId: user.userId });

            } catch (error) {
                results.failed.push({ email: userData.email, reason: error.message });
            }
        }

        return res.status(200).json({
            success: true,
            message: "Bulk invitation completed",
            data: results
        });

    } catch (error) {
        logger.error('Error in bulkInviteUsers:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Bulk update user roles
exports.bulkUpdateUserRoles = async (req, res) => {
    try {
        const { orgId } = req.params;
        const { updates } = req.body;

        if (!Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Updates array is required"
            });
        }

        const results = {
            successful: [],
            failed: []
        };

        for (const update of updates) {
            try {
                const { userId, userRole } = update;

                const organizationUser = await db.OrganizationUser.findOne({
                    where: { orgId, userId }
                });

                if (!organizationUser) {
                    results.failed.push({ userId, reason: 'db.User not found in organization' });
                    continue;
                }

                await organizationUser.update({ userRole });
                results.successful.push({ userId, newRole: userRole });

            } catch (error) {
                results.failed.push({ userId: update.userId, reason: error.message });
            }
        }

        return res.status(200).json({
            success: true,
            message: "Bulk role update completed",
            data: results
        });

    } catch (error) {
        logger.error('Error in bulkUpdateUserRoles:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Export organization data
exports.exportOrganizationData = async (req, res) => {
    try {
        const { orgId } = req.params;
        const { format = 'json' } = req.query;

        const organization = await db.Organization.findByPk(orgId, {
            include: [
                {
                    model: db.OrganizationUser,
                    as: 'organizationUsers',
                    include: [
                        {
                            model: db.User,
                            as: 'user',
                            attributes: ['userId', 'firstName', 'lastName', 'email']
                        }
                    ]
                },
                {
                    model: db.Group,
                    as: 'groups',
                    include: [
                        {
                            model: db.GroupUser,
                            as: 'groupUsers',
                            include: [
                                {
                                    model: db.User,
                                    as: 'user',
                                    attributes: ['userId', 'firstName', 'lastName', 'email']
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "db.Organization not found"
            });
        }

        const exportData = {
            organization: {
                basic_info: {
                    orgId: organization.orgId,
                    orgName: organization.orgName,
                    orgEmail: organization.orgEmail,
                    orgType: organization.orgType,
                    orgIndustry: organization.orgIndustry,
                    orgStatus: organization.orgStatus
                },
                users: organization.organizationUsers,
                groups: organization.groups,
                exportedAt: new Date().toISOString()
            }
        };

        if (format === 'csv') {
            // For CSV, we'll return a simplified structure
            return res.status(200).json({
                success: true,
                message: "CSV export not implemented yet. Use JSON format.",
                data: exportData
            });
        }

        return res.status(200).json({
            success: true,
            data: exportData
        });

    } catch (error) {
        logger.error('Error in exportOrganizationData:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// ========== SEARCH AND FILTER ==========

// Search organizations
exports.searchOrganizations = async (req, res) => {
    try {
        const { q, type, industry, status, limit = 10 } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                message: "Search query is required"
            });
        }

        let whereClause = {
            [Op.or]: [
                { orgName: { [Op.iLike]: `%${q}%` } },
                { orgDescription: { [Op.iLike]: `%${q}%` } },
                { orgIndustry: { [Op.iLike]: `%${q}%` } }
            ]
        };

        if (type) {
            whereClause.orgType = type;
        }

        if (industry) {
            whereClause.orgIndustry = { [Op.iLike]: `%${industry}%` };
        }

        if (status) {
            whereClause.orgStatus = status;
        }

        const organizations = await db.Organization.findAll({
            where: whereClause,
            limit: parseInt(limit),
            attributes: ['orgId', 'orgName', 'orgDescription', 'orgType', 'orgIndustry', 'orgStatus'],
            order: [['orgName', 'ASC']]
        });

        return res.status(200).json({
            success: true,
            data: organizations
        });

    } catch (error) {
        logger.error('Error in searchOrganizations:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Search users within organization
exports.searchOrganizationUsers = async (req, res) => {
    try {
        const { orgId } = req.params;
        const { q, role, status, limit = 10 } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                message: "Search query is required"
            });
        }

        let orgUserWhereClause = { orgId };
        let userWhereClause = {
            [Op.or]: [
                { firstName: { [Op.iLike]: `%${q}%` } },
                { lastName: { [Op.iLike]: `%${q}%` } },
                { email: { [Op.iLike]: `%${q}%` } }
            ]
        };

        if (role) {
            orgUserWhereClause.userRole = role;
        }

        if (status) {
            orgUserWhereClause.status = status;
        }

        const users = await db.OrganizationUser.findAll({
            where: orgUserWhereClause,
            include: [
                {
                    model: db.User,
                    as: 'user',
                    where: userWhereClause,
                    attributes: ['userId', 'firstName', 'lastName', 'email', 'profilePicture']
                }
            ],
            limit: parseInt(limit),
            order: [['orgUserCreatedAt', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            data: users
        });

    } catch (error) {
        logger.error('Error in searchOrganizationUsers:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Search groups within organization
exports.searchOrganizationGroups = async (req, res) => {
    try {
        const { orgId } = req.params;
        const { q, status, limit = 10 } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                message: "Search query is required"
            });
        }

        let whereClause = {
            orgId,
            [Op.or]: [
                { groupName: { [Op.iLike]: `%${q}%` } },
                { description: { [Op.iLike]: `%${q}%` } }
            ]
        };

        if (status) {
            whereClause.status = status;
        }

        const groups = await db.Group.findAll({
            where: whereClause,
            limit: parseInt(limit),
            attributes: ['groupId', 'groupName', 'description', 'status'],
            order: [['groupName', 'ASC']]
        });

        return res.status(200).json({
            success: true,
            data: groups
        });

    } catch (error) {
        logger.error('Error in searchOrganizationGroups:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// ========== ORGANIZATION CREATION VALIDATION ==========

// Check if user can create an organization
exports.canCreateOrganization = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
        }

        // Check if user has already created an organization
        const userCreatedOrg = await db.OrganizationUser.findOne({
            where: {
                userId: userId,
                userRole: 'ADMIN',
                invitedBy: null // This indicates the user created the org
            },
            include: [
                {
                    model: db.Organization,
                    as: 'organization',
                    attributes: ['orgId', 'orgName', 'orgEmail', 'orgStatus']
                }
            ]
        });

        if (userCreatedOrg) {
            return res.status(200).json({
                success: true,
                canCreate: false,
                message: "You have already created an organization. You can only create one organization.",
                existingOrganization: userCreatedOrg.organization
            });
        }

        return res.status(200).json({
            success: true,
            canCreate: true,
            message: "You can create a new organization."
        });

    } catch (error) {
        logger.error('Error in canCreateOrganization:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};
