const db = require("../entity");
const { Op } = require("sequelize");
const logger = require("../config/winston.config");

const CourseStudyGroup = db.CourseStudyGroup;
const CourseStudyGroupUser = db.CourseStudyGroupUser;
const CourseStudyGroupContent = db.CourseStudyGroupContent;
const Course = db.Course;
const User = db.User;

/**
 * Create or update a study group
 */
const createOrUpdateStudyGroup = async (data) => {
    try {
    const { courseStudyGroupId, groupName, description, ownedBy, organizationId } = data;

        if (courseStudyGroupId) {
            // Update existing study group
            const studyGroup = await CourseStudyGroup.findByPk(courseStudyGroupId);
            if (!studyGroup) {
                throw new Error("Study group not found");
            }

            // Check if user has permission to update (owner or admin)
            const userRole = await CourseStudyGroupUser.findOne({
                where: {
                    courseStudyGroupId,
                    userId: ownedBy,
                    role: ['OWNER', 'ADMIN']
                }
            });

            if (!userRole && studyGroup.ownedBy !== ownedBy) {
                throw new Error("Unauthorized to update this study group");
            }

            await studyGroup.update({
                groupName,
                description,
                organizationId,
                lastModifiedBy: ownedBy
            });

            return await CourseStudyGroup.findByPk(courseStudyGroupId, {
                include: [
                    {
                        model: User,
                        as: 'owner',
                     },
                    {
                        model: CourseStudyGroupContent,
                        as: 'groupContent',
                        include: [
                            {
                                model: Course,
                                as: 'course',
                             }
                        ]
                    }
                ]
            });
        } else {
            // Create new study group
            const studyGroup = await CourseStudyGroup.create({
                groupName,
                description,
                createdBy: ownedBy,
                ownedBy,
                organizationId
            });

            // Add creator as owner to the group
            await CourseStudyGroupUser.create({
                courseStudyGroupId: studyGroup.courseStudyGroupId,
                userId: ownedBy,
                role: 'OWNER'
            });

            return await CourseStudyGroup.findByPk(studyGroup.courseStudyGroupId, {
                include: [
                    {
                        model: User,
                        as: 'owner',
                     },
                    {
                        model: CourseStudyGroupContent,
                        as: 'groupContent',
                        include: [
                            {
                                model: Course,
                                as: 'course',
                             }
                        ]
                    }
                ]
            });
        }
    } catch (error) {
        logger.error('Error in createOrUpdateStudyGroup:', error);
        throw error;
    }
};

/**
 * Add member to study group
 */
const addMemberToStudyGroup = async (data) => {
    try {
        const { courseStudyGroupId, userId, role = 'MEMBER', invitedBy } = data;

        // Check if study group exists
        const studyGroup = await CourseStudyGroup.findByPk(courseStudyGroupId);
        if (!studyGroup) {
            throw new Error("Study group not found");
        }

        // Check if user is already a member
        const existingMember = await CourseStudyGroupUser.findOne({
            where: {
                courseStudyGroupId,
                userId
            }
        });

        if (existingMember) {
            throw new Error("User is already a member of this study group");
        }

        // Add member
        const member = await CourseStudyGroupUser.create({
            courseStudyGroupId,
            userId,
            role,
            invitedBy
        });

        return await CourseStudyGroupUser.findByPk(member.courseStudyGroupUserId, {
            include: [
                {
                    model: User,
                    as: 'user',
                 },
                {
                    model: CourseStudyGroup,
                    as: 'studyGroup',
                 }
            ]
        });
    } catch (error) {
        logger.error('Error in addMemberToStudyGroup:', error);
        throw error;
    }
};

/**
 * Remove member from study group
 */
const removeMemberFromStudyGroup = async (data) => {
    try {
        const { courseStudyGroupId, userId, removedBy } = data;

        // Check if member exists
        const member = await CourseStudyGroupUser.findOne({
            where: {
                courseStudyGroupId,
                userId
            }
        });

        if (!member) {
            throw new Error("User is not a member of this study group");
        }

        // Check permissions - owner/admin can remove anyone, user can remove themselves
        const remover = await CourseStudyGroupUser.findOne({
            where: {
                courseStudyGroupId,
                userId: removedBy,
                role: ['OWNER', 'ADMIN']
            }
        });

        if (!remover && removedBy !== userId) {
            throw new Error("Unauthorized to remove this member");
        }

        // Prevent removing the owner unless they're removing themselves
        if (member.role === 'OWNER' && removedBy !== userId) {
            throw new Error("Cannot remove the owner of the study group");
        }

        await member.destroy();

        return { message: "Member removed successfully" };
    } catch (error) {
        logger.error('Error in removeMemberFromStudyGroup:', error);
        throw error;
    }
};

/**
 * Add content to study group
 */
