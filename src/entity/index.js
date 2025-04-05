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
db.Workspace = require("./Workspace.entity.js")(sequelize, Sequelize);
db.Session = require("./Session.entity.js")(sequelize, Sequelize);
db.Record = require("./Record.entity.js")(sequelize, Sequelize);
db.RecordData = require("./RecordData.entity.js")(sequelize, Sequelize);
db.RecordContext = require("./RecordContext.entity.js")(sequelize, Sequelize);
db.ProductContext = require("./ProductContext.entity.js")(sequelize, Sequelize);
db.UserContext = require("./UserContext.entity.js")(sequelize, Sequelize);
db.Stakeholder = require("./Stakeholder.entity.js")(sequelize, Sequelize);
db.StakeholderWorkspace = require("./StakeholderWorkspace.entity.js")(sequelize, Sequelize);
db.StakeholderExternalIdentifier = require("./StakeholderExternalIdentifier.entity.js")(sequelize, Sequelize);
db.StakeholderMetadata = require("./StakeholderMetadata.entity.js")(sequelize, Sequelize);
db.StakeholderContext = require("./StakeholderContext.entity.js")(sequelize, Sequelize);
db.WorkspaceMetadata = require("./WorkspaceMetadata.entity.js")(sequelize, Sequelize);
db.Org = require("./Org.entity.js")(sequelize, Sequelize);
db.OrgUser = require("./OrgUser.entity.js")(sequelize, Sequelize);
db.WorkspaceUser = require("./WorkspaceUser.entity.js")(sequelize, Sequelize);
db.WorkspaceField = require("./WorkspaceField.entity.js")(sequelize, Sequelize);
db.Comment = require("./Comment.entity.js")(sequelize, Sequelize);
db.StakeholderComment = require("./StakeholderComment.entity.js")(sequelize, Sequelize);
db.UserInvite = require("./UserInvite.entity.js")(sequelize, Sequelize);
db.ZomatoIntegration = require("./ZomatoIntegration.entity.js")(sequelize, Sequelize);
db.ContextConfiguration = require("./ContextConfiguration.entity.js")(sequelize, Sequelize);
db.View = require("./View.entity.js")(sequelize, Sequelize);
 db.Tags = require("./Tags.entity.js")(sequelize, Sequelize);
db.Team = require("./Team.entity.js")(sequelize, Sequelize);
db.TeamUser = require("./TeamUser.entity.js")(sequelize, Sequelize);
db.Product = require("./Product.entity.js")(sequelize, Sequelize);
db.RecordTags = require("./RecordTags.entity.js")(sequelize, Sequelize);
db.StakeholderTags = require("./StakeholderTags.entity.js")(sequelize, Sequelize);
db.RecordProduct = require("./RecordProduct.entity.js")(sequelize, Sequelize);
db.StakeholderProduct = require("./StakeholderProduct.entity.js")(sequelize, Sequelize);
db.RecordTeam = require("./RecordTeam.entity.js")(sequelize, Sequelize);
db.StakeholderTeam = require("./StakeholderTeam.entity.js")(sequelize, Sequelize);
db.Statuses = require("./Statuses.entity.js")(sequelize, Sequelize);
db.StatusesTransition = require("./StatusesTransition.entity.js")(sequelize, Sequelize);
db.StatusConfiguration = require("./StatusConfiguration.entity.js")(sequelize, Sequelize);
db.Attachment = require("./Attachment.entity.js")(sequelize, Sequelize);
db.RecordWatcher = require("./RecordWatcher.entity.js")(sequelize, Sequelize);
db.RecordViewer = require("./RecordViewer.entity.js")(sequelize, Sequelize);
db.RecordLink = require("./RecordLink.entity.js")(sequelize, Sequelize);
db.OrgContextConfiguration = require("./OrgContextConfiguration.entity.js")(sequelize, Sequelize);
db.OrgField = require("./OrgField.entity.js")(sequelize, Sequelize);
db.APIChannel = require("./APIChannel.entity.js")(sequelize, Sequelize);
db.APIChannelTransaction = require("./APIChannelTransaction.entity.js")(sequelize, Sequelize);
db.Layout = require("./Layout.entity.js")(sequelize, Sequelize);
db.LayoutContextConfig = require("./LayoutContextConfig.entity.js")(sequelize, Sequelize);
db.StakeholderType = require("./StakeholderType.entity.js")(sequelize, Sequelize);
db.RecordType = require("./RecordType.entity.js")(sequelize, Sequelize);
db.RecordInteraction = require("./RecordInteraction.entity.js")(sequelize, Sequelize);
db.WorkspacePortal = require("./WorkspacePortal.entity.js")(sequelize, Sequelize);
db.PortalGroup = require("./PortalGroup.entity.js")(sequelize, Sequelize);
db.PortalGroupFieldConfig = require("./PortalGroupFieldConfig.entity.js")(sequelize, Sequelize);
db.UserStatus = require("./UserStatus.entity.js")(sequelize, Sequelize);
db.UserStatusGroup = require("./UserStatusGroup.entity.js")(sequelize, Sequelize);
db.UserStatusGroupLink = require("./UserStatusGroupLink.entity.js")(sequelize, Sequelize);

