# Accept Course Invite API Documentation

## Overview
The `acceptInvite` API allows users to accept course invitations using their invite token. Upon acceptance:
1. The `CourseUserInvites` table row is updated with status `ACCEPTED`
2. A new entry is created in the `CourseAccess` entity
3. The inviter receives a notification

## API Endpoint

### Accept Course Invitation

```http
POST /api/courseAccess/acceptInvite
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
    "inviteToken": "abc123def456..."
}
```

**Success Response (200 OK):**
```json
{
    "status": 200,
    "message": "Invitation accepted successfully",
    "data": {
        "access": {
            "courseAccessId": 123,
            "courseId": 456,
            "userId": 789,
            "accessLevel": "SHARED",
            "isActive": true,
            "grantedByUserId": 111,
            "grantedByOrganizationId": null,
            "expiresAt": null,
            "createdAt": "2025-10-18T10:30:00.000Z",
            "updatedAt": "2025-10-18T10:30:00.000Z"
        },
        "course": {
            "courseId": 456,
            "courseTitle": "Introduction to React",
            "courseName": "React Basics",
            "courseDescription": "Learn React fundamentals"
        }
    }
}
```

**Success Response - Already Has Access (200 OK):**
```json
{
    "status": 200,
    "message": "You already have access to this course",
    "data": {
        "access": {
            "courseAccessId": 123,
            "courseId": 456,
            "userId": 789,
            "accessLevel": "SHARED",
            "isActive": true
        },
        "course": {
            "courseId": 456,
            "courseTitle": "Introduction to React"
        }
    }
}
```

**Error Responses:**

**400 Bad Request - Missing Token:**
```json
{
    "status": 400,
    "message": "inviteToken is required"
}
```

**403 Forbidden - Email Mismatch:**
```json
{
    "status": 403,
    "message": "This invitation was sent to a different email address"
}
```

**404 Not Found - Invalid/Expired Token:**
```json
{
    "status": 404,
    "message": "Invalid or expired invitation"
}
```

**404 Not Found - Expired Invitation:**
```json
{
    "status": 404,
    "message": "This invitation has expired"
}
```

**404 Not Found - User Not Found:**
```json
{
    "status": 404,
    "message": "User not found"
}
```

**500 Internal Server Error:**
```json
{
    "status": 500,
    "message": "Error occurred while accepting invite"
}
```

## Service Layer Method

### `acceptInvite(inviteToken, userId)`

**Parameters:**
- `inviteToken` (string): The unique invitation token
- `userId` (number): The ID of the user accepting the invite

**Returns:**
```javascript
{
    message: string,
    access: CourseAccess,
    course: Course
}
```

**Example Usage:**
```javascript
const CourseAccessService = require('../service/CourseAccess.service');

const result = await CourseAccessService.acceptInvite(
    'abc123def456...',
    789
);

console.log(result.message); // "Invitation accepted successfully"
console.log(result.access.accessLevel); // "SHARED"
console.log(result.course.courseTitle); // "Introduction to React"
```

## Flow Diagram

```
User receives email with invite token
            ↓
User clicks "Accept Invitation" link
            ↓
Frontend calls POST /acceptInvite with token
            ↓
Backend validates token and checks:
    ├── Is invite PENDING? ✓
    ├── Has invite expired? ✗
    ├── Does user email match? ✓
    └── Does user already have access? ✗
            ↓
Create CourseAccess entry
            ↓
Update CourseUserInvites:
    ├── inviteStatus = 'ACCEPTED'
    ├── acceptedAt = current timestamp
    └── acceptedByUserId = userId
            ↓
Send notification to inviter
            ↓
Return success response
```

## Database Changes

### CourseUserInvites Table Update

**Before Accept:**
```sql
invite_id: 123
invite_course_id: 456
invite_invitee_email: 'user@example.com'
invite_status: 'PENDING'
invite_token: 'abc123...'
invite_expires_at: '2025-10-25T00:00:00Z'
invite_accepted_at: NULL
invite_accepted_by_user_id: NULL
```

**After Accept:**
```sql
invite_id: 123
invite_course_id: 456
invite_invitee_email: 'user@example.com'
invite_status: 'ACCEPTED'  ← Updated
invite_token: 'abc123...'
invite_expires_at: '2025-10-25T00:00:00Z'
invite_accepted_at: '2025-10-18T10:30:00Z'  ← Updated
invite_accepted_by_user_id: 789  ← Updated
```

