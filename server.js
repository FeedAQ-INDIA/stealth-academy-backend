require("dotenv").config();

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');


const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const commonRoute = require("./src/routes/common.route.js");
const authRoute = require("./src/routes/auth.route.js");
const paymentRoute = require("./src/routes/payment.route.js");
const organizationRoute = require("./src/routes/organization.route.js");
const orgGroupRoute = require("./src/routes/orgGroup.route.js");
const courseAccessRoute = require("./src/routes/courseAccess.route.js");
const creditRoute = require("./src/routes/credit.route.js");
const app = express();
const port = process.env.PORT || 3000;
const db = require("./src/entity");
const bodyParser = require("body-parser");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
require("./google_oauth.js");
require("./microsoft_oauth.js");
const logger = require('./src/config/winston.config.js')


const swaggerOptions = {
    definition: {
        openapi: "3.1.0", info: {
            title: "FeedAQ Academy",
            version: "0.1.0",
            description: "This is made with Express and documented with Swagger",
            license: {
                name: "MIT", url: "https://spdx.org/licenses/MIT.html",
            },
            contact: {
                name: "FeedAQ", url: "https://gcs.feedaq.com", email: "info@email.com",
            },
        }, servers: [{
            url: "http://localhost:3000",
        },],
    }, apis: ["./src/routes/common.route.js", "./server.js", "./src/controller/*.js", "./src/model/*.js",],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs, {explorer: true}));

app.use(cors({
    origin: process.env.ACCESS_CONTROL_ALLOW_ORIGIN, // Update this to your frontend URL
    credentials: true, // Allow credentials (cookies, authorization headers)
}));
app.use(cookieParser());
app.use(bodyParser.json());

// For development: Drop indexes first, then sync
(async () => {
    try {
        const queryInterface = db.sequelize.getQueryInterface();
        
        // Drop all indexes first (this is safe as they'll be recreated)
        // await db.sequelize.query('DROP INDEX IF EXISTS idx_ca_course_id');
        // await db.sequelize.query('DROP INDEX IF EXISTS idx_ca_user_id');
        // await db.sequelize.query('DROP INDEX IF EXISTS idx_ca_org_id');
        // await db.sequelize.query('DROP INDEX IF EXISTS idx_ca_is_active');
        // await db.sequelize.query('DROP INDEX IF EXISTS idx_ca_unique_access');
        // await db.sequelize.query('DROP INDEX IF EXISTS idx_ucp_user_id');
        // await db.sequelize.query('DROP INDEX IF EXISTS idx_ucp_course_id');
        // await db.sequelize.query('DROP INDEX IF EXISTS idx_ucp_created_at');
        // await db.sequelize.query('DROP INDEX IF EXISTS idx_ucp_user_course');
        
        // Then sync with alter
        // await db.sequelize.sync({ alter: true });
        console.log("Database synchronized successfully");
    } catch (error) {
        console.error("Error during sync:", error);
    }
})();



// app.use(function (req, res, next) {
//     // console.log("Req type : " + req.method + ' : ' + req)
//     res.setHeader("Access-Control-Allow-Origin", process.env.ACCESS_CONTROL_ALLOW_ORIGIN);
//     res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
//     res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type");
//     res.setHeader("Access-Control-Allow-Credentials", true);
//     next();
// });

app.use(commonRoute);
app.use(paymentRoute);
app.use(authRoute);
app.use(organizationRoute);
app.use(orgGroupRoute);
app.use('/course-access', courseAccessRoute);
app.use('/credit', creditRoute);

app.listen(port, '0.0.0.0', () => {
    console.log(`Example app listening on port ${port}`);
});
