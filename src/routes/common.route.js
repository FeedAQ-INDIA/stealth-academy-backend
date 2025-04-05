const express = require("express");
const router = express.Router();
const genericController = require("../controller/Generic.controller.js");
const zomatoUtil = require("../util/ZomatoFetcherUtil.util.js");
const authMiddleware = require("../middleware/authMiddleware");
const tempAuthenticateToken = require("../middleware/tempAuthMiddleware");
const AnyAuthMiddleware = require("../middleware/AnyAuthMiddleware");
const logger = require('../config/winston.config.js')

router.get("/ping", function (req, res) {
    res.status(200).send({message: "Ping Successful"});
});

router.get("/zomato", zomatoUtil.fetchDataFromZomato)

router.post("/submitRecord", genericController.submitRecord);
router.post("/submitRecord1", genericController.submitRecord1);
router.post("/updateContext", authMiddleware, genericController.updateContext);

router.post("/createComment", authMiddleware, genericController.createComment);
router.post("/editComment", authMiddleware, genericController.editComment);
router.post("/deleteComment", authMiddleware, genericController.deleteComment);




router.post("/createEditProduct", authMiddleware, genericController.createEditProduct);
router.post("/deleteProduct", authMiddleware, genericController.deleteProduct);

router.post("/getUser", AnyAuthMiddleware, genericController.getUser);
router.post("/updateUser", authMiddleware, genericController.updateUser);


router.post("/sendUserInvite", authMiddleware, genericController.sendUserInvite);
router.post("/checkUserExist", authMiddleware, genericController.checkUserExist);

router.post("/joinOrg", tempAuthenticateToken, genericController.joinOrg);
router.post("/createUserOrgLink", authMiddleware, genericController.createUserOrgLink);
router.post("/deleteUserOrgLink", authMiddleware, genericController.deleteUserOrgLink);

router.post("/switchOrg", authMiddleware, genericController.switchOrg);


router.post("/createChannel", authMiddleware, genericController.createChannel);

router.post("/createWorkspaceUserLink", authMiddleware, genericController.createWorkspaceUserLink);
router.post("/deleteWorkspaceUserLink", authMiddleware, genericController.deleteWorkspaceUserLink);

router.post("/setupIntegration", authMiddleware, genericController.setupIntegration);
router.post("/setupZomatoIntegration", authMiddleware, genericController.setupZomatoIntegration);

router.post("/createWorkspace", authMiddleware, genericController.setupWorkspace);
router.post("/editWorkspace", authMiddleware, genericController.editWorkspace);

router.post("/createOrg", tempAuthenticateToken, genericController.createOrg);
router.post("/updateOrg", authMiddleware, genericController.updateOrg);

router.post("/searchRecord", authMiddleware, genericController.searchRecord);
router.post("/getRecords", authMiddleware, genericController.getRecords);
router.post("/getPossibleStatusTransitions", authMiddleware, genericController.getPossibleStatusTransitions);

router.post("/createConfiguration", authMiddleware, genericController.createConfiguration);
router.post("/deleteContextConfiguration", authMiddleware, genericController.deleteContextConfiguration);
router.post("/checkFieldKeyAvailability", authMiddleware, genericController.checkFieldKeyAvailability);

router.post("/updateContextFieldValue", authMiddleware, genericController.updateContextFieldValue);

router.post("/createEditTags", authMiddleware, genericController.createEditTags);
router.post("/deleteTags", authMiddleware, genericController.deleteTags);

router.post("/addRecordStakeholderProducts", authMiddleware, genericController.addRecordStakeholderProducts);
router.post("/deleteRecordStakeholderProducts", authMiddleware, genericController.deleteRecordStakeholderProducts);

router.post("/addRecordStakeholderTags", authMiddleware, genericController.addRecordStakeholderTags);
router.post("/deleteRecordStakeholderTags", authMiddleware, genericController.deleteRecordStakeholderTags);


router.post("/createEditTeam", authMiddleware, genericController.createEditTeam);
router.post("/deleteTeam", authMiddleware, genericController.deleteTeam);

router.post("/addTeamTag", authMiddleware, genericController.addTeamTag)
router.post("/deleteTeamTag", authMiddleware, genericController.deleteTeamTag)

router.post("/updateStatus", authMiddleware, genericController.updateStatus);
router.post("/updateAssignee", authMiddleware, genericController.updateAssignee);

router.post("/createEditStatusFlow", authMiddleware, genericController.createEditStatusFlow);
router.post("/deleteStatusFlow", authMiddleware, genericController.deleteStatusFlow);

router.post("/updateRecordWatcher", authMiddleware, genericController.updateRecordWatcher);
router.post("/deleteRecordWatcher", authMiddleware, genericController.deleteRecordWatcher);

router.post("/updateRecordViewer", authMiddleware, genericController.updateRecordViewer);
router.post("/deleteRecordViewer", authMiddleware, genericController.deleteRecordViewer);


router.post("/createRecordLink", authMiddleware, genericController.createRecordLink)
router.post("/getLinkedRecords", authMiddleware, genericController.getLinkedRecords)
router.post("/deleteRecordLink", authMiddleware, genericController.deleteRecordLink)

router.post("/createEditAPIChannel", authMiddleware, genericController.createEditAPIChannel);
router.post("/deleteAPIChannel", authMiddleware, genericController.deleteAPIChannel);


router.post("/createLayout", authMiddleware, genericController.createLayout);
// router.post("/deleteLayout", authMiddleware, genericController.deleteAPIChannel);


router.post("/createRecordType", authMiddleware, genericController.createRecordType);
router.post("/createStakeholderType", authMiddleware, genericController.createStakeholderType);

router.post("/getAPIManual"  , genericController.getAPIManual);

router.post("/checkRecordDataFieldKeyAvailability", authMiddleware, genericController.checkRecordDataFieldKeyAvailability);

router.post("/createEditPortal", authMiddleware, genericController.createEditPortal);
router.post("/createEditPortalGroup", authMiddleware, genericController.createEditPortalGroup);
router.post("/deletePortalGroup", authMiddleware, genericController.deletePortalGroup);

router.post("/createEditUserStatus", authMiddleware, genericController.createEditUserStatus);
router.post("/createEditUserStatusGroup", authMiddleware, genericController.createEditUserStatusGroup);


module.exports = router;
