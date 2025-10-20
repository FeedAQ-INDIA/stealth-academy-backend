# ApiResponse Quick Reference Guide

## Import Statement
```javascript
const { ApiResponse } = require("../utils/responseFormatter");
```

## Basic Usage Pattern

### 1. Initialize (at function start)
```javascript
async function myFunction(req, res, next) {
    const apiResponse = new ApiResponse(req, res);
    // ... rest of function
}
```

### 2. Success Response
```javascript
apiResponse
    .status(200)                           // HTTP status code
    .withMessage("Success message")        // User-friendly message
    .withData({ result: data })           // Response data
    .withMeta({ userId: req.user?.userId }) // Tracking metadata
    .success();                            // Send response
```

### 3. Error Response
```javascript
apiResponse
    .status(400)                           // HTTP status code
    .withMessage("Error message")         // User-friendly message
    .withError(
        error.message,                     // Error message
        "ERROR_CODE",                      // Error code
        "functionName"                     // Error source
    )
    .withMeta({ attemptedBy: userId })    // Context metadata
    .error();                              // Send response
```

### 4. Validation Error (Early Return)
```javascript
if (!requiredField) {
    return apiResponse
        .status(400)
        .withMessage("Field is required")
        .withError("Field is required", "MISSING_FIELD", "functionName")
        .error();
}
```

### 5. With Warnings (Partial Success)
```javascript
if (someItemsFailed) {
    apiResponse.addWarning(
        "WARNING_CODE",          // Warning code
        "Warning message",       // Warning message
        "functionName",          // Source
        "medium"                 // Severity: low, medium, high
    );
}

apiResponse
    .status(201)
    .withMessage("Completed with warnings")
    .withData({ successful, failed })
    .success();
```

## Status Code Guide

| Code | Use Case |
|------|----------|
| 200  | Successful GET/UPDATE/DELETE |
| 201  | Successful CREATE |
| 206  | Partial success |
| 400  | Validation error, bad input |
| 401  | Authentication required |
| 402  | Payment required (insufficient credits) |
| 403  | Permission denied |
| 404  | Resource not found |
| 409  | Conflict (duplicate) |
| 500  | Internal server error |
| 502  | External service error |

## Common Patterns

### Pattern 1: Simple GET
```javascript
async function getData(req, res) {
    const apiResponse = new ApiResponse(req, res);
    
    try {
        const data = await Service.getData(req.params.id);
        
        apiResponse
            .status(200)
            .withMessage("Data fetched successfully")
            .withData({ data })
            .withMeta({ id: req.params.id })
            .success();
    } catch (error) {
        apiResponse
            .status(500)
            .withMessage("Failed to fetch data")
            .withError(error.message, "GET_DATA_ERROR", "getData")
            .error();
    }
}
```

### Pattern 2: CREATE with Validation
```javascript
async function createItem(req, res) {
    const apiResponse = new ApiResponse(req, res);
    
    try {
        const { name, description } = req.body;
        
        // Validation
        if (!name || !description) {
            return apiResponse
                .status(400)
                .withMessage("Name and description are required")
                .withError("Missing required fields", "MISSING_FIELDS", "createItem")
                .error();
        }
        
        const item = await Service.create({ name, description });
        
        apiResponse
            .status(201)
            .withMessage("Item created successfully")
            .withData({ item })
            .withMeta({ 
                itemId: item.id,
                createdBy: req.user?.userId 
            })
            .success();
    } catch (error) {
        const status = error.message.includes('already exists') ? 409 : 500;
        
        apiResponse
            .status(status)
            .withMessage(error.message || "Failed to create item")
            .withError(error.message, "CREATE_ITEM_ERROR", "createItem")
            .error();
    }
}
```

### Pattern 3: UPDATE with Authorization
```javascript
async function updateItem(req, res) {
    const apiResponse = new ApiResponse(req, res);
    
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        
        if (!userId) {
            return apiResponse
                .status(401)
                .withMessage("Authentication required")
                .withError("Authentication required", "UNAUTHORIZED", "updateItem")
                .error();
        }
        
        const item = await Service.update(id, userId, req.body);
        
        apiResponse
            .status(200)
            .withMessage("Item updated successfully")
            .withData({ item })
            .withMeta({ 
                itemId: id,
                updatedBy: userId,
                updatedFields: Object.keys(req.body)
            })
            .success();
    } catch (error) {
        const errorMsg = error.message?.toLowerCase() || '';
        const status = errorMsg.includes('not found') ? 404 :
                      errorMsg.includes('permission') ? 403 : 500;
        
        apiResponse
            .status(status)
            .withMessage(error.message || "Failed to update item")
            .withError(error.message, "UPDATE_ITEM_ERROR", "updateItem")
            .withMeta({ itemId: req.params.id })
            .error();
    }
}
```

### Pattern 4: DELETE
```javascript
async function deleteItem(req, res) {
    const apiResponse = new ApiResponse(req, res);
    
    try {
        const { id } = req.params;
        
        await Service.delete(id);
        
        apiResponse
            .status(200)
            .withMessage("Item deleted successfully")
            .withData({ id, deleted: true })
            .withMeta({ 
                deletedBy: req.user?.userId,
                deletedAt: new Date().toISOString()
            })
            .success();
    } catch (error) {
        const status = error.message?.includes('not found') ? 404 : 500;
        
        apiResponse
            .status(status)
            .withMessage(error.message || "Failed to delete item")
            .withError(error.message, "DELETE_ITEM_ERROR", "deleteItem")
            .error();
    }
}
```

