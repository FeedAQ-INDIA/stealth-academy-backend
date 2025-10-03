// db/turso.js
const { createClient } = require('@libsql/client');
require('dotenv').config();

const turso = createClient({
    url: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTM2MDEwMDUsImlkIjoiMDA4ZWRjNjctY2RhNy00ZmNiLWE2NzctOTgzN2M2YWQzZGIzIiwicmlkIjoiNjM5YzNiNmQtODExYS00OGVkLWEwNjEtZmUxZTJkZWZjOGM3In0.yvERYCkG6RJTvArG2UOaSMX8205IYnBtvMDnrXZchdrK1upy2suWAthB_1T7_rLGfJMQE4MCqM4TjVb6nMJJCg",
    authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTM2MDEwMDUsImlkIjoiMDA4ZWRjNjctY2RhNy00ZmNiLWE2NzctOTgzN2M2YWQzZGIzIiwicmlkIjoiNjM5YzNiNmQtODExYS00OGVkLWEwNjEtZmUxZTJkZWZjOGM3In0.yvERYCkG6RJTvArG2UOaSMX8205IYnBtvMDnrXZchdrK1upy2suWAthB_1T7_rLGfJMQE4MCqM4TjVb6nMJJCg",
});

module.exports = { turso };
