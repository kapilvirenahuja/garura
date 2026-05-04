# enhance Play — Pre-Rebake Analysis

Context for intent-crafter when updating intent.yaml to support issue discovery.

---

## 1. What C1 currently says

C1 reads: "Must have an existing open issue. If no issue is resolvable from the branch name or arguments, hard halt immediately."

The constraint treats the issue number as something you either already have (from the branch name `enhance/{issue}-{slug}`) or supply explicitly via `--issue`. There is no notion of "I don't know the issue number yet — help me find it." The pre-flight code extracts the number from the branch, falls back to user input, and hard-halts if neither produces a number. Discovery of which issue to work on is entirely outside the play's scope today.

---

## 2. What manage-issue supports

The skill exposes five actions: `read`, `create`, `close`, `comment`, and `resolve_or_create`.

The `resolve_or_create` action is the closest thing to search: when no `issue_number` is given but a `description` string is, it runs `gh issue list --search "{description}"` and returns matching open issues (up to 5). If a match is found it returns it; if not, it creates a new one.

There is no dedicated `list` or `search` action. Listing/searching is only reachable via `resolve_or_create` with a description query. This is sufficient for issue discovery — the play can invoke project-orchestrator with `action: resolve_or_create` and a user-supplied search term, then surface the matches for the user to pick from.

---

## 3. Existing scenarios and the gap

S1–S8 cover: happy path, scope-too-large, scope-too-small, low judge confidence, --approve-plan mid-checkpoint, PR review checkpoint, eval failures in fix loop, and architectural approval-required risk.

None of the eight scenarios address starting from "I want to run enhance but I don't have an issue number." Every scenario implicitly assumes the developer already knows which issue they're targeting. The gap is a pre-flight discovery path: when `--issue` is absent and the branch name yields no issue number, instead of hard-halting the play should offer to list open issues (optionally filtered by a search term), let the user pick one, and then proceed normally from C1 onwards. This would become S9.

---

## 4. Current --issue argument flow in pre-flight

The compiled SKILL.md declares the signature as `/enhance --issue <issue-number> [--approve-plan]` with `--issue` marked required. Pre-flight runs this logic in order:

1. Resolve `stm_base` and `product_base` from config (hard halt if config is missing).
2. Extract the issue number from the current branch name via regex (`enhance/[0-9]+`).
3. If branch yields nothing, expect it from user input (`--issue` argument).
4. If neither source produces a number, hard halt with: "No issue provided. Provide an issue number or run from an enhance/ branch."
5. Once a number is in hand, delegate to project-orchestrator (`action: read`) to confirm the issue exists and is open.

The issue discovery feature would insert itself between steps 3 and 4: when no number is available from either the branch or `--issue`, instead of halting the play invokes project-orchestrator with `resolve_or_create` (search mode), presents matching issues, waits for a selection, then continues to step 5 with the chosen number. C1 would need a secondary rule added: "If no issue number is resolvable, offer issue search before halting."
