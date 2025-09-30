/**
 * Gemini AI Service for Educational Content Generation
 * 
 * This service handles all interactions with Google's Gemini AI for generating
 * educational content including flashcards, quizzes, and structured learning materials
 * from YouTube video content.
 * 
 * @author FeedAQ Academy
 * @version 3.0
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("../config/winston.config.js");
const db = require("../entity/index.js");

/**
 * Gemini AI Configuration and Initialization
 */
class GeminiAIService {
  constructor() {
    this.genAI = null;
    this.isInitialized = false;
    this.initialize();
  }

  /**
   * Initialize the Gemini AI SDK
   * @returns {GoogleGenerativeAI|null} Initialized AI instance or null if failed
   */
  initialize() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.warn("⚠️ GEMINI_API_KEY not configured - Gemini features will be disabled");
      return null;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.isInitialized = true;
      logger.info("✅ Google Generative AI SDK initialized successfully");
      return this.genAI;
    } catch (error) {
      logger.error("❌ Failed to initialize Google Generative AI SDK:", error.message);
      this.isInitialized = false;
      return null;
    }
  }

  /**
   * Check if Gemini AI is properly initialized
   * @returns {boolean} True if initialized, false otherwise
   */
  isReady() {
    return this.isInitialized && this.genAI !== null;
  }

  /**
   * Call Gemini AI API with the provided prompt
   * @param {string} prompt - The prompt to send to Gemini AI
   * @returns {Promise<Object>} Parsed AI response
   * @throws {Error} If API call fails or AI is not initialized
   */
  async callGeminiAPI(prompt) {
    if (!this.isReady()) {
      logger.error("❌ Google Generative AI SDK not initialized");
      throw new Error("Google Generative AI SDK not initialized - check GEMINI_API_KEY");
    }

    logger.info("🤖 Calling Gemini API using SDK...");

    try {
      // Get the model with configuration
      const model = this.genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash-latest",
        generationConfig: {
          temperature: 0.3,
          topK: 20,
          topP: 0.8,
          maxOutputTokens: 4096,
          responseMimeType: "application/json", // Force JSON response
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_ONLY_HIGH",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_ONLY_HIGH",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_ONLY_HIGH",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_ONLY_HIGH",
          },
        ],
      });

      logger.info("📤 Sending prompt to Gemini...");
      
      // Generate content using the SDK
      const result = await model.generateContent(prompt);
      const response = result.response;
      
      if (!response) {
        logger.error("❌ No response received from Gemini API");
        throw new Error("No response received from Gemini API");
      }

      const content = response.text();
      
      if (!content) {
        logger.error("❌ Empty response content from Gemini API");
        throw new Error("Empty response content from Gemini API");
      }

      logger.info(`📝 Received content length: ${content.length} characters`);
      
      return this.parseGeminiContent(content);
      
    } catch (error) {
      // Handle specific Google AI errors
      if (error.message?.includes('API_KEY')) {
        logger.error(`🔑 API Key Error: ${error.message}`);
        throw new Error(`API Key Error: ${error.message}`);
      } else if (error.message?.includes('QUOTA_EXCEEDED') || error.message?.includes('quota')) {
        logger.error(`📊 Quota Exceeded: ${error.message}`);
        throw new Error(`Quota Exceeded: ${error.message}`);
      } else if (error.message?.includes('RATE_LIMIT') || error.message?.includes('rate limit')) {
        logger.error(`⏰ Rate Limited: ${error.message}`);
        throw new Error(`Rate Limited: ${error.message}`);
      } else if (error.message?.includes('SAFETY')) {
        logger.error(`🛡️ Content Safety Error: ${error.message}`);
        throw new Error(`Content Safety Error: ${error.message}`);
      } else if (error.message?.includes('BLOCKED')) {
        logger.error(`🚫 Content Blocked: ${error.message}`);
        throw new Error(`Content Blocked: ${error.message}`);
      } else {
        logger.error("💥 Error calling Gemini API:", error.message);
        throw error;
      }
    }
  }

  /**
   * Parse Gemini AI response content into JSON object
   * @param {string} content - Raw content from Gemini AI
   * @returns {Object} Parsed JSON content
   * @throws {Error} If content cannot be parsed as JSON
   */
  parseGeminiContent(content) {
    logger.info("🔧 Parsing Gemini content...");
    
    // Log the raw content for debugging (truncated for readability)
    logger.info(`📝 Raw content preview: ${content.substring(0, 200)}...`);
    
    let cleanContent = content.trim();

    try {
      const parsed = JSON.parse(cleanContent);
      logger.info("✅ Successfully parsed content as JSON");
      
      // Validate the basic structure of the parsed content
      if (parsed && typeof parsed === 'object') {
        if (!parsed.videoContents) {
          logger.warn("⚠️ Parsed JSON missing 'videoContents' property");
          logger.warn(`📋 Available properties: ${Object.keys(parsed).join(', ')}`);
        } else if (!Array.isArray(parsed.videoContents)) {
          logger.warn("⚠️ 'videoContents' property is not an array");
          logger.warn(`📋 videoContents type: ${typeof parsed.videoContents}`);
        } else {
          logger.info(`✅ Found ${parsed.videoContents.length} video contents in AI response`);
        }
      }
      
      return parsed;
    } catch (firstError) {
      logger.warn(`⚠️ Initial JSON parse failed: ${firstError.message}`);
      logger.warn("🔍 Attempting JSON extraction...");
      
      // Try to find the JSON object more robustly
      const jsonPatterns = [
        /\{[\s\S]*\}/,  // Match any content between first { and last }
        /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/,  // Nested braces pattern
      ];
      
      for (const pattern of jsonPatterns) {
        const match = content.match(pattern);
        if (match) {
          try {
            const extracted = match[0];
            logger.info(`🎯 Trying extracted JSON: ${extracted.substring(0, 100)}...`);
            const parsed = JSON.parse(extracted);
            logger.info("✅ Successfully parsed extracted JSON");
            return parsed;
          } catch (extractError) {
            logger.warn(`❌ Pattern extraction failed: ${extractError.message}`);
            continue;
          }
        }
      }
      
      // Fallback to the original brace counting method
      const startIndex = content.indexOf('{');
      if (startIndex === -1) {
        logger.error("❌ No JSON object found in Gemini response");
        logger.error(`📋 Full content: ${content}`);
        throw new Error("No JSON object found in Gemini response");
      }
      
      let braceCount = 0;
      let maxEnd = startIndex;
      
      for (let i = startIndex; i < content.length; i++) {
        if (content[i] === '{') braceCount++;
        else if (content[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            maxEnd = i;
            break;
          }
        }
      }
      
      try {
        const extracted = content.substring(startIndex, maxEnd + 1);
        logger.info(`🔧 Final extraction attempt: ${extracted.substring(0, 100)}...`);
        const parsed = JSON.parse(extracted);
        logger.info("✅ Successfully parsed with brace counting");
        return parsed;
      } catch (finalError) {
        logger.error(`❌ All parsing methods failed. Final error: ${finalError.message}`);
        logger.error(`📋 Problematic content: ${content}`);
        throw new Error(`Failed to parse Gemini response as JSON: ${finalError.message}`);
      }
    }
  }

  /**
   * Build a structured prompt for educational content generation
   * @param {Array} videoArray - Array of video objects with metadata
   * @param {Object} courseInfo - Course information object
   * @returns {string} Generated prompt for AI
   * @throws {Error} If invalid parameters provided
   */
  buildPrompt(videoArray, courseInfo) {
    // Defensive checks
    if (!Array.isArray(videoArray) || videoArray.length === 0) {
      throw new Error("videoArray must be a non-empty array");
    }
    
    if (!courseInfo || typeof courseInfo !== 'object') {
      throw new Error("courseInfo must be an object");
    }
    
    const maxVideosPerRequest = 3;
    const limitedVideoData = videoArray.slice(0, maxVideosPerRequest);

    const prompt = `You are an expert educational content creator. Analyze these YouTube videos and create structured educational materials.

COURSE DETAILS:
Title: ${courseInfo.courseTitle || 'Untitled Course'}
Description: ${courseInfo.courseDescription || 'No description provided'}
Channel: ${courseInfo.courseSourceChannel || 'Unknown Channel'}

VIDEOS TO ANALYZE:
${limitedVideoData.map((video, index) => `
${index + 1}. "${video.videoTitle || 'Untitled Video'}"
   Duration: ${Math.floor((video.duration || 0) / 60)}:${((video.duration || 0) % 60).toString().padStart(2, "0")}
   Description: ${video.videoDescription ? video.videoDescription.substring(0, 300) + (video.videoDescription.length > 300 ? "..." : "") : "No description"}
   Video ID: ${video.videoId || 'unknown'}
`).join("")}

CRITICAL INSTRUCTIONS:
- You MUST respond with ONLY valid JSON
- Do NOT include any markdown formatting, code blocks, or explanatory text
- Do NOT wrap the JSON in \`\`\`json or \`\`\` tags
- Start your response directly with the opening { character
- End your response directly with the closing } character

Return ONLY valid JSON with this exact structure:

{
  "courseAnalysis": {
    "overallTheme": "Main course topic",
    "skillLevel": "BEGINNER",
    "estimatedCompletionTime": "2 hours"
  },
  "videoContents": [
    {
      "videoId": "video_id_here",
      "videoTitle": "video_title_here",
      "contentSequence": 1,
      "topicContent": {
        "title": "Clear lesson title",
        "summary": "Brief summary (100-200 words)",
        "learningObjectives": ["Learn concept A", "Understand technique B"],
        "detailedContent": "Detailed explanation with examples"
      },
      "flashcards": [
        {
          "question": "What is the main concept?",
          "answer": "Clear, concise answer",
          "explanation": "Why this answer is correct",
          "difficulty": "EASY"
        }
      ],
      "quizQuestions": [
        {
          "question": "Multiple choice question?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0,
          "explanation": "Explanation of correct answer",
          "difficulty": "MEDIUM"
        }
      ]
    }
  ]
}

REQUIREMENTS:
- Create 4-6 flashcards per video
- Create 4-6 quiz questions per video
- Use difficulty levels: EASY, MEDIUM, HARD
- Return ONLY the JSON object, no other text
- Do NOT include any explanations, comments, or markdown formatting
- Start directly with { and end directly with }`;

    return prompt;
  }

  /**
   * Generate AI educational content from video array and course info
   * @param {Array} videoArray - Array of video objects
   * @param {Object} courseInfo - Course information
   * @returns {Promise<Object>} AI generation result with success/error status
   */
  async generateAIEducationalContent(videoArray, courseInfo) {
    logger.info("🤖 Generating AI educational content...");
    
    const prompt = this.buildPrompt(videoArray, courseInfo);
    
    // Check if Gemini AI is properly initialized
    if (!this.isReady()) {
      logger.warn("⚠️ Gemini AI not initialized - skipping AI content generation");
      return {
        success: false,
        error: "Gemini AI not initialized - check GEMINI_API_KEY configuration",
        prompt: prompt
      };
    }
    
    try {
      const aiResponse = await this.callGeminiAPI(prompt);
      
      // Validate the response structure
      const validationResult = this.validateAIContentStructure(aiResponse);
      if (!validationResult.isValid) {
        logger.warn("⚠️ AI content validation warnings:", validationResult.warnings);
        logger.info("✅ AI content generated with warnings");
      } else {
        logger.info("✅ AI content generated and validated successfully");
      }
      
      return {
        success: true,
        data: aiResponse,
        prompt: prompt,
        warnings: validationResult.warnings
      };
    } catch (error) {
      logger.error("❌ Error generating AI content:", error.message);
      return {
        success: false,
        error: `Failed to generate AI educational content: ${error.message}`,
        prompt: prompt
      };
    }
  }

  /**
   * Validate the structure of AI-generated content
   * @param {Object} aiContent - AI generated content to validate
   * @returns {Object} Validation result with isValid flag and warnings
   */
  validateAIContentStructure(aiContent) {
    logger.info("🔍 Validating AI content structure...");
    
    const warnings = [];
    let isValid = true;

    if (!aiContent || typeof aiContent !== 'object') {
      warnings.push("AI content is not a valid object");
      return { isValid: false, warnings };
    }

    if (!aiContent.courseAnalysis) {
      warnings.push("Missing courseAnalysis in AI content");
      isValid = false;
    }

    if (!aiContent.videoContents || !Array.isArray(aiContent.videoContents)) {
      warnings.push("Missing or invalid videoContents array in AI content");
      return { isValid: false, warnings };
    }

    if (aiContent.videoContents.length === 0) {
      warnings.push("videoContents array is empty");
      return { isValid: false, warnings };
    }

    // Validate each video content - collect warnings but don't fail immediately
    let validVideoContents = 0;
    for (let i = 0; i < aiContent.videoContents.length; i++) {
      const videoContent = aiContent.videoContents[i];
      let hasValidStructure = true;
      
      if (!videoContent.videoId) {
        warnings.push(`Video content at index ${i} missing videoId`);
        hasValidStructure = false;
      }
      
      if (!videoContent.videoTitle) {
        warnings.push(`Video content at index ${i} missing videoTitle`);
        hasValidStructure = false;
      }
      
      if (!videoContent.topicContent) {
        warnings.push(`Video content at index ${i} missing topicContent`);
      }
      
      if (!videoContent.flashcards || !Array.isArray(videoContent.flashcards)) {
        warnings.push(`Video content at index ${i} missing or invalid flashcards array`);
      }
      
      if (!videoContent.quizQuestions || !Array.isArray(videoContent.quizQuestions)) {
        warnings.push(`Video content at index ${i} missing or invalid quizQuestions array`);
      }

      if (hasValidStructure) {
        validVideoContents++;
      }
    }

    if (validVideoContents === 0) {
      warnings.push("No video contents have valid structure");
      isValid = false;
    } else if (validVideoContents < aiContent.videoContents.length) {
      warnings.push(`Only ${validVideoContents} out of ${aiContent.videoContents.length} video contents have valid structure`);
    }

    logger.info(`✅ AI content structure validation completed - Valid: ${isValid}, Warnings: ${warnings.length}`);
    return { isValid, warnings };
  }

  /**
   * Helper function to get the next sequence number for course content
   * @param {number} courseId - Course ID
   * @param {object} transaction - Database transaction
   * @returns {Promise<number>} Next sequence number
   */
  async getNextCourseContentSequence(courseId, transaction) {
    const maxSequence = await db.CourseContent.max('courseContentSequence', {
      where: { courseId },
      transaction
    });
    return (maxSequence || 0) + 1;
  }

  /**
   * Save AI-generated content to the database
   * @param {number} courseId - Course ID to save content for
   * @param {number} userId - User ID creating the content
   * @param {Object} aiContent - AI generated content
   * @param {Array} videoArray - Original video array for reference
   * @param {Object} transaction - Database transaction
   * @returns {Promise<Object>} Results of saving operation
   */
  async saveAIContentToDatabase(courseId, userId, aiContent, videoArray, transaction) {
    const results = {
      topicContent: 0,
      flashcardSets: 0,
      totalFlashcards: 0,
      quizSets: 0,
      totalQuizQuestions: 0,
      errors: []
    };

    // Validate AI content structure more gracefully
    if (!aiContent || typeof aiContent !== 'object') {
      logger.warn("⚠️ Invalid AI content: not an object");
      results.errors.push("AI content is not a valid object");
      return results;
    }

    if (!aiContent.videoContents || !Array.isArray(aiContent.videoContents)) {
      logger.warn("⚠️ Invalid AI content structure: missing or invalid videoContents array");
      results.errors.push("AI content structure invalid - missing videoContents array");
      return results;
    }

    if (aiContent.videoContents.length === 0) {
      logger.warn("⚠️ AI content has empty videoContents array");
      results.errors.push("AI content has no video contents to process");
      return results;
    }

    // Verify transaction is still active before proceeding
    try {
      await db.sequelize.query('SELECT 1', { transaction });
    } catch (transactionError) {
      logger.error("❌ Transaction is already aborted before saving AI content:", transactionError.message);
      throw new Error(`Transaction aborted before AI content processing: ${transactionError.message}`);
    }

    const courseContents = await db.CourseContent.findAll({
      where: { courseId },
      transaction
    });

    for (const videoContent of aiContent.videoContents) {
      try {
        const matchingContent = courseContents.find(content => 
          content.metadata?.videoId === videoContent.videoId ||
          content.courseContentTitle === videoContent.videoTitle
        );

        if (!matchingContent) {
          results.errors.push(`No matching course content found for video: ${videoContent.videoTitle}`);
          continue;
        }

        const courseContentId = matchingContent.courseContentId;

        // Create Topic Content (CourseWritten)
        if (videoContent.topicContent) {
          try {
            const htmlContent = `
              <div class="lesson-content">
                <h2>${videoContent.topicContent.title}</h2>
                <div class="summary">
                  <h3>Summary</h3>
                  <p>${videoContent.topicContent.summary}</p>
                </div>
                <div class="objectives">
                  <h3>Learning Objectives</h3>
                  <ul>${videoContent.topicContent.learningObjectives
                    .map(obj => `<li>${obj}</li>`)
                    .join("")}</ul>
                </div>
                <div class="content">
                  <h3>Detailed Content</h3>
                  <div>${videoContent.topicContent.detailedContent}</div>
                </div>
              </div>
            `;

            await db.CourseWritten.create({
              userId,
              courseId,
              courseContentId,
              courseWrittenTitle: videoContent.topicContent?.title || videoContent.videoTitle,
              courseWrittenContent: htmlContent,
              courseWrittenEmbedUrl: `https://www.youtube.com/watch?v=${videoContent.videoId}`,
              courseWrittenUrlIsEmbeddable: true,
              metadata: {
                source: "GEMINI_AI",
                originalUrl: `https://www.youtube.com/watch?v=${videoContent.videoId}`,
                contentType: "topic_content"
              }
            }, { transaction });

            results.topicContent++;
          } catch (topicError) {
            logger.error(`❌ Error creating topic content for video ${videoContent.videoTitle}:`, topicError.message);
            results.errors.push(`Topic content creation failed for ${videoContent.videoTitle}: ${topicError.message}`);
            // Continue with other content types for this video
          }
        }

        // Create Flashcard Set
        if (videoContent.flashcards && videoContent.flashcards.length > 0) {
          try {
            // First create a CourseContent entry for the flashcard set
            const flashcardSequence = await this.getNextCourseContentSequence(courseId, transaction);
            const flashcardContent = await db.CourseContent.create({
              courseId,
              courseContentTitle: `${videoContent.topicContent?.title || videoContent.videoTitle} - Flashcards`,
              courseContentCategory: videoContent.flashcards[0]?.category || "General",
              courseContentType: "CourseFlashcard",
              // courseSourceMode: "COMPANY",
              courseContentSequence: flashcardSequence,
              coursecontentIsLicensed: false,
              courseContentDuration: videoContent.flashcards.length * 30, // Estimate 30 seconds per flashcard
              isActive: true,
              metadata: {
                totalFlashcards: videoContent.flashcards.length,
                relatedVideoId: videoContent.videoId,
                relatedVideoTitle: videoContent.videoTitle
              }
            }, { transaction });

            const flashcardSet = await db.CourseFlashcard.create({
              courseId,
              courseContentId: flashcardContent.courseContentId,
              userId,
              setTitle: `${videoContent.topicContent?.title || videoContent.videoTitle} - Flashcards`,
              setDescription: `AI-generated flashcards for: ${videoContent.topicContent?.title || videoContent.videoTitle}`,
              setDifficulty: "MIXED",
              setTags: videoContent.flashcards.flatMap(card => card.tags || []),
              setCategory: videoContent.flashcards[0]?.category || "General",
              totalFlashcards: videoContent.flashcards.length,
              isActive: true
            }, { transaction });

            const flashcardsToCreate = videoContent.flashcards.map(card => ({
              courseFlashcardId: flashcardSet.courseFlashcardId,
              question: card.question,
              answer: card.answer,
              explanation: card.explanation,
              difficulty: card.difficulty || "MEDIUM",
              cardType: card.cardType || "BASIC",
              tags: card.tags || [],
              isActive: true
            }));

            await db.Flashcard.bulkCreate(flashcardsToCreate, { transaction });

            results.flashcardSets++;
            results.totalFlashcards += videoContent.flashcards.length;
          } catch (flashcardError) {
            logger.error(`❌ Error creating flashcards for video ${videoContent.videoTitle}:`, flashcardError.message);
            results.errors.push(`Flashcard creation failed for ${videoContent.videoTitle}: ${flashcardError.message}`);
            // Continue with other content types for this video
          }
        }

        // Create Quiz
        if (videoContent.quizQuestions && videoContent.quizQuestions.length > 0) {
          try {
            // First create a CourseContent entry for the quiz
            const quizSequence = await this.getNextCourseContentSequence(courseId, transaction);
            const quizContent = await db.CourseContent.create({
              courseId,
              courseContentTitle: `${videoContent.topicContent?.title || videoContent.videoTitle} - Quiz`,
              courseContentCategory: "Assessment", 
              courseContentType: "CourseQuiz",
              // courseSourceMode: "COMPANY",
              courseContentSequence: quizSequence,
              coursecontentIsLicensed: false,
              courseContentDuration: videoContent.quizQuestions.length * 45, // Estimated duration based on timer
              isActive: true,
              metadata: {
                totalQuestions: videoContent.quizQuestions.length,
                quizType: "KNOWLEDGE CHECK",
                passPercent: 70,
                relatedVideoId: videoContent.videoId,
                relatedVideoTitle: videoContent.videoTitle
              }
            }, { transaction });

            const courseQuiz = await db.CourseQuiz.create({
              courseContentId: quizContent.courseContentId,
              courseId,
              courseQuizDescription: `AI-generated quiz for: ${videoContent.topicContent?.title || videoContent.videoTitle}`,
              courseQuizType: "KNOWLEDGE CHECK",
              isQuizTimed: true,
              courseQuizTimer: videoContent.quizQuestions.length * 45,
              courseQuizPassPercent: 70
            }, { transaction });

            const questionsToCreate = videoContent.quizQuestions.map((question, index) => ({
              courseQuizId: courseQuiz.courseQuizId,
              courseId: courseId,
              courseContentId: quizContent.courseContentId,
              quizQuestionTitle: question.question,
              quizQuestionType: "MULTIPLE_CHOICE",
              quizQuestionOption: question.options,
              quizQuestionCorrectAnswer: question.correctAnswer,
              questionSequence: index + 1,
              isQuestionTimed: true,
              quizQuestionTimer: question.timeLimit || 30
            }));

            await db.QuizQuestion.bulkCreate(questionsToCreate, { transaction });

            results.quizSets++;
            results.totalQuizQuestions += videoContent.quizQuestions.length;
          } catch (quizError) {
            logger.error(`❌ Error creating quiz for video ${videoContent.videoTitle}:`, quizError.message);
            results.errors.push(`Quiz creation failed for ${videoContent.videoTitle}: ${quizError.message}`);
            // Continue processing other content types
          }
        }

      } catch (error) {
        logger.error(`❌ Error processing AI content for video ${videoContent.videoTitle}:`, error);
        results.errors.push(`Error processing ${videoContent.videoTitle}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Create unified CourseContent with all related content types (Videos, Quizzes, Flashcards)
   * This method handles proper sequencing and persistence in a single transaction
   * @param {number} courseId - Course ID to create content for
   * @param {number} userId - User ID creating the content
   * @param {Array} videoArray - Array of video data
   * @param {Object} aiContent - AI generated content (optional)
   * @param {Object} transaction - Database transaction
   * @returns {Promise<Object>} Results of unified creation operation
   */
  async createUnifiedCourseContent(courseId, userId, videoArray, aiContent = null, transaction) {
    logger.info("🎯 Creating unified course content with proper sequencing...");
    
    const results = {
      videoContent: [],
      flashcardContent: [],
      quizContent: [],
      writtenContent: [],
      totalContentItems: 0,
      errors: []
    };

    try {
      // Get current max sequence to ensure proper ordering
      let currentSequence = await db.CourseContent.max('courseContentSequence', {
        where: { courseId },
        transaction
      }) || 0;

      // Process each video and create associated content in proper sequence
      for (let index = 0; index < videoArray.length; index++) {
        const video = videoArray[index];
        const videoAIContent = aiContent?.videoContents?.find(vc => vc.videoId === video.videoId);
        
        try {
          // Create video content first
          const videoContentResult = await this.createVideoContentWithSequence(
            courseId, userId, video, ++currentSequence, transaction
          );
          results.videoContent.push(videoContentResult);

          // Create written content if AI generated topic content exists
          if (videoAIContent?.topicContent) {
            const writtenContentResult = await this.createWrittenContentWithSequence(
              courseId, userId, video, videoAIContent.topicContent, ++currentSequence, transaction
            );
            results.writtenContent.push(writtenContentResult);
          }

          // Create flashcard content if AI generated flashcards exist
          if (videoAIContent?.flashcards?.length > 0) {
            const flashcardContentResult = await this.createFlashcardContentWithSequence(
              courseId, userId, video, videoAIContent.flashcards, ++currentSequence, transaction
            );
            results.flashcardContent.push(flashcardContentResult);
          }

          // Create quiz content if AI generated quiz questions exist
          if (videoAIContent?.quizQuestions?.length > 0) {
            const quizContentResult = await this.createQuizContentWithSequence(
              courseId, userId, video, videoAIContent.quizQuestions, ++currentSequence, transaction
            );
            results.quizContent.push(quizContentResult);
          }

        } catch (videoError) {
          logger.error(`❌ Error creating content for video ${video.videoTitle}:`, videoError.message);
          results.errors.push(`Failed to create content for ${video.videoTitle}: ${videoError.message}`);
        }
      }

      results.totalContentItems = currentSequence;
      logger.info(`✅ Successfully created ${results.totalContentItems} course content items`);

    } catch (error) {
      logger.error("❌ Error in unified course content creation:", error.message);
      throw error;
    }

    return results;
  }

  /**
   * Create video content with proper sequence
   */
  async createVideoContentWithSequence(courseId, userId, video, sequence, transaction) {
    // Create CourseContent entry
    const courseContent = await db.CourseContent.create({
      courseId,
      courseContentTitle: video.videoTitle,
      courseContentCategory: video.category || "Video Learning",
      courseContentType: "CourseVideo",
      // courseSourceMode: "YOUTUBE",
      courseContentSequence: sequence,
      coursecontentIsLicensed: false,
      courseContentDuration: video.duration,
      isActive: true,
      metadata: {
        videoId: video.videoId,
        originalUrl: video.videoUrl,
        channelTitle: video.channelTitle,
        publishedAt: video.publishedAt
      }
    }, { transaction });

    // Create CourseVideo entry
    const courseVideo = await db.CourseVideo.create({
      courseContentId: courseContent.courseContentId,
      courseId,
      userId,
      courseVideoTitle: video.videoTitle,
      courseVideoDescription: video.videoDescription,
      courseVideoUrl: video.videoUrl,
      duration: video.duration,
      thumbnailUrl: video.thumbnailUrl,
      isPreview: false,
      status: "READY"
    }, { transaction });

    return {
      type: 'CourseVideo',
      content: courseContent,
      video: courseVideo,
      sequence
    };
  }

  /**
   * Create written content with proper sequence
   */
  async createWrittenContentWithSequence(courseId, userId, video, topicContent, sequence, transaction) {
    // Create CourseContent entry
    const courseContent = await db.CourseContent.create({
      courseId,
      courseContentTitle: `${topicContent.title || video.videoTitle} - Study Notes`,
      courseContentCategory: topicContent.category || "Study Material",
      courseContentType: "CourseWritten",
      // courseSourceMode: "COMPANY",
      courseContentSequence: sequence,
      coursecontentIsLicensed: false,
      courseContentDuration: Math.max(Math.floor(topicContent.detailedContent?.length / 200) || 5, 5), // Reading time estimate
      isActive: true,
      metadata: {
        relatedVideoId: video.videoId,
        relatedVideoTitle: video.videoTitle,
        aiGenerated: true,
        contentType: "study_notes"
      }
    }, { transaction });

    // Create HTML content
    const htmlContent = `
      <div class="study-notes">
        <div class="summary">
          <h3>Summary</h3>
          <p>${topicContent.summary}</p>
        </div>
        <div class="learning-objectives">
          <h3>Learning Objectives</h3>
          <ul>${topicContent.learningObjectives
            .map(obj => `<li>${obj}</li>`)
            .join("")}</ul>
        </div>
        <div class="content">
          <h3>Detailed Content</h3>
          <div>${topicContent.detailedContent}</div>
        </div>
      </div>
    `;

    // Create CourseWritten entry
    const courseWritten = await db.CourseWritten.create({
      userId,
      courseId,
      courseContentId: courseContent.courseContentId,
      courseWrittenTitle: topicContent.title,
      courseWrittenContent: htmlContent,
      courseWrittenEmbedUrl: video.videoUrl,
      courseWrittenUrlIsEmbeddable: true,
      metadata: {
        source: "GEMINI_AI",
        originalUrl: video.videoUrl,
        contentType: "course_content"
      }
    }, { transaction });

    return {
      type: 'CourseWritten',
      content: courseContent,
      written: courseWritten,
      sequence
    };
  }

  /**
   * Create flashcard content with proper sequence
   */
  async createFlashcardContentWithSequence(courseId, userId, video, flashcards, sequence, transaction) {
    // Create CourseContent entry
    const courseContent = await db.CourseContent.create({
      courseId,
      courseContentTitle: `${video.videoTitle} - Flashcards`,
      courseContentCategory: flashcards[0]?.category || "Review",
      courseContentType: "CourseFlashcard",
      // courseSourceMode: "COMPANY",
      courseContentSequence: sequence,
      coursecontentIsLicensed: false,
      courseContentDuration: flashcards.length * 30, // 30 seconds per flashcard
      isActive: true,
      metadata: {
        totalFlashcards: flashcards.length,
        relatedVideoId: video.videoId,
        relatedVideoTitle: video.videoTitle,
        aiGenerated: true
      }
    }, { transaction });

    // Create CourseFlashcard set
    const flashcardSet = await db.CourseFlashcard.create({
      courseId,
      courseContentId: courseContent.courseContentId,
      userId,
      setTitle: `${video.videoTitle} - Flashcards`,
      setDescription: `AI-generated flashcards for: ${video.videoTitle}`,
      setDifficulty: "MIXED",
      setTags: flashcards.flatMap(card => card.tags || []),
      setCategory: flashcards[0]?.category || "General",
      totalFlashcards: flashcards.length,
      isActive: true
    }, { transaction });

    // Create individual flashcards
    const flashcardsToCreate = flashcards.map(card => ({
      courseFlashcardId: flashcardSet.courseFlashcardId,
      question: card.question,
      answer: card.answer,
      explanation: card.explanation,
      difficulty: card.difficulty || "MEDIUM",
      cardType: card.cardType || "BASIC",
      tags: card.tags || [],
      isActive: true
    }));

    await db.Flashcard.bulkCreate(flashcardsToCreate, { transaction });

    return {
      type: 'CourseFlashcard',
      content: courseContent,
      flashcardSet,
      totalFlashcards: flashcards.length,
      sequence
    };
  }

  /**
   * Create quiz content with proper sequence
   */
  async createQuizContentWithSequence(courseId, userId, video, quizQuestions, sequence, transaction) {
    // Create CourseContent entry
    const courseContent = await db.CourseContent.create({
      courseId,
      courseContentTitle: `${video.videoTitle} - Quiz`,
      courseContentCategory: "Assessment",
      courseContentType: "CourseQuiz",
      // courseSourceMode: "COMPANY",
      courseContentSequence: sequence,
      coursecontentIsLicensed: false,
      courseContentDuration: quizQuestions.length * 45, // 45 seconds per question
      isActive: true,
      metadata: {
        totalQuestions: quizQuestions.length,
        quizType: "KNOWLEDGE CHECK",
        passPercent: 70,
        relatedVideoId: video.videoId,
        relatedVideoTitle: video.videoTitle,
        aiGenerated: true
      }
    }, { transaction });

    // Create CourseQuiz
    const courseQuiz = await db.CourseQuiz.create({
      courseContentId: courseContent.courseContentId,
      courseId,
      courseQuizDescription: `AI-generated quiz for: ${video.videoTitle}`,
      courseQuizType: "KNOWLEDGE CHECK",
      isQuizTimed: true,
      courseQuizTimer: quizQuestions.length * 45,
      courseQuizPassPercent: 70
    }, { transaction });

    // Create quiz questions
    const questionsToCreate = quizQuestions.map((question, index) => ({
      courseQuizId: courseQuiz.courseQuizId,
      courseId: courseId,
      courseContentId: courseContent.courseContentId,
      quizQuestionTitle: question.question,
      quizQuestionType: "MULTIPLE_CHOICE",
      quizQuestionOption: question.options,
      quizQuestionCorrectAnswer: question.correctAnswer,
      questionSequence: index + 1,
      isQuestionTimed: true,
      quizQuestionTimer: question.timeLimit || 30
    }));

    await db.QuizQuestion.bulkCreate(questionsToCreate, { transaction });

    return {
      type: 'CourseQuiz',
      content: courseContent,
      quiz: courseQuiz,
      totalQuestions: quizQuestions.length,
      sequence
    };
  }
}

// Create a singleton instance
const geminiAIService = new GeminiAIService();

module.exports = geminiAIService;
