/**
 * URL Embeddability Service
 * 
 * This service handles checking if URLs can be embedded in iframes
 * by analyzing HTTP headers and domain restrictions.
 * 
 * @author FeedAQ Academy
 * @version 1.0
 */

const logger = require("../config/winston.config.js");

/**
 * URL Embeddability Service for checking iframe compatibility
 */
class UrlEmbeddabilityService {
  constructor() {
    // List of known domains that typically restrict iframe embedding
    this.nonEmbeddableDomains = [
      'facebook.com',
      'twitter.com', 
      'x.com',
      'instagram.com',
      'linkedin.com',
      'github.com',
      'google.com',
      'youtube.com' // Note: YouTube has specific embed URLs that work
    ];
  }

  /**
   * Check if a URL is embeddable in an iframe
   * @param {string} url - The URL to check for iframe embeddability
   * @returns {Promise<Object>} Object containing embeddable status and details
   */
  async checkIframeEmbeddability(url) {
    try {
      logger.info(`🔍 Checking iframe embeddability for URL: ${url}`);

      // Validate URL format
      let validUrl;
      try {
        validUrl = new URL(url);
      } catch (error) {
        logger.error(`❌ Invalid URL format: ${url}`);
        return {
          embeddable: false,
          reason: 'Invalid URL format',
          details: 'The provided URL is not properly formatted',
          url: url
        };
      }

      // Check for known non-embeddable domains
      const hostname = validUrl.hostname.toLowerCase();
      const isKnownNonEmbeddable = this.nonEmbeddableDomains.some(domain => 
        hostname.includes(domain)
      );

      if (isKnownNonEmbeddable) {
        logger.warn(`⚠️ Known non-embeddable domain detected: ${hostname}`);
        return {
          embeddable: false,
          reason: 'Known restricted domain',
          details: `${hostname} typically restricts iframe embedding`,
          url: url,
          hostname: hostname
        };
      }

      // Make HEAD request to check headers
      const headerCheckResult = await this.checkUrlHeaders(url, validUrl);
      return headerCheckResult;

    } catch (error) {
      logger.error(`💥 Error checking iframe embeddability: ${error.message}`);
      return {
        embeddable: null,
        reason: 'Internal error',
        details: `Error during check: ${error.message}`,
        url: url
      };
    }
  }

