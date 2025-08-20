const {Op, fn, col, QueryTypes} = require("sequelize");
const db = require("../entity/index.js");
const lodash = require("lodash");
const logger = require("../config/winston.config.js");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const {toJSON} = require("lodash/seq");
const FormData = require('form-data');
const axios = require('axios');
const path = require('path'); 
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();


// const submitQuiz = async (userId, courseId, courseQuizId, submissionList) => {

//     const courseQuiz = await db.CourseQuiz.findByPk(courseQuizId);
//     const quesList = await db.QuizQuestion.findAll({
//         where: {
//             courseId: courseQuizId,
//         }
//     });

//     const totalPoints = quesList.reduce((accumulator, currentValue) => accumulator + currentValue.quizQuestionPosPoint, 0);

//     let points = 0;
//     submissionList.map(a => {
//         const itemQues = quesList.find(b => b.quizQuestionId == a.quizQuestionId);
//         let isAnswerSame = haveSameElements(a.answerList, itemQues.quizQuestionCorrectAnswer);
//         if (isAnswerSame) {
//             points += itemQues.quizQuestionPosPoint
//         }else{
//             points -= itemQues.quizQuestionNegPoint
//         }
//         a['isAnswerCorrect']=isAnswerSame
//     });


//     await db.QuizResultLog.destroy({
//         where:{
//             userId,
//             courseQuizId
//         }
//     })

//     const result = await db.QuizResultLog.create({
//         userId,
//         quizResultSnapshot: submissionList,
//         quizResultPoint: points,
//         totalPoints :totalPoints,
//         isPassed : points >= courseQuiz?.courseQuizPassPercent ?  true:false,
//         courseId,
//         courseQuizId,
//     });

//     return result  ;
// };


// const clearQuizResult = async (userId, courseId, courseQuizId, courseTopicId) => {



//     await db.QuizResultLog.destroy({
//         where:{
//             userId,
//             courseQuizId
//         }
//     })


//     return {message: "Reset Quiz is Successfull"}  ;
// };


// const saveUserDetail = async (
//     userId,
//     firstName,
//     lastName,
//     number,
//     profilePic,
// ) => {
//     const userData = await db.User.findByPk(userId);

//     if (!userData) throw new Error("User not found"); // Handle case where user is not found

//     userData.firstName = firstName;
//     userData.lastName = lastName;
//     userData.number = number;
//     userData.profilePic = profilePic;

//     await userData.save();
//     return {message: 'User saved successfully'};
// };



// const raiseInterviewRequest = async (
//     userId, interviewReqId,
//     isCancel, date ,
//     time ,
//     duration ,
//     resumeLink ,
//     attachmentLink ,
//     note,
//     cancelReason,
// ) => {
//     if (interviewReqId && isCancel) {
//         const interviewReq = await db.InterviewReq.findByPk(interviewReqId);
//         if(interviewReq.interviewReqStatus != "COMPLETED") {
//             interviewReq.interviewReqStatus = "CANCELLED";
//             interviewReq.interviewReqCancelReason = cancelReason;
//             await interviewReq.save();

//             return {message: 'Interview request cancelled successfully', data:interviewReq};
//         }else{
//             return {message: 'Interview request is already completed', data:interviewReq};

//         }
//     } else {
//        const interviewReq = await db.InterviewReq.create({
//             userId,
//             interviewReqDate : date ,
//             interviewReqTime : time ,
//             interviewReqDuration : duration ,
//             interviewReqStatus: "REQUESTED",
//             interviewReqMedium : "ONLINE",
//             interviewReqCV : resumeLink ,
//             interviewReqAttach : attachmentLink ,
//              interviewReqNote : note
//         })
//         return {message: 'Interview request created successfully', data:interviewReq};

//     }

// };





// const raiseCounsellingRequest = async (
//     userId, counsellingId  ,
//     counsellingDate   ,
//     counsellingTime ,
//     counsellingStatus   ,
//     counsellingMode ,
//     counsellingUrl ,
//     counsellingLanguage  ,
//     counsellingBackground ,
//     counsellingTopic ,
//     counsellingNote  ,
//     isCancel,
//     counsellingCancelReason
// ) => {
//     if (counsellingId && isCancel) {
//         const counsellingReq = await db.Counselling.findByPk(counsellingId);
//         if(counsellingReq.counsellingStatus != "COMPLETED") {
//             counsellingReq.counsellingStatus = "CANCELLED";
//             counsellingReq.counsellingCancelReason = counsellingCancelReason;
//             await counsellingReq.save();

//             return {message: 'Counselling request cancelled successfully', data: counsellingReq};
//         }else{
//             return {message: 'Counselling request is already completed', data: counsellingReq};

//         }
//     } else {
//        const  counsellingReq = await db.Counselling.create({
//             userId,
//             counsellingId  ,
//             counsellingDate   ,
//             counsellingTime ,
//             counsellingStatus : 'REQUESTED'   ,
//             counsellingMode : 'ONLINE',
//             counsellingUrl ,
//             counsellingLanguage  ,
//             counsellingBackground ,
//             counsellingTopic ,
//             counsellingNote  ,
//             counsellingCancelReason
//         })
//         return {message: 'Counselling request created successfully', data: counsellingReq};

//     }

// };



// const saveNote = async (
//     userId,
//     notesId,
//     courseTopicId,
//     courseId,
//     courseTopicContentId,
//     notesText,
// ) => {
//     if (notesId) {
//         const notesData = await db.Notes.findByPk(notesId);
//         notesData.notesText = notesText;
//         await notesData.save();

//         return {message: 'Notes updated successfully'};

//     } else {
//         await db.Notes.create({
//             userId: userId,
//             courseTopicId: courseTopicId,
//             courseId: courseId,
//             courseTopicContentId: courseTopicContentId,
//             notesText: notesText
//         })
//         return {message: 'Notes created successfully'};

//     }


// };


// const deleteNote = async (
//     userId, notesId,
// ) => {
//     if (notesId) {
//         const notesData = await db.Notes.findByPk(notesId);
//          await notesData.destroy();

//         return {message: 'Notes delete successfully'};

//     } else {
//         throw new Error("Not found notes with that id");

//     }


// };

const getUser = async (userId) => {
    const userData = await db.User.findByPk(userId);

    if (!userData) throw new Error("User not found"); // Handle case where user is not found

    return userData.toJSON();
};


