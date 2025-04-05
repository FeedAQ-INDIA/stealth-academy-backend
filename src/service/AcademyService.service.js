const {Op, fn, col} = require("sequelize");
const db = require("../entity/index.js");
 const lodash = require("lodash");
 const logger = require("../config/winston.config.js");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');


const getUser = async (userId, orgId, workspaceId) => {
    const userData = await db.User.findByPk(userId);

    if (!userData) throw new Error("User not found"); // Handle case where user is not found

    return userData.toJSON();
};

module.exports = {

    getUser
};

