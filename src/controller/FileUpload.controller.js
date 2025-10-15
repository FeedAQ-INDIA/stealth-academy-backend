const FileUploadService = require('../service/HybridFileUpload.service');
const { body, param, query, validationResult } = require('express-validator');

class FileUploadController {
    /**
     * Upload a single file
     * @swagger
     * /api/upload/single:
     *   post:
     *     tags: [File Upload]
     *     summary: Upload a single file
     *     description: Upload a single file to S3 storage
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               file:
     *                 type: string
     *                 format: binary
     *               bucket:
     *                 type: string
     *               folder:
     *                 type: string
     *               isPublic:
     *                 type: boolean
     *               tags:
     *                 type: string
     *     responses:
     *       200:
     *         description: File uploaded successfully
     *       400:
     *         description: Bad request or validation error
     *       500:
     *         description: Internal server error
     */
    async uploadSingle(req, res) {
        try {
            // Check for validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            // Check if file was uploaded
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            // Extract user ID from token (if authenticated)
            const userId = req.user ? req.user.id : null;

            // Extract options from request body
            const bucket = req.body.bucket || 'uploads';
            const folder = req.body.folder || null;
            const isPublic = req.body.isPublic !== 'false'; // Default to true
            const tags = req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [];

            // Upload file
            const result = await FileUploadService.uploadFile(
                req.file,
                userId,
                bucket,
                { isPublic, tags, folder }
            );

            res.status(200).json({
                success: true,
                message: 'File uploaded successfully',
                data: result.fileInfo
            });

        } catch (error) {
            console.error('Upload single file error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'File upload failed'
            });
        }
    }

    /**
     * Upload multiple files
     * @swagger
     * /api/upload/multiple:
     *   post:
     *     tags: [File Upload]
     *     summary: Upload multiple files
     *     description: Upload multiple files to S3 storage
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               files:
     *                 type: array
     *                 items:
     *                   type: string
     *                   format: binary
     *               bucket:
     *                 type: string
     *               folder:
     *                 type: string
     *               isPublic:
     *                 type: boolean
     *               tags:
     *                 type: string
     *     responses:
     *       200:
     *         description: Files uploaded successfully
     *       400:
     *         description: Bad request or validation error
     *       500:
     *         description: Internal server error
     */
    async uploadMultiple(req, res) {
        try {
            // Check for validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            // Check if files were uploaded
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No files uploaded'
                });
            }

            // Extract user ID from token (if authenticated)
            const userId = req.user ? req.user.id : null;

            // Extract options from request body
            const bucket = req.body.bucket || 'uploads';
            const folder = req.body.folder || null;
            const isPublic = req.body.isPublic !== 'false'; // Default to true
            const tags = req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [];

            // Upload files
            const result = await FileUploadService.uploadMultipleFiles(
                req.files,
                userId,
                bucket,
                { isPublic, tags, folder }
            );

            res.status(200).json({
                success: true,
                message: `${result.successCount} files uploaded successfully, ${result.failCount} failed`,
                data: result
            });

        } catch (error) {
            console.error('Upload multiple files error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'File upload failed'
            });
        }
    }

    /**
     * Get file information by ID
     * @swagger
     * /api/upload/file/{id}:
     *   get:
     *     tags: [File Upload]
     *     summary: Get file information
     *     description: Get file information by ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: File information retrieved successfully
     *       404:
     *         description: File not found
     *       500:
     *         description: Internal server error
     */
    async getFileById(req, res) {
        try {
            // Check for validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const fileId = parseInt(req.params.id);
            const fileInfo = await FileUploadService.getFileById(fileId);

            res.status(200).json({
                success: true,
                message: 'File information retrieved successfully',
                data: fileInfo
            });

        } catch (error) {
            console.error('Get file by ID error:', error);
            const statusCode = error.message.includes('not found') ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to get file information'
            });
        }
    }

    /**
     * Get user's files
     * @swagger
     * /api/upload/my-files:
     *   get:
     *     tags: [File Upload]
     *     summary: Get user's uploaded files
     *     description: Get files uploaded by the authenticated user
     *     parameters:
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 50
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *           default: 0
     *       - in: query
     *         name: mimeType
     *         schema:
     *           type: string
     *       - in: query
     *         name: bucket
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: User files retrieved successfully
     *       401:
     *         description: Unauthorized - user not authenticated
     *       500:
     *         description: Internal server error
     */
    async getUserFiles(req, res) {
        try {
            // Check for validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            // Check if user is authenticated
            if (!req.user || !req.user.id) {
                return res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
            }

            const userId = req.user.id;
            const options = {
                limit: parseInt(req.query.limit) || 50,
                offset: parseInt(req.query.offset) || 0,
                mimeType: req.query.mimeType || null,
                bucket: req.query.bucket || null
            };

            const result = await FileUploadService.getUserFiles(userId, options);

            res.status(200).json({
                success: true,
                message: 'User files retrieved successfully',
                data: result
            });

        } catch (error) {
            console.error('Get user files error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get user files'
            });
        }
    }

    /**
     * Delete a file
     * @swagger
     * /api/upload/file/{id}:
     *   delete:
     *     tags: [File Upload]
     *     summary: Delete a file
     *     description: Delete a file from storage and database
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: File deleted successfully
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: File not found
     *       500:
     *         description: Internal server error
     */
    async deleteFile(req, res) {
        try {
            // Check for validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const fileId = parseInt(req.params.id);
            const userId = req.user ? req.user.id : null;

            const result = await FileUploadService.deleteFile(fileId, userId);

            res.status(200).json({
                success: true,
                message: 'File deleted successfully',
                data: result.deletedFile
            });

        } catch (error) {
            console.error('Delete file error:', error);
            let statusCode = 500;
            if (error.message.includes('not found')) statusCode = 404;
            if (error.message.includes('Unauthorized')) statusCode = 401;

            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to delete file'
            });
        }
    }

    /**
     * Generate signed URL for a file
     * @swagger
     * /api/upload/file/{id}/signed-url:
     *   post:
     *     tags: [File Upload]
     *     summary: Generate signed URL
     *     description: Generate a signed URL for accessing a private file
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               expiresIn:
     *                 type: integer
     *                 default: 3600
     *     responses:
     *       200:
     *         description: Signed URL generated successfully
     *       404:
     *         description: File not found
     *       500:
     *         description: Internal server error
     */
    async generateSignedUrl(req, res) {
        try {
            // Check for validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const fileId = parseInt(req.params.id);
            const expiresIn = req.body.expiresIn || 3600;

            const result = await FileUploadService.generateSignedUrl(fileId, expiresIn);

            res.status(200).json({
                success: true,
                message: 'Signed URL generated successfully',
                data: result
            });

        } catch (error) {
            console.error('Generate signed URL error:', error);
            const statusCode = error.message.includes('not found') ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to generate signed URL'
            });
        }
    }

    /**
     * Get storage information
     * @swagger
     * /api/upload/storage-info:
     *   get:
     *     tags: [File Upload]
     *     summary: Get storage information
     *     description: Get information about the current storage backend
     *     responses:
     *       200:
     *         description: Storage information retrieved successfully
     */
    async getStorageInfo(req, res) {
        try {
            const storageType = FileUploadService.getStorageType();
            const isS3Active = FileUploadService.isS3Active();

            res.status(200).json({
                success: true,
                message: 'Storage information retrieved successfully',
                data: {
                    storageType,
                    isS3Active,
                    capabilities: {
                        upload: true,
                        multipleUpload: true,
                        delete: true,
                        signedUrls: true,
                        copyFile: true,
                        listObjects: true,
                        objectMetadata: true,
                        multipartUpload: true
                    }
                }
            });
        } catch (error) {
            console.error('Get storage info error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get storage information'
            });
        }
    }

    /**
     * Copy file (S3 only)
     * @swagger
     * /api/upload/file/{id}/copy:
     *   post:
     *     tags: [File Upload]
     *     summary: Copy file
     *     description: Copy a file to another location (S3 only)
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               destinationBucket:
     *                 type: string
     *               destinationKey:
     *                 type: string
     *             required:
     *               - destinationBucket
     *               - destinationKey
     *     responses:
     *       200:
     *         description: File copied successfully
     *       400:
     *         description: Bad request or not supported
     *       404:
     *         description: File not found
     *       500:
     *         description: Internal server error
     */
    async copyFile(req, res) {
        try {
            // Check for validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const fileId = parseInt(req.params.id);
            const { destinationBucket, destinationKey } = req.body;

            if (!destinationBucket || !destinationKey) {
                return res.status(400).json({
                    success: false,
                    message: 'destinationBucket and destinationKey are required'
                });
            }

            const result = await FileUploadService.copyFile(fileId, destinationBucket, destinationKey);

            res.status(200).json({
                success: true,
                message: 'File copied successfully',
                data: result
            });

        } catch (error) {
            console.error('Copy file error:', error);
            const statusCode = error.message.includes('not found') ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to copy file'
            });
        }
    }

    /**
     * List objects in bucket (S3 only)
     * @swagger
     * /api/upload/list-objects:
     *   get:
     *     tags: [File Upload]
     *     summary: List objects in bucket
     *     description: List objects in a bucket (S3 only)
     *     parameters:
     *       - in: query
     *         name: bucket
     *         required: true
     *         schema:
     *           type: string
     *       - in: query
     *         name: prefix
     *         schema:
     *           type: string
     *       - in: query
     *         name: maxKeys
     *         schema:
     *           type: integer
     *           default: 1000
     *       - in: query
     *         name: continuationToken
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Objects listed successfully
     *       400:
     *         description: Bad request or not supported
     *       500:
     *         description: Internal server error
     */
    async listObjects(req, res) {
        try {
            // Check for validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const bucket = req.query.bucket;
            if (!bucket) {
                return res.status(400).json({
                    success: false,
                    message: 'bucket parameter is required'
                });
            }

            const options = {
                prefix: req.query.prefix || '',
                maxKeys: parseInt(req.query.maxKeys) || 1000,
                continuationToken: req.query.continuationToken || null
            };

            const result = await FileUploadService.listObjects(bucket, options);

            res.status(200).json({
                success: true,
                message: 'Objects listed successfully',
                data: result
            });

        } catch (error) {
            console.error('List objects error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to list objects'
            });
        }
    }

    /**
     * Get object metadata (S3 only)
     * @swagger
     * /api/upload/object-metadata:
     *   get:
     *     tags: [File Upload]
     *     summary: Get object metadata
     *     description: Get metadata for an S3 object (S3 only)
     *     parameters:
     *       - in: query
     *         name: bucket
     *         required: true
     *         schema:
     *           type: string
     *       - in: query
     *         name: key
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Object metadata retrieved successfully
     *       400:
     *         description: Bad request or not supported
     *       500:
     *         description: Internal server error
     */
    async getObjectMetadata(req, res) {
        try {
            // Check for validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const bucket = req.query.bucket;
            const key = req.query.key;

            if (!bucket || !key) {
                return res.status(400).json({
                    success: false,
                    message: 'bucket and key parameters are required'
                });
            }

            const result = await FileUploadService.getObjectMetadata(bucket, key);

            res.status(200).json({
                success: true,
                message: 'Object metadata retrieved successfully',
                data: result
            });

        } catch (error) {
            console.error('Get object metadata error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get object metadata'
            });
        }
    }
}

module.exports = new FileUploadController();