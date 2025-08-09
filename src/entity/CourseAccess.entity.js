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
            },
            field: "course_access_course_id",
        },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: true, // can be null if assigned to group/org
            references: {
                model: "user",
                key: "user_id",
            },
            field: "course_access_user_id",
        },
        organizationId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: "organization",
                key: "org_id",
            },
            field: "course_access_org_id",
        },
        accessLevel: {
            type: Sequelize.ENUM("OWN", "SHARED",  "ADMIN"),
            defaultValue: "READ",
            field: "course_access_level",
            allowNull: false,
        },
        isActive: {
            type: Sequelize.BOOLEAN,
            field: "course_access_is_active",
            defaultValue: true,
        },
        expiresAt: {
            type: Sequelize.DATE,
            field: "course_access_expires_at",
        },
        grantedByUserId: {
            type: Sequelize.INTEGER,
            references: {
                model: "user",
                key: "user_id",
            },
            field: "course_access_granted_by_user_id",
        },
        grantedByOrganizationId: {
            type: Sequelize.INTEGER,
            references: {
                model: "organization",
                key: "org_id",
            },
            field: "course_access_granted_by_org_id",
        },
        metadata: {
            type: Sequelize.JSONB,
            field: "course_access_metadata",
            defaultValue: {}
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
        deletedAt: "course_access_deleted_at",
        paranoid: true, // Enable soft deletes
        indexes: [
            {
                fields: ['course_access_course_id']
            },
            {
                fields: ['course_access_user_id']
            },
            {
                fields: ['course_access_org_id']
            },
            {
                fields: ['course_access_is_active']
            },
            {
                unique: true,
                fields: ['course_access_course_id', 'course_access_user_id', 'course_access_org_id']
            }
        ]
    });
 
    return CourseAccess;
};

