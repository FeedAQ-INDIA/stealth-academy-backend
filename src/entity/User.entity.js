const {formatDate, formatTime} = require("../utils/dateFormatters");
module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define("user", {
      userId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: "user_id",
      },
      firstName: {
        type: Sequelize.STRING(50),
        field: "user_first_name",
      },
      lastName: {
        type: Sequelize.STRING(50),
        field: "user_last_name",
      },
      nameInitial: {
        type: Sequelize.STRING(2),
        field: "user_name_initial",
      },
      email: {
        type: Sequelize.STRING(60),
        field: "user_email", 
        unique: true,
      },
      number: {
        type: Sequelize.STRING(15),
        field: "user_number",
      },
      profilePic: {
        type: Sequelize.STRING(200),
        field: "user_profile_pic",
      },
      derivedUserName: {
        type: Sequelize.VIRTUAL,
        get() {
          if (!this.firstName && !this.lastName) return null;

          return `${this.firstName} ${this.lastName} `; // Format: dd-MMM-YYYY
        },
      },

      created_date: {
        type: Sequelize.VIRTUAL,
        get() {
          return formatDate(this.user_created_at)

        },
      },
      v_created_time: {
        type: Sequelize.VIRTUAL,
        get() {
          return formatTime(this.user_created_at)

        },
      },

      v_updated_date: {
        type: Sequelize.VIRTUAL,
        get() {
          return formatDate(this.user_updated_at)

        },
      },
      v_updated_time: {
        type: Sequelize.VIRTUAL,
        get() {
          return formatTime(this.user_updated_at)

        },
      },
    } , {
      timestamps: true,
      createdAt: "user_created_at",
      updatedAt: "user_updated_at",
    });
    return User;
  };

