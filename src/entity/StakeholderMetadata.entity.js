module.exports = (sequelize, Sequelize) => {
    const StakeholderMetadata = sequelize.define(
        "stakeholder_metadata",
        {
            stakeholderMetadataId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "stkhldm_id",
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "stkhldm_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                field: "stkhldm_w_id",
                references: {
                    model: "workspace",
                    key: "w_id",
                },
                allowNull: false,
            },
            stakeholderId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "stakeholder",
                    key: "stkhld_id",
                },
                field: "stkhldm_stkhld_id",
                allowNull: false,
            },
            queryName: {
                type: Sequelize.STRING,
                allowNull: false,
                field: "stkhldm_query_name",
            },
            key: {
                type: Sequelize.INTEGER,
                field: "stkhldm_key",
            },
            value: {
                type: Sequelize.STRING,
                field: "stkhldm_value",
            },
        },
        {
            timestamps: true,
            createdAt: "stkhldm_created_at",
            updatedAt: "stkhldm_updated_at",
        }
    );
    return StakeholderMetadata;
};
