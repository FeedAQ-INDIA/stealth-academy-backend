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

    // Note: We no longer hard-block on status PUBLISHED. If a publishedCourseId exists
    // and the Course exists, we treat it as an update request; otherwise we create.

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

    // Helper to upsert CourseContent and corresponding detail record by sequence
    const upsertContentItem = async (course, item) => {
      const {
        courseContentTitle,
        courseContentCategory,
        courseContentType,
        courseContentSequence,
        courseContentDuration = 0,
        metadata: contentMetadata = {},
        coursecontentIsLicensed = false,
        courseContentTypeDetail = {}
      } = item || {};

      if (!courseContentTitle || !courseContentType || !courseContentSequence) {
        logger.warn("Skipping content item missing required fields", { courseContentTitle, courseContentType, courseContentSequence });
        return null;
      }

      // Find existing by unique (courseId, sequence)
      let contentRecord = await db.CourseContent.findOne({
        where: { courseId: course.courseId, courseContentSequence },
        transaction
      });

      const isNew = !contentRecord;
      const newPayload = {
        courseId: course.courseId,
        courseContentTitle: courseContentTitle.trim(),
        courseContentCategory: courseContentCategory || null,
        courseContentType,
        courseContentSequence,
        coursecontentIsLicensed: !!coursecontentIsLicensed,
        courseContentDuration: courseContentDuration || 0,
        metadata: contentMetadata || {}
      };

      if (!contentRecord) {
        contentRecord = await db.CourseContent.create(newPayload, { transaction });
      } else {
        // If type changed, delete old detail and recreate later
        const typeChanged = contentRecord.courseContentType !== courseContentType;
        if (typeChanged) {
          // best-effort cleanup of previous detail by type
          await cleanupDetailByType(course, contentRecord, contentRecord.courseContentType);
        }
        await contentRecord.update(newPayload, { transaction });
      }

      // Upsert detail by current type
      let detailRecord = null;
      if (courseContentType === 'CourseVideo') {
        const videoMeta = courseContentTypeDetail || {};
        const existing = await db.CourseVideo.findOne({ where: { courseContentId: contentRecord.courseContentId }, transaction });
        const payload = {
          userId,
          courseId: course.courseId,
          courseContentId: contentRecord.courseContentId,
          courseVideoTitle: videoMeta.courseVideoTitle || contentRecord.courseContentTitle,
          courseVideoDescription: videoMeta.courseVideoDescription || '',
          courseVideoUrl: videoMeta.courseVideoUrl,
          duration: videoMeta.duration || courseContentDuration || 0,
          thumbnailUrl: videoMeta.thumbnailUrl || null,
          metadata: (videoMeta.metadata) ? { ...videoMeta.metadata } : {}
        };
        detailRecord = existing
          ? await existing.update(payload, { transaction })
          : await db.CourseVideo.create(payload, { transaction });
      } else if (courseContentType === 'CourseWritten' && db.CourseWritten) {
        const writtenMeta = courseContentTypeDetail || {};
        const existing = await db.CourseWritten.findOne({ where: { courseContentId: contentRecord.courseContentId }, transaction });
        const payload = {
          userId,
          courseId: course.courseId,
          courseContentId: contentRecord.courseContentId,
          courseWrittenTitle: writtenMeta.courseWrittenTitle || contentRecord.courseContentTitle,
          courseWrittenContent: writtenMeta.courseWrittenContent || '',
          courseWrittenEmbedUrl: writtenMeta.courseWrittenEmbedUrl || null,
          courseWrittenUrlIsEmbeddable: writtenMeta.courseWrittenUrlIsEmbeddable || false,
          metadata: (writtenMeta.metadata) ? { ...writtenMeta.metadata } : {}
        };
        detailRecord = existing
          ? await existing.update(payload, { transaction })
          : await db.CourseWritten.create(payload, { transaction });
      } else if (courseContentType === 'CourseQuiz' && db.CourseQuiz) {
        const quizMeta = courseContentTypeDetail || {};
        const existing = await db.CourseQuiz.findOne({ where: { courseContentId: contentRecord.courseContentId }, transaction });
        const payload = {
          courseId: course.courseId,
          courseContentId: contentRecord.courseContentId,
          courseQuizDescription: quizMeta.courseQuizDescription || '',
          courseQuizType: quizMeta.courseQuizType || 'QUIZ',
          courseQuizTimer: quizMeta.courseQuizTimer || 0,
          isQuizTimed: quizMeta.isQuizTimed || false,
          courseQuizPassPercent: quizMeta.courseQuizPassPercent || 70,
        };
        detailRecord = existing
          ? await existing.update(payload, { transaction })
          : await db.CourseQuiz.create(payload, { transaction });

        // Replace questions with current set
        if (db.QuizQuestion) {
          await db.QuizQuestion.destroy({ where: { courseQuizId: detailRecord.courseQuizId }, transaction, individualHooks: true });
          if (quizMeta.questions && Array.isArray(quizMeta.questions)) {
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
        }
      } else if (courseContentType === 'CourseFlashcard' && db.CourseFlashcard) {
        const flashcardMeta = courseContentTypeDetail || {};
        const existing = await db.CourseFlashcard.findOne({ where: { courseContentId: contentRecord.courseContentId }, transaction });
        const payload = {
          userId,
          courseId: course.courseId,
          courseContentId: contentRecord.courseContentId,
          setTitle: flashcardMeta.setTitle || contentRecord.courseContentTitle,
          setDescription: flashcardMeta.setDescription || '',
          setDifficulty: flashcardMeta.setDifficulty || 'MEDIUM',
          estimatedDuration: flashcardMeta.estimatedDuration || 0,
          setTags: flashcardMeta.setTags || [],
          metadata: (flashcardMeta.metadata) ? { ...flashcardMeta.metadata } : {}
        };
        detailRecord = existing
          ? await existing.update(payload, { transaction })
          : await db.CourseFlashcard.create(payload, { transaction });

        // Replace cards with current set
        if (db.Flashcard) {
          await db.Flashcard.destroy({ where: { courseFlashcardId: detailRecord.courseFlashcardId }, transaction, individualHooks: true });
          if (flashcardMeta.cards && Array.isArray(flashcardMeta.cards)) {
            for (const card of flashcardMeta.cards) {
              await db.Flashcard.create({
                courseFlashcardId: detailRecord.courseFlashcardId,
                question: card.question || '',
                answer: card.answer || '',
                explanation: card.explanation || null,
                difficulty: card.difficulty || 'MEDIUM',
                orderIndex: card.orderIndex || 1,
                metadata: card.metadata || {}
              }, { transaction });
            }
          }
        }
      }

      return { contentRecord, detailRecord, type: courseContentType, isNew };
    };

    // Helper to cleanup old detail based on type
    const cleanupDetailByType = async (course, contentRecord, oldType) => {
      try {
        if (oldType === 'CourseVideo') {
          await db.CourseVideo.destroy({ where: { courseContentId: contentRecord.courseContentId }, transaction, individualHooks: true, force: false });
        } else if (oldType === 'CourseWritten' && db.CourseWritten) {
          await db.CourseWritten.destroy({ where: { courseContentId: contentRecord.courseContentId }, transaction, individualHooks: true });
        } else if (oldType === 'CourseQuiz' && db.CourseQuiz) {
          const existingQuiz = await db.CourseQuiz.findOne({ where: { courseContentId: contentRecord.courseContentId }, transaction });
          if (existingQuiz) {
            await db.QuizQuestion.destroy({ where: { courseQuizId: existingQuiz.courseQuizId }, transaction, individualHooks: true });
            await db.CourseQuiz.destroy({ where: { courseContentId: contentRecord.courseContentId }, transaction, individualHooks: true });
          }
        } else if (oldType === 'CourseFlashcard' && db.CourseFlashcard) {
          const existingSet = await db.CourseFlashcard.findOne({ where: { courseContentId: contentRecord.courseContentId }, transaction });
          if (existingSet) {
            await db.Flashcard.destroy({ where: { courseFlashcardId: existingSet.courseFlashcardId }, transaction, individualHooks: true });
            await db.CourseFlashcard.destroy({ where: { courseContentId: contentRecord.courseContentId }, transaction, individualHooks: true });
          }
        }
      } catch (e) {
        logger.warn('cleanupDetailByType error (non-fatal)', { error: e.message, oldType });
      }
    };

    const contentArray = Array.isArray(courseDetail.courseContent) ? courseDetail.courseContent : [];
    const createdContent = [];

    // Create or Update Course based on CourseBuilder.publishedCourseId
    let course = null;
    const existingPublishedCourseId = courseBuilder.publishedCourseId || courseBuilder?.courseBuilderData?.publishedCourseId;
    if (existingPublishedCourseId) {
      course = await db.Course.findByPk(existingPublishedCourseId, { transaction });
      if (!course) {
        logger.warn('publishedCourseId present on CourseBuilder but Course not found. Proceeding to create new Course.', { existingPublishedCourseId });
      }
    }

    if (!course) {
      // Create Course (publish)
      course = await db.Course.create({
        userId,
        orgId: orgId || null,
        courseBuilderId: courseBuilder.courseBuilderId,
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
    } else {
      // Validate user on existing course
      if (authUserId && course.userId !== authUserId) {
        throw new Error('User mismatch: cannot publish course for another user');
      }
      // Update course top-level fields
      await course.update({
        courseTitle: courseTitle.trim(),
        courseDescription: courseDescription.trim(),
        courseDuration: courseDuration || 0,
        courseImageUrl,
        courseType,
        deliveryMode,
        status: 'PUBLISHED',
        metadata: {
          ...(course.metadata || {}),
          ...(metadata || {}),
          updatedFromCourseBuilderAt: new Date().toISOString(),
          courseSourceChannel: courseSourceChannel || metadata?.courseSourceChannel || null,
        }
      }, { transaction });

      logger.info(`Course updated from builder payload: ${course.courseId}`);
    }

    for (const item of contentArray) {
      try {
        // Upsert content item by sequence
        const result = await upsertContentItem(course, item);
        if (result) {
          createdContent.push({
            courseContent: result.contentRecord,
            detail: result.detailRecord,
            type: result.type,
            isNew: result.isNew
          });
        }
      } catch (innerErr) {
        logger.error('Failed to persist content item', { 
          error: innerErr.message, 
          contentTitle: item?.courseContentTitle,
          contentType: item?.courseContentType 
        });
        throw innerErr; // Abort whole publish; atomic requirement
      }
    }

    // Deletion: remove course content not present in payload (by sequence)
    const payloadSequences = new Set(contentArray.map(i => i?.courseContentSequence).filter(Boolean));
    const existingAll = await db.CourseContent.findAll({ where: { courseId: course.courseId }, transaction });
    const toDelete = existingAll.filter(ec => !payloadSequences.has(ec.courseContentSequence));
    for (const ec of toDelete) {
      await cleanupDetailByType(course, ec, ec.courseContentType);
      await ec.destroy({ transaction, individualHooks: true });
    }

    // Owner access (if model exists)
    if (db.CourseAccess) {
      const existingAccess = await db.CourseAccess.findOne({
        where: { courseId: course.courseId, userId: userId, organizationId: orgId || null },
        transaction
      });
      if (!existingAccess) {
        await db.CourseAccess.create({
          courseId: course.courseId,
          userId: userId,
          organizationId: orgId || null,
          accessLevel: 'OWN',
          isActive: true,
          grantedByUserId: userId,
          metadata: { source: 'publishCourse', grantedAt: new Date().toISOString() }
        }, { transaction });
      }
    }

    // Update CourseBuilder status to PUBLISHED
    const builderData = courseBuilder.courseBuilderData || {};
    builderData.publishedCourseId = course.courseId;
    await courseBuilder.update({ 
      status: 'PUBLISHED', 
      publishedCourseId: course.courseId,
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
          detailId: c.detail ? (c.detail.courseVideoId || c.detail.courseWrittenId || c.detail.courseQuizId || c.detail.courseFlashcardId) : null
        })),
        counts: {
          total: createdContent.length,
          video: createdContent.filter(c => c.type === 'CourseVideo').length,
          written: createdContent.filter(c => c.type === 'CourseWritten').length,
          quiz: createdContent.filter(c => c.type === 'CourseQuiz').length,
          flashcard: createdContent.filter(c => c.type === 'CourseFlashcard').length,
          created: createdContent.filter(c => c.isNew).length,
          updated: createdContent.filter(c => !c.isNew).length,
          deleted: toDelete.length
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