  /**
   * Check URL headers for iframe restrictions
   * @param {string} url - Original URL string
   * @param {URL} validUrl - Parsed URL object
   * @returns {Promise<Object>} Header check result
   */
  async checkUrlHeaders(url, validUrl) {
    const https = require('https');
    const http = require('http');
    const { parse } = require('url');

    return new Promise((resolve) => {
      const parsedUrl = parse(url);
      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.path,
        method: 'HEAD',
        timeout: 10000,
        headers: {
          'User-Agent': 'FeedAQ-Academy-Bot/1.0',
          'Accept': '*/*'
        }
      };

      const req = client.request(options, (res) => {
        const headers = res.headers;
        
        // Check X-Frame-Options header
        const xFrameOptions = headers['x-frame-options'];
        if (xFrameOptions) {
          const value = xFrameOptions.toLowerCase();
          if (value === 'deny' || value === 'sameorigin') {
            logger.warn(`🚫 X-Frame-Options restricts embedding: ${xFrameOptions}`);
            resolve({
              embeddable: false,
              reason: 'X-Frame-Options restriction',
              details: `Server returned X-Frame-Options: ${xFrameOptions}`,
              url: url,
              statusCode: res.statusCode,
              headers: { 'x-frame-options': xFrameOptions }
            });
            return;
          }
        }

        // Check Content-Security-Policy header
        const csp = headers['content-security-policy'];
        if (csp && csp.includes('frame-ancestors')) {
          const frameAncestorsMatch = csp.match(/frame-ancestors\s+([^;]+)/i);
          if (frameAncestorsMatch) {
            const frameAncestors = frameAncestorsMatch[1].trim();
            if (frameAncestors === "'none'" || frameAncestors === "'self'") {
              logger.warn(`🚫 CSP restricts embedding: frame-ancestors ${frameAncestors}`);
              resolve({
                embeddable: false,
                reason: 'Content-Security-Policy restriction',
                details: `Server returned frame-ancestors: ${frameAncestors}`,
                url: url,
                statusCode: res.statusCode,
                headers: { 'content-security-policy': csp }
              });
              return;
            }
          }
        }

        // If no restrictions found
        logger.info(`✅ URL appears to be embeddable: ${url}`);
        resolve({
          embeddable: true,
          reason: 'No restrictions detected',
          details: 'No X-Frame-Options or CSP frame-ancestors restrictions found',
          url: url,
          statusCode: res.statusCode,
          headers: {
            'x-frame-options': xFrameOptions || null,
            'content-security-policy': csp || null
          }
        });
      });

      req.on('timeout', () => {
        logger.error(`⏰ Request timeout for URL: ${url}`);
        req.destroy();
        resolve({
          embeddable: null,
          reason: 'Request timeout',
          details: 'Unable to determine embeddability due to timeout',
          url: url
        });
      });

      req.on('error', (error) => {
        logger.error(`❌ Request error for URL: ${url} - ${error.message}`);
        resolve({
          embeddable: null,
          reason: 'Network error',
          details: `Unable to check headers: ${error.message}`,
          url: url
        });
      });

      req.end();
    });
  }

  /**
   * Check multiple URLs for iframe embeddability
   * @param {Array<string>} urls - Array of URLs to check
   * @returns {Promise<Array<Object>>} Array of embeddability results
   */
  async checkMultipleUrls(urls) {
    if (!Array.isArray(urls)) {
      throw new Error('URLs must be provided as an array');
    }

    logger.info(`🔍 Checking iframe embeddability for ${urls.length} URLs`);

    const results = await Promise.allSettled(
      urls.map(url => this.checkIframeEmbeddability(url))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        logger.error(`❌ Error checking URL ${urls[index]}: ${result.reason}`);
        return {
          embeddable: null,
          reason: 'Processing error',
          details: `Error processing URL: ${result.reason}`,
          url: urls[index]
        };
      }
    });
  }

  /**
   * Add a domain to the non-embeddable domains list
   * @param {string} domain - Domain to add to the restriction list
   */
  addNonEmbeddableDomain(domain) {
    if (typeof domain !== 'string' || domain.trim() === '') {
      throw new Error('Domain must be a non-empty string');
    }

    const cleanDomain = domain.toLowerCase().trim();
    if (!this.nonEmbeddableDomains.includes(cleanDomain)) {
      this.nonEmbeddableDomains.push(cleanDomain);
      logger.info(`➕ Added domain to non-embeddable list: ${cleanDomain}`);
    }
  }

  /**
   * Remove a domain from the non-embeddable domains list
   * @param {string} domain - Domain to remove from the restriction list
   */
  removeNonEmbeddableDomain(domain) {
    if (typeof domain !== 'string' || domain.trim() === '') {
      throw new Error('Domain must be a non-empty string');
    }

    const cleanDomain = domain.toLowerCase().trim();
    const index = this.nonEmbeddableDomains.indexOf(cleanDomain);
    if (index > -1) {
      this.nonEmbeddableDomains.splice(index, 1);
      logger.info(`➖ Removed domain from non-embeddable list: ${cleanDomain}`);
    }
  }

  /**
   * Get the current list of non-embeddable domains
   * @returns {Array<string>} Array of non-embeddable domains
   */
  getNonEmbeddableDomains() {
    return [...this.nonEmbeddableDomains];
  }
}

// Create a singleton instance
const urlEmbeddabilityService = new UrlEmbeddabilityService();

module.exports = urlEmbeddabilityService;
