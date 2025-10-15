module.exports = (sequelize, DataTypes) => {
    const FileUpload = sequelize.define("FileUpload", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        originalName: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "Original filename of the uploaded file"
        },
        fileName: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "Generated unique filename used in storage"
        },
        filePath: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "Full path/key of the file in S3 storage"
        },
        fileUrl: {
            type: DataTypes.TEXT,
            allowNull: false,
            comment: "Public URL to access the file"
        },
        mimeType: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "MIME type of the uploaded file"
        },
        fileSize: {
            type: DataTypes.BIGINT,
            allowNull: false,
            comment: "Size of the file in bytes"
        },
        bucket: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'uploads',
            comment: "S3 storage bucket name"
        },
        uploadedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: "User ID who uploaded the file"
        },
        tags: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: "Additional metadata tags for the file"
        },
        isPublic: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: "Whether the file is publicly accessible"
        },
        s3ETag: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "S3 ETag returned after upload"
        },
        s3VersionId: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "S3 Version ID for versioned buckets"
        },
        storageClass: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'STANDARD',
            comment: "S3 storage class (STANDARD, REDUCED_REDUNDANCY, etc.)"
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    }, {
        tableName: "file_uploads",
        timestamps: true,
        indexes: [
            {
                fields: ['uploadedBy']
            },
            {
                fields: ['bucket']
            },
            {
                fields: ['mimeType']
            },
            {
                fields: ['createdAt']
            }
        ]
    });

    // Define associations
    FileUpload.associate = function(models) {
        // Association with User entity if it exists
        if (models.User) {
            FileUpload.belongsTo(models.User, {
                foreignKey: 'uploadedBy',
                as: 'uploader'
            });
        }
    };

    return FileUpload;
};