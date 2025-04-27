const {Op, fn, col} = require("sequelize");
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

const saveNote = async (
    userId,
    notesId,
    courseTopicId,
    courseId,
    courseTopicContentId,
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
            courseTopicId: courseTopicId,
            courseId: courseId,
            courseTopicContentId: courseTopicContentId,
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

const getCourseDetail = async (userId, courseId) => {
    const enrollUserCourseData = await enrollStatus(userId, courseId);

    const courseDetailsRaw = await db.Course.findOne({
        where: { courseId: courseId },
        include: [{
            model: db.CourseTopic,
            as: "courseTopic",
            required: false,
            include: [
                {
                    model: db.CourseTopicContent,
                    as: "courseTopicContent",
                    required: false
                }
            ]
        }],
    });



    const courseDetails = courseDetailsRaw.toJSON();

    // Sort courseTopic in each course by courseTopicSequence ASC
    courseDetails?.courseTopic?.sort((a, b) => a.courseTopicSequence - b.courseTopicSequence);

    // Sort courseTopicContent in each courseTopic by courseTopicContentSequence ASC
    courseDetails?.courseTopic?.forEach(topic => {
        if (Array.isArray(topic.courseTopicContent)) {
            topic.courseTopicContent.sort((a, b) => a.courseTopicContentSequence - b.courseTopicContentSequence);
        }
    });

    courseDetails?.courseTopic?.map(a=> {
         let sumDuration = a?.courseTopicContent?.reduce((sum, b) => sum + parseInt(b.courseTopicContentDuration), 0);
         console.log(sumDuration);
        a['courseTopicDuration'] = sumDuration
    })

    console.log("Course Detail", courseDetails);
    return courseDetails;
};



const enrollUserCourse = async (userId, courseId, webinarId) => {
    const enrollUserCourseData = await enrollStatus(userId, courseId, webinarId);
    let enrollmentObj;
    if (enrollUserCourseData && !enrollUserCourseData.isUserEnrolled) {
        enrollmentObj = await db.UserEnrollment.create({
            userId: userId,
            ...(courseId && {courseId: courseId}),
            ...(webinarId && {webinarId: webinarId}),
            enrollmentStatus: "ENROLLED"
        })
    }
    return enrollmentObj ? {message: 'Enrollment is successfully'} : {message: 'Enrollment failed'};

};

const enrollStatus = async (userId, courseId, webinarId=null) => {
    let enrollUserCourseData
    if(courseId){
         enrollUserCourseData = await db.UserEnrollment.findAll({
            where: {
                courseId: courseId, userId: userId
            }
        });
    } else  if(webinarId){
        enrollUserCourseData = await db.UserEnrollment.findAll({
            where: {
                webinarId: webinarId, userId: userId
            }
        });
    }


    if (enrollUserCourseData && enrollUserCourseData.length > 0) {
        return {isUserEnrolled: true, enrollmentData:enrollUserCourseData}
    } else {
        return {isUserEnrolled: false}
    }
};

const disrollUserCourse = async (userId, courseId, webinarId) => {
    const enrollUserCourseData = await enrollStatus(userId, courseId, webinarId);
    let disrollmentObj;
    if (enrollUserCourseData && enrollUserCourseData.isUserEnrolled) {
        await db.UserEnrollmentLog.destroy({where: { userId,
            ...(courseId && {courseId: courseId}), ...(webinarId && {webinarId: webinarId}),}})
        disrollmentObj = await db.UserEnrollment.destroy({where: { ...(courseId && {courseId: courseId}), ...(webinarId && {webinarId: webinarId}), userId: userId}});
       if(courseId){
           await db.Notes.destroy({where: {courseId: courseId, userId: userId}});
       }

    }


    return disrollmentObj ? {message: 'Disrollment is successfully'} : {message: 'Disrollment failed'};
};


const saveUserEnrollmentData = async (
    userId ,
    userEnrollmentId ,
    courseId ,
    courseTopicContentId,
    courseTopicId ,
    enrollmentStatus ,

) => {
    const enrollUserCourseData = await enrollStatus(userId, courseId);
    let enrollmentObj;
    if (enrollUserCourseData && enrollUserCourseData.isUserEnrolled) {
        const [enrollmentObj, created] = await db.UserEnrollmentLog.findOrCreate({
            where: {
                userEnrollmentId,
                courseId,
                courseTopicContentId,
                courseTopicId,
            },
            defaults: {
                userId,
                enrollmentStatus,
            }
        });

        const isCourseComplted = await validateCourseCompletion(userId, userEnrollmentId);
        console.log("Is course Completed : ", isCourseComplted == true ? "TRUE": "FALSE");
        const obj = await db.UserEnrollment.findByPk(userEnrollmentId);
        obj.enrollmentStatus = isCourseComplted.possibleStatus
        await obj.save();
    }else{
        throw new Error("User not enrolled")
    }
    return enrollmentObj ? {message: 'Enrollment is updated'} : {message: 'Enrollment is updated'};

};

const deleteUserEnrollmentData = async (
    userId ,
    userEnrollmentId ,
    courseId ,
    courseTopicContentId,
    courseTopicId
) => {
    const enrollUserCourseData = await enrollStatus(userId, courseId);
    let enrollmentObj;
    if (enrollUserCourseData && enrollUserCourseData.isUserEnrolled) {
        const  enrollmentObj = await db.UserEnrollmentLog.destroy({
            where: {
                userEnrollmentId ,
                userId,
                courseId ,
                courseTopicContentId,
                courseTopicId ,
            },
        });
        const isCourseComplted = await validateCourseCompletion(userId, userEnrollmentId);
        console.log("Is course Completed : ", isCourseComplted == true ? "TRUE": "FALSE");
        const obj = await db.UserEnrollment.findByPk(userEnrollmentId);
        obj.enrollmentStatus = isCourseComplted.possibleStatus
        await obj.save();
    }else{
        throw new Error("User not enrolled")
    }
    return enrollmentObj ? {message: 'Enrollment is updated'} : {message: 'Enrollment is updated'};

};

const validateCourseCompletion = async (userId ,
                                  userEnrollmentId) => {
    const userEnrollment =await db.UserEnrollment.findByPk(userEnrollmentId);
    const userEnrollmentLog = await db.UserEnrollmentLog.findAll({
        where: {
            userEnrollmentId ,
            enrollmentStatus: 'COMPLETED'
        },
        attributes:["courseTopicContentId"],
    });

    const courseTopicContent = await db.CourseTopicContent.findAll({
        where :{
            courseId: userEnrollment.courseId
        },
        attributes:["courseTopicContentId"],
    })

    console.log(userEnrollmentLog?.map(a => a.courseTopicContentId), courseTopicContent?.map(a => a.courseTopicContentId))
    let isCourseCompleted = haveSameElements(userEnrollmentLog?.map(a => a.courseTopicContentId), courseTopicContent?.map(a => a.courseTopicContentId));
    let possibleStatus;
    if(isCourseCompleted){
        possibleStatus = 'COMPLETED'
    }else if(!isCourseCompleted && userEnrollmentLog?.length > 0 ){
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
    enrollUserCourse,
    disrollUserCourse, enrollStatus,
    getCourseDetail,
    saveUserDetail,
    saveNote,
    deleteNote,
    saveUserEnrollmentData,
    deleteUserEnrollmentData,
    submitQuiz,
    clearQuizResult
};

