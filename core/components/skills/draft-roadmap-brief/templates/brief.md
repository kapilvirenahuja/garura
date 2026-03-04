---
product: "{product name}"
slug: "{slug}"
created: "{date}"
vision_ref: "{vision_path}"
---

# Roadmap Brief: {Product Name}

**Status:** DRAFT
**Created:** {YYYY-MM-DD}
**Epic Count:** {integer}

---

## The Bet

{1 paragraph — the core strategic thesis. What is this roadmap betting on? What must be true for this to succeed?}

---

## The Story

{3–4 short paragraphs — narrative causality. Why this order? Written as "first X because Y, then Z because X enables Z." No bullet points. Each paragraph builds on the last.}

---

## Decisions

| Epic | Horizon | Priority | Effort | Depends on | Why |
|------|---------|----------|--------|------------|-----|
| {name} | {Near/Mid/Long} | {P1/P2/P3} | {S/M/L/XL} | {epic name or "none"} | {one-line reason} |

<!-- Max 8 rows. Technical note per row ONLY if it changes the decision — e.g., "hard dependency: requires E1 data model" -->

---

## What We're Not Doing

- {Item} — {one-line reason why it's deferred or excluded}

<!-- 4–6 items max -->

---

## The Asks

- {Specific question requiring reviewer judgment — not "does this look good?" but a real decision question}

<!-- Minimum 3, maximum 4 questions. Each question must be answerable with a concrete decision. -->

---

## Key Assumptions

- {Assumption this roadmap depends on being true. If this breaks, the roadmap changes materially.}

<!-- 3–5 items -->

---

*Storage path: `.meridian/project/product/{slug}/brief-{timestamp}.md`*
