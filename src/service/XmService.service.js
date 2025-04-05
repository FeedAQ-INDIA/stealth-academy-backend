const {Op, fn, col} = require("sequelize");
const db = require("../entity/index.js");
const Persister = require("../repository/Persister.repo.js");
const lodash = require("lodash");
const MailerUtil = require("../util/MailerUtil.util.js");
const authService = require("../service/Auth.service.js");
const logger = require("../config/winston.config.js");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');


const setupZomatoIntegration = async (workspaceId, orgId, storeId) => {
    const zomatoIntegration = await Persister.setupZomatoIntegration(workspaceId, orgId, storeId);
    return zomatoIntegration;
};

const createComment = async (userId, workspaceId, orgId, comment, recordId) => {
    return await Persister.createComment(userId, workspaceId, orgId, comment, recordId);
};

const editStakeholderComment = async (userId, workspaceId, orgId, commentId, comment, stakeholderId) => {
    let commentObj = await db.StakeholderComment.findByPk(commentId);

    if (commentObj && commentObj.commentedBy === userId) {
        commentObj.comment = comment;
        return await commentObj.save();
    } else {
        return "Invalid Comment Deletion Request"
    }

};

const deleteComment = async (userId, workspaceId, orgId, commentId) => {
    let commentObj = await db.Comment.findByPk(commentId);

    if (commentObj && commentObj.commentedBy === userId) {
        return await commentObj.destroy();
    } else {
        return "Invalid Comment Deletion Request"
    }
};

const deleteStakeholderComment = async (userId, workspaceId, orgId, commentId) => {

    let commentObj = await db.StakeholderComment.findByPk(commentId);

    if (commentObj && commentObj.commentedBy === userId) {
        return await commentObj.destroy();
    } else {
        return "Invalid Comment Deletion Request"
    }

};


const createStakeholderComment = async (userId, workspaceId, orgId, comment, stakeholderId) => {
    return await Persister.createStakeholderComment(userId, workspaceId, orgId, comment, stakeholderId);
};


