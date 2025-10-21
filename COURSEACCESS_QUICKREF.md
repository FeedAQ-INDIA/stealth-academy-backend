# CourseAccess API Quick Reference

## Service Layer Methods

### 1. Grant Access
```javascript
const CourseAccessService = require('../service/CourseAccess.service');

const access = await CourseAccessService.grantAccess({
    courseId: 123,
    userId: 456,              // Either userId OR organizationId
    // organizationId: 789,   // (not both)
    accessLevel: 'SHARED',    // OWN, SHARED, ADMIN, STUDY_GROUP
    expiresAt: new Date('2025-12-31'),  // Optional
    grantedByUserId: 1,
    grantedByOrganizationId: 10  // Optional
});
```

### 2. Revoke Access
```javascript
await CourseAccessService.revokeAccess(courseAccessId);
```

### 3. Update Access
```javascript
const updated = await CourseAccessService.updateAccess(
    courseAccessId,
    {
        accessLevel: 'ADMIN',
        expiresAt: new Date('2026-12-31')
    }
);
```

### 4. Get Course Members
```javascript
const members = await CourseAccessService.getCourseAccess(courseId);
```

### 5. Get User's Courses
```javascript
const courses = await CourseAccessService.getUserCourseAccess(userId);
```

### 6. Check Access
```javascript
const { hasAccess, accessDetails } = await CourseAccessService.checkAccess(
    courseId, 
    userId
);
```

### 7. Get Invited Members
```javascript
const invites = await CourseAccessService.getInvitedMembers(courseId);
```

### 8. Invite Users
```javascript
const result = await CourseAccessService.inviteUsers({
    courseId: 123,
    userId: 456,
    orgId: 789,  // Optional
    invites: [
        {
            email: 'user1@example.com',
            accessLevel: 'SHARED',
            message: 'Welcome to the course!'  // Optional
        },
        {
            email: 'user2@example.com',
            accessLevel: 'ADMIN'
        }
    ]
});

// Result structure:
// {
//     successful: [...],
//     failed: [...],
//     totalInvites: 2,
//     successCount: 1,
//     failureCount: 1
// }
```

### 9. Accept Invite
```javascript
const result = await CourseAccessService.acceptInvite(
    'invite_token_abc123...',
    userId
);

// Result structure:
// {
//     message: 'Invitation accepted successfully',
//     access: { courseAccessId, courseId, userId, accessLevel, ... },
//     course: { courseId, courseTitle, courseDescription, ... }
// }
```

## API Endpoints

### Grant Access
```http
POST /api/courseAccess/grantAccess
Authorization: Bearer <token>

{
    "courseId": 123,
    "userId": 456,
    "accessLevel": "SHARED",
    "expiresAt": "2025-12-31T00:00:00.000Z"
}
```

**Response:**
```json
{
    "status": 201,
    "message": "Access granted successfully",
    "data": {
        "courseAccessId": 789,
        "courseId": 123,
        "userId": 456,
        "accessLevel": "SHARED",
        "isActive": true
    }
}
```

### Revoke Access
```http
POST /api/courseAccess/revokeAccess
Authorization: Bearer <token>

{
    "courseAccessId": 789
}
```

**Response:**
```json
{
    "status": 200,
    "message": "Access revoked successfully"
}
```

### Update Access
```http
POST /api/courseAccess/updateUserAccess
Authorization: Bearer <token>

{
    "courseAccessId": 789,
    "accessLevel": "ADMIN"
}
```

**Response:**
```json
{
    "status": 200,
    "message": "Access updated successfully",
    "data": {
        "courseAccessId": 789,
        "accessLevel": "ADMIN"
    }
}
```

### Get Course Members
```http
GET /api/courseAccess/getCourseMembers/123
Authorization: Bearer <token>
```

**Response:**
```json
{
    "status": 200,
    "message": "Course access records fetched successfully",
    "data": [
        {
            "courseAccessId": 789,
            "courseId": 123,
            "userId": 456,
            "accessLevel": "SHARED",
            "user": {
                "userId": 456,
                "firstName": "John",
                "lastName": "Doe",
                "email": "john@example.com"
            }
        }
    ]
}
```

### Check Course Access
```http
GET /api/courseAccess/checkCourseAccess/123
Authorization: Bearer <token>
```

