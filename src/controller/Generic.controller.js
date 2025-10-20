const jwt = require("jsonwebtoken");
const lodash = require("lodash");
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const logger = require("../config/winston.config");
const AcademyService = require("../service/AcademyService.service.js");
const DynamicService = require("../service/DynamicService.service.js");
const { ApiResponse } = require("../utils/responseFormatter");

async function deleteCourse(req, res, next) {
  const apiResponse = new ApiResponse(req, res);
  
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return apiResponse
        .status(400)
        .withMessage("courseId is required")
        .withError("courseId is required", "MISSING_FIELD", "deleteCourse")
        .error();
    }

    // Delete all related course data
    await DynamicService.deleteCourse(courseId, req.user.userId);
    
    apiResponse
      .status(200)
      .withMessage("Course and related data deleted successfully")
      .withData({ courseId, deleted: true })
      .withMeta({
        deletedBy: req.user.userId,
        deletedAt: new Date().toISOString()
      })
      .success();
  } catch (err) {
    logger.error(`Error occurred while deleting course:`, err.message);
    apiResponse
      .status(500)
      .withMessage(err.message || "Error occurred while deleting the course")
      .withError(err.message, err.code || "DELETE_COURSE_ERROR", "deleteCourse")
      .withMeta({
        courseId: req.body.courseId,
        attemptedBy: req.user?.userId
      })
      .error();
  }
}

async function getUser(req, res, next) {
  const apiResponse = new ApiResponse(req, res);
  
  try {
    const user = await AcademyService.getUser(req.user.userId);
    
    apiResponse
      .status(200)
      .withMessage("User retrieved successfully")
      .withData({ user })
      .withMeta({
        userId: req.user.userId
      })
      .success();
  } catch (err) {
    logger.error(`Error occurred while fetching user:`, err.message);
    apiResponse
      .status(500)
      .withMessage(err.message || "Failed to fetch user")
      .withError(err.message, err.code || "GET_USER_ERROR", "getUser")
      .withMeta({
        userId: req.user?.userId
      })
      .error();
  }
}

async function isUserCourseEnrolled(req, res, next) {
  const apiResponse = new ApiResponse(req, res);
  
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return apiResponse
        .status(400)
        .withMessage("courseId is required")
        .withError("courseId is required", "MISSING_FIELD", "isUserCourseEnrolled")
        .error();
    }

    const enrollment = await AcademyService.isUserCourseEnrolled(
      req.user.userId,
      courseId
    );
    
    apiResponse
      .status(200)
      .withMessage("Enrollment status checked successfully")
      .withData({ enrollment })
      .withMeta({
        userId: req.user.userId,
        courseId
      })
      .success();
  } catch (err) {
    logger.error(`Error occurred while checking enrollment:`, err.message);
    apiResponse
      .status(500)
      .withMessage(err.message || "Failed to check enrollment status")
      .withError(err.message, err.code || "CHECK_ENROLLMENT_ERROR", "isUserCourseEnrolled")
      .withMeta({
        userId: req.user?.userId,
        courseId: req.body.courseId
      })
      .error();
  }
}

async function userCourseEnrollment(req, res, next) {
  const apiResponse = new ApiResponse(req, res);
  
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return apiResponse
        .status(400)
        .withMessage("courseId is required")
        .withError("courseId is required", "MISSING_FIELD", "userCourseEnrollment")
        .error();
    }

    const enrollment = await AcademyService.userCourseEnrollment(
      req.user.userId,
      courseId
    );
    
    apiResponse
      .status(201)
      .withMessage("Course enrollment successful")
      .withData({ enrollment })
      .withMeta({
        userId: req.user.userId,
        courseId,
        enrolledAt: new Date().toISOString()
      })
      .success();
  } catch (err) {
    logger.error(`Error occurred during enrollment:`, err.message);
    apiResponse
      .status(500)
      .withMessage(err.message || "Failed to enroll in course")
      .withError(err.message, err.code || "ENROLLMENT_ERROR", "userCourseEnrollment")
      .withMeta({
        userId: req.user?.userId,
        courseId: req.body.courseId
      })
      .error();
  }
}

