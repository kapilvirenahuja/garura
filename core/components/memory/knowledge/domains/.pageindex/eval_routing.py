#!/usr/bin/env python3
"""
Routing evals for the KB interface — does search() surface the right domain for a
piece of work? This measures the RETRIEVAL layer (keyword entry hint) only; full
placement to capability/functionality is the calling skill's reasoning job (T26),
evaluated separately. Keyword retrieval is expected to be strong on top-3, looser
on top-1.

Run: python3 eval_routing.py
"""

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import kb  # noqa: E402

# (piece of work, acceptable domain(s))
CASES = [
    ("add SMS password reset for locked-out users", {"user-management"}),
    ("take a card payment at checkout", {"payments"}),
    ("spin up a landing page for the spring sale campaign", {"marketing"}),
    ("notify the user when their order has shipped", {"notifications"}),
    ("real-time co-editing of a shared document", {"collaboration"}),
    ("measure the signup-to-activation conversion funnel", {"analytics"}),
    ("model content types for a bank website", {"content-management"}),
    ("tailor the homepage for each individual visitor", {"personalization"}),
    ("semantic search across the product catalog",
     {"experience", "ecommerce"}),
    ("show shoppers tailored product recommendations",
     {"personalization", "experience", "ecommerce"}),
]


def top_domains(work, n):
    res = kb.search(work)
    seen, ordered = set(), []
    for c in res["candidates"]:
        if c["domain"] not in seen:
            seen.add(c["domain"])
            ordered.append(c["domain"])
        if len(ordered) >= n:
            break
    return ordered


def main():
    kb.rebuild()
    top1_ok = top3_ok = 0
    print("Routing evals (retrieval layer):\n")
    for work, expected in CASES:
        t3 = top_domains(work, 3)
        t1 = t3[0] if t3 else None
        h1 = t1 in expected
        h3 = bool(set(t3) & expected)
        top1_ok += h1
        top3_ok += h3
        mark = "ok  " if h3 else "MISS"
        print(f"  {mark} top1={t1!r:22} top3={t3}")
        print(f"       work: {work}")
        print(f"       expected one of: {sorted(expected)}\n")
    n = len(CASES)
    print(f"top-1 hit: {top1_ok}/{n} ({top1_ok/n:.0%})   "
          f"top-3 hit: {top3_ok}/{n} ({top3_ok/n:.0%})")
    # Gate softly on top-3 retrieval (keyword layer); reasoning closes top-1.
    return 0 if top3_ok / n >= 0.7 else 1


if __name__ == "__main__":
    sys.exit(main())
