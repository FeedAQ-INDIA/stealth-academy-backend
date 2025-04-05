module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define("user", {
      userId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: "u_id",
      },
      firstName: {
        type: Sequelize.STRING(500),
        field: "u_first_name",
      },
      lastName: {
        type: Sequelize.STRING(500),
        field: "u_last_name",
      },
      nameInitial: {
        type: Sequelize.STRING(500),
        field: "u_name_initial",
      },
      email: {
        type: Sequelize.STRING(500),
        field: "u_email", 
        unique: true,
      },
      number: {
        type: Sequelize.STRING(500),
        field: "u_number",
      },
      profilePic: {
        type: Sequelize.STRING(500),
        field: "u_profile_pic",
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
          if (!this.u_created_at) return null;
          const date = new Date(this.u_created_at);
          const day = String(date.getDate()).padStart(2, "0");
          const month = date.toLocaleString("en-US", { month: "short" });
          const year = date.getFullYear();
          return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
        },
      },
      created_time: {
        type: Sequelize.VIRTUAL,
        get() {
          if (!this.u_created_at) return null;
          return this.u_created_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
        },
      },

      updated_date: {
        type: Sequelize.VIRTUAL,
        get() {
          if (!this.u_updated_at) return null;
          const date = new Date(this.u_updated_at);
          const day = String(date.getDate()).padStart(2, "0");
          const month = date.toLocaleString("en-US", { month: "short" });
          const year = date.getFullYear();
          return `${day}-${month}-${year}`; // Format: dd-MMM-YYYY
        },
      },
      updated_time: {
        type: Sequelize.VIRTUAL,
        get() {
          if (!this.u_updated_at) return null;
          return this.u_updated_at.toTimeString().split(" ")[0]; // Format: HH:MM:SS
        },
      },
    } , {
      timestamps: true,
      createdAt: "u_created_at",
      updatedAt: "u_updated_at",
    });
    return User;
  };