const generateUniqueNumericCode = () => {
    const min = 100000; // Smallest 6-digit number
    const max = 999999; // Largest 6-digit number
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const createEditTags = async (userId, workspaceId, orgId, tagId, tagName, tagDescription, tagStatus) => {
    let tagObj = {
        ...(tagId && {tagId: tagId}),
        tagName: tagName,
        tagDescription: tagDescription,
        tagStatus: tagStatus,
        orgId: orgId,
        workspaceId: workspaceId,
        createdBy: userId
    }
    if (tagId) {
        const loadedTags = await db.Tags.findByPk(tagId);

        if (loadedTags) {
            // loadedTags.tagName = tagName;
            loadedTags.tagDescription = tagDescription;
            loadedTags.tagStatus = tagStatus;
            await loadedTags.save();
            return "Tag is updated";
        } else {
            const tagDataObj = await db.Tags.create(tagObj);
            if (tagDataObj) {
                return "New Tag is created";
            }
        }
    } else {
        const tagDataObj = await db.Tags.create(tagObj);
        if (tagDataObj) {
            return "New Tag is created";

        }
    }


}


const deleteTags = async (userId, workspaceId, orgId, tagId, tagStatus) => {

    if (!tagId && !workspaceId && !orgId) {
        return {message: "Invalid request"}
    }

    const loadedTags = await db.Tags.findByPk(tagId);

    if (loadedTags) {
        const recTags = await db.RecordTags.findAll({
            where: {tagId: tagId}
        })
        const stakeholderTags = await db.StakeholderTags.findAll({
            where: {tagId: tagId}
        })

        if ((recTags && recTags?.length == 0) && (stakeholderTags && stakeholderTags?.length == 0)) {
            await loadedTags.destroy();
            return {message: "Tag deleted successfully"}
        } else {
            loadedTags.tagStatus = "ARCHIVED";
            await loadedTags.save();
            return {message: "Tag cannot be deleted, as it is being referred by records & stakeholders ! The Tags has been archived successfully"}
        }
    } else {
        return {message: "Invalid Tag"}
    }

}


const deleteTeam = async (userId, workspaceId, orgId, teamId, teamStatus) => {

    if (!teamId && !workspaceId && !orgId) {
        return {message: "Invalid request"}
    }

    const loadedTags = await db.Team.findByPk(teamId);

    if (loadedTags) {
        const recTags = await db.RecordTeam.findAll({
            where: {teamId: teamId}
        })
        const stakeholderTags = await db.StakeholderTeam.findAll({
            where: {teamId: teamId}
        })

        if ((recTags && recTags?.length == 0) && (stakeholderTags && stakeholderTags?.length == 0)) {
            await loadedTags.destroy();
            return {message: "Team deleted successfully"}
        } else {
            loadedTags.teamStatus = "ARCHIVED";
            await loadedTags.save();
            return {message: "Team cannot be deleted, as it is being referred by records & stakeholders ! The Team has been archived successfully"}
        }
    } else {
        return {message: "Invalid Tag"}
    }

}


const createEditProduct = async (userId, productId, workspaceId, orgId, productName, productCode, productStatus, productDescription) => {
    let productObj = {
        ...(productId && {productId: productId}),
        productName: productName,
        productDescription: productDescription,
        productCode: productCode,
        productStatus: productStatus,
        orgId: orgId,
        workspaceId: workspaceId,
        createdBy: userId
    }
    if (productId) {
        const loadedProduct = await db.Product.findByPk(productId);
        if (loadedProduct) {
            loadedProduct.productName = productName;
            loadedProduct.productDescription = productDescription;
            loadedProduct.productCode = productCode;
            loadedProduct.productStatus = productStatus;
            const updatedProduct = await loadedProduct.save();
            if (updatedProduct) {
                return "Product is updated";
            }
        } else {

            const productDataObj = await db.Product.create(productObj);
            if (productDataObj) {
                return "New Product is created";
            }
        }


    } else {
        const productDataObj = await db.Product.create(productObj);
        if (productDataObj) {
            return "New Product is created";
        }
    }
}


const deleteProduct = async (userId, workspaceId, orgId, productId, productStatus) => {

    if (!productId && !workspaceId && !orgId) {
        return {message: "Invalid request"}
    }

    const loadedTags = await db.Product.findByPk(productId);

    if (loadedTags) {
        const recTags = await db.RecordProduct.findAll({
            where: {productId: productId}
        })
        const stakeholderTags = await db.StakeholderProduct.findAll({
            where: {productId: productId}
        })

        if ((recTags && recTags?.length == 0) && (stakeholderTags && stakeholderTags?.length == 0)) {
            await loadedTags.destroy();
            return {message: "Product deleted successfully"}
        } else {
            loadedTags.productStatus = "ARCHIVED";
            await loadedTags.save();
            return {message: "Product cannot be deleted, as it is being referred by records & stakeholders ! The Product has been archived successfully"}
        }
    } else {
        return {message: "Invalid Product"}
    }

}


const getUser = async (userId, orgId, workspaceId) => {
    const userData = await db.User.findByPk(userId);

    if (!userData) throw new Error("User not found"); // Handle case where user is not found

    if (orgId) {
        const userOrgData = await db.OrgUser.findOne({
            where: {
                userId, orgId
            }
        });
        const userContext = await db.UserContext.findAll({
            where: {
                userId, orgId
            }, include: [{
                model: db.WorkspaceField, as: "fielddetail"
            }]
        });
        console.log(userOrgData.userStatus)
        let userStatusGroupLinkList ;
        if(userOrgData.userStatus) {
            userStatusGroupLinkList=
                await db.UserStatusGroupLink.findAll({
                    where: {userStatusGroupId: userOrgData.userStatus},
                    include: [{
                        model: db.UserStatus,
                        required: true,  // Ensures only matching records are fetched
                        as: "userstatus",
                        attributes: ['userStatusName', 'userStatusId', 'userStatusColor']
                    }]
                });
        }

        const userStatusList = userStatusGroupLinkList?.map(a => a.userstatus) || []


        // Attach additional data safely without mutating Sequelize instance
        return {...userData.toJSON(), userOrgData, userContext, userStatusList};
    }

    return userData.toJSON();
};


const updateUser = async (userId, orgId, reqUserId, firstName, lastName, nameInitial, email, number, profilePic, u_created_at, u_updated_at, updatedBy, stakeholderId, jobTitle, department, organizationName, baseLocation, language, timezone) => {

    if(reqUserId){
        userId = reqUserId;
    }
    if (!userId ) throw new Error("Invalid User Id");

    const userData = await db.User.findByPk(userId);

    if (!userData) throw new Error("User not found"); // Handle case where user is not found

    userData.firstName = firstName;
    userData.lastName = lastName;
    userData.nameInitial = nameInitial;
    userData.email = email;
    userData.number = number;
    userData.profilePic = profilePic;
    userData.updatedBy = userId;
    userData.stakeholderId = stakeholderId;
    userData.u_created_at = u_created_at;
    userData.u_updated_at = u_updated_at;
    await userData.save();


    const userOrgData = await db.OrgUser.findOne({
        where: {
            userId, orgId
        }
    });

    userOrgData.jobTitle = jobTitle;
    userOrgData.department = department;
    userOrgData.baseLocation = baseLocation;
    userOrgData.language = language;
    userOrgData.timezone = timezone;

    await userOrgData.save();

    return {...userData.toJSON(), userOrgData};

};


const deleteStatusFlow = async (userId, workspaceId, orgId, statusFlowId, statusFlowStatus) => {

    if (!statusFlowId && !workspaceId && !orgId) {
        return {message: "Invalid request"}
    }

    const loadedTags = await db.StatusConfiguration.findByPk(statusFlowId);

    if (loadedTags) {
        const recTags = await db.Record.findAll({
            where: {statusConfigurationId: statusFlowId}
        })
        if (recTags && recTags?.length == 0) {
            await db.StatusesTransition.destroy({
                where: {
                    statusConfigurationId: loadedTags?.statusConfigurationId
                }
            })
            await db.Statuses.destroy({
                where: {
                    statusConfigurationId: loadedTags?.statusConfigurationId
                }
            })

            await loadedTags.destroy();
            return {message: "Status Flow deleted successfully"}
        } else {
            loadedTags.statusConfigurationStatus = "ARCHIVED";
            await loadedTags.save();
            return {message: "Status Flow cannot be deleted, as it is being referred by records & stakeholders ! The Status Flow has been archived successfully"}
        }
    } else {
        return {message: "Invalid Status Flow"}
    }
}


const deleteContextConfiguration = async (userId, workspaceId, orgId, contextConfigId, contextConfigStatus) => {

    if (!contextConfigId && !workspaceId && !orgId) {
        return {message: "Invalid request"}
    }

    const loadedTags = await db.ContextConfiguration.findByPk(contextConfigId);

    if (loadedTags) {
        const recTags = await db.Record.findAll({
            where: {contextConfigurationId: contextConfigId}
        })
        const stakeholderTags = await db.Stakeholder.findAll({
            where: {contextConfigurationId: contextConfigId}
        })
        //Add more table check here before delete

        if ((recTags && recTags?.length == 0) && (stakeholderTags && stakeholderTags?.length == 0)) {
            await db.WorkspaceField.destroy({
                where: {
                    contextConfigurationId: loadedTags?.contextConfigurationId
                }
            })

            await loadedTags.destroy();
            return {message: "Context Configuration deleted successfully"}
        } else {
            loadedTags.contextConfigurationStatus = "ARCHIVED";
            await loadedTags.save();
            return {message: "Context Configuration cannot be deleted, as it is being referred by records & stakeholders ! The Context Configuration has been archived successfully"}
        }
    } else {
        return {message: "Invalid Status Flow"}
    }
}

const createEditTeam = async (userId, workspaceId, orgId, teamId, teamName, teamDescription, teamStatus, teamMembers) => {
    if (!teamMembers || teamMembers.length === 0) {
        return "Team must have at least one member";
    }

    const teamObj = {
        teamName,
        teamDescription,
        teamStatus,
        orgId,
        workspaceId,
        createdBy: userId,
    };

    const transaction = await db.sequelize.transaction();
    try {
        if (teamId) {
            const loadedTeam = await db.Team.findByPk(teamId, { transaction });
            if (!loadedTeam) {
                await transaction.rollback();
                return "Team does not exist";
            }

            loadedTeam.teamName = teamName;
            loadedTeam.teamDescription = teamDescription;
            loadedTeam.teamStatus = teamStatus;
            await loadedTeam.save({ transaction });

            // 1️⃣ Fetch existing team members
            const existingMembers = await db.TeamUser.findAll({
                where: { teamId },
                attributes: ["userId"],
                transaction,
            });

            const existingMemberIds = existingMembers.map(m => m.userId);
            const newMemberIds = teamMembers;

            // 2️⃣ Identify members to remove
            const membersToRemove = existingMemberIds.filter(id => !newMemberIds.includes(id));

            // 3️⃣ Remove members who are not in the new list
            if (membersToRemove.length > 0) {
                await db.TeamUser.destroy({
                    where: { teamId, userId: membersToRemove },
                    transaction,
                });
            }

            // 4️⃣ Upsert new and existing members
            await Promise.all(newMemberIds.map(async (member) => {
                return db.TeamUser.upsert(
                    { userId: member, teamId: loadedTeam.teamId, userInviteBy: userId, orgId, workspaceId },
                    { transaction }
                );
            }));

            await transaction.commit();
            return "Team is updated";
        } else {
            // Create new team
            const teamDataObj = await db.Team.create(teamObj, { transaction });

            await Promise.all(teamMembers.map(async (member) => {
                return db.TeamUser.upsert(
                    { userId: member, teamId: teamDataObj.teamId, userInviteBy: userId,  orgId, workspaceId },
                    { transaction }
                );
            }));

            await transaction.commit();
            return "New team is created";
        }
    } catch (err) {
        console.error("Error during transaction:", err);
        await transaction.rollback();
        throw new Error(`Team creation failed: ${err.message}`);
    }
};


const addRecordStakeholderProducts = async (userId, orgId, workspaceId, recordId, stakeholderId, productIdList) => {

    if (!recordId && !stakeholderId && !productIdList && productIdList.length === 0) {
        throw new Error("Invalid request");
    }

    if (recordId) {

        let createdRecPro = await Promise.all(productIdList.map(async (productId) => {  // Use `map` instead of `forEach`
            const obj = {
                addedBy: userId, recordId: recordId, productId: productId, orgId, workspaceId   // Corrected variable name
            };
            const [recordProductObj, created] = await db.RecordProduct.findOrCreate({
                where: {
                    recordId, productId  // Ensure uniqueness by adding `productId`
                }, defaults: obj
            });
            return recordProductObj;
        }));

        return createdRecPro;

    } else if (stakeholderId) {
        let createdRecPro = await Promise.all(productIdList.map(async (productId) => {  // Use `map` instead of `forEach`
            const obj = {
                addedBy: userId, stakeholderId: stakeholderId, productId: productId,  orgId, workspaceId   // Corrected variable name
            };
            const [stakeholderProductObj, created] = await db.StakeholderProduct.findOrCreate({
                where: {
                    stakeholderId, productId  // Ensure uniqueness by adding `productId`
                }, defaults: obj
            });
            return stakeholderProductObj;
        }));

        return createdRecPro;
    }
};


const addRecordStakeholderTags = async (userId, orgId, workspaceId,  recordId, stakeholderId, tagIdList) => {

    if (!recordId && !stakeholderId && !tagIdList && tagIdList.length === 0) {
        throw new Error("Invalid request");
    }

    if (recordId) {
        let createdRecordTags = await Promise.all(tagIdList.map(async (tagId) => {  // Use `map` instead of `forEach`
            const obj = {
                addedBy: userId, recordId: recordId, tagId: tagId, orgId, workspaceId // Corrected variable name
            };
            const [recordTagObj, created] = await db.RecordTags.findOrCreate({
                where: {
                    recordId, tagId  // Ensure uniqueness by adding `productId`
                }, defaults: obj
            });
            return recordTagObj;
        }));

        return createdRecordTags;
    } else if (stakeholderId) {
        let createdStakeholderTags = await Promise.all(tagIdList.map(async (tagId) => {  // Use `map` instead of `forEach`
            const obj = {
                addedBy: userId, stakeholderId: stakeholderId, tagId: tagId, orgId, workspaceId // Corrected variable name
            };
            const [stakeholderTagObj, created] = await db.StakeholderTags.findOrCreate({
                where: {
                    stakeholderId, tagId  // Ensure uniqueness by adding `productId`
                }, defaults: obj
            });
            return stakeholderTagObj;
        }));

        return createdStakeholderTags;
    }
};


const deleteRecordStakeholderProducts = async (userId, orgId, recordId, stakeholderId, productIdList) => {

    if (!recordId && !stakeholderId && !productIdList && productIdList.length === 0) {
        throw new Error("Invalid request");
    }

    if (recordId) {

        let deletedRecPro = await Promise.all(productIdList.map(async (productId) => {  // Use `map` instead of `forEach`

            const recordProductObj = await db.RecordProduct.findOne({
                where: {
                    recordId, productId  // Ensure uniqueness by adding `productId`
                }
            });
            if (recordProductObj) {
                await recordProductObj.destroy();
                return "Deleted Successfully"

            } else {
                return "Failed to Delete";

            }
        }));

    } else if (stakeholderId) {
        let deletedRecPro = await Promise.all(productIdList.map(async (productId) => {  // Use `map` instead of `forEach`

            const stakeholderProductObj = await db.StakeholderProduct.findOne({
                where: {
                    stakeholderId, productId  // Ensure uniqueness by adding `productId`
                }
            });
            if (stakeholderProductObj) {
                await stakeholderProductObj.destroy();
                return "Deleted Successfully"

            } else {
                return "Failed to Delete";

            }
        }));

    }
};


const deleteRecordStakeholderTags = async (userId, orgId, recordId, stakeholderId, tagIdList) => {

    if (!recordId && !stakeholderId && !tagIdList && tagIdList.length === 0) {
        throw new Error("Invalid request");
    }

    if (recordId) {
        let deletedRecordTags = await Promise.all(tagIdList.map(async (tagId) => {  // Use `map` instead of `forEach`
            const recordTagObj = await db.RecordTags.findOne({ // Change `findAll()` to `findOne()`
                where: {recordId, tagId}
            });

            if (recordTagObj) {
                await recordTagObj.destroy();
                return "Deleted Successfully"
            } else {
                return "Failed to Delete";
            }

        }));

    } else if (stakeholderId) {
        let deletedStakeholderTags = await Promise.all(tagIdList.map(async (tagId) => {  // Use `map` instead of `forEach`

            const stakeholderTagObj = await db.StakeholderTags.findOne({
                where: {
                    stakeholderId, tagId  // Ensure uniqueness by adding `productId`
                }
            });
            if (stakeholderTagObj) {
                await stakeholderTagObj.destroy();
                return "Deleted Successfully"
            } else {
                return "Failed to Delete";
            }

        }));

    }
};


const addTeamTag = async (userId, orgId, workspaceId, recordId, stakeholderId, teamIdList) => {

    if (!recordId && !stakeholderId && !teamIdList && teamIdList.length === 0) {
        throw new Error("Invalid request");
    }

    if (recordId) {
        let createdRecordTeam = await Promise.all(teamIdList.map(async (teamId) => {  // Use `map` instead of `forEach`
            const obj = {
                addedBy: userId, recordId: recordId, teamId: teamId, orgId, workspaceId // Corrected variable name
            };
            const [recordTeamObj, created] = await db.RecordTeam.findOrCreate({
                where: {
                    recordId, teamId  // Ensure uniqueness by adding `productId`
                }, defaults: obj
            });
            return recordTeamObj;
        }));

        return createdRecordTeam;
    } else if (stakeholderId) {
        let createdStakeholderTeam = await Promise.all(teamIdList.map(async (teamId) => {  // Use `map` instead of `forEach`
            const obj = {
                addedBy: userId, stakeholderId: stakeholderId, teamId: teamId, orgId, workspaceId // Corrected variable name
            };
            const [stakeholderTeamObj, created] = await db.StakeholderTeam.findOrCreate({
                where: {
                    stakeholderId, teamId  // Ensure uniqueness by adding `productId`
                }, defaults: obj
            });
            return stakeholderTeamObj;
        }));

        return createdStakeholderTeam;
    }
};


const deleteTeamTag = async (userId, orgId, recordId, stakeholderId, teamIdList) => {

    if (!recordId && !stakeholderId && !teamIdList && teamIdList.length === 0) {
        throw new Error("Invalid request");
    }

    if (recordId) {
        let deletedRecordTeam = await Promise.all(teamIdList.map(async (teamId) => {  // Use `map` instead of `forEach`
            const recordTeamObj = await db.RecordTeam.findOne({ // Change `findAll()` to `findOne()`
                where: {recordId, teamId}
            });

            if (recordTeamObj) {
                await recordTeamObj.destroy();
                return "Deleted Successfully"
            } else {
                return "Failed to Delete";
            }

        }));

    } else if (stakeholderId) {
        let deletedStakeholderTeam = await Promise.all(teamIdList.map(async (teamId) => {  // Use `map` instead of `forEach`

            const stakeholderTeamObj = await db.StakeholderTeam.findOne({
                where: {
                    stakeholderId, teamId  // Ensure uniqueness by adding `productId`
                }
            });
            if (stakeholderTeamObj) {
                await stakeholderTeamObj.destroy();
                return "Deleted Successfully"
            } else {
                return "Failed to Delete";
            }

        }));

    }
};


const updateStatus = async (userId, orgId, workspaceId, recordId, stakeholderId, newStatus) => {

    if (!recordId && !stakeholderId && !newStatus) {
        throw new Error("Invalid request");
    }

    if (recordId && newStatus) {
        const loadedRecord = await db.Record.findByPk(recordId);
        loadedRecord.recordStatus = newStatus;
        await loadedRecord.save();

    }
    return "Status Updated"
    // else if (stakeholderId  && newStatus) {
    //     const loadedStakeholder = await db.Stakeholder.findByPk(stakeholderId);
    //     loadedStakeholder.recordStatus = newStatus;
    //     await loadedRecord.save();
    //     return "Status Updated"
    // }
};


const updateAssignee = async (userId, orgId, workspaceId, recordId, newAssigneeId) => {

    if (!recordId) {
        throw new Error("Invalid request");
    }

    if (recordId) {
        const loadedRecord = await db.Record.findByPk(recordId);
        loadedRecord.assignee = newAssigneeId;
        await loadedRecord.save();
        return loadedRecord;
    }

    return "Failed "
    // else if (stakeholderId  && newStatus) {
    //     const loadedStakeholder = await db.Stakeholder.findByPk(stakeholderId);
    //     loadedStakeholder.recordStatus = newStatus;
    //     await loadedRecord.save();
    //     return "Status Updated"
    // }
};


const createEditStatusFlow = async (userId, workspaceId, orgId, statusConfigurationId, statusConfigurationStatus, statusConfigurationName, statusConfigurationDescription, possibleStatus, possibleStatusTransition, defaultStatus, entryStatus) => {

    if (!statusConfigurationStatus || !statusConfigurationName || !possibleStatus) {
        return {message: "Missing required data"};
    }

    const transaction = await db.sequelize.transaction();
    try {
        let statusConfig;
        let statusConfiguration = {
            workspaceId,
            orgId,
            statusConfigurationId,
            statusConfigurationName,
            statusConfigurationDescription,
            statusConfigurationStatus,
            defaultStatus,
            entryStatus,
            createdBy: userId,
        }

        // If ID is provided, update; otherwise, create a new status configuration
        if (statusConfigurationId) {
            statusConfig = await db.StatusConfiguration.findByPk(statusConfigurationId);
            if (!statusConfig) {
                return {message: "Status Configuration not found"};
            }
            await statusConfig.update(statusConfiguration, {transaction});
        } else {
            statusConfig = await db.StatusConfiguration.create(statusConfiguration, {transaction});
        }

        possibleStatus = possibleStatus?.map(a => ({
            ...(a?.statusId && {statusId: a.statusId}),
            workspaceId: workspaceId,
            orgId: orgId,
            statusConfigurationId: statusConfig?.statusConfigurationId,
            statusName: a.statusName,
            createdBy: userId,
        }))

        // Process statuses: Create or update
        const statusMap = {}; // Map to store statusId by name
        for (const status of possibleStatus) {
            let statusRecord;
            if (status.statusId) {
                statusRecord = await db.Statuses.findByPk(status.statusId);
                if (statusRecord) {
                    await statusRecord.update(status, {transaction});
                }
            }
            if (!statusRecord) {
                statusRecord = await db.Statuses.create({
                    ...status,
                    statusConfigurationId: statusConfig.statusConfigurationId
                }, {transaction});
            }
            statusMap[status.statusName] = statusRecord.statusId;
        }


        // Remove existing transitions for the status configuration
        await db.StatusesTransition.destroy({
            where: {statusConfigurationId: statusConfig.statusConfigurationId}, transaction
        });

        // Process transitions
        for (const transition of possibleStatusTransition) {
            if (!statusMap[transition.fromStatus] || !statusMap[transition.toStatus]) {
                throw new Error(`Invalid status in transition: ${transition.fromStatus} -> ${transition.toStatus}`);
            }

            await db.StatusesTransition.create({
                statusConfigurationId: statusConfig.statusConfigurationId,
                workspaceId: statusConfiguration.workspaceId,
                orgId: statusConfiguration.orgId,
                fromStatus: statusMap[transition.fromStatus],
                toStatus: statusMap[transition.toStatus],
                createdBy: statusConfiguration.createdBy,
            }, {transaction});
        }

        await transaction.commit();
        return ({
            message: "Status flow configuration saved successfully",
            statusConfigurationId: statusConfig.statusConfigurationId
        });

    } catch (error) {
        await transaction.rollback();
        console.error("Error:", error);
        return ({message: "Error saving status flow configuration", error: error.message});
    }

};


const updateContextFieldValue = async (userId, workspaceId, orgId, recordId, stakeholderId, productId, updatedByUserId, fieldId, fieldValue, contextId) => {

    if (!orgId || (!recordId && !stakeholderId && !userId && !productId)) {
        return {message: "Invalid request"};
    }

    let contextData;

    // If ID is provided, update; otherwise, create a new status configuration
    if (recordId) {
        contextData = await db.RecordContext.findByPk(contextId);
        if (!contextData) {
            return {message: "Context not found"};
        }
        contextData.fieldValue = fieldValue;
        await contextData.save();
    } else if (stakeholderId) {
        contextData = await db.StakeholderContext.findByPk(contextId);
        if (!contextData) {
            return {message: "Context not found"};
        }
        contextData.fieldValue = fieldValue;
        await contextData.save();
    } else if (productId) {
        contextData = await db.ProductContext.findByPk(contextId);
        if (!contextData) {
            return {message: "Context not found"};
        }
        contextData.fieldValue = fieldValue;
        await contextData.save();
    }else if (userId) {
        console.log('PRODUCT CONTEXT :: ', contextId)
        contextData = await db.UserContext.findByPk(contextId);

        if (!contextData) {
            return {message: "Context not found"};
        }
        contextData.fieldValue = fieldValue;
        await contextData.save();
    }

    return "Context updated successfully"
};

const updateRecordWatcher = async (createdBy, workspaceId, orgId, recordId, userId) => {
    const existing = await db.RecordWatcher.findOrCreate({
        where: {
            workspaceId,
            orgId,
            recordId,
            watcherId: userId,
         },
    defaults: {
        workspaceId, orgId, recordId, createdBy, watcherId: userId,
    } },);
        return existing;

};

const deleteRecordWatcher = async (userId, workspaceId, orgId, recordId, recordWatcherId) => {
    let existing;


    existing = await db.RecordWatcher.findOne({
        where: {workspaceId, orgId, recordId, watcherId: recordWatcherId ? recordWatcherId : userId,},
    });


    if (existing) {
        return await existing.destroy();
    } else {
        return "Watcher does not exist"
    }

};



const updateRecordViewer = async (createdBy, workspaceId, orgId, recordId, userId) => {
    const existing = await db.RecordWatcher.findOne({
        where: {
            workspaceId,
            orgId,
            recordId,
            createdBy,
            viewerId: userId ? userId : createdBy,
        },
    });

    if (existing) {

        return existing;
    } else {
        return await db.RecordViewer.create({
            workspaceId, orgId, recordId, createdBy, viewerId: userId ? userId : createdBy,
        });
    }
};

const deleteRecordViewer = async (userId, workspaceId, orgId, recordId, recordViewerId) => {
    let existing;


    existing = await db.RecordViewer.findOne({
        where: {workspaceId, orgId, recordId, viewerId: recordViewerId,},
    });


    if (existing) {
        return await existing.destroy();
    } else {
        return "Watcher does not exist"
    }

};


const getRecords = async (req, res) => {

    req.body?.getThisData?.include?.push({
        datasource: "StatusesTransition",
        as: "possiblestatusestransition",
        required: false,
        order: [],
        attributes: ["fromStatus", "toStatus"],
        include: [{
            datasource: 'Statuses', as: "to", attributes: ["statusId", "statusName"],
        },],

    },)

    console.log("getRecords", req.body?.getThisData?.include)
    let searchDbQueryResult = await searchRecord(req, res);

    return searchDbQueryResult;
}


const getPossibleStatusTransitions = async (userId, workspaceId, orgId, fromStatusId) => {

    const possibleTransitions = await db.StatusesTransition.findAll({
        where: {
            fromStatus: fromStatusId
        }, attributes: ["fromStatus", "toStatus"], include: [{
            model: db.Statuses, as: "to", attributes: ["statusId", "statusName"],
        },],
    })
    return possibleTransitions
}

const circularPairs = {
    "blocks": "is_blocked_by",
    "is_blocked_by": "blocks",
    "depends_on": "is_depended_on_by",
    "is_depended_on_by": "depends_on",
    "clones": "is_cloned_by",
    "is_cloned_by": "clones",
    "duplicates": "is_duplicated_by",
    "is_duplicated_by": "duplicates",
    "causes": "is_caused_by",
    "is_caused_by": "causes"
};

const createRecordLink = async (userId, workspaceId, orgId, recordIdA, recordIdB, linkType) => {
    if (recordIdA === recordIdB) {
        throw new Error("A record cannot be linked to itself.");
    }

    // Check if the reverse relationship already exists
    const existingReverseLink = await db.RecordLink.findOne({
        where: {
            recordIdA: recordIdB, recordIdB: recordIdA, linkType: circularPairs[linkType] || null,
        }
    });

    if (existingReverseLink) {
        throw new Error(`Circular dependency detected: ${recordIdA} ${linkType} ${recordIdB}, but ${recordIdB} already has ${circularPairs[linkType]} with ${recordIdA}.`);
    }

    // Check if the same link already exists
    const existingLink = await db.RecordLink.findOne({
        where: {
            recordIdA, recordIdB, linkType
        }
    });

    if (existingLink) {
        throw new Error("This link already exists.");
    }

    // Create the link
    return await db.RecordLink.create({
        recordIdA, recordIdB, linkType, workspaceId, orgId, createdBy: userId
    });
};

const deleteRecordLink = async (userId, recordLinkId) => {
    const link = await db.RecordLink.findByPk(recordLinkId);
    if (!link) {
        throw new Error("Link not found.");
    }

    const {recordIdA, recordIdB, linkType} = link;

    // Find the reverse link if it exists
    const reverseLinkType = circularPairs[linkType] || null;
    if (reverseLinkType) {
        await db.RecordLink.destroy({
            where: {
                recordIdA: recordIdB, recordIdB: recordIdA, linkType: reverseLinkType
            }
        });
    }

    // Delete the original link
    await db.RecordLink.destroy({where: {recordLinkId}});

    return {message: "Link and its reverse relationship deleted successfully."};
};


const getLinkedRecords = async (userId, workspaceId, orgId, recordId) => {
    const links = await db.RecordLink.findAll({
        where: {
            [Op.or]: [{recordIdA: recordId}, {recordIdB: recordId}]
        },
        include:[
            {
                model: db.Record,
                as: 'recordADetail',
                include:[
                    {
                        model: db.User,
                        as: 'assignedto'
                    },
                    {
                        model: db.Statuses,
                        as: "currentstatusdetail",
                    },

                ]
            },
            {
                model: db.Record,
                as: 'recordBDetail',
                include:[
                    {
                        model: db.User,
                        as: 'assignedto'
                    },
                    {
                        model: db.Statuses,
                        as: "currentstatusdetail",
                    },
                ]
            },
        ]
    });

    return links.map(link => ({
        ...link.toJSON(), reverseLinkType: circularPairs[link.linkType] || null
    }));
};





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
        where: buildWhereClause(where || {}) ,
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

async function submitRecord(req) {
    const {
        workspaceId,
        ntfSessionId,
        orgId,
        reportedBy,
        submittedBy,
        recordMetadata,
        recordData,
        recordType,
        recordSource,
        userInfo,
    } = req.body;
    const transaction = await db.sequelize.transaction();
    try {
        const createSessionResponse = await Persister.createSession(workspaceId, ntfSessionId, orgId, transaction);
        console.log("Session ID:", createSessionResponse?.sessionId);

        // Check if Stakeholder is created or retrieved correctly
        const stakeholder = await Persister.findOrCreateStakeholder(reportedBy, workspaceId, orgId, transaction);

        console.log("Stakeholder ID:", JSON.stringify(stakeholder)); // Confirm profile is created

        const recordResponse = await Persister.createRecord(workspaceId, orgId, createSessionResponse.sessionId, stakeholder.stakeholderId, stakeholder.stakeholderId, recordType, recordSource, transaction);
        console.log("RECORD ID - ", recordResponse?.recordId);


        console.log("Record Data Final :: ", recordData);

        const recordDataResponse = await Persister.createRecordData(workspaceId, orgId, recordResponse?.recordId, recordData, transaction);
        console.log(recordDataResponse);



        await transaction.commit();
        return recordResponse;
    } catch (err) {
        console.error("Error during transaction:", err);
        await transaction.rollback();
        throw new Error("Record creation failed");
    }
}

const setupWorkspace = async (userId, orgId, name, description, status, workspaceMetadata) => {
    const transaction = await db.sequelize.transaction();

    try {
        let workspaceCreateRes = await Persister.createWorkspace(orgId, name, description, status, transaction);

        if (workspaceCreateRes) {
            if (!lodash.isEmpty(workspaceMetadata)) {
                workspaceCreateRes.workspacemetadata = await Persister.createWorkspaceMetadata(workspaceCreateRes.workspaceId, workspaceMetadata, transaction);
            }
            let userWorkspaceLink = [{
                userId: userId,
                workspaceId: workspaceCreateRes?.workspaceId,
                userWorkspaceRole: "OWNER",
                userInviteBy: userId
            }];
            workspaceCreateRes.linkedUser = await authService.createUserWorkspaceLink(userId, workspaceCreateRes.workspaceId, orgId, userWorkspaceLink, transaction)
        }
        transaction.commit();

        return workspaceCreateRes;
    } catch (err) {
        console.log(err);
        transaction.rollback();
        throw new Error("Workspace setup failed");
    }
};

const editWorkspace = async (userId, workspaceId, orgId, name, description, status, url, createdBy, managedBy, defaultAssignee) => {

    if (!workspaceId) {
        throw new Error("Invalid Request")
    }
    let workspaceObj = await db.Workspace.findByPk(workspaceId)

    if (workspaceObj) {

        workspaceObj.name = name;
        workspaceObj.description = description;
        workspaceObj.status = status;
        workspaceObj.url = url
        workspaceObj.createdBy = createdBy
        workspaceObj.managedBy = managedBy
        workspaceObj.defaultAssignee = defaultAssignee
        workspaceObj.lastUpdatedBy = userId

        await workspaceObj.save();

    }

    return workspaceObj;

};

const updateContext = async (userId, workspaceId, orgId, recordId, stakeholderId, contextValue, contextId, stakeholderContextId, recordContextId) => {
    if (stakeholderId) {
        let ctxObj = {
            stakeholderId: stakeholderId,
            workspaceContextId: contextId,
            stakeholderContextValue: contextValue,
            updatedBy: userId
        }
        return await db.StakeholderContext.findOrCreate({
            where: {
                stakeholderId: stakeholderId, workspaceContextId: contextId, stakeholderContextId: stakeholderContextId
            }, defaults: ctxObj
        })
    } else if (recordId) {
        let ctxObj = {
            recordId: recordId, workspaceContextId: contextId, recordContextValue: contextValue, updatedBy: userId
        }
        return await db.RecordContext.findOrCreate({
            where: {
                recordId: recordId, workspaceContextId: contextId, recordContextId: recordContextId
            }, defaults: ctxObj
        })
    }

};


const editComment = async (userId, workspaceId, orgId, commentId, comment, recordId) => {
    let commentObj = await db.Comment.findByPk(commentId);

    if (commentObj && commentObj.commentedBy === userId) {
        commentObj.comment = comment;
        return await commentObj.save();
    } else {
        return "Invalid Request"
    }

};

const createConfiguration = async (userId, workspaceId, orgId, contextConfigurationId, contextConfigurationStatus ,contextConfigurationType, contextConfigurationName, contextConfigurationDescription, contextConfigurationSectionLabel, fieldList) => {
    try {
        let contextData;

        if (contextConfigurationId) {
            // Fetch existing configuration
            const contextConfigObj = await db.ContextConfiguration.findByPk(contextConfigurationId);
            if (!contextConfigObj) {
                return "Configuration not found.";
            }


            // Update existing configuration
            contextConfigObj.contextConfigurationName = contextConfigurationName;
            contextConfigObj.contextConfigurationStatus = contextConfigurationStatus;
            contextConfigObj.contextConfigurationDescription = contextConfigurationDescription;
            contextConfigObj.contextConfigurationType = contextConfigurationType
            contextConfigObj.contextConfigurationSectionLabel = contextConfigurationSectionLabel
            contextData = await contextConfigObj.save();
        } else {
            // Create new configuration
            contextData = await db.ContextConfiguration.create({
                workspaceId,
                orgId,
                contextConfigurationName,
                contextConfigurationStatus,
                contextConfigurationDescription,
                contextConfigurationType,
                contextConfigurationSectionLabel,
                createdBy: userId,
            });
        }

        if (contextData && fieldList && fieldList.length > 0) {
            const fieldObjects = fieldList.map((field) => ({
                ...(field.workspaceFieldId && {workspaceFieldId: field.workspaceFieldId}),
                workspaceId,
                orgId,
                fieldStatus: field.fieldStatus,
                fieldEntityType: field.fieldEntityType,
                fieldLabel: field.fieldLabel,
                fieldType: field.fieldType,
                fieldKey: field.fieldKey,
                fieldOption: field.fieldOption,
                fieldToolTipText: field.fieldToolTipText,
                fieldIsMandatory: field.fieldIsMandatory,
                contextConfigurationId: contextData.contextConfigurationId,
                createdBy: userId,
            }));

            // Use Promise.all with map instead of forEach
            await Promise.all(fieldObjects.map(field => db.WorkspaceField.upsert(field)));
        }
        return contextConfigurationId ? "Configuration Updated successfully." : "Configuration Created successfully.";
    } catch (error) {
        console.error("Error in createConfiguration:", error);
        return "An error occurred while processing the configuration.";
    }
};


const checkFieldKeyAvailability = async (userId, workspaceId, orgId, contextConfigId, fieldId, fieldKey) => {
    try {
        const fieldObj = await db.WorkspaceField.findAll({
            where: {
                fieldKey: fieldKey?.trim(), workspaceId: workspaceId, orgId: orgId, ...(fieldId && {
                    workspaceFieldId: {
                        [Op.ne]: fieldId
                    }
                })
            }
        });
        if (fieldObj && fieldObj.length > 0) {
            return {status: 'N', message: "The Field Key Name is not available"};
        } else {
            return {status: 'Y', message: "The Field Key is available"}
        }

    } catch (error) {
        console.error("Error in checkFieldKeyAvailability:", error);
        return "An error occurred while processing the configuration.";
    }
};


const acceptUserInvite = async (userInviteEmail, userId, orgId, userInviteCode) => {
    let userInviteEmailObj = await db.UserInvite.findByPk(userInviteEmail);
    if (userInviteEmailObj) {
        if (userInviteEmailObj.userInviteCode == userInviteCode) {
            userInviteEmailObj.status = 'ACCEPTED';
            await Promise.all(authService.createUserOrgLink(userId, orgId, "MEMBER"), userInviteEmailObj.save())
            return "User is linked with Org successfully";
        } else {
            return "Invite Code is incorrect"
        }
    } else {
        return "No invite was to this Email"
    }

}

const declineUserInvite = async (userInviteEmail, userId, orgId) => {
    let userInviteEmailObj = await db.UserInvite.findByPk(userInviteEmail);
    if (userInviteEmailObj) {
        userInviteEmailObj.status = 'DECLINED';
        await userInviteEmailObj.save()
        return "Invite is Declined successfully";
    } else {
        return "No invite was to this Email"
    }

}

const checkUserExist = async (userId, email, orgId) => {
    const userObj = await db.User.findOne({where: {email: email, orgId: orgId, ...(userId && {userId: userId})}});
    if (userObj) {
        return userObj;
    } else {
        return "User does not exist";
    }
}


const createChannel = async (userId, channelId, channelName, channelDescription, channelBaseType, channelAPIKey, orgId, workspaceId) => {
    let channelObj = {
        ...(channelId && {channelId: channelId}),
        channelName: channelName,
        channelDescription: channelDescription,
        channelBaseType: channelBaseType,
        channelAPIKey: channelAPIKey,
        orgId: orgId,
        workspaceId: workspaceId,
        createdBy: userId
    }
    if (channelId) {
        const [bucketReadedOrj, created] = await db.Channel.findOrCreate({
            where: {channelId: channelId, orgId: orgId, workspaceId: workspaceId}, defaults: channelObj
        });
        if (created) {
            return "New Channel is created";
        } else {
            return "Channel is updated";
        }
    } else {
        const channelcreatedobj = await db.Channel.create(channelObj);
        if (channelcreatedobj) {
            return "New Channel is created";
        } else {
            return "Channel is updated";
        }
    }
}

const sendUserInvite = async (userInviteEmail, userId, orgId) => {
    const myMap = new Map();
    const emailSendSuccessMap = new Map();
    const newInviteSentList = [];
    console.log("userInviteEmail ", userInviteEmail);

    const emails = userInviteEmail.includes(',') ? userInviteEmail.split(',') : [userInviteEmail];

    for (let email of emails) {
        email = email.trim();

        // Check if the invite has already been sent
        const alreadyInvited = await db.UserInvite.findOne({
            where: {userInviteEmail: email, orgId: orgId, status: 'INVITED'}
        });
        if (alreadyInvited) {
            console.log(`Invite already sent to ${email}. Skipping.`);
            myMap.set(email, alreadyInvited?.userInviteCode);
            const isEmailSent = await MailerUtil.sendEmail(email, "Membership Invite Has Been Sent", `Membership Invite code is ${myMap.get(email)}`)
            emailSendSuccessMap.set(email, isEmailSent);
        } else {
            myMap.set(email, generateUniqueNumericCode());
            const isEmailSent = await MailerUtil.sendEmail(email, "Membership Invite Has Been Sent", `Membership Invite code is ${myMap.get(email)}`)
            emailSendSuccessMap.set(email, isEmailSent);
            if (isEmailSent) {
                newInviteSentList.push(email);
            }
        }


    }


    if (newInviteSentList && newInviteSentList.length > 0) {
        await Persister.sendUserInvite(newInviteSentList, userId, orgId, myMap);
        console.log(`Invite sent successfully to ${newInviteSentList}`);
    } else {
        console.log(`Failed to send the invite to ${newInviteSentList}`);
    }

    return "Invite process completed";
};


const deleteAPIChannel = async (userId, workspaceId, orgId, apiChannelId) => {

    if (!apiChannelId && !workspaceId && !orgId) {
        return {message: "Invalid request"}
    }

    const loadedData = await db.APIChannel.findByPk(apiChannelId);

    if (loadedData) {

        loadedData.tagStatus = "ARCHIVED";
            await loadedData.save();
            return {message: "The API Channel has been archived successfully"}
     } else {
        return {message: "Invalid API Channel"}
    }

}



function generateApiToken() {
     return crypto.randomBytes(16).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 22);
}


