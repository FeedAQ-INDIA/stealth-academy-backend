const courseStudyGroupService = require("../service/CourseStudyGroup.service");
const { handleError } = require("../utils/errorHandler");

/**
 * Create or update a study group
 */
exports.createOrUpdateStudyGroup = async (req, res) => {
    try {
        const { courseStudyGroupId, courseId, groupName, description, maxMembers, isPrivate } = req.body;
        const userId = req.user.userId;

        // Validate required fields for creation
        if (!courseStudyGroupId && (!courseId || !groupName)) {
            return res.status(400).json({
                message: "Course ID and group name are required for creating a study group"
            });
        }

        const data = {
            courseStudyGroupId,
            courseId,
            groupName,
            description,
            ownedBy: userId,
            maxMembers,
            isPrivate
        };

        const studyGroup = await courseStudyGroupService.createOrUpdateStudyGroup(data);

        res.status(courseStudyGroupId ? 200 : 201).json({
            message: courseStudyGroupId ? "Study group updated successfully" : "Study group created successfully",
            data: studyGroup
        });
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * Add member to study group
 */
exports.addMemberToStudyGroup = async (req, res) => {
    try {
        const { courseStudyGroupId, userId, role } = req.body;
        const invitedBy = req.user.userId;

        if (!courseStudyGroupId || !userId) {
            return res.status(400).json({
                message: "Course study group ID and user ID are required"
            });
        }

        const data = {
            courseStudyGroupId,
            userId,
            role: role || 'MEMBER',
            invitedBy
        };

        const member = await courseStudyGroupService.addMemberToStudyGroup(data);

        res.status(201).json({
            message: "Member added to study group successfully",
            data: member
        });
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * Remove member from study group
 */
exports.removeMemberFromStudyGroup = async (req, res) => {
    try {
        const { courseStudyGroupId, userId } = req.params;
        const removedBy = req.user.userId;

        if (!courseStudyGroupId || !userId) {
            return res.status(400).json({
                message: "Course study group ID and user ID are required"
            });
        }

        const data = {
            courseStudyGroupId: parseInt(courseStudyGroupId),
            userId: parseInt(userId),
            removedBy
        };

        const result = await courseStudyGroupService.removeMemberFromStudyGroup(data);

        res.status(200).json(result);
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * Add content to study group
 */
exports.addContentToStudyGroup = async (req, res) => {
    try {
        const { courseStudyGroupId, courseId } = req.body;
        const createdBy = req.user.userId;

        if (!courseStudyGroupId || !courseId) {
            return res.status(400).json({
                message: "Course study group ID and course ID are required"
            });
        }

        const data = {
            courseStudyGroupId,
            courseId,
            createdBy
        };

        const content = await courseStudyGroupService.addContentToStudyGroup(data);

        res.status(201).json({
            message: "Content added to study group successfully",
            data: content
        });
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * Remove content from study group
 */
exports.removeContentFromStudyGroup = async (req, res) => {
    try {
        const { courseStudyGroupId, courseId } = req.params;
        const removedBy = req.user.userId;

        if (!courseStudyGroupId || !courseId) {
            return res.status(400).json({
                message: "Course study group ID and course ID are required"
            });
        }

        const data = {
            courseStudyGroupId: parseInt(courseStudyGroupId),
            courseId: parseInt(courseId),
            removedBy
        };

        const result = await courseStudyGroupService.removeContentFromStudyGroup(data);

        res.status(200).json(result);
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * Delete study group
 */
exports.deleteStudyGroup = async (req, res) => {
    try {
        const { courseStudyGroupId } = req.params;
        const deletedBy = req.user.userId;

        if (!courseStudyGroupId) {
            return res.status(400).json({
                message: "Course study group ID is required"
            });
        }

        const data = {
            courseStudyGroupId: parseInt(courseStudyGroupId),
            deletedBy
        };

        const result = await courseStudyGroupService.deleteStudyGroup(data);

        res.status(200).json(result);
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * Get study group details
 */
exports.getStudyGroupDetails = async (req, res) => {
    try {
        const { courseStudyGroupId } = req.params;

        if (!courseStudyGroupId) {
            return res.status(400).json({
                message: "Course study group ID is required"
            });
        }

        const studyGroup = await courseStudyGroupService.getStudyGroupDetails(parseInt(courseStudyGroupId));

        res.status(200).json({
            message: "Study group details retrieved successfully",
            data: studyGroup
        });
    } catch (error) {
        handleError(res, error);
    }
};