async function userCourseDisrollment(req, res, next) {
  const apiResponse = new ApiResponse(req, res);
  
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return apiResponse
        .status(400)
        .withMessage("courseId is required")
        .withError("courseId is required", "MISSING_FIELD", "userCourseDisrollment")
        .error();
    }

    const result = await AcademyService.userCourseDisrollment(
      req.user.userId,
      courseId
    );
    
    apiResponse
      .status(200)
      .withMessage("Course disenrollment successful")
      .withData({ result })
      .withMeta({
        userId: req.user.userId,
        courseId,
        disenrolledAt: new Date().toISOString()
      })
      .success();
  } catch (err) {
    logger.error(`Error occurred during disenrollment:`, err.message);
    apiResponse
      .status(500)
      .withMessage(err.message || "Failed to disenroll from course")
      .withError(err.message, err.code || "DISENROLLMENT_ERROR", "userCourseDisrollment")
      .withMeta({
        userId: req.user?.userId,
        courseId: req.body.courseId
      })
      .error();
  }
}

async function getCourseDetail(req, res, next) {
  const apiResponse = new ApiResponse(req, res);
  
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return apiResponse
        .status(400)
        .withMessage("courseId is required")
        .withError("courseId is required", "MISSING_FIELD", "getCourseDetail")
        .error();
    }

    const course = await AcademyService.getCourseDetail(req.user.userId, courseId);
    
    apiResponse
      .status(200)
      .withMessage("Course details fetched successfully")
      .withData(course)
      .withMeta({
        userId: req.user.userId,
        courseId
      })
      .success();
  } catch (err) {
    logger.error(`Error occurred while fetching course details:`, err.message);
    apiResponse
      .status(500)
      .withMessage(err.message || "Failed to fetch course details")
      .withError(err.message, err.code || "GET_COURSE_DETAIL_ERROR", "getCourseDetail")
      .withMeta({
        userId: req.user?.userId,
        courseId: req.body.courseId
      })
      .error();
  }
}

async function saveUserCourseContentProgress(req, res, next) {
  const apiResponse = new ApiResponse(req, res);
  
  try {
    const {
      logId,
      userCourseEnrollmentId,
      courseId,
      courseContentId,
      logStatus,
    } = req.body;

    if (!courseId || !courseContentId) {
      return apiResponse
        .status(400)
        .withMessage("courseId and courseContentId are required")
        .withError("courseId and courseContentId are required", "MISSING_FIELDS", "saveUserCourseContentProgress")
        .error();
    }

    const progress = await AcademyService.saveUserCourseContentProgress(
      req.user.userId,
      logId,
      userCourseEnrollmentId,
      courseId,
      courseContentId,
      logStatus
    );
    
    apiResponse
      .status(200)
      .withMessage("Progress saved successfully")
      .withData({ progress })
      .withMeta({
        userId: req.user.userId,
        courseId,
        courseContentId
      })
      .success();
  } catch (err) {
    logger.error(`Error occurred while saving progress:`, err.message);
    apiResponse
      .status(500)
      .withMessage(err.message || "Failed to save progress")
      .withError(err.message, err.code || "SAVE_PROGRESS_ERROR", "saveUserCourseContentProgress")
      .withMeta({
        userId: req.user?.userId,
        courseId: req.body.courseId,
        courseContentId: req.body.courseContentId
      })
      .error();
  }
}

