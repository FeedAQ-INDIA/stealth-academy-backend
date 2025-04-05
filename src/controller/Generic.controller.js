const xmService = require("../service/XmService.service.js");
const authService = require("../service/Auth.service.js");
const jwt = require("jsonwebtoken");
const lodash = require("lodash");
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const logger = require("../config/winston.config");

async function setupZomatoIntegration(req, res, next) {
    const {workspaceId, orgId, storeId} = req.body;
    try {
        let val = await xmService.setupZomatoIntegration(workspaceId, orgId, storeId);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}

async function setupIntegration(req, res, next) {
    const {workspaceId, orgId, integrationId} = req.body;
    try {
        let val = null;
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}


async function sendUserInvite(req, res, next) {
    const {userInviteEmail, workspaceId, orgId} = req.body;
    try {
        let val = await xmService.sendUserInvite(userInviteEmail, req.user.userId, orgId);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}


async function acceptUserInvite(req, res, next) {
    const {orgId, userInviteCode} = req.body;

    try {
        let val = await xmService.acceptUserInvite(req.user.email, req.user.userId, orgId, userInviteCode);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}

async function declineUserInvite(req, res, next) {
    const {userInviteEmail, orgId} = req.body;

    try {
        let val = await xmService.declineUserInvite(userInviteEmail, orgId);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}

async function checkUserExist(req, res, next) {
    const {email, orgId} = req.body;

    try {
        let val = await xmService.checkUserExist(req.user.userId, email, orgId);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}



async function createChannel(req, res, next) {
    const {channelId, channelName, channelDescription, channelBaseType, channelAPIKey,  orgId, workspaceId } = req.body;

    try {
        let val = await xmService.createChannel(req.user.userId, channelId, channelName, channelDescription, channelBaseType, channelAPIKey,  orgId, workspaceId);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}



async function createWorkspaceUserLink(req, res, next) {
    const {
        workspaceId,
        orgId,
        workspaceUserLink
    } = req.body;

    try {
        let val = await authService.createUserWorkspaceLink(req.user.userId, workspaceId, orgId, workspaceUserLink, null)
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}


async function deleteWorkspaceUserLink(req, res, next) {
    const {
        workspaceId,
        workspaceUserLink
    } = req.body;

    try {
        let val = await authService.deleteWorkspaceUserLink(req.user.userId, workspaceId, workspaceUserLink , null)
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}


async function createUserOrgLink(req, res, next) {
    const {userId, orgId, workspaceId, userOrgRole, userWorkspaceRole} = req.body;
    try {
        let val = await authService.createUserOrgLink(userId, orgId,  userOrgRole, null);

        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}




async function deleteUserOrgLink(req, res, next) {
    const {userId, orgId} = req.body;
    try {
        let val = await authService.deleteUserOrgLink(userId, orgId, null);

        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}


async function createOrg(req, res, next) {
    const {orgName, orgEmail, orgNumber, metadata, orgHeadCount, orgDomain} = req.body;
    console.log("createOrg() :: request started");
    try {
        let val = await authService.createOrg(req?.user?.userId,  orgName, orgEmail, orgNumber, metadata, orgHeadCount, orgDomain);
        if(val){
            let claims = {
                userId: req?.user?.userId,
                userEmail: req?.user?.userEmail,
                activeOrg: val?.orgId,
                isTemp: false
            };
            res.cookie("refreshToken", jwt.sign(claims, refreshTokenSecret, {
                expiresIn: "15m",
            }), {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });

            res.status(200).send({
                status: 200, message: "Success", accessToken: jwt.sign(claims, accessTokenSecret, {
                    expiresIn: "15s",
                }), data: val != null ? val : [],
            });
        }

        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });

    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}



async function switchOrg(req, res, next) {
    const {currentorgId, switchToOrgId} = req.body;
    console.log("createOrg() :: request started");
    try {
        let val = await authService.switchOrg(req?.user?.userId,  currentorgId, switchToOrgId);
        if(val){
            let claims = {
                userId: req?.user?.userId,
                userEmail: req?.user?.userEmail,
                activeOrg: val?.orgId,
                isTemp: false
            };
            res.cookie("refreshToken", jwt.sign(claims, refreshTokenSecret, {
                expiresIn: "15m",
            }), {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });

            res.status(200).send({
                status: 200, message: "Success", accessToken: jwt.sign(claims, accessTokenSecret, {
                    expiresIn: "15s",
                }), data: val != null ? val : [],
            });
        }else{
            res.status(200).send({
                status: 200, message: "Success", data: val != null ? val : [],
            });
        }



    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}




async function updateOrg(req, res, next) {
    const {orgId, orgName, orgEmail, orgNumber,  orgHeadCount, orgDomain} = req.body;
    console.log("updateOrg() :: request started");
    try {
        let val = await authService.updateOrg(req?.user?.userId, orgId,  orgName, orgEmail, orgNumber,   orgHeadCount, orgDomain);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}





async function joinOrg(req, res, next) {
    const {joinCode} = req.body;
    console.log("createOrg() :: request started");
    try {
        let val = await authService.joinOrg(req?.user?.userId, joinCode);

        if(val?.type == 'S'){
            let claims = {
                userId: req?.user?.userId,
                userEmail: req?.user?.userEmail,
                activeOrg: val?.joinedOrgId,
                isTemp: false
            };

            res.cookie("refreshToken", jwt.sign(claims, refreshTokenSecret, {
                expiresIn: "15m",
            }), {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });

            res.status(200).send({
                status: 200, message: "Success", accessToken: jwt.sign(claims, accessTokenSecret, {
                    expiresIn: "15s",
                }), data: val != null ? val : [],
            });
        }


        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}


async function setupWorkspace(req, res, next) {
    const {orgId, name, description, status, workspaceMetadata} = req.body;
    try {
        let val = await xmService.setupWorkspace(req.user.userId, orgId, name, description, status, workspaceMetadata);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}

async function editWorkspace(req, res, next) {
    const {  workspaceId, orgId, name, description, status,  url, createdBy, managedBy
        , defaultAssignee} = req.body;
    try {
        let val = await xmService.editWorkspace(req.user.userId, workspaceId, orgId, name, description, status,  url, createdBy, managedBy
            , defaultAssignee);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}


async function updateUser(req, res, next) {
    const {userId, firstName, lastName, orgName, email, number} = req.body;
    try {
        let val = await xmService.updateUser(userId, firstName, lastName, orgName, email, number);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}

async function submitRecord(req, res, next) {
    try {
        let val = await xmService.submitRecord(req);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}


async function submitRecord1(req, res, next) {
    try {
        let val = await xmService.submitRecord1(req);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}

async function updateContext(req, res, next) {
    const {
        workspaceId,
        orgId,
        recordId,
        stakeholderId,
        contextValue,
        contextId,
        stakeholderContextId,
        recordContextId
    } = req.body;
    try {
        if (recordId && stakeholderId) {
            throw new Error("Invalid Request");
        }
        let val = await xmService.updateContext(req.user.userId, workspaceId, orgId, recordId, stakeholderId, contextValue, contextId, stakeholderContextId, recordContextId);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}

async function createEditTags(req, res, next) {
    const {workspaceId, orgId, tagId, tagName, tagDescription, tagStatus} = req.body;
    try {
        let val = await xmService.createEditTags(req.user.userId, workspaceId, orgId, tagId, tagName, tagDescription, tagStatus);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}

async function deleteTags(req, res, next) {
    const {workspaceId, orgId, tagId, tagStatus} = req.body;
    try {
        let val = await xmService.deleteTags(req.user.userId, workspaceId, orgId, tagId, tagStatus);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}


async function createEditProduct(req, res, next) {
    const {productId, workspaceId, orgId, productName, productCode,productStatus, productDescription} = req.body;
    try {
        let val = await xmService.createEditProduct(req.user.userId,productId, workspaceId, orgId, productName, productCode, productStatus, productDescription);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}


async function deleteProduct(req, res, next) {
    const {workspaceId, orgId, productId, productStatus} = req.body;
    try {
        let val = await xmService.deleteProduct(req.user.userId,workspaceId, orgId, productId, productStatus);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}


async function getUser(req, res, next) {
    const {orgId, workspaceId} = req.body;
     try {
        let val = await xmService.getUser(req.user.userId, orgId, workspaceId);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}


async function updateUser(req, res, next) {
    const {
        orgId,
        userId,
        firstName,
        lastName,
        nameInitial,
        email,
        number,
        profilePic ,
        u_created_at,
        u_updated_at ,
        updatedBy ,
        stakeholderId ,
        jobTitle,
        department ,
        organizationName ,
        baseLocation,
        language ,
        timezone } = req.body;
    try {
        let val = await xmService.updateUser(req.user.userId, orgId, userId, firstName,
            lastName,
            nameInitial,
            email,
            number,
            profilePic ,
            u_created_at,
            u_updated_at ,
            updatedBy ,
            stakeholderId ,
            jobTitle,
            department ,
            organizationName ,
            baseLocation,
            language ,
            timezone );
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}


async function createEditTeam(req, res, next) {
    const {workspaceId, orgId, teamId, teamName, teamDescription, teamStatus, teamMembers} = req.body;
    try {
        let val = await xmService.createEditTeam(req.user.userId, workspaceId, orgId, teamId, teamName, teamDescription, teamStatus, teamMembers);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}



async function deleteTeam(req, res, next) {
    const {workspaceId, orgId, teamId, teamStatus} = req.body;
    try {
        let val = await xmService.deleteTeam(req.user.userId, workspaceId, orgId, teamId, teamStatus);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}

async function createComment(req, res, next) {
    const {workspaceId, orgId, comment, recordId, commentType, stakeholderId} = req.body;
    try {
        let val;
        if (commentType === 'StakeholderComment') {
            val = await xmService.createStakeholderComment(req.user.userId, workspaceId, orgId, comment, stakeholderId);
        } else if (commentType === 'Comment') {
            val = await xmService.createComment(req.user.userId, workspaceId, orgId, comment, recordId);
        }

        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}


async function editComment(req, res, next) {
    const {workspaceId, orgId, commentId, comment, recordId, stakeholderId, commentType} = req.body;
    try {
        let val;
        if (commentType === 'StakeholderComment') {
            val = await xmService.editStakeholderComment(req.user.userId, workspaceId, orgId, commentId, comment, stakeholderId);
        } else if (commentType === 'Comment') {
            val = await xmService.editComment(req.user.userId, workspaceId, orgId, commentId, comment, recordId);
        }

        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}


async function deleteComment(req, res, next) {
    const {workspaceId, orgId, commentId, stakeholderId, recordId, commentType} = req.body;
    try {
        let val;
        if (commentType === 'StakeholderComment') {
            val = await xmService.deleteStakeholderComment(req.user.userId, workspaceId, orgId, commentId,);
        } else if (commentType === 'Comment') {
            val = await xmService.deleteComment(req.user.userId, workspaceId, orgId, commentId,);
        }

        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}

async function createStakeholderComment(req, res, next) {
    const {workspaceId, orgId, comment, stakeholderId} = req.body;
    try {
        let val = await xmService.createStakeholderComment(req.user.userId, workspaceId, orgId, comment, stakeholderId);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}

async function createConfiguration(req, res, next) {
     const { workspaceId   ,
         orgId,
         contextConfigurationId,
         contextConfigurationStatus,
         contextConfigurationType,
         contextConfigurationName,
         contextConfigurationDescription,
         contextConfigurationSectionLabel,
         fieldList} = req.body;
    try {
        let val = await xmService.createConfiguration(req.user.userId, workspaceId,
            orgId,
            contextConfigurationId,
            contextConfigurationStatus,
            contextConfigurationType,
            contextConfigurationName,
            contextConfigurationDescription,
            contextConfigurationSectionLabel,
            fieldList);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}



async function checkFieldKeyAvailability(req, res, next) {
    const { workspaceId   ,
        orgId ,
        contextConfigId,
        fieldId,
        fieldKey} = req.body;
    try {
        let val = await xmService.checkFieldKeyAvailability(req.user.userId, workspaceId,
            orgId ,
            contextConfigId,
            fieldId,
            fieldKey);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}


async function deleteContextConfiguration(req, res, next) {
    const { workspaceId   ,
        orgId   ,
        contextConfigurationId,
        contextConfigurationStatus,
        contextConfigurationName,
        contextConfigurationDescription,
        fieldList} = req.body;
    try {
        let val = await xmService.deleteContextConfiguration(req.user.userId, workspaceId,
            orgId,
            contextConfigurationId,
            contextConfigurationStatus,
            contextConfigurationName,
            contextConfigurationDescription, fieldList);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}



async function searchRecord(req, res, next) {
    const {
        searchValue, searchKey, attributes, limit, offset, sortBy, sortOrder, filters, associate,
    } = req.body;
    try {
        let val = await xmService.searchRecord(req, res);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}


async function getRecords(req, res, next) {
    const {
        searchValue, searchKey, attributes, limit, offset, sortBy, sortOrder, filters, associate,
    } = req.body;
    try {
        let val = await xmService.getRecords(req, res);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}



async function getPossibleStatusTransitions(req, res, next) {
    const {
        workspaceId, orgId, fromStatusId
    } = req.body;
    try {
        let val = await xmService.getPossibleStatusTransitions(req?.user?.userId, workspaceId, orgId, fromStatusId);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}


async function addRecordStakeholderProducts(req, res, next) {
    const {
        orgId, workspaceId, recordId, stakeholderId, productIdList
    } = req.body;
    try {
        let val = await xmService.addRecordStakeholderProducts(req?.user?.userId, orgId, workspaceId, recordId, stakeholderId, productIdList);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}

async function deleteRecordStakeholderProducts(req, res, next) {
    const {
        orgId, recordId, stakeholderId, productIdList
    } = req.body;
    try {
        let val = await xmService.deleteRecordStakeholderProducts(req?.user?.userId, orgId, recordId, stakeholderId, productIdList);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}

async function addRecordStakeholderTags(req, res, next) {
    const {
        orgId, workspaceId, recordId, stakeholderId, tagIdList
    } = req.body;
    try {
        let val = await xmService.addRecordStakeholderTags(req?.user?.userId,orgId, workspaceId, recordId, stakeholderId, tagIdList);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}

async function deleteRecordStakeholderTags(req, res, next) {
    const {
        orgId, recordId, stakeholderId, tagIdList
    } = req.body;
    try {
        let val = await xmService.deleteRecordStakeholderTags(req?.user?.userId,orgId, recordId, stakeholderId, tagIdList);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}


async function addTeamTag(req, res, next) {
    const {
        orgId, workspaceId, recordId, stakeholderId, teamIdList
    } = req.body;
    try {
        let val = await xmService.addTeamTag(req?.user?.userId,orgId, workspaceId, recordId, stakeholderId, teamIdList);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}

async function deleteTeamTag(req, res, next) {
    const {
        orgId, recordId, stakeholderId, teamIdList
    } = req.body;
    try {
        let val = await xmService.deleteTeamTag(req?.user?.userId,orgId, recordId, stakeholderId, teamIdList);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}

async function updateStatus(req, res, next) {
    const {
        orgId, workspaceId, recordId, stakeholderId, newStatus
    } = req.body;
    try {
        let val = await xmService.updateStatus(req?.user?.userId, orgId, workspaceId, recordId, stakeholderId, newStatus);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}



async function updateAssignee(req, res, next) {
    const {
        orgId, workspaceId, recordId, newAssigneeId
    } = req.body;
    try {
        let val = await xmService.updateAssignee(req?.user?.userId, orgId, workspaceId, recordId, newAssigneeId);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}



async function createEditStatusFlow(req, res, next) {
    const {workspaceId, orgId, statusConfigurationId, statusConfigurationStatus, statusConfigurationName, statusConfigurationDescription,
    possibleStatus, possibleStatusTransition, defaultStatus, entryStatus} = req.body;
    try {
        let val = await xmService.createEditStatusFlow(req.user.userId, workspaceId, orgId, statusConfigurationId, statusConfigurationStatus, statusConfigurationName, statusConfigurationDescription,
            possibleStatus, possibleStatusTransition,  defaultStatus, entryStatus);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}



async function deleteStatusFlow(req, res, next) {
    const {workspaceId, orgId, statusFlowId, statusFlowStatus} = req.body;
    try {
        let val = await xmService.deleteStatusFlow(req.user.userId, workspaceId, orgId, statusFlowId, statusFlowStatus);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}


async function deleteContextConfiguration(req, res, next) {
    const { workspaceId, orgId, contextConfigId, contextConfigStatus} = req.body;
    try {
        let val = await xmService.deleteContextConfiguration(req.user.userId,workspaceId, orgId, contextConfigId, contextConfigStatus);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}



async function updateContextFieldValue(req, res, next) {
    const {workspaceId, orgId, recordId, stakeholderId, productId,  userId, fieldId, fieldValue, contextId} = req.body;
    try {
        let val = await xmService.updateContextFieldValue(req.user.userId, workspaceId, orgId, recordId, stakeholderId, productId, userId, fieldId, fieldValue, contextId);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}

async function updateRecordWatcher(req, res, next) {
    const {workspaceId, orgId, recordId, userId} = req.body;
    try {
        let val = await xmService.updateRecordWatcher(req.user.userId, workspaceId, orgId, recordId, userId);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}

async function deleteRecordWatcher(req, res, next) {
    const {workspaceId, orgId, recordId, recordWatcherId} = req.body;
    try {
        let val = await xmService.deleteRecordWatcher(req.user.userId, workspaceId, orgId, recordId, recordWatcherId);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}



async function updateRecordViewer(req, res, next) {
    const {workspaceId, orgId, recordId, userId} = req.body;
    try {
        let val = await xmService.updateRecordViewer(req.user.userId, workspaceId, orgId, recordId, userId);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}

async function deleteRecordViewer(req, res, next) {
    const {workspaceId, orgId, recordId, recordViewerId} = req.body;
    try {
        let val = await xmService.deleteRecordViewer(req.user.userId, workspaceId, orgId, recordId, recordViewerId);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}



async function createRecordLink(req, res, next) {
    const {
        workspaceId, orgId, recordIdA, recordIdB, linkType
    } = req.body;
    try {
        let val = await xmService.createRecordLink(req?.user?.userId, workspaceId, orgId, recordIdA, recordIdB, linkType);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}

async function deleteRecordLink(req, res, next) {
    const {
        workspaceId, orgId, recordLinkId
    } = req.body;
    try {
        let val = await xmService.deleteRecordLink(req?.user?.userId,recordLinkId);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}


async function getLinkedRecords(req, res, next) {
    const {
        workspaceId, orgId, recordId
    } = req.body;
    try {
        let val = await xmService.getLinkedRecords(req?.user?.userId,workspaceId, orgId, recordId);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}



async function createEditAPIChannel(req, res, next) {
    const {workspaceId, orgId, apiChannelId, apiChannelName, apiChannelDescription, apiChannelStatus, layoutId} = req.body;
    try {
        let val = await xmService.createEditAPIChannel(req.user.userId,
            workspaceId, orgId, apiChannelId, apiChannelName, apiChannelDescription, apiChannelStatus, layoutId);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}



async function deleteAPIChannel(req, res, next) {
    const {workspaceId, orgId, teamId, teamStatus} = req.body;
    try {
        let val = await xmService.deleteAPIChannel(req.user.userId, workspaceId, orgId, teamId, teamStatus);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}



async function createLayout(req, res, next) {
    const { workspaceId, orgId, contextConfigurationIdList, statusConfigurationIdList, layoutId, layoutStatus, layoutName, layoutDescription, layoutSchema, layoutType, fieldList} = req.body;
    try {
        let val = await xmService.createLayout(req.user.userId,
            workspaceId, orgId, contextConfigurationIdList, layoutId, layoutStatus, layoutName, layoutDescription, layoutSchema, statusConfigurationIdList, layoutType, fieldList);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}



async function createRecordType(req, res, next) {
    const { workspaceId, orgId, recordTypeName} = req.body;
    try {
        let val = await xmService.createRecordType(req.user.userId,
            workspaceId, orgId, recordTypeName);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}


async function createStakeholderType(req, res, next) {
    const { workspaceId, orgId, stakeholderTypeName} = req.body;
    try {
        let val = await xmService.createStakeholderType(req.user.userId,
            workspaceId, orgId, stakeholderTypeName);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}


async function getAPIManual(req, res, next) {
    const { workspaceId, orgId, apiChannelId } = req.body;
    try {
        let val = await xmService.getAPIManual(req?.user?.userId,
            workspaceId, orgId, apiChannelId);
        console.log("RESPONSE VAL :: ", val)
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}


async function checkRecordDataFieldKeyAvailability(req, res, next) {
    const { workspaceId   ,
        orgId ,
        layoutId,
        fieldId,
        fieldKey} = req.body;
    try {
        let val = await xmService.checkRecordDataFieldKeyAvailability(req.user.userId, workspaceId,
            orgId ,
            layoutId,
            fieldId,
            fieldKey);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}


async function createEditPortal(req, res, next) {
    const {workspaceId, orgId, portalId, portalName, portalDescription} = req.body;
    try {
        let val = await xmService.createEditPortal(req.user.userId,
            workspaceId, orgId, portalId, portalName, portalDescription);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}

async function createEditPortalGroup(req, res, next) {
    const {workspaceId, orgId, portalId, portalGroupId, portalGroupName, portalGroupDescription, portalGroupInputConfig} = req.body;
    try {
        let val = await xmService.createEditPortalGroup(req.user.userId,
            workspaceId, orgId, portalId, portalGroupId, portalGroupName, portalGroupDescription, portalGroupInputConfig);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}



async function deletePortalGroup(req, res, next) {
    const {workspaceId, orgId, portalId, portalGroupId} = req.body;
    try {
        let val = await xmService.deletePortalGroup(req.user.userId,
            workspaceId, orgId, portalId, portalGroupId);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}

async function createEditUserStatus(req, res, next) {
    const {workspaceId, orgId, userStatusId, userStatusName, userStatusColor} = req.body;
    try {
        let val = await xmService.createEditUserStatus(req.user.userId,
            workspaceId, orgId, userStatusId, userStatusName, userStatusColor, false);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}


async function createEditUserStatusGroup(req, res, next) {
    const {workspaceId, orgId, userStatusGroupId, userStatusGroupName, userStatusList} = req.body;
    try {
        let val = await xmService.createEditUserStatusGroup(req.user.userId,
            workspaceId, orgId, userStatusGroupId, userStatusGroupName, userStatusList, false);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
}


module.exports = {
    submitRecord,
    setupWorkspace,
    createOrg,
    createUserOrgLink,
    searchRecord,
    createComment,
    editComment,
    sendUserInvite,
    createWorkspaceUserLink,
    setupZomatoIntegration,
    deleteComment,
    setupIntegration,
    checkUserExist,
    joinOrg,
    updateContext,
    createConfiguration,
     createChannel,
    deleteWorkspaceUserLink,
    deleteUserOrgLink,
    createEditTags,
    createEditTeam,
    createEditProduct,
    getUser,
    updateUser,
    updateOrg,
    editWorkspace,
    addRecordStakeholderProducts,
    addRecordStakeholderTags,
    deleteRecordStakeholderProducts,
    deleteRecordStakeholderTags,
    updateStatus,updateAssignee,
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
    switchOrg,
    getAPIManual,
    updateRecordViewer,
    deleteRecordViewer,
    checkRecordDataFieldKeyAvailability,
    submitRecord1,
    createEditPortal,
    createEditPortalGroup,
    deletePortalGroup,
    createEditUserStatus,
    createEditUserStatusGroup
};
