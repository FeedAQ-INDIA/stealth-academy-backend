module.exports = (sequelize, Sequelize) => {
    const Tags = sequelize.define(
        "tags",
        {
            tagId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "tag_id",
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "workspace",
                    key: "w_id",
                },
                field: "tag_w_id",
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "tag_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false
            },

            tagName: {
                type: Sequelize.STRING,
                field: "tag_name", 
                allowNull: false,
                set(value) {
                    this.setDataValue('tagName', value.toUpperCase());
                }
            },

            tagDescription: {
                type: Sequelize.STRING,
                field: "tag_description",
                allowNull: true
            },
             
        
            createdBy: {
                type: Sequelize.INTEGER,
                references: {
                    model: "user",
                    key: "u_id",
                },
                field: "tag_created_by",
            },
            tagStatus: {
                type: Sequelize.STRING, //INPROGRESS, READY,
                field: "tag_status",
            },

            created_date: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.tag_created_at) return null;
                    const date = new Date(this.tag_created_at);
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = date.toLocaleString("en-US", { month: "short" });
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
                },
            },
            created_time: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.tag_created_at) return null;
                    return this.tag_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
                },
            },

            updated_date: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.tag_updated_at) return null;
                    const date = new Date(this.tag_updated_at);
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = date.toLocaleString("en-US", { month: "short" });
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
                },
            },
            updated_time: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.tag_updated_at) return null;
                    return this.tag_updated_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
                },
            },
        },
        {
            timestamps: true,
            createdAt: "tag_created_at",
            updatedAt: "tag_updated_at",
        }
    );
    return Tags;
};
