# KB interface — eval & test spec (for codex to run)

You are verifying the Garura KB router interface. Working directory is this folder
(`.pageindex`). The interface is `kb.py`; the underlying reused tool is `pageindex.py`.
**Do NOT modify any source file.** Run things read-only and report.

## Part 1 — Deterministic tests (run, report pass/fail)

Run each and report the exit code and the summary line(s):

- `python3 test_kb.py`        — unit tests for the interface verbs (search/read/rebuild/domains)
- `python3 eval_routing.py`   — keyword-retrieval hint eval (coarse BY DESIGN; ~80% top-3 expected)

## Part 2 — Reasoning-routing eval (you are the reasoner)

The real router reasons over the domain list, not keyword search. Do this:

1. Run `python3 kb.py domains` to get all 10 domains and their triggers.
2. For EACH work item below, pick the single best domain by reasoning over the
   triggers. You may `python3 kb.py read <root_node_id>` or `python3 kb.py search "..."`
   to confirm, but the decision is your reasoning.
3. Score a hit when your pick is in the accepted set.

Work items → accepted domain(s):

1. add SMS password reset for locked-out users → user-management
2. take a card payment at checkout → payments
3. spin up a landing page for the spring sale campaign → marketing
4. notify the user when their order has shipped → notifications
5. real-time co-editing of a shared document → collaboration
6. measure the signup-to-activation conversion funnel → analytics
7. model content types for a bank website → content-management
8. tailor the homepage for each individual visitor → personalization
9. semantic search across the product catalog → experience OR ecommerce
10. show shoppers tailored product recommendations → personalization OR experience OR ecommerce

## Report

Produce:
- Part 1: pass/fail + exit codes for the two scripts.
- Part 2: a table of (work item → your pick → hit/miss) and the overall accuracy (X/10).
- One line: does the reasoning path (Part 2) beat the keyword path (Part 1's eval_routing top-1)?
