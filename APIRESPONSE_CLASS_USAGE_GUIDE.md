# ApiResponse Class - Complete Usage Guide

## Overview

The `ApiResponse` class provides a clean, object-oriented approach to generating standardized API responses. Instead of using utility functions, you create an instance of the class for each request and use its fluent interface to build responses.

## Installation

The `ApiResponse` class is located in `src/utils/responseFormatter.js` and requires the `uuid` package (already installed).

## Basic Usage

### Import the Class

```javascript
const { ApiResponse } = require("../utils/responseFormatter");
```

### Create Instance in Controller

```javascript
async function myControllerFunction(req, res, next) {
    const apiResponse = new ApiResponse(req, res);
    
    try {
        // Your logic here
        const data = await SomeService.getData();
        
        // Build and send response
        apiResponse
            .status(200)
            .withMessage("Data fetched successfully")
            .withData({ items: data })
            .withMeta({ count: data.length })
            .success();
            
    } catch (err) {
        logger.error('Error:', err);
        apiResponse.handleError(err, 'myControllerFunction');
        next(err);
    }
}
```

## ApiResponse Class Methods

### Constructor

```javascript
new ApiResponse(req, res)
```

**Parameters:**
- `req` - Express request object
- `res` - Express response object

**What it does:**
- Automatically tracks request start time
- Extracts or generates request ID
- Initializes response properties

### Fluent Interface Methods (Chainable)

#### `.status(code)`
Set the HTTP status code

```javascript
apiResponse.status(201)  // Created
apiResponse.status(404)  // Not Found
apiResponse.status(500)  // Internal Server Error
```

#### `.withMessage(msg)`
Set the response message

```javascript
apiResponse.withMessage("User created successfully")
```

#### `.withData(data)`
Set the result data

```javascript
apiResponse.withData({ user: userData })
apiResponse.withData({ items: items, count: items.length })
```

#### `.withMeta(meta)`
Add metadata (can be called multiple times, merges objects)

```javascript
apiResponse.withMeta({ userId: 123, operation: 'create' })
apiResponse.withMeta({ timestamp: Date.now() })  // Merges with previous
```

#### `.addWarning(code, message, source, severity)`
Add a warning to the response

```javascript
apiResponse.addWarning(
    "SERVICE_DEGRADED",
    "External service response time is higher than normal",
    "external-api",
    "medium"  // low, medium, or high
)
```

#### `.withError(error, code, source, details)`
Set error information (for error responses)

```javascript
apiResponse.withError(
    err,                    // Error object or string
    "VALIDATION_ERROR",     // Error code
    "validateUser",         // Source function
    { field: "email" }      // Additional details
)
```

### Terminal Methods (Send Response)

#### `.success()`
Send a success response (200, 201, etc.)

```javascript
apiResponse
    .status(200)
    .withMessage("Success")
    .withData({ result: data })
    .success();  // Sends response
```

**Response Structure:**
```json
{
  "status": 200,
  "success": true,
  "message": "Success",
  "data": {
    "result": { /* data */ },
    "meta": { "timestamp": "2025-10-19T..." }
  },
  "warnings": [],
  "error": null,
  "trace": {
    "requestId": "req_abc123",
    "durationMs": 45
  }
}
```

#### `.partial(availableFields, missingFields)`
Send a partial success response (206)

```javascript
apiResponse
    .withMessage("User profile fetched partially")
    .withData({ user: userData, courses: null })
    .addWarning("COURSE_SERVICE_UNAVAILABLE", "Failed to fetch courses", "course-service", "medium")
    .partial(["user"], ["courses"]);  // Sends 206 response
```

**Response Structure:**
```json
{
  "status": 206,
  "success": true,
  "message": "User profile fetched partially",
  "data": {
    "result": { "user": {...}, "courses": null },
    "meta": {
      "partial": true,
      "availableFields": ["user"],
      "missingFields": ["courses"],
      "timestamp": "2025-10-19T..."
    }
  },
  "warnings": [
    {
      "code": "COURSE_SERVICE_UNAVAILABLE",
      "message": "Failed to fetch courses",
      "source": "course-service",
      "severity": "medium"
    }
  ],
  "error": null,
  "trace": {
    "requestId": "req_abc123",
    "durationMs": 120
  }
}
```

#### `.error()`
Send an error response (400, 404, 500, etc.)

```javascript
apiResponse
    .status(404)
    .withMessage("User not found")
    .withError("User not found", "USER_NOT_FOUND", "getUser")
    .error();  // Sends response
```

