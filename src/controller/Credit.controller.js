const jwt = require("jsonwebtoken");
const lodash = require("lodash");
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const logger = require("../config/winston.config");
const CreditService = require("../service/CreditService.service.js");

async function addCreditTransaction(req, res, next) {
    const { userId, transactionType, amount, description, referenceType, referenceId, metadata } = req.body;
    try {
        let val = await CreditService.addCreditTransaction({
            userId: userId || req.user.userId,
            transactionType,
            amount,
            description,
            referenceType,
            referenceId,
            processedBy: req.user.userId,
            metadata
        });
        res.status(200).send({
            status: 200, 
            message: "Credit transaction added successfully", 
            data: val
        });
    } catch (err) {
        console.error(`Error occurred`, err.message);
        res.status(500).send({
            status: 500, 
            message: err.message || "Some error occurred while adding credit transaction.",
        });
        next(err);
    }
}

async function getUserCreditTransactions(req, res, next) {
    const { userId, limit = 50, offset = 0, transactionType, referenceType } = req.body;
    try {
        let val = await CreditService.getUserCreditTransactions({
            userId: userId || req.user.userId,
            limit,
            offset,
            transactionType,
            referenceType
        });
        res.status(200).send({
            status: 200, 
            message: "Success", 
            data: val != null ? val : []
        });
    } catch (err) {
        console.error(`Error occurred`, err.message);
        res.status(500).send({
            status: 500, 
            message: err.message || "Some error occurred while fetching credit transactions.",
        });
        next(err);
    }
}

async function getUserCreditBalance(req, res, next) {
    const { userId } = req.body;
    try {
        let val = await CreditService.getUserCreditBalance(userId || req.user.userId);
        res.status(200).send({
            status: 200, 
            message: "Success", 
            data: { balance: val }
        });
    } catch (err) {
        console.error(`Error occurred`, err.message);
        res.status(500).send({
            status: 500, 
            message: err.message || "Some error occurred while fetching credit balance.",
        });
        next(err);
    }
}

async function getCreditTransactionById(req, res, next) {
    const { transactionId } = req.body;
    try {
        let val = await CreditService.getCreditTransactionById(transactionId);
        res.status(200).send({
            status: 200, 
            message: "Success", 
            data: val
        });
    } catch (err) {
        console.error(`Error occurred`, err.message);
        res.status(500).send({
            status: 500, 
            message: err.message || "Some error occurred while fetching credit transaction.",
        });
        next(err);
    }
}
 
 
 

async function getUserCreditSummary(req, res, next) {
    const { userId, startDate, endDate } = req.body;
    try {
        let val = await CreditService.getUserCreditSummary(
            userId || req.user.userId,
            startDate,
            endDate
        );
        res.status(200).send({
            status: 200, 
            message: "Success", 
            data: val
        });
    } catch (err) {
        console.error(`Error occurred`, err.message);
        res.status(500).send({
            status: 500, 
            message: err.message || "Some error occurred while fetching credit summary.",
        });
        next(err);
    }
}

async function getAllUserBalances(req, res, next) {
    const { limit = 50, offset = 0, minBalance, maxBalance } = req.body;
    try {
        let val = await CreditService.getAllUserBalances({
            limit,
            offset,
            minBalance,
            maxBalance
        });
        res.status(200).send({
            status: 200, 
            message: "Success", 
            data: val
        });
    } catch (err) {
        console.error(`Error occurred`, err.message);
        res.status(500).send({
            status: 500, 
            message: err.message || "Some error occurred while fetching user balances.",
        });
        next(err);
    }
}

async function syncUserBalance(req, res, next) {
    const { userId } = req.body;
    try {
        let val = await CreditService.syncUserBalance(userId || req.user.userId);
        res.status(200).send({
            status: 200, 
            message: "User balance synchronized successfully", 
            data: val
        });
    } catch (err) {
        console.error(`Error occurred`, err.message);
        res.status(500).send({
            status: 500, 
            message: err.message || "Some error occurred while synchronizing user balance.",
        });
        next(err);
    }
}

async function getUserCreditStats(req, res, next) {
    const { userId } = req.body;
    try {
        let val = await CreditService.getUserCreditStats(userId || req.user.userId);
        res.status(200).send({
            status: 200, 
            message: "User credit statistics fetched successfully", 
            data: val
        });
    } catch (err) {
        console.error(`Error occurred`, err.message);
        res.status(500).send({
            status: 500, 
            message: err.message || "Some error occurred while synchronizing user balance.",
        });
        next(err);
    }
}

module.exports = {
    addCreditTransaction,
    getUserCreditTransactions,
    getUserCreditBalance,
    getCreditTransactionById,
 
    getUserCreditSummary,
    getAllUserBalances,
    syncUserBalance,
    getUserCreditStats
};
