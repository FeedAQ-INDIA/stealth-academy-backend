const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const publishCourseController = require('../controller/PublishCourse.controller.js');

// Single API: publishCourse
router.post('/publishCourse', authMiddleware, publishCourseController.publishCourse);

module.exports = router;
