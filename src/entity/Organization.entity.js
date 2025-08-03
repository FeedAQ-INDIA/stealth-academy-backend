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
                type: Sequelize.STRING,
                field: "org_first_name",
            },
            orgEmail: {
                type: Sequelize.STRING,
                field: "org_email",
            },
            orgContactNo: {
                type: Sequelize.STRING,
                field: "org_contact_no",
            },
            orgDomain: {
                type: Sequelize.STRING,
                field: "org_domain",
            }
        },
        {
            timestamps: true,
            createdAt: "org_created_at",
            updatedAt: "org_updated_at",
        }
    );
    return Organization;
};