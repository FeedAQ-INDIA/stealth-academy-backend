module.exports = (sequelize, Sequelize) => {
    const Course = sequelize.define("course", {
        courseId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "course_id",
        },
        courseTitle: {
            type: Sequelize.STRING(100),
            field: "course_title",
            allowNull: false,
        },
        // courseType: {
        //     type: Sequelize.ENUM("COURSE", "WEBINAR"),
        //     field: "course_type",
        //     allowNull: false,
        // },
        courseDescription: {
            type: Sequelize.TEXT,
            field: "course_description",
        },
        courseWhatYouWillLearn: {
            type: Sequelize.ARRAY(Sequelize.STRING),
            field: "course_what_you_will_learn",
        },
        courseKeyFeature: {
            type: Sequelize.ARRAY(Sequelize.STRING),
            field: "course_key_feature",
        },
        courseWhoCanJoin: {
            type: Sequelize.ARRAY(Sequelize.STRING),
            field: "course_who_can_join",
        },
        courseIsCertified: {
            type: Sequelize.BOOLEAN,
            field: "course_is_certified",
            defaultValue: false,
         },
        courseImageUrl: {
            type: Sequelize.ARRAY(Sequelize.STRING),
            field: "course_image_url",
        },
        courseVideoUrl: {
            type:Sequelize.STRING,
            field: "course_video_url",
        },
        courseLevel: {
            type: Sequelize.ENUM("BEGINNER", "ADVANCED", "INTERMEDIATE", "BEGINNER TO ADVANCED"),
            field: "course_level",
        },
        courseDuration: {
            type: Sequelize.INTEGER,
            field: "course_duration",
            allowNull: false,
        },
        courseValidity: {
            type: Sequelize.INTEGER,
            field: "course_validity",
        },
        courseTutor: {
            type: Sequelize.STRING(100),
            field: "course_tutor",
        },
        // courseSource: {
        //     type: Sequelize.ENUM("YOUTUBE"),
        //     field: "course_source",
        //     allowNull: false,
        // },
        courseMode: {
            type: Sequelize.ENUM("RECORDED", "LIVE"),
            field: "course_mode",
            allowNull: false,
        },
        deliveryMode: {
            type: Sequelize.ENUM("ONLINE", "OFFLINE", "HYBRID"),
            field: "delivery_mode",
            allowNull: false,
        },
        courseTags: {
            type: Sequelize.ARRAY(Sequelize.STRING),
            field: "course_tags",
        },
        courseCost: {
            type: Sequelize.INTEGER,
            field: "course_cost",
            allowNull: false,
        },
        courseTotalBatch: {
            type: Sequelize.INTEGER,
            field: "course_total_batch",
            defaultValue: 1
        },
        v_created_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.course_created_at) return null;
                const date = new Date(this.course_created_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        v_created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.course_created_at) return null;
                return this.course_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },

        v_updated_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.course_updated_at) return null;
                const date = new Date(this.course_updated_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        v_updated_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.course_updated_at) return null;
                return this.course_updated_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },
    } , {
        timestamps: true,
        createdAt: "course_created_at",
        updatedAt: "course_updated_at",
    });
    return Course;
};