### CourseAccess Table Insert

**New Entry Created:**
```sql
course_access_id: 789
ca_course_id: 456
ca_user_id: 789
ca_access_level: 'SHARED'
ca_is_active: true
ca_granted_by_user_id: 111
ca_granted_by_organization_id: NULL
ca_expires_at: NULL
ca_created_at: '2025-10-18T10:30:00Z'
```

## Validation Rules

1. **Token Required**: `inviteToken` must be provided in request body
2. **Token Valid**: Token must exist and be in `PENDING` status
3. **Not Expired**: Current date must be before `expiresAt`
4. **User Exists**: `userId` must correspond to an existing user
5. **Email Match**: User's email must match `inviteeEmail` (case-insensitive)
6. **No Duplicate Access**: If user already has access, skip creation but mark invite as accepted

## Security Considerations

1. ✅ **Authentication Required**: User must be authenticated (Bearer token)
2. ✅ **Email Verification**: Invite email must match logged-in user's email
3. ✅ **Token Uniqueness**: Each invite token is unique and single-use
4. ✅ **Expiration Check**: Expired invites are automatically rejected
5. ✅ **Status Validation**: Only `PENDING` invites can be accepted

## Notifications

When an invite is accepted, a notification is sent to the inviter:

```javascript
{
    userId: inviter.userId,
    title: "John Doe accepted your course invitation",
    notificationType: 'COURSE_INVITE',
    notificationReq: {
        courseId: 456,
        courseName: "Introduction to React",
        acceptedByUserId: 789,
        acceptedByEmail: "user@example.com",
        inviteId: 123
    },
    isActionRequired: false
}
```

## Frontend Integration Examples

### Using Fetch API
```javascript
async function acceptCourseInvite(token) {
    try {
        const response = await fetch('/api/courseAccess/acceptInvite', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify({
                inviteToken: token
            })
        });

        const result = await response.json();

        if (result.status === 200) {
            console.log('Successfully joined course:', result.data.course.courseTitle);
            // Redirect to course page
            window.location.href = `/course/${result.data.access.courseId}`;
        } else {
            console.error('Failed to accept invite:', result.message);
            alert(result.message);
        }
    } catch (error) {
        console.error('Error accepting invite:', error);
    }
}

// Get token from URL query parameter
const urlParams = new URLSearchParams(window.location.search);
const inviteToken = urlParams.get('token');

if (inviteToken) {
    acceptCourseInvite(inviteToken);
}
```

### Using Axios
```javascript
import axios from 'axios';

const acceptCourseInvite = async (token) => {
    try {
        const response = await axios.post('/api/courseAccess/acceptInvite', {
            inviteToken: token
        }, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (response.data.status === 200) {
            // Show success message
            toast.success(response.data.message);
            
            // Navigate to course
            navigate(`/course/${response.data.data.access.courseId}`);
        }
    } catch (error) {
        if (error.response) {
            // Handle specific error codes
            switch (error.response.data.status) {
                case 403:
                    toast.error('This invitation is for a different email address');
                    break;
                case 404:
                    toast.error('Invalid or expired invitation');
                    break;
                default:
                    toast.error(error.response.data.message);
            }
        } else {
            toast.error('Failed to accept invitation');
        }
    }
};
```

### React Component Example
```jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { acceptCourseInvite } from '../services/courseAccessService';

function AcceptInvitePage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('processing');
    const [message, setMessage] = useState('');
    const [courseData, setCourseData] = useState(null);

    useEffect(() => {
        const token = searchParams.get('token');
        
        if (!token) {
            setStatus('error');
            setMessage('No invitation token provided');
            return;
        }

        handleAcceptInvite(token);
    }, [searchParams]);

    const handleAcceptInvite = async (token) => {
        try {
            const result = await acceptCourseInvite(token);
            
            setStatus('success');
            setMessage(result.message);
            setCourseData(result.data);

            // Redirect to course after 2 seconds
            setTimeout(() => {
                navigate(`/course/${result.data.access.courseId}`);
            }, 2000);
        } catch (error) {
            setStatus('error');
            setMessage(error.message || 'Failed to accept invitation');
        }
    };

    return (
        <div className="accept-invite-page">
            {status === 'processing' && (
                <div className="loading">
                    <p>Processing your invitation...</p>
                </div>
            )}
            
            {status === 'success' && (
                <div className="success">
                    <h2>✅ {message}</h2>
                    {courseData && (
                        <div className="course-info">
                            <h3>{courseData.course.courseTitle}</h3>
                            <p>{courseData.course.courseDescription}</p>
                            <p>Access Level: {courseData.access.accessLevel}</p>
                        </div>
                    )}
                    <p>Redirecting to course...</p>
                </div>
            )}
            
            {status === 'error' && (
                <div className="error">
                    <h2>❌ Failed to Accept Invitation</h2>
                    <p>{message}</p>
                    <button onClick={() => navigate('/dashboard')}>
                        Go to Dashboard
                    </button>
                </div>
            )}
        </div>
    );
}

export default AcceptInvitePage;
```

