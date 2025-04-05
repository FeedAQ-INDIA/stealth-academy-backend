module.exports = (sequelize, Sequelize) => {
    const RecordType = sequelize.define(
        "record_type",
        {
            recordTypeId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "rectype_id",
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "workspace",
                    key: "w_id",
                },
                field: "rectype_w_id",
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "rectype_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false
            },
            recordTypeName: {
                type: Sequelize.STRING,
                field: "rectype_name", 
                allowNull: false,
                set(value) {
                    this.setDataValue('recordTypeName', value.toUpperCase());
                }
            },
            createdBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "rectype_created_by",
            },
            created_date: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.rectype_created_at) return null;
                    const date = new Date(this.rectype_created_at);
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = date.toLocaleString("en-US", { month: "short" });
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
                },
            },
            created_time: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.rectype_created_at) return null;
                    return this.rectype_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
                },
            },
            updated_date: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.rectype_updated_at) return null;
                    const date = new Date(this.rectype_updated_at);
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = date.toLocaleString("en-US", { month: "short" });
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
                },
            },
            updated_time: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.rectype_updated_at) return null;
                    return this.rectype_updated_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
                },
            },
        },
        {
            timestamps: true,
            createdAt: "rectype_created_at",
            updatedAt: "rectype_updated_at",
        }
    );
    return RecordType;
};
