const logger = require("../config/winston.config");
const db = require("../entity/index.js");
const { getUserCreditBalance, addCreditTransaction } = require("../service/CreditService.service.js");
const YoutubeService = require("../service/YoutubeService.service.js");
const urlEmbeddabilityService = require("../service/UrlEmbeddability.service.js");

/**
 * Check if a URL is a YouTube URL
 * @param {string} url - The URL to check
 * @returns {boolean} - True if the URL is a YouTube URL
 */
function isYouTubeUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\//,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\//,
    /(?:https?:\/\/)?youtu\.be\//,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/playlist\?/
  ];
  
  return patterns.some(pattern => pattern.test(url));
}

/**
 * Create a mixed content course with both YouTube videos and written URLs
 * @param {Array} youtubeUrls - Array of YouTube URLs  
 * @param {Array} nonYoutubeUrls - Array of non-YouTube URLs
 * @param {string} courseTitle - Course title
 * @param {string} courseDescription - Course description
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - Result object with course data
 */
async function createMixedContentCourse(youtubeUrls, nonYoutubeUrls, courseTitle, courseDescription, userId) {
  try {
    logger.info(`🎭 Creating mixed content course for user: ${userId}`);
    logger.info(`📚 Course Title: ${courseTitle}`);
    logger.info(`🎬 YouTube URLs: ${youtubeUrls.length}`);
    logger.info(`📝 Non-YouTube URLs: ${nonYoutubeUrls.length}`);

    // First, create the course using YouTube service (it will handle course creation and YouTube content)
    let courseResult = null;
    if (youtubeUrls.length > 0) {
      logger.info("🎬 Processing YouTube content first...");
      courseResult = await YoutubeService.createStructuredCourse(
        youtubeUrls,
        courseTitle,
        courseDescription,
        userId
      );
    }

    // If we have non-YouTube URLs, process them and add to the existing course
    let writtenContentResult = null;
    if (nonYoutubeUrls.length > 0) {
      logger.info("📝 Processing non-YouTube URLs...");
      
      // If we don't have a course from YouTube, create one first
      let course;
      if (!courseResult) {
        // Create a course just for written content
        let finalCourseTitle = courseTitle.trim();
        
        // Check if course title already exists for this user
        const existingCourse = await db.Course.findOne({
          where: {
            courseTitle: finalCourseTitle,
            userId: userId
          }
        });
        
        if (existingCourse) {
          // Append timestamp to make title unique
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          finalCourseTitle = `${finalCourseTitle} (${timestamp})`;
        }

        course = await db.Course.create({
          userId,
          courseTitle: finalCourseTitle,
          courseDescription: courseDescription.trim(),
          courseDuration: 0,
          courseImageUrl: null,
          courseSourceChannel: "Mixed Sources",
          courseType: "BYOC",
          deliveryMode: 'ONLINE',
          status: 'PUBLISHED',
          metadata: {
            createdFrom: "Mixed URLs",
            urlCount: youtubeUrls.length + nonYoutubeUrls.length,
            coursePlatform: "MIXED",
            courseType: "MIXED_CONTENT",
            courseDifficulty: "BEGINNER",
            isPublic: false,
            createdAt: new Date().toISOString(),
            mixedContent: true
          }
        });

        // Create course access for the owner
        await db.CourseAccess.create({
          courseId: course.courseId,
          userId: userId,
          accessLevel: "OWN",
          isActive: true,
          grantedByUserId: userId,
          metadata: {
            grantedAt: new Date().toISOString(),
            reason: "Course Owner - Auto-granted during course creation",
            source: "createMixedContentCourse"
          }
        });

        courseResult = { course: course };
      } else {
        course = courseResult.course;
      }
      
      // Check URL embeddability for all non-YouTube URLs
      const embeddabilityResults = await urlEmbeddabilityService.checkMultipleUrls(nonYoutubeUrls);
      
      // Filter out non-embeddable URLs
      const embeddableUrls = [];
      const nonEmbeddableUrls = [];
      
      embeddabilityResults.forEach((result, index) => {
        if (result.embeddable === true) {
          embeddableUrls.push({
            url: nonYoutubeUrls[index],
            embeddabilityResult: result
          });
        } else {
          nonEmbeddableUrls.push({
            url: nonYoutubeUrls[index],
            reason: result.reason,
            details: result.details
          });
          logger.warn(`⚠️ URL not embeddable: ${nonYoutubeUrls[index]} - ${result.reason}`);
        }
      });

      if (embeddableUrls.length > 0) {
        logger.info(`✅ Found ${embeddableUrls.length} embeddable URLs out of ${nonYoutubeUrls.length} total`);
        
        // Get the current highest sequence number from existing course content
        const existingContent = await db.CourseContent.findAll({
          where: { courseId: course.courseId },
          order: [['courseContentSequence', 'DESC']],
          limit: 1
        });
        
        let nextSequence = (existingContent.length > 0 ? existingContent[0].courseContentSequence : 0) + 1;

        // Create course content and written entries for each embeddable URL
        const createdWrittenContent = [];
        
        for (let i = 0; i < embeddableUrls.length; i++) {
          const urlData = embeddableUrls[i];
          const sequence = nextSequence + i;
          
          // Create course content entry
          const courseContent = await db.CourseContent.create({
            courseId: course.courseId,
            courseContentTitle: `Written Content ${sequence}: ${urlData.url}`,
            courseContentCategory: "Written Content",
            courseContentType: "CourseWritten",
            courseContentSequence: sequence,
            coursecontentIsLicensed: false,
            courseContentDuration: 0,
            isPublished: true,
            status: 'PUBLISHED',
            metadata: {
              contentType: "EXTERNAL_URL",
              embeddabilityCheck: urlData.embeddabilityResult,
              sequence: sequence,
              mixedContent: true
            }
          });

          // Create course written entry
          const courseWritten = await db.CourseWritten.create({
            userId: userId,
            courseId: course.courseId,
            courseContentId: courseContent.courseContentId,
            courseWrittenTitle: `Written Content ${sequence}`,
            courseWrittenDescription: `External content from: ${urlData.url}`,
            courseWrittenContent: `<iframe src="${urlData.url}" width="100%" height="600px" frameborder="0"></iframe>`,
            courseWrittenEmbedUrl: urlData.url,
            courseWrittenUrlIsEmbeddable: true,
            metadata: {
              originalUrl: urlData.url,
              embeddabilityCheck: urlData.embeddabilityResult,
              createdAt: new Date().toISOString(),
              mixedContent: true
            }
          });

          createdWrittenContent.push({
            content: courseContent,
            written: courseWritten
          });
          
          logger.info(`✅ Created written content item ${sequence}: ${urlData.url}`);
        }

        writtenContentResult = {
          contentItems: createdWrittenContent,
          embeddableUrlsCount: embeddableUrls.length,
          nonEmbeddableUrlsCount: nonEmbeddableUrls.length,
          nonEmbeddableUrls: nonEmbeddableUrls
        };
      }
    }

    // Combine results
    const finalResult = {
      success: true,
      course: courseResult.course,
      youtubeContent: {
        videosCount: courseResult.videosCount || 0,
        playlistsCount: courseResult.playlistsCount || 0,
        totalDuration: courseResult.totalDuration || 0
      },
      writtenContent: writtenContentResult || {
        contentItems: [],
        embeddableUrlsCount: 0,
        nonEmbeddableUrlsCount: 0,
        nonEmbeddableUrls: []
      },
      mixedContent: true,
      totalYouTubeUrls: youtubeUrls.length,
      totalWrittenUrls: nonYoutubeUrls.length
    };

    logger.info("✅ Mixed content course created successfully");
    return finalResult;

  } catch (error) {
    logger.error("❌ Error creating mixed content course:", error.message);
    throw error;
  }
}

