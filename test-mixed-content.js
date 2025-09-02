/**
 * Test file for the modified createCourseFromUrls API
 * This file demonstrates the new mixed content functionality
 */

// Example test data for the API
const testData = {
  // Test case 1: Mixed content (YouTube + embeddable URLs)
  mixedContent: {
    contentUrlsList: [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // YouTube video
      "https://example.com/article1", // Non-YouTube URL
      "https://www.youtube.com/playlist?list=PLxyz123", // YouTube playlist
      "https://docs.google.com/document/d/123/edit" // Google Doc (may or may not be embeddable)
    ],
    courseTitle: "Mixed Content Course Test",
    courseDescription: "A test course with both YouTube videos and written content"
  },

  // Test case 2: YouTube only
  youtubeOnly: {
    contentUrlsList: [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://www.youtube.com/watch?v=abc123xyz"
    ],
    courseTitle: "YouTube Only Course Test",
    courseDescription: "A test course with only YouTube content"
  },

  // Test case 3: Non-YouTube only
  writtenOnly: {
    contentUrlsList: [
      "https://example.com/article1",
      "https://example.com/article2"
    ],
    courseTitle: "Written Content Course Test",
    courseDescription: "A test course with only written/embeddable content"
  }
};

console.log("Test data for createCourseFromUrls API:");
console.log("=====================================");
console.log("\n1. Mixed Content Test:");
console.log(JSON.stringify(testData.mixedContent, null, 2));
console.log("\n2. YouTube Only Test:");
console.log(JSON.stringify(testData.youtubeOnly, null, 2));
console.log("\n3. Written Content Only Test:");
console.log(JSON.stringify(testData.writtenOnly, null, 2));

console.log("\n\nAPI Endpoint: POST /createCourseFromUrls");
console.log("Headers: Authorization: Bearer <your-token>");
console.log("Content-Type: application/json");
console.log("\nThe API now supports:");
console.log("- Pure YouTube content (videos and playlists)");
console.log("- Pure written/embeddable content");
console.log("- Mixed content (YouTube + written URLs in same course)");
console.log("- Embeddability checking for non-YouTube URLs");
console.log("- Proper content sequencing in mixed courses");
