## Play Review: discover-product

| Check | Status | Details |
|-------|--------|---------|
| G1 Constraint Coverage | GAP | `C16` is only partially covered. `SE-19`, `SE-20`, and `SE-21` verify profile presence, cascade evidence, and user validation, but no step eval verifies that `draft-product-vision` read the canonical profile dimension definitions from LTM before deriving levels. |
| G2 Failure Condition Coverage | GAP | `F14` is not covered by any step eval. The play never verifies that derived profile dimensions/levels match the canonical LTM definitions rather than agent-invented variants. |
| G3 Scenario Coverage | PASS | `S1`-`S9` are covered by `SCE-1`-`SCE-9`. |
| G4 Skill Existence | PASS | Referenced skills exist: `discover-product-opportunity`, `draft-product-vision`, `generate-product-brief`, `validate-product-vision`. |
| G5 Agent Existence | PASS | Declared agents exist: `product-strategist`, `judge`, `doc-builder`, `repo-orchestrator`. |
| G6 Skill-Agent Alignment | PASS | Play skill assignments align with agent inventories: `product-strategist` owns discovery/drafting, `judge` owns validation, and `doc-builder` owns brief generation. |
| G7 Contract Schema | GAP | Step `6` omits required `intent_path`, `stm_base`, and `stm` fields. The validation contract currently includes only `mode`, `validation_skill`, `artifact_paths`, and `task_id`. |
| G8 Template References | PASS | Referenced brief/template files exist, including `core/components/memory/standards/templates/product-brief.html` and `brief-common.css`. |
| G9 Intent Hash Drift | PASS | Compiled hash `sha256:69f9af7c2f00f571eabaf58e8b4487ac107bd775a090475bedab348d825df342` matches the current `reference/intent.yaml` SHA-256. |
| G10 Required Sections | PASS | Required compiled sections are present: Frontmatter, Header/Compiled From, Role, Pre-flight, Workflow, Scenario Validation, Pause and Resume, and Compilation Metadata. |

**Summary:** 8/10 PASS, 2 GAPs found

### Notes

- The BRD-fidelity rebake work is present: `C18`, `C19`, `F15`, `F16`, `S8`, `S9`, `SE-22`, `SE-23`, `SCE-8`, and `SCE-9` are compiled into the play.
- Out-of-band drift not scored by G1-G10: the discovery brief flow still describes tabbed navigation and inline comments, while the current Phoenix brief templates were migrated to sidebar chapters without the comment system.
