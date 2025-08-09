const express = require("express");
const router = express.Router();
const organizationController = require("../controller/Organization.controller.js");
const authMiddleware = require("../middleware/authMiddleware");

// Register a new organization
router.post("/registerOrg", authMiddleware, organizationController.registerOrganization);

// Update organization profile
router.put("/organization/:orgId", authMiddleware, organizationController.updateOrganization);

// Get organization details
router.get("/organization/:orgId", authMiddleware, organizationController.getOrganization);

module.exports = router;
