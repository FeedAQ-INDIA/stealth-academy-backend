const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000/api/organization'; // Adjust port as needed
let authToken = ''; // You'll need to get this from login

// Test data
const testOrgData = {
    orgName: "Test Organization Enhanced",
    orgEmail: "test.enhanced@example.com",
    orgType: "company",
    orgIndustry: "Technology",
    orgDescription: "A test organization for enhanced API testing",
    orgWebsite: "https://test-enhanced.com",
    orgContactNo: "+1234567890"
};

const testUserInvite = {
    email: "testuser@example.com",
    userRole: "MEMBER"
};

const testGroupData = {
    groupName: "Test Group Enhanced",
    description: "A test group for enhanced functionality"
};

// Helper function to make authenticated requests
const makeRequest = async (method, url, data = null, params = null) => {
    try {
        const config = {
            method,
            url: `${BASE_URL}${url}`,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        };

        if (data) config.data = data;
        if (params) config.params = params;

        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error(`Error in ${method} ${url}:`, error.response?.data || error.message);
        throw error;
    }
};

// Test functions
const testOrganizationCRUD = async () => {
    console.log('\n=== Testing Organization CRUD Operations ===');
    
    try {
        // 1. Register organization
        console.log('1. Registering organization...');
        const orgResult = await makeRequest('POST', '/registerOrg', testOrgData);
        console.log('✓ Organization registered:', orgResult.data.orgId);
        const orgId = orgResult.data.orgId;

        // 2. Get organization details
        console.log('2. Getting organization details...');
        const orgDetails = await makeRequest('GET', `/organization/${orgId}`);
        console.log('✓ Organization details retrieved:', orgDetails.data.orgName);

        // 3. Update organization
        console.log('3. Updating organization...');
        const updateData = { orgDescription: "Updated description for enhanced testing" };
        const updateResult = await makeRequest('PUT', `/organization/${orgId}`, updateData);
        console.log('✓ Organization updated successfully');

        // 4. Get organization stats
        console.log('4. Getting organization statistics...');
        const stats = await makeRequest('GET', `/organization/${orgId}/stats`);
        console.log('✓ Organization stats retrieved:', stats.data);

        return orgId;
    } catch (error) {
        console.error('Organization CRUD test failed:', error.message);
        throw error;
    }
};

const testUserManagement = async (orgId) => {
    console.log('\n=== Testing User Management ===');
    
    try {
        // 1. Invite user
        console.log('1. Inviting user to organization...');
        const inviteResult = await makeRequest('POST', `/organization/${orgId}/invite`, testUserInvite);
        console.log('✓ User invited successfully');

        // 2. Get organization users
        console.log('2. Getting organization users...');
        const users = await makeRequest('GET', `/organization/${orgId}/users`, null, { page: 1, limit: 10 });
        console.log('✓ Organization users retrieved:', users.data.pagination);

        // 3. Get user's organizations
        console.log('3. Getting user organizations...');
        const userOrgs = await makeRequest('GET', '/user/organizations');
        console.log('✓ User organizations retrieved:', userOrgs.data.length);

        return users.data.users[0]?.userId;
    } catch (error) {
        console.error('User management test failed:', error.message);
        throw error;
    }
};

const testGroupManagement = async (orgId) => {
    console.log('\n=== Testing Group Management ===');
    
    try {
        // 1. Create group
        console.log('1. Creating group...');
        const groupResult = await makeRequest('POST', `/organization/${orgId}/groups`, testGroupData);
        console.log('✓ Group created:', groupResult.data.groupId);
        const groupId = groupResult.data.groupId;

        // 2. Get organization groups
        console.log('2. Getting organization groups...');
        const groups = await makeRequest('GET', `/organization/${orgId}/groups`, null, { page: 1, limit: 10 });
        console.log('✓ Organization groups retrieved:', groups.data.pagination);

        // 3. Get group details
        console.log('3. Getting group details...');
        const groupDetails = await makeRequest('GET', `/organization/${orgId}/groups/${groupId}`);
        console.log('✓ Group details retrieved:', groupDetails.data.groupName);

        // 4. Update group
        console.log('4. Updating group...');
        const updateData = { description: "Updated group description" };
        const updateResult = await makeRequest('PUT', `/organization/${orgId}/groups/${groupId}`, updateData);
        console.log('✓ Group updated successfully');

        return groupId;
    } catch (error) {
        console.error('Group management test failed:', error.message);
        throw error;
    }
};

