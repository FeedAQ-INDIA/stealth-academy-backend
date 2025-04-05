module.exports = (sequelize, Sequelize) => {
    const RecordTeam = sequelize.define(
        "record_team",
        {
            recordId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "record",
                    key: "rec_id",
                },
                field: "recteam_rec_id",
            },
            teamId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "team",
                    key: "team_id",
                },
                field: "recteam_team_id",
            },
             
             
            addedBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "recteam_added_by",
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "recteam_org_id",
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
                field: "recteam_w_id",
            },
        },
        {
            timestamps: true,
            createdAt: "recteam_created_at",
            updatedAt: "recteam_updated_at",
        }
    );
    return RecordTeam;
};
  