const addContentToStudyGroup = async (data) => {
    try {
        const { courseStudyGroupId, courseId, createdBy } = data;

        // Check if study group exists
        const studyGroup = await CourseStudyGroup.findByPk(courseStudyGroupId);
        if (!studyGroup) {
            throw new Error("Study group not found");
        }

        // Check if user is a member
        const member = await CourseStudyGroupUser.findOne({
            where: {
                courseStudyGroupId,
                userId: createdBy
            }
        });

        if (!member) {
            throw new Error("User is not a member of this study group");
        }

        // Check if content already exists
        const existingContent = await CourseStudyGroupContent.findOne({
            where: {
                courseStudyGroupId,
                courseId
            }
        });

        if (existingContent) {
            throw new Error("Content already exists in this study group");
        }

        const content = await CourseStudyGroupContent.create({
            courseStudyGroupId,
            courseId,
            createdBy
        });

        return await CourseStudyGroupContent.findByPk(content.courseStudyGroupContentId, {
            include: [
                {
                    model: Course,
                    as: 'course',
                 },
                {
                    model: CourseStudyGroup,
                    as: 'studyGroup',
                 }
            ]
        });
    } catch (error) {
        logger.error('Error in addContentToStudyGroup:', error);
        throw error;
    }
};

/**
 * Remove content from study group
 */
const removeContentFromStudyGroup = async (data) => {
    try {
        const { courseStudyGroupId, courseId, removedBy } = data;

        // Check if content exists
        const content = await CourseStudyGroupContent.findOne({
            where: {
                courseStudyGroupId,
                courseId
            }
        });

        if (!content) {
            throw new Error("Content not found in this study group");
        }

        // Check permissions - owner/admin can remove content, or the user who added it
        const member = await CourseStudyGroupUser.findOne({
            where: {
                courseStudyGroupId,
                userId: removedBy,
                role: ['OWNER', 'ADMIN']
            }
        });

        if (!member && content.createdBy !== removedBy) {
            throw new Error("Unauthorized to remove this content");
        }

        await content.destroy();

        return { message: "Content removed successfully" };
    } catch (error) {
        logger.error('Error in removeContentFromStudyGroup:', error);
        throw error;
    }
};

/**
 * Delete study group
 */
const deleteStudyGroup = async (data) => {
    try {
        const { courseStudyGroupId, deletedBy } = data;

        // Check if study group exists
        const studyGroup = await CourseStudyGroup.findByPk(courseStudyGroupId);
        if (!studyGroup) {
            throw new Error("Study group not found");
        }

        // Check if user is the owner
        if (studyGroup.ownedBy !== deletedBy) {
            throw new Error("Only the owner can delete the study group");
        }

        // Use transaction to ensure all related data is deleted
        await db.sequelize.transaction(async (t) => {
            // Delete all members
            await CourseStudyGroupUser.destroy({
                where: { courseStudyGroupId },
                transaction: t
            });

            // Delete all content
            await CourseStudyGroupContent.destroy({
                where: { courseStudyGroupId },
                transaction: t
            });

            // Delete the study group
            await studyGroup.destroy({ transaction: t });
        });

        return { message: "Study group deleted successfully" };
    } catch (error) {
        logger.error('Error in deleteStudyGroup:', error);
        throw error;
    }
};

/**
 * Get study group details with members and content
 */
const getStudyGroupDetails = async (courseStudyGroupId) => {
    try {
        const studyGroup = await CourseStudyGroup.findByPk(courseStudyGroupId, {
            include: [
                {
                    model: CourseStudyGroupUser,
                    as: 'members',
                    include: [{
                        model: User,
                        as: 'user',
                     }]
                },
                {
                    model: CourseStudyGroupContent,
                    as: 'groupContent',
                    include: [{
                        model: Course,
                        as: 'course',
                     }]
                }
            ]
        });

        if (!studyGroup) {
            throw new Error("Study group not found");
        }

        return studyGroup;
    } catch (error) {
        logger.error('Error in getStudyGroupDetails:', error);
        throw error;
    }
};

/**
 * Get all study groups with pagination
 */
const getAllCourseStudyGroup = async (data) => {
    try {
        const { userId, page = 1, limit = 10 } = data;
        
        const offset = (page - 1) * limit;
        let whereClause = {};
        
        // Basic include clause for all study groups
        const includeClause = [
            {
                model: User,
                as: 'owner',
             },
            {
                model: CourseStudyGroupUser,
                as: 'members',
                where:{
                    userId: userId
                },
                required: true,
            },
            {
                model: CourseStudyGroupContent,
                as: 'groupContent',
                include: [{
                    model: Course,
                    as: 'course',
                 }]
            }
        ];

 

        const { count, rows: studyGroups } = await CourseStudyGroup.findAndCountAll({ 
            include: includeClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['study_group_created_at', 'DESC']],
            distinct: true
        });

        const totalPages = Math.ceil(count / limit);

        return {
            studyGroups,
            totalItems: count,
            totalPages,
            page: parseInt(page),
            limit: parseInt(limit)
        };
    } catch (error) {
        logger.error('Error in getAllCourseStudyGroup:', error);
        throw error;
    }
};

module.exports = {
    createOrUpdateStudyGroup,
    addMemberToStudyGroup,
    removeMemberFromStudyGroup,
    addContentToStudyGroup,
    removeContentFromStudyGroup,
    deleteStudyGroup,
    getStudyGroupDetails,
    getAllCourseStudyGroup
};