**Response:**
```json
{
    "status": 200,
    "message": "Access check completed",
    "data": {
        "hasAccess": true,
        "accessDetails": {
            "courseAccessId": 789,
            "accessLevel": "SHARED",
            "expiresAt": null
        }
    }
}
```

### Get User's Courses
```http
GET /api/courseAccess/getUserCourseAccess/456
Authorization: Bearer <token>
```

**Response:**
```json
{
    "status": 200,
    "message": "User course access records fetched successfully",
    "data": [
        {
            "courseAccessId": 789,
            "courseId": 123,
            "accessLevel": "SHARED",
            "course": {
                "courseId": 123,
                "courseTitle": "Introduction to React",
                "courseDescription": "Learn React basics"
            }
        }
    ]
}
```

### Get Invited Members
```http
GET /api/courseAccess/getInvitedMembers/123
Authorization: Bearer <token>
```

**Response:**
```json
{
    "status": 200,
    "message": "Invited members fetched successfully",
    "data": [
        {
            "inviteId": 456,
            "inviteeEmail": "newuser@example.com",
            "accessLevel": "SHARED",
            "inviteStatus": "PENDING",
            "expiresAt": "2025-10-25T00:00:00.000Z",
            "createdAt": "2025-10-18T00:00:00.000Z"
        }
    ]
}
```

### Invite Users
```http
POST /api/courseAccess/inviteUser
Authorization: Bearer <token>

{
    "courseId": 123,
    "orgId": 789,
    "invites": [
        {
            "email": "user1@example.com",
            "accessLevel": "SHARED",
            "message": "Welcome!"
        },
        {
            "email": "user2@example.com",
            "accessLevel": "ADMIN"
        }
    ]
}
```

**Response:**
```json
{
    "status": 201,
    "message": "Invite process completed",
    "data": {
        "successful": [
            {
                "email": "user1@example.com",
                "accessLevel": "SHARED",
                "inviteId": 101,
                "token": "abc123..."
            }
        ],
        "failed": [
            {
                "email": "user2@example.com",
                "reason": "User already has access to this course"
            }
        ],
        "totalInvites": 2,
        "successCount": 1,
        "failureCount": 1
    }
}
```

### Accept Invite
```http
POST /api/courseAccess/acceptInvite
Authorization: Bearer <token>

{
    "inviteToken": "abc123def456..."
}
```

**Response:**
```json
{
    "status": 200,
    "message": "Invitation accepted successfully",
    "data": {
        "access": {
            "courseAccessId": 789,
            "courseId": 123,
            "userId": 456,
            "accessLevel": "SHARED",
            "isActive": true
        },
        "course": {
            "courseId": 123,
            "courseTitle": "Introduction to React",
            "courseDescription": "Learn React basics"
        }
    }
}
```

## Access Levels

| Level | Description |
|-------|-------------|
| `OWN` | Course owner - full control |
| `ADMIN` | Administrator - can manage members |
| `SHARED` | Regular member - can view content |
| `STUDY_GROUP` | Study group member - limited access |

## Error Responses

### 400 Bad Request
```json
{
    "status": 400,
    "message": "courseId and invites array are required"
}
```

### 403 Forbidden
```json
{
    "status": 403,
    "message": "You don't have permission to invite users to this course"
}
```

### 404 Not Found
```json
{
    "status": 404,
    "message": "Course not found"
}
```

### 500 Internal Server Error
```json
{
    "status": 500,
    "message": "Error occurred while processing request"
}
```

## Common Use Cases

### 1. Adding a Team Member to Course
```javascript
// Controller or another service
const access = await CourseAccessService.grantAccess({
    courseId: req.body.courseId,
    userId: req.body.userId,
    accessLevel: 'SHARED',
    grantedByUserId: req.user.userId
});
```

### 2. Bulk Inviting Users
```javascript
const result = await CourseAccessService.inviteUsers({
    courseId: 123,
    userId: req.user.userId,
    invites: emailList.map(email => ({
        email,
        accessLevel: 'SHARED'
    }))
});

console.log(`Successfully invited ${result.successCount} users`);
console.log(`Failed to invite ${result.failureCount} users`);
```

### 3. Checking User Permission Before Action
```javascript
const { hasAccess, accessDetails } = await CourseAccessService.checkAccess(
    courseId,
    req.user.userId
);

if (!hasAccess) {
    return res.status(403).send({
        status: 403,
        message: "You don't have access to this course"
    });
}

// Check if user is admin
if (!['OWN', 'ADMIN'].includes(accessDetails.accessLevel)) {
    return res.status(403).send({
        status: 403,
        message: "Admin access required"
    });
}

// Proceed with action...
```

