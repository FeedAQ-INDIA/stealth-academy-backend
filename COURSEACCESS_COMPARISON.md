# CourseAccess Refactoring - Before & After Comparison

## Architecture Comparison

### Before Refactoring ❌
```
┌─────────────────────────────┐
│  courseAccess.route.js      │
│  - Route definitions        │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ CourseAccess.controller.js  │
│ - HTTP handling             │
│ - Business logic ❌         │
│ - Database queries ❌       │
│ - Email sending ❌          │
│ - Validation ❌             │
└─────────────────────────────┘
```

### After Refactoring ✅
```
┌─────────────────────────────┐
│  courseAccess.route.js      │
│  - Route definitions        │
│  - Middleware               │
│  - Documentation            │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ CourseAccess.controller.js  │
│ - HTTP request/response     │
│ - Input validation          │
│ - Error status codes        │
│ - Response formatting       │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ CourseAccess.service.js     │
│ - Business logic            │
│ - Database operations       │
│ - Email sending             │
│ - Helper functions          │
└─────────────────────────────┘
```

## Code Structure Comparison

### Controller Method: `inviteUser`

#### Before (Mixed Responsibilities) ❌
```javascript
exports.inviteUser = async (req, res) => {
    try {
        const { courseId, orgId, invites } = req.body;
        const userId = req.user.userId;

        // Validation ❌
        if (!courseId || !userId || !Array.isArray(invites)) {
            return res.status(400).json({
                message: "courseId, userId, and invites array are required"
            });
        }

        // More validation ❌
        for (const invite of invites) {
            if (!invite.email || !invite.accessLevel) {
                return res.status(400).json({
                    message: "Each invite must have email and accessLevel"
                });
            }
            // Email regex validation ❌
            // Access level validation ❌
        }

        // Database query ❌
        const inviter = await User.findByPk(userId);
        if (!inviter) {
            return res.status(404).json({ message: "Inviter user not found" });
        }

        // More database queries ❌
        const course = await Course.findByPk(courseId, {
            include: [{ model: User, as: 'instructor' }]
        });

        // Permission checking ❌
        const userAccess = await CourseAccess.findOne({
            where: { courseId, userId, isActive: true, 
                    accessLevel: { [Op.in]: ["OWN", "ADMIN"] } }
        });

        // Complex business logic ❌
        const successfulInvites = [];
        const failedInvites = [];

        for (const invite of invites) {
            // Check existing invite ❌
            // Check existing access ❌
            // Generate token ❌
            // Create invite record ❌
            // Send email ❌
            // Create notification ❌
        }

        res.status(201).json({
            message: "Invite process completed",
            data: { /* ... */ }
        });
    } catch (error) {
        handleError(res, error);
    }
};
```

**Issues:**
- 🔴 200+ lines in one function
- 🔴 Mixed HTTP, validation, and business logic
- 🔴 Direct database access
- 🔴 Hard to test individual parts
- 🔴 Poor error handling
- 🔴 No logging

#### After (Separated Concerns) ✅
```javascript
// Controller (HTTP Layer)
async function inviteUser(req, res, next) {
    try {
        const { courseId, orgId, invites } = req.body;
        const userId = req.user.userId;

        // Basic validation only
        if (!courseId || !Array.isArray(invites) || invites.length === 0) {
            return res.status(400).send({
                status: 400,
                message: "courseId and invites array are required"
            });
        }

        // Call service layer
        const result = await CourseAccessService.inviteUsers({
            courseId, userId, orgId, invites
        });

        // Format response
        res.status(201).send({
            status: 201,
            message: "Invite process completed",
            data: result
        });
    } catch (err) {
        logger.error(`Error occurred while inviting users:`, err.message);
        
        // Proper error handling with status codes
        if (err.message.includes("email") || err.message.includes("required")) {
            return res.status(400).send({ status: 400, message: err.message });
        }
        
        if (err.message === "Course not found") {
            return res.status(404).send({ status: 404, message: err.message });
        }
        
        if (err.message.includes("permission")) {
            return res.status(403).send({ status: 403, message: err.message });
        }

        res.status(500).send({ status: 500, message: err.message });
        next(err);
    }
}
```

```javascript
// Service (Business Logic Layer)
const inviteUsers = async (inviteData) => {
    const { courseId, userId, orgId, invites } = inviteData;

    // Validation
    if (!courseId || !userId || !Array.isArray(invites) || invites.length === 0) {
        throw new Error("courseId, userId, and invites array are required");
    }

    // Validate invites structure
    for (const invite of invites) {
        if (!invite.email || !invite.accessLevel) {
            throw new Error("Each invite must have email and accessLevel");
        }
        // Email and access level validation
    }

    // Get inviter and course
    const inviter = await User.findByPk(userId);
    if (!inviter) throw new Error("Inviter user not found");

    const course = await Course.findByPk(courseId, {
        include: [{ model: User, as: 'instructor' }]
    });
    if (!course) throw new Error("Course not found");

    // Check permissions
    const userAccess = await CourseAccess.findOne({
        where: {
            courseId, userId, isActive: true,
            accessLevel: { [Op.in]: ["OWN", "ADMIN"] }
        }
    });
    if (!userAccess) {
        throw new Error("You don't have permission to invite users");
    }

    // Process invites
    const successfulInvites = [];
    const failedInvites = [];

    for (const invite of invites) {
        // Check existing invite
        // Check existing access
        // Generate token
        // Create invite record
        // Send email
        // Create notification
    }

    return {
        successful: successfulInvites,
        failed: failedInvites,
        totalInvites: invites.length,
        successCount: successfulInvites.length,
        failureCount: failedInvites.length
    };
};
```

