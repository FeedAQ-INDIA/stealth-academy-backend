const db = require("../entity/index.js");
const logger = require('../config/winston.config.js');
const { Op } = require('sequelize');

class OrganizationService {
    
    // ========== ORGANIZATION MANAGEMENT ==========
    
    async registerOrganization(userId, organizationData) {
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
            } = organizationData;

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(orgEmail)) {
                throw new Error("Invalid email format");
            }

            // Validate admin email if provided
            if (adminEmail && !emailRegex.test(adminEmail)) {
                throw new Error("Invalid admin email format");
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

            // Auto-add the creator as admin if userId is available
            if (userId) {
                await db.OrganizationUser.create({
                    orgId: organization.orgId,
                    userId: userId,
                    userRole: 'ADMIN',
                    status: 'ACTIVE',
                    joinedAt: new Date()
                });
            }

            return organization;
        } catch (error) {
            logger.error('Error in registerOrganization service:', error);
            throw error;
        }
    }

    async getAllOrganizations(filters) {
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
            } = filters;

            const offset = (page - 1) * limit;
            let whereClause = {};
            
            // Add search filter
            if (search) {
                whereClause[Op.or] = [
                    { orgName: { [Op.like]: `%${search}%` } },
                    { orgEmail: { [Op.like]: `%${search}%` } },
                    { orgDomain: { [Op.like]: `%${search}%` } }
                ];
            }
            
            // Add type filter
            if (orgType) {
                whereClause.orgType = orgType;
            }
            
            // Add industry filter
            if (orgIndustry) {
                whereClause.orgIndustry = orgIndustry;
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
                attributes: { exclude: ['metadata'] }
            });

            return {
                organizations,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(count / limit)
                }
            };
        } catch (error) {
            logger.error('Error in getAllOrganizations service:', error);
            throw error;
        }
    }

    async getOrganization(orgId) {
        try {
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
                throw new Error("Organization not found");
            }

            return organization;
        } catch (error) {
            logger.error('Error in getOrganization service:', error);
            throw error;
        }
    }

    async updateOrganization(orgId, userId, updateData) {
        try {
            // Check if organization exists
            const organization = await db.Organization.findByPk(orgId);
            
            if (!organization) {
                throw new Error("Organization not found");
            }

            // Check if user has permission to update (admin or manager)
            if (userId) {
                const userRole = await db.OrganizationUser.findOne({
                    where: {
                        orgId,
                        userId,
                        userRole: { [Op.in]: ['ADMIN', 'MANAGER'] },
                        status: 'ACTIVE'
                    }
                });

                if (!userRole) {
                    throw new Error("You don't have permission to update this organization");
                }
            }

            // Update organization
            await organization.update(updateData);
            return organization;
        } catch (error) {
            logger.error('Error in updateOrganization service:', error);
            throw error;
        }
    }

    async deleteOrganization(orgId, userId) {
        try {
            const organization = await db.Organization.findByPk(orgId);
            
            if (!organization) {
                throw new Error("Organization not found");
            }

            // Check if user is admin
            if (userId) {
                const userRole = await db.OrganizationUser.findOne({
                    where: {
                        orgId,
                        userId,
                        userRole: 'ADMIN',
                        status: 'ACTIVE'
                    }
                });

                if (!userRole) {
                    throw new Error("Only organization admin can delete the organization");
                }
            }

            await organization.destroy(); // Soft delete
            return { message: "Organization deleted successfully" };
        } catch (error) {
            logger.error('Error in deleteOrganization service:', error);
            throw error;
        }
    }

    async updateOrganizationStatus(orgId, status) {
        try {
            if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
                throw new Error("Invalid status. Allowed values: ACTIVE, INACTIVE, SUSPENDED");
            }

            const organization = await db.Organization.findByPk(orgId);
            
            if (!organization) {
                throw new Error("Organization not found");
            }

            await organization.update({ orgStatus: status });
            return organization;
        } catch (error) {
            logger.error('Error in updateOrganizationStatus service:', error);
            throw error;
        }
    }

    async getOrganizationStats(orgId) {
        try {
            const organization = await db.Organization.findByPk(orgId);
            
            if (!organization) {
                throw new Error("Organization not found");
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

            return stats;
        } catch (error) {
            logger.error('Error in getOrganizationStats service:', error);
            throw error;
        }
    }

    // ========== ORGANIZATION USER MANAGEMENT ==========

    async inviteUserToOrganization(orgId, inviterUserId, invitationData) {
        try {
            const { email, userRole = 'MEMBER', permissions = {} } = invitationData;

            // Check if organization exists
            const organization = await db.Organization.findByPk(orgId);
            if (!organization) {
                throw new Error("Organization not found");
            }

            // Find user by email
            const user = await db.User.findOne({ where: { email } });
            if (!user) {
                throw new Error("User not found with this email");
            }

            // Check if user is already in organization
            const existingMembership = await db.OrganizationUser.findOne({
                where: { orgId, userId: user.userId }
            });

            if (existingMembership) {
                throw new Error("User is already part of this organization");
            }

            // Create invitation
            const invitation = await db.OrganizationUser.create({
                orgId,
                userId: user.userId,
                userRole,
                invitedBy: inviterUserId,
                status: 'PENDING',
                permissions
            });

            return invitation;
        } catch (error) {
            logger.error('Error in inviteUserToOrganization service:', error);
            throw error;
        }
    }

    async acceptOrganizationInvite(orgId, userId) {
        try {
            const invitation = await db.OrganizationUser.findOne({
                where: {
                    orgId,
                    userId,
                    status: 'PENDING'
                }
            });

            if (!invitation) {
                throw new Error("No pending invitation found for this organization");
            }

            await invitation.update({
                status: 'ACTIVE',
                joinedAt: new Date()
            });

            return invitation;
        } catch (error) {
            logger.error('Error in acceptOrganizationInvite service:', error);
            throw error;
        }
    }

    async rejectOrganizationInvite(orgId, userId) {
        try {
            const invitation = await db.OrganizationUser.findOne({
                where: {
                    orgId,
                    userId,
                    status: 'PENDING'
                }
            });

            if (!invitation) {
                throw new Error("No pending invitation found for this organization");
            }

            await invitation.destroy();
            return { message: "Invitation rejected successfully" };
        } catch (error) {
            logger.error('Error in rejectOrganizationInvite service:', error);
            throw error;
        }
    }

    async getOrganizationUsers(orgId, filters = {}) {
        try {
            const { page = 1, limit = 10, status, userRole } = filters;
            const offset = (page - 1) * limit;
            
            let whereClause = { orgId };
            
            if (status) {
                whereClause.status = status;
            }
            
            if (userRole) {
                whereClause.userRole = userRole;
            }

            const { count, rows: users } = await db.OrganizationUser.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: db.User,
                        as: 'user',
                        attributes: ['userId', 'firstName', 'lastName', 'email', 'profilePicture']
                    }
                ],
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [['joinedAt', 'DESC']]
            });

            return {
                users,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(count / limit)
                }
            };
        } catch (error) {
            logger.error('Error in getOrganizationUsers service:', error);
            throw error;
        }
    }

    async getUserOrganizations(userId) {
        try {
            const userOrganizations = await db.Organization.findAll({
                include: [
                    {
                        model: db.OrganizationUser,
                        as: 'members',
                        where: { userId },
                    }
                ]
            });

            return userOrganizations;
        } catch (error) {
            logger.error('Error in getUserOrganizations service:', error);
            throw error;
        }
    }

  
}

module.exports = new OrganizationService();
