const jwt = require("jsonwebtoken");
const lodash = require("lodash");
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const logger = require("../config/winston.config");
const AcademyService = require("../service/AcademyService.service.js");


async function getUser(req, res, next) {
    const {} = req.body;
    try {
        let val = await AcademyService.getUser(req.user.userId);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}

async function fetchScheduledCourseMeet(req, res, next) {
    const {page, limit} = req.body;
    try {
        let val = await AcademyService.fetchScheduledCourseMeet(req.user.userId, page, limit);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}


async function enrollStatus(req, res, next) {
    const {courseId, webinarId} = req.body;
    try {
        let val = await AcademyService.enrollStatus(req.user.userId, courseId, webinarId);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}


async function enrollUserCourse(req, res, next) {
    const {courseId,webinarId} = req.body;
    try {
        let val = await AcademyService.enrollUserCourse(req.user.userId, courseId, webinarId);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}

async function disrollUserCourse(req, res, next) {
    const {courseId, webinarId} = req.body;
    try {
        let val = await AcademyService.disrollUserCourse(req.user.userId, courseId, webinarId);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}

async function getCourseDetail(req, res, next) {
    const {courseId} = req.body;
    try {
        let val = await AcademyService.getCourseDetail(req.user.userId, courseId);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}


async function saveUserEnrollmentData(req, res, next) {
    const {
        userActivityId ,
        courseId ,
        courseContentId,
         enrollmentStatus  } = req.body;
    try {
        let val = await AcademyService.saveUserEnrollmentData(req.user.userId,
            userActivityId ,
            courseId ,
            courseContentId,
             enrollmentStatus );
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}


async function deleteUserEnrollmentData(req, res, next) {
    const {
        userActivityId ,
        courseId ,
        courseContentId,
    } = req.body;
    try {
        let val = await AcademyService.deleteUserEnrollmentData(req.user.userId,
            userActivityId ,
            courseId ,
            courseContentId,
              );
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}

async function raiseInterviewRequest(req, res, next) {
    const {
        interviewReqId,
        isCancel,
        date ,
        time ,
        duration ,
        resumeLink ,
        attachmentLink ,
        note ,
    } = req.body;
    try {
        let val = await AcademyService.raiseInterviewRequest(req.user.userId, interviewReqId,
            isCancel, date ,
            time ,
            duration ,
            resumeLink ,
            attachmentLink ,
            note ,);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}

async function raiseCounsellingRequest(req, res, next) {
    const {
        counsellingId  ,
         counsellingDate   ,
        counsellingTime ,
        counsellingStatus   ,
    counsellingMode ,
    counsellingUrl ,
    counsellingLanguage  ,
    counsellingBackground ,
    counsellingTopic ,
    counsellingNote  ,
        isCancel,
        counsellingCancelReason
    } = req.body;
    try {
        let val = await AcademyService.raiseCounsellingRequest(req.user.userId, counsellingId  ,
            counsellingDate   ,
            counsellingTime ,
            counsellingStatus   ,
            counsellingMode ,
            counsellingUrl ,
            counsellingLanguage  ,
            counsellingBackground ,
            counsellingTopic ,
            counsellingNote  ,
            isCancel,
            counsellingCancelReason);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while scheduling counselling.",
        });
        next(err);
    }
}



async function saveNote(req, res, next) {
    const {notesId,
        courseId,
        courseContentId,
        notesText} = req.body;
    try {
        let val = await AcademyService.saveNote(req.user.userId, notesId,
            courseId,
            courseContentId,
            notesText,);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}


async function deleteNote(req, res, next) {
    const {notesId,
        } = req.body;
    try {
        let val = await AcademyService.deleteNote(req.user.userId, notesId);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}


async function searchRecord(req, res, next) {
    const {
        searchValue, searchKey, attributes, limit, offset, sortBy, sortOrder, filters, associate,
    } = req.body;
    try {
        let val = await AcademyService.searchRecord(req, res);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}

async function saveUserDetail(req, res, next) {
    const {
        firstName ,
        lastName ,
        number ,
        profilePic
    } = req.body;
    try {
        let val = await AcademyService.saveUserDetail(req.user.userId, firstName ,
            lastName ,
            number ,
            profilePic );
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}



async function submitQuiz(req, res, next) {
    const {
        courseId, courseQuizId, submissionList
          } = req.body;
    try {
        let val = await AcademyService.submitQuiz(req.user.userId,
            courseId, courseQuizId, submissionList);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}



async function clearQuizResult(req, res, next) {
    const {
        courseId, courseQuizId
    } = req.body;
    try {
        let val = await AcademyService.clearQuizResult(req.user.userId,
            courseId, courseQuizId );
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}



module.exports = {
    getCourseDetail,
    getUser,
    searchRecord,
    enrollUserCourse,
    disrollUserCourse,
    enrollStatus,
    saveUserDetail,
    saveNote,
    deleteNote,saveUserEnrollmentData,
    deleteUserEnrollmentData,submitQuiz,clearQuizResult,
    raiseInterviewRequest,
    raiseCounsellingRequest,
    fetchScheduledCourseMeet
};