db.UserStatusGroupLink.belongsTo(db.UserStatus, {foreignKey: 'userStatusId', as: 'userstatus'});
db.UserStatusGroupLink.belongsTo(db.UserStatusGroup, {foreignKey: 'userStatusGroupId', as: 'userstatusgroup'})
db.UserStatusGroupLink.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.UserStatusGroupLink.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'})


db.UserStatusGroup.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.UserStatusGroup.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'})
db.UserStatusGroup.belongsTo(db.User, {foreignKey: 'createdBy', as: 'createdby'})
db.UserStatusGroup.belongsToMany(db.UserStatus, {
    through: db.UserStatusGroupLink, foreignKey: 'userStatusGroupId', otherKey: 'userStatusId', as: 'userstatuses',
});



db.UserStatus.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.UserStatus.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'})
db.UserStatus.belongsTo(db.User, {foreignKey: 'createdBy', as: 'createdby'})
db.UserStatus.belongsToMany(db.UserStatusGroup, {
    through: db.UserStatusGroupLink, foreignKey: 'userStatusId', otherKey: 'userStatusGroupId', as: 'userstatusgroups',
});



db.PortalGroupFieldConfig.belongsTo(db.WorkspacePortal, {foreignKey: 'portalId', as: 'portaldetail'});
db.PortalGroupFieldConfig.belongsTo(db.PortalGroup, {foreignKey: 'portalGroupId', as: 'portalgroupdetail'});
db.PortalGroupFieldConfig.belongsTo(db.ContextConfiguration, {foreignKey: 'contextConfigurationId', as: 'configdetail'});
db.PortalGroupFieldConfig.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'});
db.PortalGroupFieldConfig.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});

db.PortalGroup.belongsTo(db.WorkspacePortal, {foreignKey: 'portalId', as: 'portaldetail'});
db.PortalGroup.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'});
db.PortalGroup.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.PortalGroup.belongsToMany(db.ContextConfiguration, {
    through: db.PortalGroupFieldConfig, foreignKey: 'portalGroupId', otherKey: 'contextConfigurationId', as: 'configdetail',
});

db.WorkspacePortal.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'});
db.WorkspacePortal.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.WorkspacePortal.hasMany(db.PortalGroup, {foreignKey: 'portalId', as: 'portalgroupdetail'});

db.RecordInteraction.belongsTo(db.Record, {foreignKey: 'recordId', as: 'records'});
db.RecordInteraction.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'});
db.RecordInteraction.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});


db.LayoutContextConfig.belongsTo(db.ContextConfiguration, {foreignKey: 'contextConfigurationId', as: 'configdetail'});
db.LayoutContextConfig.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'});
db.LayoutContextConfig.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});

db.StakeholderType.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.StakeholderType.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'})
db.StakeholderType.belongsTo(db.User, {foreignKey: 'createdBy', as: 'createdby'})

db.RecordType.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.RecordType.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'})
db.RecordType.belongsTo(db.User, {foreignKey: 'createdBy', as: 'createdby'})

db.Layout.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.Layout.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'})
db.Layout.belongsTo(db.User, {foreignKey: 'createdBy', as: 'createdby'})
db.Layout.hasOne(db.StatusConfiguration, {foreignKey: 'statusConfigurationId', as: 'statusConfigurationDetail'})
db.Layout.belongsToMany(db.ContextConfiguration, {
    through: db.LayoutContextConfig, foreignKey: 'layoutId', otherKey: 'contextConfigurationId', as: 'configdetail',
});


