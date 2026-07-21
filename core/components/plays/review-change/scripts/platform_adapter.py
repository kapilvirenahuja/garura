#!/usr/bin/env python3
"""
platform_adapter.py — the code-host adapter as a SCRIPT LIBRARY (#484).

The `platform-adapter` skill was pure prose an agent (repo-orchestrator) booted to
execute; that boot + context re-read is the chain-time cost #484 removes. This module
is the same 16-verb interface as a bundled script: it resolves the active platform from
`.garura/core/config.yaml` and dispatches each verb to `gh` (GitHub) or `glab` (GitLab),
returning the raw CLI output. Zero judgment — a fixed command per verb — so it belongs in
a script, per the tool-first rule and ADR 025.

Two ways in:
  - as a library:  from platform_adapter import dispatch
                   res = dispatch("view-pr", {"pr_number": "489"})
  - as a CLI:      python3 platform_adapter.py --verb view-pr --arg pr_number=489
                   [--config .garura/core/config.yaml] [--platform github]

`dispatch` returns {verb, platform, commands, stdout, stderr, exit_code}. exit_code is
the last command's (multi-step verbs run in sequence and stop on the first failure).

Commands are built as ARGV LISTS, never shell strings — so a body/title carrying quotes,
backticks, or `$(...)` is passed literally, not interpreted. This is stricter than the
prose it replaces.

GitHub is complete and exercised. GitLab argv is encoded verbatim from the skill's
`reference/gitlab/verbs.md` but is UNTESTED here (this repo is GitHub); the `glab` path is
config-switchable and flagged, not silently assumed correct.
"""

import argparse
import json
import re
import subprocess
import sys

GITHUB, GITLAB = "github", "gitlab"


# --- config ------------------------------------------------------------------
def resolve_platform(config_path):
    """Read the authoritative `platform:` key (default github). git remote is NOT used."""
    try:
        with open(config_path, encoding="utf-8") as fh:
            for line in fh:
                m = re.match(r"^platform:\s*(\S+)", line)
                if m:
                    return m.group(1).strip().strip("\"'")
    except FileNotFoundError:
        pass
    return GITHUB


def resolve_repo(config_path):
    """Return (owner, name) from the config's github/gitlab block; None if absent.
    Deterministic and network-free — used by the api-path verbs."""
    owner = name = None
    try:
        with open(config_path, encoding="utf-8") as fh:
            block = None
            for line in fh:
                if re.match(r"^(github|gitlab):\s*$", line):
                    block = "host"
                    continue
                if block == "host":
                    if re.match(r"^\S", line):  # dedented out of the block
                        block = None
                        continue
                    mo = re.match(r"\s+owner:\s*(\S+)", line)
                    mn = re.match(r"\s+name:\s*(\S+)", line)
                    if mo:
                        owner = mo.group(1).strip().strip("\"'").split("#")[0].strip()
                    if mn:
                        name = mn.group(1).strip().strip("\"'").split("#")[0].strip()
    except FileNotFoundError:
        pass
    return owner, name


def _encoded_project(owner, name):
    return f"{owner}%2F{name}"


# --- verb → argv builders ----------------------------------------------------
# Each builder takes (args, repo) and returns a list of argv lists (usually one;
# multi-step verbs return several, run in order). repo is (owner, name) or (None, None).
def _opt(argv, flag, val):
    if val is not None and val != "":
        argv += [flag, str(val)]


