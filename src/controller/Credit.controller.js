const jwt = require("jsonwebtoken");
const lodash = require("lodash");
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const logger = require("../config/winston.config");
const CreditService = require("../service/CreditService.service.js");
const { ApiResponse } = require("../utils/responseFormatter");

async function addCreditTransaction(req, res, next) {
    const apiResponse = new ApiResponse(req, res);
    
    try {
        const { userId, transactionType, amount, description, referenceType, referenceId, metadata } = req.body;
        
        const val = await CreditService.addCreditTransaction({
            userId: userId || req.user.userId,
            transactionType,
            amount,
            description,
            referenceType,
            referenceId,
            processedBy: req.user.userId,
            metadata
        });
        
        apiResponse
            .status(200)
            .withMessage("Credit transaction added successfully")
            .withData({ transaction: val })
            .withMeta({
                userId: userId || req.user.userId,
                transactionType,
                amount,
                processedBy: req.user.userId
            })
            .success();
    } catch (err) {
        logger.error(`Error occurred while adding credit transaction:`, err.message);
        
        apiResponse
            .status(500)
            .withMessage(err.message || "Failed to add credit transaction")
            .withError(err.message, err.code || "ADD_CREDIT_TRANSACTION_ERROR", "addCreditTransaction")
            .withMeta({
                userId: req.body.userId || req.user?.userId,
                attemptedBy: req.user?.userId
            })
            .error();
    }
}

async function getUserCreditTransactions(req, res, next) {
    const apiResponse = new ApiResponse(req, res);
    
    try {
        const { userId, limit = 50, offset = 0, transactionType, referenceType } = req.body;
        
        const val = await CreditService.getUserCreditTransactions({
            userId: userId || req.user.userId,
            limit,
            offset,
            transactionType,
            referenceType
        });
        
        apiResponse
            .status(200)
            .withMessage("Credit transactions fetched successfully")
            .withData({ 
                transactions: val != null ? val : [],
                count: val?.length || 0
            })
            .withMeta({
                userId: userId || req.user.userId,
                limit,
                offset,
                transactionType,
                referenceType
            })
            .success();
    } catch (err) {
        logger.error(`Error occurred while fetching credit transactions:`, err.message);
        
        apiResponse
            .status(500)
            .withMessage(err.message || "Failed to fetch credit transactions")
            .withError(err.message, err.code || "GET_CREDIT_TRANSACTIONS_ERROR", "getUserCreditTransactions")
            .withMeta({
                userId: req.body.userId || req.user?.userId,
                requestedBy: req.user?.userId
            })
            .error();
    }
}

async function getUserCreditBalance(req, res, next) {
    const apiResponse = new ApiResponse(req, res);
    
    try {
        const { userId } = req.body;
        
        const val = await CreditService.getUserCreditBalance(userId || req.user.userId);
        
        apiResponse
            .status(200)
            .withMessage("Credit balance fetched successfully")
            .withData({ balance: val })
            .withMeta({
                userId: userId || req.user.userId
            })
            .success();
    } catch (err) {
        logger.error(`Error occurred while fetching credit balance:`, err.message);
        
        apiResponse
            .status(500)
            .withMessage(err.message || "Failed to fetch credit balance")
            .withError(err.message, err.code || "GET_CREDIT_BALANCE_ERROR", "getUserCreditBalance")
            .withMeta({
                userId: req.body.userId || req.user?.userId,
                requestedBy: req.user?.userId
            })
            .error();
    }
}

async function getCreditTransactionById(req, res, next) {
    const apiResponse = new ApiResponse(req, res);
    
    try {
        const { transactionId } = req.body;
        
        if (!transactionId) {
            return apiResponse
                .status(400)
                .withMessage("transactionId is required")
                .withError("transactionId is required", "MISSING_FIELD", "getCreditTransactionById")
                .error();
        }
        
        const val = await CreditService.getCreditTransactionById(transactionId);
        
        apiResponse
            .status(200)
            .withMessage("Credit transaction fetched successfully")
            .withData({ transaction: val })
            .withMeta({
                transactionId,
                requestedBy: req.user?.userId
            })
            .success();
    } catch (err) {
        logger.error(`Error occurred while fetching credit transaction:`, err.message);
        
        apiResponse
            .status(500)
            .withMessage(err.message || "Failed to fetch credit transaction")
            .withError(err.message, err.code || "GET_CREDIT_TRANSACTION_ERROR", "getCreditTransactionById")
            .withMeta({
                transactionId: req.body.transactionId,
                requestedBy: req.user?.userId
            })
            .error();
    }
}
 
 
 

