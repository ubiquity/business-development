# CTA XP Report Prototype (Issue #196)

This package provides a minimal, testable reference implementation for the workflow described in:

- https://github.com/ubiquity/business-development/issues/196

## What it solves

1. **Input validation** for GitHub repository URL or `owner/repo`.
2. **One free report per organization** guardrail via KV-backed keying.
3. **Signed dispatch payload** (`sha256` HMAC) for secure workflow invocation.
4. **Deterministic report link + email message** for delayed delivery UX.

## Suggested integration flow

1. Landing page submits repository + email.
2. API validates repo and checks KV (`free-report:<org>`).
3. API dispatches `text-conversation-rewards` workflow with signed payload.
4. API stores run metadata and sends email with ETA + report link.

## Run tests

```bash
npm test
```

No external dependencies are required.
