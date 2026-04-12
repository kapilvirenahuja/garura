# Developer Onboarding Documentation
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Assessing whether a new developer can set up and contribute to the project without asking for help
**When this does NOT apply:** Single-developer personal projects with no expectation of contributors
**Search patterns:** README, CONTRIBUTING, onboarding, local setup, environment variables, troubleshooting, developer guide
**Provenance:** Issue #200 — quality-check skill
**Created:** 2026-04-12

## Content

Assesses whether the documentation needed to onboard a new developer — from cloning to first contribution — is present, accurate, and complete.

### Assessment Checklist

| ID | Check Item | QP Level | Measurement | Tool Reference |
|----|-----------|----------|-------------|----------------|
| DOC-09 | README includes project description, tech stack, and purpose | L2 | Read README; verify description + stack sections present | Read |
| DOC-10 | README includes local setup instructions (install, configure, run) | L2 | Check README for setup section with commands | Read |
| DOC-11 | All required environment variables are documented | L3 | Grep for `process.env.` or `os.environ`; verify each has an entry in `.env.example` or docs | Grep + Glob |
| DOC-12 | `.env.example` or equivalent template file is committed | L3 | `test -f .env.example` or `test -f .env.template` | Glob |
| DOC-13 | `CONTRIBUTING.md` exists and describes branch, PR, and review conventions | L3 | `test -f CONTRIBUTING.md`; check for PR workflow section | Glob, Read |
| DOC-14 | Local development setup can be completed following the docs without external help | L4 | Walk through setup docs; verify all commands are executable | Manual verification |
| DOC-15 | Troubleshooting section covers at least 3 common setup failures | L4 | Check README or docs/ for troubleshooting guide | Read |
| DOC-16 | Architecture overview in README or docs/ explains major components in < 5 minutes of reading | L5 | Verify a high-level component explanation exists | Read |

### Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Undocumented env vars | App fails with cryptic errors; dev must read source to find required vars | Onboarding blocked; secrets leaked via trial and error |
| Setup instructions requiring tribal knowledge | "Configure the database" with no DB name, credentials template, or schema location | Each new dev requires a pairing session with an existing dev |
| Stale README commands | `npm start` documented but project has since moved to `pnpm run dev` | Developer trust in docs erodes; docs stop being consulted |
| No CONTRIBUTING.md | PR conventions undocumented; inconsistent branch naming and PR formats | Review friction, merge conflicts, wasted reviewer time |

## Why It Matters

Onboarding documentation determines how quickly new contributors become productive — and how much existing team members are interrupted to answer setup questions. A developer who can self-serve from documentation is independent from day one. Missing documentation is a recurring tax, paid every time someone new joins.

## Applicability Boundaries

**In scope:** Any project with more than one contributor or that expects future contributors
**Out of scope:** Fully internal tools used only by the author; auto-generated projects with no custom setup

## Rationale

Onboarding friction is one of the most consistently underestimated costs in software teams. It is measurable (time to first PR), directly reducible (documentation), and disproportionately affects contractors, new hires, and open-source contributors — the people who need the least friction.

## Decay Tracking

**Last validated:** 2026-04-12
**Confidence:** high
**Staleness window:** 180 days
**Supersedes:** null
