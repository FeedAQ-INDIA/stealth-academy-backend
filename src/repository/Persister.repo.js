const db = require("../entity");
const {Op, where} = require("sequelize");
const lodash = require("lodash");
const logger = require("../config/winston.config.js");

const getInitials = (name) => {
    // Trim the input to handle extra spaces
    const trimmedName = name.trim();

    // If there's only one word, return its first two letters in uppercase
    if (!trimmedName.includes(" ")) {
        return trimmedName.slice(0, 2).toUpperCase();
    }

    // For multiple words, split and get initials
    const words = trimmedName.split(" ");
    const initials = words?.slice(0, 2)?.map(word => word.charAt(0).toUpperCase()).join("");

    return initials;
}

const findOrCreateStakeholder = async (userInfo, workspaceId, orgId, apichannel, transaction) => {
    let stakeholder;

    try {
        console.log(userInfo)
        if (userInfo != null) {
            if (userInfo?.stakeholderId) {
                stakeholder = await db.Stakeholder.findByPk(userInfo?.stakeholderId, {
                    transaction: transaction,
                });
                return stakeholder;
            }

            if (userInfo?.externalIdentifier == null && userInfo?.externalIdentifierType == null) {
                stakeholder = await db.Stakeholder.create({
                    firstName: userInfo?.firstName,
                    lastName: userInfo?.lastName,
                    email: userInfo?.email,
                    number: userInfo?.number,
                    nameInitial: getInitials(userInfo?.firstName),
                    layoutId: apichannel?.layoutId,
                    orgId: orgId,
                }, {
                    transaction: transaction,
                });
                await createStakeholderWorkspace(stakeholder.stakeholderId, workspaceId, transaction);
            } else {
                // Step 1: Find the external identifier
                const externalIdentifierRecord = await db.StakeholderExternalIdentifier.findByPk(userInfo?.externalIdentifier, {transaction: transaction});
                if (externalIdentifierRecord) {
                    stakeholder = await db.Stakeholder.findByPk(externalIdentifierRecord?.stakeholderId, {transaction: transaction});
                } else {
                    stakeholder = await db.Stakeholder.create({
                        firstName: userInfo?.firstName,
                        lastName: userInfo?.lastName,
                        email: userInfo?.email,
                        number: userInfo?.number,
                        nameInitial: getInitials(userInfo?.firstName),
                        layoutId: apichannel?.layoutId,
                        orgId: orgId,
                    }, {transaction: transaction});
                    await createStakeholderWorkspace(stakeholder.stakeholderId, workspaceId, transaction);

                    if (stakeholder) {
                        await db.StakeholderExternalIdentifier.create({
                            stakeholderExternalIdentifierId: userInfo?.externalIdentifier,
                            stakeholderExternalIdentifierType: userInfo?.externalIdentifierType,
                            stakeholderId: stakeholder.stakeholderId,
                        }, {transaction: transaction});
                    }
                }
            }
        } else {
            console.log(userInfo)
            stakeholder = await db.Stakeholder.create({
                firstName: "Anonymous", lastName: "Anonymous", orgId: orgId,nameInitial: getInitials('Anonymous'),
                layoutId: apichannel?.layoutId
            }, {transaction: transaction});
        }
        console.log(`The extracted stakeholder is :: ${stakeholder}`);
        return stakeholder;
    } catch (error) {
        console.error("Error finding or creating stakeholder:", error);
        throw new Error("Stakeholder creation or retrieval failed");
    }
};

const createAnonymousStakeholder = async (orgId, workspaceId, transaction = null) => {
    let stakeholder = await db.Stakeholder.create({
        firstName: "Anonymous", orgId: orgId,
    }, {...(transaction && {transaction})});
    await createStakeholderWorkspace(stakeholder.stakeholderId, workspaceId, transaction);
};

const createStakeholderWorkspace = async (stakeholderId, workspaceId, transaction = null) => {
    return await db.StakeholderWorkspace.findOrCreate({
        where: {stakeholderId: stakeholderId, workspaceId: workspaceId},
        defaults: {stakeholderId: stakeholderId, workspaceId: workspaceId}, ...(transaction && {transaction}),
    });
};

const createStakeholderMetadata = async (stakeholderId, stakeholderMetadataList, transaction = null) => {
    let stakeholderMetadata = stakeholderMetadataList.map((a) => ({
        stakeholderId: stakeholderId, queryName: a.queryName, key: a.key, value: a.value, metadata: a.metadata,
    }));

    return await db.StakeholderMetadata.bulkCreate(stakeholderMetadata, {
        ...(transaction && {transaction}), // only include transaction if it's not null
    });
};