db.APIChannelTransaction.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.APIChannelTransaction.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'})
db.APIChannelTransaction.belongsTo(db.APIChannel, {foreignKey: 'apiChannelId', as: 'apiChannelDetail'})

db.APIChannel.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.APIChannel.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'})
db.APIChannel.belongsTo(db.User, {foreignKey: 'createdBy', as: 'createdby'})
db.APIChannel.belongsTo(db.Layout, {foreignKey: 'layoutId', as: 'layoutdetail'})


db.RecordLink.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.RecordLink.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'})
db.RecordLink.belongsTo(db.User, {foreignKey: 'createdBy', as: 'createdbydetail'})
db.RecordLink.belongsTo(db.Record, {foreignKey: 'recordIdA', as: 'recordADetail'})
db.RecordLink.belongsTo(db.Record, {foreignKey: 'recordIdB', as: 'recordBDetail'})

db.RecordWatcher.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.RecordWatcher.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'})
db.RecordWatcher.belongsTo(db.User, {foreignKey: 'watcherId', as: 'watcherdetail'})
db.RecordWatcher.belongsTo(db.Record, {foreignKey: 'recordId', as: 'recorddetail'})

db.RecordViewer.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.RecordViewer.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'})
db.RecordViewer.belongsTo(db.User, {foreignKey: 'viewerId', as: 'viewerdetail'})
db.RecordViewer.belongsTo(db.Record, {foreignKey: 'recordId', as: 'recorddetail'})


db.Attachment.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.Attachment.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'})
db.Attachment.belongsTo(db.User, {foreignKey: 'createdBy', as: 'createdby'})

db.StatusConfiguration.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.StatusConfiguration.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'})
db.StatusConfiguration.belongsTo(db.User, {foreignKey: 'createdBy', as: 'createdby'})
db.StatusConfiguration.belongsTo(db.Statuses, {foreignKey: 'defaultStatus', as: 'defaultStatusDetail'})
db.StatusConfiguration.belongsTo(db.Statuses, {foreignKey: 'entryStatus', as: 'entryStatusDetail'})
db.StatusConfiguration.hasMany(db.Statuses, {foreignKey: 'statusConfigurationId', as: 'statuslist'})


db.Statuses.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.Statuses.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'})
db.Statuses.belongsTo(db.User, {foreignKey: 'createdBy', as: 'createdby'})
db.Statuses.belongsTo(db.StatusConfiguration, {foreignKey: 'statusConfigurationId', as: 'statusconfiguration'})


db.StatusesTransition.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.StatusesTransition.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'})
db.StatusesTransition.belongsTo(db.User, {foreignKey: 'createdBy', as: 'createdby'})
db.StatusesTransition.belongsTo(db.Statuses, { foreignKey: "fromStatus", as: "from" });
db.StatusesTransition.belongsTo(db.Statuses, { foreignKey: "toStatus", as: "to" });
db.StatusesTransition.belongsTo(db.StatusConfiguration, {foreignKey: 'statusConfigurationId', as: 'statusconfiguration'})
db.StatusesTransition.belongsTo(db.Record, {
    foreignKey: "fromStatus",
    targetKey: "recordStatus",
    as: 'record'
});

db.StakeholderTeam.belongsTo(db.Stakeholder, {foreignKey: 'stakeholderId', as: 'stakeholders'});
db.StakeholderTeam.belongsTo(db.Team, {foreignKey: 'teamId', as: 'teams'})
db.StakeholderTeam.belongsTo(db.User, {foreignKey: 'addedBy', as: 'addedby'})
db.StakeholderTeam.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.StakeholderTeam.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'})

db.RecordTeam.belongsTo(db.Record, {foreignKey: 'recordId', as: 'records'});
db.RecordTeam.belongsTo(db.Team, {foreignKey: 'teamId', as: 'teams'})
db.RecordTeam.belongsTo(db.User, {foreignKey: 'addedBy', as: 'addedby'})
db.RecordTeam.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.RecordTeam.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'})

db.RecordProduct.belongsTo(db.Record, {foreignKey: 'recordId', as: 'records'});
db.RecordProduct.belongsTo(db.Product, {foreignKey: 'productId', as: 'products'})
db.RecordProduct.belongsTo(db.User, {foreignKey: 'addedBy', as: 'addedby'})
db.RecordProduct.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.RecordProduct.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'})

