#!/usr/bin/env python3
"""
Unit tests for the KB interface (kb.py). Plain asserts, no pytest dependency.
Run: python3 test_kb.py   (exits non-zero on any failure)
"""

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import kb  # noqa: E402

PASS, FAIL = 0, 0


def check(name, cond):
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f"  ok   {name}")
    else:
        FAIL += 1
        print(f"  FAIL {name}")


def main():
    # rebuild builds an index over the 10 shelves
    r = kb.rebuild()
    check("rebuild ok", r.get("ok") is True)
    check("rebuild indexed 10 shelves", r.get("files") == 10)

    # domains() — the primary routing entry: all shelves + triggers
    d = kb.domains()
    check("domains lists 10 shelves", d.get("count") == 10)
    check("each domain has a non-empty trigger",
          all(e.get("trigger") for e in d["domains"]))
    check("domains include user-management & payments",
          {"user-management", "payments"} <= {e["domain"] for e in d["domains"]})

    # search shape
    s = kb.search("reset password sms recovery")
    check("search returns query/candidates/unmatched",
          {"query", "candidates", "unmatched"} <= set(s))
    check("search not unmatched for a real query", s["unmatched"] is False)
    check("search candidate has the required keys",
          s["candidates"] and {"node_id", "domain", "path", "preview", "hits"}
          <= set(s["candidates"][0]))
    domains = {c["domain"] for c in s["candidates"]}
    check("password/sms query surfaces user-management",
          "user-management" in domains)

    # a clearly out-of-vocab query is unmatched
    g = kb.search("zzzqqq xyzzy nonsenseword")
    check("gibberish query -> unmatched", g["unmatched"] is True)

    # read returns the section text for a real node_id
    nid = s["candidates"][0]["node_id"]
    rd = kb.read(nid)
    check("read returns text", bool(rd.get("text")))
    check("read has domain+title", bool(rd.get("domain")) and bool(rd.get("title")))

    # read on a bad id returns an error, not a crash
    bad = kb.read("99999")
    check("read bad id -> error", "error" in bad)

    print(f"\n{PASS} passed, {FAIL} failed")
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())
