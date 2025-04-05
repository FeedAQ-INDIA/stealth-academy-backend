module.exports = (sequelize, Sequelize) => {
    const APIChannel = sequelize.define(
        "api_channel",
        {
            apiChannelId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "apichn_id",
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                field: "apichn_w_id",
                references: {
                    model: "workspace",
                    key: "w_id",
                },
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "apichn_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false,
            },
            createdBy: {
                type: Sequelize.INTEGER,
                field: "apichn_created_by",
                references: {
                    model: "user",
                    key: "u_id",
                },
                allowNull: false,
            },
            apiChannelName: {
                type: Sequelize.STRING,
                field: "apichn_name",
                allowNull: false,
                set(value) {
                    this.setDataValue('apiChannelName', value.toUpperCase());
                }
            },
            apiChannelStatus: {
                type: Sequelize.ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED', 'DELETED'),
                field: "apichn_status",
                allowNull: false,
            },
            apiChannelDescription: {
                type: Sequelize.STRING,
                field: "apichn_description",
                allowNull: false,
            },
            apiChannelKey: {
                type: Sequelize.STRING,
                field: "apichn_key",
                allowNull: false,
            },
            layoutId: {
                type: Sequelize.INTEGER,
                field: "apichn_layout_id",
                references: {
                    model: "layout",
                    key: "layout_id",
                },
                allowNull: false,
            },
            created_date: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.apichn_created_at) return null;
                    const date = new Date(this.apichn_created_at);
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = date.toLocaleString("en-US", { month: "short" });
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
                },
            },
            created_time: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.apichn_created_at) return null;
                    return this.apichn_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
                },
            },

            updated_date: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.apichn_updated_at) return null;
                    const date = new Date(this.apichn_updated_at);
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = date.toLocaleString("en-US", { month: "short" });
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
                },
            },
            updated_time: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.apichn_updated_at) return null;
                    return this.apichn_updated_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
                },
            },
            
        },
        {
            timestamps: true,
            createdAt: "apichn_created_at",
            updatedAt: "apichn_updated_at",
        }
    );
    return APIChannel;
};
