const express = require("express");
const router = express.Router();
const courseBuilderController = require("../controller/CourseBuilder.controller.js");
const authMiddleware = require("../middleware/authMiddleware");
const logger = require('../config/winston.config.js');

// Course Builder - Create/Update with URL processing and course creation
router.post('/createOrUpdateCourseBuilder', authMiddleware, courseBuilderController.createOrUpdateCourseBuilder);

// Course Builder - Get by ID
router.get('/courseBuilder/:courseBuilderId', authMiddleware, courseBuilderController.getCourseBuilderById);

module.exports = router;