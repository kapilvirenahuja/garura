# Consolidate Ad-hoc Fields into Standard Contract Fields
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Reviewing agent input contracts across multiple plays and finding that the same logical information is passed under different field names.
**When this does NOT apply:** Fields that are intentionally different (they carry semantically distinct information despite similar names); single-play agents where no cross-play consistency is needed.
**Search patterns:** contract standardization, field consolidation, ad-hoc fields, ltm_context, uniform contract, naming consistency, schema normalization
**Provenance:** Issue #182 — learn play dry run
**Created:** 2026-03-31

## Content

When multiple plays call the same agent using different field names for the same logical input, consolidate to one canonical field name. Example:

**Before consolidation:**
```yaml
# Play A
input:
  ltm_path: "/path/to/ltm"

# Play B
input:
  ltm_architecture_path: "/path/to/ltm"

# Play C
input:
  scan_directories: ["/path/to/ltm"]
```

**After consolidation:**
```yaml
# All plays
input:
  ltm_context: "/path/to/ltm"  # or structured list, consistently
```

**Consolidation process:**
1. Audit all callers of the agent. Identify all field names used for the same logical purpose.
2. Choose a canonical name. Prefer the most generic and self-explanatory option.
3. Update the agent to accept the canonical field. Use the optional field adoption pattern (KC-003) to maintain backward compatibility during transition.
4. Update all callers to use the canonical field, one at a time.
5. Once all callers are migrated, remove support for the old field names.

**Benefits of consolidation:**
- Agents have one expected input shape — no conditional logic per-caller
- Plays cannot invent conventions — they must use the standard field
- Validation is uniform — one schema to validate, not per-caller variations
- New play authors have one field to learn, not N historical variants

**Anti-pattern: premature standardization.** Do not consolidate fields that LOOK similar but carry different semantics. Verify intent before merging.

## Why It Matters

Ad-hoc field proliferation is a form of technical debt in contract design. Each new variant requires agents to implement conditional handling, increases documentation burden, and confuses new play authors about which field to use. Left unchecked, agents accumulate 5-10 ways to receive the same input, making the contract unmaintainable. Periodic consolidation keeps contracts readable and agents testable.

## Applicability Boundaries

**In scope:** Any API or agent contract used by multiple independent callers where field names have diverged organically over time.
**Out of scope:** Internal agent state fields; fields used by only one caller where the naming is purely local; fields where the apparent similarity is misleading.

## Rationale

Contract normalization is a foundational database and API design principle. It prevents "column sprawl" in schemas and "parameter explosion" in APIs. The specific example (ltm_context consolidation) is Meridian-specific, but the pattern — identify divergent field names, choose a canonical form, migrate callers — is universally applicable to any multi-caller system.

## Decay Tracking

**Last validated:** 2026-03-31
**Confidence:** medium
**Staleness window:** 180 days
**Supersedes:** null
