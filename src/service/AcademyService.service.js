const {Op, fn, col, QueryTypes} = require("sequelize");
const db = require("../entity/index.js");
const lodash = require("lodash");
const logger = require("../config/winston.config.js");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const {toJSON} = require("lodash/seq");


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
        let isAnswerSame = haveSameElements(a.answerList, itemQues.quizQuestionCorrectAnswer);
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
        await db.UserCourseContentLog.destroy({where: { userId,
            ...(courseId && {courseId: courseId})}})
        disrollmentObj = await db.UserCourseEnrollment.destroy({where: { ...(courseId && {courseId: courseId}), userId: userId}});
            await db.Notes.destroy({where: {courseId: courseId, userId: userId}});
    }


    return disrollmentObj ? {message: 'Disrollment is successfull'} : {message: 'Disrollment failed'};
};


const saveUserCourseContentLog = async (
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

const deleteUserCourseContentLog = async (
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
    let isCourseCompleted = haveSameElements(userActivityLog?.map(a => a.courseContentId), courseTopicContent?.map(a => a.courseContentId));
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



function haveSameElements(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    const sorted1 = [...arr1].sort((a, b) => a - b);
    const sorted2 = [...arr2].sort((a, b) => a - b);
    return sorted1.every((val, index) => val === sorted2[index]);
}


const searchRecord = async (req, res) => {
    try {
        const {limit, offset, getThisData} = req.body;

        // Prepare query options
        const queryOptions = {
            limit: limit || 10,
            offset: offset || 0,
            include: parseIncludes(getThisData)?.include,
            where: buildWhereClause(getThisData.where || {}),
            order: getThisData.order || [], ...(!lodash.isEmpty(getThisData.attributes) && {
                attributes: getThisData.attributes,
            }),
        };

        if (!lodash.isEmpty(getThisData.attributes)) {
            let a = [];
            getThisData.attributes.forEach((attr) => {
                // Check if attr is an array indicating a function
                if (Array.isArray(attr) && attr.length === 2 && attr[0] === "DISTINCT") {
                    a.push([fn("DISTINCT", col(attr[1])), attr[1]]); // Handle the DISTINCT case
                }
            });
            console.log(a.length);
            if (a && !lodash.isEmpty(a)) {
                queryOptions.attributes = a;
                console.log("if", JSON.stringify(queryOptions));
            } else {
                console.log("elsse");
            }
        }

        console.log(JSON.stringify(queryOptions));

        // Fetch the data from the database
        const {count, rows} = await lodash
            .get(db, getThisData.datasource)
            .findAndCountAll({...queryOptions, distinct: true});
        console.log(rows);
        return {
            results: rows, totalCount: count, limit, offset,
        };
    } catch (error) {
        console.error("Error fetching data:", error);
        return null;
    }
};

const buildWhereClause = (conditions) => {
    const where = {};

    for (const [key, value] of Object.entries(conditions)) {
        // Handle $and and $or at the top level
        if (key === "$and" || key === "$or") {
            where[Op[key.slice(1)]] = value.map((subCondition) => buildWhereClause(subCondition));
        }
        // Handle regular conditions
        else if (value && typeof value === "object" && !Array.isArray(value)) {
            // Define operator mapping
            const operatorMapping = {
                $eq: Op.eq,
                $ne: Op.ne,
                $gt: Op.gt,
                $lt: Op.lt,
                $gte: Op.gte,
                $lte: Op.lte,
                $between: Op.between,
                $like: Op.like,
                $notLike: Op.notLike,
                $in: Op.in,
                $notIn: Op.notIn,
                $is: Op.is,
            };

            // Apply operator mapping for individual field conditions
            where[key] = Object.entries(value).reduce((acc, [op, val]) => {
                if (operatorMapping[op] !== undefined) {
                    acc[operatorMapping[op]] = val;
                }
                return acc;
            }, {});
        } else {
            // Handle null and simple values for non-object types
            where[key] = value !== null ? value : {[Op.is]: null};
        }
    }

    return where;
};

const parseIncludes = (data) => {
    console.log(data);
    const {datasource, as, where, order, include, required, attributes} = data;
    console.log("key :: ", lodash.get(db, datasource), "::  req", required);

    let parsedInclude = {
        model: lodash.get(db, datasource),
        as: as,
        where: buildWhereClause(where || {}),
        order: order || [],
        required: required || false, ...(!lodash.isEmpty(attributes) && {attributes: attributes}),
    };

    if (!lodash.isEmpty(attributes)) {
        let a = [];
        attributes.forEach((attr) => {
            // Check if attr is an array indicating a function
            if (Array.isArray(attr) && attr.length === 2 && attr[0] === "DISTINCT") {
                a.push([fn("DISTINCT", col(attr[1])), attr[1]]); // Handle the DISTINCT case
            }
        });
        console.log(a.length);
        if (a && !lodash.isEmpty(a)) {
            parsedInclude.attributes = a;
        }
    }

    if (include && include.length) {
        parsedInclude.include = include.map((subInclude) => parseIncludes(subInclude));
    }

    return parsedInclude;
};


module.exports = {
    getUser,
    searchRecord,
    userCourseEnrollment,
    userCourseDisrollment, isUserCourseEnrolled,
    getCourseDetail,
    saveUserDetail,
    saveNote,
    deleteNote,
    deleteUserCourseContentLog,
    saveUserCourseContentLog,
    submitQuiz,
    clearQuizResult,
    raiseInterviewRequest,
    raiseCounsellingRequest,
    fetchScheduledCourseMeet
};

