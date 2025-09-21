const db = require("../entity/index.js");
const Organization = db.Organization;
const OrganizationGroups = db.OrganizationGroups;
const OrganizationUserGroups = db.OrganizationUserGroups;
const OrganizationUser = db.OrganizationUser;
const User = db.User;
const logger = require('../config/winston.config.js');

class OrgGroupService {
    
    // Organization User Management
    async addUserToOrganization(orgId, userId, role = 'MEMBER', invitedBy = null) {
        try {
            // Check if organization exists
            const organization = await Organization.findByPk(orgId);
            if (!organization) {
                throw new Error("Organization not found");
            }

            // Check if user exists
            const user = await User.findByPk(userId);
            if (!user) {
                throw new Error("User not found");
            }

            // Check if user is already in organization
            const existingOrgUser = await OrganizationUser.findOne({
                where: { orgId, userId }
            });

            if (existingOrgUser) {
                throw new Error("User is already part of this organization");
            }

            // Add user to organization
            const orgUser = await OrganizationUser.create({
                orgId,
                userId,
                role,
                invitedBy
            });

            return orgUser;
        } catch (error) {
            logger.error('Error in addUserToOrganization service:', error);
            throw error;
        }
    }

    async removeUserFromOrganization(orgId, userId) {
        try {
            const orgUser = await OrganizationUser.findOne({
                where: { orgId, userId }
            });

            if (!orgUser) {
                throw new Error("User is not part of this organization");
            }

            // Remove user from all groups in this organization first
            await OrganizationUserGroups.destroy({
                where: { orgId, userId }
            });

            // Remove user from organization
            await orgUser.destroy();

            return { message: "User removed from organization successfully" };
        } catch (error) {
            logger.error('Error in removeUserFromOrganization service:', error);
            throw error;
        }
    }

    async updateUserRoleInOrganization(orgId, userId, role) {
        try {
            const orgUser = await OrganizationUser.findOne({
                where: { orgId, userId }
            });

            if (!orgUser) {
                throw new Error("User is not part of this organization");
            }

            orgUser.role = role;
            await orgUser.save();

            return orgUser;
        } catch (error) {
            logger.error('Error in updateUserRoleInOrganization service:', error);
            throw error;
        }
    }

    async getOrganizationUsers(orgId, includeGroups = false) {
        try {
            const include = [
                {
                    model: User,
                    as: 'user',
                 }
            ];

            if (includeGroups) {
                include.push({
                    model: OrganizationUserGroups,
                    as: 'groupMemberships',
                    include: [{
                        model: OrganizationGroups,
                        as: 'group',
                        attributes: ['groupId', 'groupName']
                    }]
                });
            }

            const orgUsers = await OrganizationUser.findAll({
                where: { orgId },
                include
            });

            return orgUsers;
        } catch (error) {
            logger.error('Error in getOrganizationUsers service:', error);
            throw error;
        }
    }

    // Group Management
    async createGroup(orgId, groupName, description = null, metadata = {}) {
        try {
            // Check if organization exists
            const organization = await Organization.findByPk(orgId);
            if (!organization) {
                throw new Error("Organization not found");
            }

            // Check if group name already exists in this organization
            const existingGroup = await OrganizationGroups.findOne({
                where: { orgId, groupName }
            });

            if (existingGroup) {
                throw new Error("Group with this name already exists in the organization");
            }

            // Create new group
            const group = await OrganizationGroups.create({
                orgId,
                groupName,
                description,
                metadata
            });

            return group;
        } catch (error) {
            logger.error('Error in createGroup service:', error);
            throw error;
        }
    }

    async updateGroup(groupId, updates) {
        try {
            const group = await OrganizationGroups.findByPk(groupId);
            if (!group) {
                throw new Error("Group not found");
            }

            // If groupName is being updated, check for uniqueness
            if (updates.groupName && updates.groupName !== group.groupName) {
                const existingGroup = await OrganizationGroups.findOne({
                    where: { 
                        orgId: group.orgId, 
                        groupName: updates.groupName,
                        groupId: { [db.Sequelize.Op.ne]: groupId }
                    }
                });

                if (existingGroup) {
                    throw new Error("Group with this name already exists in the organization");
                }
            }

            await group.update(updates);
            return group;
        } catch (error) {
            logger.error('Error in updateGroup service:', error);
            throw error;
        }
    }

