const { s3, defaultBucket } = require('../config/s3.config');
const db = require('../entity');
const path = require('path');
const crypto = require('crypto');


class S3FileUploadService {
    constructor() {
        this.s3Client = s3;
    }

    /**
     * Retry S3 operation if token expires
     * @param {Function} operation - S3 operation to retry
     * @param {number} maxRetries - Maximum number of retries
     * @returns {Promise<any>} Operation result
     */
    async retryOnExpiredToken(operation, maxRetries = 2) {
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                if (error.code === 'ExpiredToken' && attempt < maxRetries) {
                    console.warn(`Token expired, retrying (attempt ${attempt}/${maxRetries})...`);
                    // Reload S3 config to get fresh credentials
                    delete require.cache[require.resolve('../config/s3.config')];
                    const { s3: newS3 } = require('../config/s3.config');
                    this.s3Client = newS3;
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
                } else {
                    throw error;
                }
            }
        }
        throw lastError;
    }

    /**
     * Generate a UUID v4
     * @returns {string} UUID v4 string
     */
    generateUUID() {
        return crypto.randomUUID();
    }

    /**
     * Upload a file to S3-compatible storage and save metadata to database
     * @param {Object} fileData - File information
     * @param {Buffer} fileData.buffer - File buffer
     * @param {string} fileData.originalname - Original filename
     * @param {string} fileData.mimetype - File MIME type
     * @param {number} fileData.size - File size in bytes
     * @param {number} userId - ID of the user uploading the file
     * @param {string} bucket - S3 bucket name
     * @param {Object} options - Additional options
     * @param {boolean} options.isPublic - Whether the file should be publicly accessible
     * @param {Array} options.tags - Additional metadata tags
     * @param {string} options.folder - Subfolder within the bucket
     * @param {Object} options.metadata - Additional S3 metadata
     * @returns {Promise<Object>} Upload result with file info and URLs
     */
    async uploadFile(fileData, userId = null, bucket = defaultBucket, options = {}) {
        try {
            console.log('S3 Upload Debug Info:', {
                bucket: bucket,
                endpoint: s3.config.endpoint,
                region: s3.config.region,
                s3ForcePathStyle: s3.config.s3ForcePathStyle,
                userId: userId,
                fileSize: fileData.size,
                fileName: fileData.originalname
            });

            const { 
                isPublic = true, 
                tags = [], 
                folder = null,
                metadata = {},
                storageClass = 'STANDARD'
            } = options;

            // Generate unique filename
            const fileExtension = path.extname(fileData.originalname);
            const uniqueFileName = `${this.generateUUID()}${fileExtension}`;
            
            // Construct file path (S3 key)
            let filePath = uniqueFileName;
            if (folder) {
                filePath = `${folder}/${uniqueFileName}`;
            }
            if (userId) {
                filePath = `user-${userId}/${filePath}`;
            }

            // Prepare S3 upload parameters
            const uploadParams = {
                Bucket: bucket,
                Key: filePath,
                Body: fileData.buffer,
                ContentType: fileData.mimetype,
                ContentLength: fileData.size,
                StorageClass: storageClass,
                Metadata: {
                    originalName: fileData.originalname,
                    uploadedBy: userId ? userId.toString() : 'anonymous',
                    uploadTimestamp: new Date().toISOString(),
                    ...metadata
                }
            };

            // Set ACL based on public/private setting
            if (isPublic) {
                uploadParams.ACL = 'public-read';
            } else {
                uploadParams.ACL = 'private';
            }

            // Add tags if provided
            if (tags.length > 0) {
                const tagSet = tags.map(tag => {
                    if (typeof tag === 'string') {
                        return { Key: 'tag', Value: tag };
                    }
                    return { Key: tag.key || 'tag', Value: tag.value || tag };
                });
                uploadParams.Tagging = tagSet.map(tag => `${tag.Key}=${encodeURIComponent(tag.Value)}`).join('&');
            }

            console.log('S3 Upload Params:', {
                Bucket: uploadParams.Bucket,
                Key: uploadParams.Key,
                ContentType: uploadParams.ContentType,
                ContentLength: uploadParams.ContentLength,
                ACL: uploadParams.ACL,
                StorageClass: uploadParams.StorageClass
            });

            // Upload file to S3 with retry on expired token
            const uploadResult = await this.retryOnExpiredToken(() => 
                this.s3Client.upload(uploadParams).promise()
            );

            // Generate file URL
            let fileUrl;
            if (isPublic) {
                fileUrl = uploadResult.Location || `https://${bucket}.s3.amazonaws.com/${filePath}`;
            } else {
                // For private files, create a signed URL valid for 1 hour
                fileUrl = await this.generateSignedUrlForPath(bucket, filePath, 3600);
            }

            // Save file metadata to database
            const fileRecord = await db.FileUpload.create({
                originalName: fileData.originalname,
                fileName: uniqueFileName,
                filePath: filePath,
                fileUrl: fileUrl,
                mimeType: fileData.mimetype,
                fileSize: fileData.size,
                bucket: bucket,
                uploadedBy: userId,
                tags: tags.length > 0 ? tags : null,
                isPublic: isPublic,
                s3ETag: uploadResult.ETag,
                s3VersionId: uploadResult.VersionId,
                storageClass: storageClass
            });

            return {
                success: true,
                fileInfo: {
                    id: fileRecord.id,
                    originalName: fileRecord.originalName,
                    fileName: fileRecord.fileName,
                    filePath: fileRecord.filePath,
                    fileUrl: fileRecord.fileUrl,
                    mimeType: fileRecord.mimeType,
                    fileSize: fileRecord.fileSize,
                    bucket: fileRecord.bucket,
                    uploadedBy: fileRecord.uploadedBy,
                    tags: fileRecord.tags,
                    isPublic: fileRecord.isPublic,
                    s3ETag: fileRecord.s3ETag,
                    s3VersionId: fileRecord.s3VersionId,
                    storageClass: fileRecord.storageClass,
                    createdAt: fileRecord.createdAt
                },
                s3Result: {
                    etag: uploadResult.ETag,
                    location: uploadResult.Location,
                    versionId: uploadResult.VersionId
                }
            };

        } catch (error) {
            console.error('S3 file upload error:', error);
            throw new Error(`S3 file upload failed: ${error.message}`);
        }
    }

    /**
     * Upload multiple files to S3
     * @param {Array} files - Array of file data objects
     * @param {number} userId - ID of the user uploading the files
     * @param {string} bucket - S3 bucket name
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Upload results
     */
    async uploadMultipleFiles(files, userId = null, bucket = defaultBucket, options = {}) {
        try {
            const uploadPromises = files.map(file => 
                this.uploadFile(file, userId, bucket, options)
            );

            const results = await Promise.allSettled(uploadPromises);
            
            const successful = results
                .filter(result => result.status === 'fulfilled')
                .map(result => result.value.fileInfo);
            
            const failed = results
                .filter(result => result.status === 'rejected')
                .map(result => result.reason.message);

            return {
                success: true,
                uploaded: successful,
                failed: failed,
                totalFiles: files.length,
                successCount: successful.length,
                failCount: failed.length
            };

        } catch (error) {
            console.error('S3 multiple file upload error:', error);
            throw new Error(`S3 multiple file upload failed: ${error.message}`);
        }
    }

    /**
     * Generate a signed URL for accessing a private file
     * @param {string} bucket - S3 bucket name
     * @param {string} filePath - File path/key in S3
     * @param {number} expiresIn - Expiration time in seconds
     * @param {string} operation - S3 operation (getObject, putObject, etc.)
     * @returns {Promise<string>} Signed URL
     */
    async generateSignedUrlForPath(bucket, filePath, expiresIn = 3600, operation = 'getObject') {
        try {
            const params = {
                Bucket: bucket,
                Key: filePath,
                Expires: expiresIn
            };

            const signedUrl = await this.retryOnExpiredToken(() => 
                this.s3Client.getSignedUrlPromise(operation, params)
            );
            return signedUrl;

        } catch (error) {
            console.error('Generate S3 signed URL error:', error);
            throw new Error(`Failed to generate S3 signed URL: ${error.message}`);
        }
    }

    /**
     * Generate a signed URL for a file by database ID
     * @param {number} fileId - File ID
     * @param {number} expiresIn - Expiration time in seconds (default: 3600)
     * @param {string} operation - S3 operation type
     * @returns {Promise<Object>} Signed URL
     */
    async generateSignedUrl(fileId, expiresIn = 3600, operation = 'getObject') {
        try {
            const fileRecord = await db.FileUpload.findByPk(fileId);
            
            if (!fileRecord) {
                throw new Error('File not found');
            }

            if (fileRecord.isPublic && operation === 'getObject') {
                // Return existing public URL for public files
                return {
                    success: true,
                    url: fileRecord.fileUrl,
                    isPublic: true
                };
            }

            // Generate new signed URL
            const signedUrl = await this.generateSignedUrlForPath(
                fileRecord.bucket, 
                fileRecord.filePath, 
                expiresIn, 
                operation
            );

            return {
                success: true,
                url: signedUrl,
                isPublic: false,
                expiresIn: expiresIn,
                operation: operation
            };

        } catch (error) {
            console.error('Generate signed URL error:', error);
            throw new Error(`Failed to generate signed URL: ${error.message}`);
        }
    }

    /**
     * Get file information by ID
     * @param {number} fileId - File ID
     * @returns {Promise<Object>} File information
     */
    async getFileById(fileId) {
        try {
            const fileRecord = await db.FileUpload.findByPk(fileId, {
                include: [
                    {
                        model: db.User,
                        as: 'uploader',
                        attributes: ['id', 'email', 'name']
                    }
                ]
            });

            if (!fileRecord) {
                throw new Error('File not found');
            }

            return fileRecord;
        } catch (error) {
            console.error('Get file by ID error:', error);
            throw new Error(`Failed to get file: ${error.message}`);
        }
    }

    /**
     * Get files uploaded by a user
     * @param {number} userId - User ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} User's files
     */
    async getUserFiles(userId, options = {}) {
        try {
            const { 
                limit = 50, 
                offset = 0, 
                mimeType = null,
                bucket = null 
            } = options;

            const whereClause = { uploadedBy: userId };
            if (mimeType) whereClause.mimeType = mimeType;
            if (bucket) whereClause.bucket = bucket;

            const files = await db.FileUpload.findAndCountAll({
                where: whereClause,
                limit: limit,
                offset: offset,
                order: [['createdAt', 'DESC']],
                include: [
                    {
                        model: db.User,
                        as: 'uploader',
                        attributes: ['id', 'email', 'name']
                    }
                ]
            });

            return {
                files: files.rows,
                total: files.count,
                limit: limit,
                offset: offset
            };
        } catch (error) {
            console.error('Get user files error:', error);
            throw new Error(`Failed to get user files: ${error.message}`);
        }
    }

    /**
     * Delete a file from S3 storage and database
     * @param {number} fileId - File ID
     * @param {number} userId - User ID (for authorization)
     * @returns {Promise<Object>} Deletion result
     */
    async deleteFile(fileId, userId = null) {
        try {
            // Get file record
            const fileRecord = await db.FileUpload.findByPk(fileId);
            
            if (!fileRecord) {
                throw new Error('File not found');
            }

            // Check if user has permission to delete (if userId provided)
            if (userId && fileRecord.uploadedBy !== userId) {
                throw new Error('Unauthorized: You can only delete your own files');
            }

            // Delete from S3 storage
            const deleteParams = {
                Bucket: fileRecord.bucket,
                Key: fileRecord.filePath
            };

            if (fileRecord.s3VersionId) {
                deleteParams.VersionId = fileRecord.s3VersionId;
            }

            try {
                await this.retryOnExpiredToken(() => 
                    this.s3Client.deleteObject(deleteParams).promise()
                );
            } catch (s3Error) {
                console.warn(`S3 deletion warning: ${s3Error.message}`);
                // Continue with database deletion even if S3 deletion fails
            }

            // Delete from database
            await fileRecord.destroy();

            return {
                success: true,
                message: 'File deleted successfully',
                deletedFile: {
                    id: fileRecord.id,
                    originalName: fileRecord.originalName,
                    fileName: fileRecord.fileName,
                    bucket: fileRecord.bucket,
                    filePath: fileRecord.filePath
                }
            };

        } catch (error) {
            console.error('Delete file error:', error);
            throw new Error(`File deletion failed: ${error.message}`);
        }
    }

    /**
     * Copy a file to another location within S3
     * @param {number} fileId - Source file ID
     * @param {string} destinationBucket - Destination bucket
     * @param {string} destinationKey - Destination key/path
     * @param {Object} options - Copy options
     * @returns {Promise<Object>} Copy result
     */
    async copyFile(fileId, destinationBucket, destinationKey, options = {}) {
        try {
            const fileRecord = await db.FileUpload.findByPk(fileId);
            
            if (!fileRecord) {
                throw new Error('Source file not found');
            }

            const copyParams = {
                Bucket: destinationBucket,
                CopySource: `${fileRecord.bucket}/${fileRecord.filePath}`,
                Key: destinationKey,
                ...options
            };

            const copyResult = await s3.copyObject(copyParams).promise();

            return {
                success: true,
                copyResult: copyResult,
                sourceFile: {
                    id: fileRecord.id,
                    bucket: fileRecord.bucket,
                    key: fileRecord.filePath
                },
                destination: {
                    bucket: destinationBucket,
                    key: destinationKey
                }
            };

        } catch (error) {
            console.error('Copy file error:', error);
            throw new Error(`File copy failed: ${error.message}`);
        }
    }

    /**
     * Get S3 object metadata
     * @param {string} bucket - S3 bucket name
     * @param {string} key - S3 object key
     * @returns {Promise<Object>} Object metadata
     */
    async getObjectMetadata(bucket, key) {
        try {
            const params = {
                Bucket: bucket,
                Key: key
            };

            const metadata = await s3.headObject(params).promise();
            return metadata;

        } catch (error) {
            console.error('Get object metadata error:', error);
            throw new Error(`Failed to get object metadata: ${error.message}`);
        }
    }

    /**
     * List objects in a bucket with optional prefix
     * @param {string} bucket - S3 bucket name
     * @param {Object} options - List options
     * @returns {Promise<Object>} List of objects
     */
    async listObjects(bucket, options = {}) {
        try {
            const {
                prefix = '',
                maxKeys = 1000,
                continuationToken = null
            } = options;

            const params = {
                Bucket: bucket,
                Prefix: prefix,
                MaxKeys: maxKeys
            };

            if (continuationToken) {
                params.ContinuationToken = continuationToken;
            }

            const result = await s3.listObjectsV2(params).promise();
            
            return {
                success: true,
                objects: result.Contents || [],
                isTruncated: result.IsTruncated,
                nextContinuationToken: result.NextContinuationToken,
                keyCount: result.KeyCount,
                prefix: prefix
            };

        } catch (error) {
            console.error('List objects error:', error);
            throw new Error(`Failed to list objects: ${error.message}`);
        }
    }

    /**
     * Create a multipart upload for large files
     * @param {string} bucket - S3 bucket name
     * @param {string} key - S3 object key
     * @param {Object} options - Upload options
     * @returns {Promise<Object>} Multipart upload result
     */
    async createMultipartUpload(bucket, key, options = {}) {
        try {
            const params = {
                Bucket: bucket,
                Key: key,
                ...options
            };

            const result = await s3.createMultipartUpload(params).promise();
            
            return {
                success: true,
                uploadId: result.UploadId,
                bucket: result.Bucket,
                key: result.Key
            };

        } catch (error) {
            console.error('Create multipart upload error:', error);
            throw new Error(`Failed to create multipart upload: ${error.message}`);
        }
    }
}

module.exports = new S3FileUploadService();