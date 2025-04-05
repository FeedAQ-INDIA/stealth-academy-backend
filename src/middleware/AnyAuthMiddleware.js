const jwt = require("jsonwebtoken");
const _ = require("lodash");
const logger = require("../config/winston.config");

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const tempTokenSecret = process.env.TEMP_ACCESS_TOKEN_SECRET;

const verifyToken = (token, secret) => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, secret, (err, user) => {
            if (err) {
                return reject(new Error("Invalid or expired token"));
            }
            if (!_.get(user, "userId") || !_.get(user, "userEmail")) {
                return reject(new Error("Invalid token structure"));
            }
            resolve(user);
        });
    });
};

const AnyAuthMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        logger.error("Token missing from Authorization header");
        return res.status(401).json({ error: "Authorization token missing" });
    }

    try {
        // Try verifying with accessTokenSecret first
        req.user = await verifyToken(token, accessTokenSecret);
        logger.info("Authenticated user via access token:", req.user);
        return next();
    } catch (error) {
        logger.warn("Access token verification failed:", error.message);
    }

    try {
        // If accessTokenSecret verification fails, try tempTokenSecret
        req.user = await verifyToken(token, tempTokenSecret);
        logger.info("Authenticated user via temp access token:", req.user);
        return next();
    } catch (error) {
        logger.error("Temp access token verification failed:", error.message);
        return res.status(403).json({ error: "Invalid or expired token" });
    }
};

module.exports = AnyAuthMiddleware;
