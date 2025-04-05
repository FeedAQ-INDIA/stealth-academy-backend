const db = require("../entity/index.js");
const lodash = require("lodash")
const logger = require('../config/winston.config.js')


const getInitials = (name) => {
    // Trim the input to handle extra spaces
    const trimmedName = name.trim();

    // If there's only one word, return its first two letters in uppercase
    if (!trimmedName.includes(" ")) {
        return trimmedName.slice(0, 2).toUpperCase();
    }

    // For multiple words, split and get initials
    const words = trimmedName.split(" ");
    const initials = words.map(word => word.charAt(0).toUpperCase()).join("");

    return initials;
}

async function createUser(firstName, lastName, email, number) {
    const user = {
        firstName: firstName, lastName: lastName, email: email, number: number, nameInitial:getInitials(firstName+" "+lastName)
    };
    const [data, created] = await db.User.findOrCreate({
        where: {
            email: email,
        }, defaults: user,
    });
    console.log(data);
    return data;
}

async function updateUser(userId, firstName, lastName, orgName, email, number, transaction = null) {
    const user = {
        userId: userId, firstName: firstName, lastName: lastName, orgName: orgName, email: email, number: number,
    };
    return await db.User.update(user, {
        where: {id: userId},
    }, {...(transaction && {transaction})});
}

async function findUser(email) {
    const data = await db.User.findOne({
        where: {
            email: email,
        }, include: [{
            model: db.Org,
            as: "organizations",
            required: false,
            include: [{model: db.Workspace, as: "workspaces", required: false}],
        },],
    });
    console.log(data);
    return data;
}

const joinOrg = async (userId, joinCode) => {
    let userObj = await db.User.findOne({where: {userId: userId}});
    console.log(userObj);
    if (userObj && userObj?.email) {
        let userInviteObj = await db.UserInvite.findOne({
            where: {
                userInviteEmail: userObj?.email, userInviteCode: joinCode, status: 'INVITED'
            }
        })
        if(userInviteObj){
            let orgUserObj = {
                orgId: userInviteObj.orgId, userId: userId, userOrgRole: userInviteObj.userOrgRole, userInviteBy: userInviteObj?.userInviteBy
            }
            const isUserLinkedToOrg = await db.OrgUser.findOrCreate({
                where: {orgId: userInviteObj?.orgId, userId: userId}, defaults: orgUserObj
            })
            if(isUserLinkedToOrg){
                userInviteObj.status = 'JOINED';
                userInviteObj.destroy();
                return {message : "No Invite Found for this user", type: 'S', joinedOrgId : userInviteObj?.orgId};
            }else{
                console.error("Error in joining org :", userId);
                throw new Error("Joining Org failed for userId : " + userId);
                return {message : "Error in joining org", type: 'F'};

            }
        }else{
            return {message : "No Invite Found for this user", type: 'F'};
        }



    } else {
        console.error("Error in joining org :", userId);
        throw new Error("Joining Org failed for userId : " + userId);
    }

}

async function createOrg(userId, orgName, orgEmail, orgNumber, metadata, orgHeadCount, orgDomain) {
    const org = {
        orgName: orgName,
        orgEmail: orgEmail,
        orgNumber: orgNumber,
        metadata: metadata,
        orgHeadCount: orgHeadCount,
        orgDomain: orgDomain,
    };
    const data = await db.Org.create(org);
    data.organizationAssociated = await createUserOrgLink(userId, data.orgId, "OWNER", null);
    console.log(data);
    return data;
}


async function switchOrg(userId, currentorgId, switchToOrgId) {
    const data = await db.Org.findByPk(switchToOrgId);
    return data;
}




async function updateOrg(userId, orgId, orgName, orgEmail, orgNumber, orgHeadCount, orgDomain) {
    if(!orgId) throw new Error("Invalid update request is required");
    const data = await db.Org.findByPk(orgId);
    if(data){
        data.orgName= orgName;
        data.orgEmail= orgEmail
        data.orgNumber= orgNumber
        data.orgHeadCount= orgHeadCount
        data.orgDomain= orgDomain
        await data.save();

        return "Org update completed"
    }else{
        return "Org Not Found"
    }

 }



async function createUserOrgLink(userId, orgId, userOrgRole, transaction = null) {
    const userOrgLink = {
        userId: userId, orgId: orgId, userOrgRole: userOrgRole,
    };
    const [data, created] = await db.OrgUser.findOrCreate({
        where: {
            userId: userId, orgId: orgId,
        }, defaults: userOrgLink, ...(transaction && {transaction}),
    });
    console.log("Data :: ", data);
    return data;
}

async function deleteUserOrgLink(userId, orgId, transaction = null) {
    // Fetch the user-org link
    const [data] = await db.OrgUser.findAll({
        where: {
            userId: userId,
            orgId: orgId,
        },
        ...(transaction && { transaction }),
    });

    console.log("Data :: ", data);

    if (data) {
        // Prevent removal if the user is the owner
        if (data?.userOrgRole === 'OWNER') {
            return "The owner of the Org cannot be removed";
        } else {
            // Delete user-org link
            await data.destroy();

            // Check and remove workspace-user link
            const workspaceUserLinkObj = await db.WorkspaceUser.findAll({
                where: {
                    userId: userId,
                },
                include: [
                    {
                        model: db.Workspace,
                        as: "workspace",
                        required: true,
                        where: {
                            orgId: orgId,
                        },
                    },
                ],
                ...(transaction && { transaction }),
            });

            if (workspaceUserLinkObj.length > 0) {
                await workspaceUserLinkObj.destroy();
            }

            return "Unlinked Member from this organization";
        }
    } else {
        return `No member link found for userId ${userId} with organizationId ${orgId}`;
    }
}



async function createUserWorkspaceLink(userId, workspaceId, orgId, workspaceUserLink, transaction = null) {
    let dataList = [];

    await Promise.all(
        workspaceUserLink.map(async (i) => {
            const userWorkspaceLink = {
                userId: i.userId,
                workspaceId: workspaceId,
                orgId,
                userWorkspaceRole: i.userWorkspaceRole,
                userInviteBy: userId
            };

            const [data, created] = await db.WorkspaceUser.findOrCreate({
                where: {
                    userId: i.userId,
                    workspaceId: workspaceId,
                },
                defaults: userWorkspaceLink,
                ...(transaction && { transaction }),
            });

            console.log("created ===", created);
            console.log("Triggered is Data :: ", data);

            dataList.push(data);
        })
    );

    return dataList;
}



async function deleteWorkspaceUserLink(userId, workspaceId, workspaceUserLink, transaction = null) {

    // await Promise.all(
    //     workspaceUserLink.map(async (i) => {

            const [data] = await db.WorkspaceUser.findAll({
                where: {
                    userId: workspaceUserLink?.[0]?.userId,
                    workspaceId: workspaceId,
                },
                 ...(transaction && { transaction }),
            });

            console.log("Triggered is Data :: ", data);

            if(data) {
                if(data?.userWorkspaceRole != "OWNER"){
                    await data.destroy();return `Unlinked user from the workspace`;
                 }else{
                    return `Owner of the Workspace cannot be unlinked`
                }
            }
         // })
    // );


}

const shouldUserRedirectToHomeScreen = (data) => {
    console.log("shouldUserRedirectToHomeScreen  :: ", data)
    return !lodash.isEmpty(data?.organizations) ? true : false;
};

module.exports = {
    findUser, createUser, shouldUserRedirectToHomeScreen, createUserOrgLink, createUserWorkspaceLink, createOrg, joinOrg, deleteWorkspaceUserLink, deleteUserOrgLink,
    updateOrg, switchOrg
};
