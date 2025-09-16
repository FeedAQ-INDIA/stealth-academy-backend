# Organization Creation Logic Implementation

## Business Rule
**A user can create only 1 organization but can be part of multiple organizations.**

## Implementation Summary

### 1. Database Structure
The implementation leverages the existing database structure:

- **Organization Table**: Stores organization details
- **OrganizationUser Table**: Junction table that tracks:
  - Which users belong to which organizations
  - User roles within organizations (ADMIN, MANAGER, INSTRUCTOR, MEMBER)
  - Who invited the user (`invitedBy` field)
  - When they joined (`joinedAt` field)

### 2. Key Logic

#### Organization Creation Validation
When a user tries to create an organization, the system:

1. **Checks for existing organization with same email** (existing validation)
2. **NEW: Checks if user has already created an organization** by querying:
   ```sql
   SELECT * FROM organization_user 
   WHERE userId = :userId 
   AND userRole = 'ADMIN' 
   AND invitedBy IS NULL
   ```
   - `userRole = 'ADMIN'`: Only admins can create organizations
   - `invitedBy IS NULL`: Indicates the user created the org (vs being invited as admin)

3. **If user already created an org**: Returns error message
4. **If user hasn't created an org**: Allows creation and:
   - Creates the organization
   - Adds user as ADMIN with `invitedBy = NULL` (marking them as creator)

#### Multiple Organization Membership
Users can still:
- Be invited to other organizations as any role (ADMIN, MANAGER, INSTRUCTOR, MEMBER)
- Accept invitations to join multiple organizations
- These memberships will have `invitedBy` set to the inviter's userId

### 3. Code Changes

#### Modified Files:

1. **Organization.controller.js**:
   - Added validation in `registerOrganization()` function
   - Added new `canCreateOrganization()` endpoint
   - Updated organization creator addition logic

2. **organization.route.js**:
   - Added new route: `GET /canCreateOrganization`

#### New Functions:

1. **`canCreateOrganization()`**: 
   - Checks if authenticated user can create an organization
   - Returns existing organization info if user already created one
   - Useful for frontend to show/hide "Create Organization" UI

### 4. API Endpoints

#### New Endpoint:
```
GET /api/organizations/canCreateOrganization
Headers: Authorization: Bearer <token>

Response:
{
  "success": true,
  "canCreate": false,
  "message": "You have already created an organization. You can only create one organization.",
  "existingOrganization": {
    "orgId": 1,
    "orgName": "My Company",
    "orgEmail": "admin@mycompany.com",
    "orgStatus": "ACTIVE"
  }
}
```

#### Modified Endpoint:
```
POST /api/organizations/registerOrg
Headers: Authorization: Bearer <token>

New Error Response (409 Conflict):
{
  "success": false,
  "message": "You can only create one organization. However, you can be part of multiple organizations as a member."
}
```

### 5. Database Distinctions

#### Organization Creator (Can create only 1):
```sql
userId: 123, orgId: 1, userRole: 'ADMIN', invitedBy: NULL
```

#### Organization Admin (Invited as admin):
```sql
userId: 123, orgId: 2, userRole: 'ADMIN', invitedBy: 456
```

#### Organization Member:
```sql
userId: 123, orgId: 3, userRole: 'MEMBER', invitedBy: 789
```

### 6. Benefits

1. **Clear Business Logic**: Easy to understand and maintain
2. **Flexible Membership**: Users can still participate in multiple organizations
3. **Audit Trail**: Can track who created vs who was invited to organizations
4. **Frontend Integration**: New endpoint allows UI to show appropriate options
5. **Backward Compatible**: Existing invitation and membership features unchanged

### 7. Frontend Integration

The frontend can now:
1. Call `canCreateOrganization` to check if user can create organizations
2. Show/hide "Create Organization" button based on response
3. Display existing organization info if user already created one
4. Show appropriate error messages during organization creation

### 8. Testing

Use the provided test script to verify the logic:
```bash
node test-organization-creation-logic.js
```

This implementation ensures the business rule is enforced while maintaining all existing functionality for organization membership and invitations.
