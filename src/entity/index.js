const dbConfig = require("../config/db.config.js");
const Sequelize = require("sequelize");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST, 
    dialect: dbConfig.dialect, 
    operatorsAliases: false, // logging: false,
    port: dbConfig.port,
    dialectOptions: dbConfig.dialectOptions,
    pool: {
        max: dbConfig.pool.max, min: dbConfig.pool.min, acquire: dbConfig.pool.acquire, idle: dbConfig.pool.idle,
    }, 
    define: {
        freezeTableName: true, // Applies to all models
        timestamps: true,
    },
});

const db = {};


db.Sequelize = Sequelize;
db.sequelize = sequelize;


// Entities
db.User = require("./User.entity.js")(sequelize, Sequelize);
db.Course = require("./Course.entity.js")(sequelize, Sequelize);
db.CourseTopic = require("./CourseTopic.entity.js")(sequelize, Sequelize);
db.CourseTopicContent = require("./CourseTopicContent.entity.js")(sequelize, Sequelize);
db.CourseVideo = require("./CourseVideo.entity.js")(sequelize, Sequelize);
db.CourseWritten = require("./CourseWritten.entity.js")(sequelize, Sequelize);
db.CourseInterview = require("./CourseInterview.entity.js")(sequelize, Sequelize);
db.UserEnrollment = require("./UserEnrollment.entity.js")(sequelize, Sequelize);
db.Notes = require("./Notes.entity.js")(sequelize, Sequelize);
db.Counselling = require("./Counselling.entity.js")(sequelize, Sequelize);
db.ComprehensionReading = require("./ComprehensionReading.entity.js")(sequelize, Sequelize);
db.ListenAndRead = require("./ListenAndRead.entity.js")(sequelize, Sequelize);
db.CourseQuiz = require("./CourseQuiz.entity.js")(sequelize, Sequelize);
db.QuizQuestion = require("./QuizQuestion.entity.js")(sequelize, Sequelize);
db.InterviewReq = require("./InterviewReq.entity.js")(sequelize, Sequelize);
db.UserEnrollmentLog = require("./UserEnrollmentLog.entity.js")(sequelize, Sequelize);
db.QuizResultLog = require("./QuizResultLog.entity.js")(sequelize, Sequelize);
db.CourseSchedule = require("./CourseSchedule.entity.js")(sequelize, Sequelize);
db.Webinar = require("./Webinar.entity.js")(sequelize, Sequelize);


db.CourseSchedule.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'})

db.QuizResultLog.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'})
db.QuizResultLog.belongsTo(db.CourseQuiz, {foreignKey: 'courseQuizId', as: 'coursequiz'})
db.QuizResultLog.belongsTo(db.User, {foreignKey: 'userId', as: 'user'})


db.UserEnrollmentLog.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'})
db.UserEnrollmentLog.belongsTo(db.CourseTopic, {foreignKey: 'courseTopicId', as: 'coursetopic'})
db.UserEnrollmentLog.belongsTo(db.User, {foreignKey: 'userId', as: 'user'})
db.UserEnrollmentLog.belongsTo(db.CourseTopicContent, {foreignKey: 'courseTopicContentId', as: 'courseTopicContent'})



db.Course.hasMany(db.CourseTopic, {foreignKey: 'courseId', as: 'courseTopic'})
db.Course.hasMany(db.CourseTopicContent, {foreignKey: 'courseTopicContentId', as: 'courseTopicContent'})

db.CourseTopicContent.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'})
db.CourseTopicContent.belongsTo(db.CourseTopic, {foreignKey: 'courseTopicId', as: 'coursetopic'})


db.CourseTopic.belongsTo(db.Course, {foreignKey: 'courseTopicId', as: 'course'})
db.CourseTopic.hasMany(db.CourseVideo, {foreignKey: 'courseTopicId', as: 'courseVideo'})
db.CourseTopic.hasMany(db.CourseWritten, {foreignKey: 'courseTopicId', as: 'courseWritten'})
db.CourseTopic.hasMany(db.CourseInterview, {foreignKey: 'courseTopicId', as: 'courseInterview'})
db.CourseTopic.hasMany(db.CourseTopicContent, {foreignKey: 'courseTopicId', as: 'courseTopicContent'})

db.CourseVideo.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'})
db.CourseVideo.belongsTo(db.CourseTopic, {foreignKey: 'courseTopicId', as: 'coursetopic'})

db.ComprehensionReading.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'})
db.ComprehensionReading.belongsTo(db.CourseTopic, {foreignKey: 'courseTopicId', as: 'coursetopic'})

db.ListenAndRead.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'})
db.ListenAndRead.belongsTo(db.CourseTopic, {foreignKey: 'courseTopicId', as: 'coursetopic'})

db.CourseQuiz.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'})
db.CourseQuiz.belongsTo(db.CourseTopic, {foreignKey: 'courseTopicId', as: 'coursetopic'})
db.CourseQuiz.hasMany(db.QuizQuestion, {foreignKey: 'courseQuizId', as: 'quizquestion'})

db.QuizQuestion.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'})
db.QuizQuestion.belongsTo(db.CourseTopic, {foreignKey: 'courseTopicId', as: 'coursetopic'})
db.QuizQuestion.belongsTo(db.CourseQuiz, {foreignKey: 'courseQuizId', as: 'coursequiz'})


db.CourseWritten.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'})
db.CourseWritten.belongsTo(db.CourseTopic, {foreignKey: 'courseTopicId', as: 'coursetopic'})

db.CourseInterview.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'})
db.CourseInterview.belongsTo(db.CourseTopic, {foreignKey: 'courseTopicId', as: 'coursetopic'})

db.InterviewReq.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'})
db.InterviewReq.belongsTo(db.CourseTopic, {foreignKey: 'courseTopicId', as: 'coursetopic'})
db.InterviewReq.belongsTo(db.User, {foreignKey: 'userId', as: 'user'})


db.UserEnrollment.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'})
db.UserEnrollment.belongsTo(db.User, {foreignKey: 'userId', as: 'user'})
db.UserEnrollment.belongsTo(db.Webinar, {foreignKey: 'webinarId', as: 'webinar'})
db.UserEnrollment.hasMany(db.CourseSchedule, {foreignKey: 'courseId', as: 'courseschedule'})

db.User.belongsToMany(db.Course, {
    through: db.UserEnrollment, foreignKey: 'userId', otherKey: 'courseId', as: 'courses',
});
db.User.belongsToMany(db.Webinar, {
    through: db.UserEnrollment, foreignKey: 'userId', otherKey: 'webinarId', as: 'webinars',
});

db.Notes.belongsTo(db.User, {foreignKey: 'userId', as: 'user'})
db.Notes.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'})
db.Notes.belongsTo(db.CourseTopic, {foreignKey: 'courseTopicId', as: 'coursetopic'})

db.Counselling.belongsTo(db.User, {foreignKey: 'userId', as: 'user'})



module.exports = db;
