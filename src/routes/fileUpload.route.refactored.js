const express = require('express');
const { body, param, query } = require('express-validator');
const FileUploadController = require('../controller/FileUpload.controller');
const authMiddleware = require('../middleware/authMiddleware');
const publicMiddleware = require('../middleware/publicMiddleware');
const { singleFileUpload, multipleFileUpload } = require('../middleware/fileUploadMiddleware');

const router = express.Router();

// Validation rules
const validationRules = {
    fileById: [param('id').isInt({ min: 1 }).withMessage('Valid file ID is required')],
    signedUrl: [
        param('id').isInt({ min: 1 }).withMessage('Valid file ID is required'),
        body('expiresIn').optional().isInt({ min: 60, max: 86400 }).withMessage('expiresIn must be between 60 and 86400 seconds')
    ],
    userFiles: [
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be a non-negative integer')
    ],
    copyFile: [
        param('id').isInt({ min: 1 }).withMessage('Valid file ID is required'),
        body('destinationBucket').notEmpty().withMessage('destinationBucket is required'),
        body('destinationKey').notEmpty().withMessage('destinationKey is required')
    ],
    listObjects: [
        query('bucket').notEmpty().withMessage('bucket parameter is required'),
        query('maxKeys').optional().isInt({ min: 1, max: 1000 }).withMessage('maxKeys must be between 1 and 1000')
    ],
    objectMetadata: [
        query('bucket').notEmpty().withMessage('bucket parameter is required'),
        query('key').notEmpty().withMessage('key parameter is required')
    ]
};

/**
 * @swagger
 * tags:
 *   name: File Upload
 *   description: File upload and management APIs
 */

// Core upload endpoints
router.post('/api/upload/single', 
    publicMiddleware,
    ...singleFileUpload('file'),
    FileUploadController.uploadSingle
);

router.post('/api/upload/multiple',
    publicMiddleware,
    ...multipleFileUpload('files', 10),
    FileUploadController.uploadMultiple
);

// File management endpoints
router.get('/api/upload/file/:id',
    validationRules.fileById,
    FileUploadController.getFileById
);

router.get('/api/upload/my-files',
    authMiddleware,
    validationRules.userFiles,
    FileUploadController.getUserFiles
);

router.delete('/api/upload/file/:id',
    authMiddleware,
    validationRules.fileById,
    FileUploadController.deleteFile
);

router.post('/api/upload/file/:id/signed-url',
    validationRules.signedUrl,
    FileUploadController.generateSignedUrl
);

// S3-specific endpoints
router.post('/api/upload/file/:id/copy',
    authMiddleware,
    validationRules.copyFile,
    FileUploadController.copyFile
);

router.get('/api/upload/list-objects',
    authMiddleware,
    validationRules.listObjects,
    FileUploadController.listObjects
);

router.get('/api/upload/object-metadata',
    authMiddleware,
    validationRules.objectMetadata,
    FileUploadController.getObjectMetadata
);

// Utility endpoints
router.get('/api/upload/storage-info', FileUploadController.getStorageInfo);

router.get('/api/upload/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'File upload service is running',
        timestamp: new Date().toISOString(),
        service: 'FileUpload',
        version: '2.0.0'
    });
});

module.exports = router;