function isValidName(name, isProjectOrSubscription = false) {
    // 1. Each name must be less than 64 characters in length.
    // 2. Each name must be at least one character.
    // 3. Each name must pass validation of this regex expression: [A-Z]([-A-Z0-9]*[A-Z0-9])?
    // 4. Each project or subscription name must be 30 characters or less.
    const maxLength = isProjectOrSubscription ? 30 : 63;
    const regex = /^[A-Z]([-A-Z0-9]*[A-Z0-9])?$/;

    return (
        typeof name === "string" &&
        name.length >= 1 &&
        name.length <= maxLength &&
        regex.test(name)
    );
}



const createEditAPIChannel = async (userId, workspaceId, orgId, apiChannelId, apiChannelName, apiChannelDescription, apiChannelStatus, layoutId) => {

    const apiChannelObj = {
        ...(apiChannelId && { apiChannelId }),
        apiChannelName,
        apiChannelDescription,
        apiChannelStatus,
        apiChannelKey: generateApiToken(),
        orgId,
        workspaceId,
        layoutId,
        createdBy: userId,
    };

    let response = "";
    let createdUpdatedObj;

    if (apiChannelId) {
        const loadedChannel = await db.APIChannel.findByPk(apiChannelId);
        if (loadedChannel) {
            loadedChannel.apiChannelName = apiChannelName;
            loadedChannel.apiChannelDescription = apiChannelDescription;
            loadedChannel.apiChannelStatus = apiChannelStatus;
            loadedChannel.layoutId = layoutId
            createdUpdatedObj = await loadedChannel.save();
            response = "API Channel is updated";
        } else {
            throw new Error(`API Channel with ID ${apiChannelId} not found`);
        }
    } else {
        createdUpdatedObj = await db.APIChannel.create(apiChannelObj);
        response = "API Channel is created";
    }


    return response;
};





