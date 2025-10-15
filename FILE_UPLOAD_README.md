# File Upload Feature - Supabase Storage Integration

This feature provides file upload functionality using Supabase storage backend.

## Features

- **Single & Multiple File Upload**: Upload one or multiple files in a single request
- **File Type Validation**: Supports images, documents, audio, video, and archive files
- **Size Limits**: 50MB per file, maximum 10 files per request
- **User Association**: Files can be associated with authenticated users
- **Public/Private Files**: Support for both public and private file access
- **File Management**: Get, list, delete files
- **Signed URLs**: Generate time-limited access URLs for private files
- **Metadata Storage**: Track file information in the database
- **Tags Support**: Add custom tags to files for better organization

## Setup

### 1. Environment Variables

Add the following to your `.env` file:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Supabase Storage Bucket

Create a storage bucket in your Supabase project:

1. Go to Supabase Dashboard → Storage
2. Create a new bucket (e.g., "uploads")
3. Set appropriate policies for your use case

Example RLS policies for the bucket:

```sql
-- Allow public uploads
CREATE POLICY "Anyone can upload files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'uploads');

-- Allow public downloads for public files
CREATE POLICY "Anyone can view public files" ON storage.objects
FOR SELECT USING (bucket_id = 'uploads');

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files" ON storage.objects
FOR DELETE USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 3. Database Migration

Run your server to automatically create the `file_uploads` table:

```bash
npm run dev
```

## API Endpoints

### Upload Single File
```http
POST /api/upload/single
Content-Type: multipart/form-data

{
  "file": <file>,
  "bucket": "uploads",           // optional, default: "uploads"
  "folder": "documents",         // optional, subfolder
  "isPublic": true,             // optional, default: true
  "tags": "document,important"   // optional, comma-separated
}
```

### Upload Multiple Files
```http
POST /api/upload/multiple
Content-Type: multipart/form-data

{
  "files": [<file1>, <file2>],
  "bucket": "uploads",
  "folder": "images",
  "isPublic": true,
  "tags": "gallery,photos"
}
```

### Get File Information
```http
GET /api/upload/file/{id}
```

### Get User's Files (requires authentication)
```http
GET /api/upload/my-files?limit=20&offset=0&mimeType=image/jpeg&bucket=uploads
```

### Delete File (requires authentication)
```http
DELETE /api/upload/file/{id}
```

### Generate Signed URL
```http
POST /api/upload/file/{id}/signed-url
Content-Type: application/json

{
  "expiresIn": 3600  // optional, default: 3600 seconds
}
```

### Health Check
```http
GET /api/upload/health
```

## File Types Supported

- **Images**: JPEG, PNG, GIF, WebP, SVG
- **Documents**: PDF, Word, Excel, PowerPoint, TXT, CSV
- **Audio**: MP3, WAV, OGG
- **Video**: MP4, MPEG, QuickTime, AVI, WebM
- **Archives**: ZIP, RAR, 7Z
- **Data**: JSON

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "id": 1,
    "originalName": "example.pdf",
    "fileName": "uuid-generated-name.pdf",
    "filePath": "user-123/documents/uuid-generated-name.pdf",
    "fileUrl": "https://your-project.supabase.co/storage/v1/object/public/uploads/...",
    "mimeType": "application/pdf",
    "fileSize": 1024000,
    "bucket": "uploads",
    "uploadedBy": 123,
    "tags": ["document", "important"],
    "isPublic": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "File upload failed: File too large"
}
```

## Usage Examples

### Frontend JavaScript
```javascript
// Single file upload
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('folder', 'documents');
formData.append('tags', 'contract,legal');

fetch('/api/upload/single', {
  method: 'POST',
  body: formData,
  headers: {
    'Authorization': `Bearer ${token}` // optional, for user association
  }
})
.then(response => response.json())
.then(data => console.log(data));

// Multiple files upload
const formData = new FormData();
Array.from(fileInput.files).forEach(file => {
  formData.append('files', file);
});

fetch('/api/upload/multiple', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

### Node.js/Express
```javascript
const FileUploadService = require('./src/service/FileUpload.service');

// Programmatic upload
const result = await FileUploadService.uploadFile(
  {
    buffer: fileBuffer,
    originalname: 'example.pdf',
    mimetype: 'application/pdf',
    size: fileBuffer.length
  },
  userId,
  'uploads',
  {
    isPublic: false,
    tags: ['private', 'document'],
    folder: 'private-docs'
  }
);
```

## Security Considerations

1. **File Type Validation**: Only allowed MIME types can be uploaded
2. **Size Limits**: Files are limited to 50MB to prevent abuse
3. **User Authorization**: Users can only delete their own files
4. **Private Files**: Use signed URLs for temporary access to private files
5. **Rate Limiting**: Consider implementing rate limiting for upload endpoints
6. **Virus Scanning**: Consider adding virus scanning for uploaded files

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**: Ensure `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set
2. **Bucket Permissions**: Check Supabase RLS policies for the storage bucket
3. **File Size Errors**: Verify files are under 50MB limit
4. **MIME Type Errors**: Ensure uploaded files are in the allowed types list

### Error Codes

- `400`: Bad request (validation error, file too large, etc.)
- `401`: Unauthorized (missing/invalid authentication)
- `404`: File not found
- `500`: Internal server error (Supabase connection, database issues)

## API Documentation

Visit `/api-docs` when your server is running to see the complete Swagger documentation for all file upload endpoints.