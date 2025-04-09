const dbConfig = require("../config/db.config.js");
const Sequelize = require("sequelize");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST, dialect: dbConfig.dialect, operatorsAliases: false, // logging: false,
    pool: {
        max: dbConfig.pool.max, min: dbConfig.pool.min, acquire: dbConfig.pool.acquire, idle: dbConfig.pool.idle,
    }, define: {
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
db.CourseVideo = require("./CourseVideo.entity.js")(sequelize, Sequelize);
db.CourseWritten = require("./CourseWritten.entity.js")(sequelize, Sequelize);
db.CourseInterview = require("./CourseInterview.entity.js")(sequelize, Sequelize);
db.UserEnrollment = require("./UserEnrollment.entity.js")(sequelize, Sequelize);
db.Notes = require("./Notes.entity.js")(sequelize, Sequelize);
db.Counselling = require("./Counselling.entity.js")(sequelize, Sequelize);

db.Course.hasMany(db.CourseTopic, {foreignKey: 'courseId', as: 'courseTopic'})


db.CourseTopic.belongsTo(db.Course, {foreignKey: 'courseTopicId', as: 'course'})
db.CourseTopic.hasMany(db.CourseVideo, {foreignKey: 'courseTopicId', as: 'courseVideo'})
db.CourseTopic.hasMany(db.CourseWritten, {foreignKey: 'courseTopicId', as: 'courseWritten'})
db.CourseTopic.hasMany(db.CourseInterview, {foreignKey: 'courseTopicId', as: 'courseInterview'})

db.CourseVideo.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'})
db.CourseVideo.belongsTo(db.CourseTopic, {foreignKey: 'courseTopicId', as: 'coursetopic'})

db.CourseWritten.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'})
db.CourseWritten.belongsTo(db.CourseTopic, {foreignKey: 'courseTopicId', as: 'coursetopic'})

db.CourseInterview.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'})
db.CourseInterview.belongsTo(db.CourseTopic, {foreignKey: 'courseTopicId', as: 'coursetopic'})
db.CourseInterview.belongsTo(db.User, {foreignKey: 'userId', as: 'user'})

db.UserEnrollment.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'})
db.UserEnrollment.belongsTo(db.User, {foreignKey: 'userId', as: 'user'})

db.User.belongsToMany(db.Course, {
    through: db.UserEnrollment, foreignKey: 'userId', otherKey: 'courseId', as: 'courses',
});

db.Notes.belongsTo(db.User, {foreignKey: 'userId', as: 'user'})
db.Notes.belongsTo(db.Course, {foreignKey: 'courseId', as: 'course'})
db.Notes.belongsTo(db.CourseTopic, {foreignKey: 'courseTopicId', as: 'coursetopic'})

db.Counselling.belongsTo(db.User, {foreignKey: 'userId', as: 'user'})


// db.Comment.belongsTo(db.User, {foreignKey: 'commentedBy', as: 'commentedbyprofile'})
// db.CourseTopic.belongsTo(db.User, {foreignKey: 'commentedBy', as: 'commentedbyprofile'})
// db.CourseInterview.belongsTo(db.User, {foreignKey: 'commentedBy', as: 'commentedbyprofile'})
// db.CourseWritten.belongsTo(db.User, {foreignKey: 'commentedBy', as: 'commentedbyprofile'})




module.exports = db;
