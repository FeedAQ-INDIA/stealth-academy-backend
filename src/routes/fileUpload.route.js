const express = require('express');
const multer = require('multer');
const { body, param, query } = require('express-validator');
const FileUploadController = require('../controller/FileUpload.controller');
const authMiddleware = require('../middleware/authMiddleware');
const publicMiddleware = require('../middleware/publicMiddleware');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(), // Store files in memory as Buffer
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
        files: 10 // Maximum 10 files per request
    },
    fileFilter: (req, file, cb) => {
        // Define allowed file types
        const allowedMimeTypes = [
            // Images
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',
            // Documents
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'text/csv',
            // Audio
            'audio/mpeg',
            'audio/wav',
            'audio/mp3',
            'audio/ogg',
            'audio/webm',
            // Video
            'video/mp4',
            'video/mpeg',
            'video/quicktime',
            'video/x-msvideo',
            'video/webm',
            // Archives
            'application/zip',
            'application/x-rar-compressed',
            'application/x-7z-compressed',
            // JSON
            'application/json'
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${file.mimetype} not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`), false);
        }
    }
});

// Handle multer errors
const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 50MB'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files. Maximum is 10 files per request'
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Unexpected field name for file upload'
            });
        }
    }
    
    if (error.message.includes('File type')) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    next(error);
};

// Validation rules
const validationRules = {
    getFileById: [
        param('id').isInt({ min: 1 }).withMessage('Valid file ID is required')
    ],
    deleteFile: [
        param('id').isInt({ min: 1 }).withMessage('Valid file ID is required')
    ],
    generateSignedUrl: [
        param('id').isInt({ min: 1 }).withMessage('Valid file ID is required'),
        body('expiresIn').optional().isInt({ min: 60, max: 86400 }).withMessage('expiresIn must be between 60 and 86400 seconds')
    ],
    getUserFiles: [
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be a non-negative integer')
    ]
};

/**
 * @swagger
 * tags:
 *   name: File Upload
 *   description: File upload and management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     FileInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: File ID
 *         originalName:
 *           type: string
 *           description: Original filename
 *         fileName:
 *           type: string
 *           description: Generated unique filename
 *         filePath:
 *           type: string
 *           description: Full path in storage
 *         fileUrl:
 *           type: string
 *           description: Public URL to access the file
 *         mimeType:
 *           type: string
 *           description: MIME type of the file
 *         fileSize:
 *           type: integer
 *           description: File size in bytes
 *         bucket:
 *           type: string
 *           description: Storage bucket name
 *         uploadedBy:
 *           type: integer
 *           description: User ID who uploaded the file
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: File tags
 *         isPublic:
 *           type: boolean
 *           description: Whether file is publicly accessible
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Upload timestamp
 */

// Routes

/**
 * Upload single file
 * Can be used with or without authentication
 * If authenticated, the file will be associated with the user
 */
router.post('/api/upload/single', 
    publicMiddleware, // Allow both authenticated and unauthenticated requests
    upload.single('file'),
    handleUploadError,
    FileUploadController.uploadSingle
);

/**
 * Upload multiple files
 * Can be used with or without authentication
 * If authenticated, the files will be associated with the user
 */
router.post('/api/upload/multiple',
    publicMiddleware, // Allow both authenticated and unauthenticated requests
    upload.array('files', 20), // Maximum 10 files
    handleUploadError,
    FileUploadController.uploadMultiple
);

/**
 * Get file information by ID
 * Public endpoint - no authentication required
 */
router.get('/api/upload/file/:id',
    validationRules.getFileById,
    FileUploadController.getFileById
);

/**
 * Get user's uploaded files
 * Requires authentication
 */
router.get('/api/upload/my-files',
    authMiddleware, // Requires authentication
    validationRules.getUserFiles,
    FileUploadController.getUserFiles
);

/**
 * Delete a file
 * Requires authentication - users can only delete their own files
 */
router.delete('/api/upload/file/:id',
    authMiddleware, // Requires authentication
    validationRules.deleteFile,
    FileUploadController.deleteFile
);

/**
 * Generate signed URL for a file
 * Public endpoint - useful for accessing private files
 */
router.post('/api/upload/file/:id/signed-url',
    validationRules.generateSignedUrl,
    FileUploadController.generateSignedUrl
);

/**
 * Get storage information
 * Public endpoint
 */
router.get('/api/upload/storage-info',
    FileUploadController.getStorageInfo
);

/**
 * Copy file
 * Requires authentication
 */
router.post('/api/upload/file/:id/copy',
    authMiddleware,
    [
        param('id').isInt({ min: 1 }).withMessage('Valid file ID is required'),
        body('destinationBucket').notEmpty().withMessage('destinationBucket is required'),
        body('destinationKey').notEmpty().withMessage('destinationKey is required')
    ],
    FileUploadController.copyFile
);

/**
 * List objects in bucket
 * Requires authentication
 */
router.get('/api/upload/list-objects',
    authMiddleware,
    [
        query('bucket').notEmpty().withMessage('bucket parameter is required'),
        query('maxKeys').optional().isInt({ min: 1, max: 1000 }).withMessage('maxKeys must be between 1 and 1000')
    ],
    FileUploadController.listObjects
);

/**
 * Get object metadata
 * Requires authentication
 */
router.get('/api/upload/object-metadata',
    authMiddleware,
    [
        query('bucket').notEmpty().withMessage('bucket parameter is required'),
        query('key').notEmpty().withMessage('key parameter is required')
    ],
    FileUploadController.getObjectMetadata
);

/**
 * Health check for file upload service
 */
router.get('/api/upload/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'File upload service is running',
        timestamp: new Date().toISOString(),
        service: 'FileUpload',
        version: '1.0.0'
    });
});

module.exports = router;