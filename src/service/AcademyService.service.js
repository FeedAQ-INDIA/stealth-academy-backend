const {QueryTypes} = require("sequelize");
const db = require("../entity/index.js");
const lodash = require("lodash");
const logger = require("../config/winston.config.js");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const {toJSON} = require("lodash/seq");
const DynamicService = require("./DynamicService.service");


const submitQuiz = async (userId, courseId, courseQuizId, submissionList) => {

    const courseQuiz = await db.CourseQuiz.findByPk(courseQuizId);
    const quesList = await db.QuizQuestion.findAll({
        where: {
            courseId: courseQuizId,
        }
    });

    const totalPoints = quesList.reduce((accumulator, currentValue) => accumulator + currentValue.quizQuestionPosPoint, 0);

    let points = 0;
    submissionList.map(a => {
        const itemQues = quesList.find(b => b.quizQuestionId == a.quizQuestionId);
        let isAnswerSame = DynamicService.haveSameElements(a.answerList, itemQues.quizQuestionCorrectAnswer);
        if (isAnswerSame) {
            points += itemQues.quizQuestionPosPoint
        }else{
            points -= itemQues.quizQuestionNegPoint
        }
        a['isAnswerCorrect']=isAnswerSame
    });


    await db.QuizResultLog.destroy({
        where:{
            userId,
            courseQuizId
        }
    })

    const result = await db.QuizResultLog.create({
        userId,
        quizResultSnapshot: submissionList,
        quizResultPoint: points,
        totalPoints :totalPoints,
        isPassed : points >= courseQuiz?.courseQuizPassPercent ?  true:false,
        courseId,
        courseQuizId,
    });

    return result  ;
};


const clearQuizResult = async (userId, courseId, courseQuizId, courseTopicId) => {



    await db.QuizResultLog.destroy({
        where:{
            userId,
            courseQuizId
        }
    })


    return {message: "Reset Quiz is Successfull"}  ;
};


const saveUserDetail = async (
    userId,
    firstName,
    lastName,
    number,
    profilePic,
) => {
    const userData = await db.User.findByPk(userId);

    if (!userData) throw new Error("User not found"); // Handle case where user is not found

    userData.firstName = firstName;
    userData.lastName = lastName;
    userData.number = number;
    userData.profilePic = profilePic;

    await userData.save();
    return {message: 'User saved successfully'};
};



const raiseInterviewRequest = async (
    userId, interviewReqId,
    isCancel, date ,
    time ,
    duration ,
    resumeLink ,
    attachmentLink ,
    note,
    cancelReason,
) => {
    if (interviewReqId && isCancel) {
        const interviewReq = await db.InterviewReq.findByPk(interviewReqId);
        if(interviewReq.interviewReqStatus != "COMPLETED") {
            interviewReq.interviewReqStatus = "CANCELLED";
            interviewReq.interviewReqCancelReason = cancelReason;
            await interviewReq.save();

            return {message: 'Interview request cancelled successfully', data:interviewReq};
        }else{
            return {message: 'Interview request is already completed', data:interviewReq};

        }
    } else {
       const interviewReq = await db.InterviewReq.create({
            userId,
            interviewReqDate : date ,
            interviewReqTime : time ,
            interviewReqDuration : duration ,
            interviewReqStatus: "REQUESTED",
            interviewReqMedium : "ONLINE",
            interviewReqCV : resumeLink ,
            interviewReqAttach : attachmentLink ,
             interviewReqNote : note
        })
        return {message: 'Interview request created successfully', data:interviewReq};

    }

};





const raiseCounsellingRequest = async (
    userId, counsellingId  ,
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
) => {
    if (counsellingId && isCancel) {
        const counsellingReq = await db.Counselling.findByPk(counsellingId);
        if(counsellingReq.counsellingStatus != "COMPLETED") {
            counsellingReq.counsellingStatus = "CANCELLED";
            counsellingReq.counsellingCancelReason = counsellingCancelReason;
            await counsellingReq.save();

            return {message: 'Counselling request cancelled successfully', data: counsellingReq};
        }else{
            return {message: 'Counselling request is already completed', data: counsellingReq};

        }
    } else {
       const  counsellingReq = await db.Counselling.create({
            userId,
            counsellingId  ,
            counsellingDate   ,
            counsellingTime ,
            counsellingStatus : 'REQUESTED'   ,
            counsellingMode : 'ONLINE',
            counsellingUrl ,
            counsellingLanguage  ,
            counsellingBackground ,
            counsellingTopic ,
            counsellingNote  ,
            counsellingCancelReason
        })
        return {message: 'Counselling request created successfully', data: counsellingReq};

    }

};



