const crypto = require("node:crypto");

const DEFAULT_COOLDOWN_DAYS = 36500; // effectively once per org for free path

/**
 * Normalizes GitHub repository string or URL into owner and repository components.
 * @param {string} input GitHub repository URL or "owner/repo" string.
 * @returns {{ owner: string, repo: string, fullName: string }}
 */
function normalizeRepository(input) {
  if (!input || typeof input !== "string") {
    throw new Error("Repository URL is required");
  }

  const trimmed = input.trim();
  const regex = /^(?:https?:\/\/)?(?:www\.)?(?:github\.com\/)?([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git|\/)?$/i;
  const match = trimmed.match(regex);

  if (!match || !match[1] || !match[2]) {
    throw new Error(`Invalid GitHub repository: ${input}`);
  }

  const owner = match[1];
  const repo = match[2];

  return {
    owner,
    repo,
    fullName: `${owner}/${repo}`,
  };
}

/**
 * Derives the unique organization KV storage key.
 * @param {string} owner
 * @returns {string}
 */
function organizationKey(owner) {
  if (!owner || typeof owner !== "string") {
    throw new Error("Owner is required for organizationKey");
  }
  return `free-report:${owner.toLowerCase()}`;
}

/**
 * In-memory KV store supporting atomic check-and-set operations for race safety.
 */
class InMemoryKvStore {
  constructor(seed = {}) {
    this.map = new Map(Object.entries(seed));
  }

  get(key) {
    return this.map.get(key);
  }

  set(key, value) {
    this.map.set(key, value);
  }

  /**
   * Atomic claim check-and-set to guarantee single execution per key within cooldown window.
   * @param {string} key
   * @param {object} value
   * @param {number} cooldownMs
   * @param {number} now
   * @returns {{ claimed: boolean, reason: string, entry?: object, existing?: object, nextEligibleAt?: number }}
   */
  claimAtomic(key, value, cooldownMs, now) {
    const existing = this.map.get(key);

    if (existing && existing.startedAt) {
      const elapsedMs = now - existing.startedAt;
      if (elapsedMs < cooldownMs) {
        return {
          claimed: false,
          reason: "already_claimed",
          existing,
          nextEligibleAt: existing.startedAt + cooldownMs,
        };
      }
    }

    this.map.set(key, value);
    return {
      claimed: true,
      reason: existing ? "cooldown_expired" : "first_run",
      entry: value,
    };
  }
}

/**
 * Checks whether an organization is eligible for a free report run.
 */
function canRunFreeReport({ kv, owner, now = Date.now(), cooldownDays = DEFAULT_COOLDOWN_DAYS }) {
  const key = organizationKey(owner);
  const existing = kv.get(key);

  if (!existing || !existing.startedAt) {
    return { allowed: true, reason: "first_run" };
  }

  const elapsedMs = now - existing.startedAt;
  const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;

  if (elapsedMs >= cooldownMs) {
    return { allowed: true, reason: "cooldown_expired" };
  }

  return {
    allowed: false,
    reason: "already_claimed",
    nextEligibleAt: existing.startedAt + cooldownMs,
  };
}

/**
 * Records a free report run in the KV store (non-atomic fallback).
 */
function recordFreeReportRun({ kv, owner, repo, requesterEmail, runId, now = Date.now() }) {
  const key = organizationKey(owner);
  const value = {
    owner,
    repo,
    requesterEmail,
    runId,
    startedAt: now,
  };

  kv.set(key, value);
  return value;
}

/**
 * Atomically claims and records a free report run to eliminate race conditions.
 */
function claimFreeReportRun({
  kv,
  owner,
  repo,
  requesterEmail,
  runId,
  now = Date.now(),
  cooldownDays = DEFAULT_COOLDOWN_DAYS,
}) {
  const key = organizationKey(owner);
  const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
  const value = {
    owner,
    repo,
    requesterEmail,
    runId,
    startedAt: now,
  };

  if (typeof kv.claimAtomic === "function") {
    return kv.claimAtomic(key, value, cooldownMs, now);
  }

  // Non-atomic fallback for basic stores
  const check = canRunFreeReport({ kv, owner, now, cooldownDays });
  if (!check.allowed) {
    return {
      claimed: false,
      reason: check.reason,
      nextEligibleAt: check.nextEligibleAt,
    };
  }

  recordFreeReportRun({ kv, owner, repo, requesterEmail, runId, now });
  return {
    claimed: true,
    reason: check.reason,
    entry: value,
  };
}

/**
 * Signs a dispatch payload using HMAC-SHA256.
 */
function signDispatchPayload(payload, sharedSecret) {
  if (!sharedSecret) {
    throw new Error("sharedSecret is required");
  }

  const body = JSON.stringify(payload);
  const signature = crypto.createHmac("sha256", sharedSecret).update(body).digest("hex");

  return {
    body,
    signature,
    signatureHeader: `sha256=${signature}`,
  };
}

/**
 * Builds the URL link to the report on the Ubiquity dashboard.
 */
function buildReportLink({ dashboardBaseUrl = "https://xp.ubq.fi/", owner, repo, runId }) {
  const encodedRepo = encodeURIComponent(`${owner}/${repo}`);
  const cleanBase = dashboardBaseUrl.replace(/\/$/, "");
  return `${cleanBase}/reports/${encodedRepo}?runId=${encodeURIComponent(runId)}`;
}

/**
 * Composes notification email subject and text for requested XP reports.
 */
function composeEmail({ owner, repo, runId, reportLink, etaMinutes = 60 }) {
  return {
    subject: `Your free XP report is processing for ${owner}/${repo}`,
    text: [
      `Thanks for trying the XP report preview for ${owner}/${repo}.`,
      "",
      `Run ID: ${runId}`,
      `Estimated completion: ~${etaMinutes} minutes`,
      `Report link: ${reportLink}`,
      "",
      "We currently allow one free org-level report to prevent abuse.",
    ].join("\n"),
  };
}

module.exports = {
  DEFAULT_COOLDOWN_DAYS,
  InMemoryKvStore,
  normalizeRepository,
  organizationKey,
  canRunFreeReport,
  recordFreeReportRun,
  claimFreeReportRun,
  signDispatchPayload,
  buildReportLink,
  composeEmail,
};
