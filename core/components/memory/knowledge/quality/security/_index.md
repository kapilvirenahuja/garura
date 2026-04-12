# Security Quality Standards

Security quality checks covering OWASP Top 10 vulnerabilities, authentication and data protection, and secrets/dependency management. Each file includes concrete grep patterns for detecting vulnerabilities in source code.

## Files

- [OWASP Secure Coding Standards](owasp-secure-coding.md) — SQL injection, XSS, CSRF, input validation, security headers, SAST/DAST | Patterns: OWASP, SQL injection, XSS, CSRF, injection, input validation, CSP
- [Authentication and Data Protection Standards](auth-data-protection.md) — JWT handling, RBAC/ABAC, session management, encryption, password hashing | Patterns: JWT, authentication, authorization, RBAC, bcrypt, argon2, TLS, encryption
- [Secrets and Vulnerability Management](secrets-vulnerability-mgmt.md) — Hardcoded secrets, .env exposure, dependency auditing, SBOM, CVE SLAs | Patterns: secrets, API_KEY, hardcoded credentials, npm audit, snyk, SBOM, trufflehog