**Response Structure:**
```json
{
  "status": 404,
  "success": false,
  "message": "User not found",
  "data": null,
  "warnings": [],
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found",
    "source": "getUser",
    "stack": "Error stack (dev only)"
  },
  "trace": {
    "requestId": "req_abc123",
    "durationMs": 25
  }
}
```

#### `.handleError(err, source, customMappings)`
Automatically handle errors with smart status code mapping

```javascript
apiResponse.handleError(err, 'functionName', {
    'custom error message': 400,
    'another custom message': 403
});
```

**Built-in Error Mappings:**
- "not found" → 404
- "permission denied" → 403
- "unauthorized" → 401
- "insufficient credit" → 402
- "invalid" / "required" → 400
- "already exists" → 409
- "youtube api" / "external api" → 502
- Others → 500

## Complete Examples

### Example 1: Simple GET Request

```javascript
async function getUser(req, res, next) {
    const apiResponse = new ApiResponse(req, res);
    
    try {
        const userId = req.params.id;
        const user = await UserService.getUser(userId);
        
        apiResponse
            .status(200)
            .withMessage("User fetched successfully")
            .withData({ user })
            .withMeta({ userId, fetchedAt: new Date().toISOString() })
            .success();
            
    } catch (err) {
        logger.error('Error in getUser:', err);
        apiResponse.handleError(err, 'getUser');
        next(err);
    }
}
```

### Example 2: POST with Creation

```javascript
async function createCourse(req, res, next) {
    const apiResponse = new ApiResponse(req, res);
    
    try {
        const { title, description } = req.body;
        
        // Validation
        if (!title) {
            return apiResponse
                .status(400)
                .withMessage("Title is required")
                .withError("Title is required", "MISSING_FIELD", "createCourse")
                .error();
        }
        
        const course = await CourseService.create({ title, description });
        
        apiResponse
            .status(201)
            .withMessage("Course created successfully")
            .withData({ course })
            .withMeta({ 
                createdBy: req.user.userId,
                createdAt: new Date().toISOString()
            })
            .success();
            
    } catch (err) {
        logger.error('Error in createCourse:', err);
        apiResponse.handleError(err, 'createCourse', {
            'insufficient credits': 402,
            'course already exists': 409
        });
        next(err);
    }
}
```

### Example 3: Multiple Operations with Warnings

```javascript
async function inviteUsers(req, res, next) {
    const apiResponse = new ApiResponse(req, res);
    
    try {
        const { courseId, invites } = req.body;
        
        const result = await CourseService.inviteMultiple(courseId, invites);
        
        // Add warnings for failures
        if (result.failed && result.failed.length > 0) {
            result.failed.forEach(failure => {
                apiResponse.addWarning(
                    "INVITE_FAILED",
                    `Failed to invite ${failure.email}: ${failure.reason}`,
                    "inviteUsers",
                    "medium"
                );
            });
        }
        
        apiResponse
            .status(201)
            .withMessage("Invite process completed")
            .withData({
                successful: result.successful,
                failed: result.failed,
                totalInvited: result.successful.length,
                totalFailed: result.failed.length
            })
            .withMeta({
                courseId,
                invitedBy: req.user.userId,
                totalRequested: invites.length
            })
            .success();
            
    } catch (err) {
        logger.error('Error in inviteUsers:', err);
        apiResponse.handleError(err, 'inviteUsers');
        next(err);
    }
}
```

### Example 4: Partial Response (206)

```javascript
async function getUserDashboard(req, res, next) {
    const apiResponse = new ApiResponse(req, res);
    
    try {
        const userId = req.user.userId;
        
        let user = null;
        let courses = null;
        let stats = null;
        const availableFields = [];
        const missingFields = [];
        
        // Try to fetch user
        try {
            user = await UserService.getUser(userId);
            availableFields.push("user");
        } catch (err) {
            missingFields.push("user");
            apiResponse.addWarning(
                "USER_FETCH_FAILED",
                "Failed to fetch user details",
                "user-service",
                "high"
            );
        }
        
        // Try to fetch courses
        try {
            courses = await CourseService.getUserCourses(userId);
            availableFields.push("courses");
        } catch (err) {
            missingFields.push("courses");
            apiResponse.addWarning(
                "COURSE_FETCH_FAILED",
                "Failed to fetch courses",
                "course-service",
                "medium"
            );
        }
        
        // Try to fetch stats
        try {
            stats = await StatsService.getUserStats(userId);
            availableFields.push("stats");
        } catch (err) {
            missingFields.push("stats");
            apiResponse.addWarning(
                "STATS_FETCH_FAILED",
                "Failed to fetch statistics",
                "stats-service",
                "low"
            );
        }
        
        // If nothing succeeded, return error
        if (availableFields.length === 0) {
            return apiResponse
                .status(500)
                .withMessage("Failed to fetch dashboard data")
                .withError("All services failed", "DASHBOARD_ERROR", "getUserDashboard")
                .error();
        }
        
        // If partial success, return 206
        if (missingFields.length > 0) {
            return apiResponse
                .withMessage("Dashboard fetched partially")
                .withData({ user, courses, stats })
                .withMeta({ userId })
                .partial(availableFields, missingFields);
        }
        
        // Full success
        apiResponse
            .status(200)
            .withMessage("Dashboard fetched successfully")
            .withData({ user, courses, stats })
            .withMeta({ userId })
            .success();
            
    } catch (err) {
        logger.error('Error in getUserDashboard:', err);
        apiResponse.handleError(err, 'getUserDashboard');
        next(err);
    }
}
```

