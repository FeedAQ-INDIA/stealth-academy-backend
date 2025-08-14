const express = require("express");
const router = express.Router();
const creditController = require("../controller/Credit.controller.js");
const authMiddleware = require("../middleware/authMiddleware");
const logger = require('../config/winston.config.js');

// Core Credit Management Routes
router.post("/addCreditTransaction", authMiddleware, creditController.addCreditTransaction);
router.post("/getUserCreditTransactions", authMiddleware, creditController.getUserCreditTransactions);
router.post("/getUserCreditBalance", authMiddleware, creditController.getUserCreditBalance);
router.post("/getCreditTransactionById", authMiddleware, creditController.getCreditTransactionById);
router.post("/updateCreditTransactionStatus", authMiddleware, creditController.updateCreditTransactionStatus);
router.post("/getUserCreditSummary", authMiddleware, creditController.getUserCreditSummary);

// Credit Helper Routes
router.post("/awardCourseCompletionCredits", authMiddleware, creditController.awardCourseCompletionCredits);
router.post("/awardQuizCompletionCredits", authMiddleware, creditController.awardQuizCompletionCredits);
router.post("/deductEnrollmentCredits", authMiddleware, creditController.deductEnrollmentCredits);
router.post("/addManualAdjustment", authMiddleware, creditController.addManualAdjustment);

// Admin Routes (additional authentication could be added)
router.post("/getAllUserBalances", authMiddleware, creditController.getAllUserBalances);
router.post("/syncUserBalance", authMiddleware, creditController.syncUserBalance);

module.exports = router;