// const fetchScheduledCourseMeet = async (userId, page1, limit1) => {
//     const page = parseInt(page1) || 1;
//     const limit = parseInt(limit1) || 5;
//     // const offset = (page - 1) * limit;
//     const offset = page1

// // Total count query
//     const totalCountResult = await db.sequelize.query(
//         `SELECT cs.*, c.course_title
//          FROM user_enrollment ue
//                   INNER JOIN course_schedule cs
//                              ON ue.user_enrollment_course_id = cs.course_schedule_course_id
//                                  AND ue.user_enrollment_course_batch = cs.course_schedule_batch
//                   INNER JOIN course c
//                              ON cs.course_schedule_course_id = c.course_id
//          WHERE ue.user_enrollment_user_id = :userId `,
//         {
//             type: db.Sequelize.QueryTypes.SELECT,
//             replacements: { userId }
//         }
//     );

//     // const totalCount = totalCountResult?.[0]?.totalCount;

// // Paginated data query
//     const meetData = await db.sequelize.query(
//         ` SELECT cs.*, c.course_title
//           FROM user_enrollment ue
//                    INNER JOIN course_schedule cs
//                               ON ue.user_enrollment_course_id = cs.course_schedule_course_id
//                                   AND ue.user_enrollment_course_batch = cs.course_schedule_batch
//                    INNER JOIN course c
//                               ON cs.course_schedule_course_id = c.course_id
//           WHERE ue.user_enrollment_user_id = :userId
//           ORDER BY cs.course_schedule_start_date ASC
//               LIMIT :limit OFFSET :offset`,
//         {
//             model: db.CourseSchedule,
//             mapToModel: true,
//             replacements: { userId, limit, offset }
//         }
//     );

// // Response in your desired format
//     return ({
//         results: meetData,
//         totalCount : parseInt(totalCountResult?.[0]?.["totalcount"]) || 0,
//         limit,
//         offset
//     });

// };


// const getCourseDetail = async (userId, courseId) => {
//     const enrollUserCourseData = await enrollStatus(userId, courseId);

//     const courseDetailsRaw = await db.Course.findOne({
//         where: { courseId: courseId },
//         include: [{
//             model: db.CourseTopic,
//             as: "courseTopic",
//             required: false,
//             include: [
//                 {
//                     model: db.CourseTopicContent,
//                     as: "courseTopicContent",
//                     required: false
//                 }
//             ]
//         }],
//     });



//     const courseDetails = courseDetailsRaw.toJSON();

//     // Sort courseTopic in each course by courseTopicSequence ASC
//     courseDetails?.courseTopic?.sort((a, b) => a.courseTopicSequence - b.courseTopicSequence);

//     // Sort courseTopicContent in each courseTopic by courseTopicContentSequence ASC
//     courseDetails?.courseTopic?.forEach(topic => {
//         if (Array.isArray(topic.courseTopicContent)) {
//             topic.courseTopicContent.sort((a, b) => a.courseTopicContentSequence - b.courseTopicContentSequence);
//         }
//     });

//     courseDetails?.courseTopic?.map(a=> {
//          let sumDuration = a?.courseTopicContent?.reduce((sum, b) => sum + parseInt(b.courseTopicContentDuration), 0);
//          console.log(sumDuration);
//         a['courseTopicDuration'] = sumDuration
//     })

//     console.log("Course Detail", courseDetails);
//     return courseDetails;
// };



// const enrollUserCourse = async (userId, courseId, webinarId) => {
//     const enrollUserCourseData = await enrollStatus(userId, courseId, webinarId);
//     let enrollmentObj;
//     if (enrollUserCourseData && !enrollUserCourseData.isUserEnrolled) {
//         enrollmentObj = await db.UserEnrollment.create({
//             userId: userId,
//             ...(courseId && {courseId: courseId}),
//             ...(webinarId && {webinarId: webinarId}),
//             enrollmentStatus: "ENROLLED"
//         })
//     }
//     return enrollmentObj ? {message: 'Enrollment is successfully'} : {message: 'Enrollment failed'};

// };

// const enrollStatus = async (userId, courseId, webinarId=null) => {
//     let enrollUserCourseData
//     if(courseId){
//          enrollUserCourseData = await db.UserEnrollment.findAll({
//             where: {
//                 courseId: courseId, userId: userId
//             }
//         });
//     } else  if(webinarId){
//         enrollUserCourseData = await db.UserEnrollment.findAll({
//             where: {
//                 webinarId: webinarId, userId: userId
//             }
//         });
//     }


//     if (enrollUserCourseData && enrollUserCourseData.length > 0) {
//         return {isUserEnrolled: true, enrollmentData:enrollUserCourseData}
//     } else {
//         return {isUserEnrolled: false}
//     }
// };

// const disrollUserCourse = async (userId, courseId, webinarId) => {
//     const enrollUserCourseData = await enrollStatus(userId, courseId, webinarId);
//     let disrollmentObj;
//     if (enrollUserCourseData && enrollUserCourseData.isUserEnrolled) {
//         await db.UserEnrollmentLog.destroy({where: { userId,
//             ...(courseId && {courseId: courseId}), ...(webinarId && {webinarId: webinarId}),}})
//         disrollmentObj = await db.UserEnrollment.destroy({where: { ...(courseId && {courseId: courseId}), ...(webinarId && {webinarId: webinarId}), userId: userId}});
//        if(courseId){
//            await db.Notes.destroy({where: {courseId: courseId, userId: userId}});
//        }

//     }


//     return disrollmentObj ? {message: 'Disrollment is successfully'} : {message: 'Disrollment failed'};
// };


// const saveUserEnrollmentData = async (
//     userId ,
//     userEnrollmentId ,
//     courseId ,
//     courseTopicContentId,
//     courseTopicId ,
//     enrollmentStatus ,

// ) => {
//     const enrollUserCourseData = await enrollStatus(userId, courseId);
//     let enrollmentObj;
//     if (enrollUserCourseData && enrollUserCourseData.isUserEnrolled) {
//         const [enrollmentObj, created] = await db.UserEnrollmentLog.findOrCreate({
//             where: {
//                 userEnrollmentId,
//                 courseId,
//                 courseTopicContentId,
//                 courseTopicId,
//             },
//             defaults: {
//                 userId,
//                 enrollmentStatus,
//             }
//         });

