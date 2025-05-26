module.exports = (sequelize, Sequelize) => {
    const InterviewReq = sequelize.define("interview_req", {
        interviewReqId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "interview_req_id",
        },
        userId: {
            type: Sequelize.INTEGER,
            references: {
                model: "user",
                key: "user_id",
            },
            field: "interview_req_user_id",
        },
        interviewReqDate: {
            type: Sequelize.DATE,
            field: "interview_req_date",
            allowNull: false,
        },
        interviewReqTime: {
            type: Sequelize.TIME,
            field: "interview_req_time",
            allowNull: false,
        },
        interviewReqDuration: {
            type: Sequelize.INTEGER,
            field: "interview_req_duration",
            allowNull: false,
        },
        interviewReqCost: {
            type: Sequelize.INTEGER,
            field: "interview_req_cost",
        },
        interviewReqStatus : {
            type: Sequelize.ENUM('REQUESTED','APPROVED','SCHEDULED', 'COMPLETED', 'CANCELLED'),
            field: "interview_req_status",
            allowNull: false,
        },
        interviewReqCancelReason : {
            type: Sequelize.STRING(100),
            field: "interview_req_cancel_reason",
        },
        interviewReqMode: {
            type: Sequelize.ENUM("MICROSOFT TEAMS", "ZOOM", "WEBEX", "GMEET"),
            field: "interview_req_mode",
            allowNull: false,
        },
        interviewReqMedium: {
            type: Sequelize.ENUM("ONLINE", "OFFLINE", "HYBRID"),
            field: "interview_req_medium",
            allowNull: false,
        },
        interviewReqUrl: {
            type: Sequelize.STRING(100),
            field: "interview_req_url",
        },
        interviewRecUrl: {
            type: Sequelize.STRING(100),
            field: "interview_rec_url",
        },
        interviewResult: {
            type: Sequelize.STRING(100),
            field: "interview_result",
        },
        interviewReqTags: {
            type: Sequelize.ARRAY(Sequelize.STRING),
            field: "interview_req_tags",
        },
        interviewReqNote: {
            type: Sequelize.TEXT,
            field: "interview_req_note",
        },
        interviewReqCV: {
            type: Sequelize.STRING(100),
            field: "interview_req_cv",
            allowNull: false,
        },
        interviewReqAttach: {
            type: Sequelize.JSON,
            field: "interview_req_attach",
        },
        interviewInstruct: {
            type: Sequelize.TEXT,
            field: "interview_req_instruct",
        },
        courseTopicId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course_topic",
                key: "course_topic_id",
            },
            field: "interview_req_topic_id",
        },
        courseId: {
            type: Sequelize.INTEGER,
            references: {
                model: "course",
                key: "course_id",
            },
            field: "interview_req_course_id",
        },
        v_created_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.interview_req_created_at) return null;
                const date = new Date(this.interview_req_created_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        v_created_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.interview_req_created_at) return null;
                return this.interview_req_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },

        v_updated_date: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.interview_req_updated_at) return null;
                const date = new Date(this.interview_req_updated_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = date.toLocaleString("en-US", { month: "short" });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
            },
        },
        v_updated_time: {
            type: Sequelize.VIRTUAL,
            get() {
                if (!this.interview_req_updated_at) return null;
                return this.interview_req_updated_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
            },
        },
    } , {
        timestamps: true,
        createdAt: "interview_req_created_at",
        updatedAt: "interview_req_updated_at",
    });
    return InterviewReq;
};

