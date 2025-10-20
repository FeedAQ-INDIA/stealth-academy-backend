# Controller Refactoring Implementation Guide

## Complete Refactoring Pattern

This document shows the exact pattern to follow for refactoring each controller function.

## Step 1: Add Imports

At the top of each controller file, add:

```javascript
const { 
    createSuccessResponse, 
    createErrorResponse, 
    createPartialResponse,
    createWarning 
} = require("../utils/responseFormatter");
```

## Step 2: Function Refactoring Pattern

### Pattern Template

```javascript
async function functionName(req, res, next) {
    const startTime = Date.now(); // Track request duration
    
    try {
        // 1. Extract and validate parameters
        const { param1, param2 } = req.body; // or req.params, req.query
        
        // 2. Validate required fields (if any)
        if (!param1) {
            const response = createErrorResponse({
                status: 400,
                message: "param1 is required",
                errorCode: "MISSING_FIELD",
                source: "functionName",
                requestId: req.requestId,
                durationMs: Date.now() - startTime
            });
            return res.status(400).json(response);
        }
        
        // 3. Call service layer
        const result = await Service.method(params);
        
        // 4. Handle warnings (if partial success)
        const warnings = [];
        if (result.failed && result.failed.length > 0) {
            result.failed.forEach(item => {
                warnings.push(createWarning({
                    code: "OPERATION_FAILED",
                    message: `Failed: ${item.reason}`,
                    source: "functionName",
                    severity: "medium"
                }));
            });
        }
        
        // 5. Create success response
        const response = createSuccessResponse({
            status: 200, // or 201 for creation
            message: "Operation completed successfully",
            result: {
                // Transform service result into response format
                data: result,
                count: result?.length || 0
            },
            meta: {
                // Add contextual metadata
                userId: req.user?.userId,
                operation: "functionName",
                // ... other relevant metadata
            },
            warnings, // Include if any
            requestId: req.requestId,
            durationMs: Date.now() - startTime
        });
        
        res.status(200).json(response);
        
    } catch (err) {
        logger.error(`Error in functionName:`, err.message);
        
        // Determine error status and code based on error message
        let status = 500;
        let errorCode = "INTERNAL_ERROR";
        
        if (err.message === "Not found") {
            status = 404;
            errorCode = "RESOURCE_NOT_FOUND";
        } else if (err.message.includes("permission")) {
            status = 403;
            errorCode = "PERMISSION_DENIED";
        } else if (err.message.includes("required") || err.message.includes("invalid")) {
            status = 400;
            errorCode = "INVALID_REQUEST";
        }
        
        const response = createErrorResponse({
            status,
            message: err.message || "Error occurred during operation",
            errorCode,
            source: "functionName",
            errorDetails: {
                // Add relevant error context
                param1: param1
            },
            requestId: req.requestId,
            durationMs: Date.now() - startTime,
            stack: err.stack
        });
        
        res.status(status).json(response);
        next(err);
    }
}
```

## Step 3: Specific Controller Patterns

### CourseAccess Controller Pattern

```javascript
// Example: grantAccess function
async function grantAccess(req, res, next) {
    const startTime = Date.now();
    try {
        const { courseId, userId, organizationId, accessLevel, expiresAt } = req.body;
        
        const accessData = { /* ... */ };
        const access = await CourseAccessService.grantAccess(accessData);
        
        const response = createSuccessResponse({
            status: 201,
            message: "Access granted successfully",
            result: { access },
            meta: {
                courseId,
                accessLevel,
                grantedBy: req.user.userId
            },
            requestId: req.requestId,
            durationMs: Date.now() - startTime
        });
        
        res.status(201).json(response);
    } catch (err) {
        logger.error(`Error in grantAccess:`, err.message);
        
        let status = 500;
        let errorCode = "GRANT_ACCESS_ERROR";
        
        if (err.message === "Course not found") {
            status = 404;
            errorCode = "COURSE_NOT_FOUND";
        }
        
        const response = createErrorResponse({
            status,
            message: err.message || "Error granting access",
            errorCode,
            source: "grantAccess",
            requestId: req.requestId,
            durationMs: Date.now() - startTime,
            stack: err.stack
        });
        
        res.status(status).json(response);
        next(err);
    }
}
```

### CourseBuilder Controller Pattern