//         const isCourseComplted = await validateCourseCompletion(userId, userEnrollmentId);
//         console.log("Is course Completed : ", isCourseComplted == true ? "TRUE": "FALSE");
//         const obj = await db.UserEnrollment.findByPk(userEnrollmentId);
//         obj.enrollmentStatus = isCourseComplted.possibleStatus
//         await obj.save();
//     }else{
//         throw new Error("User not enrolled")
//     }
//     return enrollmentObj ? {message: 'Enrollment is updated'} : {message: 'Enrollment is updated'};

// };

// const deleteUserEnrollmentData = async (
//     userId ,
//     userEnrollmentId ,
//     courseId ,
//     courseTopicContentId,
//     courseTopicId
// ) => {
//     const enrollUserCourseData = await enrollStatus(userId, courseId);
//     let enrollmentObj;
//     if (enrollUserCourseData && enrollUserCourseData.isUserEnrolled) {
//         const  enrollmentObj = await db.UserEnrollmentLog.destroy({
//             where: {
//                 userEnrollmentId ,
//                 userId,
//                 courseId ,
//                 courseTopicContentId,
//                 courseTopicId ,
//             },
//         });
//         const isCourseComplted = await validateCourseCompletion(userId, userEnrollmentId);
//         console.log("Is course Completed : ", isCourseComplted == true ? "TRUE": "FALSE");
//         const obj = await db.UserEnrollment.findByPk(userEnrollmentId);
//         obj.enrollmentStatus = isCourseComplted.possibleStatus
//         await obj.save();
//     }else{
//         throw new Error("User not enrolled")
//     }
//     return enrollmentObj ? {message: 'Enrollment is updated'} : {message: 'Enrollment is updated'};

// };

// const validateCourseCompletion = async (userId ,
//                                   userEnrollmentId) => {
//     const userEnrollment =await db.UserEnrollment.findByPk(userEnrollmentId);
//     const userEnrollmentLog = await db.UserEnrollmentLog.findAll({
//         where: {
//             userEnrollmentId ,
//             enrollmentStatus: 'COMPLETED'
//         },
//         attributes:["courseTopicContentId"],
//     });

//     const courseTopicContent = await db.CourseTopicContent.findAll({
//         where :{
//             courseId: userEnrollment.courseId
//         },
//         attributes:["courseTopicContentId"],
//     })

//     console.log(userEnrollmentLog?.map(a => a.courseTopicContentId), courseTopicContent?.map(a => a.courseTopicContentId))
//     let isCourseCompleted = haveSameElements(userEnrollmentLog?.map(a => a.courseTopicContentId), courseTopicContent?.map(a => a.courseTopicContentId));
//     let possibleStatus;
//     if(isCourseCompleted){
//         possibleStatus = 'COMPLETED'
//     }else if(!isCourseCompleted && userEnrollmentLog?.length > 0 ){
//         possibleStatus = 'IN PROGRESS';
//     }
//     return {
//         isCourseCompleted : isCourseCompleted,
//         possibleStatus: possibleStatus,
//     }

// }

// function haveSameElements(arr1, arr2) {
//     if (arr1.length !== arr2.length) return false;
//     const sorted1 = [...arr1].sort((a, b) => a - b);
//     const sorted2 = [...arr2].sort((a, b) => a - b);
//     return sorted1.every((val, index) => val === sorted2[index]);
// }


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

const getWritingSubmission = async (userId, submissionId) => {
    try {
        console.log('Service received:', { userId, submissionId }); // Debug log
        if (!userId || !Number.isInteger(userId)) {
            throw new Error("Invalid or missing userId");
        }
        if (!submissionId || !Number.isInteger(submissionId)) {
            throw new Error("Invalid or missing submissionId");
        }
        const submission = await db.WritingSubmission.findOne({
            where: {
                id: submissionId,
                userId: userId,
            },
            include: [
                { model: db.User, as: 'user' },
                { model: db.WritingPrompt, as: 'writingPrompt' },
            ],
        });
        if (!submission) {
            throw new Error("Writing submission not found");
        }
        return submission.toJSON();
    } catch (error) {
        logger.error('Service error:', error.message);
        throw new Error('Could not fetch writing submission: ' + error.message);
    }
};
// const dynamicApiHandler = async (entity, operation, data = {}, id = null) => {
//     const model = db[entity];
//     if (!model) {
//         throw new Error(`Entity ${entity} not found`);
//     }

//     switch (operation.toLowerCase()) {
//         case 'get':
//             if (id) {
//                 // Get single record by ID
//                 return model.findByPk(id);
//             } else {
//                 // Search with filters/pagination
//                 const { limit = 10, offset = 0, where = {}, include = [] } = data;
//                 return model.findAndCountAll({
//                     where,
//                     include,
//                     limit: parseInt(limit),
//                     offset: parseInt(offset)
//                 });
//             }
            
//         case 'post':
//             if (id) {
//                 // Update existing record
//                 const record = await model.findByPk(id);
//                 if (!record) throw new Error('Record not found');
//                 return record.update(data);
//             } else {
//                 // Create new record
//                 return model.create(data);
//             }
            
//         default:
//             throw new Error(`Invalid operation: ${operation}`);
//     }
// }; 

// const searchRecord = async (req, res) => {
//     try {
//         const {limit, offset, getThisData} = req.body;
//         const queryOptions = {
//             limit: limit || 10,
//             offset: offset || 0,
//             include: parseIncludes(getThisData)?.include,
//             where: buildWhereClause(getThisData.where || {}),
//             order: getThisData.order || [], ...(!lodash.isEmpty(getThisData.attributes) && {
//                 attributes: getThisData.attributes,
//             }),
//         };
//         if (!lodash.isEmpty(getThisData.attributes)) {
//             let a = [];
//             getThisData.attributes.forEach((attr) => {
//                 if (Array.isArray(attr) && attr.length === 2 && attr[0] === "DISTINCT") {
//                     a.push([fn("DISTINCT", col(attr[1])), attr[1]]);
//                 }
//             });
//             if (a && !lodash.isEmpty(a)) {
//                 queryOptions.attributes = a;
//                 console.log("if", JSON.stringify(queryOptions));
//             } else {
//                 console.log("elsse");
//             }
//         }
//         console.log(JSON.stringify(queryOptions));
//         const {count, rows} = await lodash
//             .get(db, getThisData.datasource)
//             .findAndCountAll({...queryOptions, distinct: true});
//         console.log(rows);
//         return {
//             results: rows, totalCount: count, limit, offset,
//         };
//     } catch (error) {
//         console.error("Error fetching data:", error);
//         return null;
//     }
// };
// test data is comming or not api test function 

