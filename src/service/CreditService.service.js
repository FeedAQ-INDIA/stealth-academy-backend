const {QueryTypes} = require("sequelize");
const db = require("../entity/index.js");
const lodash = require("lodash");
const logger = require("../config/winston.config.js");
const {Op} = require("sequelize");

const addCreditTransaction = async (transactionData) => {
    const { userId, transactionType, amount, description, referenceType, referenceId, processedBy, metadata } = transactionData;

    try {
        // Start a transaction to ensure data consistency
        const result = await db.sequelize.transaction(async (t) => {
            // Get current user with balance
            const user = await db.User.findByPk(userId, { transaction: t });
            if (!user) {
                throw new Error("User not found");
            }

            const currentBalance = parseFloat(user.creditBalance) || 0;
            
            // Calculate new balance
            let newBalance;
            if (transactionType === 'CREDIT') {
                newBalance = currentBalance + parseFloat(amount);
            } else if (transactionType === 'DEBIT') {
                newBalance = currentBalance - parseFloat(amount);
                // Prevent negative balance (optional - remove if negative balances are allowed)
                if (newBalance < 0) {
                    throw new Error("Insufficient credit balance");
                }
            } else {
                throw new Error("Invalid transaction type");
            }

            // Create transaction record
            const transaction = await db.UserCreditTransaction.create({
                userId,
                transactionType,
                amount: parseFloat(amount),
                balanceAfter: newBalance,
                description,
                referenceType,
                referenceId,
                transactionStatus: 'COMPLETED',
                processedBy,
                metadata
            }, { transaction: t });

            // Update user's credit balance
            await user.update({ creditBalance: newBalance }, { transaction: t });

            return transaction;
        });

        return result;
    } catch (error) {
        logger.error('Error in addCreditTransaction:', error);
        throw error;
    }
};

const getUserCreditTransactions = async (params) => {
    const { userId, limit, offset, transactionType, referenceType } = params;

    try {
        const whereClause = { userId };
        
        if (transactionType) {
            whereClause.transactionType = transactionType;
        }
        
        if (referenceType) {
            whereClause.referenceType = referenceType;
        }

        const transactions = await db.UserCreditTransaction.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: db.User,
                    as: 'user',
                    attributes: ['userId', 'firstName', 'lastName', 'email']
                },
                {
                    model: db.User,
                    as: 'processor',
                    attributes: ['userId', 'firstName', 'lastName', 'email'],
                    required: false
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['transactionDate', 'DESC']]
        });

        return {
            transactions: transactions.rows,
            totalCount: transactions.count,
            currentPage: Math.floor(offset / limit) + 1,
            totalPages: Math.ceil(transactions.count / limit)
        };
    } catch (error) {
        logger.error('Error in getUserCreditTransactions:', error);
        throw error;
    }
};

const getUserCreditBalance = async (userId) => {
    try {
        const user = await db.User.findByPk(userId, {
            attributes: ['userId', 'creditBalance']
        });

        if (!user) {
            throw new Error("User not found");
        }

        return parseFloat(user.creditBalance) || 0;
    } catch (error) {
        logger.error('Error in getUserCreditBalance:', error);
        throw error;
    }
};

const getCreditTransactionById = async (transactionId) => {
    try {
        const transaction = await db.UserCreditTransaction.findByPk(transactionId, {
            include: [
                {
                    model: db.User,
                    as: 'user',
                    attributes: ['userId', 'firstName', 'lastName', 'email']
                },
                {
                    model: db.User,
                    as: 'processor',
                    attributes: ['userId', 'firstName', 'lastName', 'email'],
                    required: false
                }
            ]
        });

        if (!transaction) {
            throw new Error("Transaction not found");
        }

        return transaction;
    } catch (error) {
        logger.error('Error in getCreditTransactionById:', error);
        throw error;
    }
};

const updateCreditTransactionStatus = async (transactionId, status, processedBy) => {
    try {
        const transaction = await db.UserCreditTransaction.findByPk(transactionId);
        
        if (!transaction) {
            throw new Error("Transaction not found");
        }

        transaction.transactionStatus = status;
        transaction.processedBy = processedBy;
        await transaction.save();

        return transaction;
    } catch (error) {
        logger.error('Error in updateCreditTransactionStatus:', error);
        throw error;
    }
};

const getCreditTransactionsByReference = async (referenceType, referenceId) => {
    try {
        const transactions = await db.UserCreditTransaction.findAll({
            where: {
                referenceType,
                referenceId
            },
            include: [
                {
                    model: db.User,
                    as: 'user',
                    attributes: ['userId', 'firstName', 'lastName', 'email']
                }
            ],
            order: [['transactionDate', 'DESC']]
        });

        return transactions;
    } catch (error) {
        logger.error('Error in getCreditTransactionsByReference:', error);
        throw error;
    }
};