def _gh(verb, args, repo):
    a = args
    if verb == "view-pr":
        return [["gh", "pr", "view", str(a["pr_number"]), "--json",
                 "number,title,body,state,author,headRefName,baseRefName,"
                 "files,commits,mergeable,url"]]
    if verb == "diff-pr":
        return [["gh", "pr", "diff", str(a["pr_number"])]]
    if verb == "comment-pr":
        return [["gh", "pr", "comment", str(a["pr_number"]), "--body", a["body"]]]
    if verb == "request-changes":
        return [["gh", "pr", "review", str(a["pr_number"]),
                 "--request-changes", "--body", a["body"]]]
    if verb == "add-reviewer":
        return [["gh", "pr", "edit", str(a["pr_number"]),
                 "--add-reviewer", a["reviewer"]]]
    if verb == "create-pr":
        argv = ["gh", "pr", "create", "--title", a["title"],
                "--body", a["body"], "--base", a["base"]]
        if str(a.get("draft", "")).lower() in {"true", "1", "yes"}:
            argv.append("--draft")
        _opt(argv, "--label", a.get("label"))
        _opt(argv, "--assignee", a.get("assignee"))
        return [argv]
    if verb == "merge-pr":
        return [["gh", "pr", "merge", str(a["pr_number"]), "--merge"]]
    if verb == "view-issue":
        return [["gh", "issue", "view", str(a["issue_number"]), "--json",
                 "number,title,labels,state,body,url,closedAt"]]
    if verb == "create-issue":
        argv = ["gh", "issue", "create", "--title", a["title"], "--body", a["body"]]
        _opt(argv, "--label", a.get("labels"))
        argv += ["--assignee", a.get("assignee", "@me")]
        return [argv]
    if verb == "list-issues":
        return [["gh", "issue", "list", "--state", a.get("state", "open"),
                 "--search", a.get("query", ""), "--json",
                 "number,title,updatedAt,labels,state",
                 "--limit", str(a.get("limit", 30))]]
    if verb == "close-issue":
        argv = ["gh", "issue", "close", str(a["issue_number"]),
                "--reason", a.get("reason", "completed")]
        _opt(argv, "--comment", a.get("comment"))
        return [argv]
    if verb == "comment-issue":
        return [["gh", "issue", "comment", str(a["issue_number"]), "--body", a["body"]]]
    if verb == "add-label":
        if a.get("pr_number"):
            return [["gh", "pr", "edit", str(a["pr_number"]), "--add-label", a["labels"]]]
        return [["gh", "issue", "edit", str(a["number"]), "--add-label", a["labels"]]]
    if verb == "attach-sub-issue":
        owner, name = repo
        return [["gh", "api", f"/repos/{owner}/{name}/issues/{a['parent_number']}/"
                 "sub_issues", "-X", "POST", "-F",
                 f"sub_issue_id=@child_id:{a['child_number']}"]]  # resolved in dispatch
    if verb == "view-user":
        return [["gh", "api", "user", "--jq", ".login"]]
    if verb == "update-comment":
        owner, name = repo
        return [["gh", "api",
                 f"repos/{owner}/{name}/issues/comments/{a['comment_id']}",
                 "-X", "PATCH", "-f", f"body={a['body']}"]]
    raise KeyError(verb)


def _glab(verb, args, repo):
    # UNTESTED — encoded from reference/gitlab/verbs.md. Config-switchable.
    a = args
    owner, name = repo
    proj = _encoded_project(owner, name) if owner and name else "{project}"
    if verb == "view-pr":
        return [["glab", "mr", "view", str(a["pr_number"]), "--output", "json"]]
    if verb == "diff-pr":
        return [["glab", "mr", "diff", str(a["pr_number"])]]
    if verb == "comment-pr":
        return [["glab", "mr", "note", str(a["pr_number"]), "--message", a["body"]]]
    if verb == "request-changes":
        return [["glab", "mr", "update", str(a["pr_number"]), "--draft"],
                ["glab", "mr", "note", str(a["pr_number"]), "--message", a["body"]]]
    if verb == "add-reviewer":
        return [["glab", "mr", "update", str(a["pr_number"]), "--reviewer", a["reviewer"]]]
    if verb == "create-pr":
        argv = ["glab", "mr", "create", "--title", a["title"],
                "--description", a["body"], "--target-branch", a["base"]]
        if str(a.get("draft", "")).lower() in {"true", "1", "yes"}:
            argv.append("--draft")
        _opt(argv, "--label", a.get("label"))
        _opt(argv, "--assignee", a.get("assignee"))
        return [argv]
    if verb == "merge-pr":
        return [["glab", "mr", "merge", str(a["pr_number"])]]
    if verb == "view-issue":
        return [["glab", "issue", "view", str(a["issue_number"]), "--output", "json"]]
    if verb == "create-issue":
        argv = ["glab", "issue", "create", "--title", a["title"],
                "--description", a["body"]]
        _opt(argv, "--label", a.get("labels"))
        _opt(argv, "--assignee", a.get("assignee"))
        return [argv]
    if verb == "list-issues":
        return [["glab", "issue", "list", "--state", a.get("state", "opened"),
                 "--search", a.get("query", ""), "--output", "json"]]
    if verb == "close-issue":
        return [["glab", "issue", "close", str(a["issue_number"])]]  # no --reason
    if verb == "comment-issue":
        return [["glab", "issue", "note", str(a["issue_number"]), "--message", a["body"]]]
    if verb == "add-label":
        if a.get("pr_number"):
            return [["glab", "mr", "update", str(a["pr_number"]), "--label", a["labels"]]]
        return [["glab", "issue", "edit", str(a["number"]), "--label", a["labels"]]]
    if verb == "attach-sub-issue":
        return [["glab", "api", f"projects/{proj}/issues/{a['issue_number']}/links",
                 "-X", "POST", "-f", f"target_issue_iid={a['related_issue_number']}",
                 "-f", "link_type=relates_to"]]
    if verb == "view-user":
        return [["glab", "api", "user"]]  # caller extracts .username
    if verb == "update-comment":
        return [["glab", "api", f"projects/{proj}/notes/{a['comment_id']}",
                 "-X", "PUT", "-f", f"body={a['body']}"]]
    raise KeyError(verb)