const generateWritingPrompt = (config) => {
  // Example prompt generation based on configuration
  const levels = {
    beginner: "simple",
    intermediate: "moderate",
    expert: "advanced"
  };
  
  const styles = {
    expository: "Explain",
    descriptive: "Describe",
    persuasive: "Convince me",
    narrative: "Tell a story",
    'informal-email': "Write an informal email",
    'formal-email': "Write a formal email"
  };
  
  const topic = config.topicSource === 'auto' 
    ? "a topic of your choice" 
    : config.customTopic || "your chosen topic";
  
  return `${styles[config.writingStyle]} about ${topic} using ${levels[config.level]} English.`;
};


const getWritingPrompts = async (options = {}) => {
    try {
        const { where = {}, userId } = options;

        // 1. Get IDs of prompts already submitted by the user
        const submittedPrompts = await db.WritingSubmission.findAll({
            where: {
                userId: userId
            },
            attributes: ['promptId'],
            raw: true,
        });

        const submittedPromptIds = submittedPrompts.map(submission => submission.promptId);

        // 2. Build the main where clause
        const whereClause = {};
        if (where.level) {
            whereClause.writing_prompt_level = where.level;
        }
        if (where.name) {
            whereClause.writing_prompt_name = where.name;
        }
        if (where.isAutoGenerated !== undefined) {
            whereClause.writing_prompt_is_auto_generated = where.isAutoGenerated;
        }
        if (where.createdByUserId !== undefined) {
            whereClause.createdByUserId = where.createdByUserId;
        }

        // 3. Exclude prompts that the user has already solved
        if (submittedPromptIds.length > 0) {
            whereClause.id = {
                [db.Sequelize.Op.notIn]: submittedPromptIds
            };
        }

        // 4. Find one prompt that matches all criteria and has not been solved
        const prompt = await db.WritingPrompt.findOne({
            where: whereClause,
            order: [['id', 'ASC']] // Order by id in ascending order to get the first available one
        });

        return prompt;
    } catch (error) {
        logger.error('Service error while fetching writing prompts:', error.message);
        throw new Error('Could not fetch writing prompts: ' + error.message);
    }
};


// saving prompt  

const saveWritingPrompt = async (promptData) => {
    try {
        const { level, name, promptText, isAutoGenerated, createdByUserId } = promptData;

        // Basic validation
        if (!level || !name || !promptText) {
            throw new Error("Missing required fields: level, name, and promptText are required.");
        }

        const newPrompt = await db.WritingPrompt.create({
            level: level,
            name: name,
            promptText: promptText,
            isAutoGenerated: isAutoGenerated || false,
            createdByUserId: createdByUserId || null,
        });

        return newPrompt.toJSON();
    } catch (error) {
        logger.error('Service error while saving writing prompt:', error.message);
        // Re-throw the error to be caught by the controller
        throw error;
    }
}; 

// refresh question 
const getNextWritingPrompt = async (userId, currentPromptId, level, name) => {
    try {
        if (!userId || !currentPromptId || !level || !name) {
            throw new Error('User ID, current prompt ID, level, and name are required.');
        }

        // 1. Get IDs of prompts already submitted by the user
        const submittedPrompts = await db.WritingSubmission.findAll({
            where: {
                userId: userId
            },
            attributes: ['promptId'],
            raw: true,
        });

        const submittedPromptIds = submittedPrompts.map(submission => submission.promptId);

        // 2. Build the where clause for the next prompt
        const whereClause = {
            id: {
                [db.Sequelize.Op.gt]: currentPromptId, // Find ID greater than the current one
            },
            writing_prompt_level: level, // Match the level
            writing_prompt_name: name // Match the name
        };

        // 3. Exclude prompts that the user has already solved
        if (submittedPromptIds.length > 0) {
            whereClause.id[db.Sequelize.Op.notIn] = submittedPromptIds;
        }

        // 4. Find one prompt that matches all criteria and has not been solved
        const nextPrompt = await db.WritingPrompt.findOne({
            where: whereClause,
            order: [['id', 'ASC']] // Order by id ascending to get the immediate next one
        });

        if (!nextPrompt) {
            return null;
        }

        return nextPrompt;
    } catch (error) {
        logger.error('Service error while fetching the next writing prompt:', error.message);
        throw new Error('Could not fetch the next writing prompt: ' + error.message);
    }
};


// save writing submission 
// AcademyService.service.js
const saveWritingSubmission = async (
    userId, 
    promptId, 
    responseText,
    typingSpeed = null,       // New field, default to null
    totalTime = null,         // New field, default to null
    editHistory = null,       // New field, default to null
    lexicalDiversity = null,  // New field, default to null
    wordCount = null,         // New field, default to null
    avgSentenceLength = null, // New field, default to null
    questionThinkingTime = null, // New field, default to null
    answerThinkingTime = null // New field, default to null
) => {
    try {
        console.log('Service received:', { 
            userId, promptId, responseText, typingSpeed, totalTime, editHistory, 
            lexicalDiversity, wordCount, avgSentenceLength, questionThinkingTime, 
            answerThinkingTime 
        }); // Debug log

        if (!userId || !Number.isInteger(userId)) {
            throw new Error("Invalid or missing userId");
        }
        if (!promptId || !Number.isInteger(promptId)) {
            throw new Error("Invalid or missing promptId");
        }
        if (!responseText || typeof responseText !== 'string') {
            throw new Error("responseText is required and must be a string");
        }
        // Validate optional fields for type consistency if needed, e.g.:
        // if (typingSpeed !== null && typeof typingSpeed !== 'number') {
        //     throw new Error("Invalid typingSpeed. Must be a number or null.");
        // }
        // ...and so on for other new fields. For now, we'll assume the frontend sends correct types or null.

        const prompt = await db.WritingPrompt.findByPk(promptId);
        if (!prompt) throw new Error("Writing prompt not found");
        const user = await db.User.findByPk(userId);
        if (!user) throw new Error("User not found");

        const newSubmission = await db.WritingSubmission.create({
            userId,
            promptId,
            responseText,
            submittedAt: new Date(), // Explicitly set submittedAt
            typingSpeed,
            totalTime,
            editHistory,
            lexicalDiversity,
            wordCount,
            avgSentenceLength,
            questionThinkingTime,
            answerThinkingTime
        });
        return { message: 'Writing submission saved successfully', submissionId: newSubmission.id };
    } catch (error) {
        logger.error('Service error:', error.message);
        throw new Error('Could not save writing submission: ' + error.message);
    }
};


