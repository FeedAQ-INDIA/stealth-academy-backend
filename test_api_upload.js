const FormData = require('form-data');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function testAPIUpload() {
    console.log('🧪 Testing File Upload API...\n');

    try {
        // Create a test file
        const testContent = 'This is a test file for API upload';
        const testFilePath = path.join(__dirname, 'temp-test-file.txt');
        fs.writeFileSync(testFilePath, testContent);

        console.log('📄 Created test file:', testFilePath);

        // Create form data
        const formData = new FormData();
        formData.append('file', fs.createReadStream(testFilePath));
        formData.append('folder', 'api-test');
        formData.append('isPublic', 'true');

        console.log('📤 Uploading via API...');

        // Make API request
        const response = await fetch('http://localhost:3000/api/upload/single', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        console.log('📋 API Response Status:', response.status);
        console.log('📋 API Response:', JSON.stringify(result, null, 2));

        // Clean up test file
        fs.unlinkSync(testFilePath);
        console.log('🗑️ Cleaned up test file');

        if (response.ok) {
            console.log('✅ API upload successful!');
        } else {
            console.log('❌ API upload failed');
        }

    } catch (error) {
        console.error('💥 Test failed:', error);
    }
}

// Check if node-fetch is available
try {
    require('node-fetch');
    require('form-data');
} catch (error) {
    console.log('Installing required test dependencies...');
    const { execSync } = require('child_process');
    execSync('npm install node-fetch@2 form-data', { stdio: 'inherit' });
}

if (require.main === module) {
    testAPIUpload();
}