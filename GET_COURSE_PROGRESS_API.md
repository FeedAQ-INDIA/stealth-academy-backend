# Get Course Progress API Documentation

## Endpoint
`POST /getCourseProgress`

## Description
Retrieves course progress records with pagination support. If a specific `userId` is provided, it returns progress data for that user only. Otherwise, it returns progress records for all users (up to 10 records by default).

## Authentication
Requires authentication via `authMiddleware`. The requesting user must be authenticated.

## Request Body

### Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `userId` | Integer | No | null | If provided, filters progress data for this specific user. If omitted, returns data for all users. |
| `limit` | Integer | No | 10 | Maximum number of records to return per request. |
| `offset` | Integer | No | 0 | Number of records to skip (for pagination). |

### Example Request

#### Get progress for a specific user
```json
{
  "userId": 123,
  "limit": 10,
  "offset": 0
}
```

#### Get progress for all users (paginated)
```json
{
  "limit": 10,
  "offset": 0
}
```

## Response

### Success Response (200 OK)

```json
{
  "status": "success",
  "message": "Course progress fetched successfully",
  "data": [
    {
      "progressId": 1,
      "userId": 123,
      "courseId": 45,
      "courseContentId": 789,
      "progressStatus": "IN_PROGRESS",
      "activityDuration": 3600,
      "progressPercent": "75.50",
      "metadata": {},
      "user_course_content_progress_created_at": "2025-10-15T10:30:00.000Z",
      "user_course_content_progress_updated_at": "2025-10-21T14:20:00.000Z",
      "user": {
        "userId": 123,
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com"
      },
      "course": {
        "courseId": 45,
        "courseTitle": "JavaScript Fundamentals",
        "courseDescription": "Learn the basics of JavaScript"
      },
      "courseContent": {
        "courseContentId": 789,
        "courseContentTitle": "Variables and Data Types",
        "courseContentType": "CourseVideo",
        "courseContentDuration": 1800
      }
    }
    // ... more progress records
  ],
  "meta": {
    "requestedBy": 456,
    "targetUserId": 123,
    "pagination": {
      "total": 50,
      "limit": 10,
      "offset": 0,
      "hasMore": true,
      "totalPages": 5,
      "currentPage": 1
    }
  }
}
```

### Error Response (500 Internal Server Error)

```json
{
  "status": "error",
  "message": "Failed to fetch course progress",
  "error": {
    "message": "Database connection error",
    "code": "GET_COURSE_PROGRESS_ERROR",
    "location": "getCourseProgress"
  },
  "meta": {
    "requestedBy": 456,
    "targetUserId": 123
  }
}
```

## Progress Status Values
- `ENROLLED` - User is enrolled but hasn't started
- `IN_PROGRESS` - User is actively working on the content
- `PAUSED` - User has paused their progress
- `COMPLETED` - User has completed the content
- `CERTIFIED` - User has been certified
- `CERTIFICATE_ISSUED` - Certificate has been issued

## Pagination Details

The response includes comprehensive pagination information:
- `total`: Total number of matching records
- `limit`: Number of records per page
- `offset`: Current offset (starting point)
- `hasMore`: Boolean indicating if more records are available
- `totalPages`: Total number of pages available
- `currentPage`: Current page number (1-indexed)

## Usage Examples

### Get first page of progress for user 123
```javascript
const response = await fetch('/getCourseProgress', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    userId: 123,
    limit: 10,
    offset: 0
  })
});
```

### Get second page of progress for all users
```javascript
const response = await fetch('/getCourseProgress', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    limit: 10,
    offset: 10
  })
});
```

## Notes
1. Records are ordered by `user_course_content_progress_updated_at` in descending order (most recently updated first)
2. The API includes related data (user, course, and course content) in the response
3. Authentication is required - the requesting user's ID is logged in the metadata
4. If no records are found, an empty array is returned with appropriate pagination info
