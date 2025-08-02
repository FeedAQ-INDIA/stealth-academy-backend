const { formatDate, formatTime } = require("../utils/dateFormatters");

module.exports = (sequelize, Sequelize) => {
    const CourseAccess = sequelize.define("course_access", {
        courseAccessId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "course_access_id",
        },
        courseId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: "course",
                key: "course_id",
            }
        },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: true, // can be null if assigned to group/org
            references: {
                model: "user",
                key: "user_id",
            }
        },
        organizationId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: "organization",
                key: "organization_id",
            }
        },
        accessLevel: {
            type: Sequelize.ENUM("VIEW", "EDIT", "OWN"),
            defaultValue: "VIEW"
        },
        v_created_date: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatDate(this.course_access_created_at);
            },
        },
        v_created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatTime(this.course_access_created_at);
            },
        },
        v_updated_date: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatDate(this.course_access_updated_at);
            },
        },
        v_updated_time: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatTime(this.course_access_updated_at);
            },
        },
    }, {
        timestamps: true,
        createdAt: "course_access_created_at",
        updatedAt: "course_access_updated_at",
        paranoid: true, // Enable soft deletes
        indexes: [
            {
                fields: ['course_access_course_id']
            },
            {
                fields: ['course_access_type']
            },
            {
                fields: ['course_access_seq']
            },
            {
                fields: ['course_access_is_active']
            }
        ], 
    });
 

    return CourseAccess;
};

