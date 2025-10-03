const { body, param, validationResult } = require('express-validator');

// Validation for organization invitation
const validateInvitationData = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    
    body('userRole')
        .optional()
        .isIn(['ADMIN', 'MANAGER', 'INSTRUCTOR', 'MEMBER'])
        .withMessage('User role must be one of: ADMIN, MANAGER, INSTRUCTOR, MEMBER'),
    
    body('message')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Message cannot exceed 500 characters'),
    
    body('permissions')
        .optional()
        .isObject()
        .withMessage('Permissions must be an object'),

    // Check for validation errors
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 400,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

// Validation for invitation token
const validateInvitationToken = [
    param('token')
        .isLength({ min: 32, max: 64 })
        .withMessage('Invalid invitation token format')
        .matches(/^[a-f0-9]+$/)
        .withMessage('Invitation token must be hexadecimal'),

    // Check for validation errors
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 400,
                message: 'Invalid invitation token',
                errors: errors.array()
            });
        }
        next();
    }
];

module.exports = {
    validateInvitationData,
    validateInvitationToken
};