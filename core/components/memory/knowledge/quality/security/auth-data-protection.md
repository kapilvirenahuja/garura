# Authentication and Data Protection Standards
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Any service with user authentication, session management, or sensitive data storage
**When this does NOT apply:** Public read-only APIs with no authentication and no PII
**Search patterns:** JWT, authentication, authorization, RBAC, ABAC, session, encryption, password hashing, bcrypt, argon2, data protection, TLS
**Provenance:** Issue #200 — quality-check skill
**Created:** 2026-04-12

## Content

Authentication and data protection failures are the most damaging class of security vulnerability. A compromised auth system or exposed PII creates legal liability, user harm, and reputational damage. These checks cover the most common implementation failures.

### Assessment Checklist

| ID | Check Item | QP Level | Measurement | Tool Reference |
|----|-----------|----------|-------------|----------------|
| SEC-11 | JWT tokens have explicit expiry ≤ 1 hour for access tokens | L3 | `grep -rn "expiresIn\|exp:" src/`; verify value ≤ 3600 | grep |
| SEC-12 | JWT refresh tokens are rotated on use and invalidated on logout | L3 | Code review of token refresh endpoint; check refresh token stored in DB and deleted on use | code review |
| SEC-13 | Passwords hashed with bcrypt (cost ≥ 12) or argon2 | L3 | `grep -rn "bcrypt\|argon2" src/`; verify cost factor; `grep -rn "md5\|sha1\|sha256" src/` flags weak hashing | grep |
| SEC-14 | RBAC or ABAC enforced at the service layer, not only the UI | L3 | grep for permission checks in route handlers and service methods; not just in frontend conditionals | grep |
| SEC-15 | Sensitive data encrypted at rest (PII, financial data, credentials) | L4 | Check DB schema for encrypted columns; verify encryption key managed via Vault/KMS not code | DB schema, Vault audit |
| SEC-16 | All data in transit uses TLS 1.2+ (no HTTP, no TLS 1.0/1.1) | L4 | `nmap --script ssl-enum-ciphers -p 443 host` or SSL Labs scan; CI checks TLS config | nmap, SSL Labs |
| SEC-17 | Session tokens stored in HttpOnly, Secure, SameSite=Strict cookies | L4 | `grep -rn "httpOnly\|secure:\|sameSite" src/`; check cookie configuration in auth middleware | grep |
| SEC-18 | Privilege escalation paths tested: low-privilege user cannot access high-privilege resources | L5 | Integration tests with explicit low-privilege user fixtures attempting high-privilege operations | Jest/pytest integration tests |

### Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| JWT in localStorage | Storing JWT access tokens in `localStorage` instead of HttpOnly cookie | XSS can exfiltrate tokens |
| Long-lived access tokens | JWT `expiresIn: "30d"` for access tokens | Compromised token valid for a month |
| Authorization in frontend only | `{isAdmin && <AdminPanel />}` with no server-side check | Frontend gate bypassed by direct API call |
| Plaintext PII in logs | Logging full user objects including email/phone to stdout | PII exposure in log aggregation systems |
| Same key for all environments | Single JWT secret used in dev, staging, and production | Dev key compromise = production compromise |

## Why It Matters

Authentication failures (OWASP A07) consistently appear in breach disclosures. Most are not sophisticated attacks — they exploit basic implementation errors like no token expiry, weak hashing, or missing server-side authorization checks.

## Applicability Boundaries

**In scope:** Any service with login, session management, user data storage, or privileged operations
**Out of scope:** Internal tools accessible only via VPN with no external users and no PII

## Rationale

Auth and data protection standards prevent the most impactful class of security incident. They require architectural discipline from the start — retrofitting strong auth onto a system that wasn't designed for it is expensive and error-prone.

## Decay Tracking

**Last validated:** 2026-04-12
**Confidence:** high
**Staleness window:** 180 days
**Supersedes:** null
