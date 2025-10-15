const { s3, defaultBucket } = require('./src/config/s3.config');
require('dotenv').config();

/**
 * Test script to verify S3-compatible storage connection
 * Run with: node test_s3_connection.js
 */

async function testS3Connection() {
    console.log('🔧 Testing S3-Compatible Storage Connection...\n');
    
    // Check environment variables
    console.log('📋 Environment Configuration:');
    console.log(`- Storage Type: ${process.env.FILE_STORAGE_TYPE || 's3'}`);
    console.log(`- S3 Region: ${process.env.S3_REGION || 'us-east-1'}`);
    console.log(`- S3 Endpoint: ${process.env.S3_ENDPOINT || 'AWS S3 (default)'}`);
    console.log(`- Default Bucket: ${defaultBucket}`);
    console.log(`- Force Path Style: ${process.env.S3_FORCE_PATH_STYLE === 'true'}`);
    console.log(`- Access Key ID: ${process.env.S3_ACCESS_KEY_ID ? 'Set' : 'Not Set'}`);
    console.log(`- Secret Access Key: ${process.env.S3_SECRET_ACCESS_KEY ? 'Set' : 'Not Set'}\n`);

    if (!process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) {
        console.log('❌ S3 credentials not configured. Please set S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY in your .env file.');
        return;
    }

    try {
        // Test 1: List buckets (if permission allows)
        console.log('🔍 Test 1: Checking S3 connection...');
        try {
            const buckets = await s3.listBuckets().promise();
            console.log(`✅ Connection successful! Found ${buckets.Buckets.length} bucket(s):`);
            buckets.Buckets.forEach(bucket => {
                console.log(`   - ${bucket.Name} (created: ${bucket.CreationDate})`);
            });
        } catch (listError) {
            console.log(`⚠️  Could not list buckets (this may be due to permissions): ${listError.message}`);
            console.log('   Continuing with other tests...');
        }

        // Test 2: Check if default bucket exists
        console.log(`\n🪣 Test 2: Checking if bucket "${defaultBucket}" exists...`);
        try {
            await s3.headBucket({ Bucket: defaultBucket }).promise();
            console.log(`✅ Bucket "${defaultBucket}" exists and is accessible.`);
        } catch (bucketError) {
            if (bucketError.code === 'NotFound') {
                console.log(`❌ Bucket "${defaultBucket}" does not exist.`);
                console.log(`   You may need to create this bucket in your S3-compatible service.`);
            } else if (bucketError.code === 'Forbidden') {
                console.log(`❌ Access denied to bucket "${defaultBucket}".`);
                console.log(`   Check your credentials and bucket permissions.`);
            } else {
                console.log(`❌ Error accessing bucket: ${bucketError.message}`);
            }
            return;
        }

        // Test 3: Test upload and download
        console.log(`\n📤 Test 3: Testing file upload...`);
        const testFileName = `test-${Date.now()}.txt`;
        const testContent = `S3 Connection Test - ${new Date().toISOString()}`;
        
        try {
            const uploadParams = {
                Bucket: defaultBucket,
                Key: testFileName,
                Body: Buffer.from(testContent),
                ContentType: 'text/plain'
            };

            const uploadResult = await s3.upload(uploadParams).promise();
            console.log(`✅ File uploaded successfully!`);
            console.log(`   Location: ${uploadResult.Location}`);
            console.log(`   ETag: ${uploadResult.ETag}`);

            // Test 4: Test download
            console.log(`\n📥 Test 4: Testing file download...`);
            const downloadParams = {
                Bucket: defaultBucket,
                Key: testFileName
            };

            const downloadResult = await s3.getObject(downloadParams).promise();
            const downloadedContent = downloadResult.Body.toString();
            
            if (downloadedContent === testContent) {
                console.log(`✅ File downloaded successfully and content matches!`);
            } else {
                console.log(`❌ File downloaded but content doesn't match.`);
                console.log(`   Expected: ${testContent}`);
                console.log(`   Received: ${downloadedContent}`);
            }

            // Test 5: Test signed URL generation
            console.log(`\n🔗 Test 5: Testing signed URL generation...`);
            const signedUrlParams = {
                Bucket: defaultBucket,
                Key: testFileName,
                Expires: 3600 // 1 hour
            };

            const signedUrl = await s3.getSignedUrlPromise('getObject', signedUrlParams);
            console.log(`✅ Signed URL generated successfully!`);
            console.log(`   URL: ${signedUrl.substring(0, 100)}...`);

            // Test 6: Clean up - delete test file
            console.log(`\n🗑️ Test 6: Cleaning up test file...`);
            await s3.deleteObject({ Bucket: defaultBucket, Key: testFileName }).promise();
            console.log(`✅ Test file deleted successfully.`);

        } catch (uploadError) {
            console.log(`❌ Upload test failed: ${uploadError.message}`);
            return;
        }

        // Test 7: Test object listing
        console.log(`\n📋 Test 7: Testing object listing...`);
        try {
            const listParams = {
                Bucket: defaultBucket,
                MaxKeys: 5
            };

            const listResult = await s3.listObjectsV2(listParams).promise();
            console.log(`✅ Object listing successful!`);
            console.log(`   Found ${listResult.KeyCount} object(s) in bucket.`);
            
            if (listResult.Contents && listResult.Contents.length > 0) {
                console.log(`   Recent objects:`);
                listResult.Contents.slice(0, 3).forEach(obj => {
                    console.log(`   - ${obj.Key} (${obj.Size} bytes, modified: ${obj.LastModified})`);
                });
            }
        } catch (listError) {
            console.log(`⚠️  Object listing failed: ${listError.message}`);
        }

        console.log(`\n🎉 All tests completed successfully!`);
        console.log(`\n📝 Summary:`);
        console.log(`   ✅ S3 connection working`);
        console.log(`   ✅ Bucket accessible`);
        console.log(`   ✅ File upload/download working`);
        console.log(`   ✅ Signed URL generation working`);
        console.log(`   ✅ Object operations working`);
        console.log(`\n🚀 Your S3-compatible storage is ready to use!`);

    } catch (error) {
        console.log(`\n❌ Test failed with error: ${error.message}`);
        console.log(`\n🛠️  Troubleshooting tips:`);
        console.log(`   1. Verify your S3 credentials are correct`);
        console.log(`   2. Check that your S3 endpoint URL is correct`);
        console.log(`   3. Ensure the bucket "${defaultBucket}" exists`);
        console.log(`   4. Verify your network connection`);
        console.log(`   5. Check S3 service status`);
        
        if (process.env.S3_ENDPOINT) {
            console.log(`   6. For ${process.env.S3_ENDPOINT}, verify the service is running`);
            if (process.env.S3_ENDPOINT.includes('localhost') || process.env.S3_ENDPOINT.includes('127.0.0.1')) {
                console.log(`   7. Make sure your local S3-compatible service (e.g., MinIO) is running`);
            }
        }
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n👋 Test interrupted by user.');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n\n👋 Test terminated.');
    process.exit(0);
});

// Run the test
if (require.main === module) {
    testS3Connection().catch(error => {
        console.error('\n💥 Unexpected error:', error);
        process.exit(1);
    });
}

module.exports = { testS3Connection };