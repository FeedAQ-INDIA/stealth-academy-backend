

module.exports = (sequelize, Sequelize) => {
    const ProductContext = sequelize.define("product_context", {
        productContextId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "productcxt_id",
        },
        orgId: {
            type: Sequelize.INTEGER,
            field: "productcxt_org_id",
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
            field: "productcxt_w_id",
        },
        productId: {
            type: Sequelize.INTEGER,
            references: {
                model: "product",
                key: "product_id",
            },
            field: "productcxt_product_id",
        },
        fieldId: {
            type: Sequelize.INTEGER,
            references: {
                model: "workspace_field",
                key: "wfield_id",
            },
            field: "productcxt_wfield_id",
        },
        orgFieldId: {
            type: Sequelize.INTEGER,
            references: {
                model: "org_field",
                key: "orgfield_id",
            },
            field: "productcxt_orgfield_id",
        },
        fieldValue: {
            type: Sequelize.STRING,
            field: "productcxt_field_value",
        },
        updatedBy: {
            type: Sequelize.INTEGER,
            references: {
                model: "user",
                key: "u_id",
            },
            field: "productcxt_updated_by",
        },
    }, {
        timestamps: true,
        createdAt: "productcxt_created_at",
        updatedAt: "productcxt_updated_at",
    });
    return ProductContext;
};

