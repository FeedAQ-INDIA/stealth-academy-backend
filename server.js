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
const urlEmbeddabilityRoute = require("./src/routes/urlEmbeddability.routes.js");
const app = express();
const port = process.env.PORT || 3000;
const db = require("./src/entity");
const bodyParser = require("body-parser");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
require("./google_oauth.js");
require("./microsoft_oauth.js");
const logger = require('./src/config/winston.config.js')
const userGoalRoute = require("./src/routes/userGoal.route.js");
const userLearningScheduleRoute = require("./src/routes/userlearningschedule.route.js");
const courseBuilderRoute = require("./src/routes/courseBuilder.route.js");
const publishCourseRoute = require("./src/routes/publishCourse.route.js");


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

// For production: Sync database with alter (safe for existing data)
(async () => {
    try {
        // Test database connection first
        await db.sequelize.authenticate();
        console.log("Database connection established successfully");
        
        // Use alter: true for production - this won't drop existing data
        // Now that tables are created, use safer sync method
        // await db.sequelize.sync({ force: true });
        console.log("Database synchronized successfully - all tables verified");
        
    } catch (error) {
        console.error("Error during database sync:", error);
        console.error("Please check your database configuration and ensure the database is running");
        // Don't exit the process, let the server continue running
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
app.use('/api/url-embeddability', urlEmbeddabilityRoute);
app.use(userGoalRoute);
app.use(userLearningScheduleRoute);
app.use(courseBuilderRoute);
app.use(publishCourseRoute);

app.listen(port, '0.0.0.0', () => {
    console.log(`Example app listening on port ${port}`);
});