db.StakeholderProduct.belongsTo(db.Stakeholder, {foreignKey: 'stakeholderId', as: 'stakeholders'});
db.StakeholderProduct.belongsTo(db.Product, {foreignKey: 'tagId', as: 'products'})
db.StakeholderProduct.belongsTo(db.User, {foreignKey: 'addedBy', as: 'addedby'})
db.StakeholderProduct.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.StakeholderProduct.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'})


db.RecordTags.belongsTo(db.Record, {foreignKey: 'recordId', as: 'records'});
db.RecordTags.belongsTo(db.Tags, {foreignKey: 'tagId', as: 'tags'})
db.RecordTags.belongsTo(db.User, {foreignKey: 'addedBy', as: 'addedby'})
db.RecordTags.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.RecordTags.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'})

db.StakeholderTags.belongsTo(db.Stakeholder, {foreignKey: 'stakeholderId', as: 'stakeholders'});
db.StakeholderTags.belongsTo(db.Tags, {foreignKey: 'tagId', as: 'tags'})
db.StakeholderTags.belongsTo(db.User, {foreignKey: 'addedBy', as: 'addedby'})
db.StakeholderTags.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.StakeholderTags.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'})

db.Product.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.Product.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'})
db.Product.belongsTo(db.User, {foreignKey: 'createdBy', as: 'createdby'})
db.Product.hasMany(db.ProductContext, {foreignKey: 'productId', as: 'productcontext'});

db.Team.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.Team.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'})
db.Team.belongsToMany(db.User, {
    through: db.TeamUser, foreignKey: 'teamId', otherKey: 'userId', as: 'users',
});

db.TeamUser.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.TeamUser.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'})

db.Tags.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.Tags.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'})
db.Tags.belongsTo(db.User, {foreignKey: 'createdBy', as: 'createdby'})



db.View.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.View.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'})
db.View.belongsTo(db.User, {foreignKey: 'createdBy', as: 'createdby'})

db.ContextConfiguration.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.ContextConfiguration.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'});
db.ContextConfiguration.belongsTo(db.User, {foreignKey: 'createdBy', as: 'createdby'});
db.ContextConfiguration.hasMany(db.WorkspaceField, {foreignKey: 'contextConfigurationId', as: 'workspacefields'});

db.WorkspaceField.belongsTo(db.ContextConfiguration, {foreignKey: 'contextConfigurationId', as: 'contextconfig'})

// Record Data Relations
db.Record.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.Record.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'});
db.Record.belongsTo(db.Session, {foreignKey: 'sessionId', as: 'session'});
db.Record.belongsTo(db.Stakeholder, {foreignKey: 'submittedBy', as: 'submittedByProfile'});
db.Record.belongsTo(db.Stakeholder, {foreignKey: 'reportedBy', as: 'reportedByProfile'});
db.Record.belongsTo(db.Statuses, {foreignKey: 'recordStatus', as: 'currentstatusdetail'});
db.Record.hasMany(db.RecordData, {foreignKey: 'recordId', as: 'recordData'});
db.Record.hasMany(db.RecordContext, {foreignKey: 'recordId', as: 'recordcontext'});
db.Record.belongsTo(db.Layout, {foreignKey: 'layoutId', as: 'layoutdetail'});
db.Record.belongsTo(db.StatusConfiguration, {foreignKey: 'statusConfigurationId', as: 'statusConf'});
db.Record.hasMany(db.Statuses, { foreignKey: "statusConfigurationId",sourceKey: "statusConfigurationId", as: 'statuses'});
db.Record.hasMany(db.StatusesTransition, { foreignKey: "statusConfigurationId",sourceKey: "statusConfigurationId", as: 'allstatusestransition'});
db.Record.hasMany(db.StatusesTransition, { foreignKey: "fromStatus",sourceKey: "recordStatus", as: 'possiblestatusestransition'});
db.Record.hasMany(db.Comment, {foreignKey: 'recordId', as: 'comments'});
db.Record.hasMany(db.StakeholderComment, {foreignKey: 'recordId', as: 'stakeholdercomments'});
db.Record.hasMany(db.RecordWatcher, {foreignKey: 'recordId', as: 'recordwatcherdetail'});
db.Record.hasMany(db.RecordViewer, {foreignKey: 'recordId', as: 'recordviewerdetail'});
db.Record.belongsTo(db.User, {foreignKey: 'assignee', as: 'assignedto'});
db.Record.belongsToMany(db.Tags, {
    through: db.RecordTags, foreignKey: 'recordId', otherKey: 'tagId', as: 'tags',
});
db.Record.belongsToMany(db.Product, {
    through: db.RecordProduct, foreignKey: 'recordId', otherKey: 'productId', as: 'products',
});
db.Record.belongsToMany(db.Team, {
    through: db.RecordTeam, foreignKey: 'recordId', otherKey: 'teamId', as: 'teams',
});


