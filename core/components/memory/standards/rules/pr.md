# PR Severity Taxonomy

**Purpose:** Deterministic mapping from KB quality standard IDs to PR severity buckets P1–P4. Used by `quality-check-scoped` to classify findings on PR diffs.

**Mechanical rule:** Every row has `Standard ID`, `Severity`, `Match Rule` (grep regex or path glob), and `Evidence Required`. **No LLM judgment.** If no Match Rule fires against the diff, no finding is emitted for that standard. If a finding cannot be tied to a row in this table by `Standard ID`, the skill MUST reject it (F3 enforcement).

**Severity buckets:**
- **P1 — Blocker.** Halts ship pipeline. Security, secrets, injection, auth, data-loss, breaking API contract, migration safety.
- **P2 — Major.** Highlights without blocking. Lint errors, missing tests for new code, error-handling violations, load-critical perf regressions, structural BE/FE violations.
- **P3 — Minor.** Highlights without blocking. Missing docs, borderline complexity, accessibility, naming.
- **P4 — Nit.** Suppressed by default; surfaced only in evidence. Style-only, tech-debt TODOs.

**Match Rule syntax:**
- `grep:<regex>` — applied to added lines (`^\+` in unified diff, excluding `^\+\+\+`).
- `path:<glob>` — applied to `changed_paths[]`. Multiple globs comma-separated.
- `grep+path:<regex>|<glob>` — both must match.
- Match Rules are case-insensitive unless noted.

**Evidence Required:** every finding row in `findings.yaml` MUST carry the listed evidence fields (file + line + matched substring or path).

---

## Severity Table