    async deleteGroup(groupId) {
        try {
            const group = await OrganizationGroups.findByPk(groupId);
            if (!group) {
                throw new Error("Group not found");
            }

            // Remove all users from this group first
            await OrganizationUserGroups.destroy({
                where: { groupId }
            });

            // Delete the group
            await group.destroy();

            return { message: "Group deleted successfully" };
        } catch (error) {
            logger.error('Error in deleteGroup service:', error);
            throw error;
        }
    }

    async getOrganizationGroups(orgId, includeMembers = false) {
        try {
            const include = [];
            
            if (includeMembers) {
                include.push({
                    model: OrganizationUserGroups,
                    as: 'members',
                    include: [{
                        model: User,
                        as: 'user',
                        attributes: ['userId', 'firstName', 'lastName', 'email']
                    }]
                });
            }

            const groups = await OrganizationGroups.findAll({
                where: { orgId },
                include
            });

            return groups;
        } catch (error) {
            logger.error('Error in getOrganizationGroups service:', error);
            throw error;
        }
    }

    async getGroupById(groupId, includeMembers = false) {
        try {
            const include = [];
            
            if (includeMembers) {
                include.push({
                    model: OrganizationUserGroups,
                    as: 'members',
                    include: [{
                        model: User,
                        as: 'user',
                        attributes: ['userId', 'firstName', 'lastName', 'email']
                    }]
                });
            }

            const group = await OrganizationGroups.findByPk(groupId, { include });
            
            if (!group) {
                throw new Error("Group not found");
            }

            return group;
        } catch (error) {
            logger.error('Error in getGroupById service:', error);
            throw error;
        }
    }

    // Group Membership Management
    async addUsersToGroup(groupId, userIds, role = 'MEMBER') {
        try {
            const group = await OrganizationGroups.findByPk(groupId);
            if (!group) {
                throw new Error("Group not found");
            }

            const orgId = group.orgId;

            // Check if all users exist and are part of the organization
            const orgUsers = await OrganizationUser.findAll({
                where: {
                    orgId,
                    userId: userIds
                }
            });

            if (orgUsers.length !== userIds.length) {
                throw new Error("Some users are not part of the organization");
            }

            // Add users to group
            const groupUsers = await Promise.all(
                userIds.map(async (userId) => {
                    const [groupUser, created] = await OrganizationUserGroups.findOrCreate({
                        where: { groupId, userId, orgId },
                        defaults: { role }
                    });
                    return { groupUser, created };
                })
            );

            return groupUsers;
        } catch (error) {
            logger.error('Error in addUsersToGroup service:', error);
            throw error;
        }
    }

    async removeUserFromGroup(groupId, userId) {
        try {
            const groupUser = await OrganizationUserGroups.findOne({
                where: { groupId, userId }
            });

            if (!groupUser) {
                throw new Error("User is not a member of this group");
            }

            await groupUser.destroy();
            return { message: "User removed from group successfully" };
        } catch (error) {
            logger.error('Error in removeUserFromGroup service:', error);
            throw error;
        }
    }

    async updateUserRoleInGroup(groupId, userId, role) {
        try {
            const groupUser = await OrganizationUserGroups.findOne({
                where: { groupId, userId }
            });

            if (!groupUser) {
                throw new Error("User is not a member of this group");
            }

            groupUser.role = role;
            await groupUser.save();

            return groupUser;
        } catch (error) {
            logger.error('Error in updateUserRoleInGroup service:', error);
            throw error;
        }
    }

    async getGroupMembers(groupId) {
        try {
            const groupUsers = await OrganizationUserGroups.findAll({
                where: { groupId },
                include: [{
                    model: User,
                    as: 'user',
                 }]
            });

            return groupUsers;
        } catch (error) {
            logger.error('Error in getGroupMembers service:', error);
            throw error;
        }
    }

    async getUserGroups(userId, orgId = null) {
        try {
            const where = { userId };
            if (orgId) {
                where.orgId = orgId;
            }

            const userGroups = await OrganizationUserGroups.findAll({
                where,
                include: [{
                    model: OrganizationGroups,
                    as: 'group',
                    attributes: ['groupId', 'groupName', 'description', 'orgId']
                }]
            });

            return userGroups;
        } catch (error) {
            logger.error('Error in getUserGroups service:', error);
            throw error;
        }
    }
}

module.exports = new OrgGroupService();
