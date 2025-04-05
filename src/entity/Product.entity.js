module.exports = (sequelize, Sequelize) => {
    const Product = sequelize.define(
        "product",
        {
            productId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "product_id",
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                field: "product_w_id",
                references: {
                    model: "workspace",
                    key: "w_id",
                },
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "product_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false,

            },
            layoutId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "layout",
                    key: "layout_id",
                },
                field: "product_layout_id",
            },
            productName: {
                type: Sequelize.STRING(100),
                field: "product_name",
                allowNull: false,
                set(value) {
                    this.setDataValue('productName', value.toUpperCase());
                }
            },
            productCode: {
                type: Sequelize.STRING(50),
                field: "product_code",
                allowNull: true,
                set(value) {
                    this.setDataValue('productCode', value.toUpperCase());
                }
            },
            productDescription: {
                type: Sequelize.STRING(700),
                field: "product_description",
                allowNull: true,
            },
            createdBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "product_created_by",
            },
            productStatus: {
                type: Sequelize.STRING, //INPROGRESS, READY,
                field: "product_status",
                set(value) {
                    this.setDataValue('productStatus', value.toUpperCase());
                }
            },
            created_date: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.product_created_at) return null;
                    const date = new Date(this.product_created_at);
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = date.toLocaleString("en-US", { month: "short" });
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
                },
            },
            created_time: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.product_created_at) return null;
                    return this.product_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
                },
            },

            updated_date: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.product_updated_at) return null;
                    const date = new Date(this.product_updated_at);
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = date.toLocaleString("en-US", { month: "short" });
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
                },
            },
            updated_time: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.product_updated_at) return null;
                    return this.product_updated_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
                },
            },
        },
        {
            timestamps: true,
            createdAt: "product_created_at",
            updatedAt: "product_updated_at",
        }
    );
    return Product;
};
