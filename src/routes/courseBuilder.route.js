const express = require("express");
const router = express.Router();
const courseBuilderController = require("../controller/CourseBuilder.controller.js");
const authMiddleware = require("../middleware/authMiddleware");
const logger = require('../config/winston.config.js');

// Course Builder - Register builder (basic title and description)
router.post('/registerBuilder', authMiddleware, courseBuilderController.registerBuilder);

// Course Builder - Create with URL processing and course creation
router.post('/createCourseBuilder', authMiddleware, courseBuilderController.createCourseBuilder);

// Course Builder - Update existing course builder
router.put('/updateCourseBuilder', authMiddleware, courseBuilderController.updateCourseBuilder);

// Course Builder - Create/Update with URL processing and course creation (Legacy)
router.post('/createOrUpdateCourseBuilder', authMiddleware, courseBuilderController.createOrUpdateCourseBuilder);

// Course Builder - Get by ID
router.get('/courseBuilder/:courseBuilderId', authMiddleware, courseBuilderController.getCourseBuilderById);

// Course Builder - Import from YouTube playlist
router.post('/importFromYoutube', authMiddleware, courseBuilderController.importFromYoutube);

module.exports = router;