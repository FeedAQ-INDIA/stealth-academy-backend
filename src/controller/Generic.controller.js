const jwt = require("jsonwebtoken");
const lodash = require("lodash");
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const logger = require("../config/winston.config");
const AcademyService = require("../service/AcademyService.service.js");


async function getUser(req, res, next) {
    const {} = req.body;
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


async function enrollUserCourse(req, res, next) {
    const {courseId} = req.body;
    try {
        let val = await AcademyService.enrollUserCourse(req.user.userId, courseId);
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

async function disrollUserCourse(req, res, next) {
    const {courseId} = req.body;
    try {
        let val = await AcademyService.disrollUserCourse(req.user.userId, courseId);
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
        let val = await AcademyService.searchRecord(req, res);
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

    getUser,
    searchRecord,
    enrollUserCourse,
    disrollUserCourse
};
