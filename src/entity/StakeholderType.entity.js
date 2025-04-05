module.exports = (sequelize, Sequelize) => {
    const StakeholderType = sequelize.define(
        "stakeholder_type",
        {
            stakeholderTypeId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "stkhldtype_id",
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "workspace",
                    key: "w_id",
                },
                field: "stkhldtype_w_id",
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "stkhldtype_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false
            },
            stakeholderTypeName: {
                type: Sequelize.STRING,
                field: "stkhldtype_name", 
                allowNull: false,
                set(value) {
                    this.setDataValue('stakeholderTypeName', value.toUpperCase());
                }
            },
            createdBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "stkhldtype_created_by",
            },
            created_date: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.stkhldtype_created_at) return null;
                    const date = new Date(this.stkhldtype_created_at);
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = date.toLocaleString("en-US", { month: "short" });
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
                },
            },
            created_time: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.stkhldtype_created_at) return null;
                    return this.stkhldtype_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
                },
            },
            updated_date: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.stkhldtype_updated_at) return null;
                    const date = new Date(this.stkhldtype_updated_at);
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = date.toLocaleString("en-US", { month: "short" });
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
                },
            },
            updated_time: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.stkhldtype_updated_at) return null;
                    return this.stkhldtype_updated_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
                },
            },
        },
        {
            timestamps: true,
            createdAt: "stkhldtype_created_at",
            updatedAt: "stkhldtype_updated_at",
        }
    );
    return StakeholderType;
};
