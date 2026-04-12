# CI/CD Quality Gates
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Assessing whether a project's CI/CD pipeline enforces adequate quality gates before deployment
**When this does NOT apply:** Prototype repositories with no production deployment path
**Search patterns:** GitHub Actions, GitLab CI, pipeline config, test stage, lint stage, build verification, deployment automation, environment promotion, quality gate
**Provenance:** Issue #200 — quality-check skill
**Created:** 2026-04-12

## Content

Assesses whether a project's CI/CD pipeline catches defects and enforces standards before code reaches production. This is distinct from CI/CD tooling selection (see `knowledge/architecture/operations/ci-cd.md`) — the focus here is on what the pipeline actually checks.

### Assessment Checklist

| ID | Check Item | QP Level | Measurement | Tool Reference |
|----|-----------|----------|-------------|----------------|
| OPS-01 | Pipeline configuration file exists and is committed | L2 | Glob for `.github/workflows/*.yml`, `.gitlab-ci.yml`, `Jenkinsfile`, `.circleci/config.yml` | Glob |
| OPS-02 | Pipeline runs on every pull request or merge request | L2 | Read pipeline config; verify trigger includes `pull_request` or `merge_request` | Read pipeline config |
| OPS-03 | Test stage is defined and required to pass before merge | L3 | Check pipeline stages for test job; verify branch protection requires it | Read pipeline config |
| OPS-04 | Lint or static analysis stage is defined and required to pass | L3 | Check pipeline stages for lint/type-check job | Read pipeline config |
| OPS-05 | Build verification step exists (compile, bundle, or image build) | L3 | Check pipeline for build job that fails on error | Read pipeline config |
| OPS-06 | Deployment to staging is automated on merge to main | L4 | Verify pipeline includes deploy-to-staging job triggered by main branch push | Read pipeline config |
| OPS-07 | Environment promotion strategy is defined (staging → production gate) | L4 | Check for manual approval gate or automated promotion condition | Read pipeline config |
| OPS-08 | Full CD pipeline with canary, blue/green, or feature-flag-gated rollout | L5 | Verify deployment strategy config in pipeline or infrastructure code | Read pipeline + IaC |

### Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Pipeline exists but tests not required | CI runs tests but branch protection doesn't enforce passing | Broken code merges when developers override the check |
| Deploy stage runs on every branch | Staging environment overwritten by feature branches | Testing environment is unstable; QA can't rely on it |
| No build verification | Code deploys without confirming it compiles or bundles successfully | Runtime errors from broken builds reach staging or production |
| Long pipeline with no parallelism | All stages run sequentially taking 20+ minutes | Developers stop waiting for CI and merge anyway |
| Pipeline only runs on main | No PR check; defects discovered only after merge | Code review feedback loop broken |

## Why It Matters

A pipeline that exists but doesn't enforce quality gates provides false confidence. The value is in what the pipeline requires — not what it runs. A test stage that can be bypassed is equivalent to no test stage. The checks here assess whether the pipeline is actually a quality gate or just automation theater.

## Applicability Boundaries

**In scope:** Any project with a CI/CD configuration file and at least one production or staging environment
**Out of scope:** Local-only scripts, repositories without deployment pipelines

## Rationale

CI/CD pipeline adequacy is directly observable from config files. It requires no runtime access. Gaps at this layer (missing test enforcement, no staging gate) are the single most common source of production incidents in teams that believe they have "CI/CD."

## Decay Tracking

**Last validated:** 2026-04-12
**Confidence:** high
**Staleness window:** 180 days
**Supersedes:** null
