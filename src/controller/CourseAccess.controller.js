const db = require("../entity");
const { Op } = require("sequelize");
const { handleError } = require("../utils/errorHandler");

const CourseAccess = db.courseAccess;
const Course = db.course;
const User = db.user;
const Organization = db.organization;
const Group = db.group;
const GroupUser = db.groupUser;

/**
 * Grant access to a course for a user or organization
 */
exports.grantAccess = async (req, res) => {
    try {
        const { courseId, userId, organizationId, accessLevel, expiresAt } = req.body;

        // Validate that either userId or organizationId is provided, but not both
        if ((!userId && !organizationId) || (userId && organizationId)) {
            return res.status(400).json({
                message: "Either userId or organizationId must be provided, but not both"
            });
        }

        // Check if course exists
        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Check if access already exists
        const existingAccess = await CourseAccess.findOne({
            where: {
                courseId,
                ...(userId ? { userId } : { organizationId }),
                isActive: true
            }
        });

        if (existingAccess) {
            return res.status(400).json({
                message: "Access already granted"
            });
        }

        // Create new access record
        const access = await CourseAccess.create({
            courseId,
            ...(userId ? { userId } : { organizationId }),
            accessLevel: accessLevel || "SHARED",
            expiresAt: expiresAt || null,
            grantedByUserId: req.user.userId,
            grantedByOrganizationId: req.user.organizationId,
            isActive: true
        });

        res.status(201).json({
            message: "Access granted successfully",
            data: access
        });
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * Revoke access to a course
 */
exports.revokeAccess = async (req, res) => {
    try {
        const { courseAccessId } = req.params;

        const access = await CourseAccess.findByPk(courseAccessId);
        if (!access) {
            return res.status(404).json({ message: "Access record not found" });
        }

        // Soft delete the access record
        await access.destroy();

        res.json({
            message: "Access revoked successfully"
        });
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * Update access level or expiration
 */
exports.updateAccess = async (req, res) => {
    try {
        const { courseAccessId } = req.params;
        const { accessLevel, expiresAt, isActive } = req.body;

        const access = await CourseAccess.findByPk(courseAccessId);
        if (!access) {
            return res.status(404).json({ message: "Access record not found" });
        }

        // Update access record
        await access.update({
            ...(accessLevel && { accessLevel }),
            ...(expiresAt !== undefined && { expiresAt }),
            ...(isActive !== undefined && { isActive })
        });

        res.json({
            message: "Access updated successfully",
            data: access
        });
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * Get all access records for a course
 */
exports.getCourseAccess = async (req, res) => {
    try {
        const { courseId } = req.params;

        const access = await CourseAccess.findAll({
            where: { courseId, isActive: true },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['userId', 'firstName', 'lastName', 'email']
                },
                {
                    model: Organization,
                    as: 'organization',
                    attributes: ['orgId', 'orgName', 'orgEmail']
                }
            ]
        });

        res.json({
            data: access
        });
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * Get all courses a user has access to
 */
exports.getUserCourseAccess = async (req, res) => {
    try {
        const { userId } = req.params;

        // Get user's direct access and organizational access
        const access = await CourseAccess.findAll({
            where: {
                isActive: true,
                [Op.or]: [
                    { userId },
                    {
                        organizationId: {
                            [Op.in]: await getUserOrganizationIds(userId)
                        }
                    }
                ]
            },
            include: [{
                model: Course,
                as: 'course'
            }]
        });

        res.json({
            data: access
        });
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * Check if a user has access to a course
 */
exports.checkAccess = async (req, res) => {
    try {
        const { userId, courseId } = req.params;

        const userOrgs = await getUserOrganizationIds(userId);

        const access = await CourseAccess.findOne({
            where: {
                courseId,
                isActive: true,
                [Op.or]: [
                    { userId },
                    {
                        organizationId: {
                            [Op.in]: userOrgs
                        }
                    }
                ]
            }
        });

        res.json({
            hasAccess: !!access,
            accessDetails: access
        });
    } catch (error) {
        handleError(res, error);
    }
};

// Helper function to get all organization IDs a user belongs to
async function getUserOrganizationIds(userId) {
    const orgUsers = await db.organizationUser.findAll({
        where: {
            userId,
            status: 'ACTIVE'
        }
    });
    return orgUsers.map(ou => ou.orgId);
}