| Standard ID | Severity | Match Rule | Evidence Required |
|---|---|---|---|
| SEC-01 | P1 | `grep:(execute\|query)\s*\(\s*["'\x60].*\+.*["'\x60]` | file, line, sql-fragment |
| SEC-02 | P1 | `grep:(innerHTML\s*=\|document\.write\|dangerouslySetInnerHTML)` | file, line, snippet |
| SEC-03 | P1 | `grep+path:(POST\|PUT\|PATCH\|DELETE).*route\|@(Post\|Put\|Patch\|Delete)\|router\.(post\|put\|patch\|delete)|*.{js,ts,py,go,java,rb}` | file, line, route-decl |
| SEC-04 | P2 | `grep:(req\.body\|req\.query\|req\.params\|request\.json)` | file, line, snippet |
| SEC-05 | P2 | `path:**/{middleware,server,app}.{js,ts,py,go}` | file, line, header-config |
| SEC-06 | P1 | `grep:(multer\|upload\|formidable\|FileUpload)` | file, line, validation-snippet |
| SEC-07 | P1 | `grep:(JSON\.parse\|yaml\.load\|pickle\.load\|unmarshal)` | file, line, snippet |
| SEC-08 | P3 | `path:.github/workflows/**,.gitlab-ci.yml,Jenkinsfile` | file, line |
| SEC-09 | P3 | `path:.github/workflows/**,.gitlab-ci.yml` | file, line |
| SEC-10 | P4 | `path:docs/security/**` | file |
| SEC-11 | P1 | `grep:(jwt\|JWT)\.(sign\|encode)` | file, line, expiry-config |
| SEC-12 | P1 | `grep:(refreshToken\|refresh_token)` | file, line, snippet |
| SEC-13 | P1 | `grep:(bcrypt\|argon2\|scrypt\|hash.*password\|password.*hash\|md5\|sha1)` | file, line, algorithm |
| SEC-14 | P1 | `grep:(authorize\|hasRole\|requireRole\|@PreAuthorize\|isAdmin)` | file, line, snippet |
| SEC-15 | P1 | `grep:(encrypt\|decrypt\|cipher\|aes)` | file, line, snippet |
| SEC-16 | P1 | `grep:(http://\|TLSv1\.0\|TLSv1\.1\|sslv[23])` | file, line, snippet |
| SEC-17 | P1 | `grep:(setCookie\|res\.cookie\|Set-Cookie)` | file, line, cookie-flags |
| SEC-18 | P2 | `grep:(role\|permission\|isAdmin\|can\()` | file, line, snippet |
| SEC-19 | P1 | `grep:(api[_-]?key\|secret\|password\|token)\s*[:=]\s*["'\x60][^"'\x60$]{8,}["'\x60]` | file, line, redacted-snippet |
| SEC-20 | P1 | `path:.env,.env.*,!.env.example,!.env.sample` | file |
| SEC-21 | P3 | `path:.github/workflows/**` | file, line |
| SEC-22 | P2 | `path:package.json,requirements.txt,go.mod,Gemfile,pom.xml` | file, line, dep-name |
| SEC-23 | P2 | `grep:(process\.env\.[A-Z_]+\|os\.environ)` | file, line, snippet |
| SEC-24 | P4 | `path:.github/dependabot.yml,renovate.json` | file |
| SEC-25 | P4 | `path:**/sbom*,**/CHANGELOG*` | file |
| SEC-26 | P4 | `path:CHANGELOG.md,SECURITY.md` | file |
| ARCH-01 | P2 | `grep+path:(import\|require).*(db\|database\|prisma\|sequelize\|mongoose)|**/{components,views,pages,ui}/**` | file, line, import |
| ARCH-02 | P2 | `path:**/*.{js,ts,py,go,java}` | file, cycle-trace |
| ARCH-03 | P3 | `path:**/*.{js,ts,py,go,java,rb}` | file, line-count |
| ARCH-04 | P2 | `grep+path:(SELECT\|INSERT\|UPDATE\|DELETE\|prisma\.\|knex\().*|**/{routes,controllers,handlers}/**` | file, line, snippet |
| ARCH-05 | P3 | `path:**/{routes,controllers,handlers}/**` | file, line |
| ARCH-06 | P2 | `grep+path:(import\|require).*(db\|prisma\|redis\|kafka)|**/{test,tests,__tests__,spec}/**` | file, line, import |
| ARCH-07 | P2 | `grep:(localhost:\|127\.0\.0\.1\|https?://[a-z]+\.\|sk_live_\|api\.example)` | file, line, snippet |
| ARCH-08 | P3 | `path:**/*.{js,ts,py,go}` | file |
| ARCH-09 | P1 | `path:package.json,requirements.txt,go.mod,Gemfile,pom.xml` | file, lock-presence |
| ARCH-10 | P1 | `path:package.json,package-lock.json,yarn.lock,pnpm-lock.yaml,poetry.lock,go.sum,Gemfile.lock` | file, drift-evidence |
| ARCH-11 | P1 | `path:package.json,requirements.txt,go.mod,Gemfile` | file, cve-list |
| ARCH-12 | P3 | `path:package.json,requirements.txt,go.mod` | file, version-list |
| ARCH-13 | P2 | `path:package.json,LICENSE,LICENCE` | file, license-list |
| ARCH-14 | P3 | `path:package.json,requirements.txt,go.mod` | file, unused-list |
| ARCH-15 | P4 | `path:package.json,requirements.txt,go.mod` | file, count |
| ARCH-16 | P4 | `path:package.json,go.sum,requirements.txt` | file |
| ARCH-17 | P1 | `grep+path:(@(Get\|Post\|Put\|Patch\|Delete)\|router\.(get\|post\|put\|patch\|delete)\|app\.(get\|post\|put\|patch\|delete))|**/{routes,controllers,handlers,api}/**` | file, line, method-resource-pair |
| ARCH-18 | P2 | `grep:(res\.status\|status_code\|HttpStatus\.)` | file, line, status-code |
| ARCH-19 | P2 | `grep+path:(/v[0-9]+/\|api-version)|**/{routes,api}/**` | file, line, version-marker |
| ARCH-20 | P2 | `grep:(throw\s+new\|return.*error\|res\.json.*error)` | file, line, snippet |
| ARCH-21 | P2 | `grep+path:(findAll\|findMany\|SELECT\s+\*\|\.all\(\))|**/{routes,controllers,handlers}/**` | file, line, snippet |
| ARCH-22 | P3 | `path:**/{middleware,routes}/**` | file, line |
| ARCH-23 | P4 | `path:docs/architecture/**,docs/adr/**` | file |
| ARCH-24 | P4 | `path:CHANGELOG.md,docs/api/**` | file |
| BE-01 | P3 | `grep+path:(@(Get\|Post\|Put\|Patch\|Delete)\|router\.)|**/{routes,controllers,api}/**` | file, line, snippet |
| BE-02 | P1 | `grep+path:(req\.body\|request\.json\|@RequestBody)|**/{routes,controllers,handlers}/**` | file, line, snippet |
| BE-03 | P2 | `grep:(throw\|return).*ValidationError\|400` | file, line, snippet |
| BE-04 | P2 | `grep:(rateLimit\|throttle\|limiter)` | file, line, snippet |
| BE-05 | P1 | `grep+path:(findMany\|findAll\|SELECT\s+\*\|\.all\()|**/{routes,controllers,handlers}/**` | file, line, snippet |
| BE-06 | P2 | `grep:(res\.json.*error\|return.*error)` | file, line, schema-snippet |
| BE-07 | P2 | `grep+path:(/v[0-9]+/)|**/{routes,api}/**` | file, line |
| BE-08 | P1 | `grep:(\?token=\|\?password=\|\?api_key=\|/users/[^/]+/(token\|password))` | file, line, snippet |
| BE-09 | P2 | `grep:catch\s*\([^)]*\)\s*\{\s*\}` | file, line, snippet |
| BE-10 | P2 | `grep:(\.then\([^)]*\)\s*$\|await\s+[^;]+;.*\/\/\s*fire-and-forget)` | file, line, snippet |
| BE-11 | P2 | `grep:(consumer\|subscribe\|onMessage\|@RabbitListener)` | file, line, snippet |
| BE-12 | P2 | `grep:(fetch\|axios\|http\.get\|requests\.get\|httpClient)` | file, line, timeout-config |
| BE-13 | P3 | `grep:(retry\|backoff)` | file, line, snippet |
| BE-14 | P3 | `grep:(SIGTERM\|SIGINT\|gracefulShutdown\|on\(["']exit)` | file, line, snippet |
| BE-15 | P2 | `grep+path:(async.*=>\|async function)|**/{routes,controllers,handlers}/**` | file, line, snippet |
| BE-16 | P2 | `grep:(unhandledRejection\|uncaughtException\|sys\.excepthook)` | file, line, snippet |
| BE-17 | P2 | `grep:for\s*\([^)]*\)\s*\{[^}]*(findOne\|findById\|SELECT)` | file, line, snippet |
| BE-18 | P2 | `grep:SELECT\s+\*` | file, line, snippet |
| BE-19 | P2 | `grep:(SELECT\|FROM\|JOIN)` | file, line, query |
| BE-20 | P1 | `path:**/migrations/**,**/db/migrate/**,**/alembic/**` | file, line, ddl-snippet |
| BE-21 | P2 | `grep:(createPool\|Pool\(\|connection_pool)` | file, line, config-snippet |
| BE-22 | P3 | `grep:(cache\.set\|redis\.set\|memcached)` | file, line, snippet |
| BE-23 | P4 | `grep:(stampede\|mutex\|lock)` | file, line |
| BE-24 | P1 | `grep:(execute\|query)\s*\(\s*["'\x60].*\$\{` | file, line, snippet |
| CODE-01 | P3 | `path:.eslintrc*,.prettierrc*,pyproject.toml,ruff.toml,tslint.json,.rubocop.yml` | file |
| CODE-02 | P3 | `path:.prettierrc*,.editorconfig` | file |
| CODE-03 | P2 | `path:**/*.{js,ts,jsx,tsx,py,go,rb}` | file, line, lint-message |
| CODE-04 | P2 | `path:**/*.{js,ts,jsx,tsx,py,go,rb}` | file, format-diff |
| CODE-05 | P3 | `path:.husky/**,.pre-commit-config.yaml` | file |
| CODE-06 | P4 | `path:.editorconfig` | file |
| CODE-07 | P3 | `path:.eslintrc*,package.json` | file, version-pin |
| CODE-08 | P4 | `path:eslint-rules/**,.eslintrc*` | file |
| CODE-09 | P3 | `path:**/*.{js,ts,jsx,tsx,py,go,rb,java}` | file, function, complexity-score |
| CODE-10 | P3 | `path:**/*.{js,ts,jsx,tsx,py,go,rb,java}` | file, function, line-count |
| CODE-11 | P3 | `path:**/*.{js,ts,jsx,tsx,py,go,rb,java}` | file, function, depth |
| CODE-12 | P3 | `path:**/*.{js,ts,jsx,tsx,py,go,rb,java}` | file, line-count |
| CODE-13 | P4 | `path:**/*.{js,ts,jsx,tsx,py,go,rb,java}` | file |
| CODE-14 | P2 | `path:**/*.{js,ts,jsx,tsx,py,go}` | file, cycle-trace |
| CODE-15 | P3 | `path:**/*.{js,ts,jsx,tsx,py,go,rb,java}` | file, function, score |
| CODE-16 | P4 | `path:sonar-project.properties,.sonarcloud.properties` | file |
| CODE-17 | P3 | `path:**/*.{js,ts,jsx,tsx,py,go,rb,java}` | file, line, identifier |
| CODE-18 | P3 | `path:**/*.{js,ts,jsx,tsx,java,cs}` | file, line, identifier |
| CODE-19 | P4 | `path:**/*.{js,ts,jsx,tsx,py,go,rb,java}` | file, line, identifier |
| CODE-20 | P4 | `path:**/*` | file |
| CODE-21 | P3 | `grep:(let\|const\|var)\s+[a-z]\s*=` | file, line, identifier |
| CODE-22 | P4 | `grep:(let\|const\|var)\s+(is\|has\|can\|should)?[A-Z][a-z]+\s*=` | file, line, identifier |
| CODE-23 | P3 | `grep:(throw\s+new\s+Error\|raise\s+Exception)` | file, line, snippet |
| CODE-24 | P2 | `grep:catch\s*\([^)]*\)\s*\{\s*\}` | file, line, snippet |
| CODE-25 | P3 | `grep:(catch\s*\(\|except\s)` | file, line, snippet |
| CODE-26 | P1 | `grep:(res\.json.*err\.stack\|res\.send.*err\.\|return.*err\.stack)` | file, line, snippet |
| CODE-27 | P3 | `grep:(retry\|fallback\|circuit)` | file, line |
| CODE-28 | P3 | `path:**/{middleware,handlers,routes}/**` | file, line |
| CODE-29 | P4 | `grep:(Result<\|Either<\|Option<)` | file, line |
| CODE-30 | P3 | `grep+path:(catch\|throw)|**/{test,tests,__tests__,spec}/**` | file, line |
| TEST-01 | P2 | `grep+path:(export\s+(default\s+)?(function\|class\|const)\|def\s)|!**/{test,tests,__tests__,spec}/**` | file, function-name |
| TEST-02 | P3 | `path:**/{test,tests,__tests__,spec}/**` | file, line |
| TEST-03 | P3 | `path:**/{test,tests,__tests__,spec}/**` | file, test-name, assert-count |
| TEST-04 | P3 | `grep+path:(jest\.mock\|sinon\.\|unittest\.mock\|mocker)|**/{test,tests,__tests__,spec}/**` | file, line, mock-target |
| TEST-05 | P4 | `path:**/{test,tests,__tests__,spec}/**` | file, test-name |
| TEST-06 | P3 | `path:**/{test,tests,__tests__,spec}/**` | file, line |
| TEST-07 | P4 | `path:**/{test,tests,__tests__,spec}/**` | file |
| TEST-08 | P4 | `path:**/{test,tests,__tests__,spec}/**` | file, line |
| TEST-09 | P4 | `grep:(toMatchSnapshot\|snapshot)` | file, line |
| TEST-10 | P4 | `path:**/.stryker*` | file |
| TEST-11 | P2 | `path:**/{integration,e2e}/**` | file, line |
| TEST-12 | P2 | `path:**/{integration,e2e}/**` | file, line |
| TEST-13 | P3 | `path:**/{e2e,cypress,playwright}/**` | file |
| TEST-14 | P3 | `path:**/{contract,pact}/**` | file |
| TEST-15 | P3 | `path:.github/workflows/**` | file, line |
| TEST-16 | P3 | `path:**/{integration,e2e}/**` | file, line |
| TEST-17 | P4 | `path:cypress.config*,playwright.config*` | file |
| TEST-18 | P3 | `path:**/{contract,pact}/**` | file |
| TEST-19 | P3 | `path:**/{coverage,jest.config*,vitest.config*,pyproject.toml}` | file, threshold |
| TEST-20 | P3 | `path:**/{coverage,jest.config*,vitest.config*}` | file, threshold |
| TEST-21 | P3 | `path:.github/workflows/**` | file, line |
| TEST-22 | P4 | `path:**/{test,tests,__tests__,spec,e2e,integration}/**` | file, ratio |
| TEST-23 | P3 | `path:**/{coverage,jest.config*,vitest.config*}` | file, threshold |
| TEST-24 | P4 | `path:**/flaky*` | file |
| TEST-25 | P4 | `path:**/.stryker*` | file |
| TEST-26 | P4 | `path:.github/workflows/**` | file |
| DOC-01 | P3 | `path:README.md,README.rst,README.txt` | file |
| DOC-02 | P3 | `path:**/openapi*,**/swagger*,**/api-spec*` | file |
| DOC-03 | P3 | `path:**/openapi*,**/swagger*` | file, endpoint-coverage |
| DOC-04 | P3 | `path:docs/adr/**,docs/decisions/**` | file |
| DOC-05 | P4 | `path:docs/adr/**` | file |
| DOC-06 | P4 | `path:docs/architecture/**,docs/diagrams/**` | file |
| DOC-07 | P4 | `path:docs/deployment/**,docs/ops/**` | file |
| DOC-08 | P3 | `path:CHANGELOG.md,docs/api/**` | file |
| DOC-09 | P3 | `path:README.md` | file |
| DOC-10 | P3 | `path:README.md` | file |
| DOC-11 | P3 | `path:.env.example,README.md,docs/setup/**` | file |
| DOC-12 | P3 | `path:.env.example,.env.sample` | file |
| DOC-13 | P4 | `path:CONTRIBUTING.md` | file |
| DOC-14 | P4 | `path:README.md,docs/setup/**` | file |
| DOC-15 | P4 | `path:README.md,docs/troubleshooting/**` | file |
| DOC-16 | P4 | `path:README.md,docs/architecture/**` | file |
| FE-01 | P3 | `grep:<img(?![^>]*\salt=)` | file, line, snippet |
| FE-02 | P3 | `grep+path:(<button\|<a\s\|onClick\|tabIndex)|**/*.{jsx,tsx,vue,svelte}` | file, line, snippet |
| FE-03 | P3 | `grep:(color:\s*#\|background.*#)` | file, line, color |
| FE-04 | P3 | `grep:(role=\|aria-)` | file, line, snippet |
| FE-05 | P3 | `grep:<div(?:[^>]*\s)?(?:onClick\|role="button")` | file, line, snippet |
| FE-06 | P4 | `path:**/*.{jsx,tsx,vue,svelte,html}` | file, lcp-metric |
| FE-07 | P4 | `path:**/*.{jsx,tsx,vue,svelte,css}` | file, cls-metric |
| FE-08 | P3 | `path:**/*.{js,ts,jsx,tsx}` | file, bundle-size |
| FE-09 | P3 | `grep:<img\s` | file, line, snippet |
| FE-10 | P4 | `path:.github/workflows/**` | file |
| FE-11 | P4 | `path:**/*.{jsx,tsx,vue,svelte}` | file |
| FE-12 | P3 | `path:**/*.{jsx,tsx,vue,svelte}` | file, depth |
| FE-13 | P3 | `path:**/*.{jsx,tsx,vue,svelte}` | file, line-count |
| FE-14 | P3 | `path:**/*.{jsx,tsx,vue,svelte}` | file |
| FE-15 | P3 | `grep:(color:\s*#[0-9a-f]{3,6}\|padding:\s*[0-9]+px\|margin:\s*[0-9]+px)` | file, line, value |
| FE-16 | P4 | `path:**/{components,ui}/**` | file |
| FE-17 | P4 | `path:**/*.stories.{js,ts,jsx,tsx}` | file |
| FE-18 | P3 | `grep+path:(fetch\|axios\|useQuery)|**/components/**` | file, line, snippet |
| FE-19 | P3 | `grep:(useQuery\|useSWR\|useMutation\|fetch\()` | file, line |
| FE-20 | P3 | `grep:(redux\|zustand\|pinia\|useStore)` | file, line |
| FE-21 | P3 | `grep+path:(<form\|<input)|**/*.{jsx,tsx,vue,svelte}` | file, line |
| FE-22 | P4 | `grep:(useSearchParams\|router\.query\|URLSearchParams)` | file, line |
| FE-23 | P4 | `grep:(normalizr\|entities)` | file, line |
| FE-24 | P4 | `grep:(optimistic\|onMutate)` | file, line |
| FE-25 | P3 | `grep:(useEffect\|useCallback)` | file, line, deps |
| FE-26 | P3 | `grep:(invalidateQueries\|mutate\()` | file, line |
| OPS-01 | P3 | `path:.github/workflows/**,.gitlab-ci.yml,Jenkinsfile,.circleci/**` | file |
| OPS-02 | P3 | `path:.github/workflows/**,.gitlab-ci.yml` | file |
| OPS-03 | P2 | `path:.github/workflows/**,.gitlab-ci.yml` | file, stage-name |
| OPS-04 | P2 | `path:.github/workflows/**,.gitlab-ci.yml` | file, stage-name |
| OPS-05 | P3 | `path:.github/workflows/**,Dockerfile,Containerfile` | file |
| OPS-06 | P3 | `path:.github/workflows/**` | file, deploy-stage |
| OPS-07 | P4 | `path:.github/workflows/**` | file |
| OPS-08 | P4 | `path:.github/workflows/**,**/canary*,**/blue-green*` | file |
| OPS-09 | P3 | `grep:(console\.log\|logger\.\|log\.\|fmt\.Print)` | file, line |
| OPS-10 | P3 | `grep:(console\.log\(["'\x60]\|logger\.info\(["'\x60])` | file, line, snippet |
| OPS-11 | P3 | `grep:(metric\|counter\|gauge\|histogram\|prometheus)` | file, line |
| OPS-12 | P3 | `path:**/alerts/**,**/alerting/**,**/*.alert.yml` | file |
| OPS-13 | P4 | `path:**/dashboards/**,**/grafana/**` | file |
| OPS-14 | P4 | `path:**/logging/**,**/log-config*` | file |
| OPS-15 | P3 | `grep:(traceId\|trace_id\|correlationId\|requestId)` | file, line |
| OPS-16 | P4 | `grep:(opentelemetry\|jaeger\|zipkin)` | file, line |
| OPS-17 | P2 | `grep:(/health\|/healthz\|/ping\|/status)` | file, line |
| OPS-18 | P2 | `grep+path:(/health\|/healthz)|**/{routes,middleware}/**` | file, line, snippet |
| OPS-19 | P4 | `path:docs/runbook/**,docs/ops/**` | file |
| OPS-20 | P3 | `path:**/{deploy,terraform,helm}/**` | file |
| OPS-21 | P4 | `path:docs/runbook/**` | file |
| OPS-22 | P4 | `path:docs/incident/**,docs/oncall/**` | file |
| OPS-23 | P4 | `path:docs/postmortem/**,docs/incident/**` | file |
| OPS-24 | P1 | `path:**/migrations/**,**/db/migrate/**,**/alembic/**` | file, line, rollback-evidence |
| PERF-01 | P4 | `path:**/{loadtest,k6,locust,gatling}/**` | file |
| PERF-02 | P4 | `path:**/{loadtest,k6,locust}/**` | file |
| PERF-03 | P4 | `path:docs/perf/**,docs/sla/**` | file |
| PERF-04 | P4 | `path:**/profiling/**,**/*.flame*` | file |
| PERF-05 | P4 | `path:**/profiling/**` | file |
| PERF-06 | P4 | `path:**/{benchmark,bench}/**` | file |
| PERF-07 | P4 | `path:.github/workflows/**` | file |
| PERF-08 | P4 | `path:docs/perf/**` | file |
| PERF-09 | P4 | `path:docs/sla/**,docs/slo/**` | file |
| PERF-10 | P4 | `path:docs/sla/**,docs/slo/**` | file |
| PERF-11 | P4 | `path:docs/slo/**` | file |
| PERF-12 | P3 | `path:**/alerts/**` | file |
| PERF-13 | P4 | `path:docs/incident/**` | file |
| PERF-14 | P4 | `path:docs/incident/**` | file |
| PERF-15 | P4 | `path:docs/incident/**` | file |
| PERF-16 | P4 | `path:docs/slo/**` | file |
| PERF-17 | P4 | `path:**/profiling/**,**/loadtest/**` | file |
| PERF-18 | P2 | `grep:(createPool\|Pool\(\|connectionPool)` | file, line, config |
| PERF-19 | P3 | `grep:(cache\|redis\|memcached)` | file, line |
| PERF-20 | P4 | `path:**/cdn*,**/cloudfront*` | file |
| PERF-21 | P3 | `grep:(import\(\|lazy\(\|React\.lazy\|loadable)` | file, line |
| PERF-22 | P2 | `grep:for\s*\([^)]*\)\s*\{[^}]*(findOne\|findById\|SELECT)` | file, line, snippet |
| PERF-23 | P2 | `path:**/migrations/**,**/schema*` | file, line, index-decl |
| PERF-24 | P3 | `path:.github/workflows/**,**/bundlesize*` | file |
| DATA-01 | P2 | `path:**/migrations/**,**/schema*` | file, line, ddl |
| DATA-02 | P1 | `path:**/migrations/**,**/schema*` | file, line, index-decl |
| DATA-03 | P3 | `path:**/migrations/**,**/schema*` | file, line, index-decl |
| DATA-04 | P2 | `grep+path:(NULL\|NOT NULL\|nullable)|**/migrations/**` | file, line, ddl |
| DATA-05 | P1 | `grep+path:(FOREIGN KEY\|REFERENCES\|@ManyToOne\|relation\()|**/migrations/**` | file, line, ddl |
| DATA-06 | P3 | `path:**/migrations/**,**/schema*` | file, line, name |
| DATA-07 | P3 | `grep:(deleted_at\|deletedAt\|is_deleted)` | file, line |
| DATA-08 | P4 | `path:**/migrations/**,docs/data/**` | file |
| DATA-09 | P1 | `path:**/migrations/**,**/db/migrate/**,**/alembic/**` | file |
| DATA-10 | P1 | `path:**/migrations/**` | file, line, down-evidence |
| DATA-11 | P2 | `path:**/migrations/**` | file, version |
| DATA-12 | P1 | `path:**/migrations/**` | file, line, ddl |
| DATA-13 | P2 | `path:**/migrations/**` | file, line |
| DATA-14 | P1 | `grep+path:(UPDATE\|DELETE)\s+FROM|**/migrations/**` | file, line, snippet |
| DATA-15 | P3 | `path:**/migrations/**,**/schema_migrations*` | file |
| DATA-16 | P3 | `path:.github/workflows/**` | file, line |
| DATA-17 | P2 | `grep:(email\|phone\|ssn\|pii\|personalData)` | file, line |
| DATA-18 | P1 | `grep:(email\|ssn\|password\|credit_card\|cvv)` | file, line, encryption-evidence |
| DATA-19 | P1 | `grep:(http://\|insecure)` | file, line |
| DATA-20 | P2 | `path:**/{seed,fixtures,test-data}/**` | file |
| DATA-21 | P3 | `path:docs/privacy/**,docs/data-retention/**` | file |
| DATA-22 | P3 | `grep:(consent\|gdpr\|opt[_-]?in)` | file, line |
| DATA-23 | P2 | `grep:(deleteUser\|erasure\|right.*forgotten)` | file, line |
| DATA-24 | P3 | `grep:(audit_log\|auditLog\|access_log)` | file, line |
| DEBT-01 | P4 | `grep:(TODO\|FIXME\|XXX\|HACK)` | file, line, snippet |
| DEBT-02 | P4 | `grep:(TODO\|FIXME)` | file, line |
| DEBT-03 | P4 | `path:docs/debt/**` | file |
| DEBT-04 | P4 | `path:docs/debt/**` | file |
| DEBT-05 | P4 | `grep:(TODO\|FIXME)` | file, line |
| DEBT-06 | P4 | `path:docs/debt/**` | file |
| DEBT-07 | P4 | `path:docs/debt/**` | file |
| DEBT-08 | P4 | `path:docs/debt/**` | file |
| DEBT-09 | P4 | `path:docs/debt/**,**/debt-register*` | file |
| DEBT-10 | P4 | `path:docs/debt/**` | file |
| DEBT-11 | P4 | `path:docs/debt/**` | file |
| DEBT-12 | P4 | `path:docs/debt/**` | file |
| DEBT-13 | P4 | `path:docs/debt/**` | file |
| DEBT-14 | P4 | `path:docs/debt/**` | file |
| DEBT-15 | P4 | `path:docs/debt/**` | file |
| DEBT-16 | P4 | `path:docs/debt/**` | file |
| DEBT-17 | P4 | `path:docs/debt/**` | file |
| DEBT-18 | P4 | `path:docs/debt/**` | file |
| DEBT-19 | P4 | `path:docs/debt/**` | file |
| DEBT-20 | P4 | `path:docs/debt/**` | file |
| DEBT-21 | P4 | `path:docs/debt/**` | file |
| DEBT-22 | P4 | `path:docs/debt/**` | file |
| DEBT-23 | P4 | `path:docs/debt/**` | file |
| DEBT-24 | P4 | `path:docs/debt/**` | file |

---

## Notes

- **P1 rationale:** every P1 row touches an invariant where a regression is non-recoverable in production: secrets in source, SQL/XSS injection vectors, broken auth/RBAC, missing FKs/indexes on data, non-zero-downtime migration patterns, plaintext PII, HTTP transport.
- **F3 enforcement:** `quality-check-scoped` rejects any finding whose `standard_id` is not in this table.
- **Determinism:** Match Rules are pure regex/glob — no probabilistic matching, no LLM judgment. Two runs on the same diff produce identical findings.
- **Adding a new standard:** add the KB rule first, then add a row here with severity + match rule. Never add a row without a corresponding KB rule.
