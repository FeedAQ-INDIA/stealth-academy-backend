const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// Test the notes file upload functionality
async function testNotesFileUpload() {
    try {
        console.log('🧪 Testing Notes File Upload...');
        
        // Create a test file
        const testFileName = 'test-file.txt';
        const testFilePath = path.join(__dirname, testFileName);
        const testContent = 'This is a test file for notes attachment';
        fs.writeFileSync(testFilePath, testContent);
        
        // Prepare form data
        const formData = new FormData();
        formData.append('courseId', '1');
        formData.append('courseContentId', '1');
        formData.append('noteContent', 'This is a test note with file attachment');
        formData.append('noteRefTimestamp', '120.5');
        formData.append('metadata', JSON.stringify({
            hasAudio: true,
            hasFiles: true,
            totalFiles: 1,
            customField: 'test-value'
        }));
        formData.append('files', fs.createReadStream(testFilePath), {
            filename: testFileName,
            contentType: 'text/plain'
        });
        
        // Make request
        console.log('📤 Sending request...');
        const response = await axios.post('http://localhost:8000/api/saveNote', formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': 'Bearer YOUR_TEST_TOKEN_HERE' // Replace with actual token
            }
        });
        
        console.log('✅ Response Status:', response.status);
        console.log('📝 Response Data:', JSON.stringify(response.data, null, 2));
        
        // Clean up test file
        fs.unlinkSync(testFilePath);
        console.log('🧹 Cleaned up test file');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        // Clean up test file even on error
        try {
            const testFilePath = path.join(__dirname, 'test-file.txt');
            if (fs.existsSync(testFilePath)) {
                fs.unlinkSync(testFilePath);
            }
        } catch (cleanupError) {
            // Ignore cleanup errors
        }
    }
}

// Test without authentication (public endpoint)
async function testNotesFileUploadPublic() {
    try {
        console.log('🧪 Testing Notes File Upload (Public Mode)...');
        
        // Create a test file
        const testFileName = 'test-file-public.txt';
        const testFilePath = path.join(__dirname, testFileName);
        const testContent = 'This is a test file for notes attachment (public)';
        fs.writeFileSync(testFilePath, testContent);
        
        // First upload file directly
        console.log('📤 Uploading file first...');
        const fileFormData = new FormData();
        fileFormData.append('file', fs.createReadStream(testFilePath), {
            filename: testFileName,
            contentType: 'text/plain'
        });
        
        const fileUploadResponse = await axios.post('http://localhost:8000/api/upload/single', fileFormData, {
            headers: fileFormData.getHeaders()
        });
        
        console.log('✅ File Upload Response:', JSON.stringify(fileUploadResponse.data, null, 2));
        
        // Now test with manual metadata
        const testMetadata = {
            hasAudio: false,
            hasFiles: true,
            totalFiles: 1,
            attachments: [
                {
                    fileId: 999,
                    fileName: testFileName,
                    fileUrl: 'https://example.com/test-file.txt',
                    mimeType: 'text/plain',
                    fileSize: testContent.length,
                    bucket: 'test-bucket',
                    filePath: '/test/path',
                    isPublic: true,
                    uploadedAt: new Date()
                }
            ],
            hasAttachments: true,
            attachmentCount: 1
        };
        
        console.log('📋 Test metadata structure:', JSON.stringify(testMetadata, null, 2));
        
        // Clean up test file
        fs.unlinkSync(testFilePath);
        console.log('🧹 Cleaned up test file');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        // Clean up test file even on error
        try {
            const testFilePath = path.join(__dirname, 'test-file-public.txt');
            if (fs.existsSync(testFilePath)) {
                fs.unlinkSync(testFilePath);
            }
        } catch (cleanupError) {
            // Ignore cleanup errors
        }
    }
}

console.log('🚀 Starting Notes File Upload Tests...');
console.log('');

// Run tests
testNotesFileUploadPublic();

console.log('');
console.log('💡 To test with authentication, replace YOUR_TEST_TOKEN_HERE with a valid JWT token');
console.log('📚 Check the logs in the backend server to see the metadata processing');