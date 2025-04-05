const express = require("express");
const router = express.Router();
const genericController = require("../controller/Generic.controller.js");
 const authMiddleware = require("../middleware/authMiddleware");
 const logger = require('../config/winston.config.js')

router.get("/ping", function (req, res) {
    res.status(200).send({message: "Ping Successful"});
});

router.post("/createEditUserStatusGroup", authMiddleware, genericController.createEditUserStatusGroup);
router.post("/getUser", authMiddleware, genericController.getUser);


module.exports = router;
