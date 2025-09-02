/**
 * URL Embeddability Service Test Examples
 * 
 * This file demonstrates how to use the URL Embeddability Service
 * 
 * @author FeedAQ Academy
 */

const urlEmbeddabilityService = require('../src/service/UrlEmbeddability.service.js');

// Example usage of the URL Embeddability Service
async function testUrlEmbeddabilityService() {
  console.log('🧪 Testing URL Embeddability Service\n');

  // Test 1: Check a single URL
  console.log('Test 1: Checking a single URL');
  try {
    const result = await urlEmbeddabilityService.checkIframeEmbeddability('https://example.com');
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Check multiple URLs
  console.log('Test 2: Checking multiple URLs');
  try {
    const urls = [
      'https://example.com',
      'https://google.com',
      'https://github.com',
      'https://stackoverflow.com'
    ];
    const results = await urlEmbeddabilityService.checkMultipleUrls(urls);
    console.log('Results:', JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Get non-embeddable domains
  console.log('Test 3: Getting non-embeddable domains');
  try {
    const domains = urlEmbeddabilityService.getNonEmbeddableDomains();
    console.log('Non-embeddable domains:', domains);
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 4: Add and remove domains
  console.log('Test 4: Managing domain list');
  try {
    console.log('Adding test-domain.com...');
    urlEmbeddabilityService.addNonEmbeddableDomain('test-domain.com');
    
    console.log('Current domains:', urlEmbeddabilityService.getNonEmbeddableDomains());
    
    console.log('Removing test-domain.com...');
    urlEmbeddabilityService.removeNonEmbeddableDomain('test-domain.com');
    
    console.log('Current domains:', urlEmbeddabilityService.getNonEmbeddableDomains());
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// API Endpoint Examples (for testing with curl or Postman)
const apiExamples = `
🌐 API Endpoint Examples:

1. Check Single URL:
   POST http://localhost:3000/api/url-embeddability/check
   Body: { "url": "https://example.com" }

2. Check Multiple URLs:
   POST http://localhost:3000/api/url-embeddability/check-multiple
   Body: { "urls": ["https://example.com", "https://google.com"] }

3. Get Non-embeddable Domains:
   GET http://localhost:3000/api/url-embeddability/domains

4. Add Non-embeddable Domain:
   POST http://localhost:3000/api/url-embeddability/domains/add
   Body: { "domain": "example-restricted.com" }

5. Remove Non-embeddable Domain:
   POST http://localhost:3000/api/url-embeddability/domains/remove
   Body: { "domain": "example-restricted.com" }

📝 Curl Examples:

# Check single URL
curl -X POST http://localhost:3000/api/url-embeddability/check \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}'

# Check multiple URLs
curl -X POST http://localhost:3000/api/url-embeddability/check-multiple \\
  -H "Content-Type: application/json" \\
  -d '{"urls": ["https://example.com", "https://google.com"]}'

# Get domains list
curl -X GET http://localhost:3000/api/url-embeddability/domains
`;

console.log(apiExamples);

// Uncomment the line below to run the tests
// testUrlEmbeddabilityService();

module.exports = {
  testUrlEmbeddabilityService,
  apiExamples
};