/**
 * Create CourseWritten entries for non-YouTube URLs
 * @param {Array} urls - Array of non-YouTube URLs
 * @param {string} courseTitle - Course title
 * @param {string} courseDescription - Course description
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - Result object with course data
 */
async function createCourseFromWrittenUrls(urls, courseTitle, courseDescription, userId) {
  let transaction;
  
  try {
    logger.info(`📝 Creating course from written URLs for user: ${userId}`);
    logger.info(`📚 Course Title: ${courseTitle}`);
    logger.info(`🔗 Processing ${urls.length} non-YouTube URLs`);

    // Start database transaction
    transaction = await db.sequelize.transaction();

    // Check URL embeddability for all URLs
    logger.info("🔍 Checking URL embeddability...");
    const embeddabilityResults = await urlEmbeddabilityService.checkMultipleUrls(urls);
    
    // Filter out non-embeddable URLs and log them
    const embeddableUrls = [];
    const nonEmbeddableUrls = [];
    
    embeddabilityResults.forEach((result, index) => {
      if (result.embeddable === true) {
        embeddableUrls.push({
          url: urls[index],
          embeddabilityResult: result
        });
      } else {
        nonEmbeddableUrls.push({
          url: urls[index],
          reason: result.reason,
          details: result.details
        });
        logger.warn(`⚠️ URL not embeddable: ${urls[index]} - ${result.reason}`);
      }
    });

    if (embeddableUrls.length === 0) {
      throw new Error("No embeddable URLs found in the provided list");
    }

    logger.info(`✅ Found ${embeddableUrls.length} embeddable URLs out of ${urls.length} total`);

    // Create course record
    logger.info("💾 Creating course record...");
    let finalCourseTitle = courseTitle.trim();
    
    // Check if course title already exists for this user
    const existingCourse = await db.Course.findOne({
      where: {
        courseTitle: finalCourseTitle,
        userId: userId
      },
      transaction
    });
    
    if (existingCourse) {
      // Append timestamp to make title unique
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      finalCourseTitle = `${finalCourseTitle} (${timestamp})`;
    }

    const course = await db.Course.create({
      userId,
      courseTitle: finalCourseTitle,
      courseDescription: courseDescription.trim(),
      courseDuration: 0, // Written content doesn't have duration
      courseImageUrl: null,
      courseSourceChannel: "External Sources",
      courseType: "BYOC",
      deliveryMode: 'ONLINE',
      status: 'PUBLISHED',
      metadata: {
        createdFrom: "Written URLs",
        urlCount: embeddableUrls.length,
        coursePlatform: "EXTERNAL",
        courseType: "WRITTEN_CONTENT",
        courseDifficulty: "BEGINNER",
        isPublic: false,
        createdAt: new Date().toISOString(),
        nonEmbeddableUrls: nonEmbeddableUrls
      }
    }, { transaction });

    logger.info(`✅ Course created with ID: ${course.courseId}`);

    // Create course content and written entries for each embeddable URL
    const createdContent = [];
    
    for (let i = 0; i < embeddableUrls.length; i++) {
      const urlData = embeddableUrls[i];
      const sequence = i + 1;
      
      // Create course content entry
      const courseContent = await db.CourseContent.create({
        courseId: course.courseId,
        courseContentTitle: `Content ${sequence}: ${urlData.url}`,
        courseContentCategory: "Written Content",
        courseContentType: "CourseWritten",
        courseContentSequence: sequence,
        coursecontentIsLicensed: false,
        courseContentDuration: 0,
        isPublished: true,
        status: 'PUBLISHED',
        metadata: {
          contentType: "EXTERNAL_URL",
          embeddabilityCheck: urlData.embeddabilityResult,
          sequence: sequence
        }
      }, { transaction });

      // Create course written entry
      const courseWritten = await db.CourseWritten.create({
        userId: userId,
        courseId: course.courseId,
        courseContentId: courseContent.courseContentId,
        courseWrittenTitle: `Content ${sequence}`,
        courseWrittenDescription: `External content from: ${urlData.url}`,
        courseWrittenContent: `<iframe src="${urlData.url}" width="100%" height="600px" frameborder="0"></iframe>`,
        courseWrittenEmbedUrl: urlData.url,
        courseWrittenUrlIsEmbeddable: true,
        metadata: {
          originalUrl: urlData.url,
          embeddabilityCheck: urlData.embeddabilityResult,
          createdAt: new Date().toISOString()
        }
      }, { transaction });

      createdContent.push({
        content: courseContent,
        written: courseWritten
      });

      logger.info(`✅ Created content item ${sequence}: ${urlData.url}`);
    }

    // Create course access for the owner
    logger.info("🔐 Creating course access for owner...");
    await db.CourseAccess.create({
      courseId: course.courseId,
      userId: userId,
      accessLevel: "OWN",
      isActive: true,
      grantedByUserId: userId,
      metadata: {
        grantedAt: new Date().toISOString(),
        reason: "Course Owner - Auto-granted during course creation",
        source: "createCourseFromWrittenUrls"
      }
    }, { transaction });

    logger.info("✅ Course access created for owner");

    // Commit transaction
    await transaction.commit();

    return {
      success: true,
      course: course,
      contentItems: createdContent,
      embeddableUrlsCount: embeddableUrls.length,
      nonEmbeddableUrlsCount: nonEmbeddableUrls.length,
      nonEmbeddableUrls: nonEmbeddableUrls
    };

  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    logger.error("❌ Error creating course from written URLs:", error.message);
    throw error;
  }
}