```javascript
async function createCourseBuilder(req, res) {
    const startTime = Date.now();
    try {
        const { /* params */ } = req.body;
        const userId = req.user?.userId;
        
        // Validation
        if (!userId) {
            return res.status(401).json(createErrorResponse({
                status: 401,
                message: 'User ID is required',
                errorCode: 'UNAUTHORIZED',
                source: 'createCourseBuilder',
                requestId: req.requestId,
                durationMs: Date.now() - startTime
            }));
        }
        
        const result = await CourseBuilderService.method(/* params */);
        
        return res.status(201).json(createSuccessResponse({
            status: 201,
            message: 'Course builder created successfully',
            result: { courseBuilder: result.data },
            meta: {
                operation: result.operation,
                userId
            },
            requestId: req.requestId,
            durationMs: Date.now() - startTime
        }));
        
    } catch (error) {
        logger.error('Error in createCourseBuilder:', error);
        
        let status = 500;
        let errorCode = "CREATE_COURSE_BUILDER_ERROR";
        
        if (error.message === "Insufficient credit balance") {
            status = 402;
            errorCode = "INSUFFICIENT_CREDITS";
        }
        
        return res.status(status).json(createErrorResponse({
            status,
            message: error.message || 'Failed to create course builder',
            errorCode,
            source: 'createCourseBuilder',
            requestId: req.requestId,
            durationMs: Date.now() - startTime,
            stack: error.stack
        }));
    }
}
```

### Credit Controller Pattern

```javascript
async function getUserCreditBalance(req, res, next) {
    const startTime = Date.now();
    try {
        const { userId } = req.body;
        const targetUserId = userId || req.user.userId;
        
        const balance = await CreditService.getUserCreditBalance(targetUserId);
        
        res.status(200).json(createSuccessResponse({
            status: 200,
            message: "Credit balance fetched successfully",
            result: { 
                balance,
                userId: targetUserId
            },
            meta: {
                currency: "credits",
                fetchedAt: new Date().toISOString()
            },
            requestId: req.requestId,
            durationMs: Date.now() - startTime
        }));
    } catch (err) {
        logger.error(`Error in getUserCreditBalance:`, err.message);
        
        res.status(500).json(createErrorResponse({
            status: 500,
            message: err.message || "Error fetching credit balance",
            errorCode: "CREDIT_BALANCE_ERROR",
            source: "getUserCreditBalance",
            requestId: req.requestId,
            durationMs: Date.now() - startTime,
            stack: err.stack
        }));
        next(err);
    }
}
```

### Notes Controller Pattern (Class-based)

```javascript
class NotesController {
    async saveNoteWithFiles(req, res, next) {
        const startTime = Date.now();
        try {
            // Validation
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json(createErrorResponse({
                    status: 400,
                    message: 'Validation errors',
                    errorCode: 'VALIDATION_ERROR',
                    errorDetails: { errors: errors.array() },
                    source: 'saveNoteWithFiles',
                    requestId: req.requestId,
                    durationMs: Date.now() - startTime
                }));
            }
            
            const userId = req.user.userId;
            const files = req.files || [];
            // ... processing ...
            
            const result = await NotesService.saveNoteWithFiles(noteData, files);
            
            res.status(200).json(createSuccessResponse({
                status: 200,
                message: result.message,
                result: { note: result.data },
                meta: {
                    filesUploaded: files.length,
                    userId
                },
                requestId: req.requestId,
                durationMs: Date.now() - startTime
            }));
            
        } catch (error) {
            logger.error('Save note error:', error);
            
            res.status(500).json(createErrorResponse({
                status: 500,
                message: error.message || 'Failed to save note',
                errorCode: 'SAVE_NOTE_ERROR',
                source: 'saveNoteWithFiles',
                requestId: req.requestId,
                durationMs: Date.now() - startTime,
                stack: error.stack
            }));
        }
    }
}
```

## Step 4: Error Code Mapping

### Common Error Mappings

| Service Error Message | HTTP Status | Error Code |
|----------------------|-------------|------------|
| "Not found" | 404 | `RESOURCE_NOT_FOUND` |
| "Course not found" | 404 | `COURSE_NOT_FOUND` |
| "User not found" | 404 | `USER_NOT_FOUND` |
| "Access denied" | 403 | `ACCESS_DENIED` |
| "Permission denied" | 403 | `PERMISSION_DENIED` |
| "Unauthorized" | 401 | `UNAUTHORIZED` |
| "Insufficient credits" | 402 | `INSUFFICIENT_CREDITS` |
| "Invalid..." | 400 | `INVALID_REQUEST` |
| "...required" | 400 | `MISSING_FIELD` |
| "Already exists" | 409 | `RESOURCE_CONFLICT` |
| "YouTube API..." | 502 | `EXTERNAL_API_ERROR` |

## Step 5: Response Status Codes

- **200**: Successful retrieval
- **201**: Successful creation
- **206**: Partial success (with warnings)
- **400**: Bad request / Validation error
- **401**: Unauthorized
- **402**: Payment required (credits)
- **403**: Forbidden
- **404**: Not found
- **409**: Conflict
- **500**: Internal server error
- **502**: Bad gateway / External API error

## Step 6: Metadata Guidelines

### Common Metadata Fields

