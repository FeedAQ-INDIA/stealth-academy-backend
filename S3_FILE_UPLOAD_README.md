# S3-Compatible File Upload Service

This documentation covers the S3-compatible file upload service that works with various S3-compatible storage providers including AWS S3, MinIO, DigitalOcean Spaces, Wasabi, and Backblaze B2.

**Note: This service has been migrated from Supabase to S3-only storage. Supabase support has been removed.**

## Table of Contents
1. [Configuration](#configuration)
2. [Supported Storage Providers](#supported-storage-providers)
3. [Environment Variables](#environment-variables)
4. [API Endpoints](#api-endpoints)
5. [Usage Examples](#usage-examples)
6. [Migration Notes](#migration-notes)
7. [Troubleshooting](#troubleshooting)

## Configuration

### 1. Install Dependencies
The service uses the AWS SDK which is already installed. No additional dependencies are required.

### 2. Environment Variables
Copy `.env.s3.example` to your `.env` file and configure the following variables:

```bash
# Storage type (only S3 supported now)
FILE_STORAGE_TYPE=s3

# S3 Configuration
S3_ACCESS_KEY_ID=your_access_key_here
S3_SECRET_ACCESS_KEY=your_secret_key_here
S3_REGION=us-east-1
S3_ENDPOINT=  # Leave empty for AWS S3
S3_FORCE_PATH_STYLE=false
S3_DEFAULT_BUCKET=uploads
```

## Supported Storage Providers

### AWS S3
```bash
S3_ENDPOINT=
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=false
```

### MinIO
```bash
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true
```

### DigitalOcean Spaces
```bash
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
S3_REGION=nyc3
S3_FORCE_PATH_STYLE=false
```

### Wasabi Cloud Storage
```bash
S3_ENDPOINT=https://s3.wasabisys.com
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=false
```

### Backblaze B2
```bash
S3_ENDPOINT=https://s3.us-west-002.backblazeb2.com
S3_REGION=us-west-002
S3_FORCE_PATH_STYLE=false
```

## Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `FILE_STORAGE_TYPE` | No | Storage backend (only `s3` supported) | `s3` |
| `S3_ACCESS_KEY_ID` | Yes | S3 access key ID | - |
| `S3_SECRET_ACCESS_KEY` | Yes | S3 secret access key | - |
| `S3_REGION` | No | S3 region | `us-east-1` |
| `S3_ENDPOINT` | No | S3 endpoint URL (for compatible services) | - |
| `S3_FORCE_PATH_STYLE` | No | Force path-style URLs | `false` |
| `S3_DEFAULT_BUCKET` | No | Default bucket name | `uploads` |

## API Endpoints

### Core Endpoints (S3 Storage)

#### 1. Upload Single File
```http
POST /api/upload/single
Content-Type: multipart/form-data

Body:
- file: File (required)
- bucket: string (optional)
- folder: string (optional)
- isPublic: boolean (optional, default: true)
- tags: string (optional, comma-separated)
```

#### 2. Upload Multiple Files
```http
POST /api/upload/multiple
Content-Type: multipart/form-data

Body:
- files: File[] (required, max 10 files)
- bucket: string (optional)
- folder: string (optional)
- isPublic: boolean (optional, default: true)
- tags: string (optional, comma-separated)
```

#### 3. Get File Information
```http
GET /api/upload/file/{id}
```

#### 4. Get User Files
```http
GET /api/upload/my-files?limit=50&offset=0&mimeType=image/jpeg&bucket=uploads
```

#### 5. Delete File
```http
DELETE /api/upload/file/{id}
```

#### 6. Generate Signed URL
```http
POST /api/upload/file/{id}/signed-url
Content-Type: application/json

Body:
{
  "expiresIn": 3600
}
```

#### 7. Get Storage Information
```http
GET /api/upload/storage-info
```

### S3 Advanced Endpoints

#### 8. Copy File
```http
POST /api/upload/file/{id}/copy
Content-Type: application/json

Body:
{
  "destinationBucket": "backup-bucket",
  "destinationKey": "backup/file.jpg"
}
```

#### 9. List Objects in Bucket
```http
GET /api/upload/list-objects?bucket=uploads&prefix=user-123/&maxKeys=100&continuationToken=abc123
```

#### 10. Get Object Metadata
```http
GET /api/upload/object-metadata?bucket=uploads&key=user-123/file.jpg
```

## Usage Examples

### Node.js/JavaScript Client

```javascript
// Upload a single file
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('folder', 'profile-pictures');
formData.append('isPublic', 'true');

const response = await fetch('/api/upload/single', {
  method: 'POST',
  body: formData,
  headers: {
    'Authorization': `Bearer ${token}` // Optional
  }
});

const result = await response.json();
console.log('Upload result:', result);

// Check storage type
const storageInfo = await fetch('/api/upload/storage-info');
const info = await storageInfo.json();
console.log('Storage type:', info.data.storageType);

// S3: Copy file
const copyResponse = await fetch(`/api/upload/file/${fileId}/copy`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    destinationBucket: 'backup',
    destinationKey: 'backup/my-file.jpg'
  })
});
```

### cURL Examples

```bash
# Upload a file
curl -X POST http://localhost:3000/api/upload/single \
  -H "Authorization: Bearer your-token" \
  -F "file=@/path/to/file.jpg" \
  -F "folder=uploads" \
  -F "isPublic=true"

# Get storage information
curl http://localhost:3000/api/upload/storage-info

# List S3 objects
curl "http://localhost:3000/api/upload/list-objects?bucket=uploads&prefix=user-123/" \
  -H "Authorization: Bearer your-token"

# Copy file
curl -X POST http://localhost:3000/api/upload/file/123/copy \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"destinationBucket": "backup", "destinationKey": "backup/file.jpg"}'
```

## Migration Notes

### Completed Migration from Supabase
This service has been fully migrated from Supabase to S3-only storage:

✅ **Completed Changes:**
- Removed Supabase dependencies
- Updated service to S3-only
- Simplified configuration
- Removed hybrid storage logic
- Updated all documentation

✅ **Database Compatibility:**
The existing database schema remains compatible. S3-specific fields are available:
- `s3ETag`: S3 ETag value
- `s3VersionId`: S3 version ID (for versioned buckets)
- `storageClass`: S3 storage class

✅ **API Compatibility:**
All existing API endpoints continue to work without changes.

## Service Features

### S3-Only Service Benefits
- **Simplified Architecture**: Single storage backend for easier maintenance
- **Full S3 Feature Support**: Access to all S3 capabilities
- **Better Performance**: Direct S3 integration without abstraction overhead
- **Cost Effective**: Use any S3-compatible provider for cost optimization

### S3 Features
- **Multi-part uploads**: For large files
- **Cross-bucket copying**: Copy files between buckets
- **Object metadata**: Access S3 object metadata
- **Bucket listing**: List all objects in a bucket
- **Storage classes**: Support for different S3 storage classes
- **Versioning**: Support for S3 bucket versioning

### Security Features
- **Access Control**: Public/private file access control
- **Signed URLs**: Temporary access to private files
- **User Authorization**: Users can only delete their own files
- **File Type Validation**: Configurable allowed file types
- **Size Limits**: Configurable file size limits

## Error Handling

### Common Error Responses

```json
{
  "success": false,
  "message": "Error description",
  "errors": []
}
```

### Error Types
- `400`: Bad request (validation errors, missing parameters)
- `401`: Unauthorized (authentication required)
- `404`: File not found
- `413`: File too large
- `415`: Unsupported file type
- `500`: Internal server error

## Troubleshooting

### Common Issues

1. **"S3 operation not available"**
   - Check that `FILE_STORAGE_TYPE=s3` in your environment
   - Verify S3 credentials are configured

2. **"Access Denied" from S3**
   - Verify S3 credentials have proper permissions
   - Check bucket policies and IAM permissions

3. **"Connection refused" to MinIO**
   - Ensure MinIO server is running
   - Verify endpoint URL and port
   - Set `S3_FORCE_PATH_STYLE=true` for MinIO

4. **"SignatureDoesNotMatch"**
   - Verify access key and secret key are correct
   - Check system clock is synchronized
   - Ensure region is correctly configured

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG=aws-sdk
```

### Testing Configuration
Use the health check endpoint to verify service status:
```bash
curl http://localhost:3000/api/upload/health
```

## Performance Considerations

### File Size Limits
- Default: 50MB per file
- Configure in `fileUpload.route.js` multer settings

### Concurrent Uploads
- Default: 10 files maximum per request
- Configurable in multer settings

### S3 Storage Classes
- `STANDARD`: Default, immediate access
- `STANDARD_IA`: Infrequent access, lower cost
- `GLACIER`: Archive storage, very low cost

### Signed URL Caching
- Cache signed URLs on client side
- Default expiration: 1 hour
- Configurable per request

## Best Practices

1. **Bucket Organization**: Use consistent folder structures
2. **File Naming**: Use UUIDs to avoid conflicts
3. **Access Control**: Use private files with signed URLs for sensitive content
4. **Monitoring**: Monitor storage costs and usage
5. **Backup**: Implement cross-region replication for critical files
6. **Security**: Regularly rotate access keys
7. **Performance**: Use CDN for public files