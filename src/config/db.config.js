module.exports = {
    HOST: "localhost",
    USER: "root",
    PASSWORD: "password",
    DB: "feedaq-academy-node",
    dialect: "mysql",
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }

    // HOST: "db.vtsiasguucuvjjqqooeo.supabase.co",
    // USER: "postgres",
    // PASSWORD: "Feedaq@123", // replace with your actual Supabase password
    // DB: "postgres",
    // dialect: "postgres",
    // port: 5432,
    // pool: {
    //     max: 5,
    //     min: 0,
    //     acquire: 30000,
    //     idle: 10000
    // }
};
  