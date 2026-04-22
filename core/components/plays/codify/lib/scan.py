#!/usr/bin/env python3
"""
codify/scan.py — deterministic codebase scanner for the /codify play.

Produces a bounded JSON index that downstream inference skills consume. The
index is the sole structured input to agents — they MUST NOT navigate the
codebase at large. This script never reads source files into the LLM; it
only extracts structured facts.

Inputs:
  --path <dir>       repository root (repeatable; multi-repo supported)
  --output <file>    scan-index.json destination (required)
  --size-limit-mb N  soft cap on scan-index.json size (default 10)
  --time-limit-s N   soft cap on wall-clock duration (default 600)
  --ignore <pat>     additional ignore glob (repeatable)

Behavior:
  - Walks each root once with a built-in ignore list (plus user patterns)
  - Parses manifest files per ecosystem (node/python/go/rust/ruby/java/.net)
  - Captures directory tree with depth cap and file-count cap
  - Summarizes git history (churn, co-change, contributors, tags, adr commits)
  - Runs ripgrep pattern sweeps for framework idioms and naming conventions
  - Detects frontend via dep + path signals
  - Harvests ADRs and top-level docs
  - Enforces size + time budgets; writes partial index with scan_status on
    exhaustion

Exit codes:
  0   scan_status is "complete" or "budget_exhausted" (both write an index)
  2   fatal error before index could be written
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

# ──────────────────────────────────────────────────────────────────────────────
# Constants

DEFAULT_IGNORE = [
    ".git", ".svn", ".hg",
    "node_modules", "bower_components", "jspm_packages",
    "dist", "build", "out", "target", "bin", "obj",
    ".next", ".nuxt", ".svelte-kit", ".output",
    "vendor", "Godeps",
    "__pycache__", ".pytest_cache", ".mypy_cache", ".ruff_cache",
    ".venv", "venv", "env", ".env",
    ".tox", ".nox",
    "coverage", ".coverage", "htmlcov", ".nyc_output",
    ".gradle", ".idea", ".vscode", ".vs",
    "DerivedData", "Pods",
    ".terraform", ".tfstate",
    ".cache", ".parcel-cache",
    "*.log", "*.pyc", "*.class", "*.o", "*.a", "*.so", "*.dylib", "*.dll",
]

MAX_TREE_DEPTH = 4
MAX_TREE_ENTRIES = 5000
MAX_CHURN_FILES = 50
MAX_COCHANGE_PAIRS = 50
MAX_RIPGREP_MATCHES_PER_QUERY = 200
MAX_MANIFEST_BYTES = 256 * 1024  # don't load >256KB of a single manifest
MAX_DOC_PREVIEW_BYTES = 8 * 1024  # 8KB README preview

FRONTEND_DEPS = {
    "react", "react-dom", "vue", "@vue/core", "svelte", "@sveltejs/kit",
    "angular", "@angular/core", "solid-js", "qwik", "@qwik.dev/core",
    "preact", "lit", "@lit/reactive-element", "ember-source", "@ember/core",
    "next", "nuxt", "remix", "astro", "gatsby",
}

FRONTEND_PATH_MARKERS = [
    "src/components", "src/pages", "src/views", "src/routes",
    "app/pages", "app/routes", "app/components",
    "pages", "public/index.html", "index.html",
]

# Framework idiom probes — (label, ripgrep pattern)
FRAMEWORK_PROBES = [
    ("express-middleware",      r"app\.(use|get|post|put|delete|patch)\("),
    ("nestjs-decorators",       r"@(Controller|Injectable|Module|Get|Post)\("),
    ("fastapi-decorators",      r"@(app|router)\.(get|post|put|delete|patch)\("),
    ("flask-route",             r"@app\.route\("),
    ("django-view",             r"class\s+\w+\s*\(\s*(View|APIView|ViewSet)"),
    ("spring-annotation",       r"@(RestController|Controller|Service|Repository|Component)\b"),
    ("gin-router",              r"\.(GET|POST|PUT|DELETE|PATCH)\(\s*\""),
    ("rails-controller",        r"class\s+\w+Controller\s+<\s+ApplicationController"),
    ("phoenix-router",          r"scope\s+\"/\"\s*,"),
    ("rust-actix",              r"#\[(get|post|put|delete|patch)\("),
    ("graphql-schema",          r"type\s+Query\b|type\s+Mutation\b"),
    ("grpc-service",            r"service\s+\w+\s*\{"),
    ("openapi-spec",            r"^\s*openapi:\s*3"),
]

NAMING_SUFFIXES = [
    "Controller", "Service", "Repository", "Handler", "Middleware",
    "Model", "Entity", "Dto", "DTO", "Mapper", "Factory", "Builder",
    "Store", "Reducer", "Action", "Component", "Provider", "Context",
    "Hook", "UseCase", "Policy", "Gateway", "Adapter",
]

TEST_FRAMEWORK_PROBES = [
    ("jest",           r"from\s+['\"](jest|@jest/globals)['\"]"),
    ("vitest",         r"from\s+['\"]vitest['\"]"),
    ("mocha",          r"describe\(|it\("),
    ("pytest",         r"^\s*import\s+pytest|^\s*from\s+pytest"),
    ("unittest",       r"^\s*import\s+unittest|^\s*from\s+unittest"),
    ("go-testing",     r"^\s*import\s+\"testing\""),
    ("rspec",          r"describe\s+['\"]"),
    ("junit",          r"import\s+org\.junit"),
    ("xunit",          r"using\s+Xunit"),
    ("rust-cfgtest",   r"#\[cfg\(test\)\]"),
]

CONFIG_FILE_CATEGORIES = {
    "ci":     ["Jenkinsfile", ".gitlab-ci.yml", ".circleci/config.yml",
               "azure-pipelines.yml", ".drone.yml", "Makefile",
               ".github/workflows/"],
    "docker": ["Dockerfile", "docker-compose.yml", "docker-compose.yaml",
               ".dockerignore"],
    "lint":   [".eslintrc", ".eslintrc.js", ".eslintrc.json", ".eslintrc.yml",
               ".prettierrc", ".prettierrc.js", ".prettierrc.json",
               ".rubocop.yml", ".flake8", "ruff.toml", "pyproject.toml",
               ".golangci.yml", "clippy.toml", "rustfmt.toml",
               ".stylelintrc", ".checkstyle.xml"],
    "type":   ["tsconfig.json", "jsconfig.json", "mypy.ini", "pyrightconfig.json",
               ".pre-commit-config.yaml"],
    "test":   ["jest.config.js", "jest.config.ts", "vitest.config.ts",
               "pytest.ini", "tox.ini", "karma.conf.js", "playwright.config.ts",
               "cypress.config.ts", "phpunit.xml"],
    "infra":  ["terraform/", "pulumi/", "cdk/", "serverless.yml",
               "kubernetes/", "k8s/", "helm/", "charts/"],
    "deploy": ["Procfile", "vercel.json", "netlify.toml", "fly.toml",
               "app.yaml", "firebase.json"],
}

MANIFEST_KINDS = {
    "package.json":       "node",
    "package-lock.json":  "node",
    "yarn.lock":          "node",
    "pnpm-lock.yaml":     "node",
    "bun.lockb":          "node",
    "pyproject.toml":     "python",
    "setup.py":           "python",
    "setup.cfg":          "python",
    "requirements.txt":   "python",
    "Pipfile":            "python",
    "Pipfile.lock":       "python",
    "poetry.lock":        "python",
    "go.mod":             "go",
    "go.sum":             "go",
    "Cargo.toml":         "rust",
    "Cargo.lock":         "rust",
    "Gemfile":            "ruby",
    "Gemfile.lock":       "ruby",
    "build.gradle":       "jvm",
    "build.gradle.kts":   "jvm",
    "pom.xml":            "jvm",
    "settings.gradle":    "jvm",
    "*.csproj":           "dotnet",
    "*.fsproj":           "dotnet",
    "packages.config":    "dotnet",
    "composer.json":      "php",
    "composer.lock":      "php",
    "mix.exs":            "elixir",
    "rebar.config":       "erlang",
    "Package.swift":      "swift",
    "pubspec.yaml":       "dart",
    "CMakeLists.txt":     "cmake",
}


# ──────────────────────────────────────────────────────────────────────────────
# Data model

@dataclass
class ScanBudget:
    size_limit_bytes: int
    time_limit_seconds: int
    start_time: float = field(default_factory=time.time)
    size_used: int = 0
    exhausted_reason: str | None = None

    def time_used(self) -> float:
        return time.time() - self.start_time

    def time_remaining(self) -> float:
        return self.time_limit_seconds - self.time_used()

    def check(self) -> bool:
        """Return True if budget is OK, False if exhausted."""
        if self.time_used() >= self.time_limit_seconds:
            self.exhausted_reason = "time_limit"
            return False
        if self.size_used >= self.size_limit_bytes:
            self.exhausted_reason = "size_limit"
            return False
        return True


@dataclass
class RepoInfo:
    root_path: str
    label: str
    file_count: int = 0
    total_bytes: int = 0


# ──────────────────────────────────────────────────────────────────────────────
# Helpers

def _which(cmd: str) -> str | None:
    return shutil.which(cmd)


def _run(cmd: list[str], cwd: str | None = None, timeout: int = 60) -> tuple[int, str, str]:
    """Run a command, return (returncode, stdout, stderr). Swallow failures."""
    try:
        r = subprocess.run(
            cmd, cwd=cwd, capture_output=True, text=True, timeout=timeout,
        )
        return r.returncode, r.stdout, r.stderr
    except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
        return 1, "", ""


def _is_ignored(name: str, ignore_names: set[str]) -> bool:
    if name in ignore_names:
        return True
    for pat in ignore_names:
        if "*" in pat and _fnmatch(name, pat):
            return True
    return False


def _fnmatch(name: str, pat: str) -> bool:
    import fnmatch
    return fnmatch.fnmatch(name, pat)


def _safe_read(path: Path, max_bytes: int) -> str:
    try:
        with path.open("rb") as f:
            data = f.read(max_bytes + 1)
        if len(data) > max_bytes:
            data = data[:max_bytes]
        return data.decode("utf-8", errors="replace")
    except OSError:
        return ""


def _json_size(obj: Any) -> int:
    return len(json.dumps(obj, default=str).encode("utf-8"))


# ──────────────────────────────────────────────────────────────────────────────
# Manifest parsing

def parse_manifest(path: Path, kind: str) -> dict[str, Any]:
    """Return a small, structured summary of a manifest file."""
    summary: dict[str, Any] = {"path": str(path), "kind": kind}
    text = _safe_read(path, MAX_MANIFEST_BYTES)
    if not text:
        return summary
    name = path.name
    try:
        if name == "package.json":
            data = json.loads(text)
            summary["name"] = data.get("name")
            summary["version"] = data.get("version")
            summary["scripts"] = list((data.get("scripts") or {}).keys())
            deps = {**(data.get("dependencies") or {}),
                    **(data.get("devDependencies") or {})}
            summary["dependencies"] = sorted(deps.keys())[:150]
            summary["engines"] = data.get("engines") or {}
        elif name == "pyproject.toml":
            summary["dependencies"] = _extract_toml_deps(text)
            summary["python"] = _extract_python_version(text)
            summary["raw_first_lines"] = "\n".join(text.splitlines()[:40])
        elif name in {"setup.py", "setup.cfg", "requirements.txt", "Pipfile"}:
            summary["dependencies"] = _extract_requirements(text)
        elif name == "go.mod":
            summary["module"] = _extract_go_module(text)
            summary["go_version"] = _extract_go_version(text)
            summary["dependencies"] = _extract_go_requires(text)[:150]
        elif name == "Cargo.toml":
            summary["name"] = _extract_cargo_name(text)
            summary["dependencies"] = _extract_cargo_deps(text)[:150]
        elif name == "Gemfile":
            summary["dependencies"] = _extract_gemfile(text)[:150]
        elif name == "pom.xml":
            summary["dependencies"] = _extract_pom_artifacts(text)[:150]
        elif name in {"build.gradle", "build.gradle.kts"}:
            summary["dependencies"] = _extract_gradle_deps(text)[:150]
        elif name == "composer.json":
            data = json.loads(text)
            summary["name"] = data.get("name")
            summary["dependencies"] = sorted(list((data.get("require") or {}).keys()))
        elif name.endswith(".csproj") or name.endswith(".fsproj"):
            summary["dependencies"] = _extract_dotnet_refs(text)[:150]
        elif name == "mix.exs":
            summary["dependencies"] = _extract_mix_deps(text)[:150]
        elif name == "pubspec.yaml":
            summary["dependencies"] = _extract_pubspec(text)[:150]
    except Exception as exc:
        summary["parse_error"] = str(exc)
    return summary


def _extract_toml_deps(text: str) -> list[str]:
    deps: list[str] = []
    in_deps = False
    for line in text.splitlines():
        s = line.strip()
        if s.startswith("["):
            in_deps = any(
                s.startswith(hdr) for hdr in (
                    "[project.dependencies]",
                    "[tool.poetry.dependencies]",
                    "[dependencies]",
                )
            )
            continue
        if in_deps and s and not s.startswith("#"):
            m = re.match(r'^"?([A-Za-z0-9_\-.]+)"?\s*=', s)
            if m:
                deps.append(m.group(1))
            elif "=" in s:
                deps.append(s.split("=", 1)[0].strip().strip('"'))
    return deps[:150]


def _extract_python_version(text: str) -> str | None:
    m = re.search(r'python\s*=\s*"([^"]+)"', text)
    return m.group(1) if m else None


def _extract_requirements(text: str) -> list[str]:
    out: list[str] = []
    for line in text.splitlines():
        s = line.strip()
        if not s or s.startswith("#") or s.startswith("-") or s.startswith("["):
            continue
        m = re.match(r'^([A-Za-z0-9_\-.]+)', s)
        if m:
            out.append(m.group(1))
    return out[:150]


def _extract_go_module(text: str) -> str | None:
    m = re.search(r'^\s*module\s+(\S+)', text, re.MULTILINE)
    return m.group(1) if m else None


def _extract_go_version(text: str) -> str | None:
    m = re.search(r'^\s*go\s+(\S+)', text, re.MULTILINE)
    return m.group(1) if m else None


def _extract_go_requires(text: str) -> list[str]:
    out: list[str] = []
    for m in re.finditer(r'^\s*(\S+)\s+v\S+', text, re.MULTILINE):
        mod = m.group(1)
        if "/" in mod:
            out.append(mod)
    return out


def _extract_cargo_name(text: str) -> str | None:
    m = re.search(r'^\s*name\s*=\s*"([^"]+)"', text, re.MULTILINE)
    return m.group(1) if m else None


def _extract_cargo_deps(text: str) -> list[str]:
    out: list[str] = []
    in_deps = False
    for line in text.splitlines():
        s = line.strip()
        if s.startswith("["):
            in_deps = s.startswith("[dependencies") or s.startswith("[dev-dependencies")
            continue
        if in_deps and "=" in s:
            key = s.split("=", 1)[0].strip().strip('"')
            if key:
                out.append(key)
    return out


def _extract_gemfile(text: str) -> list[str]:
    return re.findall(r'gem\s+["\']([^"\']+)["\']', text)


def _extract_pom_artifacts(text: str) -> list[str]:
    out: list[str] = []
    for m in re.finditer(r'<artifactId>([^<]+)</artifactId>', text):
        out.append(m.group(1))
    return out


def _extract_gradle_deps(text: str) -> list[str]:
    out: list[str] = []
    for m in re.finditer(
        r'(?:implementation|api|compile|testImplementation)\s+["\']([^:"\']+):([^:"\']+)',
        text,
    ):
        out.append(f"{m.group(1)}:{m.group(2)}")
    return out


def _extract_dotnet_refs(text: str) -> list[str]:
    out: list[str] = []
    for m in re.finditer(r'<PackageReference\s+Include="([^"]+)"', text):
        out.append(m.group(1))
    return out


def _extract_mix_deps(text: str) -> list[str]:
    out: list[str] = []
    for m in re.finditer(r'\{\s*:(\w+)\s*,', text):
        out.append(m.group(1))
    return out


def _extract_pubspec(text: str) -> list[str]:
    out: list[str] = []
    in_deps = False
    for line in text.splitlines():
        s = line.rstrip()
        if s.startswith("dependencies:") or s.startswith("dev_dependencies:"):
            in_deps = True
            continue
        if s and not s.startswith(" ") and not s.startswith("\t"):
            in_deps = False
        if in_deps:
            m = re.match(r'^\s{2}([A-Za-z0-9_\-]+):', s)
            if m:
                out.append(m.group(1))
    return out


# ──────────────────────────────────────────────────────────────────────────────
# Walk

def walk_repo(
    root: Path, ignore_names: set[str], budget: ScanBudget,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], RepoInfo]:
    """
    Walk the repo once. Returns:
      - manifests: list of manifest summaries
      - tree: list of {path, kind: file|dir, size_bytes} capped to MAX_TREE_ENTRIES
      - repo_info: totals
    """
    manifests: list[dict[str, Any]] = []
    tree: list[dict[str, Any]] = []
    info = RepoInfo(root_path=str(root), label=root.name)

    for cur_dir, dirs, files in os.walk(root):
        if not budget.check():
            break
        rel_dir = str(Path(cur_dir).relative_to(root))
        depth = 0 if rel_dir == "." else rel_dir.count(os.sep) + 1
        # prune ignored dirs in-place
        dirs[:] = sorted(d for d in dirs if not _is_ignored(d, ignore_names))
        if depth < MAX_TREE_DEPTH and len(tree) < MAX_TREE_ENTRIES:
            for d in dirs:
                tree.append({
                    "path": os.path.join(rel_dir, d) if rel_dir != "." else d,
                    "kind": "dir",
                })
        for fname in sorted(files):
            if _is_ignored(fname, ignore_names):
                continue
            fpath = Path(cur_dir) / fname
            try:
                size = fpath.stat().st_size
            except OSError:
                continue
            info.file_count += 1
            info.total_bytes += size
            if depth < MAX_TREE_DEPTH and len(tree) < MAX_TREE_ENTRIES:
                rel = os.path.join(rel_dir, fname) if rel_dir != "." else fname
                tree.append({"path": rel, "kind": "file", "size_bytes": size})
            # manifest detection
            kind = _manifest_kind(fname)
            if kind:
                m = parse_manifest(fpath, kind)
                m["path"] = str(fpath.relative_to(root))
                manifests.append(m)
                budget.size_used += _json_size(m)
            if not budget.check():
                break

    return manifests, tree, info


def _manifest_kind(fname: str) -> str | None:
    if fname in MANIFEST_KINDS:
        return MANIFEST_KINDS[fname]
    for pat, kind in MANIFEST_KINDS.items():
        if "*" in pat and _fnmatch(fname, pat):
            return kind
    return None


# ──────────────────────────────────────────────────────────────────────────────
# Git signals

def collect_git(root: Path, budget: ScanBudget) -> dict[str, Any]:
    git = _which("git")
    if not git or not (root / ".git").exists():
        return {"available": False}
    out: dict[str, Any] = {"available": True}

    rc, so, _ = _run(
        [git, "log", "--pretty=format:%H|%an|%at", "--name-only",
         "-n", "500"],
        cwd=str(root), timeout=min(30, int(budget.time_remaining())),
    )
    if rc != 0:
        out["error"] = "git log failed"
        return out

    churn: dict[str, int] = {}
    co_change: dict[tuple[str, str], int] = {}
    contributors: dict[str, int] = {}
    commit_count = 0
    current_files: list[str] = []
    current_author = None

    for line in so.splitlines():
        if "|" in line and line.count("|") >= 2:
            # commit header
            if current_files and current_author:
                for f in current_files:
                    churn[f] = churn.get(f, 0) + 1
                if len(current_files) > 1:
                    cf = sorted(set(current_files))
                    for i in range(len(cf)):
                        for j in range(i + 1, len(cf)):
                            k = (cf[i], cf[j])
                            co_change[k] = co_change.get(k, 0) + 1
                contributors[current_author] = contributors.get(current_author, 0) + 1
                commit_count += 1
            parts = line.split("|", 2)
            current_author = parts[1] if len(parts) > 1 else None
            current_files = []
        elif line.strip():
            current_files.append(line.strip())
    # flush last commit
    if current_files and current_author:
        for f in current_files:
            churn[f] = churn.get(f, 0) + 1
        contributors[current_author] = contributors.get(current_author, 0) + 1
        commit_count += 1

    top_churn = sorted(churn.items(), key=lambda kv: -kv[1])[:MAX_CHURN_FILES]
    top_co = sorted(co_change.items(), key=lambda kv: -kv[1])[:MAX_COCHANGE_PAIRS]

    out["commits_analyzed"] = commit_count
    out["churn_top"] = [{"path": p, "commits": c} for p, c in top_churn]
    out["co_change_top"] = [
        {"pair": list(p), "commits": c} for p, c in top_co
    ]
    out["contributors"] = [
        {"author": a, "commits": c}
        for a, c in sorted(contributors.items(), key=lambda kv: -kv[1])[:25]
    ]

    rc, tags, _ = _run([git, "tag", "--list", "--sort=-creatordate"],
                        cwd=str(root), timeout=10)
    if rc == 0:
        out["tags_recent"] = [t for t in tags.splitlines() if t][:20]

    rc, adrs, _ = _run(
        [git, "log", "--pretty=format:%H|%at|%s", "--name-only",
         "-n", "100", "--", "docs/adr/", "docs/adrs/", "docs/architecture/"],
        cwd=str(root), timeout=15,
    )
    if rc == 0 and adrs.strip():
        out["adr_commits"] = [l for l in adrs.splitlines() if l][:100]

    return out


# ──────────────────────────────────────────────────────────────────────────────
# Pattern sweeps via ripgrep

def collect_patterns(root: Path, budget: ScanBudget) -> dict[str, Any]:
    rg = _which("rg")
    if not rg or not budget.check():
        return {"available": False, "reason": "ripgrep_missing" if not rg else "budget"}

    idioms: list[dict[str, Any]] = []
    for label, pattern in FRAMEWORK_PROBES:
        if not budget.check():
            break
        matches = _rg_count(rg, root, pattern)
        if matches > 0:
            idioms.append({"label": label, "pattern": pattern, "matches": matches})

    naming: dict[str, int] = {}
    for suffix in NAMING_SUFFIXES:
        if not budget.check():
            break
        matches = _rg_count_files(rg, root, rf"{suffix}\.(ts|tsx|js|jsx|py|go|rs|java|cs|rb|kt|swift)$",
                                   is_glob=False, file_regex=True)
        if matches > 0:
            naming[suffix] = matches

    test_frameworks: list[dict[str, Any]] = []
    for label, pat in TEST_FRAMEWORK_PROBES:
        if not budget.check():
            break
        n = _rg_count(rg, root, pat)
        if n > 0:
            test_frameworks.append({"framework": label, "signal_hits": n})

    return {
        "available": True,
        "framework_idioms": idioms,
        "naming_suffix_counts": naming,
        "test_framework_signals": test_frameworks,
    }


def _rg_count(rg: str, root: Path, pattern: str) -> int:
    rc, out, _ = _run(
        [rg, "--no-messages", "--count-matches", "--multiline-dotall=false",
         "-e", pattern, str(root)],
        timeout=20,
    )
    if rc not in (0, 1):
        return 0
    total = 0
    for line in out.splitlines():
        if ":" in line:
            try:
                total += int(line.rsplit(":", 1)[1])
            except ValueError:
                continue
    return total


def _rg_count_files(
    rg: str, root: Path, pattern: str,
    is_glob: bool = False, file_regex: bool = False,
) -> int:
    if file_regex:
        rc, out, _ = _run(
            [rg, "--no-messages", "--files", str(root)], timeout=20,
        )
        if rc not in (0, 1):
            return 0
        regex = re.compile(pattern)
        return sum(1 for line in out.splitlines() if regex.search(line))
    return 0


# ──────────────────────────────────────────────────────────────────────────────
# Frontend detection

def detect_frontend(
    manifests: list[dict[str, Any]], tree: list[dict[str, Any]],
) -> dict[str, Any]:
    signals: list[str] = []
    deps_hit: list[str] = []
    for m in manifests:
        for d in (m.get("dependencies") or []):
            if d in FRONTEND_DEPS:
                deps_hit.append(d)
    if deps_hit:
        signals.append(f"frontend dependencies: {', '.join(sorted(set(deps_hit)))}")
    path_hits: list[str] = []
    for entry in tree:
        for marker in FRONTEND_PATH_MARKERS:
            if entry["path"].endswith(marker) or entry["path"] == marker:
                path_hits.append(entry["path"])
    if path_hits:
        signals.append(f"frontend paths: {', '.join(sorted(set(path_hits))[:5])}")
    return {
        "detected": bool(signals),
        "signals": signals,
        "evidence_deps": sorted(set(deps_hit)),
        "evidence_paths": sorted(set(path_hits))[:20],
    }


# ──────────────────────────────────────────────────────────────────────────────
# Docs + config harvest

def collect_docs(root: Path) -> dict[str, Any]:
    out: dict[str, Any] = {}
    readme_paths = [
        root / "README.md", root / "README.rst", root / "README.txt",
        root / "readme.md",
    ]
    for p in readme_paths:
        if p.exists():
            out["readme_path"] = str(p.relative_to(root))
            out["readme_preview"] = _safe_read(p, MAX_DOC_PREVIEW_BYTES)
            break

    adrs: list[dict[str, Any]] = []
    for candidate in [root / "docs" / "adr", root / "docs" / "adrs",
                      root / "adr", root / "architecture" / "adr"]:
        if candidate.is_dir():
            for f in sorted(candidate.glob("*.md"))[:50]:
                title = _read_first_heading(f)
                adrs.append({
                    "path": str(f.relative_to(root)),
                    "title": title,
                })
    out["adrs"] = adrs

    return out


def _read_first_heading(path: Path) -> str | None:
    text = _safe_read(path, 4096)
    for line in text.splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return None


def collect_config(root: Path, tree: list[dict[str, Any]]) -> dict[str, list[str]]:
    out: dict[str, list[str]] = {k: [] for k in CONFIG_FILE_CATEGORIES}
    tree_paths = {e["path"] for e in tree if e["kind"] == "file"}
    tree_dirs = {e["path"] for e in tree if e["kind"] == "dir"}
    for cat, markers in CONFIG_FILE_CATEGORIES.items():
        for marker in markers:
            if marker.endswith("/"):
                if any(p.startswith(marker) for p in tree_dirs):
                    out[cat].append(marker)
            elif marker in tree_paths:
                out[cat].append(marker)
            else:
                # ".eslintrc*" style partial match
                matches = [p for p in tree_paths if p == marker or p.endswith("/" + marker)]
                out[cat].extend(matches[:5])
    return out


# ──────────────────────────────────────────────────────────────────────────────
# Entry points

ENTRY_FILE_NAMES = {
    "main.py", "__main__.py", "app.py", "server.py", "cli.py", "manage.py",
    "index.ts", "index.js", "app.ts", "app.js", "server.ts", "server.js",
    "main.ts", "main.js", "main.go", "main.rs",
    "Main.java", "Program.cs",
}


def collect_entry_points(tree: list[dict[str, Any]]) -> list[str]:
    out: list[str] = []
    for entry in tree:
        if entry["kind"] != "file":
            continue
        base = os.path.basename(entry["path"])
        if base in ENTRY_FILE_NAMES:
            out.append(entry["path"])
    return sorted(out)[:30]


# ──────────────────────────────────────────────────────────────────────────────
# Main orchestration

def scan(
    roots: list[Path],
    output: Path,
    size_limit_bytes: int,
    time_limit_seconds: int,
    extra_ignore: list[str],
) -> dict[str, Any]:
    ignore_names = set(DEFAULT_IGNORE) | set(extra_ignore)
    budget = ScanBudget(size_limit_bytes=size_limit_bytes,
                        time_limit_seconds=time_limit_seconds)

    all_manifests: list[dict[str, Any]] = []
    all_trees: dict[str, list[dict[str, Any]]] = {}
    repos_out: list[dict[str, Any]] = []
    all_git: dict[str, dict[str, Any]] = {}
    all_docs: dict[str, dict[str, Any]] = {}
    all_config: dict[str, dict[str, list[str]]] = {}
    all_patterns: dict[str, dict[str, Any]] = {}
    all_frontend: dict[str, dict[str, Any]] = {}
    all_entry: dict[str, list[str]] = {}

    for root in roots:
        if not budget.check():
            break
        root = root.resolve()
        label = root.name
        manifests, tree, info = walk_repo(root, ignore_names, budget)
        # tag manifests with repo label
        for m in manifests:
            m["repo"] = label
        all_manifests.extend(manifests)
        all_trees[label] = tree
        all_entry[label] = collect_entry_points(tree)
        all_docs[label] = collect_docs(root)
        all_config[label] = collect_config(root, tree)
        all_frontend[label] = detect_frontend(manifests, tree)
        all_patterns[label] = collect_patterns(root, budget)
        all_git[label] = collect_git(root, budget)
        repos_out.append({
            "label": label,
            "root_path": str(root),
            "file_count": info.file_count,
            "total_bytes": info.total_bytes,
        })

    scan_status = "complete" if budget.check() else "budget_exhausted"

    result = {
        "schema_version": "1.0",
        "scan_status": scan_status,
        "budget_exhausted_reason": budget.exhausted_reason,
        "scan_duration_seconds": round(budget.time_used(), 2),
        "scan_size_bytes": None,  # filled after serialization
        "repos": repos_out,
        "manifests": all_manifests,
        "trees": all_trees,
        "entry_points": all_entry,
        "docs": all_docs,
        "config_files": all_config,
        "frontend_detection": all_frontend,
        "patterns": all_patterns,
        "git": all_git,
        "budget": {
            "size_limit_bytes": size_limit_bytes,
            "time_limit_seconds": time_limit_seconds,
            "size_used_estimated": budget.size_used,
            "time_used": round(budget.time_used(), 2),
        },
    }
    return result


# ──────────────────────────────────────────────────────────────────────────────
# CLI

def main() -> int:
    ap = argparse.ArgumentParser(description="codify codebase scanner")
    ap.add_argument("--path", action="append", required=True,
                    help="repository root (repeatable)")
    ap.add_argument("--output", required=True, help="scan-index.json path")
    ap.add_argument("--size-limit-mb", type=int, default=10)
    ap.add_argument("--time-limit-s", type=int, default=600)
    ap.add_argument("--ignore", action="append", default=[])
    args = ap.parse_args()

    roots: list[Path] = []
    for p in args.path:
        pp = Path(p)
        if not pp.exists() or not pp.is_dir():
            print(f"scan.py: path not a directory: {p}", file=sys.stderr)
            return 2
        roots.append(pp)

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    result = scan(
        roots=roots,
        output=out_path,
        size_limit_bytes=args.size_limit_mb * 1024 * 1024,
        time_limit_seconds=args.time_limit_s,
        extra_ignore=args.ignore,
    )

    blob = json.dumps(result, indent=2, default=str)
    result["scan_size_bytes"] = len(blob.encode("utf-8"))
    blob = json.dumps(result, indent=2, default=str)
    out_path.write_text(blob, encoding="utf-8")

    status = result["scan_status"]
    print(f"scan.py: {status} ({result['scan_duration_seconds']}s, "
          f"{len(blob)} bytes, {len(result['manifests'])} manifests, "
          f"{sum(len(v) for v in result['trees'].values())} tree entries)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
