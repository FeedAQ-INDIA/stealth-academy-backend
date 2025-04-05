module.exports = (sequelize, Sequelize) => {
    const StakeholderComment = sequelize.define(
        "stakeholder_comment",
        {
            commentId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "stkhldcomm_id",
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                field: "stkhldcomm_w_id",
                references: {
                    model: "workspace",
                    key: "w_id",
                },
            },
            stakeholderId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "stakeholder",
                    key: "stkhld_id",
                },
                field: "stkhldcomm_stkhld_id",
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "stkhldcomm_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false,
            },
            commentedBy: {
                type: Sequelize.INTEGER,
                field: "stkhldcomm_commented_by",
                references: {
                    model: "user",
                    key: "u_id",
                },
                allowNull: false,
            },
            comment: {
                type: Sequelize.STRING(3000),
                field: "stkhldcomm_comment",
                allowNull: false,
            },
            created_date: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.stkhldcomm_created_at) return null;
                    const date = new Date(this.stkhldcomm_created_at);
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = date.toLocaleString("en-US", { month: "short" });
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
                },
            },
            created_time: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.stkhldcomm_created_at) return null;
                    return this.stkhldcomm_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
                },
            },

            updated_date: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.stkhldcomm_updated_at) return null;
                    const date = new Date(this.stkhldcomm_updated_at);
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = date.toLocaleString("en-US", { month: "short" });
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
                },
            },
            updated_time: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.stkhldcomm_updated_at) return null;
                    return this.stkhldcomm_updated_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
                },
            },
        },
        {
            timestamps: true,
            createdAt: "stkhldcomm_created_at",
            updatedAt: "stkhldcomm_updated_at",
        }
    );
    return StakeholderComment;
};