async function getUserCreditSummary(req, res, next) {
    const apiResponse = new ApiResponse(req, res);
    
    try {
        const { userId, startDate, endDate } = req.body;
        
        const val = await CreditService.getUserCreditSummary(
            userId || req.user.userId,
            startDate,
            endDate
        );
        
        apiResponse
            .status(200)
            .withMessage("Credit summary fetched successfully")
            .withData({ summary: val })
            .withMeta({
                userId: userId || req.user.userId,
                startDate,
                endDate
            })
            .success();
    } catch (err) {
        logger.error(`Error occurred while fetching credit summary:`, err.message);
        
        apiResponse
            .status(500)
            .withMessage(err.message || "Failed to fetch credit summary")
            .withError(err.message, err.code || "GET_CREDIT_SUMMARY_ERROR", "getUserCreditSummary")
            .withMeta({
                userId: req.body.userId || req.user?.userId,
                requestedBy: req.user?.userId
            })
            .error();
    }
}

async function getAllUserBalances(req, res, next) {
    const apiResponse = new ApiResponse(req, res);
    
    try {
        const { limit = 50, offset = 0, minBalance, maxBalance } = req.body;
        
        const val = await CreditService.getAllUserBalances({
            limit,
            offset,
            minBalance,
            maxBalance
        });
        
        apiResponse
            .status(200)
            .withMessage("User balances fetched successfully")
            .withData({ 
                balances: val,
                count: val?.length || 0
            })
            .withMeta({
                limit,
                offset,
                minBalance,
                maxBalance,
                requestedBy: req.user?.userId
            })
            .success();
    } catch (err) {
        logger.error(`Error occurred while fetching user balances:`, err.message);
        
        apiResponse
            .status(500)
            .withMessage(err.message || "Failed to fetch user balances")
            .withError(err.message, err.code || "GET_USER_BALANCES_ERROR", "getAllUserBalances")
            .withMeta({
                requestedBy: req.user?.userId
            })
            .error();
    }
}

async function syncUserBalance(req, res, next) {
    const apiResponse = new ApiResponse(req, res);
    
    try {
        const { userId } = req.body;
        
        const val = await CreditService.syncUserBalance(userId || req.user.userId);
        
        apiResponse
            .status(200)
            .withMessage("User balance synchronized successfully")
            .withData({ balance: val })
            .withMeta({
                userId: userId || req.user.userId,
                synchronizedBy: req.user?.userId
            })
            .success();
    } catch (err) {
        logger.error(`Error occurred while synchronizing user balance:`, err.message);
        
        apiResponse
            .status(500)
            .withMessage(err.message || "Failed to synchronize user balance")
            .withError(err.message, err.code || "SYNC_USER_BALANCE_ERROR", "syncUserBalance")
            .withMeta({
                userId: req.body.userId || req.user?.userId,
                attemptedBy: req.user?.userId
            })
            .error();
    }
}

async function getUserCreditStats(req, res, next) {
    const apiResponse = new ApiResponse(req, res);
    
    try {
        const { userId } = req.body;
        
        const val = await CreditService.getUserCreditStats(userId || req.user.userId);
        
        apiResponse
            .status(200)
            .withMessage("User credit statistics fetched successfully")
            .withData( val)
            .withMeta({
                userId: userId || req.user.userId,
                requestedBy: req.user?.userId
            })
            .success();
    } catch (err) {
        logger.error(`Error occurred while fetching user credit stats:`, err.message);
        
        apiResponse
            .status(500)
            .withMessage(err.message || "Failed to fetch user credit statistics")
            .withError(err.message, err.code || "GET_CREDIT_STATS_ERROR", "getUserCreditStats")
            .withMeta({
                userId: req.body.userId || req.user?.userId,
                requestedBy: req.user?.userId
            })
            .error();
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
