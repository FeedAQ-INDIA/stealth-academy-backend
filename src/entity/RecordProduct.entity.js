module.exports = (sequelize, Sequelize) => {
    const RecordProduct = sequelize.define(
        "record_product",
        {
            recordId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "record",
                    key: "rec_id",
                },
                field: "recproduct_rec_id",
            },
            productId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "product",
                    key: "product_id",
                },
                field: "recproduct_product_id",
            },
            addedBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "recproduct_added_by",
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "recproduct_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false,
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "workspace",
                    key: "w_id",
                },
                field: "recproduct_w_id",
            },

        },
        {
            timestamps: true,
            createdAt: "recproduct_created_at",
            updatedAt: "recproduct_updated_at",
        }
    );
    return RecordProduct;
};