VERBS = {"view-pr", "diff-pr", "comment-pr", "request-changes", "add-reviewer",
         "create-pr", "merge-pr", "view-issue", "create-issue", "list-issues",
         "close-issue", "comment-issue", "add-label", "attach-sub-issue",
         "view-user", "update-comment"}


def _run(argv):
    proc = subprocess.run(argv, capture_output=True, text=True)
    return proc.returncode, proc.stdout, proc.stderr


def dispatch(verb, args, config_path=".garura/core/config.yaml", platform=None):
    """Resolve platform, build the argv(s) for `verb`, run them in order, and return
    a result dict. Stops at the first non-zero command."""
    if verb not in VERBS:
        raise KeyError(f"unknown verb '{verb}' (known: {', '.join(sorted(VERBS))})")
    platform = platform or resolve_platform(config_path)
    if platform not in (GITHUB, GITLAB):
        raise ValueError(f"unsupported platform '{platform}'")
    repo = resolve_repo(config_path)
    builder = _gh if platform == GITHUB else _glab

    # attach-sub-issue on GitHub needs the child's numeric id first (a resolve step).
    if verb == "attach-sub-issue" and platform == GITHUB:
        owner, name = repo
        rc, out, err = _run(["gh", "api", f"/repos/{owner}/{name}/issues/"
                             f"{args['child_number']}", "--jq", ".id"])
        if rc != 0:
            return {"verb": verb, "platform": platform, "commands": ["resolve child id"],
                    "stdout": out, "stderr": err, "exit_code": rc}
        args = dict(args, _child_id=out.strip())
        cmds = [["gh", "api", f"/repos/{owner}/{name}/issues/"
                 f"{args['parent_number']}/sub_issues", "-X", "POST", "-F",
                 f"sub_issue_id={out.strip()}"]]
    else:
        cmds = builder(verb, args, repo)

    last_rc, last_out, last_err = 0, "", ""
    ran = []
    for argv in cmds:
        ran.append(argv)
        last_rc, last_out, last_err = _run(argv)
        if last_rc != 0:
            break
    return {"verb": verb, "platform": platform, "commands": ran,
            "stdout": last_out, "stderr": last_err, "exit_code": last_rc}


def main(argv=None):
    ap = argparse.ArgumentParser(description="Code-host adapter (16 verbs).")
    ap.add_argument("--verb", required=True)
    ap.add_argument("--config", default=".garura/core/config.yaml")
    ap.add_argument("--platform", default=None)
    ap.add_argument("--arg", action="append", default=[],
                    help="key=value (repeatable)")
    ap.add_argument("--args-json", default=None, help="args as a JSON object")
    ns = ap.parse_args(argv)
    args = json.loads(ns.args_json) if ns.args_json else {}
    for kv in ns.arg:
        k, _, v = kv.partition("=")
        args[k] = v
    try:
        res = dispatch(ns.verb, args, config_path=ns.config, platform=ns.platform)
    except (KeyError, ValueError) as exc:
        sys.stderr.write(f"platform_adapter.py: {exc}\n")
        sys.exit(2)
    print(json.dumps(res, indent=2))
    sys.exit(0 if res["exit_code"] == 0 else 1)


if __name__ == "__main__":
    main()