db.RecordData.belongsTo(db.Record, {foreignKey: 'recordId', as: 'records'});
db.RecordData.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'});
db.RecordData.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});

db.RecordContext.belongsTo(db.User, {foreignKey: 'updatedBy', as: 'updatedbyuser'})
db.RecordContext.belongsTo(db.WorkspaceField, {foreignKey: 'fieldId', as: 'fielddetail'})
db.RecordContext.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.RecordContext.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'})


db.ProductContext.belongsTo(db.User, {foreignKey: 'updatedBy', as: 'updatedbyuser'})
db.ProductContext.belongsTo(db.WorkspaceField, {foreignKey: 'fieldId', as: 'fielddetail'})
db.ProductContext.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.ProductContext.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'})



db.UserContext.belongsTo(db.User, {foreignKey: 'updatedBy', as: 'updatedbyuser'})
db.UserContext.belongsTo(db.WorkspaceField, {foreignKey: 'fieldId', as: 'fielddetail'})
db.UserContext.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.UserContext.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'})


db.StakeholderContext.belongsTo(db.User, {foreignKey: 'updatedBy', as: 'updatedbyuser'})
db.StakeholderContext.belongsTo(db.WorkspaceField, {foreignKey: 'fieldId', as: 'fielddetail'})
db.StakeholderContext.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.StakeholderContext.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'})




// Lens Profile Relations
db.Stakeholder.hasMany(db.Record, {foreignKey: 'reportedBy', as: 'reportedbyrecords'});
db.Stakeholder.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.Stakeholder.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'})
db.Stakeholder.hasMany(db.Record, {foreignKey: 'submittedBy', as: 'submittedbyrecords'});
db.Stakeholder.hasOne(db.User, {foreignKey: 'stakeholderId', as: 'user'})
db.Stakeholder.hasMany(db.StakeholderMetadata, {foreignKey: 'stakeholderId', as: 'stakeholdermetadata'});
db.Stakeholder.hasMany(db.StakeholderContext, {foreignKey: 'stakeholderId', as: 'stakeholdercontext'});
db.Stakeholder.hasMany(db.Layout, {foreignKey: 'layoutId', as: 'layoutdetail'});
db.Stakeholder.belongsToMany(db.Workspace, {
    through: db.StakeholderWorkspace, foreignKey: 'stakeholderId', otherKey: 'workspaceId', as: 'workspaces',
});
db.Stakeholder.hasMany(db.StakeholderExternalIdentifier, {foreignKey: 'stakeholderId', as: 'externalIdentifiers'});
db.Stakeholder.belongsToMany(db.Tags, {
    through: db.StakeholderTags, foreignKey: 'stakeholderId', otherKey: 'tagId', as: 'tags',
});
db.Stakeholder.belongsToMany(db.Product, {
    through: db.StakeholderProduct, foreignKey: 'stakeholderId', otherKey: 'productId', as: 'products',
});
db.Stakeholder.belongsToMany(db.Team, {
    through: db.StakeholderTeam, foreignKey: 'stakeholderId', otherKey: 'teamId', as: 'teams',
});


db.Comment.belongsTo(db.Record, {foreignKey: 'recordId', as: 'record'})
db.Comment.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspaces'})
db.Comment.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'})
db.Comment.belongsTo(db.User, {foreignKey: 'commentedBy', as: 'commentedbyprofile'})

db.StakeholderComment.belongsTo(db.Record, {foreignKey: 'stakeholderId', as: 'identities'})
db.StakeholderComment.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspaces'})
db.StakeholderComment.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'})
db.StakeholderComment.belongsTo(db.User, {foreignKey: 'commentedBy', as: 'commentedbyprofile'})



