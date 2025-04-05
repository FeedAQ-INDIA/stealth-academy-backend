module.exports = (sequelize, Sequelize) => {
    const Team = sequelize.define(
        "team",
        {
            teamId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "team_id",
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "workspace",
                    key: "w_id",
                },
                field: "team_w_id",
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "team_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false
            },

            teamName: {
                type: Sequelize.STRING,
                field: "team_name",
                allowNull: false,
                set(value) {
                    this.setDataValue('teamName', value.toUpperCase());
                }
            },

            teamDescription: {
                type: Sequelize.STRING,
                field: "team_description",
                allowNull: true
            },
            teamStatus: {
                type: Sequelize.STRING,
                field: "team_status",
                allowNull: true,
                defaultValue: 'ACTIVE'
            },
            createdBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "team_created_by",
            },
            created_date: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.team_created_at) return null;
                    const date = new Date(this.team_created_at);
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = date.toLocaleString("en-US", { month: "short" });
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
                },
            },
            created_time: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.team_created_at) return null;
                    return this.team_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
                },
            },

            updated_date: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.team_updated_at) return null;
                    const date = new Date(this.team_updated_at);
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = date.toLocaleString("en-US", { month: "short" });
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
                },
            },
            updated_time: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.team_updated_at) return null;
                    return this.team_updated_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
                },
            },
        },
        {
            timestamps: true,
            createdAt: "team_created_at",
            updatedAt: "team_updated_at",
        }
    );
    return Team;
};
