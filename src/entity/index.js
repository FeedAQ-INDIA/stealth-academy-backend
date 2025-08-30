const dbConfig = require("../config/db.config.js");
const Sequelize = require("sequelize");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST, 
    dialect: dbConfig.dialect, 
    // operatorsAliases: false, // Removed - deprecated in v5+
    logging: false,
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
db.CourseAccess = require("./CourseAccess.entity.js")(sequelize, Sequelize);
db.UserCourseEnrollment = require("./UserCourseEnrollment.entity.js")(sequelize, Sequelize);
db.Course = require("./Course.entity.js")(sequelize, Sequelize);
db.CourseContent = require("./CourseContent.entity.js")(sequelize, Sequelize);
db.UserCourseContentProgress = require("./UserCourseContentProgress.entity.js")(sequelize, Sequelize);
db.CourseVideo = require("./CourseVideo.entity.js")(sequelize, Sequelize);
db.CourseWritten = require("./CourseWritten.entity.js")(sequelize, Sequelize);
db.Notes = require("./Notes.entity.js")(sequelize, Sequelize);
db.QuizResultLog = require("./QuizResultLog.entity.js")(sequelize, Sequelize);
db.CourseQuiz = require("./CourseQuiz.entity.js")(sequelize, Sequelize);
db.QuizQuestion = require("./QuizQuestion.entity.js")(sequelize, Sequelize);
db.CourseFlashcard = require("./CourseFlashcard.entity.js")(sequelize, Sequelize);
db.Flashcard = require("./Flashcard.entity.js")(sequelize, Sequelize);
db.Organization = require("./Organization.entity.js")(sequelize, Sequelize);
db.OrganizationUser = require("./OrganizationUser.entity.js")(sequelize, Sequelize);
db.UserCreditTransaction = require("./UserCreditTransaction.entity.js")(sequelize, Sequelize);
db.UserLearningSchedule = require("./UserLearningSchedule.entity.js")(sequelize, Sequelize);



// Associations

// User associations
db.User.hasMany(db.Course, {foreignKey: 'userId', as: 'courses'});
db.User.hasMany(db.UserCourseEnrollment, {foreignKey: 'userId', as: 'enrollments'});
db.User.hasMany(db.Notes, {foreignKey: 'userId', as: 'notes'});
db.User.hasMany(db.UserCourseContentProgress, {foreignKey: 'userId', as: 'activityLogs'});
db.User.hasMany(db.QuizResultLog, {foreignKey: 'userId', as: 'quizResults'});
db.User.hasMany(db.OrganizationUser, {foreignKey: 'userId', as: 'organizationMemberships'});
db.User.hasMany(db.UserCreditTransaction, {foreignKey: 'userId', as: 'creditTransactions'});
db.User.hasMany(db.CourseFlashcard, {foreignKey: 'userId', as: 'flashcardSets'});

// Course associations
db.Course.belongsTo(db.User, {foreignKey: 'userId', as: 'instructor'});
db.Course.belongsTo(db.Organization, {foreignKey: 'orgId', as: 'organization'});
db.Course.hasMany(db.CourseContent, {foreignKey: 'courseId', as: 'courseContent'});
db.Course.hasMany(db.UserCourseEnrollment, {foreignKey: 'courseId', as: 'enrollments'});
db.Course.hasMany(db.CourseAccess, {foreignKey: 'courseId', as: 'accessControls'});
db.Course.hasMany(db.Notes, {foreignKey: 'courseId', as: 'notes'});
db.Course.hasMany(db.UserCourseContentProgress, {foreignKey: 'courseId', as: 'activityLogs'});
db.Course.hasMany(db.QuizResultLog, {foreignKey: 'courseId', as: 'quizResults'});
db.Course.hasMany(db.CourseFlashcard, {foreignKey: 'courseId', as: 'flashcardSets'});

// Organization associations
db.Organization.hasMany(db.Course, {foreignKey: 'orgId', as: 'courses'});
db.Organization.hasMany(db.OrganizationUser, {foreignKey: 'orgId', as: 'members'});

// OrganizationUser associations
db.OrganizationUser.belongsTo(db.Organization, {foreignKey: 'orgId', as: 'organization'});
db.OrganizationUser.belongsTo(db.User, {foreignKey: 'userId', as: 'user'});
db.OrganizationUser.belongsTo(db.User, {foreignKey: 'invitedBy', as: 'inviter'});

