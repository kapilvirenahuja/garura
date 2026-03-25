# Security Infrastructure

WAF, secrets management, certificates, network security, and runtime protection.

**Search patterns:** WAF, secrets, Vault, certificates, TLS, network security, zero-trust, encryption, DDoS, firewall, SAST, DAST, supply chain

## When to Choose

Security infrastructure scales with the sensitivity of what you're protecting. Every production application needs HTTPS, secrets management, and input validation. Applications handling user data need encryption at rest, access logging, and vulnerability scanning. Regulated industries need WAF, DDoS protection, formal access controls, and audit trails. The depth depends on NFR-2 (Security) and NFR-7 (Data Sensitivity) — consumer basic needs HTTPS and secrets management; enterprise/BFSI needs zero-trust, HSM, and continuous security monitoring.

## When to Avoid

Don't avoid security — but avoid over-engineering it for prototypes. A POC doesn't need a WAF or HSM. Start with secrets management (don't hardcode keys), HTTPS, and input validation. Add layers as the product approaches production with real user data.

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Security maturity | Level 2-4 (standard to enterprise) | Level 5 (BFSI/gov) | — |
| Attack surface | Web APIs, user-facing apps | Internal services, CI/CD | Air-gapped systems (specialized) |
| Compliance scope | SOC2, basic GDPR | PCI-DSS, HIPAA | FedRAMP, military (specialized consultants) |

## Key Components

| Category | Options | Selection Guidance |
|----------|---------|-------------------|
| Secrets management | AWS Secrets Manager, HashiCorp Vault, Doppler, 1Password (CI) | Secrets Manager for AWS-native; Vault for multi-cloud/on-prem; Doppler for simplicity |
| WAF | AWS WAF, Cloudflare WAF, Azure WAF, ModSecurity | Cloud provider WAF for simplicity; Cloudflare for CDN + WAF |
| DDoS protection | Cloudflare, AWS Shield, Azure DDoS Protection | Cloudflare for default; AWS Shield for AWS-native |
| TLS/Certificates | Let's Encrypt (Caddy auto-TLS), ACM (AWS), Cloudflare | Let's Encrypt/Caddy for self-hosted; ACM for AWS; Cloudflare for CDN-terminated |
| SAST | Snyk, SonarQube, Semgrep, CodeQL (GitHub) | CodeQL for GitHub-native; Snyk for dependency scanning; Semgrep for custom rules |
| Supply chain | Dependabot, Renovate, Socket.dev, npm audit | Dependabot for GitHub; Renovate for advanced; Socket for malicious package detection |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| Secrets management | No hardcoded secrets, rotation capability | Integration effort, secret access patterns |
| WAF | Blocks common attacks (SQLi, XSS, bot traffic) | False positives, rule management |
| Encryption | Data protection at rest and in transit | Performance overhead, key management |
| Scanning | Find vulnerabilities before production | False positives, triage effort, CI pipeline time |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Secrets in code | API keys, passwords in source code or .env committed to Git | Credential exposure, data breach |
| No HTTPS | HTTP in production | Man-in-the-middle attacks, browser warnings |
| Ignoring dependencies | No scanning of npm/pip/maven dependencies | Known vulnerabilities in production |
| Security as afterthought | Adding security only when breached | Expensive remediation, reputation damage |
| Over-permissive IAM | Admin access everywhere because it's easier | Blast radius of any compromise is entire system |
