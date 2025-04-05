module.exports = (sequelize, Sequelize) => {
    const Stakeholder = sequelize.define(
        "stakeholder",
        {
            stakeholderId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "stkhld_id",
            },
            stakeholderType: {
                type: Sequelize.STRING,
                field: "stkhld_type",
            },
            firstName: {
                type: Sequelize.STRING,
                field: "stkhld_first_name",
                set(value) {
                    this.setDataValue('firstName', value.toUpperCase());
                }
            },

            lastName: {
                type: Sequelize.STRING,
                field: "stkhld_last_name",
                set(value) {
                    this.setDataValue('lastName', value.toUpperCase());
                }
            },
            nameInitial: {
                type: Sequelize.STRING(500),
                field: "stkhld_name_initial",

                set(value) {
                    this.setDataValue('nameInitial', value.toUpperCase());
                }
            },
            email: {
                type: Sequelize.STRING,
                field: "stkhld_email",
                set(value) {
                    this.setDataValue('email', value.toLowerCase());
                }
            },
            number: {
                type: Sequelize.STRING,
                field: "stkhld_number",
            },
            cbrEmail: {
                type: Sequelize.STRING,
                field: "stkhld_cbr_email",
            },
            cbrNumber: {
                type: Sequelize.STRING,
                field: "stkhld_cbr_number",
            },
            cbrPreference: {
                type: Sequelize.STRING,
                field: "stkhld_cbr_preference",
            },
            orgId: {
                type: Sequelize.INTEGER,
                field: "stkhld_org_id",
                references: {
                    model: "org",
                    key: "org_id",
                },
                allowNull: false
            },
            workspaceId: {
                type: Sequelize.INTEGER,
                field: "stkhld_w_id",
                references: {
                    model: "workspace",
                    key: "w_id",
                },
                allowNull: false,
            },
            layoutId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "layout",
                    key: "layout_id",
                },
                field: "stkhld_layout_id",
            },

            derivedUserName: {
                type: Sequelize.VIRTUAL,
                get() {
                    let dname = ''
                    if (this.firstName) {
                        dname = dname + this.firstName;
                    }
                    if (this.lastName) {
                        dname = dname + ' ' +this.lastName;
                    }
                    return dname;
                },
            },

            created_date: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.stkhld_created_at) return null;
                    const date = new Date(this.stkhld_created_at);
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = date.toLocaleString("en-US", { month: "short" });
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
                },
            },
            created_time: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.stkhld_created_at) return null;
                    return this.stkhld_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
                },
            },
        },
        {
            timestamps: true,
            createdAt: "stkhld_created_at",
            updatedAt: "stkhld_updated_at",
        }
    );
    return Stakeholder;
};