**Benefits:**
- ✅ Clear separation of concerns
- ✅ Controller ~60 lines, Service handles complexity
- ✅ Service can be reused elsewhere
- ✅ Easy to unit test service independently
- ✅ Proper logging and error handling
- ✅ Consistent response format

## Response Format Comparison

### Before ❌
```javascript
// Inconsistent response formats
res.json({ message: "Success", data: access });
res.json({ data: access }); // No message
res.status(400).json({ message: "Error" }); // No status field
```

### After ✅
```javascript
// Consistent response format
{
    status: 200,
    message: "Operation successful",
    data: { /* ... */ }
}

// Error responses
{
    status: 404,
    message: "Course not found"
}
```

## Error Handling Comparison

### Before ❌
```javascript
catch (error) {
    handleError(res, error); // Generic handler
}
```

### After ✅
```javascript
catch (err) {
    logger.error(`Error occurred while inviting users:`, err.message);
    
    // Specific error handling based on message
    if (err.message.includes("email")) {
        return res.status(400).send({ status: 400, message: err.message });
    }
    
    if (err.message === "Course not found") {
        return res.status(404).send({ status: 404, message: err.message });
    }
    
    if (err.message.includes("permission")) {
        return res.status(403).send({ status: 403, message: err.message });
    }

    res.status(500).send({ status: 500, message: err.message });
    next(err);
}
```

## Route Documentation Comparison

### Before ❌
```javascript
// Minimal or no comments
router.post("/revokeAccess", courseAccessController.revokeAccess);
router.post("/updateUserAccess", courseAccessController.updateAccess);
router.get("/getCourseMembers/:courseId", courseAccessController.getCourseAccess);
```

### After ✅
```javascript
/**
 * @route POST /api/courseAccess/revokeAccess
 * @desc Revoke access to a course
 * @access Private
 */
router.post("/revokeAccess", courseAccessController.revokeAccess);

/**
 * @route POST /api/courseAccess/updateUserAccess
 * @desc Update access level or expiration for a user
 * @access Private
 */
router.post("/updateUserAccess", courseAccessController.updateAccess);

/**
 * @route GET /api/courseAccess/getCourseMembers/:courseId
 * @desc Get all access records for a course
 * @access Private
 */
router.get("/getCourseMembers/:courseId", courseAccessController.getCourseAccess);
```

## Testing Comparison

### Before ❌
```javascript
// Hard to test - need to mock HTTP, DB, email, etc.
const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
};
const req = {
    body: { courseId: 1, invites: [...] },
    user: { userId: 1 }
};

await courseAccessController.inviteUser(req, res);
expect(res.status).toHaveBeenCalledWith(201);
```

### After ✅
```javascript
// Easy to test service independently
describe('CourseAccessService.inviteUsers', () => {
    it('should successfully invite users', async () => {
        const result = await CourseAccessService.inviteUsers({
            courseId: 1,
            userId: 1,
            invites: [{ email: 'test@example.com', accessLevel: 'SHARED' }]
        });
        
        expect(result.successCount).toBe(1);
        expect(result.successful[0].email).toBe('test@example.com');
    });

    it('should throw error for invalid email', async () => {
        await expect(
            CourseAccessService.inviteUsers({
                courseId: 1,
                userId: 1,
                invites: [{ email: 'invalid', accessLevel: 'SHARED' }]
            })
        ).rejects.toThrow('Invalid email format');
    });
});
```

## Reusability Comparison

### Before ❌
```javascript
// Can only be used via HTTP endpoint
// If you need to invite users from a scheduled job,
// you'd have to duplicate the logic
```

### After ✅
```javascript
// Service can be reused anywhere
const CourseAccessService = require('../service/CourseAccess.service');

// From another controller
const access = await CourseAccessService.grantAccess({...});

// From a scheduled job
const result = await CourseAccessService.inviteUsers({...});

// From a webhook handler
const members = await CourseAccessService.getCourseAccess(courseId);
```

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Lines in Controller** | 400+ lines | ~300 lines |
| **Separation of Concerns** | ❌ Mixed | ✅ Clear |
| **Testability** | 🔴 Hard | 🟢 Easy |
| **Reusability** | ❌ HTTP only | ✅ Anywhere |
| **Error Handling** | 🔴 Generic | 🟢 Specific |
| **Logging** | ❌ Minimal | ✅ Comprehensive |
| **Documentation** | 🔴 Poor | 🟢 Good |
| **Response Format** | 🔴 Inconsistent | 🟢 Consistent |
| **Maintainability** | 🔴 Difficult | 🟢 Easy |
| **Code Organization** | 🔴 Monolithic | 🟢 Modular |

## Conclusion

The refactoring transforms a monolithic controller into a well-structured three-tier architecture:
- **Routes**: Define endpoints clearly
- **Controllers**: Handle HTTP concerns
- **Services**: Contain business logic

This makes the code more maintainable, testable, and follows the established patterns in the project (Notification module).