### 4. Listing All Course Participants
```javascript
const members = await CourseAccessService.getCourseAccess(courseId);

const memberList = members.map(m => ({
    id: m.userId,
    name: `${m.user.firstName} ${m.user.lastName}`,
    email: m.user.email,
    role: m.accessLevel,
    joinedAt: m.createdAt
}));
```

### 5. Removing User from Course
```javascript
// First, find the access record
const members = await CourseAccessService.getCourseAccess(courseId);
const memberToRemove = members.find(m => m.userId === userIdToRemove);

if (memberToRemove) {
    await CourseAccessService.revokeAccess(memberToRemove.courseAccessId);
}
```

### 6. Promoting User to Admin
```javascript
const members = await CourseAccessService.getCourseAccess(courseId);
const member = members.find(m => m.userId === userIdToPromote);

if (member) {
    await CourseAccessService.updateAccess(
        member.courseAccessId,
        { accessLevel: 'ADMIN' }
    );
}
```

### 7. Accepting Course Invitation
```javascript
// From accept invite page
const token = new URLSearchParams(window.location.search).get('token');

try {
    const result = await CourseAccessService.acceptInvite(token, req.user.userId);
    console.log(`Joined course: ${result.course.courseTitle}`);
    // Redirect to course page
} catch (error) {
    console.error('Failed to accept invite:', error.message);
}
```

## Integration with Other Services

### From a Controller
```javascript
const CourseAccessService = require('../service/CourseAccess.service');

async function enrollUser(req, res) {
    try {
        const access = await CourseAccessService.grantAccess({
            courseId: req.body.courseId,
            userId: req.user.userId,
            accessLevel: 'SHARED',
            grantedByUserId: req.user.userId
        });
        
        res.status(201).send({
            status: 201,
            message: "Enrolled successfully",
            data: access
        });
    } catch (err) {
        // Handle error
    }
}
```

### From a Scheduled Job
```javascript
const CourseAccessService = require('../service/CourseAccess.service');
const cron = require('node-cron');

// Expire old invites daily
cron.schedule('0 0 * * *', async () => {
    console.log('Cleaning up expired invites...');
    // Cleanup logic using CourseAccessService
});
```

### From a Webhook
```javascript
app.post('/webhook/payment-success', async (req, res) => {
    const { userId, courseId } = req.body;
    
    // Grant access after successful payment
    await CourseAccessService.grantAccess({
        courseId,
        userId,
        accessLevel: 'SHARED',
        grantedByUserId: userId // Self-enrollment
    });
    
    res.status(200).send({ success: true });
});
```

## Best Practices

1. **Always validate courseId and userId** before operations
2. **Check permissions** before granting/revoking access
3. **Use try-catch** blocks for error handling
4. **Log operations** for audit trail
5. **Handle failed invites** gracefully in bulk operations
6. **Set appropriate access levels** based on user role
7. **Consider expiration dates** for temporary access
8. **Notify users** after access changes

## Migration from Old Code

If you have existing code using the old pattern:

**Old:**
```javascript
const courseAccessController = require('./controller/CourseAccess.controller');
// Can't call controller methods directly
```

**New:**
```javascript
const CourseAccessService = require('./service/CourseAccess.service');
// Call service methods directly
const access = await CourseAccessService.grantAccess({...});
```

## Testing Examples

```javascript
const CourseAccessService = require('../service/CourseAccess.service');

describe('CourseAccessService', () => {
    test('grantAccess creates new access record', async () => {
        const access = await CourseAccessService.grantAccess({
            courseId: 1,
            userId: 2,
            accessLevel: 'SHARED',
            grantedByUserId: 1
        });
        
        expect(access).toHaveProperty('courseAccessId');
        expect(access.accessLevel).toBe('SHARED');
    });

    test('inviteUsers handles mixed success/failure', async () => {
        const result = await CourseAccessService.inviteUsers({
            courseId: 1,
            userId: 1,
            invites: [
                { email: 'valid@example.com', accessLevel: 'SHARED' },
                { email: 'invalid', accessLevel: 'SHARED' }
            ]
        });
        
        expect(result.successCount).toBeGreaterThan(0);
        expect(result.failureCount).toBeGreaterThan(0);
    });
});
```
