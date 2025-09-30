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
            const groupCount = await db.OrganizationGroups.count({
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
            const { email, userRole = 'MEMBER', permissions = {}, message } = invitationData;

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new Error("Invalid email format");
            }

            // Check if organization exists
            const organization = await db.Organization.findByPk(orgId);
            if (!organization) {
                throw new Error("Organization not found");
            }

            // Check if inviter has permission (must be admin or manager)
            const inviterMembership = await db.OrganizationUser.findOne({
                where: {
                    orgId,
                    userId: inviterUserId,
                    userRole: { [Op.in]: ['ADMIN', 'MANAGER'] },
                    status: 'ACTIVE'
                }
            });

            if (!inviterMembership) {
                throw new Error("You don't have permission to invite users to this organization");
            }

            // Get inviter details
            const inviter = await db.User.findByPk(inviterUserId, {
                attributes: ['firstName', 'lastName', 'email']
            });

            if (!inviter) {
                throw new Error("Inviter not found");
            }

            // Check if user already exists in the system
            const existingUser = await db.User.findOne({ where: { email } });
            
            // Check if user is already in organization
            if (existingUser) {
                const existingMembership = await db.OrganizationUser.findOne({
                    where: { orgId, userId: existingUser.userId }
                });

                if (existingMembership) {
                    throw new Error("User is already part of this organization");
                }
            }

            // Check if there's already a pending invitation
            const existingInvite = await db.OrganizationUserInvites.findOne({
                where: {
                    orgId,
                    invitedEmail: email,
                    inviteStatus: 'PENDING'
                }
            });

            if (existingInvite) {
                throw new Error("A pending invitation already exists for this email");
            }

            // Generate unique invite token
            const inviteToken = crypto.randomBytes(32).toString('hex');
            
            // Set expiration time (7 days from now)
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            // Create invitation record
            const invitation = await db.OrganizationUserInvites.create({
                orgId,
                invitedEmail: email,
                invitedBy: inviterUserId,
                invitedRole: userRole,
                inviteStatus: 'PENDING',
                inviteToken,
                expiresAt,
                metadata: permissions || {}
            });

            // Prepare email data
            const acceptUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-invite?token=${inviteToken}`;
            
            const emailData = {
                organizationName: organization.orgName,
                organizationEmail: organization.orgEmail,
                invitedEmail: email,
                inviterEmail: inviter.email,
                inviteToken,
                userRole,
                expiresAt,
                acceptUrl,
                message
            };

            // Send invitation email
            try {
                const emailResult = await emailService.sendOrganizationInvite(emailData);
                logger.info(`Invitation email sent successfully for invitation ${invitation.inviteId}`);
                
                // Update invitation with email status
                await invitation.update({
                    metadata: {
                        ...invitation.metadata,
                        emailSent: true,
                        emailSentAt: new Date(),
                        emailMessageId: emailResult.messageId
                    }
                });
            } catch (emailError) {
                logger.error(`Failed to send invitation email for invitation ${invitation.inviteId}:`, emailError);
                
                // Update invitation with email failure status
                await invitation.update({
                    metadata: {
                        ...invitation.metadata,
                        emailSent: false,
                        emailError: emailError.message,
                        emailFailedAt: new Date()
                    }
                });
                
                // Don't throw error here - invitation is created, email can be retried
            }

            // Return invitation with additional details
            const invitationWithDetails = await db.OrganizationUserInvites.findByPk(invitation.inviteId, {
                include: [
                    {
                        model: db.Organization,
                        as: 'organization',
                        attributes: ['orgId', 'orgName', 'orgEmail']
                    },
                    {
                        model: db.User,
                        as: 'inviter',
                        attributes: ['userId', 'firstName', 'lastName', 'email']
                    }
                ]
            });

            return {
                invitation: invitationWithDetails,
                message: 'User invited successfully',
                emailSent: invitation.metadata?.emailSent || false,
                acceptUrl
            };
        } catch (error) {
            logger.error('Error in inviteUserToOrganization service:', error);
            throw error;
        }
    }

    async acceptOrganizationInvite(inviteToken, acceptingUserId = null) {
        try {
            // Find the invitation by token
            const invitation = await db.OrganizationUserInvites.findOne({
                where: {
                    inviteToken,
                    inviteStatus: 'PENDING'
                },
                include: [
                    {
                        model: db.Organization,
                        as: 'organization',
                        attributes: ['orgId', 'orgName', 'orgEmail', 'orgStatus']
                    },
                    {
                        model: db.User,
                        as: 'inviter',
                        attributes: ['userId', 'firstName', 'lastName', 'email']
                    }
                ]
            });

            if (!invitation) {
                throw new Error("Invalid or expired invitation token");
            }

            // Check if invitation has expired
            if (new Date() > new Date(invitation.expiresAt)) {
                await invitation.update({ inviteStatus: 'EXPIRED' });
                throw new Error("This invitation has expired");
            }

            // Check if organization is still active
            if (invitation.organization.orgStatus !== 'ACTIVE') {
                throw new Error("This organization is no longer active");
            }

            let userId = acceptingUserId;
            
            // If no userId provided, find or create user by email
            if (!userId) {
                let user = await db.User.findOne({ where: { email: invitation.invitedEmail } });
                
                if (!user) {
                    // For now, require user to exist - in a real app, you might create the user here
                    throw new Error("User account not found. Please create an account first before accepting the invitation.");
                }
                
                userId = user.userId;
            }

            // Check if user is already in organization
            const existingMembership = await db.OrganizationUser.findOne({
                where: { orgId: invitation.orgId, userId }
            });

            if (existingMembership) {
                // Mark invitation as accepted anyway
                await invitation.update({
                    inviteStatus: 'ACCEPTED',
                    acceptedAt: new Date(),
                    acceptedBy: userId
                });
                throw new Error("User is already part of this organization");
            }

            // Create organization membership
            const membership = await db.OrganizationUser.create({
                orgId: invitation.orgId,
                userId,
                userRole: invitation.invitedRole,
                invitedBy: invitation.invitedBy,
                status: 'ACTIVE',
                joinedAt: new Date(),
                permissions: invitation.metadata || {}
            });

            // Update invitation status
            await invitation.update({
                inviteStatus: 'ACCEPTED',
                acceptedAt: new Date(),
                acceptedBy: userId
            });

            // Return membership with organization details
            const membershipWithDetails = await db.OrganizationUser.findByPk(membership.orgUserId, {
                include: [
                    {
                        model: db.Organization,
                        as: 'organization',
                        attributes: ['orgId', 'orgName', 'orgEmail', 'orgDescription']
                    },
                    {
                        model: db.User,
                        as: 'user',
                        attributes: ['userId', 'firstName', 'lastName', 'email']
                    }
                ]
            });

            return {
                membership: membershipWithDetails,
                message: 'Invitation accepted successfully'
            };
        } catch (error) {
            logger.error('Error in acceptOrganizationInvite service:', error);
            throw error;
        }
    }

    async getInvitationByToken(inviteToken) {
        try {
            const invitation = await db.OrganizationUserInvites.findOne({
                where: {
                    inviteToken,
                    inviteStatus: 'PENDING'
                },
                include: [
                    {
                        model: db.Organization,
                        as: 'organization',
                        attributes: ['orgId', 'orgName', 'orgEmail', 'orgDescription', 'orgStatus']
                    },
                    {
                        model: db.User,
                        as: 'inviter',
                        attributes: ['userId', 'firstName', 'lastName', 'email']
                    }
                ]
            });

            if (!invitation) {
                throw new Error("Invalid or expired invitation token");
            }

            // Check if invitation has expired
            if (new Date() > new Date(invitation.expiresAt)) {
                await invitation.update({ inviteStatus: 'EXPIRED' });
                throw new Error("This invitation has expired");
            }

            return invitation;
        } catch (error) {
            logger.error('Error in getInvitationByToken service:', error);
            throw error;
        }
    }

    async rejectOrganizationInvite(inviteToken, rejectingUserId = null) {
        try {
            const invitation = await db.OrganizationUserInvites.findOne({
                where: {
                    inviteToken,
                    inviteStatus: 'PENDING'
                }
            });

            if (!invitation) {
                throw new Error("Invalid or expired invitation token");
            }

            await invitation.update({
                inviteStatus: 'DECLINED',
                declinedAt: new Date()
            });

            return { message: "Invitation declined successfully" };
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