const deleteLayout = async (userId, workspaceId, orgId, apiChannelId) => {

    if (!apiChannelId && !workspaceId && !orgId) {
        return {message: "Invalid request"}
    }

    const loadedData = await db.APIChannel.findByPk(apiChannelId);

    if (loadedData) {

        loadedData.tagStatus = "ARCHIVED";
        await loadedData.save();
        return {message: "The API Channel has been archived successfully"}
    } else {
        return {message: "Invalid API Channel"}
    }

}

const createLayout = async (
    userId, workspaceId, orgId, contextConfigurationIdList, layoutId, layoutStatus,
    layoutName, layoutDescription, layoutSchema, statusConfigurationList, layoutType, fieldList
) => {
    const transaction = await db.sequelize.transaction();
    try {
        let contextData;
        let resMsg;

        if (layoutId) {
            const contextConfigObj = await db.Layout.findByPk(layoutId, { transaction });
            if (!contextConfigObj) {
                return "Configuration not found.";
            }

            contextConfigObj.layoutName = layoutName;
            contextConfigObj.layoutStatus = layoutStatus;
            contextConfigObj.layoutDescription = layoutDescription;
            contextConfigObj.layoutSchema = layoutSchema;
            contextConfigObj.layoutType = layoutType;
            contextData = await contextConfigObj.save({ transaction });

            resMsg = "Layout Updated successfully.";

            // **Fetch existing context configurations**
            const existingConfigs = await db.LayoutContextConfig.findAll({
                where: { layoutId },
                attributes: ["contextConfigurationId"],
                transaction
            });

            const existingConfigIds = existingConfigs.map(c => c.contextConfigurationId);

            // **Find configs to remove**
            const configsToRemove = existingConfigIds.filter(id => !contextConfigurationIdList.includes(id));

            // **Find configs to add**
            const configsToAdd = contextConfigurationIdList.filter(id => !existingConfigIds.includes(id));

            // **Remove outdated context configurations**
            if (configsToRemove.length > 0) {
                await db.LayoutContextConfig.destroy({
                    where: {
                        layoutId,
                        contextConfigurationId: configsToRemove
                    },
                    transaction
                });
            }

            // **Insert new context configurations**
            if (configsToAdd.length > 0) {
                await Promise.all(
                    configsToAdd.map(async (i) => {
                        await db.LayoutContextConfig.create({
                            contextConfigurationId: i,
                            layoutId
                        }, { transaction });
                    })
                );
            }

        } else {
            // **Create a new layout**
            contextData = await db.Layout.create({
                workspaceId,
                orgId,
                layoutName,
                layoutStatus,
                layoutDescription,
                statusConfigurationId: statusConfigurationList,
                layoutSchema,
                layoutType,
                createdBy: userId,
            }, { transaction });

            resMsg = "Layout Created successfully.";

            // **Insert context configurations for new layout**
            if (contextConfigurationIdList && contextConfigurationIdList.length > 0) {
                await Promise.all(
                    contextConfigurationIdList.map(async (i) => {
                        await db.LayoutContextConfig.create({
                            contextConfigurationId: i,
                            layoutId: contextData.layoutId
                        }, { transaction });
                    })
                );
            }
        }

        await transaction.commit();
        return resMsg;
    } catch (error) {
        await transaction.rollback();
        console.error("Error in Layout:", error);
        return "An error occurred while processing the Layout.";
    }
};





