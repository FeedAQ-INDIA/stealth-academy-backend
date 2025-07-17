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
db.CourseContent = require("./CourseContent.entity.js")(sequelize, Sequelize);
db.CourseVideo = require("./CourseVideo.entity.js")(sequelize, Sequelize);
db.CourseWritten = require("./CourseWritten.entity.js")(sequelize, Sequelize);
db.Notes = require("./Notes.entity.js")(sequelize, Sequelize);
db.UserActivityLog = require("./UserActivityLog.entity.js")(sequelize, Sequelize);
db.QuizResultLog = require("./QuizResultLog.entity.js")(sequelize, Sequelize);
db.CourseQuiz = require("./CourseQuiz.entity.js")(sequelize, Sequelize);
db.QuizQuestion = require("./QuizQuestion.entity.js")(sequelize, Sequelize);



db.QuizResultLog.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'})
db.QuizResultLog.belongsTo(db.CourseQuiz, {foreignKey: 'courseQuizId', as: 'courseQuiz'})
db.QuizResultLog.belongsTo(db.User, {foreignKey: 'userId', as: 'user'})

db.UserActivityLog.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'})
db.UserActivityLog.belongsTo(db.User, {foreignKey: 'userId', as: 'user'})
db.UserActivityLog.belongsTo(db.CourseContent, {foreignKey: 'courseContentId', as: 'courseContent'})

db.Course.hasMany(db.CourseContent, {foreignKey: 'courseContentId', as: 'courseContent'})

db.CourseContent.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'})
db.CourseContent.belongsTo(db.User, {foreignKey: 'userId', as: 'user'})

db.CourseVideo.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'})
db.CourseVideo.belongsTo(db.CourseContent, {foreignKey: 'courseContentId', as: 'courseContent'})

db.CourseQuiz.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'})
db.CourseQuiz.belongsTo(db.CourseContent, {foreignKey: 'courseContentId', as: 'courseContent'})
db.CourseQuiz.hasMany(db.QuizQuestion, {foreignKey: 'courseQuizId', as: 'quizquestion'})

db.QuizQuestion.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'})
db.QuizQuestion.belongsTo(db.CourseContent, {foreignKey: 'courseContentId', as: 'courseContent'})
db.QuizQuestion.belongsTo(db.CourseQuiz, {foreignKey: 'courseQuizId', as: 'coursequiz'})

db.CourseWritten.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'})
db.CourseWritten.belongsTo(db.CourseContent, {foreignKey: 'courseContentId', as: 'courseContent'})

db.Notes.belongsTo(db.User, {foreignKey: 'userId', as: 'user'})
db.Notes.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'})
db.Notes.belongsTo(db.CourseContent, {foreignKey: 'courseContentId', as: 'courseContent'})



module.exports = db;