// --- New function to save ReadingTopic ---
const saveReadingTopic = async (topicData) => {
    try {
        const { level, topicType,  contentText,  createdByUserId } = topicData;

        // Basic validation for required fields
        if (!level || !topicType  || !contentText) {
            throw new Error("Missing required fields: level, topicType, title, and contentText are required.");
        }

        // Validate level against ENUM values
        const allowedLevels = ["beginner", "intermediate", "expert"];
        if (!allowedLevels.includes(level)) {
            throw new Error(`Invalid level: ${level}. Must be one of ${allowedLevels.join(', ')}.`);
        }

        // Validate topicType against ENUM values
        const allowedTopicTypes = ["Art and music", "Biographies & Autobiography", "Science", "Short stories", "Drama / plays"];
        if (!allowedTopicTypes.includes(topicType)) {
            throw new Error(`Invalid topicType: ${topicType}. Must be one of ${allowedTopicTypes.join(', ')}.`);
        }

        const newReadingTopic = await db.ReadingTopic.create({
            level: level,
            topicType: topicType,
            title:  null,
            contentText: contentText,
            isAutoGenerated:  false, // Default to false if not provided
            createdByUserId: createdByUserId || null, // Allow null if not provided
        });

        return newReadingTopic.toJSON(); // Return the created topic as a plain JSON object
    } catch (error) {
        logger.error('Service error while saving reading topic:', error.message);
        // Re-throw the error to be caught by the controller
        throw error;
    }
};

// get reading promt 
const getReadingTopic = async (options = {}) => {
    try {
        const { where = {}, userId } = options;

        if (!userId) {
            throw new Error('User ID is required to fetch a reading topic.');
        }

        // 1. Get IDs of topics already submitted by the user from ReadingSubmission table
        const submittedTopics = await db.ReadingSubmission.findAll({
            where: {
                userId: userId
            },
            attributes: ['topicId'],
            raw: true,
        });

        const submittedTopicIds = submittedTopics.map(submission => submission.topicId);

        // 2. Find one topic that matches all criteria and has not been solved
        const topic = await db.ReadingTopic.findOne({
            where: {
                ...(where.level && { level: where.level }),
                ...(where.topicType && { topicType: where.topicType }),
                ...(where.isAutoGenerated !== undefined && { isAutoGenerated: where.isAutoGenerated }),
                ...(where.createdByUserId !== undefined && { createdByUserId: where.createdByUserId }),
                ...(submittedTopicIds.length > 0 && {
                    id: {
                        [db.Sequelize.Op.notIn]: submittedTopicIds
                    }
                })
            },
            order: [['id', 'ASC']] // Order by id in ascending order to get the first available one
        });

        return topic;
    } catch (error) {
        logger.error('Service error while fetching reading topic:', error.message);
        throw new Error('Could not fetch reading topic: ' + error.message);
    }
};

// refresh reading topic
// This function retrieves the next reading topic based on the current topic ID, level, and topic type.
// It ensures that the user has not already submitted the topic and returns the next available topic.
const getNextReadingTopic = async (userId, currentTopicId, level, topicType) => {
    try {
        if (!userId || !currentTopicId || !level || !topicType) {
            throw new Error('User ID, current topic ID, level, and topic type are required.');
        }

        // 1. Get IDs of reading topics already submitted by the user
        const submittedTopics = await db.ReadingSubmission.findAll({
            where: {
                userId: userId
            },
            attributes: ['topicId'],
            raw: true,
        });

        const submittedTopicIds = submittedTopics.map(submission => submission.topicId);

        // 2. Build the where clause for the next topic
        const whereClause = {
            id: {
                [db.Sequelize.Op.gt]: currentTopicId, // Find ID greater than the current one
            },
            level: level, // Match the level
            topicType: topicType // Match the topic type
        };

        // 3. Exclude topics that the user has already submitted
        if (submittedTopicIds.length > 0) {
            whereClause.id[db.Sequelize.Op.notIn] = submittedTopicIds;
        }

        // 4. Find one topic that matches all criteria and has not been submitted
        const nextTopic = await db.ReadingTopic.findOne({
            where: whereClause,
            order: [['id', 'ASC']] // Order by id ascending to get the immediate next one
        });

        if (!nextTopic) {
            return null;
        }

        return nextTopic;
    } catch (error) {
        logger.error('Service error while fetching the next reading topic:', error.message);
        throw new Error('Could not fetch the next reading topic: ' + error.message);
    }
};


// upload audio file to supabase 
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://oviuywlgknkrpjinxmmn.supabase.co/'; // Your Project URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92aXV5d2xna25rcnBqaW54bW1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNjM5MzMsImV4cCI6MjA2OTYzOTkzM30.SRAs3T0CFDaN4y6Bj2yEF89F2SoCNUNbdYj53sttRb8'; // Your API key
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const uploadAudioFile = async (file, userId) => {
    try {
        const fileExtension = file.originalname.split('.').pop();
        const filePath = `reading-submissions/${userId}-${Date.now()}.${fileExtension}`;
        const fileSize = file.size;

        // Record the start time of the upload
        const uploadStartTime = Date.now();

        const { data, error } = await supabase.storage
            .from('reading') // Use your bucket name "reading"
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        // Record the end time of the upload
        const uploadEndTime = Date.now();

        if (error) {
            throw new Error('Supabase upload error: ' + error.message);
        }

        const { data: publicURLData } = supabase.storage
            .from('reading')
            .getPublicUrl(filePath);

        // Return an object with all the required information
        return {
            url: publicURLData.publicUrl,
            startTime: new Date(uploadStartTime).toISOString(),
            endTime: new Date(uploadEndTime).toISOString(),
            fileSize: fileSize,
        };

    } catch (error) {
        console.log(error);
        logger.error('Service error while uploading audio:', error.message);
        throw error;
    }
};


