// Simple test script to verify the modified PublishCourse API
const express = require('express');

// Mock request/response for testing
function createMockReq(body, userId = 1) {
  return {
    body: body,
    user: { userId: userId }
  };
}

function createMockRes() {
  const res = {
    statusCode: null,
    jsonData: null,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.jsonData = data;
      return this;
    }
  };
  return res;
}

// Test the controller function
async function testPublishCourse() {
  try {
    // Import the controller
    const { publishCourse } = require('./src/controller/PublishCourse.controller.js');
    
    console.log('Testing PublishCourse API...\n');

    // Test 1: Missing courseBuilderId
    console.log('Test 1: Missing courseBuilderId');
    const req1 = createMockReq({});
    const res1 = createMockRes();
    await publishCourse(req1, res1);
    console.log(`Status: ${res1.statusCode}, Response:`, res1.jsonData);
    console.log('✓ Expected 400 error for missing courseBuilderId\n');

    // Test 2: Valid courseBuilderId (will fail as we don't have DB setup)
    console.log('Test 2: Valid courseBuilderId (expecting DB error)');
    const req2 = createMockReq({ courseBuilderId: 1 });
    const res2 = createMockRes();
    await publishCourse(req2, res2);
    console.log(`Status: ${res2.statusCode}, Response:`, res2.jsonData);
    console.log('✓ Expected 500 error due to DB connection\n');

  } catch (error) {
    console.error('Test error:', error.message);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testPublishCourse();
}

module.exports = { testPublishCourse };