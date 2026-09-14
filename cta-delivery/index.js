/**
 * CTA Delivery Automation Module for Ubiquity XP Reports
 * Closes #196
 */

const crypto = require("node:crypto");

class CtaDeliveryService {
  /**
   * @param {Object} options
   * @param {string} [options.secretKey] - HMAC secret key for signing dispatch payloads
   * @param {Set<string>} [options.processedOrgs] - Set of already processed organization names
   */
  constructor(options = {}) {
    this.secretKey = options.secretKey || "ubiquity-xp-secret";
    this.processedOrgs = options.processedOrgs || new Set();
  }

  /**
   * Parse owner/repo from GitHub repository URL or slug.
   * @param {string} urlString
   * @returns {{ owner: string, repo: string }}
   */
  parseRepoUrl(urlString) {
    if (!urlString || typeof urlString !== "string") {
      throw new Error("Invalid repository URL: URL must be a non-empty string.");
    }

    const clean = urlString.trim().replace(/\/+$/, "");
    const match = clean.match(/(?:github\.com\/|^)([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);

    if (!match) {
      throw new Error(`Invalid GitHub repository format: '${urlString}'. Expected 'owner/repo' or 'https://github.com/owner/repo'.`);
    }

    return {
      owner: match[1],
      repo: match[2],
    };
  }

  /**
   * Check if organization has already used its one free report.
   * @param {string} orgName
   * @returns {boolean}
   */
  isOrgEligible(orgName) {
    if (!orgName) return false;
    const normalized = orgName.toLowerCase();
    return !this.processedOrgs.has(normalized);
  }

  /**
   * Create a signed payload for workflow dispatch to text-conversation-rewards.
   * @param {Object} params
   * @param {string} params.owner
   * @param {string} params.repo
   * @param {string} params.recipientEmail
   * @param {boolean} [params.isPrivate]
   * @returns {Object}
   */
  createDispatchPayload({ owner, repo, recipientEmail, isPrivate = false }) {
    if (isPrivate) {
      throw new Error(`Private repository '${owner}/${repo}' is not eligible for public CTA reports.`);
    }

    const orgKey = owner.toLowerCase();
    if (!this.isOrgEligible(orgKey)) {
      throw new Error(`Organization '${owner}' has already claimed its one-time free XP report.`);
    }

    const timestamp = Date.now();
    const payloadData = `${owner}/${repo}:${recipientEmail}:${timestamp}`;

    const signature = crypto
      .createHmac("sha256", this.secretKey)
      .update(payloadData)
      .digest("hex");

    // Mark org as processed
    this.processedOrgs.add(orgKey);

    return {
      event_type: "compute_xp_report",
      client_payload: {
        owner,
        repo,
        recipientEmail,
        timestamp,
        signature,
      },
    };
  }

  /**
   * Verify HMAC signature of a dispatch payload.
   * @param {Object} clientPayload
   * @returns {boolean}
   */
  verifyDispatchSignature(clientPayload) {
    const { owner, repo, recipientEmail, timestamp, signature } = clientPayload;
    if (!owner || !repo || !recipientEmail || !timestamp || !signature) {
      return false;
    }

    const payloadData = `${owner}/${repo}:${recipientEmail}:${timestamp}`;
    const expected = crypto
      .createHmac("sha256", this.secretKey)
      .update(payloadData)
      .digest("hex");

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }

  /**
   * Generate narrative report summary email / link message.
   * @param {Object} params
   * @param {string} params.owner
   * @param {string} params.repo
   * @param {number} params.totalXp
   * @param {number} params.rewardsDistributed
   * @returns {{ subject: string, body: string, reportUrl: string }}
   */
  composeReportMessage({ owner, repo, totalXp = 0, rewardsDistributed = 0 }) {
    const reportUrl = `https://ubiquity.net/xp-report/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
    const subject = `Your XP Report for ${owner}/${repo} is Ready!`;

    const body = [
      `Hello,`,
      ``,
      `Here is the automated monthly XP activity report for ${owner}/${repo}:`,
      ``,
      `- Total Contributor XP Earned: ${totalXp} XP`,
      `- Total Rewards Distributed: $${rewardsDistributed} USD`,
      `- Full Interactive Dashboard: ${reportUrl}`,
      ``,
      `Thank you for using Ubiquity OS!`,
    ].join("\n");

    return {
      subject,
      body,
      reportUrl,
    };
  }
}

module.exports = { CtaDeliveryService };
