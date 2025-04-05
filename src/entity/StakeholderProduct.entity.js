module.exports = (sequelize, Sequelize) => {
    const StakeholderProduct = sequelize.define(
        "stakeholder_product",
        {
            stakeholderId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "stakeholder",
                    key: "stkhld_id",
                },
                field: "stkhldproduct_stkhld_id",
            },
            productId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "product",
                    key: "product_id",
                },
                field: "stkhldproduct_product_id",
            },


            addedBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "stkhldproduct_added_by",
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "stkhldproduct_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                field: "stkhldproduct_w_id",
                references: {
                    model: "workspace",
                    key: "w_id",
                },
                allowNull: false,
            },
        },
        {
            timestamps: true,
            createdAt: "stkhldproduct_created_at",
            updatedAt: "stkhldproduct_updated_at",
        }
    );
    return StakeholderProduct;
};
  