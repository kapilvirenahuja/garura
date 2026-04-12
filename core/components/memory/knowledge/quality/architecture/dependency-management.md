# Dependency Management
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Assessing health, security, and hygiene of a project's third-party dependencies
**When this does NOT apply:** Internal monorepo packages or vendored code under the project's own control
**Search patterns:** outdated dependencies, npm audit, pip-audit, lock file, license compliance, supply chain, CVE, vulnerability
**Provenance:** Issue #200 — quality-check skill
**Created:** 2026-04-12

## Content

Assesses whether a project's external dependencies are current, secure, legally compliant, and necessary — reducing supply chain risk and technical debt accumulation.

### Assessment Checklist

| ID | Check Item | QP Level | Measurement | Tool Reference |
|----|-----------|----------|-------------|----------------|
| ARCH-09 | Lock file is present and committed | All | Check for `package-lock.json`, `yarn.lock`, `poetry.lock`, `Pipfile.lock` | Glob |
| ARCH-10 | Lock file is not stale (committed alongside manifest changes) | All | Compare last-modified dates of lock file vs manifest | `git log` on both files |
| ARCH-11 | Zero known critical/high vulnerabilities in direct dependencies | All | Run vulnerability audit; count critical + high findings | `npm audit`, `pip-audit`, `trivy` |
| ARCH-12 | Outdated direct dependencies are below 20% of total | All | Count outdated vs total; flag if > 20% | `npm outdated`, `pip list --outdated` |
| ARCH-13 | All licenses are compatible with project's distribution model | All | Run license check; flag copyleft in proprietary projects | `license-checker` (JS), `pip-licenses` (Python) |
| ARCH-14 | No unused dependencies declared in manifest | All | Run depcheck or equivalent; count unused entries | `depcheck` (JS), `pip-autoremove` (Python) |
| ARCH-15 | Dependency count is proportional to project scope | All | Flag if > 200 direct + transitive deps for a small service | Manual judgment with `npm ls --depth=0` |
| ARCH-16 | Provenance or integrity verification enabled for critical packages | All | Check for `--ignore-scripts` policy or Sigstore/provenance flags | Package manager config |

### Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| No lock file | Manifest without lock allows non-deterministic installs | Different dep versions per environment |
| Ignored audit output | `npm audit` run but findings never triaged | Known vulnerabilities ship to production |
| Kitchen sink manifest | Every convenient utility added without removing unused ones | Bloated bundle, wider attack surface |
| Pinning without updating | Exact versions pinned but never reviewed | Security patches never applied |

## Why It Matters

Supply chain attacks increasingly target dependency ecosystems. Outdated dependencies with known CVEs are the most common source of exploitable vulnerabilities in production systems. Lock file absence alone can cause environment-specific failures that are expensive to debug.

## Applicability Boundaries

**In scope:** Any project that uses a package manager (npm, pip, gem, cargo, go modules)
**Out of scope:** Fully vendored projects where all dependencies are committed source code under team control

## Rationale

Dependency hygiene is mechanical to assess but frequently neglected. Automated tooling (`npm audit`, `pip-audit`) makes it a zero-cost check that flags real risk — making it a high-signal, low-effort quality gate.

## Decay Tracking

**Last validated:** 2026-04-12
**Confidence:** high
**Staleness window:** 180 days
**Supersedes:** null