const createRecordType = async (userId, workspaceId, orgId, recordTypeName) => {
    let recordTypeData = await db.Layout.create({
        workspaceId,
        orgId,
        recordTypeName,
        createdBy: userId,
    });
    return recordTypeData ;
};

const createStakeholderType = async (userId, workspaceId, orgId, stakeholderTypeName) => {
    let recordTypeData = await db.Layout.create({
        workspaceId,
        orgId,
        stakeholderTypeName,
        createdBy: userId,
    });
    return recordTypeData ;
};


const getAPIManual = async (userId, workspaceId, orgId, apiChannelId) => {
    try {
        const apiChannelObj = await db.APIChannel.findOne({
            where: {workspaceId, orgId, apiChannelId}
        });

        if (!apiChannelObj) {
            throw new Error("API Channel not found");
        }

        const contextIdList = await db.LayoutContextConfig.findAll({
            where: {layoutId: apiChannelObj.layoutId}, attributes: ["contextConfigurationId"]
        });
        if (!contextIdList.length) {
            throw new Error("No Context Configuration Id found");
        }

        const contextConfigFields = await db.ContextConfiguration.findAll({
            where: {
                contextConfigurationId: {[Op.in]: contextIdList.map(a => a.contextConfigurationId)}
            },
            include: [
                {
                    model: db.WorkspaceField,
                    as: 'workspacefields'
                }
            ]
        })
        if (!contextConfigFields.length) {
            throw new Error("No Context Configuration found");
        }


        console.log("Context IDs Extracted:", contextIdList.map(c => c.contextConfigurationId));


         let mappedRecordFields = contextConfigFields
             ?.filter(a => a?.contextConfigurationType === 'RECORD')
             ?.flatMap(a => a?.workspacefields || [])  // Ensures workspacefields is an array
             ?.map(a => ({
                 fieldId: a?.workspaceFieldId,
                 fieldKey: a?.fieldKey,
                 fieldValue: '',
                 fieldType: a?.fieldType,
             }));


         let mappedRecordDataFields = contextConfigFields
             ?.filter(a => a?.contextConfigurationType === 'RECORD DATA')
             ?.flatMap(a => a?.workspacefields || [])  // Ensures workspacefields is an array
             ?.map(a => ({
                 fieldId: a?.workspaceFieldId,
                 fieldKey: a?.fieldKey,
                 fieldValue: '',
                 fieldType: a?.fieldType,
             }));

         let mappedStakeholderFields = contextConfigFields
             ?.filter(a => a?.contextConfigurationType === 'STAKEHOLDER')
             ?.flatMap(a => a?.workspacefields || [])  // Ensures workspacefields is an array
             ?.map(a => ({
                 fieldId: a?.workspaceFieldId,
                 fieldKey: a?.fieldKey,
                 fieldValue: '',
                 fieldType: a?.fieldType,
             }));


        let reqJson = {
            record: {
                recordTitle: '',
                recordDescription: '',
                recordContext: mappedRecordFields,
                recordData: mappedRecordDataFields
            }, stakeholder: {
                firstName: '',
                lastName: '',
                email: '',
                number: '',
                cbrEmail: '',
                cbrNumber: '',
                stakeholderContext: mappedStakeholderFields
            }
        }
        // Return the populated map
        // return Object.fromEntries(contextMap);
        return reqJson;
    } catch (error) {
        console.error("Error fetching API Manual:", error.message);
        return null;
    }
};


