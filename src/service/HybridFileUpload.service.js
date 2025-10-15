const S3FileUploadService = require('./S3FileUpload.service');
require('dotenv').config();

class FileUploadService {
    constructor() {
        // Only S3 storage is supported now
        this.storageType = 's3';
        this.activeService = S3FileUploadService;
        console.log(`File upload service initialized with S3 storage`);
    }

    /**
     * Get the current storage type
     * @returns {string} Storage type ('s3')
     */
    getStorageType() {
        return this.storageType;
    }

    /**
     * Upload a file using S3 storage service
     * @param {Object} fileData - File information
     * @param {number} userId - ID of the user uploading the file
     * @param {string} bucket - Storage bucket name
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Upload result with file info and URLs
     */
    async uploadFile(fileData, userId = null, bucket = null, options = {}) {
        try {
            const result = await this.activeService.uploadFile(fileData, userId, bucket, options);
            
            // Add storage type to the result
            result.storageType = this.storageType;
            
            return result;
        } catch (error) {
            console.error(`S3 upload error:`, error);
            throw error;
        }
    }

    /**
     * Upload multiple files using S3 storage service
     * @param {Array} files - Array of file data objects
     * @param {number} userId - ID of the user uploading the files
     * @param {string} bucket - Storage bucket name
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Upload results
     */
    async uploadMultipleFiles(files, userId = null, bucket = null, options = {}) {
        try {
            const result = await this.activeService.uploadMultipleFiles(files, userId, bucket, options);
            
            // Add storage type to the result
            result.storageType = this.storageType;
            
            return result;
        } catch (error) {
            console.error(`S3 multiple upload error:`, error);
            throw error;
        }
    }

    /**
     * Get file information by ID
     * @param {number} fileId - File ID
     * @returns {Promise<Object>} File information
     */
    async getFileById(fileId) {
        return await this.activeService.getFileById(fileId);
    }

    /**
     * Get files uploaded by a user
     * @param {number} userId - User ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} User's files
     */
    async getUserFiles(userId, options = {}) {
        return await this.activeService.getUserFiles(userId, options);
    }

    /**
     * Delete a file from storage and database
     * @param {number} fileId - File ID
     * @param {number} userId - User ID (for authorization)
     * @returns {Promise<Object>} Deletion result
     */
    async deleteFile(fileId, userId = null) {
        return await this.activeService.deleteFile(fileId, userId);
    }

    /**
     * Generate a signed URL for a file
     * @param {number} fileId - File ID
     * @param {number} expiresIn - Expiration time in seconds
     * @param {string} operation - Operation type (for S3)
     * @returns {Promise<Object>} Signed URL
     */
    async generateSignedUrl(fileId, expiresIn = 3600, operation = 'getObject') {
        return await this.activeService.generateSignedUrl(fileId, expiresIn, operation);
    }

    /**
     * Get S3 service methods
     * @returns {Object} Active service instance
     */
    getActiveService() {
        return this.activeService;
    }

    /**
     * Check if S3 methods are available
     * @returns {boolean} Always true since only S3 is supported
     */
    isS3Active() {
        return true;
    }

    // S3 methods - all available since only S3 is supported
    
    /**
     * Copy a file
     * @param {number} fileId - Source file ID
     * @param {string} destinationBucket - Destination bucket
     * @param {string} destinationKey - Destination key/path
     * @param {Object} options - Copy options
     * @returns {Promise<Object>} Copy result
     */
    async copyFile(fileId, destinationBucket, destinationKey, options = {}) {
        return await this.activeService.copyFile(fileId, destinationBucket, destinationKey, options);
    }

    /**
     * Get S3 object metadata
     * @param {string} bucket - S3 bucket name
     * @param {string} key - S3 object key
     * @returns {Promise<Object>} Object metadata
     */
    async getObjectMetadata(bucket, key) {
        return await this.activeService.getObjectMetadata(bucket, key);
    }

    /**
     * List objects in a bucket
     * @param {string} bucket - S3 bucket name
     * @param {Object} options - List options
     * @returns {Promise<Object>} List of objects
     */
    async listObjects(bucket, options = {}) {
        return await this.activeService.listObjects(bucket, options);
    }

    /**
     * Create a multipart upload
     * @param {string} bucket - S3 bucket name
     * @param {string} key - S3 object key
     * @param {Object} options - Upload options
     * @returns {Promise<Object>} Multipart upload result
     */
    async createMultipartUpload(bucket, key, options = {}) {
        return await this.activeService.createMultipartUpload(bucket, key, options);
    }

    /**
     * Generate signed URL for a specific path
     * @param {string} bucket - S3 bucket name
     * @param {string} filePath - File path/key in S3
     * @param {number} expiresIn - Expiration time in seconds
     * @param {string} operation - S3 operation
     * @returns {Promise<string>} Signed URL
     */
    async generateSignedUrlForPath(bucket, filePath, expiresIn = 3600, operation = 'getObject') {
        return await this.activeService.generateSignedUrlForPath(bucket, filePath, expiresIn, operation);
    }
}

module.exports = new FileUploadService();