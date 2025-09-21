# Organization Invitation System - API Documentation

## Overview

The organization invitation system has been enhanced to support email-based invitations with proper token management and database storage. Users can now be invited via email and accept/reject invitations through secure tokens.

## Database Changes

### OrganizationUserInvites Table
The system now uses the `organization_user_invites` table to store invitation data:

- `invite_id`: Primary key
- `invite_org_id`: Organization ID (foreign key)
- `invited_email`: Email address of the invitee
- `invited_by`: User ID of the inviter (foreign key)
- `invited_role`: Role to be assigned (ADMIN, MANAGER, INSTRUCTOR, MEMBER)
- `invite_status`: Status (PENDING, ACCEPTED, DECLINED, EXPIRED, CANCELLED)
- `invite_token`: Unique token for accepting the invitation
- `invite_expires_at`: Expiration timestamp
- `invite_message`: Optional personal message
- `invite_metadata`: JSON metadata including email status and permissions

## API Endpoints

### 1. Invite User to Organization

**Endpoint:** `POST /api/organization/:orgId/invite`

**Authentication:** Required (JWT token)

**Request Body:**
```json
{
  "email": "user@example.com",
  "userRole": "MEMBER", // Optional: ADMIN, MANAGER, INSTRUCTOR, MEMBER (default: MEMBER)
  "message": "Welcome to our organization!", // Optional
  "permissions": { // Optional
    "canViewCourses": true,
    "canCreateNotes": true
  }
}
```

**Response:**
```json
{
  "status": 201,
  "message": "User invited successfully",
  "data": {
    "invitation": {
      "inviteId": 123,
      "orgId": 1,
      "invitedEmail": "user@example.com",
      "invitedRole": "MEMBER",
      "inviteStatus": "PENDING",
      "inviteToken": "abc123...",
      "expiresAt": "2023-12-31T23:59:59.000Z",
      "organization": {
        "orgId": 1,
        "orgName": "Example Organization",
        "orgEmail": "contact@example.org"
      },
      "inviter": {
        "userId": 456,
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      }
    },
    "emailSent": true,
    "acceptUrl": "http://localhost:3000/accept-invite?token=abc123..."
  }
}
```

### 2. Get Invitation Details

**Endpoint:** `GET /api/invite/:token`

**Authentication:** Not required (public for email links)

**Response:**
```json
{
  "status": 200,
  "message": "Invitation details retrieved successfully",
  "data": {
    "inviteId": 123,
    "invitedEmail": "user@example.com",
    "invitedRole": "MEMBER",
    "inviteStatus": "PENDING",
    "expiresAt": "2023-12-31T23:59:59.000Z",
    "inviteMessage": "Welcome to our organization!",
    "organization": {
      "orgId": 1,
      "orgName": "Example Organization",
      "orgDescription": "A great place to work"
    },
    "inviter": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    }
  }
}
```

### 3. Accept Invitation

**Endpoint:** `POST /api/invite/:token/accept`

**Authentication:** Required (JWT token)

**Request Body:** (Optional)
```json
{
  "userId": 789 // Optional: if not provided, uses authenticated user
}
```

**Response:**
```json
{
  "status": 200,
  "message": "Invitation accepted successfully",
  "data": {
    "orgUserId": 456,
    "orgId": 1,
    "userId": 789,
    "userRole": "MEMBER",
    "status": "ACTIVE",
    "joinedAt": "2023-12-15T10:30:00.000Z",
    "organization": {
      "orgId": 1,
      "orgName": "Example Organization",
      "orgEmail": "contact@example.org"
    },
    "user": {
      "userId": 789,
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com"
    }
  }
}
```

### 4. Reject Invitation

**Endpoint:** `POST /api/invite/:token/reject`

**Authentication:** Not required

**Response:**
```json
{
  "status": 200,
  "message": "Invitation declined successfully",
  "data": {}
}
```

## Email Configuration

### Environment Variables Required

Add these to your `.env` file:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL for invitation links
FRONTEND_URL=http://localhost:3000
```

### Email Template Features

- Professional HTML email template
- Organization branding
- Personal message inclusion
- Secure accept/reject buttons
- Expiration date display
- Mobile-responsive design

### Email Providers Configuration

**Gmail:**
- Enable 2FA on your Google account
- Generate an App Password for Mail
- Use the app password as `SMTP_PASS`

**Outlook/Hotmail:**
```env
SMTP_HOST=smtp.outlook.com
SMTP_PORT=587
```

**Yahoo:**
```env
SMTP_HOST=smtp.yahoo.com
SMTP_PORT=587
```

## Security Features

1. **Token-based invitations**: Unique, cryptographically secure tokens
2. **Expiration handling**: Invitations expire after 7 days
3. **Permission validation**: Only admins/managers can send invites
4. **Duplicate prevention**: Prevents multiple pending invites to same email
5. **Input validation**: Comprehensive validation for all endpoints

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "status": 400,
  "message": "Email is required"
}
```

**401 Unauthorized:**
```json
{
  "status": 401,
  "message": "Authentication required"
}
```

**403 Forbidden:**
```json
{
  "status": 403,
  "message": "You don't have permission to invite users to this organization"
}
```

**404 Not Found:**
```json
{
  "status": 404,
  "message": "Invalid or expired invitation token"
}
```

**409 Conflict:**
```json
{
  "status": 409,
  "message": "User is already part of this organization"
}
```

## Testing

Use the provided test script (`test-organization-invite.js`) to test the API:

```bash
node test-organization-invite.js
```

Make sure to update the following variables in the test file:
- `BASE_URL`: Your server URL
- `TEST_ORG_ID`: Valid organization ID
- `TEST_EMAIL`: Test email address
- `AUTH_TOKEN`: Valid JWT token

## Frontend Integration

### Accept Invitation Flow

1. User clicks email link: `{FRONTEND_URL}/accept-invite?token={token}`
2. Frontend calls `GET /api/invite/{token}` to get invitation details
3. User confirms acceptance
4. Frontend calls `POST /api/invite/{token}/accept` with user's JWT
5. User is now a member of the organization

### Invitation Management UI

Consider adding these frontend features:
- Pending invitations list for organization admins
- Invitation status tracking
- Resend invitation functionality
- Bulk invitation capabilities

## Changelog

### New Features Added:
1. ✅ Email-based invitation system
2. ✅ Secure token generation and validation
3. ✅ Database storage in OrganizationUserInvites table
4. ✅ Professional HTML email templates
5. ✅ Comprehensive error handling
6. ✅ Input validation middleware
7. ✅ Invitation expiration management
8. ✅ Accept/reject functionality
9. ✅ Public invitation details endpoint
10. ✅ Email service with multiple provider support

### API Changes:
- **Enhanced:** `POST /organization/:orgId/invite` now sends emails and stores in invite table
- **Added:** `GET /invite/:token` for getting invitation details
- **Added:** `POST /invite/:token/accept` for accepting invitations
- **Added:** `POST /invite/:token/reject` for rejecting invitations

### Database Changes:
- **Using:** `organization_user_invites` table for invitation storage
- **Enhanced:** Metadata field for email status and permissions

This system provides a complete, secure, and user-friendly invitation workflow for organizations.