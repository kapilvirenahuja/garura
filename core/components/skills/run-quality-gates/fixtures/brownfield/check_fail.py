#!/usr/bin/env python3
"""Brownfield fixture: a check that fails (stands in for a linter finding violations)."""
print("2 problems (2 errors, 0 warnings)")
raise SystemExit(1)
