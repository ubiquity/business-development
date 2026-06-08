const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const {
  collectCandidates,
  gather,
  parseArgs,
  scoreCandidate,
  serialize,
} = require("./github-prospects");

const fixturePath = path.join(__dirname, "fixtures", "github-prospects.json");

test("parseArgs validates modes and output settings", () => {
  assert.deepEqual(parseArgs(["--mode", "bounties", "--format", "json"]), {
    modes: ["bounties"],
    format: "json",
    limit: 50,
    output: null,
    fixture: null,
  });
  assert.throws(() => parseArgs(["--mode", "unknown"]), /Invalid mode/);
  assert.throws(() => parseArgs(["--limit", "0"]), /positive integer/);
});

test("collectCandidates deduplicates repositories and keeps evidence", async () => {
  const fixture = require(fixturePath);
  const candidates = collectCandidates(fixture.search_results);
  const alpha = candidates.find(
    (candidate) => candidate.repository === "example/alpha",
  );

  assert.equal(candidates.length, 3);
  assert.equal(alpha.evidence.length, 2);
  assert.deepEqual(
    new Set(alpha.evidence.map((evidence) => evidence.mode)),
    new Set(["bounties", "growth"]),
  );
});

test("scoreCandidate rejects archived repositories", () => {
  const result = scoreCandidate({
    evidence: [],
    metadata: { archived: true },
  });
  assert.deepEqual(result, { score: 0, reasons: ["archived or disabled"] });
});

test("fixture run ranks active multi-signal prospects first", async () => {
  const candidates = await gather({
    fixture: fixturePath,
    modes: ["bounties", "growth"],
  });

  assert.equal(candidates.length, 2);
  assert.equal(candidates[0].repository, "example/alpha");
  assert.ok(candidates[0].score > candidates[1].score);
});

test("CSV output is escaped and contains evidence URLs", async () => {
  const candidates = await gather({
    fixture: fixturePath,
    modes: ["bounties", "growth"],
  });
  const output = serialize(candidates, "csv");

  assert.match(output, /"repository"/);
  assert.match(output, /"example\/alpha"/);
  assert.match(output, /https:\/\/github\.com\/example\/alpha\/issues\/1/);
});
