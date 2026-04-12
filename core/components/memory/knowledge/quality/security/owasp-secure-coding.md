# OWASP Secure Coding Standards
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Any web application, API, or service handling user input or sensitive data
**When this does NOT apply:** Internal tooling with no external inputs and no sensitive data access
**Search patterns:** OWASP, SQL injection, XSS, CSRF, injection, cross-site scripting, input validation, output encoding, security headers
**Provenance:** Issue #200 — quality-check skill
**Created:** 2026-04-12

## Content

The OWASP Top 10 represents the most commonly exploited web application vulnerabilities. Each item has concrete, grep-able indicators in source code. Addressing these is the baseline for any externally-facing service.

### Assessment Checklist

| ID | Check Item | QP Level | Measurement | Tool Reference |
|----|-----------|----------|-------------|----------------|
| SEC-01 | No string concatenation in SQL queries — parameterized queries only | L2 | `grep -rn "SELECT.*\+\|INSERT.*\+\|UPDATE.*\+" src/` flags raw string SQL | grep |
| SEC-02 | No `innerHTML`, `document.write`, or `dangerouslySetInnerHTML` without explicit sanitization | L2 | `grep -rn "innerHTML\|document\.write\|dangerouslySetInnerHTML" src/` | grep |
| SEC-03 | CSRF protection enabled for all state-mutating endpoints | L3 | Check framework CSRF middleware is active; `grep -rn "csrf\|csurf\|SameSite" src/` | grep, middleware audit |
| SEC-04 | All user inputs validated and sanitized before use | L3 | grep for direct `req.body`, `req.query` usage without validation wrapper; check for validator library | grep |
| SEC-05 | Security headers set: `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options` | L3 | `curl -I https://app.example.com` and check response headers | curl, helmet.js |
| SEC-06 | File upload validation: type, size, content checked server-side | L4 | grep for file upload handlers; verify MIME type check is not client-side only | grep |
| SEC-07 | XML/JSON deserialization does not allow type instantiation from user input | L4 | `grep -rn "deserialize\|fromJSON\|yaml.load\b" src/`; verify safe loaders used | grep |
| SEC-08 | Static analysis security scanner runs in CI (SAST) | L4 | `.github/workflows/` includes Semgrep, CodeQL, or Bandit step | Semgrep, CodeQL, Bandit |
| SEC-09 | OWASP ZAP or equivalent DAST scan runs against staging environment | L5 | DAST scan scheduled in CI/CD pipeline; report reviewed each release | OWASP ZAP |
| SEC-10 | Penetration test conducted annually by external party | L5 | Pentest report dated within 12 months; findings tracked to closure | External pentester |

### Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Client-side validation only | Input validated in browser JS but not on server | Bypassed trivially with any HTTP client |
| Allow-list as denylist | Filtering `<script>` tags instead of encoding all HTML | XSS via `<img onerror=`, SVG, or encoding variants |
| Raw ORM queries for dynamic filters | `Model.findAll({ where: rawSqlFragment })` | SQL injection via ORM escape |
| Security headers in comments | CSP policy in a TODO comment, not in actual headers | Zero protection; false sense of security |

## Why It Matters

OWASP Top 10 vulnerabilities account for the majority of successful web application breaches. They are well-understood, have known mitigations, and are detectable with basic tooling — there is no excuse for them in production systems.

## Applicability Boundaries

**In scope:** All web applications, REST/GraphQL APIs, and services that accept external HTTP input
**Out of scope:** Internal microservice-to-microservice communication on private networks with no external input

## Rationale

OWASP secure coding standards are the industry baseline. Compliance demonstrates minimum due diligence. Absence is a liability.

## Decay Tracking

**Last validated:** 2026-04-12
**Confidence:** high
**Staleness window:** 180 days
**Supersedes:** null
