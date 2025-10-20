/**
 * URL Embeddability Controller
 * 
 * This controller handles HTTP requests for checking URL iframe embeddability
 * 
 * @author FeedAQ Academy
 * @version 1.0
 */

const urlEmbeddabilityService = require("../service/UrlEmbeddability.service.js");
const logger = require("../config/winston.config.js");
const { ApiResponse } = require("../utils/responseFormatter");

/**
 * Check if a single URL is embeddable in an iframe
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const checkUrlEmbeddability = async (req, res) => {
  const apiResponse = new ApiResponse(req, res);
  
  try {
    const { url } = req.body;

    // Validate input
    if (!url) {
      return apiResponse
        .status(400)
        .withMessage("URL is required")
        .withError("Please provide a URL to check", "MISSING_FIELD", "checkUrlEmbeddability")
        .error();
    }

    if (typeof url !== 'string') {
      return apiResponse
        .status(400)
        .withMessage("Invalid URL format")
        .withError("URL must be a string", "INVALID_TYPE", "checkUrlEmbeddability")
        .error();
    }

    logger.info(`📥 Received iframe embeddability check request for: ${url}`);

    // Check embeddability
    const result = await urlEmbeddabilityService.checkIframeEmbeddability(url);

    // Return result with appropriate status code
    const statusCode = result.embeddable === null ? 207 : 200; // 207 for partial content when status is unknown

    logger.info(`📤 Returning embeddability result for ${url}: ${result.embeddable}`);

    apiResponse
      .status(statusCode)
      .withMessage(result.embeddable === null ? "Embeddability status unknown" : 
                   result.embeddable ? "URL is embeddable" : "URL is not embeddable")
      .withData({ result })
      .withMeta({
        url,
        checkedAt: new Date().toISOString()
      })
      .success();

  } catch (error) {
    logger.error(`❌ Error in checkUrlEmbeddability: ${error.message}`);
    apiResponse
      .status(500)
      .withMessage("An error occurred while checking URL embeddability")
      .withError(error, "CHECK_EMBEDDABILITY_ERROR", "checkUrlEmbeddability", 
                 process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined)
      .error();
  }
};

/**
 * Check multiple URLs for iframe embeddability
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const checkMultipleUrlsEmbeddability = async (req, res) => {
  const apiResponse = new ApiResponse(req, res);
  
  try {
    const { urls } = req.body;

    // Validate input
    if (!urls) {
      return apiResponse
        .status(400)
        .withMessage("URLs are required")
        .withError("Please provide an array of URLs to check", "MISSING_FIELD", "checkMultipleUrlsEmbeddability")
        .error();
    }

    if (!Array.isArray(urls)) {
      return apiResponse
        .status(400)
        .withMessage("Invalid URLs format")
        .withError("URLs must be provided as an array", "INVALID_TYPE", "checkMultipleUrlsEmbeddability")
        .error();
    }

    if (urls.length === 0) {
      return apiResponse
        .status(400)
        .withMessage("Empty URLs array")
        .withError("Please provide at least one URL to check", "EMPTY_ARRAY", "checkMultipleUrlsEmbeddability")
        .error();
    }

    if (urls.length > 10) {
      return apiResponse
        .status(400)
        .withMessage("Too many URLs")
        .withError("Maximum 10 URLs can be checked at once", "LIMIT_EXCEEDED", "checkMultipleUrlsEmbeddability")
        .error();
    }

    // Validate each URL is a string
    const invalidUrls = urls.filter((url, index) => typeof url !== 'string');
    if (invalidUrls.length > 0) {
      return apiResponse
        .status(400)
        .withMessage("Invalid URL format")
        .withError("All URLs must be strings", "INVALID_URL_TYPE", "checkMultipleUrlsEmbeddability")
        .error();
    }

    logger.info(`📥 Received batch iframe embeddability check request for ${urls.length} URLs`);

    // Check embeddability for all URLs
    const results = await urlEmbeddabilityService.checkMultipleUrls(urls);

    // Count results
    const embeddableCount = results.filter(r => r.embeddable === true).length;
    const nonEmbeddableCount = results.filter(r => r.embeddable === false).length;
    const unknownCount = results.filter(r => r.embeddable === null).length;

    logger.info(`📤 Returning batch embeddability results: ${embeddableCount} embeddable, ${nonEmbeddableCount} non-embeddable, ${unknownCount} unknown`);

    apiResponse
      .status(200)
      .withMessage("Batch embeddability check completed")
      .withData({
        results: results,
        summary: {
          total: urls.length,
          embeddable: embeddableCount,
          nonEmbeddable: nonEmbeddableCount,
          unknown: unknownCount
        }
      })
      .withMeta({
        totalRequested: urls.length,
        checkedAt: new Date().toISOString()
      })
      .success();

  } catch (error) {
    logger.error(`❌ Error in checkMultipleUrlsEmbeddability: ${error.message}`);
    apiResponse
      .status(500)
      .withMessage("An error occurred while checking URLs embeddability")
      .withError(error, "BATCH_CHECK_ERROR", "checkMultipleUrlsEmbeddability",
                 process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined)
      .error();
  }
};

/**
 * Get the list of known non-embeddable domains
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getNonEmbeddableDomains = async (req, res) => {
  const apiResponse = new ApiResponse(req, res);
  
  try {
    logger.info("📥 Received request for non-embeddable domains list");

    const domains = urlEmbeddabilityService.getNonEmbeddableDomains();

    apiResponse
      .status(200)
      .withMessage("Non-embeddable domains retrieved successfully")
      .withData({
        domains: domains,
        count: domains.length
      })
      .withMeta({
        retrievedAt: new Date().toISOString()
      })
      .success();

  } catch (error) {
    logger.error(`❌ Error in getNonEmbeddableDomains: ${error.message}`);
    apiResponse
      .status(500)
      .withMessage("An error occurred while retrieving non-embeddable domains")
      .withError(error, "GET_DOMAINS_ERROR", "getNonEmbeddableDomains",
                 process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined)
      .error();
  }
};

/**
 * Add a domain to the non-embeddable domains list
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addNonEmbeddableDomain = async (req, res) => {
  const apiResponse = new ApiResponse(req, res);
  
  try {
    const { domain } = req.body;

    // Validate input
    if (!domain) {
      return apiResponse
        .status(400)
        .withMessage("Domain is required")
        .withError("Please provide a domain to add", "MISSING_FIELD", "addNonEmbeddableDomain")
        .error();
    }

    if (typeof domain !== 'string') {
      return apiResponse
        .status(400)
        .withMessage("Invalid domain format")
        .withError("Domain must be a string", "INVALID_TYPE", "addNonEmbeddableDomain")
        .error();
    }

    logger.info(`📥 Received request to add non-embeddable domain: ${domain}`);

    urlEmbeddabilityService.addNonEmbeddableDomain(domain);

    apiResponse
      .status(200)
      .withMessage(`Domain '${domain}' added to non-embeddable list`)
      .withData({
        addedDomain: domain.toLowerCase().trim()
      })
      .withMeta({
        addedAt: new Date().toISOString()
      })
      .success();

  } catch (error) {
    logger.error(`❌ Error in addNonEmbeddableDomain: ${error.message}`);
    apiResponse
      .status(500)
      .withMessage("An error occurred while adding the domain")
      .withError(error, "ADD_DOMAIN_ERROR", "addNonEmbeddableDomain",
                 process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined)
      .error();
  }
};

/**
 * Remove a domain from the non-embeddable domains list
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const removeNonEmbeddableDomain = async (req, res) => {
  const apiResponse = new ApiResponse(req, res);
  
  try {
    const { domain } = req.body;

    // Validate input
    if (!domain) {
      return apiResponse
        .status(400)
        .withMessage("Domain is required")
        .withError("Please provide a domain to remove", "MISSING_FIELD", "removeNonEmbeddableDomain")
        .error();
    }

    if (typeof domain !== 'string') {
      return apiResponse
        .status(400)
        .withMessage("Invalid domain format")
        .withError("Domain must be a string", "INVALID_TYPE", "removeNonEmbeddableDomain")
        .error();
    }

    logger.info(`📥 Received request to remove non-embeddable domain: ${domain}`);

    urlEmbeddabilityService.removeNonEmbeddableDomain(domain);

    apiResponse
      .status(200)
      .withMessage(`Domain '${domain}' removed from non-embeddable list`)
      .withData({
        removedDomain: domain.toLowerCase().trim()
      })
      .withMeta({
        removedAt: new Date().toISOString()
      })
      .success();

  } catch (error) {
    logger.error(`❌ Error in removeNonEmbeddableDomain: ${error.message}`);
    apiResponse
      .status(500)
      .withMessage("An error occurred while removing the domain")
      .withError(error, "REMOVE_DOMAIN_ERROR", "removeNonEmbeddableDomain",
                 process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined)
      .error();
  }
};

module.exports = {
  checkUrlEmbeddability,
  checkMultipleUrlsEmbeddability,
  getNonEmbeddableDomains,
  addNonEmbeddableDomain,
  removeNonEmbeddableDomain
};