const getUserCreditSummary = async (userId, startDate, endDate) => {
    try {
        const whereClause = { 
            userId,
            transactionStatus: 'COMPLETED'
        };

        if (startDate && endDate) {
            whereClause.transactionDate = {
                [Op.between]: [startDate, endDate]
            };
        }

        const summary = await db.UserCreditTransaction.findAll({
            where: whereClause,
            attributes: [
                'transactionType',
                [db.sequelize.fn('SUM', db.sequelize.col('amount')), 'totalAmount'],
                [db.sequelize.fn('COUNT', db.sequelize.col('transactionId')), 'transactionCount']
            ],
            group: ['transactionType']
        });

        const currentBalance = await getUserCreditBalance(userId);

        return {
            currentBalance,
            summary: summary.reduce((acc, item) => {
                acc[item.transactionType.toLowerCase()] = {
                    totalAmount: item.dataValues.totalAmount,
                    transactionCount: item.dataValues.transactionCount
                };
                return acc;
            }, {})
        };
    } catch (error) {
        logger.error('Error in getUserCreditSummary:', error);
        throw error;
    }
};

const getAllUserBalances = async (params) => {
    const { limit, offset, minBalance, maxBalance } = params;

    try {
        const whereClause = {};
        
        if (minBalance !== undefined || maxBalance !== undefined) {
            whereClause.creditBalance = {};
            if (minBalance !== undefined) {
                whereClause.creditBalance[Op.gte] = minBalance;
            }
            if (maxBalance !== undefined) {
                whereClause.creditBalance[Op.lte] = maxBalance;
            }
        }

        const users = await db.User.findAndCountAll({
            where: whereClause,
            attributes: ['userId', 'firstName', 'lastName', 'email', 'creditBalance'],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['creditBalance', 'DESC']]
        });

        return {
            users: users.rows,
            totalCount: users.count,
            currentPage: Math.floor(offset / limit) + 1,
            totalPages: Math.ceil(users.count / limit)
        };
    } catch (error) {
        logger.error('Error in getAllUserBalances:', error);
        throw error;
    }
};

const syncUserBalance = async (userId) => {
    try {
        // Calculate balance from transactions
        const result = await db.sequelize.query(
            `SELECT 
                COALESCE(
                    SUM(
                        CASE 
                            WHEN transaction_type = 'CREDIT' THEN amount 
                            WHEN transaction_type = 'DEBIT' THEN -amount 
                            ELSE 0 
                        END
                    ), 0
                ) as calculatedBalance
            FROM user_credit_transaction 
            WHERE user_id = :userId 
            AND transaction_status = 'COMPLETED'`,
            {
                replacements: { userId },
                type: QueryTypes.SELECT
            }
        );

        const calculatedBalance = parseFloat(result[0]?.calculatedBalance) || 0;

        // Update user's credit balance
        const user = await db.User.findByPk(userId);
        if (!user) {
            throw new Error("User not found");
        }

        const oldBalance = parseFloat(user.creditBalance) || 0;
        await user.update({ creditBalance: calculatedBalance });

        return {
            userId,
            oldBalance,
            newBalance: calculatedBalance,
            difference: calculatedBalance - oldBalance,
            synchronized: true
        };
    } catch (error) {
        logger.error('Error in syncUserBalance:', error);
        throw error;
    }
};

// Helper methods for common credit operations
const awardCourseCompletionCredits = async (userId, courseId, amount = 50, processedBy = null) => {
    return await addCreditTransaction({
        userId,
        transactionType: 'CREDIT',
        amount,
        description: `Course completion reward for course ID: ${courseId}`,
        referenceType: 'COURSE_COMPLETION',
        referenceId: courseId,
        processedBy: processedBy || userId,
        metadata: { automated: true, courseId }
    });
};

const awardQuizCompletionCredits = async (userId, quizId, amount = 10, processedBy = null) => {
    return await addCreditTransaction({
        userId,
        transactionType: 'CREDIT',
        amount,
        description: `Quiz completion reward for quiz ID: ${quizId}`,
        referenceType: 'QUIZ_COMPLETION',
        referenceId: quizId,
        processedBy: processedBy || userId,
        metadata: { automated: true, quizId }
    });
};

const deductEnrollmentCredits = async (userId, courseId, amount, processedBy = null) => {
    return await addCreditTransaction({
        userId,
        transactionType: 'DEBIT',
        amount,
        description: `Course enrollment fee for course ID: ${courseId}`,
        referenceType: 'COURSE_ENROLLMENT',
        referenceId: courseId,
        processedBy: processedBy || userId,
        metadata: { automated: true, courseId }
    });
};

const addManualAdjustment = async (userId, amount, transactionType, description, processedBy) => {
    return await addCreditTransaction({
        userId,
        transactionType,
        amount,
        description: description || `Manual ${transactionType.toLowerCase()} adjustment`,
        referenceType: 'MANUAL_ADJUSTMENT',
        referenceId: null,
        processedBy,
        metadata: { manual: true }
    });
};

module.exports = {
    addCreditTransaction,
    getUserCreditTransactions,
    getUserCreditBalance,
    getCreditTransactionById,
    updateCreditTransactionStatus,
    getCreditTransactionsByReference,
    getUserCreditSummary,
    getAllUserBalances,
    syncUserBalance,
    // Helper methods
    awardCourseCompletionCredits,
    awardQuizCompletionCredits,
    deductEnrollmentCredits,
    addManualAdjustment
};
