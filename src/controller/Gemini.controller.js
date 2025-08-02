const jwt = require("jsonwebtoken");
const lodash = require("lodash");
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const logger = require("../config/winston.config");
const GeminiService = require("../service/GeminiService.service.js");

const buildPrompt = async (req, res) => {
    const {
        items  } = req.body;
     try {
        let val = await GeminiService.buildPrompt(req?.user?.userId,items);
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
    buildPrompt
};