const createWorkspace = async (orgId, name, description, status, transaction = null) => {
    let workspace = {
        orgId: orgId, name: name, description: description, status: status,
    };
    return await db.Workspace.create(workspace, {
        ...(transaction && {transaction}),
    });
};

const createWorkspaceMetadata = async (workspaceId, workspaceMetadataList, transaction = null) => {
    let workspaceMetadata = workspaceMetadataList?.map((a) => ({
        workspaceId: workspaceId, queryName: a.queryName, key: a.key, value: a.value, metadata: a.metadata,
    }));
    return await db.WorkspaceMetadata.bulkCreate(workspaceMetadata, {
        ...(transaction && {transaction}),
    });
};
 
const createSession = async (workspaceId, orgId,  transaction = null) => {
    let session = {
        workspaceId: workspaceId,  orgId: orgId,
    };
    return await db.Session.create(session, {
        ...(transaction && {transaction}),
    });
};

const createRecord = async (workspaceId, orgId,   sessionId, reportedBy, submittedBy, record, apichannel, transaction = null) => {
     let recordObj = {
        workspaceId: workspaceId,
        sessionId: sessionId,
        reportedBy: reportedBy,
        submittedBy: submittedBy,
        orgId: orgId,
    channel:  apichannel.apiChannelId,
    channelType: 'self_service' ,
    recordType:   record?.recordType || 'self_service',
         interactionType : 'form_submission',
    recordStatus: 27,
    recordTitle:  record?.recordTitle || null,
    layoutId:  apichannel?.layoutdetail?.layoutId,
    statusConfigurationId:  apichannel?.layoutdetail?.statusConfigurationId ,

    };
    return await db.Record.create(recordObj, {
        ...(transaction && {transaction}),
    });
};

const createRecordMetadata = async (recordId, recordMetadataList, transaction = null) => {
    let recordMetadata = recordMetadataList?.map((a) => ({
        recordId: recordId, queryName: a?.queryName, key: a?.key, value: a?.value,
    }));
    return await db.RecordMetadata.bulkCreate(recordMetadata, {
        ...(transaction && {transaction}),
    });
};

const createRecordData = async (workspaceId, orgId, recordId,   recordDataList, transaction = null) => {
    // Use map to create the recordData array
    const recordData = recordDataList.map((a) => ({
        workspaceId: workspaceId,
        recordId: recordId,

           orgId: orgId,

    fieldId: a?.fieldId ,
    fieldValue:  a?.fieldValue,
    createdBy:  null,
    }));

    // Now bulk create with the populated recordData array
    return await db.RecordData.bulkCreate(recordData, {
        ...(transaction && {transaction}),
    });
};

const createRecordDataKey = async (workspaceId, orgId,  recordDataKeyList, transaction = null) => {
    console.log("Original Record Data Key List ::: ", recordDataKeyList);

    // Filter out duplicates from recordDataKeyList
    const uniqueRecordDataKeyList = recordDataKeyList;

    console.log("Unique Record Data Key List ::: ", uniqueRecordDataKeyList);

    // Fetch existing keys to avoid duplicates
    const existingEntries = await db.RecordDataKey.findAll({
        where: {
            workspaceId: workspaceId, orgId: orgId, keyInputType: {
                [Op.in]: uniqueRecordDataKeyList.map((a) => a.keyInputType),
            }, keyQuestionType: {
                [Op.in]: uniqueRecordDataKeyList.map((a) => a.keyQuestionType),
            }, key: {
                [Op.in]: uniqueRecordDataKeyList.map((a) => a.key),
            },
        }, transaction: transaction, attributes: ["recordDataKeyId", "key"],
    });

    console.log("Existing Entries ::: ", existingEntries);

    const existingKeySet = new Set(existingEntries.map((a) => a.key));
    console.log("Existing Key Set ::: ", existingKeySet);

    // Filter out keys that already exist in the database
    const recordDataKey = uniqueRecordDataKeyList
        .filter((a) => !existingKeySet.has(a.key))
        .map((a) => ({
            workspaceId: workspaceId,
             orgId: orgId,
            key: a.key,
            keyQuestionType: a.keyQuestionType,
            keyInputType: a.keyInputType,
            keyOptions: a.keyOptions,
        }));

    console.log("Filtered Record Data Key ::: ", recordDataKey);

    let finalKeysWithIds = [];

    // Bulk create new keys if there are any
    if (recordDataKey.length > 0) {
        const res = await db.RecordDataKey.bulkCreate(recordDataKey, {
            ...(transaction && {transaction}),
        });
        finalKeysWithIds = res.map((a) => ({
            id: a.recordDataKeyId, key: a.key,
        }));

        const optionsData = uniqueRecordDataKeyList
            .filter((a) => !existingKeySet.has(a.key) && a.options)
            .flatMap((a, index) => a.options.map((option) => ({
                recordDataKeyId: res[index].recordDataKeyId, option: option,
            })));

        if (!lodash.isEmpty(optionsData)) {
            createRecordDataKeyOption(optionsData, transaction);
        }
    }

    // Merge with existing keys
    existingEntries.forEach((entry) => finalKeysWithIds.push({
        id: entry.recordDataKeyId, key: entry.key,
    }));

    // Return the final list of all keys with IDs
    return finalKeysWithIds;
};