const saveNote = async (
    userId,
    notesId,
    courseId,
    courseContentId,
    notesText,
) => {
    if (notesId) {
        const notesData = await db.Notes.findByPk(notesId);
        notesData.notesText = notesText;
        await notesData.save();

        return {message: 'Notes updated successfully'};

    } else {
        await db.Notes.create({
            userId: userId,
            courseId: courseId,
            courseContentId: courseContentId,
            notesText: notesText
        })
        return {message: 'Notes created successfully'};

    }


};


const deleteNote = async (
    userId, notesId,
) => {
    if (notesId) {
        const notesData = await db.Notes.findByPk(notesId);
         await notesData.destroy();

        return {message: 'Notes delete successfully'};

    } else {
        throw new Error("Not found notes with that id");

    }


};

const getUser = async (userId) => {
    const userData = await db.User.findByPk(userId);

    if (!userData) throw new Error("User not found"); // Handle case where user is not found

    return userData.toJSON();
};


const fetchScheduledCourseMeet = async (userId, page1, limit1) => {
    const page = parseInt(page1) || 1;
    const limit = parseInt(limit1) || 5;
    // const offset = (page - 1) * limit;
    const offset = page1

// Total count query
    const totalCountResult = await db.sequelize.query(
        `SELECT cs.*, c.course_title
         FROM user_enrollment ue
                  INNER JOIN course_schedule cs
                             ON ue.user_enrollment_course_id = cs.course_schedule_course_id
                                 AND ue.user_enrollment_course_batch = cs.course_schedule_batch
                  INNER JOIN course c
                             ON cs.course_schedule_course_id = c.course_id
         WHERE ue.user_enrollment_user_id = :userId `,
        {
            type: db.Sequelize.QueryTypes.SELECT,
            replacements: { userId }
        }
    );

    // const totalCount = totalCountResult?.[0]?.totalCount;

// Paginated data query
    const meetData = await db.sequelize.query(
        ` SELECT cs.*, c.course_title
          FROM user_enrollment ue
                   INNER JOIN course_schedule cs
                              ON ue.user_enrollment_course_id = cs.course_schedule_course_id
                                  AND ue.user_enrollment_course_batch = cs.course_schedule_batch
                   INNER JOIN course c
                              ON cs.course_schedule_course_id = c.course_id
          WHERE ue.user_enrollment_user_id = :userId
          ORDER BY cs.course_schedule_start_date ASC
              LIMIT :limit OFFSET :offset`,
        {
            model: db.CourseSchedule,
            mapToModel: true,
            replacements: { userId, limit, offset }
        }
    );

// Response in your desired format
    return ({
        results: meetData,
        totalCount : parseInt(totalCountResult?.[0]?.["totalcount"]) || 0,
        limit,
        offset
    });

};


const getCourseDetail = async (userId, courseId) => {

    const courseDetailsRaw = await db.Course.findOne({
        where: { courseId: courseId, userId: userId },
        include: [{
            model: db.CourseContent,
            as: "courseContent",
            required: false,
        }],
    });

    const courseDetails = courseDetailsRaw.toJSON();

    // Sort courseTopic in each course by courseTopicSequence ASC
    courseDetails?.courseContent?.sort((a, b) => a.courseContentSequence - b.courseContentSequence);


    console.log("Course Detail", courseDetails);
    return courseDetails;
};


 

const isUserCourseEnrolled = async (userId, courseId) => {
    let enrollUserCourseData
          enrollUserCourseData = await db.UserCourseEnrollment.findAll({
            where: {
                courseId: courseId, userId: userId
            }
        });


    if (enrollUserCourseData && enrollUserCourseData.length > 0) {
        return {isUserCourseEnrolledFlag: true, data:enrollUserCourseData}
    } else {
        return {isUserCourseEnrolledFlag: false}
    }
};

