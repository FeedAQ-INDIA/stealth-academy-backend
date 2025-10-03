const jwt = require("jsonwebtoken");
const lodash = require("lodash");
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const logger = require("../config/winston.config");
const AcademyService = require("../service/AcademyService.service.js");
const DynamicService = require("../service/DynamicService.service.js");

async function deleteCourse(req, res, next) {
  const { courseId } = req.body;
  try {
    // Delete all related course data
    await DynamicService.deleteCourse(courseId, req.user.userId);
    
    res.status(200).send({
      status: 200,
      message: "Course and related data deleted successfully"
    });
  } catch (err) {
    console.error(`Error occurred while deleting course:`, err.message);
    res.status(500).send({
      status: 500,
      message: err.message || "Error occurred while deleting the course"
    });
    next(err);
  }
}

async function getUser(req, res, next) {
  const {} = req.body;
  try {
    let val = await AcademyService.getUser(req.user.userId);
    res.status(200).send({
      status: 200,
      message: "Success",
      data: val != null ? val : [],
    });
  } catch (err) {
    console.error(`Error occured`, err.message);
    res.status(500).send({
      status: 500,
      message:
        err.message || "Some error occurred while creating the Tutorial.",
    });
    next(err);
  }
}

async function isUserCourseEnrolled(req, res, next) {
  const { courseId } = req.body;
  try {
    let val = await AcademyService.isUserCourseEnrolled(
      req.user.userId,
      courseId
    );
    res.status(200).send({
      status: 200,
      message: "Success",
      data: val != null ? val : [],
    });
  } catch (err) {
    console.error(`Error occured`, err.message);
    res.status(500).send({
      status: 500,
      message:
        err.message || "Some error occurred while creating the Tutorial.",
    });
    next(err);
  }
}

async function userCourseEnrollment(req, res, next) {
  const { courseId } = req.body;
  try {
    let val = await AcademyService.userCourseEnrollment(
      req.user.userId,
      courseId
    );
    res.status(200).send({
      status: 200,
      message: "Success",
      data: val != null ? val : [],
    });
  } catch (err) {
    console.error(`Error occured`, err);
    res.status(500).send({
      status: 500,
      message:
        err.message || "Some error occurred while creating the Tutorial.",
    });
    next(err);
  }
}

async function userCourseDisrollment(req, res, next) {
  const { courseId } = req.body;
  try {
    let val = await AcademyService.userCourseDisrollment(
      req.user.userId,
      courseId
    );
    res.status(200).send({
      status: 200,
      message: "Success",
      data: val != null ? val : [],
    });
  } catch (err) {
    console.error(`Error occured`, err.message);
    res.status(500).send({
      status: 500,
      message:
        err.message || "Some error occurred while creating the Tutorial.",
    });
    next(err);
  }
}

async function getCourseDetail(req, res, next) {
  const { courseId } = req.body;
  try {
    let val = await AcademyService.getCourseDetail(req.user.userId, courseId);
    res.status(200).send({
      status: 200,
      message: "Success",
      data: val != null ? val : [],
    });
  } catch (err) {
    console.error(`Error occured`, err.message);
    res.status(500).send({
      status: 500,
      message:
        err.message || "Some error occurred while creating the Tutorial.",
    });
    next(err);
  }
}

async function saveUserCourseContentProgress(req, res, next) {
  const {
    logId,
    userCourseEnrollmentId,
    courseId,
    courseContentId,
    logStatus,
  } = req.body;
  try {
    let val = await AcademyService.saveUserCourseContentProgress(
      req.user.userId,
      logId,
      userCourseEnrollmentId,
      courseId,
      courseContentId,
      logStatus
    );
    res.status(200).send({
      status: 200,
      message: "Success",
      data: val != null ? val : [],
    });
  } catch (err) {
    console.error(`Error occured`, err.message);
    res.status(500).send({
      status: 500,
      message:
        err.message || "Some error occurred while creating the Tutorial.",
    });
    next(err);
  }
}

