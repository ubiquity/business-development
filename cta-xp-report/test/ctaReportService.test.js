const test = require("node:test");
const assert = require("node:assert/strict");

const {
  InMemoryKvStore,
  normalizeRepository,
  canRunFreeReport,
  recordFreeReportRun,
  signDispatchPayload,
  buildReportLink,
  composeEmail,
} = require("../src/ctaReportService");

test("normalizeRepository parses both URL and owner/repo forms", () => {
  assert.deepEqual(normalizeRepository("https://github.com/ubiquity/business-development"), {
    owner: "ubiquity",
    repo: "business-development",
    fullName: "ubiquity/business-development",
  });

  assert.deepEqual(normalizeRepository("ubiquity/business-development"), {
    owner: "ubiquity",
    repo: "business-development",
    fullName: "ubiquity/business-development",
  });
});

test("free report can only run once per org during cooldown window", () => {
  const kv = new InMemoryKvStore();
  const now = Date.UTC(2026, 2, 4, 0, 0, 0);

  const first = canRunFreeReport({ kv, owner: "ubiquity", now });
  assert.equal(first.allowed, true);

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

test("signDispatchPayload generates deterministic signature header", () => {
  const payload = { owner: "ubiquity", repo: "business-development", runId: "r1" };
  const signed = signDispatchPayload(payload, "shh-secret");

  assert.ok(signed.signature.length > 40);
  assert.equal(signed.signatureHeader.startsWith("sha256="), true);

  const again = signDispatchPayload(payload, "shh-secret");
  assert.equal(signed.signature, again.signature);
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
