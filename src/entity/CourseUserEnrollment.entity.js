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
        },
        enrollmentStatus: {
            type: Sequelize.ENUM('NOT STARTED', 'ENROLLED','IN PROGRESS','PAUSED', 'COMPLETED', 'CERTIFIED'),
            field: "enrollment_status",
            defaultValue: "NOT STARTED"
        }, 
        v_created_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.enrollment_created_at) return null;
                const date = new Date(this.enrollment_created_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        v_created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.enrollment_created_at) return null;
                return this.enrollment_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },

        v_updated_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.enrollment_updated_at) return null;
                const date = new Date(this.enrollment_updated_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        v_updated_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.enrollment_updated_at) return null;
                return this.enrollment_updated_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },
    } , {
        timestamps: true,
        createdAt: "enrollment_created_at",
        updatedAt: "enrollment_updated_at",
    });
    return CourseUserEnrollment;
};