// --- New function to save ReadingSubmission ---
const saveReadingSubmission = async (
    userId,
    topicId,
    audioUrl,
    recordingDuration = null,
    attemptsCount = null,
    selfConfidence = null,
    noiseLevel = null,
    deviceInfo = null,
    practiceTime = null,
    modelPlays = null,
    userNotes = null
) => {
    try {
        console.log('Service received reading submission:', {
            userId, topicId, audioUrl, recordingDuration, attemptsCount,
            selfConfidence, noiseLevel, deviceInfo, practiceTime, modelPlays, userNotes
        });

        if (!userId || !Number.isInteger(userId)) {
            throw new Error("Invalid or missing userId");
        }
        if (!topicId || !Number.isInteger(topicId)) {
            throw new Error("Invalid or missing topicId");
        }
        if (!audioUrl || typeof audioUrl !== 'string') {
            throw new Error("audioUrl is required and must be a string");
        }

        const topic = await db.ReadingTopic.findByPk(topicId);
        if (!topic) throw new Error("Reading topic not found");
        const user = await db.User.findByPk(userId);
        if (!user) throw new Error("User not found");

        const newSubmission = await db.ReadingSubmission.create({
            userId,
            topicId,
            audioUrl,
            submittedAt: new Date(),
            recordingDuration,
            attemptsCount,
            selfConfidence,
            noiseLevel,
            deviceInfo,
            practiceTime,
            modelPlays,
            userNotes
        });
        return { message: 'Reading submission saved successfully', submissionId: newSubmission.id };
    } catch (error) {
        logger.error('Service error while saving reading submission:', error.message);
        throw new Error('Could not save reading submission: ' + error.message);
    }
};


// speaking 
// --- New function to save SpeakingTopic ---
const saveSpeakingTopic = async (topicData) => {
    try {
        const { level, topicType, promptText, createdByUserId } = topicData;

        // Basic validation for required fields
        if (!level || !topicType || !promptText) {
            throw new Error("Missing required fields: level, topicType, and promptText are required.");
        }

        // Validate level against ENUM values from SpeakingTopic.entity.js
        const allowedLevels = ["beginner", "intermediate", "expert"];
        if (!allowedLevels.includes(level)) {
            throw new Error(`Invalid level: ${level}. Must be one of ${allowedLevels.join(', ')}.`);
        }

        // Validate topicType against ENUM values from SpeakingTopic.entity.js
        const allowedTopicTypes = ["Personal", "Descriptive", "Opinion", "General"];
        if (!allowedTopicTypes.includes(topicType)) {
            throw new Error(`Invalid topicType: ${topicType}. Must be one of ${allowedTopicTypes.join(', ')}.`);
        }

        const newSpeakingTopic = await db.SpeakingTopic.create({
            level: level,
            topicType: topicType,
            promptText: promptText,
            isAutoGenerated: false, // Default to false if not provided
            createdByUserId: createdByUserId || null, // Allow null if not provided
        });

        return newSpeakingTopic.toJSON(); // Return the created topic as a plain JSON object
    } catch (error) {
        logger.error('Service error while saving speaking topic:', error.message);
        // Re-throw the error to be caught by the controller
        throw error;
    }
};

// --- New function to get SpeakingTopic ---
const getSpeakingTopic = async (options = {}) => {
    try {
        const { where = {}, userId } = options;

        if (!userId) {
            throw new Error('User ID is required to fetch a speaking topic.');
        }

        // 1. Get IDs of topics already submitted by the user from SpeakingSubmission table
        const submittedTopics = await db.SpeakingSubmission.findAll({
            where: {
                userId: userId
            },
            attributes: ['topicId'],
            raw: true,
        });

        const submittedTopicIds = submittedTopics.map(submission => submission.topicId);

        // 2. Find one topic that matches all criteria and has not been solved
        const topic = await db.SpeakingTopic.findOne({
            where: {
                ...(where.level && { level: where.level }),
                ...(where.topicType && { topicType: where.topicType }),
                ...(where.isAutoGenerated !== undefined && { isAutoGenerated: where.isAutoGenerated }),
                ...(where.createdByUserId !== undefined && { createdByUserId: where.createdByUserId }),
                ...(submittedTopicIds.length > 0 && {
                    id: {
                        [db.Sequelize.Op.notIn]: submittedTopicIds
                    }
                })
            },
            order: [['id', 'ASC']] // Order by id in ascending order to get the first available one
        });

        return topic;
    } catch (error) {
        logger.error('Service error while fetching speaking topic:', error.message);
        throw new Error('Could not fetch speaking topic: ' + error.message);
    }
};
// --- New function to get the next SpeakingTopic ---
const getNextSpeakingTopic = async (userId, currentTopicId, level, topicType) => {
    try {
        if (!userId || !currentTopicId || !level || !topicType) {
            throw new Error('User ID, current topic ID, level, and topic type are required.');
        }

        // 1. Get IDs of speaking topics already submitted by the user
        const submittedTopics = await db.SpeakingSubmission.findAll({
            where: {
                userId: userId
            },
            attributes: ['topicId'],
            raw: true,
        });

        const submittedTopicIds = submittedTopics.map(submission => submission.topicId);

        // 2. Build the where clause for the next topic
        const whereClause = {
            id: {
                [db.Sequelize.Op.gt]: currentTopicId, // Find ID greater than the current one
            },
            level: level, // Match the level
            topicType: topicType // Match the topic type
        };

        // 3. Exclude topics that the user has already submitted
        if (submittedTopicIds.length > 0) {
            whereClause.id[db.Sequelize.Op.notIn] = submittedTopicIds;
        }

        // 4. Find one topic that matches all criteria and has not been submitted
        const nextTopic = await db.SpeakingTopic.findOne({
            where: whereClause,
            order: [['id', 'ASC']] // Order by id ascending to get the immediate next one
        });

        if (!nextTopic) {
            return null;
        }

        return nextTopic;
    } catch (error) {
        logger.error('Service error while fetching the next speaking topic:', error.message);
        throw new Error('Could not fetch the next speaking topic: ' + error.message);
    }
};

