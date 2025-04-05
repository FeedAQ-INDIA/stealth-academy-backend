module.exports = (sequelize, Sequelize) => {
    const APIChannelTransaction = sequelize.define(
        "api_channel_transaction",
        {
            apiChTrnId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "apichtrn_id",
            },
            apiChannelId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                field: "apichtrn_apichn_id",
                references: {
                    model: "api_channel",
                    key: "apichn_id",
                },
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                field: "apichtrn_w_id",
                references: {
                    model: "workspace",
                    key: "w_id",
                },
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "apichtrn_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false,
            },
            apiChTrnRequest: {
                type: Sequelize.STRING,
                field: "apichtrn_req",
                allowNull: false,
            },
            apiChTrnResponse: {
                type: Sequelize.STRING,
                field: "apichtrn_res",
                allowNull: false,
            },
            apiChTrnResponseCode: {
                type: Sequelize.STRING,
                field: "apichtrn_res_code",
                allowNull: false,
            },
            apiChTrnIpAddress: {
                type: Sequelize.STRING,
                field: "apichtrn_ip",
                allowNull: false,
            },


        },
        {
            timestamps: true,
            createdAt: "apichtrn_created_at",
            updatedAt: "apichtrn_updated_at",
        }
    );
    return APIChannelTransaction;
};