## Testing

### Manual Testing with cURL

```bash
# Accept a course invitation
curl -X POST http://localhost:3000/api/courseAccess/acceptInvite \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "inviteToken": "abc123def456..."
  }'
```

### Unit Test Example

```javascript
const CourseAccessService = require('../service/CourseAccess.service');

describe('CourseAccessService.acceptInvite', () => {
    it('should accept a valid invitation', async () => {
        const result = await CourseAccessService.acceptInvite(
            'valid_token_123',
            123
        );

        expect(result.message).toBe('Invitation accepted successfully');
        expect(result.access).toBeDefined();
        expect(result.access.userId).toBe(123);
        expect(result.access.isActive).toBe(true);
    });

    it('should reject an expired invitation', async () => {
        await expect(
            CourseAccessService.acceptInvite('expired_token', 123)
        ).rejects.toThrow('This invitation has expired');
    });

    it('should reject invitation with email mismatch', async () => {
        await expect(
            CourseAccessService.acceptInvite('token_for_other_email', 123)
        ).rejects.toThrow('This invitation was sent to a different email address');
    });

    it('should handle duplicate access gracefully', async () => {
        const result = await CourseAccessService.acceptInvite(
            'token_for_existing_member',
            123
        );

        expect(result.message).toBe('You already have access to this course');
        expect(result.access).toBeDefined();
    });
});
```

## Common Scenarios

### Scenario 1: First-time user accepting invite
1. User receives email with invite link
2. User clicks link and is directed to login/signup
3. After authentication, user is redirected to accept page
4. Token is extracted from URL and sent to API
5. Access is granted and user is redirected to course

### Scenario 2: Existing user with matching email
1. User is already logged in
2. Clicks invite link from email
3. Email matches logged-in account
4. Access is granted immediately
5. User is redirected to course

### Scenario 3: User with different email
1. User clicks invite link
2. Logged in with different email than invite
3. API returns 403 error
4. User is prompted to log out and log in with correct email

### Scenario 4: Expired invitation
1. User clicks invite link after expiration date
2. API returns 404 error
3. Invite status is updated to 'EXPIRED'
4. User is shown error message
5. User can request a new invitation

### Scenario 5: User already has access
1. User clicks invite link
2. User already has access to the course
3. API returns success but doesn't create duplicate
4. Invite is marked as accepted
5. User is redirected to course

## Troubleshooting

| Error | Possible Cause | Solution |
|-------|---------------|----------|
| "inviteToken is required" | Missing token in request | Include `inviteToken` in request body |
| "Invalid or expired invitation" | Token doesn't exist or not pending | Verify token is correct and hasn't been used |
| "This invitation has expired" | Past expiration date | Request a new invitation |
| "This invitation was sent to a different email address" | Email mismatch | Log in with the email that received the invite |
| "User not found" | Invalid userId | Verify user is authenticated correctly |

## Best Practices

1. **Handle Token from URL**: Extract token from URL query parameter on frontend
2. **Show Loading State**: Display loading indicator while processing
3. **Error Handling**: Show user-friendly error messages
4. **Auto-redirect**: Redirect to course page after successful acceptance
5. **Email Verification**: Ensure user logs in with the invited email
6. **Token Security**: Don't expose token in logs or error messages
7. **Expiration Notice**: Show time remaining for invitation to expire

## Related APIs

- `POST /inviteUser` - Send course invitations
- `GET /getInvitedMembers/:courseId` - List pending invitations
- `GET /checkCourseAccess/:courseId` - Verify user access
- `GET /getCourseMembers/:courseId` - List all course members
