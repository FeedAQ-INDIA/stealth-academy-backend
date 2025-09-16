# Organization Groups API Documentation

This API provides comprehensive management for organizations, groups, and user memberships.

## Base URL
All endpoints use the base path configured in your server.

## Authentication
All endpoints require authentication via the `authMiddleware`.

## API Endpoints

### Organization User Management

#### 1. Add User to Organization
- **POST** `/organization/:orgId/users`
- **Description**: Add a user to an organization
- **Parameters**:
  - `orgId` (path): Organization ID
- **Body**:
  ```json
  {
    "userId": 123,
    "role": "MEMBER",  // Optional: "MEMBER" or "ADMIN", defaults to "MEMBER"
    "invitedBy": 456   // Optional: ID of user who invited this user
  }
  ```
- **Response**: Organization user object

#### 2. Remove User from Organization
- **DELETE** `/organization/:orgId/users/:userId`
- **Description**: Remove a user from an organization (also removes from all groups)
- **Parameters**:
  - `orgId` (path): Organization ID
  - `userId` (path): User ID

#### 3. Update User Role in Organization
- **PUT** `/organization/:orgId/users/:userId/role`
- **Description**: Update a user's role in an organization
- **Parameters**:
  - `orgId` (path): Organization ID
  - `userId` (path): User ID
- **Body**:
  ```json
  {
    "role": "ADMIN"  // "MEMBER" or "ADMIN"
  }
  ```

#### 4. Get Organization Users
- **GET** `/organization/:orgId/users?includeGroups=true`
- **Description**: Get all users in an organization
- **Parameters**:
  - `orgId` (path): Organization ID
  - `includeGroups` (query): Optional, set to "true" to include group memberships

### Group Management

#### 5. Create Group
- **POST** `/organization/:orgId/groups`
- **Description**: Create a new group in an organization
- **Parameters**:
  - `orgId` (path): Organization ID
- **Body**:
  ```json
  {
    "groupName": "Engineering Team",
    "description": "Software development team",  // Optional
    "metadata": {                                // Optional
      "department": "Technology",
      "budget": 50000
    }
  }
  ```

#### 6. Update Group
- **PUT** `/groups/:groupId`
- **Description**: Update group information
- **Parameters**:
  - `groupId` (path): Group ID
- **Body**:
  ```json
  {
    "groupName": "Senior Engineering Team",  // Optional
    "description": "Updated description",    // Optional
    "status": "ACTIVE",                      // Optional: "ACTIVE" or "INACTIVE"
    "metadata": {                           // Optional
      "department": "Technology"
    }
  }
  ```

#### 7. Delete Group
- **DELETE** `/groups/:groupId`
- **Description**: Delete a group (removes all members first)
- **Parameters**:
  - `groupId` (path): Group ID

#### 8. Get Organization Groups
- **GET** `/organization/:orgId/groups?includeMembers=true`
- **Description**: Get all groups in an organization
- **Parameters**:
  - `orgId` (path): Organization ID
  - `includeMembers` (query): Optional, set to "true" to include member details

#### 9. Get Group by ID
- **GET** `/groups/:groupId?includeMembers=true`
- **Description**: Get a specific group by ID
- **Parameters**:
  - `groupId` (path): Group ID
  - `includeMembers` (query): Optional, set to "true" to include member details

### Group Membership Management

#### 10. Add Users to Group
- **POST** `/groups/:groupId/users`
- **Description**: Add multiple users to a group
- **Parameters**:
  - `groupId` (path): Group ID
- **Body**:
  ```json
  {
    "userIds": [123, 456, 789],
    "role": "MEMBER"  // Optional: "MEMBER" or "ADMIN", defaults to "MEMBER"
  }
  ```

#### 11. Remove User from Group
- **DELETE** `/groups/:groupId/users/:userId`
- **Description**: Remove a user from a group
- **Parameters**:
  - `groupId` (path): Group ID
  - `userId` (path): User ID

#### 12. Update User Role in Group
- **PUT** `/groups/:groupId/users/:userId/role`
- **Description**: Update a user's role within a group
- **Parameters**:
  - `groupId` (path): Group ID
  - `userId` (path): User ID
- **Body**:
  ```json
  {
    "role": "ADMIN"  // "MEMBER" or "ADMIN"
  }
  ```

#### 13. Get Group Members
- **GET** `/groups/:groupId/users`
- **Description**: Get all members of a group
- **Parameters**:
  - `groupId` (path): Group ID

#### 14. Get User Groups
- **GET** `/users/:userId/groups?orgId=123`
- **Description**: Get all groups a user belongs to
- **Parameters**:
  - `userId` (path): User ID
  - `orgId` (query): Optional, filter by organization

## Response Format

All responses follow this format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",  // Optional
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## Common HTTP Status Codes

- **200**: Success (GET, PUT, DELETE operations)
- **201**: Created (POST operations)
- **400**: Bad Request (invalid data)
- **404**: Not Found (resource doesn't exist)
- **409**: Conflict (duplicate data)
- **500**: Internal Server Error

## Usage Examples

### Example 1: Create Organization Structure
```bash
# 1. Add users to organization
curl -X POST "/organization/1/users" \
  -H "Content-Type: application/json" \
  -d '{"userId": 123, "role": "ADMIN"}'

# 2. Create groups
curl -X POST "/organization/1/groups" \
  -H "Content-Type: application/json" \
  -d '{"groupName": "Engineering", "description": "Development team"}'

# 3. Add users to groups
curl -X POST "/groups/1/users" \
  -H "Content-Type: application/json" \
  -d '{"userIds": [123, 124, 125]}'
```

### Example 2: Get Complete Organization Data
```bash
# Get organization with users and their groups
curl -X GET "/organization/1/users?includeGroups=true"

# Get organization groups with members
curl -X GET "/organization/1/groups?includeMembers=true"
```

## Database Schema

### Organizations Table
- `org_id` (Primary Key)
- `org_name`
- `created_at`, `updated_at`

### Organization Users Table (organization_user)
- `org_id` (Foreign Key)
- `user_id` (Foreign Key) 
- `role` (ENUM: MEMBER, ADMIN)
- `invited_by` (Foreign Key, optional)

### Groups Table (group)
- `group_id` (Primary Key)
- `org_id` (Foreign Key)
- `group_name`
- `description`
- `status` (ENUM: ACTIVE, INACTIVE)
- `metadata` (JSONB)

### Group Users Table (group_user)
- `group_id` (Foreign Key)
- `user_id` (Foreign Key)
- `org_id` (Foreign Key)
- `role` (ENUM: MEMBER, ADMIN)

## Notes

1. **Cascade Operations**: Removing a user from an organization automatically removes them from all groups in that organization.

2. **Validation**: Users must be part of an organization before they can be added to any groups in that organization.

3. **Unique Constraints**: 
   - Group names must be unique within an organization
   - Users can only be added once to an organization
   - Users can only be added once to a group

4. **Soft Deletes**: All entities support soft deletes (paranoid mode) for data recovery.

5. **Indexes**: Proper database indexes are set up for optimal query performance.