async function submitRecord1(req) {
    const { record, stakeholder } = req.body;
    const apiKey = req.headers.apikey;

    if (!apiKey) {
        throw new Error("API Key is required");
    }

    console.log("API Key:", apiKey);

    const transaction = await db.sequelize.transaction();
    try {
        // Fetch API Channel
        const apichannel = await db.APIChannel.findOne({
            where: { apiChannelKey: apiKey },
            include: [{ model: db.Layout, as: "layoutdetail" }]
        });

        if (!apichannel) {
            throw new Error("Invalid API Key or API Channel not found");
        }

        const { workspaceId, orgId } = apichannel;

        // Start session
        const createSessionResponse = await Persister.createSession(workspaceId, orgId, transaction);
        console.log("Session ID:", createSessionResponse?.sessionId);

        // Find or create stakeholder
        const stakeholderObj = await Persister.findOrCreateStakeholder(stakeholder, workspaceId, orgId, apichannel, transaction);
        console.log("Stakeholder:", JSON.stringify(stakeholderObj));

        // Create record
        const recordResponse = await Persister.createRecord(
            workspaceId,
            orgId,
            createSessionResponse.sessionId,
            stakeholderObj.stakeholderId,
            stakeholderObj.stakeholderId,
            record,
            apichannel,
            transaction
        );

        if (!recordResponse?.recordId) {
            throw new Error("Failed to create record");
        }

        console.log("Record ID:", recordResponse.recordId);

        // Create Record Data
        if (record?.recordData) {
            await Persister.createRecordData(workspaceId, orgId, recordResponse.recordId, record.recordData, transaction);
        }

        // Fetch related layout configurations
        const contextIdList = await db.LayoutContextConfig.findAll({
            where: { layoutId: apichannel.layoutId },
            attributes: ["contextConfigurationId"],
            include: [{ model: db.ContextConfiguration, as: "configdetail" }]
        });

        const recordWorkspaceFields = await db.WorkspaceField.findAll({
            where: {
                contextConfigurationId: {
                    [Op.in]: contextIdList
                        .filter(a => (a?.configdetail?.contextConfigurationType === "RECORD"))
                        .map(a => a.contextConfigurationId)
                }
            }
        });

        const recordDataWorkspaceFields = await db.WorkspaceField.findAll({
            where: {
                contextConfigurationId: {
                    [Op.in]: contextIdList
                        .filter(a => (a?.configdetail?.contextConfigurationType === "RECORD DATA"))
                        .map(a => a.contextConfigurationId)
                }
            }
        });

        const stakeholderWorkspaceFields = await db.WorkspaceField.findAll({
            where: {
                contextConfigurationId: {
                    [Op.in]: contextIdList
                        .filter(a => a?.configdetail?.contextConfigurationType === "STAKEHOLDER")
                        .map(a => a.contextConfigurationId)
                }
            }
        });

        const recordFieldObjects = recordWorkspaceFields.map(field => ({
            recordId: recordResponse.recordId,
            fieldKey: field.fieldKey,
            fieldId: field.workspaceFieldId,
            orgFieldId: null,
            fieldValue: record?.recordContext?.find(a => a.fieldId == field.workspaceFieldId)?.fieldValue || null,
            updatedBy: 1
        }));
        // Bulk insert record context fields
        if (recordFieldObjects.length > 0) {
            await db.RecordContext.bulkCreate(recordFieldObjects, { transaction });
        }
        console.log("Record Context Fields:", recordFieldObjects);


        const recordDataFieldObjects = recordDataWorkspaceFields.map(field => ({
            recordId: recordResponse.recordId,
            fieldKey: field.fieldKey,
            fieldId: field.workspaceFieldId,
            orgFieldId: null,
            fieldValue: record?.recordData?.find(a => a.fieldId == field.workspaceFieldId)?.fieldValue || null,
            updatedBy: 1
        }));
        // Bulk insert record context fields
        if (recordDataFieldObjects.length > 0) {
            await db.RecordContext.bulkCreate(recordDataFieldObjects, { transaction });
        }


        const stakeholderFieldObjects = stakeholderWorkspaceFields.map(field => ({
            stakeholderId: stakeholderObj.stakeholderId,
            fieldKey: field.fieldKey,
            fieldId: field.workspaceFieldId,
            orgFieldId: null,
            fieldValue: stakeholder?.stakeholderContext?.find(a => a.fieldId == field.workspaceFieldId)?.fieldValue || null,
            updatedBy: 1
        }));
        console.log("Stakeholder Context Fields:", stakeholderFieldObjects);
        // Bulk insert record context fields
        if (stakeholderFieldObjects.length > 0) {
            await db.StakeholderContext.bulkCreate(stakeholderFieldObjects, { transaction });
        }

        await transaction.commit();
        return recordResponse;
    } catch (err) {
        console.error("Error during transaction:", err.message);
        await transaction.rollback();
        throw new Error(`Record creation failed: ${err.message}`);
    }
}


