const { body, param, query, validationResult } = require('express-validator');

// Validation middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }
    next();
};

// Organization registration validation
const validateOrganizationRegistration = [
    body('orgName')
        .notEmpty()
        .withMessage('Organization name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Organization name must be between 2 and 100 characters'),
    
    body('orgEmail')
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),
    
    body('orgType')
        .optional()
        .isIn(['company', 'educational', 'non_profit', 'government', 'startup'])
        .withMessage('Invalid organization type'),
    
    body('orgIndustry')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Industry must be less than 100 characters'),
    
    body('orgWebsite')
        .optional()
        .isURL()
        .withMessage('Invalid website URL'),
    
    body('orgContactNo')
        .optional()
        .isMobilePhone()
        .withMessage('Invalid contact number'),
    
    body('orgCountry')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Country must be less than 50 characters'),
    
    handleValidationErrors
];

// Organization update validation
const validateOrganizationUpdate = [
    param('orgId')
        .isInt({ min: 1 })
        .withMessage('Valid organization ID is required'),
    
    body('orgName')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Organization name must be between 2 and 100 characters'),
    
    body('orgEmail')
        .optional()
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),
    
    body('orgType')
        .optional()
        .isIn(['company', 'educational', 'non_profit', 'government', 'startup'])
        .withMessage('Invalid organization type'),
    
    body('orgWebsite')
        .optional()
        .isURL()
        .withMessage('Invalid website URL'),
    
    body('orgContactNo')
        .optional()
        .isMobilePhone()
        .withMessage('Invalid contact number'),
    
    handleValidationErrors
];

// User invitation validation
const validateUserInvitation = [
    param('orgId')
        .isInt({ min: 1 })
        .withMessage('Valid organization ID is required'),
    
    body('email')
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),
    
    body('userRole')
        .optional()
        .isIn(['ADMIN', 'MANAGER', 'INSTRUCTOR', 'MEMBER'])
        .withMessage('Invalid user role'),
    
    handleValidationErrors
];

// Group creation validation
const validateGroupCreation = [
    param('orgId')
        .isInt({ min: 1 })
        .withMessage('Valid organization ID is required'),
    
    body('groupName')
        .notEmpty()
        .withMessage('Group name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Group name must be between 2 and 100 characters'),
    
    body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description must be less than 500 characters'),
    
    handleValidationErrors
];

// Bulk invite validation
const validateBulkInvite = [
    param('orgId')
        .isInt({ min: 1 })
        .withMessage('Valid organization ID is required'),
    
    body('users')
        .isArray({ min: 1 })
        .withMessage('Users array is required and must not be empty'),
    
    body('users.*.email')
        .isEmail()
        .withMessage('Valid email is required for all users')
        .normalizeEmail(),
    
    body('users.*.userRole')
        .optional()
        .isIn(['ADMIN', 'MANAGER', 'INSTRUCTOR', 'MEMBER'])
        .withMessage('Invalid user role'),
    
    body('defaultRole')
        .optional()
        .isIn(['ADMIN', 'MANAGER', 'INSTRUCTOR', 'MEMBER'])
        .withMessage('Invalid default role'),
    
    handleValidationErrors
];

// Role update validation
const validateRoleUpdate = [
    param('orgId')
        .isInt({ min: 1 })
        .withMessage('Valid organization ID is required'),
    
    param('userId')
        .isInt({ min: 1 })
        .withMessage('Valid user ID is required'),
    
    body('userRole')
        .isIn(['ADMIN', 'MANAGER', 'INSTRUCTOR', 'MEMBER'])
        .withMessage('Valid user role is required'),
    
    handleValidationErrors
];

// Status update validation
const validateStatusUpdate = [
    param('orgId')
        .isInt({ min: 1 })
        .withMessage('Valid organization ID is required'),
    
    body('status')
        .isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
        .withMessage('Valid status is required'),
    
    handleValidationErrors
];

// User status update validation
const validateUserStatusUpdate = [
    param('orgId')
        .isInt({ min: 1 })
        .withMessage('Valid organization ID is required'),
    
    param('userId')
        .isInt({ min: 1 })
        .withMessage('Valid user ID is required'),
    
    body('status')
        .isIn(['PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED'])
        .withMessage('Valid status is required'),
    
    handleValidationErrors
];

// Pagination validation
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    
    handleValidationErrors
];

// Search validation
const validateSearch = [
    query('q')
        .notEmpty()
        .withMessage('Search query is required')
        .isLength({ min: 1, max: 100 })
        .withMessage('Search query must be between 1 and 100 characters'),
    
    handleValidationErrors
];

// Add users to group validation
const validateAddUsersToGroup = [
    param('orgId')
        .isInt({ min: 1 })
        .withMessage('Valid organization ID is required'),
    
    param('groupId')
        .isInt({ min: 1 })
        .withMessage('Valid group ID is required'),
    
    body('userIds')
        .isArray({ min: 1 })
        .withMessage('User IDs array is required and must not be empty'),
    
    body('userIds.*')
        .isInt({ min: 1 })
        .withMessage('All user IDs must be positive integers'),
    
    handleValidationErrors
];

module.exports = {
    validateOrganizationRegistration,
    validateOrganizationUpdate,
    validateUserInvitation,
    validateGroupCreation,
    validateBulkInvite,
    validateRoleUpdate,
    validateStatusUpdate,
    validateUserStatusUpdate,
    validatePagination,
    validateSearch,
    validateAddUsersToGroup,
    handleValidationErrors
};
