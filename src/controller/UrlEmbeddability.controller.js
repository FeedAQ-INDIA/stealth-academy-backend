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

/**
 * Check if a single URL is embeddable in an iframe
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const checkUrlEmbeddability = async (req, res) => {
  try {
    const { url } = req.body;

    // Validate input
    if (!url) {
      return res.status(400).json({
        success: false,
        error: "URL is required",
        message: "Please provide a URL to check"
      });
    }

    if (typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        error: "Invalid URL format",
        message: "URL must be a string"
      });
    }

    logger.info(`📥 Received iframe embeddability check request for: ${url}`);

    // Check embeddability
    const result = await urlEmbeddabilityService.checkIframeEmbeddability(url);

    // Return result with appropriate status code
    const statusCode = result.embeddable === null ? 207 : 200; // 207 for partial content when status is unknown

    logger.info(`📤 Returning embeddability result for ${url}: ${result.embeddable}`);

    return res.status(statusCode).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error(`❌ Error in checkUrlEmbeddability: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "An error occurred while checking URL embeddability",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Check multiple URLs for iframe embeddability
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const checkMultipleUrlsEmbeddability = async (req, res) => {
  try {
    const { urls } = req.body;

    // Validate input
    if (!urls) {
      return res.status(400).json({
        success: false,
        error: "URLs are required",
        message: "Please provide an array of URLs to check"
      });
    }

    if (!Array.isArray(urls)) {
      return res.status(400).json({
        success: false,
        error: "Invalid URLs format",
        message: "URLs must be provided as an array"
      });
    }

    if (urls.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Empty URLs array",
        message: "Please provide at least one URL to check"
      });
    }

    if (urls.length > 10) {
      return res.status(400).json({
        success: false,
        error: "Too many URLs",
        message: "Maximum 10 URLs can be checked at once"
      });
    }

    // Validate each URL is a string
    const invalidUrls = urls.filter((url, index) => typeof url !== 'string');
    if (invalidUrls.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid URL format",
        message: "All URLs must be strings"
      });
    }

    logger.info(`📥 Received batch iframe embeddability check request for ${urls.length} URLs`);

    // Check embeddability for all URLs
    const results = await urlEmbeddabilityService.checkMultipleUrls(urls);

    // Count results
    const embeddableCount = results.filter(r => r.embeddable === true).length;
    const nonEmbeddableCount = results.filter(r => r.embeddable === false).length;
    const unknownCount = results.filter(r => r.embeddable === null).length;

    logger.info(`📤 Returning batch embeddability results: ${embeddableCount} embeddable, ${nonEmbeddableCount} non-embeddable, ${unknownCount} unknown`);

    return res.status(200).json({
      success: true,
      data: {
        results: results,
        summary: {
          total: urls.length,
          embeddable: embeddableCount,
          nonEmbeddable: nonEmbeddableCount,
          unknown: unknownCount
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error(`❌ Error in checkMultipleUrlsEmbeddability: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "An error occurred while checking URLs embeddability",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get the list of known non-embeddable domains
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getNonEmbeddableDomains = async (req, res) => {
  try {
    logger.info("📥 Received request for non-embeddable domains list");

    const domains = urlEmbeddabilityService.getNonEmbeddableDomains();

    return res.status(200).json({
      success: true,
      data: {
        domains: domains,
        count: domains.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error(`❌ Error in getNonEmbeddableDomains: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "An error occurred while retrieving non-embeddable domains",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Add a domain to the non-embeddable domains list
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addNonEmbeddableDomain = async (req, res) => {
  try {
    const { domain } = req.body;

    // Validate input
    if (!domain) {
      return res.status(400).json({
        success: false,
        error: "Domain is required",
        message: "Please provide a domain to add"
      });
    }

    if (typeof domain !== 'string') {
      return res.status(400).json({
        success: false,
        error: "Invalid domain format",
        message: "Domain must be a string"
      });
    }

    logger.info(`📥 Received request to add non-embeddable domain: ${domain}`);

    urlEmbeddabilityService.addNonEmbeddableDomain(domain);

    return res.status(200).json({
      success: true,
      message: `Domain '${domain}' added to non-embeddable list`,
      data: {
        addedDomain: domain.toLowerCase().trim()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error(`❌ Error in addNonEmbeddableDomain: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "An error occurred while adding the domain",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Remove a domain from the non-embeddable domains list
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const removeNonEmbeddableDomain = async (req, res) => {
  try {
    const { domain } = req.body;

    // Validate input
    if (!domain) {
      return res.status(400).json({
        success: false,
        error: "Domain is required",
        message: "Please provide a domain to remove"
      });
    }

    if (typeof domain !== 'string') {
      return res.status(400).json({
        success: false,
        error: "Invalid domain format",
        message: "Domain must be a string"
      });
    }

    logger.info(`📥 Received request to remove non-embeddable domain: ${domain}`);

    urlEmbeddabilityService.removeNonEmbeddableDomain(domain);

    return res.status(200).json({
      success: true,
      message: `Domain '${domain}' removed from non-embeddable list`,
      data: {
        removedDomain: domain.toLowerCase().trim()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error(`❌ Error in removeNonEmbeddableDomain: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "An error occurred while removing the domain",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  checkUrlEmbeddability,
  checkMultipleUrlsEmbeddability,
  getNonEmbeddableDomains,
  addNonEmbeddableDomain,
  removeNonEmbeddableDomain
};
