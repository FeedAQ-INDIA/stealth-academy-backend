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

 


const saveNote = async (
    userId,
    notesId,
    courseId,
    courseContentId,
    noteContent,
) => {
    try {
        // Input validation
        if (!userId) throw new Error('User ID is required');
        if (!courseId) throw new Error('Course ID is required');
        if (!courseContentId) throw new Error('Course Content ID is required');
        if (!noteContent?.trim()) throw new Error('Notes text cannot be empty');

        if (notesId) {
            const notesData = await db.Notes.findByPk(notesId);
            if (!notesData) throw new Error('Notes not found');

            // Verify ownership
            if (notesData.userId !== userId) {
                throw new Error('Unauthorized to modify these notes');
            }

            notesData.noteContent = noteContent.trim();
            await notesData.save();

            return {
                success: true,
                message: 'Notes updated successfully',
                noteId: notesData.id
            };
        } else {
            const newNote = await db.Notes.create({
                userId,
                courseId,
                courseContentId,
                noteContent: noteContent.trim()
            });

            return {
                success: true,
                message: 'Notes created successfully',
                noteId: newNote.id
            };
        }
    } catch (error) {
        logger.error('Error in saveNote:', error);
        throw new Error(`Failed to save notes: ${error.message}`);
    }
};


const deleteNote = async (userId, notesId) => {
    try {
        // Input validation
        if (!userId) throw new Error('User ID is required');
        if (!notesId) throw new Error('Notes ID is required');

        const notesData = await db.Notes.findByPk(notesId);
        if (!notesData) {
            throw new Error('Notes not found');
        }

        // Verify ownership
        if (notesData.userId !== userId) {
            throw new Error('Unauthorized to delete these notes');
        }

        await notesData.destroy();

        return {
            success: true,
            message: 'Notes deleted successfully',
            noteId: notesId
        };
    } catch (error) {
        logger.error('Error in deleteNote:', error);
        throw new Error(`Failed to delete notes: ${error.message}`);
    }
};

const getUser = async (userId) => {
    try {
        // Input validation
        if (!userId) throw new Error('User ID is required');

        const userData = await db.User.findByPk(userId);

        if (!userData) {
            logger.warn(`User not found with ID: ${userId}`);
            throw new Error('User not found');
        }

        // Convert to plain object and remove any sensitive information
        const userJson = userData.toJSON();
        
        return {
            success: true,
            data: userJson
        };
    } catch (error) {
        logger.error('Error in getUser:', error);
        throw new Error(`Failed to fetch user: ${error.message}`);
    }
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
    userId,
    logId,
    userCourseEnrollmentId,
    courseId,
    courseContentId,
    logStatus,
    activityDuration = 0,
    progressPercent = 0,
    metadata = {}
) => {
    try {
        // First ensure the user is enrolled in the course
        const [courseEnrollment, wasCreated] = await db.UserCourseEnrollment.findAll({
            where: {
                userId,
                courseId
            }, 
        });

        // Track the content progress
        const [progressObj, progressCreated] = await db.UserCourseContentProgress.findOrCreate({
            where: {
                userId,
                courseId,
                courseContentId
            },
            defaults: {
                progressStatus: logStatus || 'IN_PROGRESS',
                activityDuration,
                progressPercent,
                metadata
            }
        });

        if (!progressCreated) {
            // Update existing progress
            progressObj.progressStatus = logStatus || progressObj.progressStatus;
            progressObj.activityDuration += activityDuration;
            progressObj.progressPercent = Math.min(100, progressObj.progressPercent + progressPercent);
            progressObj.metadata = { ...progressObj.metadata, ...metadata };
            await progressObj.save();
        }

        // Check overall course completion status
        const courseCompletionStatus = await validateCourseCompletion(userId, courseId);

        // If course is completed, add CourseCertificate entry in CourseContent
        if (courseCompletionStatus.isCourseCompleted) {
            // Check if a CourseCertificate already exists for this course
            const existingCertificate = await db.CourseContent.findOne({
                where: {
                    courseId,
                    courseContentType: 'CourseCertificate'
                }
            });
            if (!existingCertificate) {
                await db.CourseContent.create({
                    courseId,
                    courseContentType: 'CourseCertificate',
                    courseContentTitle: 'Course Certificate',
                    courseSourceMode: 'COMPANY',
                    courseContentSequence: 9999, // or some logic to place it at the end
                    courseContentDuration: 0, // Certificates have no duration
                    isActive: true,
                    coursecontentIsLicensed: false,
                    metadata: {}
                });
            }
        }

        // Update course enrollment status
        await courseEnrollment.update({
            enrollmentStatus: courseCompletionStatus.possibleStatus
        });

        return {
            success: true,
            message: progressCreated ? 'Course progress created successfully' : 'Course progress updated successfully',
            data: {
                progressId: progressObj.progressId,
                courseStatus: courseCompletionStatus.possibleStatus,
                isCompleted: courseCompletionStatus.isCourseCompleted,
                progressPercent: progressObj.progressPercent,
                activityDuration: progressObj.activityDuration
            }
        };

    } catch (error) {
        logger.error('Error in saveUserCourseContentProgress:', error);
        throw new Error('Failed to save course content progress: ' + error.message);
    }
};

