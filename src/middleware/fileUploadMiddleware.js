const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
        files: 10 // Maximum 10 files per request
    },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            // Images
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
            // Documents
            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain', 'text/csv',
            // Audio
            'audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/webm',
            // Video
            'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm',
            // Archives
            'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
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
        const errorMap = {
            'LIMIT_FILE_SIZE': 'File too large. Maximum size is 50MB',
            'LIMIT_FILE_COUNT': 'Too many files. Maximum is 10 files per request',
            'LIMIT_UNEXPECTED_FILE': 'Unexpected field name for file upload'
        };
        
        return res.status(400).json({
            success: false,
            message: errorMap[error.code] || 'File upload error'
        });
    }
    
    if (error.message.includes('File type')) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    next(error);
};

// Middleware factories
const singleFileUpload = (fieldName = 'file') => [
    upload.single(fieldName),
    handleUploadError
];

const multipleFileUpload = (fieldName = 'files', maxCount = 10) => [
    upload.array(fieldName, maxCount),
    handleUploadError
];

const optionalFileUpload = (fieldName = 'files', maxCount = 5) => [
    upload.array(fieldName, maxCount),
    (error, req, res, next) => {
        // For optional uploads, don't fail on file errors, just log them
        if (error) {
            console.warn('Optional file upload warning:', error.message);
            req.fileUploadError = error.message;
        }
        next();
    }
];

module.exports = {
    upload,
    handleUploadError,
    singleFileUpload,
    multipleFileUpload,
    optionalFileUpload
};