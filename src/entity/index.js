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
db.Comment = require("./Notes.entity.js")(sequelize, Sequelize);


db.Comment.belongsTo(db.User, {foreignKey: 'commentedBy', as: 'commentedbyprofile'})




module.exports = db;