async function deleteUserCourseContentProgress(req, res, next) {
  const apiResponse = new ApiResponse(req, res);
  
  try {
    const { progressId, courseId, courseContentId } = req.body;

    if (!progressId) {
      return apiResponse
        .status(400)
        .withMessage("progressId is required")
        .withError("progressId is required", "MISSING_FIELD", "deleteUserCourseContentProgress")
        .error();
    }

    const result = await AcademyService.deleteUserCourseContentProgress(
      req.user.userId,
      progressId,
      courseId,
      courseContentId
    );
    
    apiResponse
      .status(200)
      .withMessage("Progress deleted successfully")
      .withData({ result, progressId })
      .withMeta({
        userId: req.user.userId,
        progressId,
        deletedAt: new Date().toISOString()
      })
      .success();
  } catch (err) {
    logger.error(`Error occurred while deleting progress:`, err.message);
    apiResponse
      .status(500)
      .withMessage(err.message || "Failed to delete progress")
      .withError(err.message, err.code || "DELETE_PROGRESS_ERROR", "deleteUserCourseContentProgress")
      .withMeta({
        userId: req.user?.userId,
        progressId: req.body.progressId
      })
      .error();
  }
}

async function saveNote(req, res, next) {
  const apiResponse = new ApiResponse(req, res);
  
  try {
    const { notesId, courseId, courseContentId, noteContent, noteRefTimestamp, metadata } =
      req.body;

    if (!courseId || !noteContent) {
      return apiResponse
        .status(400)
        .withMessage("courseId and noteContent are required")
        .withError("courseId and noteContent are required", "MISSING_FIELDS", "saveNote")
        .error();
    }

    const note = await AcademyService.saveNote(
      req.user.userId,
      notesId,
      courseId,
      courseContentId,
      noteContent,
      noteRefTimestamp,
      metadata
    );
    
    apiResponse
      .status(200)
      .withMessage(notesId ? "Note updated successfully" : "Note created successfully")
      .withData({ note })
      .withMeta({
        userId: req.user.userId,
        courseId,
        courseContentId,
        isUpdate: !!notesId
      })
      .success();
  } catch (err) {
    logger.error(`Error occurred while saving note:`, err.message);
    apiResponse
      .status(500)
      .withMessage(err.message || "Failed to save note")
      .withError(err.message, err.code || "SAVE_NOTE_ERROR", "saveNote")
      .withMeta({
        userId: req.user?.userId,
        courseId: req.body.courseId,
        notesId: req.body.notesId
      })
      .error();
  }
}

async function deleteNote(req, res, next) {
  const apiResponse = new ApiResponse(req, res);
  
  try {
    const { notesId } = req.body;

    if (!notesId) {
      return apiResponse
        .status(400)
        .withMessage("notesId is required")
        .withError("notesId is required", "MISSING_FIELD", "deleteNote")
        .error();
    }

    const result = await AcademyService.deleteNote(req.user.userId, notesId);
    
    apiResponse
      .status(200)
      .withMessage("Note deleted successfully")
      .withData({ result, notesId })
      .withMeta({
        userId: req.user.userId,
        notesId,
        deletedAt: new Date().toISOString()
      })
      .success();
  } catch (err) {
    logger.error(`Error occurred while deleting note:`, err.message);
    apiResponse
      .status(500)
      .withMessage(err.message || "Failed to delete note")
      .withError(err.message, err.code || "DELETE_NOTE_ERROR", "deleteNote")
      .withMeta({
        userId: req.user?.userId,
        notesId: req.body.notesId
      })
      .error();
  }
}

async function searchRecord(req, res, next) {
  const apiResponse = new ApiResponse(req, res);
  
  try {
    const {
      searchValue,
      searchKey,
      attributes,
      limit,
      offset,
      sortBy,
      sortOrder,
      filters,
      associate,
    } = req.body;

    const results = await DynamicService.searchRecord(req, res);
    
    apiResponse
      .status(200)
      .withMessage("Search completed successfully")
      .withData(results)
      .withMeta({
        searchValue,
        searchKey,
        limit,
        offset,
        totalResults: Array.isArray(results) ? results.length : 0
      })
      .success();
  } catch (err) {
    logger.error(`Error occurred while searching records:`, err.message);
    apiResponse
      .status(500)
      .withMessage(err.message || "Failed to search records")
      .withError(err.message, err.code || "SEARCH_RECORD_ERROR", "searchRecord")
      .withMeta({
        searchValue: req.body.searchValue,
        searchKey: req.body.searchKey
      })
      .error();
  }
}

