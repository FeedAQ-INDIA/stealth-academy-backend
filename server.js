require("dotenv").config();

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');


const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const commonRoute = require("./src/routes/common.route.js");
const authRoute = require("./src/routes/auth.route.js");
const paymentRoute = require("./src/routes/payment.route.js");
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

// db.Webinar.sync({ alter: true });

// db.sequelize.sync({alter:true}).then(() => {
//     console.log("Drop and re-sync db.");
// });


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

app.listen(port, '0.0.0.0', () => {
    console.log(`Example app listening on port ${port}`);
});
