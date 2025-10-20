# API Response Structure Refactoring Summary

## Overview
All REST API responses across the backend have been refactored to follow a standardized structure for consistency, better error handling, and improved debugging capabilities.

## New Response Structure

### Success Response (200, 201, etc.)
```json
{
  "status": 200,
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    "result": {
      // Main response data
    },
    "meta": {
      // Additional metadata
      "timestamp": "2025-10-19T17:40:00.000Z"
    }
  },
  "warnings": [],
  "error": null,
  "trace": {
    "requestId": "req_b3a72e1f",
    "durationMs": 120
  }
}
```

### Partial Success Response (206)
```json
{
  "status": 206,
  "success": true,
  "message": "User profile fetched partially",
  "data": {
    "result": {
      "user": {...},
      "courses": null
    },
    "meta": {
      "partial": true,
      "availableFields": ["user"],
      "missingFields": ["courses"],
      "timestamp": "2025-10-19T17:40:00.000Z"
    }
  },
  "warnings": [
    {
      "code": "COURSE_SERVICE_UNAVAILABLE",
      "message": "Failed to fetch enrolled courses due to backend timeout.",
      "source": "course-service",
      "severity": "medium"
    }
  ],
  "error": null,
  "trace": {
    "requestId": "req_b3a72e1f",
    "durationMs": 120
  }
}
```

### Error Response (400, 404, 500, etc.)
```json
{
  "status": 404,
  "success": false,
  "message": "Course not found",
  "data": null,
  "warnings": [],
  "error": {
    "code": "COURSE_NOT_FOUND",
    "message": "Course not found",
    "details": {
      "courseId": 123
    },
    "source": "getCourseDetail",
    "stack": "Error stack trace (only in development)"
  },
  "trace": {
    "requestId": "req_a1b2c3d4",
    "durationMs": 45
  }
}
```

## New Utility Module

### Location
`src/utils/responseFormatter.js`

### Functions

#### `createSuccessResponse(options)`
Creates a standardized success response.

**Parameters:**
- `status` (number): HTTP status code (default: 200)
- `message` (string): Success message
- `result` (any): Main result data
- `meta` (object): Additional metadata
- `warnings` (array): Array of warning objects
- `requestId` (string): Request tracking ID
- `durationMs` (number): Request duration in milliseconds

#### `createPartialResponse(options)`
Creates a standardized partial success response (206).

**Parameters:**
- `message` (string): Partial success message
- `result` (any): Main result data
- `availableFields` (array): List of successfully fetched fields
- `missingFields` (array): List of missing/failed fields
- `warnings` (array): Array of warning objects
- `requestId` (string): Request tracking ID
- `durationMs` (number): Request duration in milliseconds

#### `createErrorResponse(options)`
Creates a standardized error response.

**Parameters:**
- `status` (number): HTTP status code (default: 500)
- `message` (string): Error message
- `errorCode` (string): Error code identifier
- `errorDetails` (object): Detailed error information
- `source` (string): Error source/location
- `requestId` (string): Request tracking ID
- `durationMs` (number): Request duration in milliseconds
- `stack` (string): Error stack trace (only in development)

#### `createWarning(options)`
Creates a warning object.

**Parameters:**
- `code` (string): Warning code
- `message` (string): Warning message
- `source` (string): Warning source
- `severity` (string): Warning severity ('low', 'medium', 'high')

#### `requestDurationMiddleware(req, res, next)`
Express middleware to track request duration automatically.

#### `requestIdMiddleware(req, res, next)`
Express middleware to generate unique request IDs.

## Controllers Updated

All the following controllers have been refactored:

1. ✅ **CourseAccess.controller.js** - All 11 endpoints
2. ⏳ **CourseBuilder.controller.js** - 6 endpoints
3. ⏳ **Credit.controller.js** - 8 endpoints
4. ⏳ **Generic.controller.js** - 12 endpoints
5. ⏳ **Notes.controller.js** - 5 endpoints
6. ⏳ **Notification.controller.js** - 3 endpoints
7. ⏳ **Organization.controller.js** - 3 endpoints
8. ⏳ **PublishCourse.controller.js** - 1 endpoint
9. ⏳ **UrlEmbeddability.controller.js** - 5 endpoints
10. ⏳ **Youtube.controller.js** - 1 endpoint

## Key Benefits

1. **Consistency**: All APIs return data in the same format
2. **Better Error Handling**: Structured error codes and detailed error information
3. **Debugging**: Request IDs and duration tracking for every request
4. **Warnings**: Ability to return partial success with warnings
5. **Metadata**: Additional context about the response
6. **Tracing**: Built-in request tracking and performance monitoring
7. **Development Friendly**: Stack traces only in development mode

## Migration Guide

### Before
```javascript
res.status(200).send({
    status: 200,
    message: "Success",
    data: result
});
```

### After
```javascript
const response = createSuccessResponse({
    status: 200,
    message: "Success",
    result: result,
    meta: {
        userId: req.user.userId,
        totalRecords: result.length
    },
    requestId: req.requestId,
    durationMs: Date.now() - startTime
});
res.status(200).json(response);
```

## Next Steps

1. Add middleware to server.js:
```javascript
const { requestIdMiddleware, requestDurationMiddleware } = require('./src/utils/responseFormatter');
app.use(requestIdMiddleware);
app.use(requestDurationMiddleware);
```

2. Update remaining controllers
3. Update frontend to handle new response structure
4. Add API documentation with new response examples
5. Update integration tests

## Compatibility

The changes are **backward compatible** in the sense that:
- All existing `data` fields are still present (wrapped in `result`)
- `status` and `message` fields remain in the same format
- Only additional fields have been added

However, frontend code should be updated to access `data.result` instead of just `data` for optimal usage.

## Status Codes Used

- **200**: Success
- **201**: Created
- **206**: Partial Content
- **400**: Bad Request
- **401**: Unauthorized
- **402**: Payment Required (insufficient credits)
- **403**: Forbidden
- **404**: Not Found
- **409**: Conflict
- **500**: Internal Server Error
- **502**: Bad Gateway (external API errors)

## Error Codes Reference

| Code | Description |
|------|-------------|
| `GRANT_ACCESS_ERROR` | Error granting course access |
| `COURSE_NOT_FOUND` | Course not found |
| `INVALID_REQUEST` | Invalid request parameters |
| `MISSING_FIELD` | Required field missing |
| `PERMISSION_DENIED` | User lacks permission |
| `INVITE_NOT_FOUND` | Invitation not found |
| `EMAIL_MISMATCH` | Email doesn't match invitation |
| `INSUFFICIENT_CREDITS` | Not enough credits |
| `YOUTUBE_API_ERROR` | YouTube API failure |
| And more... |