const createEditPortal = async (userId,
                                workspaceId, orgId, portalId, portalName, portalDescription) => {

    const portalObj = {
        ...(portalId && { portalId }),
        workspaceId, orgId, portalName, portalDescription,

         createdBy: userId,
    };

    let response = "";
    let createdUpdatedObj;

    if (portalId) {
        const loadedPortal = await db.WorkspacePortal.findByPk(portalId);
        if (loadedPortal) {
            loadedPortal.portalName = portalName;
            loadedPortal.portalDescription = portalDescription;

            createdUpdatedObj = await loadedPortal.save();
            response = "Portal is updated";
        } else {
            throw new Error(`Portal with ID ${portalId} not found`);
        }
    } else {
        createdUpdatedObj = await db.WorkspacePortal.create(portalObj);
        response = "Portal is created";
    }


    return response;
};


const createEditPortalGroup = async (
    userId, workspaceId, orgId, portalId, portalGroupId,
    portalGroupName, portalGroupDescription, portalGroupInputConfig
) => {
    const transaction = await db.sequelize.transaction();
    try {
        let contextData;
        let resMsg;

        if (portalGroupId) {
            // **Find existing portal group**
            const portalGroup = await db.PortalGroup.findByPk(portalGroupId, { transaction });
            if (!portalGroup) {
                await transaction.rollback();
                return "Configuration not found.";
            }

            // **Update portal group**
            portalGroup.portalGroupName = portalGroupName;
            portalGroup.portalGroupDescription = portalGroupDescription;
            await portalGroup.save({ transaction });

            resMsg = "Portal Group updated successfully.";

            // **Fetch existing field configurations**
            const existingConfigs = await db.PortalGroupFieldConfig.findAll({
                where: { portalGroupId },
                attributes: ["contextConfigurationId"],
                transaction
            });

            const existingConfigIds = existingConfigs.map(c => c.contextConfigurationId);

            // **Determine changes**
            const configsToRemove = existingConfigIds.filter(id => !portalGroupInputConfig.includes(id));
            const configsToAdd = portalGroupInputConfig.filter(id => !existingConfigIds.includes(id));

            // **Remove outdated configs**
            if (configsToRemove.length > 0) {
                await db.PortalGroupFieldConfig.destroy({
                    where: {
                        portalGroupId,
                        contextConfigurationId: configsToRemove
                    },
                    transaction
                });
            }

            // **Insert new configurations**
            for (const configId of configsToAdd) {
                await db.PortalGroupFieldConfig.create({
                    contextConfigurationId: configId,
                    portalGroupId,
                    portalId
                }, { transaction });
            }

        } else {
            // **Create a new portal group**
            contextData = await db.PortalGroup.create({
                workspaceId,
                orgId,
                portalId,
                portalGroupName,
                portalGroupDescription,
                createdBy: userId,
            }, { transaction });

            resMsg = "Portal Group created successfully.";

            // **Insert configurations**
            for (const configId of portalGroupInputConfig) {
                await db.PortalGroupFieldConfig.create({
                    contextConfigurationId: configId,
                    portalGroupId: contextData.id,
                    portalId
                }, { transaction });
            }
        }

        await transaction.commit();
        return resMsg;
    } catch (error) {
        await transaction.rollback();
        console.error("Error in Layout:", error);
        return "An error occurred while processing the Portal Group.";
    }
};



