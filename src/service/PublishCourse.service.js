const db = require("../entity/index.js");
const logger = require("../config/winston.config.js");

/**
 * Publish Course from a pre-processed Course Builder payload
 * Accepts the full structure produced by CourseBuilder processing (or a subset)
 * and persists normalized records into Course, CourseContent, CourseVideo, CourseWritten, etc.
 *
 * Expected payload shape (examples accepted):
 * 1. { success, message, operation, data: { courseBuilderId, userId, orgId, status, courseBuilderData: { courseDetail: {...} } } }
 * 2. { courseBuilderId, userId, orgId, courseBuilderData: { courseDetail: {...} } }
 * 3. { courseBuilderData: { courseDetail: {...} } }
 */
async function publishCourseFromBuilderPayload(rawPayload, authUserId) {
  const transaction = await db.sequelize.transaction();
  try {
    // Normalize payload paths
    const rootData = rawPayload?.data || rawPayload || {};
    const courseBuilderData = rootData?.courseBuilderData || {};
    const courseDetail = courseBuilderData?.courseDetail;
    const courseBuilderId = rootData?.courseBuilderId || rawPayload?.courseBuilderId || rawPayload?.data?.courseBuilderId || null;

    if (!courseDetail) {
      throw new Error("courseDetail missing in payload");
    }

    const userId = courseDetail.userId || rootData.userId || rawPayload?.data?.userId || authUserId;
    const orgId = courseDetail.orgId || rootData.orgId || null;

    if (!userId) {
      throw new Error("userId missing in payload");
    }
    if (authUserId && userId !== authUserId) {
      throw new Error("User mismatch: cannot publish for another user");
    }

    const {
      courseTitle,
      courseDescription,
      courseDuration = 0,
      courseImageUrl = null,
      courseType = 'BYOC',
      deliveryMode = 'ONLINE',
      status = 'DRAFT',
      courseSourceChannel = null,
      metadata = {}
    } = courseDetail;

    if (!courseTitle || !courseDescription) {
      throw new Error("Missing courseTitle or courseDescription in courseDetail");
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
          courseContentTypeDetail = {}
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
        }

        createdContent.push({
          courseContent: contentRecord,
          detail: detailRecord,
          type: courseContentType
        });
      } catch (innerErr) {
        logger.error('Failed to persist content item', { error: innerErr.message });
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

    // Update builder status if builderId present
    if (courseBuilderId && db.CourseBuilder) {
      const builder = await db.CourseBuilder.findOne({ where: { courseBuilderId, userId } });
      if (builder) {
        try {
          const bData = builder.courseBuilderData || {};
          bData.publishedCourseId = course.courseId;
          await builder.update({ status: 'PUBLISHED', courseBuilderData: bData }, { transaction });
        } catch (e) {
          logger.warn(`Failed to update CourseBuilder status for ${courseBuilderId}: ${e.message}`);
        }
      }
    }

    await transaction.commit();

    return {
      success: true,
      message: 'Course published successfully',
      data: {
        course,
        courseContentItems: createdContent.map(c => ({
          courseContentId: c.courseContent.courseContentId,
          type: c.type,
          detailId: c.detail ? (c.detail.courseVideoId || c.detail.courseWrittenId) : null
        })),
        counts: {
          total: createdContent.length,
          video: createdContent.filter(c => c.type === 'CourseVideo').length,
          written: createdContent.filter(c => c.type === 'CourseWritten').length
        }
      }
    };
  } catch (error) {
    await transaction.rollback();
    logger.error('Error publishing course from builder payload', { error: error.message, stack: error.stack });
    throw error;
  }
}

module.exports = {
  publishCourseFromBuilderPayload
};
