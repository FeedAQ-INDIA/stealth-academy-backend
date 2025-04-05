 const jwt = require("jsonwebtoken");
const lodash = require("lodash");
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const logger = require("../config/winston.config");
 const AcademyService = require("../service/AcademyService.service.js");


async function createEditUserStatusGroup(req, res, next) {
    const { } = req.body;
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



 async function getUser(req, res, next) {
     const { } = req.body;
     try {
         let val = await AcademyService.getUser(req.user.userId);
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

    createEditUserStatusGroup,
    getUser
};
