# Grandfather Existing Artifacts When Introducing Standards
<!-- knowledge-file: tier=2 scope=core -->

**When this applies:** Introducing a new file format standard, metadata schema, or convention that would require changes to existing files to fully comply.
**When this does NOT apply:** Critical security or correctness fixes where existing files are actively harmful and must be updated immediately; small codebases where a flag-day migration is trivially achievable.
**Search patterns:** grandfathering, backward compatibility, existing files, format migration, incremental adoption, forward-looking standards
**Provenance:** Issue #182 — learn play dry run
**Created:** 2026-03-31

## Content

When a new standard is introduced for a file format or metadata schema, apply the following rule:

**Grandfathering rule:** Existing files continue to work as-is. They are not required to be migrated to the new format. New files created after the standard is published must conform from day one.

**Implementation pattern:**
1. Publish the new standard with an explicit effective date.
2. State in the standard document: "Existing files are grandfathered. Migration is optional and incremental."
3. Tools and agents that read these files must handle both old and new formats. They MUST NOT fail on old-format files.
4. Provide a migration script or guide for owners who choose to update existing files.
5. Track adoption over time. After a defined period (e.g., one release cycle), assess whether a mandatory migration makes sense.

**Reader contract:** Any agent that consumes files of this type must:
- Detect which format version the file uses (via metadata annotation or structural heuristic)
- Apply the appropriate reading logic for that version
- Not flag old-format files as errors, only as informational ("pre-standard format detected")

**Exceptions:** A file that is actively used by automated agents AND whose old format creates incorrect behavior (not just incomplete behavior) should be migrated as a priority. Grandfathering applies to files that are simply incomplete by the new standard, not files that are broken.

## Why It Matters

Requiring immediate migration of all existing files creates a flag-day event that blocks the entire initiative until migration is complete. For a knowledge base with hundreds of files, this can take weeks. Meanwhile, the new standard cannot be used. Grandfathering lets the new standard ship immediately and take effect for all new content, while migration proceeds asynchronously at whatever pace is practical.

## Applicability Boundaries

**In scope:** Any content management system, configuration store, or file-based knowledge base where files accumulate over time and are authored by multiple contributors.
**Out of scope:** Binary file formats where version incompatibility causes runtime failures; database schema migrations where old records cause query errors.

## Rationale

Grandfathering is a universal backward compatibility strategy. It appears in regulatory policy, software versioning (semantic versioning's major version promise), and API evolution. The principle — do not break what works, require compliance only for new instances — applies to any system that accumulates artifacts over time.

## Decay Tracking

**Last validated:** 2026-03-31
**Confidence:** medium
**Staleness window:** 180 days
**Supersedes:** null
