/**
 * URL Embeddability Routes
 * 
 * This file defines all routes for URL iframe embeddability checking functionality
 * 
 * @author FeedAQ Academy
 * @version 1.0
 */

const express = require('express');
const router = express.Router();
const urlEmbeddabilityController = require('../controller/UrlEmbeddability.controller.js');

/**
 * @route POST /api/url-embeddability/check
 * @desc Check if a single URL is embeddable in an iframe
 * @access Public
 * @body {string} url - The URL to check for iframe embeddability
 * @returns {Object} Embeddability result with status and details
 */
router.post('/check', urlEmbeddabilityController.checkUrlEmbeddability);

/**
 * @route POST /api/url-embeddability/check-multiple
 * @desc Check multiple URLs for iframe embeddability
 * @access Public
 * @body {Array<string>} urls - Array of URLs to check (max 10)
 * @returns {Object} Array of embeddability results with summary
 */
router.post('/check-multiple', urlEmbeddabilityController.checkMultipleUrlsEmbeddability);

/**
 * @route GET /api/url-embeddability/domains
 * @desc Get the list of known non-embeddable domains
 * @access Public
 * @returns {Object} List of non-embeddable domains
 */
router.get('/domains', urlEmbeddabilityController.getNonEmbeddableDomains);

/**
 * @route POST /api/url-embeddability/domains/add
 * @desc Add a domain to the non-embeddable domains list
 * @access Public (Note: In production, this should be protected with authentication)
 * @body {string} domain - Domain to add to the restriction list
 * @returns {Object} Success message with added domain
 */
router.post('/domains/add', urlEmbeddabilityController.addNonEmbeddableDomain);

/**
 * @route POST /api/url-embeddability/domains/remove
 * @desc Remove a domain from the non-embeddable domains list
 * @access Public (Note: In production, this should be protected with authentication)
 * @body {string} domain - Domain to remove from the restriction list
 * @returns {Object} Success message with removed domain
 */
router.post('/domains/remove', urlEmbeddabilityController.removeNonEmbeddableDomain);

module.exports = router;