const deleteUserCourseContentProgress = async (
    userId,
    progressId,
    courseId,
    courseContentId,
) => {
    try {
        const deleteResult = await db.UserCourseContentProgress.destroy({
            where: {
                ...(progressId && { progressId }),
                userId,
                courseId,
                ...(courseContentId && { courseContentId }),
            },
        });

        if (!deleteResult) {
            return {
                success: false,
                message: 'No progress records found to delete'
            };
        }

        const courseCompletionStatus = await validateCourseCompletion(userId, courseId);
        
        // Update course enrollment status
        await db.UserCourseEnrollment.update(
            { enrollmentStatus: courseCompletionStatus.possibleStatus },
            { 
                where: {
                    userId,
                    courseId
                }
            }
        );

        return {
            success: true,
            message: 'Course progress deleted successfully',
            data: {
                courseStatus: courseCompletionStatus.possibleStatus,
                isCompleted: courseCompletionStatus.isCourseCompleted
            }
        };

    } catch (error) {
        logger.error('Error in deleteUserCourseContentProgress:', error);
        throw new Error('Failed to delete course content progress: ' + error.message);
    }
};

const validateCourseCompletion = async (userId, courseId) => {
    try {
        // Get all required course content
        const courseContent = await db.CourseContent.findAll({
            where: { courseId },
            attributes: ["courseContentId"]
        });

        // Get user's completed content
        const userProgress = await db.UserCourseContentProgress.findAll({
            where: {
                courseId,
                userId,
                progressStatus: 'COMPLETED'
            },
            attributes: [
                "courseContentId",
                [db.sequelize.fn('AVG', db.sequelize.col('user_course_content_progress_percent')), 'avgProgress']
            ],
            group: ['courseContentId']
        });

        // Calculate overall course progress
        const totalContent = courseContent.length;
        const completedContent = userProgress.length;
        const overallProgress = totalContent > 0 ? (completedContent / totalContent) * 100 : 0;
        
        // Check if all required content is completed
        const completedContentIds = new Set(userProgress.map(p => p.courseContentId));
        const requiredContentIds = new Set(courseContent.map(c => c.courseContentId));
        const isCourseCompleted = [...requiredContentIds].every(id => completedContentIds.has(id));

        // Determine course status
        let possibleStatus;
        if (isCourseCompleted) {
            possibleStatus = 'COMPLETED';
        } else if (completedContent > 0) {
            possibleStatus = 'IN_PROGRESS';
        } else {
            possibleStatus = 'ENROLLED';
        }

        return {
            isCourseCompleted,
            possibleStatus,
            totalContent,
            completedContent,
            overallProgress: Math.round(overallProgress * 100) / 100
        };

    } catch (error) {
        logger.error('Error in validateCourseCompletion:', error);
        throw new Error('Failed to validate course completion: ' + error.message);
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
 
 };

