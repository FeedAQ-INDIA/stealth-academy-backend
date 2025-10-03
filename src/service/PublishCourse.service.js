const db = require("../entity/index.js");
const logger = require("../config/winston.config.js");

/**
 * Publish Course from CourseBuilder data
 * Accepts courseBuilderId and fetches courseBuilderData from CourseBuilder entity table
 * and persists normalized records into Course, CourseContent, CourseVideo, CourseWritten, etc.
 *
 * Expected payload shape:
 * { courseBuilderId: number }
 */
async function publishCourseFromBuilderPayload(rawPayload, authUserId) {
  const transaction = await db.sequelize.transaction();
  try {
    const courseBuilderId = rawPayload?.courseBuilderId;

    if (!courseBuilderId) {
      throw new Error("courseBuilderId is required");
    }

    // Fetch CourseBuilder data from database
    const courseBuilder = await db.CourseBuilder.findOne({
      where: { courseBuilderId },
      transaction
    });

    if (!courseBuilder) {
      throw new Error(`CourseBuilder not found with ID: ${courseBuilderId}`);
    }

    // Verify user authorization
    if (authUserId && courseBuilder.userId !== authUserId) {
      throw new Error("User mismatch: cannot publish course for another user");
    }

    // Check if already published
    if (courseBuilder.status === 'PUBLISHED') {
      throw new Error("Course has already been published");
    }

    const courseBuilderData = courseBuilder.courseBuilderData || {};
    
    // Handle the actual courseBuilderData structure
    // The course data is at the root level, not nested under courseDetail
    const courseDetail = courseBuilderData;

    if (!courseDetail?.courseTitle) {
      throw new Error("Course data missing in CourseBuilder data");
    }

    const userId = courseBuilder.userId;
    const orgId = courseBuilder.orgId;

    const {
      courseTitle,
      courseDescription,
      courseDuration = 0,
      courseImageUrl = null,
      courseType = 'BYOC',
      deliveryMode = 'ONLINE',
      courseSourceChannel = null,
      metadata = {}
    } = courseDetail;

    if (!courseTitle || !courseDescription) {
      throw new Error("Missing courseTitle or courseDescription in CourseBuilder data");
    }

    // Create Course (always publish in this flow)
    const course = await db.Course.create({
      userId,
      orgId: orgId || null,
      courseTitle: courseTitle.trim(),
      courseDescription: courseDescription.trim(),
      courseDuration: courseDuration || 0,
      courseImageUrl,
      courseType,
      deliveryMode,
      status: 'PUBLISHED',
      metadata: {
        ...(metadata || {}),
        source: 'CourseBuilderPublish',
        courseSourceChannel: courseSourceChannel || metadata?.courseSourceChannel || null,
        publishedAt: new Date().toISOString()
      }
    }, { transaction });

    logger.info(`Course published from builder payload: ${course.courseId}`);

    const contentArray = Array.isArray(courseDetail.courseContent) ? courseDetail.courseContent : [];
    const createdContent = [];

    for (const item of contentArray) {
      try {
        const {
          courseContentTitle,
          courseContentCategory,
          courseContentType,
          courseContentSequence,
          courseContentDuration = 0,
          metadata: contentMetadata = {},
          coursecontentIsLicensed = false,
          courseContentTypeDetail = {},
          status: contentStatus = 'DRAFT' // Handle status from sample data
        } = item || {};

        if (!courseContentTitle || !courseContentType || !courseContentSequence) {
          logger.warn("Skipping content item missing required fields", { courseContentTitle, courseContentType, courseContentSequence });
          continue;
        }

   

        // Persist CourseContent
        const contentRecord = await db.CourseContent.create({
          courseId: course.courseId,
          courseContentTitle: courseContentTitle.trim(),
          courseContentCategory: courseContentCategory || null,
          courseContentType: courseContentType,
          courseContentSequence: courseContentSequence,
          coursecontentIsLicensed: !!coursecontentIsLicensed,
          courseContentDuration: courseContentDuration || 0,
          metadata: contentMetadata || {}
        }, { transaction });

        let detailRecord = null;

        if (courseContentType === 'CourseVideo') {
          const videoMeta = courseContentTypeDetail || {};
          detailRecord = await db.CourseVideo.create({
            userId,
            courseId: course.courseId,
            courseContentId: contentRecord.courseContentId,
            courseVideoTitle: videoMeta.courseVideoTitle || contentRecord.courseContentTitle,
            courseVideoDescription: videoMeta.courseVideoDescription || '',
            courseVideoUrl: videoMeta.courseVideoUrl,
            duration: videoMeta.duration || courseContentDuration || 0,
            thumbnailUrl: videoMeta.thumbnailUrl || null,
            metadata: (videoMeta.metadata) ? { ...videoMeta.metadata } : {}
          }, { transaction });
        } else if (courseContentType === 'CourseWritten' && db.CourseWritten) {
          const writtenMeta = courseContentTypeDetail || {};
          detailRecord = await db.CourseWritten.create({
            userId,
            courseId: course.courseId,
            courseContentId: contentRecord.courseContentId,
            courseWrittenTitle: writtenMeta.courseWrittenTitle || contentRecord.courseContentTitle,
            courseWrittenContent: writtenMeta.courseWrittenContent || '',
            courseWrittenEmbedUrl: writtenMeta.courseWrittenEmbedUrl || null,
            courseWrittenUrlIsEmbeddable: writtenMeta.courseWrittenUrlIsEmbeddable || false,
            metadata: (writtenMeta.metadata) ? { ...writtenMeta.metadata } : {}
          }, { transaction });
        } else if (courseContentType === 'CourseQuiz' && db.CourseQuiz) {
          const quizMeta = courseContentTypeDetail || {};
          detailRecord = await db.CourseQuiz.create({
            courseId: course.courseId,
            courseContentId: contentRecord.courseContentId,
            courseQuizDescription: quizMeta.courseQuizDescription || '',
            courseQuizType: quizMeta.courseQuizType || 'QUIZ',
            courseQuizTimer: quizMeta.courseQuizTimer || 0,
            isQuizTimed: quizMeta.isQuizTimed || false,
            courseQuizPassPercent: quizMeta.courseQuizPassPercent || 70,
            metadata: (quizMeta.metadata) ? { ...quizMeta.metadata } : {}
          }, { transaction });

          // Persist quiz questions if they exist
          if (quizMeta.questions && Array.isArray(quizMeta.questions) && db.QuizQuestion) {
            for (const question of quizMeta.questions) {
              await db.QuizQuestion.create({
                courseId: course.courseId,
                courseQuizId: detailRecord.courseQuizId,
                courseContentId: contentRecord.courseContentId,
                quizQuestionTitle: question.quizQuestionTitle || '',
                quizQuestionType: question.quizQuestionType || 'SINGLE_CHOICE',
                quizQuestionOption: question.quizQuestionOption || [],
                quizQuestionCorrectAnswer: question.quizQuestionCorrectAnswer || [],
                quizQuestionPosPoint: question.quizQuestionPosPoint || 1,
                quizQuestionNegPoint: question.quizQuestionNegPoint || 0,
                questionSequence: question.questionSequence || 1,
                difficultyLevel: question.difficultyLevel || 'MEDIUM',
                quizQuestionNote: question.quizQuestionNote || null,
                explanation: question.explanation || null,
                metadata: question.metadata || {}
              }, { transaction });
            }
          }
        } else if (courseContentType === 'CourseFlashcard' && db.CourseFlashcard) {
          const flashcardMeta = courseContentTypeDetail || {};
          detailRecord = await db.CourseFlashcard.create({
            userId,
            courseId: course.courseId,
            courseContentId: contentRecord.courseContentId,
            setTitle: flashcardMeta.setTitle || contentRecord.courseContentTitle,
            setDescription: flashcardMeta.setDescription || '',
            setDifficulty: flashcardMeta.setDifficulty || 'MEDIUM',
            estimatedDuration: flashcardMeta.estimatedDuration || 0,
            setTags: flashcardMeta.setTags || [],
            metadata: (flashcardMeta.metadata) ? { ...flashcardMeta.metadata } : {}
          }, { transaction });

          // Persist flashcard cards if they exist
          if (flashcardMeta.cards && Array.isArray(flashcardMeta.cards) && db.Flashcard) {
            for (const card of flashcardMeta.cards) {
              await db.Flashcard.create({
                courseId: course.courseId,
                courseFlashcardId: detailRecord.courseFlashcardId,
                courseContentId: contentRecord.courseContentId,
                question: card.question || '',
                answer: card.answer || '',
                explanation: card.explanation || null,
                hints: card.hints || [],
                difficulty: card.difficulty || 'MEDIUM',
                orderIndex: card.orderIndex || 1,
                metadata: card.metadata || {}
              }, { transaction });
            }
          }
        }

        createdContent.push({
          courseContent: contentRecord,
          detail: detailRecord,
          type: courseContentType
        });
      } catch (innerErr) {
        logger.error('Failed to persist content item', { 
          error: innerErr.message, 
          contentTitle: item?.courseContentTitle,
          contentType: item?.courseContentType 
        });
        throw innerErr; // Abort whole publish; atomic requirement
      }
    }

    // Owner access (if model exists)
    if (db.CourseAccess) {
      await db.CourseAccess.create({
        courseId: course.courseId,
        userId: userId,
        accessLevel: 'OWN',
        isActive: true,
        grantedByUserId: userId,
        metadata: { source: 'publishCourse', grantedAt: new Date().toISOString() }
      }, { transaction });
    }

    // Update CourseBuilder status to PUBLISHED
    const builderData = courseBuilder.courseBuilderData || {};
    builderData.publishedCourseId = course.courseId;
    await courseBuilder.update({ 
      status: 'PUBLISHED', 
      courseBuilderData: builderData 
    }, { transaction });

    await transaction.commit();

    return {
      success: true,
      message: 'Course published successfully from CourseBuilder',
      data: {
        courseBuilderId: courseBuilder.courseBuilderId,
        course,
        courseContentItems: createdContent.map(c => ({
          courseContentId: c.courseContent.courseContentId,
          type: c.type,
          detailId: c.detail ? (c.detail.courseVideoId || c.detail.courseWrittenId) : null
        })),
        counts: {
          total: createdContent.length,
          video: createdContent.filter(c => c.type === 'CourseVideo').length,
          written: createdContent.filter(c => c.type === 'CourseWritten').length,
          quiz: createdContent.filter(c => c.type === 'CourseQuiz').length,
          flashcard: createdContent.filter(c => c.type === 'CourseFlashcard').length
        }
      }
    };
  } catch (error) {
    await transaction.rollback();
    logger.error('Error publishing course from builder payload', error);
    throw error;
  }
}

module.exports = {
  publishCourseFromBuilderPayload
};
