module.exports = (sequelize, Sequelize) => {
    const StakeholderExternalIdentifier = sequelize.define(
        "stakeholder_external_identifier",
        {
            stakeholderExternalIdentifierId: {
                type: Sequelize.STRING,
                primaryKey: true,
                field: "stkhldei_id",
            },
            stakeholderExternalIdentifierType: {
                type: Sequelize.STRING,
                field: "stkhldei_type",
            },
            stakeholderId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "stakeholder",
                    key: "stkhld_id",
                },
                field: "stkhldei_stkhld_id",
                allowNull: false,
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "stkhldei_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                field: "stkhldei_w_id",
                references: {
                    model: "workspace",
                    key: "w_id",
                },
                allowNull: false,
            },
        },
        {
            timestamps: true,
            createdAt: "stkhldei_created_at",
            updatedAt: "stkhldei_updated_at",
        }
    );
    return StakeholderExternalIdentifier;
};
