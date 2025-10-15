# Enhanced Notes API with File Attachment Support

## Overview

The Notes API has been significantly refactored to support file attachments while maintaining backward compatibility. The new system integrates seamlessly with the S3 file upload service and provides comprehensive file management capabilities.

## Key Features

### 🚀 New Capabilities
- **File Attachments**: Upload multiple files with notes
- **S3 Integration**: Files stored securely in S3 with proper access controls
- **Metadata Management**: Rich metadata support for files and notes
- **Signed URLs**: Secure access to private file attachments
- **Transaction Safety**: Database transactions ensure data consistency
- **Backward Compatibility**: Legacy endpoints still work

### 🔧 Refactored Components
1. **File Upload Middleware** - Reusable across endpoints
2. **Notes Service** - Centralized business logic
3. **Notes Controller** - Clean API endpoints
4. **Notes Entity** - Enhanced with virtual fields and indexes

## API Endpoints

### Enhanced Notes Endpoints

#### 1. Save Note with Files
```http
POST /api/saveNote
Content-Type: multipart/form-data
Authorization: Bearer <token>

Form Data:
- courseId: 123
- courseContentId: 456 (optional for updates)
- noteContent: "My study notes with attachments"
- noteRefTimestamp: 1234.56 (optional)
- metadata: '{"tags": ["important", "review"]}' (optional JSON string)
- files[]: <file1> (optional, up to 5 files)
- files[]: <file2> (optional)
- notesId: 789 (optional, for updates)
```

**Response:**
```json
{
  "success": true,
  "message": "Notes created successfully",
  "data": {
    "noteId": 123,
    "hasAttachments": true,
    "attachmentCount": 2,
    "attachments": [
      {
        "fileId": 456,
        "fileName": "study-diagram.png",
        "fileUrl": "https://...",
        "mimeType": "image/png",
        "fileSize": 102400
      }
    ],
    "metadata": {...}
  }
}
```

#### 2. Get Note with Attachments
```http
GET /api/getNote/123
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "noteId": 123,
    "noteContent": "My study notes",
    "metadata": {
      "attachments": [
        {
          "fileId": 456,
          "fileName": "study-diagram.png",
          "signedUrl": "https://s3.../signed-url-with-temp-access",
          "mimeType": "image/png",
          "fileSize": 102400
        }
      ],
      "hasAttachments": true,
      "attachmentCount": 1
    }
  }
}
```

#### 3. Get User Notes with Attachment Info
```http
POST /api/getUserNotes
Content-Type: application/json
Authorization: Bearer <token>

{
  "courseId": 123,
  "courseContentId": 456, // optional
  "limit": 20,
  "offset": 0
}
```

#### 4. Delete Note with Attachments
```http
POST /api/deleteNote
Content-Type: application/json
Authorization: Bearer <token>

{
  "notesId": 123
}
```

### Legacy Endpoints (Backward Compatibility)
- `POST /api/saveNoteLegacy` - Original saveNote without file support
- All existing note endpoints continue to work

## File Upload Improvements

### Refactored File Upload Routes
- **Simplified structure** with reusable middleware
- **Better error handling** and validation
- **Consistent response format**
- **Reduced code duplication**

### New File Upload Middleware
```javascript
const { optionalFileUpload, singleFileUpload, multipleFileUpload } = require('../middleware/fileUploadMiddleware');

// Usage examples:
router.post('/upload', ...singleFileUpload('file'), controller.upload);
router.post('/multi', ...multipleFileUpload('files', 10), controller.uploadMultiple);
router.post('/notes', ...optionalFileUpload('files', 5), controller.saveNote);
```

## Database Enhancements

### Notes Entity Updates
```javascript
// New virtual fields
v_has_attachments: boolean
v_attachment_count: number
v_attachment_types: string[] // e.g., ['image', 'document']

// Enhanced metadata structure
metadata: {
  attachments: [
    {
      fileId: number,
      fileName: string,
      fileUrl: string,
      mimeType: string,
      fileSize: number
    }
  ],
  hasAttachments: boolean,
  attachmentCount: number,
  // ... other custom metadata
}

// New indexes for better performance
- idx_notes_created_at
- idx_notes_user_course
- idx_notes_metadata_gin (JSONB GIN index)
```

## Usage Examples

### Frontend Implementation

#### Upload Note with Files
```javascript
const formData = new FormData();
formData.append('courseId', '123');
formData.append('noteContent', 'My study notes');
formData.append('files', file1);
formData.append('files', file2);

const response = await fetch('/api/saveNote', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

#### Display Note with Attachments
```javascript
const noteResponse = await fetch(`/api/getNote/${noteId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

const note = await noteResponse.json();

// Access signed URLs for immediate use
note.data.metadata.attachments.forEach(attachment => {
  console.log(`File: ${attachment.fileName}`);
  console.log(`Download URL: ${attachment.signedUrl}`);
});
```

## Security Features

### File Access Control
- **Private by default**: Notes attachments are stored as private files
- **Signed URLs**: Temporary access with configurable expiry
- **User authorization**: Users can only access their own note attachments
- **File validation**: Strict MIME type and size validation

### Transaction Safety
- **Database transactions**: Ensure consistency between notes and file records
- **Rollback on failure**: If file upload fails, note creation is rolled back
- **Cleanup on delete**: When notes are deleted, associated files are also removed

## Migration Guide

### For Existing Applications

1. **No immediate changes required** - existing endpoints work as before
2. **Gradual migration** - update frontend to use new endpoints when ready
3. **Enhanced features** - leverage file attachments for richer note-taking

### For New Applications

1. Use the new `/api/saveNote` endpoint with file support
2. Implement attachment display using signed URLs
3. Handle file-related errors gracefully

## Performance Considerations

### Database Optimizations
- JSONB indexes for fast metadata queries
- Composite indexes for user + course queries
- Virtual fields for common attachment properties

### File Storage Optimizations
- S3 storage with proper folder structure
- Lazy loading of signed URLs
- Efficient batch operations

## Error Handling

### Common Error Scenarios
1. **File upload failures** - Graceful degradation, note saved without files
2. **File size limits** - Clear error messages with size constraints
3. **Invalid file types** - Validation with allowed MIME types
4. **Storage quota** - Integration with user storage limits
5. **Network issues** - Retry mechanisms for file operations

## Monitoring and Logging

### Key Metrics to Track
- File upload success/failure rates
- Average file sizes and types
- Note creation with/without attachments
- Signed URL generation frequency
- Storage usage per user

### Log Events
- File uploads and deletions
- Note creation/updates with attachment counts
- Failed file operations with error details
- Performance metrics for file operations

## Future Enhancements

### Planned Features
1. **File versioning** - Track file updates and history
2. **File sharing** - Share note attachments with other users
3. **File preview** - Generate thumbnails and previews
4. **Bulk operations** - Batch upload and management
5. **File search** - Search within file contents
6. **Storage analytics** - Usage reports and optimization suggestions

### API Versioning
- Current version: `v2.0.0`
- Legacy support maintained for `v1.x` endpoints
- Clear migration path for future versions