### Pattern 5: Batch Operation with Warnings
```javascript
async function batchProcess(req, res) {
    const apiResponse = new ApiResponse(req, res);
    
    try {
        const { items } = req.body;
        const result = await Service.processBatch(items);
        
        // Add warnings for failed items
        if (result.failed && result.failed.length > 0) {
            result.failed.forEach(failure => {
                apiResponse.addWarning(
                    "PROCESS_FAILED",
                    `Failed to process ${failure.id}: ${failure.reason}`,
                    "batchProcess",
                    "medium"
                );
            });
        }
        
        apiResponse
            .status(201)
            .withMessage("Batch process completed")
            .withData({
                successful: result.successful,
                failed: result.failed,
                totalProcessed: result.successful.length,
                totalFailed: result.failed.length
            })
            .withMeta({
                totalRequested: items.length,
                processedBy: req.user?.userId
            })
            .success();
    } catch (error) {
        apiResponse
            .status(500)
            .withMessage("Batch process failed")
            .withError(error.message, "BATCH_PROCESS_ERROR", "batchProcess")
            .error();
    }
}
```

## Error Categorization Template

```javascript
catch (error) {
    logger.error(`Error in functionName:`, error);
    
    const errorMessage = error.message?.toLowerCase() || '';
    const status = 
        errorMessage.includes('not found') ? 404 :
        errorMessage.includes('already exists') ? 409 :
        errorMessage.includes('unauthorized') || errorMessage.includes('authentication') ? 401 :
        errorMessage.includes('permission') || errorMessage.includes('forbidden') ? 403 :
        errorMessage.includes('invalid') || errorMessage.includes('required') ? 400 :
        errorMessage.includes('insufficient credit') ? 402 :
        errorMessage.includes('api error') ? 502 : 500;
    
    apiResponse
        .status(status)
        .withMessage(error.message || "Operation failed")
        .withError(error.message, error.code || "FUNCTION_ERROR", "functionName")
        .withMeta({
            attemptedBy: req.user?.userId,
            // Add relevant context
        })
        .error();
}
```

## Cheat Sheet

### Method Chaining Order (Fluent API):
```javascript
apiResponse
    .status(code)              // Required: HTTP status
    .withMessage(msg)          // Required: User message
    .withData(data)            // Optional: Response data
    .withMeta(meta)            // Optional: Tracking metadata
    .addWarning(...)           // Optional: Add warnings (can call multiple times)
    .success() / .error()      // Required: Send response
```

### Methods Available:
- `.status(code)` - Set HTTP status code
- `.withMessage(msg)` - Set user-friendly message
- `.withData(data)` - Set response data
- `.withMeta(meta)` - Set metadata for tracking
- `.addWarning(code, msg, source, severity)` - Add warning
- `.withError(error, code, source, details)` - Set error info
- `.success()` - Send success response
- `.error()` - Send error response
- `.partial(availableFields, missingFields)` - Send 206 partial response

### Automatic Features:
✅ Request ID generation and tracking  
✅ Response duration measurement  
✅ Timestamp generation  
✅ Development vs production error detail levels  
✅ Consistent response structure  

## Testing with Postman

### Success Response Structure:
```json
{
  "status": 200,
  "success": true,
  "message": "...",
  "data": { "data": {...}, "meta": {...} },
  "warnings": [],
  "error": null,
  "trace": { "requestId": "...", "durationMs": 0 }
}
```

### Error Response Structure:
```json
{
  "status": 400,
  "success": false,
  "message": "...",
  "data": null,
  "warnings": [],
  "error": { "code": "...", "message": "...", "source": "..." },
  "trace": { "requestId": "...", "durationMs": 0 }
}
```

---

## Common Mistakes to Avoid

❌ **Don't forget to return early on validation errors**
```javascript
if (!field) {
    // Missing return!
    apiResponse.status(400).withMessage("...").error();
}
// Code continues executing!
```

✅ **Always return on validation errors**
```javascript
if (!field) {
    return apiResponse.status(400).withMessage("...").error();
}
```

❌ **Don't call both .success() and .error()**
```javascript
apiResponse.status(200).withMessage("...").success();
apiResponse.status(500).withMessage("...").error(); // Second response ignored!
```

✅ **Only call one response method**
```javascript
if (condition) {
    return apiResponse.status(200).withMessage("...").success();
} else {
    return apiResponse.status(500).withMessage("...").error();
}
```

❌ **Don't forget logger integration**
```javascript
catch (error) {
    // No logging!
    apiResponse.status(500).withMessage("...").error();
}
```

✅ **Always log errors**
```javascript
catch (error) {
    logger.error(`Error in functionName:`, error);
    apiResponse.status(500).withMessage("...").error();
}
```

---

*Quick Reference Guide - FeedAQ Academy Backend*
*Last Updated: October 19, 2025*