db.StakeholderExternalIdentifier.belongsTo(db.Stakeholder, {foreignKey: 'stakeholderId', as: 'stakeholder'});
db.StakeholderExternalIdentifier.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspaces'})
db.StakeholderExternalIdentifier.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'})

db.StakeholderMetadata.belongsTo(db.Stakeholder, {foreignKey: 'stakeholderId', as: 'stakeholder'});
db.StakeholderMetadata.hasOne(db.WorkspaceField, {foreignKey: 'workspaceFieldId', as: 'stakeholderfield'})
db.StakeholderMetadata.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspaces'})
db.StakeholderMetadata.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'})

// Workspace Relations
db.Workspace.hasOne(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.Workspace.belongsToMany(db.User, {
    through: db.WorkspaceUser, foreignKey: 'workspaceId', otherKey: 'userId', as: 'users',
});

db.Workspace.belongsToMany(db.Stakeholder, {
    through: db.StakeholderWorkspace, foreignKey: 'workspaceId', otherKey: 'stakeholderId', as: 'profiles',
});
db.Workspace.hasMany(db.WorkspaceMetadata, {foreignKey: 'workspaceId', as: 'workspacemetadata'});
db.Workspace.hasMany(db.WorkspaceUser, {foreignKey: 'workspaceId', as: 'workspaceusers'});
db.Workspace.hasMany(db.Team, {foreignKey: 'workspaceId', as: 'teams'});
db.Workspace.belongsTo(db.User, {foreignKey: 'createdBy', as: 'createdby'});
db.Workspace.belongsTo(db.User, {foreignKey: 'managedBy', as: 'managedby'});
db.Workspace.belongsTo(db.User, {foreignKey: 'defaultAssignee', as: 'defaultassignee'});

db.WorkspaceMetadata.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'});
db.WorkspaceMetadata.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});


// Session Relations
db.Session.hasMany(db.Record, {foreignKey: 'sessionId', as: 'records'});
 db.Session.hasOne(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.Session.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'});



db.ZomatoIntegration.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'});
db.ZomatoIntegration.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});

// User and Org Relations
db.User.hasOne(db.Stakeholder, {foreignKey: 'stakeholderId', as: 'stakeholderdata'})
db.User.belongsToMany(db.Org, {
    through: db.OrgUser, foreignKey: 'userId', otherKey: 'orgId', as: 'organizations',
});
db.User.belongsToMany(db.Workspace, {
    through: db.WorkspaceUser, foreignKey: 'userId', otherKey: 'workspaceId', as: 'workspaces',
});
db.User.belongsToMany(db.Team, {
    through: db.TeamUser, foreignKey: 'userId', otherKey: 'teamId', as: 'teams',
});
db.User.hasMany(db.WorkspaceUser, {foreignKey: 'userId', as: 'workspaceusers'});
db.User.hasMany(db.UserContext, {foreignKey: 'userId', as: 'usercontext'});

db.UserInvite.hasOne(db.Org, {foreignKey: 'orgId', as: 'organization'});
db.UserInvite.belongsTo(db.Workspace, {foreignKey: 'workspaceId', as: 'workspace'});

db.Org.hasMany(db.Workspace, {foreignKey: 'orgId', as: 'workspaces'});
db.Org.belongsToMany(db.User, {
    through: db.OrgUser, foreignKey: 'orgId', otherKey: 'userId', as: 'users',
});

db.OrgUser.belongsTo(db.User,{foreignKey: 'userInviteBy', as: 'userinviteby'} )
db.OrgUser.belongsTo(db.User,{foreignKey: 'userId', as: 'userid'} )
db.OrgUser.hasOne(db.UserStatusGroup,{foreignKey: 'userStatus', as: 'userstatusgroup'} )

db.WorkspaceUser.belongsTo(db.User,{foreignKey: 'userInviteBy', as: 'userinviteby'} )
db.WorkspaceUser.belongsTo(db.User,{foreignKey: 'userId', as: 'userid'} )
db.WorkspaceUser.belongsTo(db.Workspace,{foreignKey: 'workspaceId', as: 'workspace'} )
db.WorkspaceUser.belongsTo(db.Org, {foreignKey: 'orgId', as: 'organization'});

module.exports = db;
