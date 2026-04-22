# Test Context — Issue #311 (reap)

**Contract:** You are the tester. Read this file only. Execute each eval's pass/fail criteria against the code on disk. Record PASS/FAIL per eval with evidence (file paths, command output, observed behavior). Do NOT infer from implementation intent — verify against observed state.

---

## Behavioral Description of the Work

The work under test produces a new play in the Garura component tree that performs post-epic learning extraction from the build trinity (prepare → implement → validate). The play reads STM artifacts, diffs the plan against observed outcomes, and emits tiered proposals into STM. It never writes to LTM. An older play performing a similar extract-and-promote cycle is being fully retired — its orchestration wrapper is removed while its underlying skills and supporting agent are retained for reuse by this new play (and a future LTM-write play).

The new play's build flow is a two-step process: hand-authored intent.yaml (source of truth for constraints, failure conditions, and scenarios) + `/create-play --build <play-name>` (which compiles the runtime SKILL.md). Hand-editing the compiled SKILL.md is forbidden by framework rule. An intent hash is embedded in the compiled SKILL.md to detect drift between intent.yaml and the compiled artifact.

Beyond the new play, three existing components are modified: two skills that power diff and proposal-draft steps, and one agent whose mode table and output-path contracts must reflect the new play wiring. Each modification is independent and targeted — no cross-file refactoring.

The semantic payload of the change is a schema extension: findings and proposals now carry a two-level learning taxonomy (a top-level category plus a sub-category) aligned to the canonical KB structure at `core/components/memory/`. Canonical values come from a fixed enum; invention of a new category or sub-category is permitted but structurally gated — a justification block containing an evidence path, a verbatim excerpt, and a free-text reasoning field is required whenever a proposed-new value is emitted. Proposals and findings that propose-new without justification must be rejected by the skills. The summary block of the output artifact surfaces invented values so reviewers see them at a glance.

---

## Evals (structural — apply against the implementation)

Execute these against the repository after implementation. Record per-eval PASS/FAIL with evidence (file path + command output + observed quote). Do not infer from code intent; verify against observed file contents and command output.

### E-1 — intent.yaml exists with required structure

**Pass criteria:**
- A file exists at `core/components/plays/reap/reference/intent.yaml`.
- It contains at minimum: 1 constraint with both `id` and `rule`, 1 failure_condition with both `id` and `condition`, 1 scenario with `id`, `persona`, `given`, and `then`.
- It contains a constraint that explicitly prohibits invocation of `apply-ltm-enrichment` by the play.
- It contains a constraint that accepts issue state OPEN or CLOSED (and does NOT require CLOSED as a precondition).
- It contains constraints covering the two-level taxonomy contract (what is later checked as C7, C7a, C7b equivalents): (a) every proposal must carry `learning_category` and `sub_category`, (b) proposed-new values require a taxonomy_justification block with `evidence_path`, `excerpt`, and `reasoning`, (c) canonical taxonomy is a starting point, not a closed enum.

**Fail criteria:** File does not exist, or is missing any of: constraints, failure_conditions, scenarios. Or the file requires issue-closed state as a precondition. Or the file invokes `apply-ltm-enrichment` as a called component (vs referencing it in a prohibition). Or any of the three taxonomy-contract constraints is absent.

### E-2 — compiled SKILL.md exists with matching hash

**Pass criteria:**
- A file exists at `core/components/plays/reap/SKILL.md`.
- It contains a "Compiled From" section with a declared `intent_hash`.
- `sha256(core/components/plays/reap/reference/intent.yaml)` equals the embedded `intent_hash`.
- It contains these sections: Pre-flight, Task DAG, Workflow, Scenario Validation, Evidence & Close, Compilation Metadata.

**Fail criteria:** File does not exist, or lacks a "Compiled From" section, or the hash in the file does not match a fresh sha256 of `reference/intent.yaml`, or any of the listed sections is missing.

### E-3 — reap does NOT invoke apply-ltm-enrichment

**Pass criteria:** `grep -r "apply-ltm-enrichment" core/components/plays/reap/` returns empty output.

**Fail criteria:** Any match in the reap play directory. Treat matches inside prose constraints that prohibit the skill as a FAIL for this eval regardless — the recursive grep should return zero lines. (If the implementer needs to name the prohibition, they can use a distinguishable token such as `apply_ltm_enrichment` with underscore rather than hyphen; otherwise they must word the prohibition without the literal skill name.)

### E-4 — proposals-drafting skill carries full taxonomy + invention fields

**Pass criteria:**
- `core/components/skills/draft-enrichment-proposals/SKILL.md` output schema for each proposal item contains ALL of:
  - `learning_category`
  - `sub_category`
  - `learning_category_proposed`
  - `sub_category_proposed`
  - `taxonomy_justification` (with sub-fields `evidence_path`, `excerpt`, `reasoning`)
- The file documents a canonical learning_category enum that lists all 5 of: `arch`, `domain`, `product`, `quality`, `standards`.
- The file documents canonical sub_category children per parent: `arch` → 6 children (`agentic`, `data`, `operations`, `patterns`, `platforms`, `stacks`); `quality` → 11 children (`architecture`, `backend`, `code`, `data`, `documentation`, `frontend`, `operations`, `performance`, `security`, `tech-debt`, `testing`); `standards` → 3 children (`rules`, `schemas`, `templates`); `domain` and `product` are flat (sub_category null or empty).
- No `dimension:` field remains as an output schema field.

**Fail criteria:** Any of the five proposal fields missing from the schema. Or the canonical enum lists fewer than 5 top-level values. Or the sub_category canonical enumeration is incomplete for any parent. Or `dimension:` still present as an output schema field.

