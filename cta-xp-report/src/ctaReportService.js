const crypto = require("node:crypto");

const DEFAULT_COOLDOWN_DAYS = 36500; // effectively once per org for free path

function normalizeRepository(input) {
  if (!input || typeof input !== "string") {
    throw new Error("Repository URL is required");
  }

  const trimmed = input.trim();
  const regex = /^(?:https?:\/\/github\.com\/)?([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git|\/)?$/i;
  const match = trimmed.match(regex);

  if (!match) {
    throw new Error(`Invalid GitHub repository: ${input}`);
  }

  return {
    owner: match[1],
    repo: match[2],
    fullName: `${match[1]}/${match[2]}`,
  };
}

function organizationKey(owner) {
  return `free-report:${owner.toLowerCase()}`;
}

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
}

function canRunFreeReport({ kv, owner, now = Date.now(), cooldownDays = DEFAULT_COOLDOWN_DAYS }) {
  const key = organizationKey(owner);
  const existing = kv.get(key);

  if (!existing) {
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

function buildReportLink({ dashboardBaseUrl, owner, repo, runId }) {
  const encodedRepo = encodeURIComponent(`${owner}/${repo}`);
  return `${dashboardBaseUrl.replace(/\/$/, "")}/reports/${encodedRepo}?runId=${encodeURIComponent(runId)}`;
}

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
  signDispatchPayload,
  buildReportLink,
  composeEmail,
};