async function saveUserDetail(req, res, next) {
  const apiResponse = new ApiResponse(req, res);
  
  try {
    const { firstName, lastName, number, profilePic } = req.body;

    const user = await AcademyService.saveUserDetail(
      req.user.userId,
      firstName,
      lastName,
      number,
      profilePic
    );
    
    apiResponse
      .status(200)
      .withMessage("User details saved successfully")
      .withData({ user })
      .withMeta({
        userId: req.user.userId,
        updatedFields: Object.keys(req.body)
      })
      .success();
  } catch (err) {
    logger.error(`Error occurred while saving user details:`, err.message);
    apiResponse
      .status(500)
      .withMessage(err.message || "Failed to save user details")
      .withError(err.message, err.code || "SAVE_USER_DETAIL_ERROR", "saveUserDetail")
      .withMeta({
        userId: req.user?.userId
      })
      .error();
  }
}

async function submitQuiz(req, res, next) {
  const apiResponse = new ApiResponse(req, res);
  
  try {
    const { courseId, courseQuizId, submissionList } = req.body;

    if (!courseId || !courseQuizId || !submissionList) {
      return apiResponse
        .status(400)
        .withMessage("courseId, courseQuizId, and submissionList are required")
        .withError("courseId, courseQuizId, and submissionList are required", "MISSING_FIELDS", "submitQuiz")
        .error();
    }

    const result = await AcademyService.submitQuiz(
      req.user.userId,
      courseId,
      courseQuizId,
      submissionList
    );
    
    apiResponse
      .status(200)
      .withMessage("Quiz submitted successfully")
      .withData({ result })
      .withMeta({
        userId: req.user.userId,
        courseId,
        courseQuizId,
        submittedAt: new Date().toISOString()
      })
      .success();
  } catch (err) {
    logger.error(`Error occurred while submitting quiz:`, err.message);
    apiResponse
      .status(500)
      .withMessage(err.message || "Failed to submit quiz")
      .withError(err.message, err.code || "SUBMIT_QUIZ_ERROR", "submitQuiz")
      .withMeta({
        userId: req.user?.userId,
        courseId: req.body.courseId,
        courseQuizId: req.body.courseQuizId
      })
      .error();
  }
}

async function clearQuizResult(req, res, next) {
  const apiResponse = new ApiResponse(req, res);
  
  try {
    const { courseId, courseQuizId } = req.body;

    if (!courseId || !courseQuizId) {
      return apiResponse
        .status(400)
        .withMessage("courseId and courseQuizId are required")
        .withError("courseId and courseQuizId are required", "MISSING_FIELDS", "clearQuizResult")
        .error();
    }

    const result = await AcademyService.clearQuizResult(
      req.user.userId,
      courseId,
      courseQuizId
    );
    
    apiResponse
      .status(200)
      .withMessage("Quiz result cleared successfully")
      .withData({ result })
      .withMeta({
        userId: req.user.userId,
        courseId,
        courseQuizId,
        clearedAt: new Date().toISOString()
      })
      .success();
  } catch (err) {
    logger.error(`Error occurred while clearing quiz result:`, err.message);
    apiResponse
      .status(500)
      .withMessage(err.message || "Failed to clear quiz result")
      .withError(err.message, err.code || "CLEAR_QUIZ_RESULT_ERROR", "clearQuizResult")
      .withMeta({
        userId: req.user?.userId,
        courseId: req.body.courseId,
        courseQuizId: req.body.courseQuizId
      })
      .error();
  }
}

module.exports = {
  getCourseDetail,
  getUser,
  searchRecord,
  userCourseEnrollment,
  userCourseDisrollment,
  isUserCourseEnrolled,
  saveUserDetail,
  saveNote,
  deleteNote,
  saveUserCourseContentProgress,
  deleteUserCourseContentProgress,
  submitQuiz,
  clearQuizResult,
  deleteCourse
};
