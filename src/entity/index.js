const dbConfig = require("../config/db.config.js");
   const Sequelize = require("sequelize");

   const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
       host: dbConfig.HOST, 
       dialect: dbConfig.dialect, 
       operatorsAliases: false,
       port: dbConfig.port,
       dialectOptions: dbConfig.dialectOptions,
       pool: {
           max: dbConfig.pool.max, min: dbConfig.pool.min, acquire: dbConfig.pool.acquire, idle: dbConfig.pool.idle,
       }, 
       define: {
           freezeTableName: true,
           timestamps: true,
       },
   });

   const db = {};

   db.Sequelize = Sequelize;
   db.sequelize = sequelize;

   // Entities
   db.User = require("./User.entity.js")(sequelize, Sequelize);
   
   db.ListeningClip = require("./ListeningClip.entity.js")(sequelize, Sequelize);
   db.ListeningQuestion = require("./ListeningQuestion.entity.js")(sequelize, Sequelize);
   db.ListeningSubmission = require("./ListeningSubmission.entity.js")(sequelize, Sequelize);
   db.ReadingTopic = require("./ReadingTopic.entity.js")(sequelize, Sequelize);
   db.ReadingSubmission = require("./ReadingSubmission.entity.js")(sequelize, Sequelize);
   db.SpeakingTopic = require("./SpeakingTopic.entity.js")(sequelize, Sequelize);
   db.SpeakingSubmission = require("./SpeakingSubmission.entity.js")(sequelize, Sequelize);
   db.WritingPrompt = require("./WritingPrompt.entity.js")(sequelize, Sequelize);
   db.WritingSubmission = require("./WritingSubmission.entity.js")(sequelize, Sequelize);
   db.UserFile = require("./UserFile.entity.js")(sequelize, Sequelize);

   // Associations
   db.ListeningQuestion.belongsTo(db.ListeningClip, { foreignKey: 'clipId', as: 'listeningClip' });
   db.ListeningSubmission.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });
   db.ListeningSubmission.belongsTo(db.ListeningClip, { foreignKey: 'clipId', as: 'clip' });
   db.ReadingSubmission.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });
   db.ReadingSubmission.belongsTo(db.ReadingTopic, { foreignKey: 'topicId', as: 'readingTopic' });
   db.WritingSubmission.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });
   db.WritingSubmission.belongsTo(db.WritingPrompt, { foreignKey: 'promptId', as: 'writingPrompt' });
   db.SpeakingSubmission.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });
   db.SpeakingSubmission.belongsTo(db.SpeakingTopic, { foreignKey: 'topicId', as: 'speakingTopic' });
   db.UserFile.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });
   db.topicselect = require("./TopicSelect.entity.js")(sequelize, Sequelize);

   module.exports = db;