const test = require("node:test");
const assert = require("node:assert/strict");

const {
  InMemoryKvStore,
  normalizeRepository,
  organizationKey,
  canRunFreeReport,
  recordFreeReportRun,
  claimFreeReportRun,
  signDispatchPayload,
  buildReportLink,
  composeEmail,
} = require("../src/ctaReportService");

test("normalizeRepository parses both URL and owner/repo forms correctly", () => {
  assert.deepEqual(normalizeRepository("https://github.com/ubiquity/business-development"), {
    owner: "ubiquity",
    repo: "business-development",
    fullName: "ubiquity/business-development",
  });

  assert.deepEqual(normalizeRepository("http://github.com/ubiquity/business-development.git"), {
    owner: "ubiquity",
    repo: "business-development",
    fullName: "ubiquity/business-development",
  });

  assert.deepEqual(normalizeRepository("  ubiquity/business-development/  "), {
    owner: "ubiquity",
    repo: "business-development",
    fullName: "ubiquity/business-development",
  });
});

test("normalizeRepository rejects invalid repository inputs", () => {
  assert.throws(() => normalizeRepository(""), /Repository URL is required/);
  assert.throws(() => normalizeRepository(null), /Repository URL is required/);
  assert.throws(() => normalizeRepository(undefined), /Repository URL is required/);
  assert.throws(() => normalizeRepository("just-a-string"), /Invalid GitHub repository/);
  assert.throws(() => normalizeRepository("https://invalid-url.com"), /Invalid GitHub repository/);
});

test("organizationKey normalizes case to prevent duplication", () => {
  assert.equal(organizationKey("Ubiquity"), "free-report:ubiquity");
  assert.equal(organizationKey("ubiquity"), "free-report:ubiquity");
  assert.throws(() => organizationKey(""), /Owner is required/);
});

test("free report can only run once per org during cooldown window", () => {
  const kv = new InMemoryKvStore();
  const now = Date.UTC(2026, 2, 4, 0, 0, 0);

  const first = canRunFreeReport({ kv, owner: "ubiquity", now });
  assert.equal(first.allowed, true);
  assert.equal(first.reason, "first_run");

  recordFreeReportRun({
    kv,
    owner: "ubiquity",
    repo: "business-development",
    requesterEmail: "test@example.com",
    runId: "run_001",
    now,
  });

  const second = canRunFreeReport({ kv, owner: "ubiquity", now: now + 3600_000 });
  assert.equal(second.allowed, false);
  assert.equal(second.reason, "already_claimed");
  assert.ok(second.nextEligibleAt > now);
});

test("claimFreeReportRun provides atomic check-and-set to prevent race conditions", () => {
  const kv = new InMemoryKvStore();
  const now = Date.UTC(2026, 2, 4, 0, 0, 0);

  const claim1 = claimFreeReportRun({
    kv,
    owner: "Ubiquity",
    repo: "business-development",
    requesterEmail: "user1@example.com",
    runId: "run_100",
    now,
  });

  assert.equal(claim1.claimed, true);
  assert.equal(claim1.reason, "first_run");
  assert.equal(claim1.entry.runId, "run_100");

  // Immediate second claim attempt (simulating concurrent request)
  const claim2 = claimFreeReportRun({
    kv,
    owner: "ubiquity",
    repo: "business-development",
    requesterEmail: "user2@example.com",
    runId: "run_101",
    now: now + 50,
  });

  assert.equal(claim2.claimed, false);
  assert.equal(claim2.reason, "already_claimed");
  assert.equal(claim2.existing.runId, "run_100");
});

test("claimFreeReportRun allows re-run after cooldown expiration", () => {
  const kv = new InMemoryKvStore();
  const now = Date.UTC(2026, 2, 4, 0, 0, 0);
  const cooldownDays = 30;

  claimFreeReportRun({
    kv,
    owner: "ubiquity",
    repo: "business-development",
    requesterEmail: "user@example.com",
    runId: "run_100",
    now,
    cooldownDays,
  });

  const futureNow = now + 31 * 24 * 60 * 60 * 1000;
  const reClaim = claimFreeReportRun({
    kv,
    owner: "ubiquity",
    repo: "business-development",
    requesterEmail: "user@example.com",
    runId: "run_200",
    now: futureNow,
    cooldownDays,
  });

  assert.equal(reClaim.claimed, true);
  assert.equal(reClaim.reason, "cooldown_expired");
  assert.equal(reClaim.entry.runId, "run_200");
});

test("signDispatchPayload generates deterministic HMAC-SHA256 signature header", () => {
  const payload = { owner: "ubiquity", repo: "business-development", runId: "r1" };
  const signed = signDispatchPayload(payload, "shh-secret");

  assert.ok(signed.signature.length >= 64);
  assert.equal(signed.signatureHeader.startsWith("sha256="), true);

  const again = signDispatchPayload(payload, "shh-secret");
  assert.equal(signed.signature, again.signature);

  assert.throws(() => signDispatchPayload(payload, ""), /sharedSecret is required/);
});

test("report link + email formatter includes run metadata", () => {
  const link = buildReportLink({
    dashboardBaseUrl: "https://xp.ubq.fi/",
    owner: "ubiquity",
    repo: "business-development",
    runId: "run_123",
  });

  assert.equal(link, "https://xp.ubq.fi/reports/ubiquity%2Fbusiness-development?runId=run_123");

  const email = composeEmail({
    owner: "ubiquity",
    repo: "business-development",
    runId: "run_123",
    reportLink: link,
    etaMinutes: 45,
  });

  assert.match(email.subject, /ubiquity\/business-development/);
  assert.match(email.text, /run_123/);
  assert.match(email.text, /45 minutes/);
});