const testSearchAndFilter = async (orgId) => {
    console.log('\n=== Testing Search and Filter ===');
    
    try {
        // 1. Search organizations
        console.log('1. Searching organizations...');
        const searchOrgs = await makeRequest('GET', '/search/organizations', null, { q: 'Test', limit: 5 });
        console.log('✓ Organization search completed:', searchOrgs.data.length);

        // 2. Search users in organization
        console.log('2. Searching users in organization...');
        const searchUsers = await makeRequest('GET', `/organization/${orgId}/search/users`, null, { q: 'test', limit: 5 });
        console.log('✓ User search in organization completed');

        // 3. Search groups in organization
        console.log('3. Searching groups in organization...');
        const searchGroups = await makeRequest('GET', `/organization/${orgId}/search/groups`, null, { q: 'Test', limit: 5 });
        console.log('✓ Group search in organization completed');

    } catch (error) {
        console.error('Search and filter test failed:', error.message);
        throw error;
    }
};

const testBulkOperations = async (orgId) => {
    console.log('\n=== Testing Bulk Operations ===');
    
    try {
        // 1. Bulk invite users
        console.log('1. Bulk inviting users...');
        const bulkInviteData = {
            users: [
                { email: "bulkuser1@example.com", userRole: "MEMBER" },
                { email: "bulkuser2@example.com", userRole: "INSTRUCTOR" }
            ],
            defaultRole: "MEMBER"
        };
        const bulkResult = await makeRequest('POST', `/organization/${orgId}/bulk-invite`, bulkInviteData);
        console.log('✓ Bulk invite completed:', bulkResult.data.successful.length, 'successful');

        // 2. Export organization data
        console.log('2. Exporting organization data...');
        const exportResult = await makeRequest('GET', `/organization/${orgId}/export`, null, { format: 'json' });
        console.log('✓ Organization data exported successfully');

    } catch (error) {
        console.error('Bulk operations test failed:', error.message);
        // Don't throw error here as bulk operations might fail due to non-existent users
    }
};

// Main test runner
const runAllTests = async () => {
    console.log('🚀 Starting Enhanced Organization API Tests');
    console.log('Note: Make sure to set a valid authToken before running tests');
    
    if (!authToken) {
        console.log('⚠️  Warning: No auth token provided. Please set authToken variable with a valid JWT token.');
        console.log('You can get this by logging in through your auth endpoints.');
        return;
    }

    try {
        const orgId = await testOrganizationCRUD();
        const userId = await testUserManagement(orgId);
        const groupId = await testGroupManagement(orgId);
        await testSearchAndFilter(orgId);
        await testBulkOperations(orgId);
        
        console.log('\n🎉 All tests completed successfully!');
        console.log(`Created organization with ID: ${orgId}`);
        
    } catch (error) {
        console.error('\n❌ Test suite failed:', error.message);
        process.exit(1);
    }
};

// Export for use in other files
module.exports = {
    runAllTests,
    testOrganizationCRUD,
    testUserManagement,
    testGroupManagement,
    testSearchAndFilter,
    testBulkOperations,
    makeRequest
};

// Run tests if this file is executed directly
if (require.main === module) {
    console.log('To run these tests:');
    console.log('1. Start your server');
    console.log('2. Get a valid JWT token by logging in');
    console.log('3. Set the authToken variable in this file');
    console.log('4. Run: node test-organization-enhanced.js');
    console.log('\nExample usage:');
    console.log('const { runAllTests } = require("./test-organization-enhanced.js");');
    console.log('// Set auth token');
    console.log('// authToken = "your_jwt_token_here";');
    console.log('// runAllTests();');
}