```javascript
meta: {
    // Identification
    userId: req.user?.userId,
    orgId: req.user?.organizationId,
    
    // Operation context
    operation: "create" | "update" | "delete" | "fetch",
    operationBy: req.user?.userId,
    
    // Results summary
    totalRecords: data.length,
    successCount: successful.length,
    failureCount: failed.length,
    
    // Pagination (if applicable)
    page: page,
    limit: limit,
    offset: offset,
    hasMore: hasMore,
    
    // Timestamps
    operatedAt: new Date().toISOString(),
    timestamp: new Date().toISOString()
}
```

## Step 7: Warnings Usage

```javascript
const warnings = [];

// Add warnings for partial failures
if (result.failed && result.failed.length > 0) {
    result.failed.forEach(item => {
        warnings.push(createWarning({
            code: "OPERATION_FAILED",
            message: `Failed to process ${item.id}: ${item.reason}`,
            source: "functionName",
            severity: "medium" // low, medium, high
        }));
    });
}

// Add warnings for deprecated features
warnings.push(createWarning({
    code: "DEPRECATED_FEATURE",
    message: "This endpoint will be deprecated in v2.0",
    source: "functionName",
    severity: "low"
}));

// Add warnings for service issues
warnings.push(createWarning({
    code: "SERVICE_DEGRADED",
    message: "External service response time is higher than normal",
    source: "externalService",
    severity: "high"
}));
```

## Step 8: Partial Response (206) Example

```javascript
async function getUserProfile(req, res, next) {
    const startTime = Date.now();
    try {
        const userId = req.user.userId;
        
        // Try to fetch multiple parts
        let user = null;
        let courses = null;
        const warnings = [];
        
        try {
            user = await UserService.getUser(userId);
        } catch (err) {
            warnings.push(createWarning({
                code: "USER_SERVICE_ERROR",
                message: "Failed to fetch user details",
                source: "user-service",
                severity: "high"
            }));
        }
        
        try {
            courses = await CourseService.getUserCourses(userId);
        } catch (err) {
            warnings.push(createWarning({
                code: "COURSE_SERVICE_UNAVAILABLE",
                message: "Failed to fetch enrolled courses due to backend timeout.",
                source: "course-service",
                severity: "medium"
            }));
        }
        
        // Determine if partial or full success
        const availableFields = [];
        const missingFields = [];
        
        if (user) availableFields.push("user");
        else missingFields.push("user");
        
        if (courses) availableFields.push("courses");
        else missingFields.push("courses");
        
        // If all failed, return error
        if (availableFields.length === 0) {
            return res.status(500).json(createErrorResponse({
                status: 500,
                message: "Failed to fetch any profile data",
                errorCode: "PROFILE_FETCH_ERROR",
                source: "getUserProfile",
                requestId: req.requestId,
                durationMs: Date.now() - startTime
            }));
        }
        
        // If partial success, use 206
        if (missingFields.length > 0) {
            const response = createPartialResponse({
                message: "User profile fetched partially",
                result: { user, courses },
                availableFields,
                missingFields,
                warnings,
                requestId: req.requestId,
                durationMs: Date.now() - startTime
            });
            return res.status(206).json(response);
        }
        
        // Full success
        const response = createSuccessResponse({
            status: 200,
            message: "User profile fetched successfully",
            result: { user, courses },
            meta: {
                userId,
                totalCourses: courses?.length || 0
            },
            requestId: req.requestId,
            durationMs: Date.now() - startTime
        });
        
        res.status(200).json(response);
        
    } catch (err) {
        logger.error('Error in getUserProfile:', err);
        
        res.status(500).json(createErrorResponse({
            status: 500,
            message: err.message || "Error fetching user profile",
            errorCode: "PROFILE_FETCH_ERROR",
            source: "getUserProfile",
            requestId: req.requestId,
            durationMs: Date.now() - startTime,
            stack: err.stack
        }));
        next(err);
    }
}
```

## Step 9: Checklist for Each Function

- [ ] Add `const startTime = Date.now();` at function start
- [ ] Wrap entire function in try-catch
- [ ] Validate required parameters early
- [ ] Use `createErrorResponse()` for validation errors
- [ ] Call service layer method
- [ ] Handle partial success with warnings if applicable
- [ ] Use `createSuccessResponse()` or `createPartialResponse()`
- [ ] Include relevant metadata
- [ ] Map service errors to appropriate HTTP status codes
- [ ] Include `requestId` and `durationMs` in all responses
- [ ] Use `res.json()` instead of `res.send()`
- [ ] Return appropriate HTTP status codes

## Step 10: Testing Checklist

After refactoring each controller, test:

- [ ] Success case returns correct structure
- [ ] Error cases return correct error codes
- [ ] Partial success returns 206 with warnings
- [ ] Request ID is present in response
- [ ] Duration is tracked correctly
- [ ] Metadata contains relevant information
- [ ] Stack traces only appear in development mode
- [ ] HTTP status codes match the response structure

