const express = require("express");
const router = express.Router();
const genericController = require("../controller/Generic.controller.js");
const authMiddleware = require("../middleware/authMiddleware");
 
const { validate } = require("../middleware/validate.middleware.js");

const publicauthenticationMiddleware = require("../middleware/publicMiddleware");
 const logger = require('../config/winston.config.js')

router.get("/ping", function (req, res) {
    res.status(200).send({message: "Ping Successful"});
});

router.post("/getUser", authMiddleware, genericController.getUser);
router.post("/saveWritingSubmission",  genericController.saveWritingSubmission);
router.post("/getWritingSubmission",  genericController.getWritingSubmission);



module.exports = router;
