# YouTube Import API Documentation

## Overview
The `importFromYoutube` API endpoint allows users to import YouTube playlist content and convert it into a structured course content format.

## API Details

### Endpoint
```
POST /api/courseBuilder/importFromYoutube
```

### Authentication
Requires valid JWT token in Authorization header.

### Request Body
```json
{
  "playlistUrl": "https://www.youtube.com/playlist?list=PLAYLIST_ID"
}
```

### Response Structure
The API returns course content items with the following structure:

```json
{
  "success": true,
  "message": "YouTube playlist imported successfully",
  "data": {
    "playlistId": "PL9ooVrP1hQOFrNo8jK9Yb2g2eMDP7De7j",
    "totalVideos": 10,
    "courseContent": [
      {
        "courseContentCategory": "Video Content",
        "courseContentDuration": 4939,
        "courseContentId": "temp_content_1",
        "coursecontentIsLicensed": false,
        "courseContentSequence": 1,
        "courseContentTitle": "Video Title",
        "courseContentType": "CourseVideo",
        "courseContentTypeDetail": {
          "courseContentId": "temp_content_1",
          "courseId": "temp_course_id",
          "courseVideoDescription": "Video description...",
          "courseVideoId": "temp_video_1",
          "courseVideoTitle": "Video Title",
          "courseVideoUrl": "https://www.youtube.com/watch?v=VIDEO_ID",
          "createdAt": "2025-10-05T02:55:21.732Z",
          "duration": 4939,
          "isPreview": false,
          "metadata": {
            "channelTitle": "Channel Name",
            "publishedAt": "2024-01-26T15:31:21Z",
            "sourcePlatform": "YOUTUBE",
            "videoId": "VIDEO_ID"
          },
          "status": "READY",
          "thumbnailUrl": "https://i.ytimg.com/vi/VIDEO_ID/maxresdefault.jpg",
          "updatedAt": "2025-10-05T02:55:21.732Z",
          "userId": 1
        },
        "courseId": "temp_course_id",
        "createdAt": "2025-10-05T02:55:21.732Z",
        "isPublished": true,
        "metadata": {
          "contentType": "YOUTUBE_VIDEO",
          "sequence": 1,
          "videoId": "VIDEO_ID"
        },
        "status": "PUBLISHED",
        "updatedAt": "2025-10-05T02:55:21.732Z"
      }
    ],
    "errors": []
  }
}
```

## Course Content Structure

### Top Level Properties
- `courseContentCategory`: Always "Video Content" for YouTube imports
- `courseContentDuration`: Video duration in seconds
- `courseContentId`: Temporary content ID (format: "temp_content_N")
- `coursecontentIsLicensed`: Always false for imported content
- `courseContentSequence`: Sequential order starting from 1
- `courseContentTitle`: YouTube video title
- `courseContentType`: Always "CourseVideo" for video content
- `courseId`: Temporary course ID ("temp_course_id")
- `createdAt`/`updatedAt`: ISO timestamp strings
- `isPublished`: Always true for imported content
- `status`: Always "PUBLISHED" for imported content

### Course Content Type Detail (Nested Video Data)
- `courseContentId`: Reference to parent content
- `courseId`: Reference to course
- `courseVideoDescription`: YouTube video description
- `courseVideoId`: Temporary video ID (format: "temp_video_N")
- `courseVideoTitle`: YouTube video title
- `courseVideoUrl`: Original YouTube video URL
- `duration`: Video duration in seconds
- `isPreview`: Always false for imported content
- `status`: Always "READY" for imported content
- `thumbnailUrl`: YouTube thumbnail URL
- `userId`: ID of the user importing the content

### Metadata Objects
- **Content metadata**: Contains contentType, sequence, and videoId
- **Video metadata**: Contains channelTitle, publishedAt, sourcePlatform, and videoId

## Error Handling

### Common Error Responses

#### Invalid URL
```json
{
  "success": false,
  "message": "Invalid YouTube playlist URL. Please provide a valid playlist URL."
}
```

#### No Videos Found
```json
{
  "success": false,
  "message": "No videos found in the provided YouTube playlist"
}
```

#### YouTube API Issues
```json
{
  "success": false,
  "message": "YouTube API is not properly configured. Please contact administrator."
}
```

#### Authentication Error
```json
{
  "success": false,
  "message": "User ID is required for importing from YouTube"
}
```

## Implementation Details

### Files Modified
1. **CourseBuilder.controller.js**: Added `importFromYoutube` controller method
2. **CourseBuilder.service.js**: Updated `prepareYouTubeContentData` and exported it
3. **courseBuilder.route.js**: Added POST route with authentication

### Key Features
- ✅ Validates YouTube playlist URLs
- ✅ Extracts playlist ID automatically
- ✅ Fetches video metadata from YouTube API
- ✅ Converts to standardized course content format
- ✅ Maintains sequential ordering
- ✅ Includes comprehensive error handling
- ✅ Requires authentication
- ✅ Provides detailed logging

### Testing
Use the provided test script `test_import_youtube.js` to verify the implementation.

## Usage Example

```bash
curl -X POST http://localhost:3000/api/courseBuilder/importFromYoutube \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "playlistUrl": "https://www.youtube.com/playlist?list=PL9ooVrP1hQOFrNo8jK9Yb2g2eMDP7De7j"
  }'
```