async function deleteUserCourseContentProgress(req, res, next) {
  const { progressId, courseId, courseContentId } = req.body;
  try {
    let val = await AcademyService.deleteUserCourseContentProgress(
      req.user.userId,
      progressId,
      courseId,
      courseContentId
    );
    res.status(200).send({
      status: 200,
      message: "Success",
      data: val != null ? val : [],
    });
  } catch (err) {
    console.error(`Error occured`, err.message);
    res.status(500).send({
      status: 500,
      message:
        err.message || "Some error occurred while creating the Tutorial.",
    });
    next(err);
  }
}

async function saveNote(req, res, next) {
  const { notesId, courseId, courseContentId, noteContent, noteRefTimestamp } =
    req.body;
  try {
    let val = await AcademyService.saveNote(
      req.user.userId,
      notesId,
      courseId,
      courseContentId,
      noteContent,
      noteRefTimestamp
    );
    res.status(200).send({
      status: 200,
      message: "Success",
      data: val != null ? val : [],
    });
  } catch (err) {
    console.error(`Error occured`, err.message);
    res.status(500).send({
      status: 500,
      message:
        err.message || "Some error occurred while creating the Tutorial.",
    });
    next(err);
  }
}

async function deleteNote(req, res, next) {
  const { notesId } = req.body;
  try {
    let val = await AcademyService.deleteNote(req.user.userId, notesId);
    res.status(200).send({
      status: 200,
      message: "Success",
      data: val != null ? val : [],
    });
  } catch (err) {
    console.error(`Error occured`, err.message);
    res.status(500).send({
      status: 500,
      message:
        err.message || "Some error occurred while creating the Tutorial.",
    });
    next(err);
  }
}

async function searchRecord(req, res, next) {
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
  try {
    let val = await DynamicService.searchRecord(req, res);
    res.status(200).send({
      status: 200,
      message: "Success",
      data: val != null ? val : [],
    });
  } catch (err) {
    console.error(`Error occured`, err.message);
    res.status(500).send({
      status: 500,
      message: err.message || "Some error occurred while searching records.",
    });
    next(err);
  }
}

async function saveUserDetail(req, res, next) {
  const { firstName, lastName, number, profilePic } = req.body;
  try {
    let val = await AcademyService.saveUserDetail(
      req.user.userId,
      firstName,
      lastName,
      number,
      profilePic
    );
    res.status(200).send({
      status: 200,
      message: "Success",
      data: val != null ? val : [],
    });
  } catch (err) {
    console.error(`Error occured`, err.message);
    res.status(500).send({
      status: 500,
      message:
        err.message || "Some error occurred while creating the Tutorial.",
    });
    next(err);
  }
}

async function submitQuiz(req, res, next) {
  const { courseId, courseQuizId, submissionList } = req.body;
  try {
    let val = await AcademyService.submitQuiz(
      req.user.userId,
      courseId,
      courseQuizId,
      submissionList
    );
    res.status(200).send({
      status: 200,
      message: "Success",
      data: val != null ? val : [],
    });
  } catch (err) {
    console.error(`Error occured`, err.message);
    res.status(500).send({
      status: 500,
      message:
        err.message || "Some error occurred while creating the Tutorial.",
    });
    next(err);
  }
}

async function clearQuizResult(req, res, next) {
  const { courseId, courseQuizId } = req.body;
  try {
    let val = await AcademyService.clearQuizResult(
      req.user.userId,
      courseId,
      courseQuizId
    );
    res.status(200).send({
      status: 200,
      message: "Success",
      data: val != null ? val : [],
    });
  } catch (err) {
    console.error(`Error occured`, err.message);
    res.status(500).send({
      status: 500,
      message:
        err.message || "Some error occurred while creating the Tutorial.",
    });
    next(err);
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