### E-5 — diff-baseline skill carries full taxonomy + invention fields

**Pass criteria:**
- `core/components/skills/diff-context-baseline/SKILL.md` `findings[]` output schema contains: `learning_category`, `sub_category`, `learning_category_proposed`, `sub_category_proposed`, `taxonomy_justification`.
- The canonical learning_category enum in the skill documentation lists all 5 top-level values.
- The skill documents a mapping note from the old 6-value `dimension` enum to the new taxonomy (content-routed where applicable).
- No `dimension:` field remains in the output block.

**Fail criteria:** Any finding field missing from schema. Or canonical enum incomplete. Or mapping note absent. Or `dimension:` still present in output block.

### E-6 — knowledge-extractor agent reflects three-mode play split

**Pass criteria:**
- `core/components/agents/knowledge-extractor.md` frontmatter description mentions all three plays by name: `distill` (FAST mode), `reap` (ANALYZE mode), `enrich` (ENRICH mode).
- The Operating Modes table lists `reap` as the ANALYZE trigger (not `capture-learning`).
- The Input/Output contract shows `intent_path` pointing to the reap play (not capture-learning).
- The ANALYZE mode output path is `{stm_base}/{issue}/evidence/reap/proposals.yaml` (not `evidence/capture-learning/reconciliation-proposals.yaml`).

**Fail criteria:** Agent description still references `capture-learning` as the ANALYZE trigger. Or the output path still references `evidence/capture-learning/reconciliation-proposals.yaml`. Or any of the three play names absent from the description.

### E-7 — capture-learning play directory is deleted; supporting components retained

**Pass criteria:**
- `core/components/plays/capture-learning/` does NOT exist as a directory (no such path).
- `core/components/skills/diff-context-baseline/` still exists.
- `core/components/skills/draft-enrichment-proposals/` still exists.
- `core/components/skills/apply-ltm-enrichment/` still exists.
- `core/components/agents/knowledge-extractor.md` still exists.

**Fail criteria:** `capture-learning/` still exists. Or any of the four retained components (three skills, one agent) was deleted.

### E-8 — absent product LTM tier does not hard-fail the play

**Pass criteria:** reap's intent.yaml contains a constraint (equivalent to C9 in the spec) that explicitly states: if product LTM tier artifacts are absent (e.g., `architecture/` directory does not exist), that tier is skipped with a warning in the output — it is NOT a hard failure.

**Fail criteria:** No constraint covering absent-tier handling, or the constraint treats absent architecture as a hard failure.

### E-9 — evidence self-commit is wired in compiled SKILL.md

**Pass criteria:** `core/components/plays/reap/SKILL.md` contains an "Evidence & Close" (or equivalently named) section that references `repo-orchestrator` and describes a non-blocking self-commit. The commit message pattern includes the substring `chore(stm): record reap evidence for` (exact match on that prefix).

**Fail criteria:** No Evidence & Close section. Or the section does not invoke `repo-orchestrator`. Or the commit is declared blocking. Or the commit-message prefix does not include that substring.

### E-10 — /create-play --build reap produces compiled SKILL.md cleanly

**Pass criteria:** Running `/create-play --build reap` against the authored intent.yaml completes without error and produces a non-empty `SKILL.md` with all required sections (frontmatter, pre-flight, task DAG, workflow, scenario validation, evidence & close, compilation metadata). This eval may be satisfied by evidence of a successful prior build (i.e., a well-formed SKILL.md on disk with matching hash) OR by re-running the command freshly.

**Fail criteria:** The command errors out, or produces an incomplete SKILL.md missing any required section.

### E-11 — invention-with-justification rule is documented in both skills AND encoded in intent.yaml

**Pass criteria:**
- Both `core/components/skills/diff-context-baseline/SKILL.md` and `core/components/skills/draft-enrichment-proposals/SKILL.md` contain explicit documentation stating that when a `_proposed` flag (either `learning_category_proposed` or `sub_category_proposed`) is true, the `taxonomy_justification` block (evidence_path, excerpt, reasoning) is REQUIRED, and findings/proposals lacking this block must be rejected.
- Both skills document the canonical taxonomy tree (5 top-level + children) as the starting point, with an explicit note that canonical is the baseline, not a closed enum.
- reap's intent.yaml contains two dedicated constraints (equivalent to C7a and C7b in the spec): one encoding the invention-requires-justification rule, one encoding the "canonical is starting point, not closed" rule.

**Fail criteria:** Either skill silent on the invention rule. Or the rule stated but without the three explicit sub-fields (evidence_path, excerpt, reasoning). Or the canonical taxonomy tree not documented. Or intent.yaml missing either of the two constraints (invention-justification, starting-point).

---

## Verification procedure

For each eval E-1 through E-11:
1. Execute the check(s) described in the Pass criteria against the current repository state.
2. Record the eval ID, verdict (PASS or FAIL), and evidence (file path + line number for presence checks; literal grep output for absence checks; sha256 command output + file-embedded hash for E-2; command exit code + SKILL.md section headers for E-10).
3. On FAIL, include the observed failure mode verbatim — quote the file, show the offending line, or show the missing-path stderr.
4. Do NOT attempt to fix failures. Report only.

Write the final verdict to `verification-report.yaml` with structure:

```yaml
overall: PASS | FAIL
iteration: 1
evals:
  - id: E-1
    verdict: PASS | FAIL
    evidence:
      - path: "<file path>"
        observation: "<literal excerpt or command output>"
    failure_detail: "<null or verbatim description of what's wrong>"
  # ... one entry per eval E-1 through E-11
```

Do not short-circuit on first failure — run all eleven evals even if earlier ones fail, so the single report captures the complete state.