const userCourseEnrollment = async (userId, courseId) => {
    if(!userId || !courseId){
        throw new Error("User id & Course id must be provided");
    }
    const enrollUserCourseData = await isUserCourseEnrolled(userId, courseId);
    let enrollmentObj;
    if (enrollUserCourseData && !enrollUserCourseData.isUserCourseEnrolledFlag) {
        enrollmentObj = await db.UserCourseEnrollment.create({
            userId: userId,
            ...(courseId && {courseId: courseId}),
            enrollmentStatus: "ENROLLED"
        })
    }
    return enrollmentObj ? {message: 'Enrollment is successfull'} : {message: 'Enrollment failed'};

};


const userCourseDisrollment = async (userId, courseId) => {
    if(!userId || !courseId){
        throw new Error("User id & Course id must be provided");
    }
    const enrollUserCourseData = await isUserCourseEnrolled(userId, courseId);
    let disrollmentObj;
    if (enrollUserCourseData && enrollUserCourseData.isUserCourseEnrolledFlag) {
        await db.UserCourseContentProgress.destroy({where: { userId,
            ...(courseId && {courseId: courseId})}})
        disrollmentObj = await db.UserCourseEnrollment.destroy({where: { ...(courseId && {courseId: courseId}), userId: userId}});
            await db.Notes.destroy({where: {courseId: courseId, userId: userId}});
    }


    return disrollmentObj ? {message: 'Disrollment is successfull'} : {message: 'Disrollment failed'};
};


const saveUserCourseContentProgress = async (
    userId ,
    logId ,
    userCourseEnrollmentId,
    courseId ,
    courseContentId,
    logStatus

) => {
          const [enrollmentObj, created] = await db.UserCourseEnrollment.findOrCreate({
            where: {
                courseId,
                courseContentId,
            },
            defaults: {
                userId,
                logStatus,
                courseContentId,
                courseId
            }
        });

        const isCourseComplted = await validateCourseCompletion(userId, courseId);
        console.log("Is course Completed : ", isCourseComplted == true ? "TRUE": "FALSE");
        const obj = await db.Course.findByPk(courseId);
        obj.enrollmentStatus = isCourseComplted.possibleStatus
        await obj.save();

    return enrollmentObj ? {message: 'Enrollment is updated'} : {message: 'Enrollment is updated'};

};

const deleteUserCourseContentProgress = async (
    userId ,
    userActivityId ,
    courseId ,
    courseContentId,
 ) => {

        const  userActivityObj = await db.UserActivityLog.destroy({
            where: {
                // userActivityId ,
                userId,
                courseId ,
                courseContentId,
             },
        });
        const isCourseComplted = await validateCourseCompletion(userId, courseId);
        console.log("Is course Completed : ", isCourseComplted == true ? "TRUE": "FALSE");
        const obj = await db.Course.findByPk(courseId);
        obj.enrollmentStatus = isCourseComplted.possibleStatus
        await obj.save();

    return userActivityObj ? {message: 'Enrollment is updated'} : {message: 'Enrollment is updated'};

};

const validateCourseCompletion = async (userId ,
                                  courseId) => {
     const userActivityLog = await db.UserActivityLog.findAll({
        where: {
            courseId ,
            userId,
            enrollmentStatus: 'COMPLETED'
        },
        attributes:["courseContentId"],
    });

    const courseTopicContent = await db.CourseContent.findAll({
        where :{
            courseId: courseId
        },
        attributes:["courseContentId"],
    })

    console.log(userActivityLog?.map(a => a.courseContentId), courseTopicContent?.map(a => a.courseContentId))
    let isCourseCompleted = DynamicService.haveSameElements(userActivityLog?.map(a => a.courseContentId), courseTopicContent?.map(a => a.courseContentId));
    let possibleStatus;
    if(isCourseCompleted){
        possibleStatus = 'COMPLETED'
    }else if(!isCourseCompleted && userActivityLog?.length > 0 ){
        possibleStatus = 'IN PROGRESS';
    }
    return {
        isCourseCompleted : isCourseCompleted,
        possibleStatus: possibleStatus,
    }

}



module.exports = {
    getUser,
    userCourseEnrollment,
    userCourseDisrollment, isUserCourseEnrolled,
    getCourseDetail,
    saveUserDetail,
    saveNote,
    deleteNote,
    deleteUserCourseContentProgress,
    saveUserCourseContentProgress,
    submitQuiz,
    clearQuizResult,
    raiseInterviewRequest,
    raiseCounsellingRequest,
    fetchScheduledCourseMeet
};

