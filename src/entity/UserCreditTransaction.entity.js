const {formatDate, formatTime} = require("../utils/dateFormatters");

module.exports = (sequelize, Sequelize) => {
    const UserCreditTransaction = sequelize.define("user_credit_transaction", {
        transactionId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "transaction_id",
        },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: "user_id",
        },
        transactionType: {
            type: Sequelize.ENUM('CREDIT', 'DEBIT'),
            allowNull: false,
            field: "transaction_type",
        },
        amount: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false,
            field: "amount",
        },
        balanceBefore: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false,
            field: "balance_before",
        },
        balanceAfter: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false,
            field: "balance_after",
        },
        description: {
            type: Sequelize.STRING(255),
            field: "description",
        },
        referenceType: {
            type: Sequelize.ENUM('COURSE_ENROLLMENT', 'COURSE_COMPLETION', 'MANUAL_ADJUSTMENT', 'QUIZ_COMPLETION', 'REFUND', 'PURCHASE'),
            field: "reference_type",
        },
        referenceId: {
            type: Sequelize.INTEGER,
            field: "reference_id",
        },
        transactionStatus: {
            type: Sequelize.ENUM('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'),
            field: "transaction_status",
            defaultValue: 'COMPLETED',
        },
        processedBy: {
            type: Sequelize.INTEGER,
            field: "processed_by",
        },
        transactionDate: {
            type: Sequelize.DATE,
            field: "transaction_date",
            defaultValue: Sequelize.NOW,
        },
        metadata: {
            type: Sequelize.JSON,
            field: "metadata",
        }
    }, {
        tableName: "user_credit_transaction",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        indexes: [
            {
                fields: ['user_id']
            },
            {
                fields: ['transaction_type']
            },
            {
                fields: ['transaction_status']
            },
            {
                fields: ['reference_type', 'reference_id']
            },
            {
                fields: ['transaction_date']
            }
        ]
    });

    UserCreditTransaction.prototype.toJSON = function () {
        let values = Object.assign({}, this.get());
        values.transactionDate = formatDate(values.transactionDate);
        values.createdAt = formatDate(values.createdAt);
        values.updatedAt = formatDate(values.updatedAt);
        return values;
    };

    return UserCreditTransaction;
};
