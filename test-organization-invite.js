// Test script for the new organization invitation system
const axios = require('axios');

const BASE_URL = 'http://localhost:8000'; // Adjust based on your server port
const TEST_ORG_ID = 1; // Replace with actual organization ID
const TEST_EMAIL = 'test@example.com';

// Mock JWT token - replace with actual token for testing
const AUTH_TOKEN = 'your-jwt-token-here';

const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json'
};

async function testInviteUser() {
    try {
        console.log('🚀 Testing organization user invitation...');
        
        const inviteData = {
            email: TEST_EMAIL,
            userRole: 'MEMBER',
            message: 'Welcome to our organization! We are excited to have you join our team.',
            permissions: {
                canViewCourses: true,
                canCreateNotes: true
            }
        };

        const response = await axios.post(
            `${BASE_URL}/api/organization/${TEST_ORG_ID}/invite`,
            inviteData,
            { headers }
        );

        console.log('✅ Invitation sent successfully!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
        return response.data.data.invitation.inviteToken;
    } catch (error) {
        console.error('❌ Error sending invitation:', error.response?.data || error.message);
        return null;
    }
}

async function testGetInvitation(token) {
    try {
        console.log('🔍 Testing get invitation by token...');
        
        const response = await axios.get(`${BASE_URL}/api/invite/${token}`);
        
        console.log('✅ Invitation details retrieved successfully!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
        return true;
    } catch (error) {
        console.error('❌ Error getting invitation:', error.response?.data || error.message);
        return false;
    }
}

async function testAcceptInvitation(token) {
    try {
        console.log('✅ Testing accept invitation...');
        
        const response = await axios.post(
            `${BASE_URL}/api/invite/${token}/accept`,
            {},
            { headers }
        );
        
        console.log('✅ Invitation accepted successfully!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
        return true;
    } catch (error) {
        console.error('❌ Error accepting invitation:', error.response?.data || error.message);
        return false;
    }
}

async function runTests() {
    console.log('🧪 Starting Organization Invitation API Tests...\n');
    
    // Test 1: Invite User
    const inviteToken = await testInviteUser();
    if (!inviteToken) {
        console.log('❌ Cannot continue tests without valid invite token');
        return;
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 2: Get Invitation Details
    const getSuccess = await testGetInvitation(inviteToken);
    if (!getSuccess) {
        console.log('❌ Get invitation test failed');
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 3: Accept Invitation
    const acceptSuccess = await testAcceptInvitation(inviteToken);
    if (!acceptSuccess) {
        console.log('❌ Accept invitation test failed');
    }
    
    console.log('\n🎉 Tests completed!');
}

// Environment Variables Information
console.log('📋 Environment Variables Required:');
console.log('- SMTP_HOST: SMTP server hostname (default: smtp.gmail.com)');
console.log('- SMTP_PORT: SMTP server port (default: 587)');
console.log('- SMTP_USER: SMTP username/email');
console.log('- SMTP_PASS: SMTP password/app password');
console.log('- FRONTEND_URL: Frontend URL for accept links (default: http://localhost:3000)');
console.log('\n📧 Email Configuration Notes:');
console.log('- If SMTP credentials are not provided, emails will be logged but not sent');
console.log('- For Gmail, use App Passwords instead of account password');
console.log('- Make sure "Less secure app access" is enabled or use OAuth2');
console.log('\n' + '='.repeat(50) + '\n');

// Uncomment the line below to run the tests
// runTests();

module.exports = {
    testInviteUser,
    testGetInvitation,
    testAcceptInvitation,
    runTests
};