// CourseContent associations
db.CourseContent.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'});
db.CourseContent.hasMany(db.CourseVideo, {foreignKey: 'courseContentId', as: 'videos'});
db.CourseContent.hasMany(db.CourseWritten, {foreignKey: 'courseContentId', as: 'writtenContent'});
db.CourseContent.hasMany(db.CourseQuiz, {foreignKey: 'courseContentId', as: 'quizzes'});
db.CourseContent.hasMany(db.Notes, {foreignKey: 'courseContentId', as: 'notes'});
db.CourseContent.hasMany(db.UserCourseContentProgress, {foreignKey: 'courseContentId', as: 'activityLogs'});
db.CourseContent.hasMany(db.CourseFlashcard, {foreignKey: 'courseContentId', as: 'flashcardSets'});

// CourseVideo associations
db.CourseVideo.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'});
db.CourseVideo.belongsTo(db.CourseContent, {foreignKey: 'courseContentId', as: 'courseContent'});

// CourseWritten associations
db.CourseWritten.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'});
db.CourseWritten.belongsTo(db.CourseContent, {foreignKey: 'courseContentId', as: 'courseContent'});

// CourseQuiz associations
db.CourseQuiz.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'});
db.CourseQuiz.belongsTo(db.CourseContent, {foreignKey: 'courseContentId', as: 'courseContent'});
db.CourseQuiz.hasMany(db.QuizQuestion, {foreignKey: 'courseQuizId', as: 'questions'});
db.CourseQuiz.hasMany(db.QuizResultLog, {foreignKey: 'courseQuizId', as: 'results'});

// QuizQuestion associations
db.QuizQuestion.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'});
db.QuizQuestion.belongsTo(db.CourseContent, {foreignKey: 'courseContentId', as: 'courseContent'});
db.QuizQuestion.belongsTo(db.CourseQuiz, {foreignKey: 'courseQuizId', as: 'courseQuiz'});

// UserCourseEnrollment associations
db.UserCourseEnrollment.belongsTo(db.User, {foreignKey: 'userId', as: 'user'});
db.UserCourseEnrollment.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'});

// UserCourseContentProgress associations
db.UserCourseContentProgress.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'});
db.UserCourseContentProgress.belongsTo(db.User, {foreignKey: 'userId', as: 'user'});
db.UserCourseContentProgress.belongsTo(db.CourseContent, {foreignKey: 'courseContentId', as: 'courseContent'});

// QuizResultLog associations
db.QuizResultLog.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'});
db.QuizResultLog.belongsTo(db.CourseQuiz, {foreignKey: 'courseQuizId', as: 'courseQuiz'});
db.QuizResultLog.belongsTo(db.User, {foreignKey: 'userId', as: 'user'});

// Notes associations
db.Notes.belongsTo(db.User, {foreignKey: 'userId', as: 'user'});
db.Notes.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'});
db.Notes.belongsTo(db.CourseContent, {foreignKey: 'courseContentId', as: 'courseContent'});

// CourseAccess associations
db.CourseAccess.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'});
db.CourseAccess.belongsTo(db.User, {foreignKey: 'userId', as: 'user'});
db.CourseAccess.belongsTo(db.Organization, {foreignKey: 'organizationId', as: 'organization'});
db.CourseAccess.belongsTo(db.User, {foreignKey: 'grantedBy', as: 'grantor'});

// UserCreditTransaction associations
db.UserCreditTransaction.belongsTo(db.User, {foreignKey: 'userId', as: 'user'});
db.UserCreditTransaction.belongsTo(db.User, {foreignKey: 'processedBy', as: 'processor'});

// CourseFlashcard associations
db.CourseFlashcard.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'});
db.CourseFlashcard.belongsTo(db.CourseContent, {foreignKey: 'courseContentId', as: 'courseContent'});
db.CourseFlashcard.belongsTo(db.User, {foreignKey: 'userId', as: 'user'});
db.CourseFlashcard.hasMany(db.Flashcard, {foreignKey: 'courseFlashcardId', as: 'flashcards'});

// Flashcard associations
db.Flashcard.belongsTo(db.CourseFlashcard, {foreignKey: 'courseFlashcardId', as: 'courseFlashcard'});

// UserLearningSchedule associations
db.UserLearningSchedule.belongsTo(db.User, {foreignKey: 'userId', as: 'user'});

module.exports = db;
