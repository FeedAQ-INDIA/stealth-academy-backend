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
            orgName: {
                type: Sequelize.STRING(100),
                field: "org_name",
                allowNull: false
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
            paranoid: true,
            indexes: [
                {
                    fields: ['org_name']
                },
                {
                    fields: ['org_status']
                },
                {
                    fields: ['org_domain']
                }
            ]
        }
    );
    return Organization;
};