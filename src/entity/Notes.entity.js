module.exports = (sequelize, Sequelize) => {
    const Notes = sequelize.define(
        "notes",
        {
            notesId: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: "notes_id",
            },

            userId: {
                type: Sequelize.INTEGER,
                field: "notes_user_id",
                references: {
                    model: "user",
                    key: "user_id",
                },
                allowNull: false,
            },
            notesContentType: {
                type: Sequelize.STRING(100),
                field: "notes_content_type",
                allowNull: false,
            },
            notesContentId: {
                type: Sequelize.STRING(100),
                field: "notes_content_id",
                allowNull: false,
            },
            notesText: {
                type: Sequelize.STRING(3000),
                field: "notes_text",
                allowNull: false,
            },
            created_date: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.notes_created_at) return null;
                    const date = new Date(this.notes_created_at);
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = date.toLocaleString("en-US", {month: "short"});
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
                },
            },
            created_time: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.notes_created_at) return null;
                    return this.notes_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
                },
            },

            updated_date: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.notes_updated_at) return null;
                    const date = new Date(this.notes_updated_at);
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = date.toLocaleString("en-US", {month: "short"});
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
                },
            },
            updated_time: {
                type: Sequelize.VIRTUAL,
                get() {
                    if (!this.notes_updated_at) return null;
                    return this.notes_updated_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
                },
            },
        },
        {
            timestamps: true,
            createdAt: "notes_created_at",
            updatedAt: "notes_updated_at",
        }
    );
    return Notes;
};
