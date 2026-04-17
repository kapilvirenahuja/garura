## Play Review: plan-roadmap

| Check | Status | Details |
|-------|--------|---------|
| G1 Constraint Coverage | GAP | `C9` is not covered by a category-appropriate mechanism. Step 6 `SE-10` only checks that epic refs in the approved brief appear in `roadmap.yaml`; it does not verify verbatim transcription of epic intent, constraints, success scenarios, and failure conditions from the approved brief into the final roadmap. |
| G2 Failure Condition Coverage | GAP | `F7` is not effectively covered. `SE-10` checks timeline alignment only, so roadmap IDD content could be regenerated or paraphrased and still pass. |
| G3 Scenario Coverage | PASS | `S1`-`S10` are covered by `SCE-1`-`SCE-9` (including `SCE-5a`/`SCE-5b`). |
| G4 Skill Existence | PASS | Referenced skills exist: `scope-roadmap-epics`, `assess-feasibility`, `draft-roadmap-brief`, `validate-roadmap`, `draft-roadmap`. |
| G5 Agent Existence | PASS | Declared agents exist: `product-strategist`, `tech-designer`, `judge`, `doc-builder`, `repo-orchestrator`. |
| G6 Skill-Agent Alignment | PASS | Play skill assignments align with agent inventories: `product-strategist` owns roadmap skills, `tech-designer` owns `assess-feasibility`, `judge` owns `validate-roadmap`, and `doc-builder` owns brief generation. |
| G7 Contract Schema | GAP | Step `6b-val` omits required `intent_path`, `stm_base`, and `stm` fields. The validation contract currently includes only `mode`, `validation_skill`, `artifact_paths`, and `task_id`. |
| G8 Template References | PASS | Referenced brief/template files exist, including `core/components/memory/standards/templates/roadmap-brief.html`, `brief-common.css`, and play-local checkpoint/approval templates. |
| G9 Intent Hash Drift | PASS | Compiled hash `sha256:4612c079a5bffe4deb71e40187eb4f51045c554235ebb874c70e86d31cd3e85a` matches the current `reference/intent.yaml` SHA-256. |
| G10 Required Sections | PASS | Required compiled sections are present: Frontmatter, Header/Compiled From, Role, Pre-flight, Workflow, Scenario Validation, Pause and Resume, and Compilation Metadata. |

**Summary:** 8/10 PASS, 2 GAPs found

### Notes

- The BRD-fidelity rebake work is present: `C16`, `C17`, `F11`, `F12`, `S10`, `SE-22`, `SE-23`, and `SCE-9` are all compiled into the play.
- Out-of-band drift not scored by G1-G10: the roadmap brief flow still describes tabbed navigation and inline comments, while the current Phoenix brief templates were migrated to sidebar chapters without the comment system.