const createRecordDataKeyOption = async (optionsData, transaction = null) => {
    return await db.RecordDataKeyOption.bulkCreate(optionsData, {
        ...(transaction && {transaction}),
    });
};

const createRecordDataMetadata = async (recordDataId, recordDataMetadataList, transaction = null) => {
    console.log("RecordDataId, ", recordDataMetadataList);

    if (!recordDataMetadataList && !Array.isArray(recordDataMetadataList) && recordDataMetadataList?.length === 0) {
        console.warn("recordDataMetadata is undefined, null, or empty. Skipping bulkCreate.");
        return;
    }
    let recordDataMetadata = recordDataMetadataList?.map((a) => ({
        recordDataId: recordDataId, queryName: a?.queryName, key: a?.key, value: a?.value || '', metadata: a?.metadata,
    }));

    return await db.RecordDataMetadata.bulkCreate(recordDataMetadata, {
        ...(transaction && {transaction}),
    });
};

const searchRecord = async (query) => {
    if (lodash.isEmpty(query)) {
        throw new Error("Search Query is empty ");
    }
    try {
        const results = await db.Record.findAndCountAll(query);
        return {
            results: results.rows, totalCount: results.count, limit, offset,
        };
    } catch (error) {
        console.error("Error searching entities:", error);
        throw new Error("Could not search entities");
    }
};

const createComment = async (userId, workspaceId, orgId, comment, recordId) => {
    let commentModel = {
        workspaceId: workspaceId, orgId: orgId, comment: comment, recordId: recordId, commentedBy: userId,
    };
    return await db.Comment.create(commentModel);
};

const updateComment = async (userId, workspaceId, orgId, commentId, comment, recordId, transaction = null) => {
    let commentModel = {
        workspaceId: workspaceId, orgId: orgId, comment: comment, recordId: recordId, commentedBy: userId,
    };
    return await db.Comment.findOrCreate({
        where: {commentId: commentId}, defaults: commentModel, ...(transaction && {transaction}),
    });
};


const updateStakeholderComment = async (userId, workspaceId, orgId, commentId, comment, stakeholderId, transaction = null) => {
    let commentModel = {
        workspaceId: workspaceId, orgId: orgId, comment: comment, stakeholderId: stakeholderId, commentedBy: userId,
    };
    return await db.StakeholderComment.findOrCreate({
        where: {commentId: commentId}, defaults: commentModel, ...(transaction && {transaction}),
    });
};


const createStakeholderComment = async (userId, workspaceId, orgId, comment, stakeholderId) => {
    let stakeholderCommentModel = {
        workspaceId: workspaceId, orgId: orgId, comment: comment, stakeholderId: stakeholderId, commentedBy: userId,
    };
    return await db.StakeholderComment.create(stakeholderCommentModel);
};

const sendUserInvite = async (userInviteEmail, userId, orgId, myMap) => {
    let userInviteModel = [];

         userInviteEmail.forEach((email) => {
            userInviteModel.push({
                orgId: orgId,
                userInviteEmail: email,
                userInviteCode: myMap.get(email) || null, // Ensure mapping exists
                userInviteBy: userId,
                status: 'INVITED'
            });
        })


        if (userInviteModel?.length > 0) {
            return db.UserInvite.bulkCreate(userInviteModel);
        } else {
            console.log("No new invites to send.");
            return "No new invites sent.";
        }

};




const setupZomatoIntegration = async (workspaceId, orgId,  storeId,) => {
    let zomatoIntegrationModel = {
        workspaceId: workspaceId, orgId: orgId, storeId: storeId,
    };
    return await db.ZomatoIntegration.create(zomatoIntegrationModel);
};


module.exports = { 
    createWorkspace,
    createWorkspaceMetadata,
    createRecord,
    createRecordMetadata,
    createRecordData,
    createRecordDataKey,
    createRecordDataMetadata,
     createSession,
    createStakeholderWorkspace,
    createStakeholderMetadata,
    createAnonymousStakeholder,
    findOrCreateStakeholder,
    searchRecord,
    createComment,
    updateComment,
    createStakeholderComment,
    sendUserInvite,
    setupZomatoIntegration,
    updateStakeholderComment
};
