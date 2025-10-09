module.exports = (sequelize, Sequelize) => {
    const Organization = sequelize.define(
        "organization",
        {
            orgId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "org_id",
            },
            orgInitial:{
                 type: Sequelize.STRING(2),
                 field: "org_initial",
                //  allowNull: false
            },
            orgName: {
                type: Sequelize.STRING(100),
                field: "org_name",
                allowNull: false
            },
            orgDescription: {
                type: Sequelize.TEXT,
                field: "org_description",
                allowNull: true
            },
            orgType: {
                type: Sequelize.ENUM("company", "educational", "non_profit", "government", "startup"),
                field: "org_type",
                allowNull: true
            },
            orgIndustry: {
                type: Sequelize.STRING(100),
                field: "org_industry",
                allowNull: true
            },
            orgSize: {
                type: Sequelize.STRING(50),
                field: "org_size",
                allowNull: true
            },
            orgWebsite: {
                type: Sequelize.STRING(255),
                field: "org_website",
                allowNull: true
            },
            orgEmail: {
                type: Sequelize.STRING(100),
                field: "org_email",
                allowNull: false,
                unique: true
            },
            orgContactNo: {
                type: Sequelize.STRING(15),
                field: "org_contact_no"
            },
            orgDomain: {
                type: Sequelize.STRING(100),
                field: "org_domain"
            },
            orgAddress: {
                type: Sequelize.TEXT,
                field: "org_address",
            },
            orgCity: {
                type: Sequelize.STRING(50),
                field: "org_city",
            },
            orgState: {
                type: Sequelize.STRING(50),
                field: "org_state",
            },
            orgCountry: {
                type: Sequelize.STRING(50),
                field: "org_country",
                defaultValue: "India"
            },
            orgPincode: {
                type: Sequelize.STRING(10),
                field: "org_pincode",
            },
            adminName: {
                type: Sequelize.STRING(100),
                field: "admin_name",
                allowNull: true
            },
            adminEmail: {
                type: Sequelize.STRING(100),
                field: "admin_email",
                allowNull: true
            },
            orgStatus: {
                type: Sequelize.ENUM("ACTIVE", "INACTIVE", "SUSPENDED"),
                field: "org_status",
                defaultValue: "ACTIVE"
            },
            metadata: {
                type: Sequelize.JSONB,
                field: "org_metadata",
                defaultValue: {}
            }
        },
        {
            timestamps: true,
            createdAt: "org_created_at",
            updatedAt: "org_updated_at",
            deletedAt: "org_deleted_at",
            // paranoid: true,
            indexes: [
                {
                    fields: ['org_name']
                },
                {
                    fields: ['org_status']
                },
                {
                    fields: ['org_domain']
                },
                {
                    fields: ['org_type']
                },
                {
                    fields: ['org_industry']
                },
                {
                    fields: ['admin_email']
                }
            ]
        }
    );
    return Organization;
};