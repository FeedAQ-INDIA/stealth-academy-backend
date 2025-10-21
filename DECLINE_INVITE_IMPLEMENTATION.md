# Decline Invite API Implementation

## Overview
Implemented a complete decline invite feature that allows users to reject course invitations they don't want to accept.

## Backend Implementation

### 1. Service Layer (`CourseAccess.service.js`)

#### New Function: `declineInvite(inviteId, userId)`

**Purpose**: Allows a user to decline a pending course invitation.

**Parameters**:
- `inviteId`: The ID of the invitation to decline
- `userId`: The ID of the user declining the invitation

**Validations**:
- ✅ Invite must exist and be in PENDING status
- ✅ Invitation must not be expired
- ✅ User's email must match the invited email
- ✅ User must exist in the system

**Process Flow**:
1. Find the pending invite by ID
2. Check if invitation has expired
3. Verify user exists
4. Verify email match (case-insensitive)
5. Update invite status to 'DECLINED'
6. Create notification for inviter
7. Return success response

**Response**:
```json
{
  "message": "Invitation declined successfully",
  "invite": {
    "inviteId": 123,
    "courseId": 456,
    "courseName": "Course Name",
    "status": "DECLINED"
  }
}
```

### 2. Controller Layer (`CourseAccess.controller.js`)

#### New Function: `declineInvite(req, res, next)`

**Route**: `POST /api/courseAccess/declineInvite`

**Request Body**:
```json
{
  "inviteId": 123
}
```

**Error Responses**:
- **400 Bad Request**: Missing inviteId
- **403 Forbidden**: Email address mismatch
- **404 Not Found**: Invalid/processed invitation, expired invitation, or user not found
- **500 Internal Server Error**: Server error

**Success Response** (200):
```json
{
  "status": 200,
  "message": "Invitation declined successfully",
  "data": {
    "inviteId": 123,
    "courseId": 456,
    "courseName": "Course Name",
    "status": "DECLINED"
  }
}
```

### 3. Routes (`courseAccess.route.js`)

Added new route:
```javascript
/**
 * @route POST /api/courseAccess/declineInvite
 * @desc Decline a course invitation
 * @access Private (requires authentication)
 */
router.post("/declineInvite", courseAccessController.declineInvite);
```

## Frontend Implementation

### Updated: `Notifications.jsx`

#### Changes to `handleCourseInvite` Handler

**Before**: Mock implementation with placeholder comments

**After**: Full integration with backend APIs

**Features**:
1. ✅ Accept invite using `/courseAccess/acceptInvite` API
2. ✅ Decline invite using `/courseAccess/declineInvite` API
3. ✅ Proper error handling with detailed error messages
4. ✅ Archive notification after successful action
5. ✅ Display course name from API response
6. ✅ Refresh notifications list after action
7. ✅ Toast notifications for user feedback

**Accept Flow**:
```javascript
POST /courseAccess/acceptInvite
Body: { inviteId: 123 }
→ Success: Archive notification, show success toast, refresh list
→ Error: Display error message in toast
```

**Decline Flow**:
```javascript
POST /courseAccess/declineInvite
Body: { inviteId: 123 }
→ Success: Archive notification, show success toast, refresh list
→ Error: Display error message in toast
```

## API Endpoints Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/courseAccess/acceptInvite` | POST | ✅ | Accept a course invitation |
| `/api/courseAccess/declineInvite` | POST | ✅ | Decline a course invitation |

## Database Schema

The `CourseUserInvites` entity already supports decline functionality:

```javascript
inviteStatus: {
    type: Sequelize.ENUM("PENDING", "ACCEPTED", "DECLINED", "EXPIRED", "CANCELLED"),
    defaultValue: "PENDING"
}
```

## Notification Integration

Both accept and decline actions trigger notifications to the inviter:

**Accept Notification**:
```json
{
  "title": "John Doe accepted your course invitation",
  "notificationType": "COURSE_INVITE",
  "isActionRequired": false
}
```

**Decline Notification**:
```json
{
  "title": "John Doe declined your course invitation",
  "notificationType": "COURSE_INVITE",
  "isActionRequired": false
}
```

## Testing Checklist

### Backend Testing
- [ ] Test declining a valid pending invitation
- [ ] Test declining an expired invitation (should fail)
- [ ] Test declining with wrong user (email mismatch)
- [ ] Test declining already accepted invitation
- [ ] Test declining already declined invitation
- [ ] Test declining with invalid inviteId
- [ ] Verify notification is created for inviter
- [ ] Verify invite status is updated to DECLINED

### Frontend Testing
- [ ] Test accept button functionality
- [ ] Test decline button functionality
- [ ] Verify success toast appears on accept
- [ ] Verify success toast appears on decline
- [ ] Verify error toast appears on failure
- [ ] Verify notification is archived after action
- [ ] Verify notifications list refreshes after action
- [ ] Test with expired invitations
- [ ] Test with invalid invite data

## Security Considerations

1. ✅ Authentication required (authMiddleware)
2. ✅ Email verification (only invited user can decline)
3. ✅ Invitation expiry check
4. ✅ Status validation (only PENDING invites can be declined)
5. ✅ Proper error handling to prevent information leakage

## Future Enhancements

1. Add reason/message when declining
2. Allow inviter to resend invitation after decline
3. Add notification preferences for invite responses
4. Track decline history in analytics
5. Add undo functionality (time-limited)

## Files Modified

### Backend
- `src/service/CourseAccess.service.js` - Added `declineInvite` function
- `src/controller/CourseAccess.controller.js` - Added `declineInvite` controller
- `src/routes/courseAccess.route.js` - Added decline route

### Frontend
- `src/components-xm/AccountSettings/Notifications.jsx` - Integrated accept/decline APIs

## API Usage Examples

### Accept Invite
```javascript
// Request
POST /api/courseAccess/acceptInvite
Authorization: Bearer <token>
Content-Type: application/json

{
  "inviteId": 123
}

// Success Response (200)
{
  "status": 200,
  "message": "Invitation accepted successfully",
  "data": {
    "access": { ... },
    "course": { ... }
  }
}
```

### Decline Invite
```javascript
// Request
POST /api/courseAccess/declineInvite
Authorization: Bearer <token>
Content-Type: application/json

{
  "inviteId": 123
}

// Success Response (200)
{
  "status": 200,
  "message": "Invitation declined successfully",
  "data": {
    "inviteId": 123,
    "courseId": 456,
    "courseName": "Introduction to JavaScript",
    "status": "DECLINED"
  }
}
```

## Deployment Notes

1. No database migrations required (DECLINED status already exists)
2. Backend changes are backward compatible
3. Frontend changes are backward compatible
4. No environment variables needed
5. Test on staging before production deployment

---

**Implementation Date**: October 18, 2025
**Status**: ✅ Complete and Ready for Testing
