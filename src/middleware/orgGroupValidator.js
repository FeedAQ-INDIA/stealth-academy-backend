const logger = require('../config/winston.config.js');

// Validation middleware for organization group operations
class OrgGroupValidator {
    
    // Validate add user to organization request
    static validateAddUserToOrg(req, res, next) {
        const { orgId } = req.params;
        const { userId, role } = req.body;

        // Validate orgId
        if (!orgId || isNaN(parseInt(orgId))) {
            return res.status(400).json({
                success: false,
                message: "Valid organization ID is required"
            });
        }

        // Validate userId
        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).json({
                success: false,
                message: "Valid user ID is required"
            });
        }

        // Validate role if provided
        if (role && !['MEMBER', 'ADMIN'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Role must be either 'MEMBER' or 'ADMIN'"
            });
        }

        next();
    }

    // Validate create group request
    static validateCreateGroup(req, res, next) {
        const { orgId } = req.params;
        const { groupName } = req.body;

        // Validate orgId
        if (!orgId || isNaN(parseInt(orgId))) {
            return res.status(400).json({
                success: false,
                message: "Valid organization ID is required"
            });
        }

        // Validate groupName
        if (!groupName || typeof groupName !== 'string' || groupName.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Group name is required and must be a non-empty string"
            });
        }

        if (groupName.length > 100) {
            return res.status(400).json({
                success: false,
                message: "Group name must be 100 characters or less"
            });
        }

        // Sanitize groupName
        req.body.groupName = groupName.trim();

        next();
    }

    // Validate update group request
    static validateUpdateGroup(req, res, next) {
        const { groupId } = req.params;
        const { groupName, status } = req.body;

        // Validate groupId
        if (!groupId || isNaN(parseInt(groupId))) {
            return res.status(400).json({
                success: false,
                message: "Valid group ID is required"
            });
        }

        // Validate groupName if provided
        if (groupName !== undefined) {
            if (typeof groupName !== 'string' || groupName.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Group name must be a non-empty string"
                });
            }

            if (groupName.length > 100) {
                return res.status(400).json({
                    success: false,
                    message: "Group name must be 100 characters or less"
                });
            }

            req.body.groupName = groupName.trim();
        }

        // Validate status if provided
        if (status && !['ACTIVE', 'INACTIVE'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be either 'ACTIVE' or 'INACTIVE'"
            });
        }

        next();
    }

    // Validate add users to group request
    static validateAddUsersToGroup(req, res, next) {
        const { groupId } = req.params;
        const { userIds, role } = req.body;

        // Validate groupId
        if (!groupId || isNaN(parseInt(groupId))) {
            return res.status(400).json({
                success: false,
                message: "Valid group ID is required"
            });
        }

        // Validate userIds
        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "User IDs must be a non-empty array"
            });
        }

        // Validate each userId
        for (const userId of userIds) {
            if (!userId || isNaN(parseInt(userId))) {
                return res.status(400).json({
                    success: false,
                    message: "All user IDs must be valid integers"
                });
            }
        }

        // Remove duplicates
        req.body.userIds = [...new Set(userIds.map(id => parseInt(id)))];

        // Validate role if provided
        if (role && !['MEMBER', 'ADMIN'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Role must be either 'MEMBER' or 'ADMIN'"
            });
        }

        next();
    }

    // Validate update role request
    static validateUpdateRole(req, res, next) {
        const { role } = req.body;

        // Validate role
        if (!role || !['MEMBER', 'ADMIN'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Role is required and must be either 'MEMBER' or 'ADMIN'"
            });
        }

        next();
    }

    // Validate ID parameters
    static validateIdParams(req, res, next) {
        const { orgId, groupId, userId } = req.params;

        if (orgId && isNaN(parseInt(orgId))) {
            return res.status(400).json({
                success: false,
                message: "Valid organization ID is required"
            });
        }

        if (groupId && isNaN(parseInt(groupId))) {
            return res.status(400).json({
                success: false,
                message: "Valid group ID is required"
            });
        }

        if (userId && isNaN(parseInt(userId))) {
            return res.status(400).json({
                success: false,
                message: "Valid user ID is required"
            });
        }

        next();
    }

    // Validate query parameters
    static validateQueryParams(req, res, next) {
        const { includeGroups, includeMembers, orgId } = req.query;

        // Validate boolean query parameters
        if (includeGroups && !['true', 'false'].includes(includeGroups)) {
            return res.status(400).json({
                success: false,
                message: "includeGroups parameter must be 'true' or 'false'"
            });
        }

        if (includeMembers && !['true', 'false'].includes(includeMembers)) {
            return res.status(400).json({
                success: false,
                message: "includeMembers parameter must be 'true' or 'false'"
            });
        }

        // Validate orgId query parameter if provided
        if (orgId && isNaN(parseInt(orgId))) {
            return res.status(400).json({
                success: false,
                message: "Organization ID in query must be a valid integer"
            });
        }

        next();
    }

    // General error handler
    static handleValidationError(error, req, res, next) {
        if (error.name === 'ValidationError') {
            logger.error('Validation error:', error);
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: error.errors
            });
        }
        next(error);
    }
}

module.exports = OrgGroupValidator;
