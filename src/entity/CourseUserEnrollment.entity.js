const { formatDate, formatTime } = require("../utils/dateFormatters");

module.exports = (sequelize, Sequelize) => {
    const CourseUserEnrollment = sequelize.define("course_user_enrollment", {
        enrollmentId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "enrollment_id",
        },
        userId: {
            type: Sequelize.INTEGER,
            references: {
                model: "user",
                key: "user_id",
            },
            field: "enrollment_user_id",
            allowNull: false,
        }, 
        courseId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course",
                key: "course_id",
            },
            field: "enrollment_course_id",
            allowNull: false,
        },
        enrollmentStatus: {
            type: Sequelize.ENUM('NOT_STARTED', 'ENROLLED','IN_PROGRESS','PAUSED', 'COMPLETED', 'CERTIFIED'),
            field: "enrollment_status",
            defaultValue: "NOT_STARTED"
        },
        enrollmentDate: {
            type: Sequelize.DATE,
            field: "enrollment_date",
            defaultValue: Sequelize.NOW
        },
        completionDate: {
            type: Sequelize.DATE,
            field: "enrollment_completion_date",
        },
        progressPercentage: {
            type: Sequelize.DECIMAL(5,2),
            field: "enrollment_progress_percentage",
            defaultValue: 0.00
        },
        certificateUrl: {
            type: Sequelize.STRING(500),
            field: "enrollment_certificate_url",
        },
        metadata: {
            type: Sequelize.JSONB,
            field: "enrollment_metadata",
            defaultValue: {}
        }, 
        v_created_date: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatDate(this.enrollment_created_at);
            },
        },
        v_created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatTime(this.enrollment_created_at);
            },
        },
        v_updated_date: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatDate(this.enrollment_updated_at);
            },
        },
        v_updated_time: {
            type: Sequelize.VIRTUAL,
            get() {
                return formatTime(this.enrollment_updated_at);
            },
        },
    }, {
        timestamps: true,
        createdAt: "enrollment_created_at",
        updatedAt: "enrollment_updated_at",
        deletedAt: "enrollment_deleted_at",
        paranoid: true,
        indexes: [
            {
                unique: true,
                fields: ['enrollment_user_id', 'enrollment_course_id']
            },
            {
                fields: ['enrollment_status']
            }
        ]
    });
    
    return CourseUserEnrollment;
};
