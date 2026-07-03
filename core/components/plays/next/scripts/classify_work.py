#!/usr/bin/env python3
"""
classify_work.py — operator work-profile from captured git history (C7, F4).

Lexical classification ONLY — no model inference anywhere (the user's hard
rule). Two signals, both mechanical:

  1. PATH signal (primary): every file path in the captured `git log
     --name-only` output is matched against the glob patterns and extension
     maps in the work-intelligence map (work-map.yaml) -> work-type and
     stack counts.
  2. SUBJECT signal (secondary): a BM25-style term scoring of commit subject
     lines against each work-type's keyword vocabulary from the same map.
     Plain tf-idf arithmetic over tokens — deterministic.

Thin-history rule: when the sample is below the map's thresholds
(min_commits / min_files), the profile is stamped thin_history=true, no
dominant work-type is asserted, and the ranking layer MUST skip fit
weighting (check_output.py enforces it).

Layer rule: reads the CAPTURED log file — never shells out to git. The play
captures `git config user.name` and `git log --author=<name> --name-only`
to disk at pre-flight and hands the paths in.

    python3 classify_work.py --git-log <captured.log> --map <work-map.yaml> \
                             --author "<name>" --out <operator-profile.json>

Exit 0 on success, 2 on usage error.
"""

import argparse
import fnmatch
import json
import math
import os
import re
import sys
from collections import defaultdict

try:
    import yaml
except ImportError:
    sys.stderr.write("classify_work.py: PyYAML is required (pip install pyyaml).\n")
    sys.exit(2)

COMMIT_RE = re.compile(r"^commit [0-9a-f]{7,40}", re.IGNORECASE)
SUBJECT_SKIP = re.compile(r"^(Author:|Date:|Merge:|Co-Authored-By:)", re.IGNORECASE)
TOKEN_RE = re.compile(r"[a-z][a-z0-9_-]{2,}")


def parse_log(path):
    """Captured `git log --name-only` -> (subjects[], file_paths[])."""
    subjects, files = [], []
    current_subject_taken = False
    with open(path, encoding="utf-8") as fh:
        for raw in fh:
            line = raw.rstrip("\n")
            if COMMIT_RE.match(line):
                current_subject_taken = False
                continue
            if not line.strip() or SUBJECT_SKIP.match(line.strip()):
                continue
            if line.startswith(" ") or line.startswith("\t"):
                if not current_subject_taken:
                    subjects.append(line.strip())
                    current_subject_taken = True
                continue
            # non-indented, non-header, non-empty -> a changed file path
            files.append(line.strip())
    return subjects, files


def path_counts(files, work_types, stacks):
    wt_counts = defaultdict(int)
    stack_counts = defaultdict(int)
    for f in files:
        low = f.lower()
        for wt, spec in work_types.items():
            for pat in (spec.get("paths") or []):
                if fnmatch.fnmatch(low, pat.lower()):
                    wt_counts[wt] += 1
                    break
        ext = os.path.splitext(low)[1]
        for st, spec in stacks.items():
            if ext and ext in [e.lower() for e in (spec.get("extensions") or [])]:
                stack_counts[st] += 1
            for marker in (spec.get("markers") or []):
                if os.path.basename(low) == marker.lower():
                    stack_counts[st] += 1
    return dict(wt_counts), dict(stack_counts)


def bm25_subject_scores(subjects, work_types, k1=1.5, b=0.75):
    """BM25 of each work-type's keyword vocabulary against the subject corpus
    (each subject line = one document); returns summed score per work-type."""
    docs = [TOKEN_RE.findall(s.lower()) for s in subjects]
    docs = [d for d in docs if d]
    if not docs:
        return {}
    n = len(docs)
    avgdl = sum(len(d) for d in docs) / n
    df = defaultdict(int)
    for d in docs:
        for t in set(d):
            df[t] += 1
    scores = {}
    for wt, spec in work_types.items():
        vocab = [k.lower() for k in (spec.get("keywords") or [])]
        total = 0.0
        for d in docs:
            dl = len(d)
            for term in vocab:
                tf = d.count(term)
                if not tf:
                    continue
                idf = math.log(1 + (n - df[term] + 0.5) / (df[term] + 0.5))
                total += idf * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * dl / avgdl))
        scores[wt] = round(total, 4)
    return scores


def normalize(counts):
    total = sum(counts.values())
    if not total:
        return {}
    return {k: round(v / total, 4) for k, v in sorted(counts.items())}


def main(argv=None):
    ap = argparse.ArgumentParser(description="Operator work-profile (lexical, no inference).")
    ap.add_argument("--git-log", required=True, help="captured git log --name-only output")
    ap.add_argument("--map", required=True, help="work-map.yaml from the work-intelligence shelf")
    ap.add_argument("--author", required=True, help="captured git config user.name")
    ap.add_argument("--out", required=True)
    args = ap.parse_args(argv)

    with open(args.map, encoding="utf-8") as fh:
        wmap = yaml.safe_load(fh) or {}
    work_types = wmap.get("work_types") or {}
    stacks = wmap.get("stacks") or {}
    thin = wmap.get("thin_history") or {}
    min_commits = int(thin.get("min_commits", 20))
    min_files = int(thin.get("min_files", 30))

    subjects, files = ([], []) if not os.path.isfile(args.git_log) \
        else parse_log(args.git_log)

    wt_counts, stack_counts = path_counts(files, work_types, stacks)
    subject_scores = bm25_subject_scores(subjects, work_types)

    thin_history = len(subjects) < min_commits or len(files) < min_files

    # blended work-type weight: path share (primary) + bm25 share (secondary, 0.25)
    path_share = normalize(wt_counts)
    bm25_share = normalize({k: v for k, v in subject_scores.items() if v > 0})
    blended = {wt: round(path_share.get(wt, 0.0) + 0.25 * bm25_share.get(wt, 0.0), 4)
               for wt in sorted(set(path_share) | set(bm25_share))}

    dominant = []
    if not thin_history and blended:
        top = max(blended.values())
        dominant = sorted(wt for wt, v in blended.items() if v >= 0.8 * top and v > 0)

    profile = {
        "author": args.author,
        "sample": {"commits": len(subjects), "files": len(files)},
        "thresholds": {"min_commits": min_commits, "min_files": min_files},
        "thin_history": thin_history,
        "work_types": blended,
        "work_type_path_share": path_share,
        "work_type_subject_bm25": subject_scores,
        "stacks": normalize(stack_counts),
        "dominant_work_types": dominant,
        "method": "lexical (glob path match + BM25 subject scoring) — no inference",
    }
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(profile, fh, indent=2, sort_keys=True)
    print(json.dumps({"ok": True, "author": args.author,
                      "thin_history": thin_history,
                      "commits": len(subjects), "files": len(files),
                      "dominant_work_types": dominant, "out": args.out},
                     indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