/**
 * Creates a structured course from URLs (YouTube or other embeddable URLs)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function createCourseFromUrls(req, res, next) {
  const { contentUrlsList, courseTitle, courseDescription } = req.body;

  try {
    // Validate required fields
    if (
      !contentUrlsList ||
      !Array.isArray(contentUrlsList) ||
      contentUrlsList.length === 0
    ) {
      return res.status(400).send({
        status: 400,
        message: "contentUrlsList is required and must be a non-empty array",
      });
    }

    if (
      !courseTitle ||
      typeof courseTitle !== "string" ||
      courseTitle.trim().length === 0
    ) {
      return res.status(400).send({
        status: 400,
        message: "courseTitle is required and must be a non-empty string",
      });
    }

    if (
      !courseDescription ||
      typeof courseDescription !== "string" ||
      courseDescription.trim().length === 0
    ) {
      return res.status(400).send({
        status: 400,
        message: "courseDescription is required and must be a non-empty string",
      });
    }

    logger.info(
      `🎥 Creating course from URLs for user: ${req.user.userId}`
    );
    logger.info(`📚 Course Title: ${courseTitle}`);
    logger.info(`📝 Course Description: ${courseDescription}`);
    logger.info(`🔗 URLs Count: ${contentUrlsList.length}`);

    // Check user credit balance
    const userBal = await getUserCreditBalance(req.user.userId);
    if (userBal < 30) {
      throw new Error("Insufficient credit balance");
    }

    // Separate YouTube URLs from non-YouTube URLs
    const youtubeUrls = [];
    const nonYoutubeUrls = [];

    contentUrlsList.forEach((url, index) => {
      if (isYouTubeUrl(url)) {
        youtubeUrls.push(url);
      } else {
        nonYoutubeUrls.push(url);
      }
    });

    logger.info(`📊 URL Classification:`);
    logger.info(`   - YouTube URLs: ${youtubeUrls.length}`);
    logger.info(`   - Non-YouTube URLs: ${nonYoutubeUrls.length}`);

    let result;

    if (youtubeUrls.length > 0 && nonYoutubeUrls.length > 0) {
      // Mixed content - process both YouTube and non-YouTube URLs
      logger.info("🎭 Processing mixed content course (YouTube + Written URLs)...");
      result = await createMixedContentCourse(
        youtubeUrls,
        nonYoutubeUrls,
        courseTitle,
        courseDescription,
        req.user.userId
      );
    } else if (youtubeUrls.length > 0) {
      // All YouTube URLs - use existing YouTube service
      logger.info("🎬 Processing as YouTube course...");
      result = await YoutubeService.createStructuredCourse(
        youtubeUrls,
        courseTitle,
        courseDescription,
        req.user.userId
      );
    } else if (nonYoutubeUrls.length > 0) {
      // All non-YouTube URLs - use written content service
      logger.info("📝 Processing as written content course...");
      result = await createCourseFromWrittenUrls(
        nonYoutubeUrls,
        courseTitle,
        courseDescription,
        req.user.userId
      );
    } else {
      // This shouldn't happen due to earlier validation, but just in case
      throw new Error("No valid URLs found in the provided list");
    }

    // Deduct credits after successful course creation
    await addCreditTransaction({
      userId: req.user.userId,
      transactionType: 'DEBIT',
      referenceType: 'BYOC_COURSE_CREATION',
      amount: 30.00,
      description: `Course created from URLs: ${courseTitle}`,
      metadata: {
        youtubeUrlsCount: youtubeUrls.length,
        nonYoutubeUrlsCount: nonYoutubeUrls.length,
        totalUrlsCount: contentUrlsList.length,
        contentType: youtubeUrls.length > 0 && nonYoutubeUrls.length > 0 ? 'mixed' : 
                    youtubeUrls.length > 0 ? 'youtube' : 'written'
      }
    });

    logger.info("✅ Course created successfully via URL controller");

    res.status(200).send({
      status: 200,
      message: "Course created successfully from URLs",
      data: result,
    });
  } catch (err) {
    logger.error(`❌ Error creating course from URLs:`, {
      error: err.message,
      stack: err.stack,
      userId: req.user.userId,
      courseTitle,
      urlsCount: contentUrlsList?.length || 0,
    });

    // Handle specific error types
    if (err.message?.includes("YOUTUBE_API_KEY not configured")) {
      return res.status(500).send({
        status: 500,
        message:
          "YouTube API is not properly configured. Please contact administrator.",
      });
    }

    if (err.message?.includes("YouTube API error")) {
      return res.status(502).send({
        status: 502,
        message:
          "Failed to fetch data from YouTube API. Please try again later.",
      });
    }

    if (err.message?.includes("No valid videos found")) {
      return res.status(400).send({
        status: 400,
        message:
          "No valid YouTube videos found in the provided URLs. Please check your links.",
      });
    }

    if (err.message?.includes("No embeddable URLs found")) {
      return res.status(400).send({
        status: 400,
        message:
          "No embeddable URLs found in the provided list. Please check that your URLs can be embedded in iframes.",
      });
    }

    if (err.message?.includes("Insufficient credit balance")) {
      return res.status(402).send({
        status: 402,
        message: "Insufficient credit balance. You need at least 30 credits to create a course.",
      });
    }

    if (
      err.message?.includes("Database error") ||
      err.message?.includes("SequelizeError")
    ) {
      return res.status(500).send({
        status: 500,
        message:
          "Database error occurred while creating the course. Please try again.",
      });
    }

    // Generic error response
    res.status(500).send({
      status: 500,
      message:
        err.message ||
        "An error occurred while creating the course from URLs.",
    });

    next(err);
  }
}

module.exports = {
  createCourseFromUrls,
  isYouTubeUrl,
  createCourseFromWrittenUrls,
  createMixedContentCourse,
};