const uploadSpeakingAudioFile = async (file, userId) => {
    try {
        const fileExtension = file.originalname.split('.').pop();
        const filePath = `speaking-submissions/${userId}-${Date.now()}.${fileExtension}`;
        const fileSize = file.size;

        // Record the start time of the upload
        const uploadStartTime = Date.now();

        const { data, error } = await supabase.storage
            .from('speaking') // Use your bucket name "reading"
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        // Record the end time of the upload
        const uploadEndTime = Date.now();
        
        if (error) {
            throw new Error('Supabase upload error: ' + error.message);
        }

        const { data: publicURLData } = supabase.storage
            .from('speaking')
            .getPublicUrl(filePath);

        // Return an object with all the required information
        return {
            url: publicURLData.publicUrl,
            startTime: new Date(uploadStartTime).toISOString(),
            endTime: new Date(uploadEndTime).toISOString(),
            fileSize: fileSize,
        };

    } catch (error) {
        console.log(error);
        logger.error('Service error while uploading audio:', error.message);
        throw error;
    }
}; 

// --- NEW: saveSpeakingSubmission function ---
const saveSpeakingSubmission = async (
    userId,
    topicId,
    audioUrl,
    audioDuration = null,
    pauseCount = null,
    aiReportJson = null // This will be updated by analyzeSpeakingWithPythonAPI
) => {
    try {
        if (!userId || !Number.isInteger(userId)) {
            throw new Error("Invalid or missing userId");
        }
        if (!topicId || !Number.isInteger(topicId)) {
            throw new Error("Invalid or missing topicId");
        }
        if (!audioUrl || typeof audioUrl !== 'string') {
            throw new Error("audioUrl is required and must be a string");
        }

        // const topic = await db.SpeakingTopic.findByPk(topicId);
        // if (!topic) throw new Error("Speaking topic not found");
        // const user = await db.User.findByPk(userId);
        // if (!user) throw new Error("User not found");

        const newSubmission = await db.SpeakingSubmission.create({
            userId,
            topicId,
            audioUrl,
            submittedAt: new Date(),
            audioDuration,
            pauseCount,
            aiReportJson // Initial save can be null, updated later
        });
        return { message: 'Speaking submission saved successfully', submissionId: newSubmission.id };
    } catch (error) {
        logger.error('Service error while saving speaking submission:', error.message);
        throw new Error('Could not save speaking submission: ' + error.message);
    }
};

// --- NEW: analyzeSpeakingWithPythonAPI function ---
const analyzeSpeakingWithPythonAPI = async (file, submissionId) => {
    try {
        // Fetch the speaking topic to get the prompt text for analysis context
        const submission = await db.SpeakingSubmission.findByPk(submissionId);
        if (!submission) {
            throw new Error("Speaking submission not found");
        }

        const topicId = submission.topicId;
        const speakingTopic = await db.SpeakingTopic.findByPk(topicId);
        if (!speakingTopic) {
            throw new Error(`Speaking topic with ID ${topicId} not found`);
        }
        const promptText = speakingTopic.promptText;
        const level = speakingTopic.level;
        const topicType = speakingTopic.topicType;

        const form = new FormData();
        form.append('audio', file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype,
        });
        form.append('prompt_text', promptText);
        form.append('level', level);
        form.append('topic_type', topicType);

        // Make the POST request to your Flask API endpoint for speaking analysis
        const response = await axios.post('http://localhost:5000/analyze-audio', form, {
            headers: form.getHeaders(),
        });

        // Update the SpeakingSubmission with the AI report
        submission.aiReportJson = response.data;
        await submission.save();

        return response.data;

    } catch (error) {
        logger.error('Error calling Python Speaking API:', error.message);
        if (error.response) {
            logger.error('Python Speaking API Response:', error.response.data);
            throw new Error(`Python API responded with error: ${JSON.stringify(error.response.data)}`);
        }
        throw error;
    }
};


// reading ai analyze 


const analyzeReadingWithPythonAPI = async (file,  id) => {
    try {
        const form = new FormData();

        // data base operation
        const submission = await db.ReadingSubmission.findByPk(id);
        if (!submission) {
            throw new Error("Reading submission not found");
        }

        // 2. Get the topicId from the ReadingSubmission
        const topicId = submission.topicId;

        // 3. Fetch the ReadingTopic to get the original text
        // Assuming 'db.ReadingTopic' is your Sequelize model for reading topics
        // And 'content' is the field where the original text is stored.
        const readingTopic = await db.ReadingTopic.findByPk(topicId);
        if (!readingTopic) {
            throw new Error(`Reading topic with ID ${topicId} not found`);
        }
        const level = readingTopic.level;
        const topicType = readingTopic.topicType;
        const title = readingTopic.title;
        const originalText = readingTopic.contentText; 
        // Append the audio file
        form.append('audio', file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype,
        });

        // Append the original text
        form.append('original_text', originalText);
        form.append('level', level);
        form.append('topic_type', topicType); // Use snake_case for consistency with Flask forms
        form.append('title', title);
        console.log(level, topicType, title, originalText);
        // Make the POST request to your Flask API endpoint for reading analysis
        const response = await axios.post('http://localhost:5000/analyze-reading', form, {
            headers: form.getHeaders(),
        });

        // Assuming you have a database model for ReadingSubmission
        
        submission.aiReportJson = response.data; // Store the structured AI report
        await submission.save();

        // The Flask API will return a JSON object with 'original_text', 'user_transcript', and 'analysis'
        return response.data;

    } catch (error) {
        logger.error('Error calling Python Reading API:', error.message);
        if (error.response) {
            logger.error('Python Reading API Response:', error.response.data);
        }
        throw error;
    }
};