### Example 5: Early Return with Error

```javascript
async function updateCourse(req, res, next) {
    const apiResponse = new ApiResponse(req, res);
    
    try {
        const { courseId } = req.params;
        const { title, description } = req.body;
        const userId = req.user.userId;
        
        // Check permissions
        const hasAccess = await CourseService.checkAccess(courseId, userId);
        if (!hasAccess) {
            return apiResponse
                .status(403)
                .withMessage("You don't have permission to update this course")
                .withError(
                    "Permission denied",
                    "PERMISSION_DENIED",
                    "updateCourse",
                    { courseId, userId }
                )
                .error();
        }
        
        const updatedCourse = await CourseService.update(courseId, { title, description });
        
        apiResponse
            .status(200)
            .withMessage("Course updated successfully")
            .withData({ course: updatedCourse })
            .withMeta({
                courseId,
                updatedBy: userId,
                updatedFields: Object.keys({ title, description })
            })
            .success();
            
    } catch (err) {
        logger.error('Error in updateCourse:', err);
        apiResponse.handleError(err, 'updateCourse');
        next(err);
    }
}
```

## Middleware Setup

Add this to your `server.js`:

```javascript
const { requestIdMiddleware } = require('./src/utils/responseFormatter');

// Add after other middleware (body-parser, cors, etc.)
app.use(requestIdMiddleware);  // Generates unique request IDs
```

## Best Practices

1. **Always create instance at function start**
   ```javascript
   const apiResponse = new ApiResponse(req, res);
   ```

2. **Use handleError for automatic error mapping**
   ```javascript
   apiResponse.handleError(err, 'functionName');
   ```

3. **Add metadata for context**
   ```javascript
   .withMeta({ userId: req.user.userId, operation: 'create' })
   ```

4. **Use warnings for partial failures**
   ```javascript
   .addWarning("CODE", "message", "source", "severity")
   ```

5. **Return early for validation errors**
   ```javascript
   if (!requiredField) {
       return apiResponse.status(400).withMessage("...").error();
   }
   ```

6. **Chain methods for cleaner code**
   ```javascript
   apiResponse
       .status(200)
       .withMessage("Success")
       .withData(data)
       .withMeta(meta)
       .success();
   ```

## Migration from Old Pattern

**OLD:**
```javascript
res.status(200).send({
    status: 200,
    message: "Success",
    data: result
});
```

**NEW:**
```javascript
const apiResponse = new ApiResponse(req, res);
apiResponse
    .status(200)
    .withMessage("Success")
    .withData({ result })
    .success();
```

## Status Codes Reference

| Code | Usage | Example |
|------|-------|---------|
| 200 | Success (GET, PUT, DELETE) | Data retrieved/updated |
| 201 | Created (POST) | Resource created |
| 206 | Partial Content | Some data unavailable |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Not authenticated |
| 402 | Payment Required | Insufficient credits |
| 403 | Forbidden | No permission |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Already exists |
| 500 | Internal Error | Unexpected error |
| 502 | Bad Gateway | External API failed |
| 503 | Service Unavailable | Service down |

## Testing

```javascript
// Test with curl
curl -X GET http://localhost:3000/api/users/1 \
  -H "Authorization: Bearer <token>"

// Expected response
{
  "status": 200,
  "success": true,
  "message": "User fetched successfully",
  "data": {
    "result": { "user": {...} },
    "meta": { "userId": 1, "timestamp": "2025-10-19T..." }
  },
  "warnings": [],
  "error": null,
  "trace": {
    "requestId": "req_abc123",
    "durationMs": 45
  }
}
```

