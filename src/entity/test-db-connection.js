const db = require('./index.js');

async function createWritingTestData() {
  try {
    // Create a test user
    const user = await db.User.create({
      firstName: 'Test',
      lastName: 'User',
      nameInitial: 'TU',
      email: 'test@exampl1.com',
      number: '1234567890',
      profilePic: null,
    });
    console.log('Test user created:', user.toJSON());

    // Create a test writing prompt
    const writingPrompt = await db.WritingPrompt.create({
      title: 'Test Writing Prompt',
      level: 'intermediate', // Adjust based on your schema (e.g., '1' if numeric)
      name: 'Expository',
      promptText: 'Write a short story about a character who discovers a hidden talent.',
    });
    console.log('Test writing prompt created:', writingPrompt.toJSON());
  } catch (error) {
    console.error('Error creating test data:', error);
  }
}

createWritingTestData();