const db = require("../entity/index.js");
const logger = require('../config/winston.config.js');
const emailService = require('../utils/emailService.js');
const crypto = require('crypto');
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
                orgInitial: getInitials(orgName),
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

const getInitials = (name) => {
    // Trim the input to handle extra spaces
    const trimmedName = name.trim();

    // If there's only one word, return its first two letters in uppercase
    if (!trimmedName.includes(" ")) {
        return trimmedName.slice(0, 2).toUpperCase();
    }

    // For multiple words, split and get initials
    const words = trimmedName.split(" ");
    const initials = words?.slice(0, 2)?.map(word => word.charAt(0).toUpperCase()).join("");

    return initials;
}

module.exports = new OrganizationService();
