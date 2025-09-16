# Organization API Documentation

This document provides comprehensive documentation for all organization-related endpoints in the FeedAQ Academy Backend.

## Base URL
```
/api/organization
```

## Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Table of Contents

1. [Organization Management](#organization-management)
2. [Organization User Management](#organization-user-management)
3. [Organization Groups Management](#organization-groups-management)
4. [Bulk Operations](#bulk-operations)
5. [Search and Filter](#search-and-filter)
6. [Error Responses](#error-responses)

---

## Organization Management

### 1. Register Organization
**POST** `/registerOrg`

Creates a new organization.

**Request Body:**
```json
{
  "orgName": "string (required, 2-100 chars)",
  "orgEmail": "string (required, valid email)",
  "orgContactNo": "string (optional, valid phone)",
  "orgDomain": "string (optional)",
  "orgAddress": "string (optional)",
  "orgCity": "string (optional)",
  "orgState": "string (optional)",
  "orgCountry": "string (optional, default: India)",
  "orgPincode": "string (optional)",
  "orgType": "enum (optional: company|educational|non_profit|government|startup)",
  "orgIndustry": "string (optional, max 100 chars)",
  "orgSize": "string (optional)",
  "orgWebsite": "string (optional, valid URL)",
  "orgDescription": "text (optional)",
  "adminName": "string (optional)",
  "adminEmail": "string (optional, valid email)",
  "metadata": "object (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Organization registered successfully",
  "data": {
    "orgId": 1,
    "orgName": "Example Corp",
    "orgEmail": "admin@example.com",
    // ... other organization fields
  }
}
```

### 2. Get All Organizations
**GET** `/organizations`

Retrieves all organizations with pagination and filtering.

**Query Parameters:**
- `page`: integer (default: 1)
- `limit`: integer (default: 10, max: 100)
- `search`: string (searches name, description, industry)
- `orgType`: enum (company|educational|non_profit|government|startup)
- `orgIndustry`: string
- `orgStatus`: enum (ACTIVE|INACTIVE|SUSPENDED)
- `sortBy`: string (default: orgCreatedAt)
- `sortOrder`: enum (ASC|DESC, default: DESC)

**Response:**
```json
{
  "success": true,
  "data": {
    "organizations": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "pages": 10
    }
  }
}
```

### 3. Get Organization Details
**GET** `/organization/:orgId`

Retrieves detailed information about a specific organization.

**Response:**
```json
{
  "success": true,
  "data": {
    "orgId": 1,
    "orgName": "Example Corp",
    "organizationUsers": [...],
    // ... complete organization data
  }
}
```

### 4. Update Organization
**PUT** `/organization/:orgId`

Updates organization profile information.

**Request Body:**
```json
{
  "orgName": "string (optional)",
  "orgDescription": "text (optional)",
  // ... any organization fields to update
}
```

### 5. Delete Organization
**DELETE** `/organization/:orgId`

Soft deletes an organization (only admins can perform this action).

### 6. Update Organization Status
**PATCH** `/organization/:orgId/status`

Updates the status of an organization.

**Request Body:**
```json
{
  "status": "enum (ACTIVE|INACTIVE|SUSPENDED)"
}
```

### 7. Get Organization Statistics
**GET** `/organization/:orgId/stats`

Retrieves statistics and dashboard data for an organization.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 25,
    "groupCount": 5,
    "usersByRole": {
      "ADMIN_ACTIVE": 2,
      "MEMBER_ACTIVE": 20,
      "INSTRUCTOR_ACTIVE": 3
    },
    "organizationInfo": {
      "name": "Example Corp",
      "status": "ACTIVE",
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

---

## Organization User Management

### 1. Invite User to Organization
**POST** `/organization/:orgId/invite`

Invites a user to join the organization.

**Request Body:**
```json
{
  "email": "string (required, valid email)",
  "userRole": "enum (optional, default: MEMBER, values: ADMIN|MANAGER|INSTRUCTOR|MEMBER)",
  "permissions": "object (optional)"
}
```

### 2. Accept Organization Invitation
**POST** `/organization/:orgId/accept-invite`

Accepts a pending invitation to join the organization.

### 3. Reject Organization Invitation
**POST** `/organization/:orgId/reject-invite`

Rejects a pending invitation to join the organization.

### 4. Get Organization Users
**GET** `/organization/:orgId/users`

Retrieves all users in the organization with pagination.

**Query Parameters:**
- `page`: integer (default: 1)
- `limit`: integer (default: 10, max: 100)
- `role`: enum (ADMIN|MANAGER|INSTRUCTOR|MEMBER)
- `status`: enum (PENDING|ACTIVE|INACTIVE|SUSPENDED)
- `search`: string (searches firstName, lastName, email)

### 5. Get Organization User Details
**GET** `/organization/:orgId/users/:userId`

Retrieves specific user details within the organization.

### 6. Update User Role
**PUT** `/organization/:orgId/users/:userId/role`

Updates a user's role within the organization.

**Request Body:**
```json
{
  "userRole": "enum (ADMIN|MANAGER|INSTRUCTOR|MEMBER)",
  "permissions": "object (optional)"
}
```

### 7. Update User Status
**PATCH** `/organization/:orgId/users/:userId/status`

Updates a user's status within the organization.

**Request Body:**
```json
{
  "status": "enum (PENDING|ACTIVE|INACTIVE|SUSPENDED)"
}
```

### 8. Remove User from Organization
**DELETE** `/organization/:orgId/users/:userId`

Removes a user from the organization.

### 9. Get User's Organizations
**GET** `/user/organizations`

Retrieves all organizations the authenticated user belongs to.

---

## Organization Groups Management

### 1. Create Group
**POST** `/organization/:orgId/groups`

Creates a new group within the organization.

**Request Body:**
```json
{
  "groupName": "string (required, 2-100 chars)",
  "description": "string (optional, max 500 chars)",
  "metadata": "object (optional)"
}
```

### 2. Get Organization Groups
**GET** `/organization/:orgId/groups`

Retrieves all groups in the organization.

**Query Parameters:**
- `page`: integer (default: 1)
- `limit`: integer (default: 10, max: 100)
- `status`: enum (ACTIVE|INACTIVE)
- `search`: string (searches groupName, description)

### 3. Get Group Details
**GET** `/organization/:orgId/groups/:groupId`

Retrieves detailed information about a specific group.

### 4. Update Group
**PUT** `/organization/:orgId/groups/:groupId`

Updates group information.

**Request Body:**
```json
{
  "groupName": "string (optional)",
  "description": "string (optional)",
  "status": "enum (optional, ACTIVE|INACTIVE)",
  "metadata": "object (optional)"
}
```

### 5. Delete Group
**DELETE** `/organization/:orgId/groups/:groupId`

Deletes a group from the organization.

### 6. Add Users to Group
**POST** `/organization/:orgId/groups/:groupId/users`

Adds multiple users to a group.

**Request Body:**
```json
{
  "userIds": "array of integers (required, min 1 user)"
}
```

### 7. Remove User from Group
**DELETE** `/organization/:orgId/groups/:groupId/users/:userId`

Removes a user from a group.

### 8. Get Group Members
**GET** `/organization/:orgId/groups/:groupId/users`

Retrieves all members of a group with pagination.

---

## Bulk Operations

### 1. Bulk Invite Users
**POST** `/organization/:orgId/bulk-invite`

Invites multiple users to the organization at once.

**Request Body:**
```json
{
  "users": [
    {
      "email": "user1@example.com",
      "userRole": "MEMBER"
    },
    {
      "email": "user2@example.com",
      "userRole": "INSTRUCTOR"
    }
  ],
  "defaultRole": "MEMBER"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk invitation completed",
  "data": {
    "successful": [
      {"email": "user1@example.com", "userId": 123}
    ],
    "failed": [
      {"email": "user2@example.com", "reason": "User not found"}
    ]
  }
}
```

### 2. Bulk Update User Roles
**PATCH** `/organization/:orgId/bulk-update-roles`

Updates roles for multiple users at once.

**Request Body:**
```json
{
  "updates": [
    {"userId": 123, "userRole": "MANAGER"},
    {"userId": 124, "userRole": "INSTRUCTOR"}
  ]
}
```

### 3. Export Organization Data
**GET** `/organization/:orgId/export`

Exports organization data including users and groups.

**Query Parameters:**
- `format`: string (default: json, options: json|csv)

---

## Search and Filter

### 1. Search Organizations
**GET** `/search/organizations`

Searches for organizations across the platform.

**Query Parameters:**
- `q`: string (required, search query)
- `type`: enum (company|educational|non_profit|government|startup)
- `industry`: string
- `status`: enum (ACTIVE|INACTIVE|SUSPENDED)
- `limit`: integer (default: 10, max: 100)

### 2. Search Organization Users
**GET** `/organization/:orgId/search/users`

Searches for users within a specific organization.

**Query Parameters:**
- `q`: string (required, search query)
- `role`: enum (ADMIN|MANAGER|INSTRUCTOR|MEMBER)
- `status`: enum (PENDING|ACTIVE|INACTIVE|SUSPENDED)
- `limit`: integer (default: 10, max: 100)

### 3. Search Organization Groups
**GET** `/organization/:orgId/search/groups`

Searches for groups within a specific organization.

**Query Parameters:**
- `q`: string (required, search query)
- `status`: enum (ACTIVE|INACTIVE)
- `limit`: integer (default: 10, max: 100)

---

## Error Responses

### Common Error Codes

**400 Bad Request**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "orgName",
      "message": "Organization name is required"
    }
  ]
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "message": "User not authenticated"
}
```

**403 Forbidden**
```json
{
  "success": false,
  "message": "Insufficient permissions to perform this action"
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "Organization not found"
}
```

**409 Conflict**
```json
{
  "success": false,
  "message": "Organization with this email already exists"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Detailed error message"
}
```

### User Roles and Permissions

- **ADMIN**: Full access to all organization features
- **MANAGER**: Can manage users and groups, cannot delete organization
- **INSTRUCTOR**: Can view organization data and manage assigned groups
- **MEMBER**: Basic access to organization features

### Organization Status

- **ACTIVE**: Organization is fully operational
- **INACTIVE**: Organization is temporarily disabled
- **SUSPENDED**: Organization is suspended due to policy violations

### User Status within Organization

- **PENDING**: Invitation sent but not yet accepted
- **ACTIVE**: User is active member of organization
- **INACTIVE**: User account is temporarily disabled
- **SUSPENDED**: User is suspended from organization

---

## Rate Limiting

All endpoints are subject to rate limiting:
- **Authentication required endpoints**: 100 requests per minute per user
- **Search endpoints**: 50 requests per minute per user
- **Bulk operations**: 10 requests per minute per user

---

## Notes

1. All timestamps are in ISO 8601 format (UTC)
2. Soft deletes are used - deleted records are not permanently removed
3. All endpoints support CORS for cross-origin requests
4. File uploads for organization logos/documents will be added in future versions
5. Webhook support for organization events will be added in future versions