const deletePortalGroup = async (
    userId, workspaceId, orgId, portalId, portalGroupId,

) => {
         let resMsg;

             // **Find existing portal group**
            const portalGroup = await db.PortalGroup.findByPk(portalGroupId);
            if (!portalGroup) {
                 return "Portal Group not found.";
            }

    const portalGroupConfigs = await db.PortalGroupFieldConfig.destroy({
        where: {
            portalGroupId
        }
    })

    if(portalGroupConfigs){
        await portalGroup.destroy(); resMsg = "Portal Group deleted successfully.";
    }else{
        resMsg = "Portal Group deletion failed.";
    }
  return resMsg;

};


const createEditUserStatus = async (userId,
                                    workspaceId, orgId, userStatusId, userStatusName, userStatusColor, isSystemDefined) => {

    const userStatusObj = {
        ...(userStatusId && { userStatusId }),
        workspaceId, orgId, userStatusName, userStatusColor, isSystemDefined,
        createdBy: userId,
    };

    let response = "";
    let createdUpdatedObj;

    if (userStatusId) {
        const loadedUserStatus = await db.UserStatus.findByPk(userStatusId);
        if (loadedUserStatus) {
            loadedUserStatus.userStatusName = userStatusName;
            loadedUserStatus.userStatusColor = userStatusColor;


            createdUpdatedObj = await loadedUserStatus.save();
            response = "UserStatus is updated";
        } else {
            throw new Error(`UserStatus with ID ${userStatusId} not found`);
        }
    } else {
        createdUpdatedObj = await db.UserStatus.create(userStatusObj);
        response = "UserStatus is created";
    }


    return response;
};



const createEditUserStatusGroup = async (userId,
                                         workspaceId, orgId, userStatusGroupId, userStatusGroupName, userStatusList, isSystemDefined) => {

    const userStatusObj = {
        ...(userStatusGroupId && { userStatusGroupId }),
        workspaceId, orgId, userStatusGroupName,   isSystemDefined,
        createdBy: userId,
    };

    let response = "";
    let createdUpdatedObj;

    if (userStatusGroupId) {
        const loadedUserStatus = await db.UserStatusGroup.findByPk(userStatusGroupId);
        if (loadedUserStatus) {
            loadedUserStatus.userStatusName = userStatusGroupName;
            await db.UserStatusGroupLink.destroy({where: {userStatusGroupId}})
            const userStatusGroupLinkObj = userStatusList.map(a => ({
                userStatusGroupId : createdUpdatedObj.userStatusGroupId,
                userStatusId: a,
                addedBy :  userId,
                workspaceId, orgId,
            }))
            await db.UserStatusGroupLink.bulkCreate(userStatusGroupLinkObj)

            createdUpdatedObj = await loadedUserStatus.save();
            response = "UserStatus is updated";
        } else {
            throw new Error(`UserStatus with ID ${userStatusId} not found`);
        }
    } else {
        createdUpdatedObj = await db.UserStatusGroup.create(userStatusObj);
        const userStatusGroupLinkObj = userStatusList.map(a => ({
            userStatusGroupId : createdUpdatedObj.userStatusGroupId,
            userStatusId: a,
            addedBy :  userId,
            workspaceId, orgId,
        }))
        await db.UserStatusGroupLink.bulkCreate(userStatusGroupLinkObj)
        response = "UserStatus Group is created";
    }


    return response;
};

module.exports = {
    submitRecord,
    setupWorkspace,
    searchRecord,
    createComment,
    createStakeholderComment,
    sendUserInvite,
    editComment,
    setupZomatoIntegration,
    acceptUserInvite,
    deleteComment,
    deleteStakeholderComment,
    editStakeholderComment,
    checkUserExist,
    declineUserInvite,
    updateContext,
    createConfiguration,
    createChannel,
    createEditTags,
    createEditTeam,
    createEditProduct,
    getUser,
    updateUser,
    editWorkspace,
    addRecordStakeholderProducts,
    addRecordStakeholderTags,
    deleteRecordStakeholderProducts,
    deleteRecordStakeholderTags,
    updateStatus,
    updateAssignee,
    addTeamTag,
    deleteTeamTag,
    createEditStatusFlow,
    deleteTags,
    updateContextFieldValue,
    getRecords,
    getPossibleStatusTransitions,
    updateRecordWatcher,
    deleteRecordWatcher,
    createRecordLink,
    deleteRecordLink,
    getLinkedRecords,
    deleteProduct,
    deleteTeam,
    deleteStatusFlow,
    deleteContextConfiguration,
    checkFieldKeyAvailability,
    createEditAPIChannel,
    deleteAPIChannel,
    createLayout,
    createRecordType,
    createStakeholderType,
    getAPIManual,
    updateRecordViewer,
    deleteRecordViewer,
    submitRecord1,
    createEditPortal,
    createEditPortalGroup,
    deletePortalGroup,
    createEditUserStatus,
    createEditUserStatusGroup
};
