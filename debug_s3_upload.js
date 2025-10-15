const { s3, defaultBucket } = require('./src/config/s3.config');
require('dotenv').config();

/**
 * Debug S3 configuration and test upload
 */
async function debugS3Upload() {
    console.log('🔍 S3 Configuration Debug\n');
    
    // Print current configuration
    console.log('📋 Current S3 Configuration:');
    console.log('- Access Key ID:', process.env.S3_ACCESS_KEY_ID ? 'Set' : 'Not Set');
    console.log('- Secret Access Key:', process.env.S3_SECRET_ACCESS_KEY ? 'Set' : 'Not Set');
    console.log('- Region:', process.env.S3_REGION);
    console.log('- Endpoint:', process.env.S3_ENDPOINT);
    console.log('- Force Path Style:', process.env.S3_FORCE_PATH_STYLE);
    console.log('- Default Bucket:', defaultBucket);
    console.log('- S3 Config Object:', {
        region: s3.config.region,
        endpoint: s3.config.endpoint,
        s3ForcePathStyle: s3.config.s3ForcePathStyle,
        signatureVersion: s3.config.signatureVersion
    });
    console.log();

    try {
        // Test 1: Create test file data
        console.log('📤 Test 1: Preparing test upload...');
        const testFileData = {
            buffer: Buffer.from('Test upload content'),
            originalname: 'test-debug.txt',
            mimetype: 'text/plain',
            size: 19
        };

        // Test 2: Create upload parameters manually
        console.log('📝 Test 2: Creating upload parameters...');
        const uploadParams = {
            Bucket: defaultBucket,
            Key: `debug-test-${Date.now()}.txt`,
            Body: testFileData.buffer,
            ContentType: testFileData.mimetype,
            ContentLength: testFileData.size,
            ACL: 'public-read'
        };

        console.log('Upload Parameters:', uploadParams);
        console.log();

        // Test 3: Try upload
        console.log('🚀 Test 3: Attempting upload...');
        const uploadResult = await s3.upload(uploadParams).promise();
        
        console.log('✅ Upload successful!');
        console.log('Upload Result:', uploadResult);
        console.log();

        // Test 4: Clean up
        console.log('🗑️ Test 4: Cleaning up...');
        await s3.deleteObject({
            Bucket: defaultBucket,
            Key: uploadParams.Key
        }).promise();
        
        console.log('✅ Cleanup successful!');
        console.log('\n🎉 All tests passed! S3 configuration is working correctly.');

    } catch (error) {
        console.error('❌ Upload failed:', error);
        console.error('\n🛠️ Troubleshooting suggestions:');
        
        if (error.message.includes('Inaccessible host')) {
            console.error('1. Check if the S3_ENDPOINT URL is correct');
            console.error('2. Verify the region setting matches your Supabase project');
            console.error('3. Ensure S3_FORCE_PATH_STYLE is set to true for Supabase');
        }
        
        if (error.message.includes('SignatureDoesNotMatch')) {
            console.error('1. Verify your S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY');
            console.error('2. Check if the credentials have the right permissions');
            console.error('3. Ensure the bucket exists and is accessible');
        }

        console.error('\n📋 Current endpoint breakdown:');
        if (process.env.S3_ENDPOINT) {
            const url = new URL(process.env.S3_ENDPOINT);
            console.error('- Protocol:', url.protocol);
            console.error('- Host:', url.hostname);
            console.error('- Port:', url.port || 'default');
            console.error('- Path:', url.pathname);
        }
    }
}

// Run the debug test
if (require.main === module) {
    debugS3Upload().catch(error => {
        console.error('\n💥 Unexpected error:', error);
        process.exit(1);
    });
}

module.exports = { debugS3Upload };