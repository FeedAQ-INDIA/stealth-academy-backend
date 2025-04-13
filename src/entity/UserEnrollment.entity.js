module.exports = (sequelize, Sequelize) => {
    const UserEnrollment = sequelize.define("user_enrollment", {
        userEnrollmentId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "user_enrollment_id",
        },
        userId: {
            type: Sequelize.INTEGER,
            references: {
                model: "user",
                key: "user_id",
            },
            field: "user_enrollment_user_id",
        },
        courseId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course",
                key: "course_id",
            },
            field: "user_enrollment_course_id",
        },
        enrollmentStatus: {
            type: Sequelize.ENUM('ENROLLED','IN PROGRESS','PAUSED', 'COMPLETED', 'CERTIFIED'),
            field: "uel_status",
        },
        created_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.userEnrollment_created_at) return null;
                const date = new Date(this.userEnrollment_created_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.userEnrollment_created_at) return null;
                return this.userEnrollment_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },

        updated_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.userEnrollment_updated_at) return null;
                const date = new Date(this.userEnrollment_updated_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        updated_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.userEnrollment_updated_at) return null;
                return this.userEnrollment_updated_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },
    } , {
        timestamps: true,
        createdAt: "userEnrollment_created_at",
        updatedAt: "userEnrollment_updated_at",
    });
    return UserEnrollment;
};

