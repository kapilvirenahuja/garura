# CI/CD (Continuous Integration and Deployment)

Automated build, test, and deployment pipelines — from code push to production.

**Search patterns:** CI/CD, GitHub Actions, GitLab CI, deployment, pipeline, automation, continuous integration, continuous deployment, build, test, release

## When to Choose

CI/CD is not optional for any production application. The question is how sophisticated the pipeline needs to be. At minimum: run tests on every PR, build on merge, deploy to staging. Choose more sophisticated pipelines when: the team deploys frequently (daily+), multiple environments are needed (dev/staging/production), the product has multiple deployable units (monorepo, microservices), or compliance requires deployment audit trails. Every team should have CI from day one — the cost of setting up GitHub Actions is trivial compared to the cost of a broken deploy.

## When to Avoid

There's no reason to avoid CI/CD entirely. But avoid over-engineering the pipeline early — a 200-line GitHub Actions workflow for a prototype is over-engineering. Start with the simplest pipeline that runs tests and deploys, then add stages as needs emerge.

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Deploy frequency | Daily to multiple daily | Hourly | Continuous (every commit to prod — need solid testing) |
| Pipeline stages | 3-5 (lint, test, build, deploy, smoke test) | 5-10 | > 10 (pipeline becomes the bottleneck) |
| Build time | < 5 minutes | 5-15 minutes | > 15 minutes (caching, parallelism essential) |

## Key Components

| Platform | Strengths | Best For |
|----------|----------|---------|
| GitHub Actions | Integrated with GitHub, marketplace, generous free tier | GitHub-based projects, most common choice |
| GitLab CI | Integrated with GitLab, powerful pipelines, self-hosted option | GitLab users, self-hosted CI requirements |
| CircleCI | Fast, powerful caching, Docker-native | Complex build pipelines, Docker-heavy workflows |
| Jenkins | Most flexible, self-hosted, plugin ecosystem | Enterprise, custom requirements, legacy |
| Buildkite | Self-hosted agents, SaaS control plane | Hybrid: own compute + managed orchestration |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| Automation | Consistent builds, no manual errors | Pipeline maintenance overhead |
| Speed | Fast feedback on code quality | Build minutes cost money |
| Confidence | Tests run before deploy | Flaky tests erode trust in pipeline |
| Compliance | Audit trail of every deployment | Pipeline complexity for approval gates |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| No CI | Running tests manually (or not at all) | Bugs reach production undetected |
| Deploy without tests | Pipeline skips tests for speed | False confidence in deployments |
| Flaky tests ignored | Tests fail intermittently but are re-run until green | Real bugs hidden by "flaky" label |
| Monolithic pipeline | Single 30-minute pipeline that can't be parallelized | Slow feedback, developer frustration |
| No caching | Downloading dependencies fresh every build | Wasted time and compute |