const analyzeWritingWithPythonAPI = async (writtenText, id,typingSpeed, totalTime, editHistory, lexicalDiversity, wordCount, avgSentenceLength, questionThinkingTime, answerThinkingTime) => {
    try { 
        const submission = await db.WritingSubmission.findByPk(id);
        if (!submission) {
            throw new Error("Reading submission not found");
        }
        const topicId = submission.promptId; // Assuming promptId is the topic ID
        const writingPrompt = await db.WritingPrompt.findByPk(topicId);
        if (!writingPrompt) {
            throw new Error(`Writing prompt with ID ${topicId} not found`);
        } 
        // Prepare the payload for the Flask API
        // Assuming 'writtenText' is the text to be analyzed and 'writingPrompt' is the prompt object
        // You can adjust the payload structure based on your Flask API requirements    
        const level = writingPrompt.level;
        const name = writingPrompt.name;
        const promptText = writingPrompt.promptText; // Assuming this is the text of
        // Prepare the payload for the Flask API, including all behavioral metrics
        const payload = {
            written_text: writtenText,
            writing_prompt: promptText, // The actual prompt text
            typing_speed: typingSpeed,
            total_time: totalTime,
            edit_history: editHistory, // Axios will convert this JS object/array to JSON
            question_thinking_time: questionThinkingTime,
            answer_thinking_time: answerThinkingTime,
            level: level, // NEW: Include level
            name: name    // NEW: Include name
        };

        // Make the POST request to your Flask API endpoint for writing analysis
        const response = await axios.post('http://localhost:5000/analyze-writing', payload, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // The Flask API will return a JSON object with 'written_text', 'writing_prompt', and 'analysis'
        return response.data;

    } catch (error) {
        console.error('Error calling Python Writing API:', error.message);
        if (error.response) {
            console.error('Python Writing API Response:', error.response.data);
            // You might want to throw a more specific error or re-throw the original
            throw new Error(`Python API responded with error: ${JSON.stringify(error.response.data)}`);
        }
        throw error;
    }
}; 



// gemini auto genaret 
const gemini_api_key = process.env.GEMINI_API_KEY;

if (!gemini_api_key) {
  throw new Error("GEMINI_API_KEY is not defined in the environment variables.");
}

const ai = new GoogleGenerativeAI(gemini_api_key);

const generatePrompt = (category, query, level) => {
  let basePrompt;
  const sanitizedLevel = level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();

  switch (category.toLowerCase()) {
    case "reading skills":
      basePrompt = `Generate a  concise paragraph   for a ${sanitizedLevel} level student. The response should only include the paragraph, with no additional exercises, questions, instructions, or other content.`;
      break;
    case "writing skills":
      basePrompt = `Generate  concise writing prompt  for a ${sanitizedLevel} level English student. The prompt should be clear, simple, and focused on encouraging writing practice, with no additional exercises, questions, instructions, or other content.`;
      break;
    case "speaking skills":
      basePrompt = `Generate  concise speaking topic (1 sentence) based on  ${sanitizedLevel} level student. The response should only include the topic sentence, with no additional exercises, questions, or instructions.`;
      break;
    case "listening skills":
      basePrompt = `Generate a single, concise listening exercise prompt  for a ${sanitizedLevel} level English student. The prompt should be clear, simple, and focused on encouraging listening practice, with no additional exercises, questions, instructions, or other content.`;
      break;
    case "email writing":
      basePrompt = `Generate  concise email writing scenario  for a ${sanitizedLevel} level English student. The scenario should be clear, simple, and focused on encouraging email writing practice, with no additional exercises, questions, instructions, or other content.`;
      break;
    default:
      basePrompt = `Generate a learning exercise.`;
  }

  if (query && query.trim() !== "") {
  switch (category.toLowerCase()) {
    case "reading skills":
      return `Write  paragraph  about "${query}" for a ${sanitizedLevel} level student. 
Only return the paragraph text, no questions, instructions, or extra formatting.`;

    case "writing skills":
      return `Give a single clear writing prompt about "${query}" for a ${sanitizedLevel} level student. 
The response should be only one sentence that encourages the student to write, with no paragraph, instructions, or extra text.`;

    case "speaking skills":
      return `Give a simple speaking topic in one sentence about "${query}" for a ${sanitizedLevel} level student. 
Only return the topic sentence, nothing else.`;

    
  }
} else {
  // If no user query, use the constant prompt based on category and level.
  return basePrompt;
}
};
const callGeminiAPI = async (query, level, category) => {
  try {
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = generatePrompt(category, query, level);
    
    console.log("Generated prompt for Gemini:", prompt);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return { success: true, data: text };

  } catch (error) {
    console.error("Error calling Gemini API:", error.message);
    return { success: false, error: error.message };
  }
}; 

// select topic 

const saveTopicSelect = async (topicData) => {
    try {
        // Destructure data from topicData for clarity and validation
        const { level, type, promptText, query, isAutoGenerated, createdByUserId } = topicData;

        // Basic validation for required fields based on your TopicSelect.entity.js
        if (!level || !type || !promptText) {
            throw new Error("Missing required fields: level, type, and promptText are necessary to save a topic.");
        }

        // Validate ENUM values for 'level'
        const allowedLevels = ["beginner", "intermediate", "expert"];
        if (!allowedLevels.includes(level)) {
            throw new Error(`Invalid level: "${level}". Must be one of ${allowedLevels.join(', ')}.`);
        }

        // Validate ENUM values for 'type'
        const allowedTypes = ["reading_skills", "writing_skills", "speaking_skills"];
        if (!allowedTypes.includes(type)) {
            throw new Error(`Invalid type: "${type}". Must be one of ${allowedTypes.join(', ')}.`);
        }

        // Create the new record in the TopicSelect table
        const newTopicSelect = await db.TopicSelect.create({
            level: level,
            type: type,
            promptText: promptText,
            query: query || null, // 'query' is nullable, so set to null if not provided
            isAutoGenerated: typeof isAutoGenerated === 'boolean' ? isAutoGenerated : false, // Default to false if not provided or invalid type
            createdByUserId: createdByUserId || null, // 'createdByUserId' is nullable
        });

        // Return the newly created record as a plain JSON object
        return newTopicSelect.toJSON();
    } catch (error) {
        logger.error('Service error while saving TopicSelect data:', error.message);
        throw error; // Re-throw to be caught by the controller
    }
};
module.exports = {
    getUser,
    
    searchRecord,
    generateWritingPrompt,
    getWritingPrompts,
    saveWritingPrompt, 
    getNextWritingPrompt,
    saveWritingSubmission,
    saveReadingTopic,
    getReadingTopic,
    getNextReadingTopic,
    uploadAudioFile,
    saveReadingSubmission,
    saveSpeakingTopic ,
    getNextSpeakingTopic,
    getSpeakingTopic,
    uploadSpeakingAudioFile,
    saveSpeakingSubmission,
    analyzeSpeakingWithPythonAPI,
    
    analyzeReadingWithPythonAPI,
    analyzeWritingWithPythonAPI,
    callGeminiAPI,
    saveTopicSelect
    // dynamicApiHandler
};