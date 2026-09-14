const test = require("node:test");
const assert = require("node:assert");
const { CtaDeliveryService } = require("../index.js");

test("CtaDeliveryService - parseRepoUrl parsing", async (t) => {
  const service = new CtaDeliveryService();

  await t.test("parses owner/repo slug", () => {
    const res = service.parseRepoUrl("ubiquity/business-development");
    assert.strictEqual(res.owner, "ubiquity");
    assert.strictEqual(res.repo, "business-development");
  });

  await t.test("parses full GitHub URL", () => {
    const res = service.parseRepoUrl("https://github.com/ubiquity-os/kernel");
    assert.strictEqual(res.owner, "ubiquity-os");
    assert.strictEqual(res.repo, "kernel");
  });

  await t.test("throws error on invalid URL format", () => {
    assert.throws(() => service.parseRepoUrl("invalid_string"), {
      message: /Invalid GitHub repository format/,
    });
  });
});

test("CtaDeliveryService - One-free-run-per-org gating", async (t) => {
  const service = new CtaDeliveryService();

  await t.test("allows initial report for an eligible org", () => {
    assert.strictEqual(service.isOrgEligible("acme-corp"), true);
    const payload = service.createDispatchPayload({
      owner: "acme-corp",
      repo: "widget",
      recipientEmail: "user@acme.com",
    });
    assert.strictEqual(payload.client_payload.owner, "acme-corp");
  });

  await t.test("blocks second report for the same org (case-insensitive)", () => {
    assert.strictEqual(service.isOrgEligible("ACME-CORP"), false);
    assert.throws(() => {
      service.createDispatchPayload({
        owner: "ACME-CORP",
        repo: "another-widget",
        recipientEmail: "user2@acme.com",
      });
    }, {
      message: /has already claimed its one-time free XP report/,
    });
  });
});

test("CtaDeliveryService - Private repository rejection", async (t) => {
  const service = new CtaDeliveryService();

  await t.test("rejects private repositories", () => {
    assert.throws(() => {
      service.createDispatchPayload({
        owner: "private-org",
        repo: "secret-repo",
        recipientEmail: "admin@private.com",
        isPrivate: true,
      });
    }, {
      message: /Private repository 'private-org\/secret-repo' is not eligible/,
    });
  });
});

test("CtaDeliveryService - Signature creation and verification", async (t) => {
  const service = new CtaDeliveryService({ secretKey: "custom-test-secret" });

  await t.test("generates valid HMAC signature that verifies correctly", () => {
    const dispatch = service.createDispatchPayload({
      owner: "test-org",
      repo: "test-repo",
      recipientEmail: "tester@test.com",
    });

    const isValid = service.verifyDispatchSignature(dispatch.client_payload);
    assert.strictEqual(isValid, true);
  });

  await t.test("fails verification if signature is tampered with", () => {
    const dispatch = service.createDispatchPayload({
      owner: "test-org-2",
      repo: "test-repo-2",
      recipientEmail: "tester2@test.com",
    });

    const tampered = { ...dispatch.client_payload, signature: "a".repeat(64) };
    const isValid = service.verifyDispatchSignature(tampered);
    assert.strictEqual(isValid, false);
  });
});

test("CtaDeliveryService - Report message composition", async (t) => {
  const service = new CtaDeliveryService();

  await t.test("formats email subject, body, and report link correctly", () => {
    const msg = service.composeReportMessage({
      owner: "ubiquity",
      repo: "business-development",
      totalXp: 1500,
      rewardsDistributed: 400,
    });

    assert.strictEqual(msg.subject, "Your XP Report for ubiquity/business-development is Ready!");
    assert.ok(msg.body.includes("1500 XP"));
    assert.ok(msg.body.includes("$400 USD"));
    assert.strictEqual(msg.reportUrl, "https://ubiquity.net/xp-report/ubiquity/business-development");
  });
});
