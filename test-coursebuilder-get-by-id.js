// Simple manual test for GET /api/courseBuilder/:courseBuilderId
// Usage: node test-coursebuilder-get-by-id.js <COURSE_BUILDER_ID> <JWT_TOKEN>

const fetch = require('node-fetch');

async function run() {
  const id = process.argv[2];
  const token = process.argv[3];
  if (!id || !token) {
    console.error('Usage: node test-coursebuilder-get-by-id.js <COURSE_BUILDER_ID> <JWT_TOKEN>');
    process.exit(1);
  }

  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:5000/api';
  const url = `${baseUrl}/courseBuilder/${id}`;

  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    const body = await res.json();
    console.log('Status:', res.status);
    console.log(JSON.stringify(body, null, 2));
  } catch (err) {
    console.error('Request failed:', err.message);
  }
}

run();
