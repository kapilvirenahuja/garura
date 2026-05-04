## Agent Audit: judge

| Principle | Status | Finding |
|-----------|--------|---------|
| P1 JSON Contract | PASS | Input contract with stm.input (eval_path, manifest_path, project_root, deploy_url, credentials, artifact_paths) and stm.output (judge_report) is fully documented. Returns enriched JSON contract with status and stm.output.judge_report path. |
| P2 STM Path Handoff | PASS | Reads eval file from eval_path (stm.input), reads artifact_paths from contract, writes judge_report to stm.output.judge_report path. No inline data. |
| P3 Intent Awareness | PASS | intent_path is in the input contract (marked optional, which is correct for judge — evaluation criteria come from the eval file, not intent.yaml). The judge's constraints are encoded in the eval file itself. The optional marking reflects that judge is context-isolated by design; it does not need to read constraints from intent.yaml since its verification criteria are in the encrypted evals. |
| P4 Structured Failure | PASS | Has structured failure protocol with error field, message, domain_assessment, fix_suggestion, and task_id. Error types documented: decryption_failed, eval_execution_error, manifest_corrupt, plaintext_cleanup_failed. |
| P5 No Direct User Interaction | PASS | No AskUserQuestion in agent definition. Returns verdict to orchestrator; does not pause for user input. |
| P6 Output Contract Discipline | PASS | Returns enriched JSON contract with status and stm.output.judge_report. All evaluation results are written to judge_report.yaml — not returned inline. |
| P7 Skill Delegation | PASS | Uses diff-artifacts skill when config.instructions asks for artifact diff or coverage check. Explicit: "invoke the diff-artifacts skill via the Skill tool and return its verdict directly." |
| P8 Recovery and Escalation | PASS | "Max 1 internal retry on transient failures (file I/O, command timeout). After 2 attempts total, return structured failure to orchestrator." |
| P9 Domain Boundaries | PASS | Domain is evaluation only. "MUST NOT: Modify any source code, eval files, or product artifacts. Share eval content with any other agent." Strict isolation rules documented. |
| P10 Task Graph Participation | PASS | "Mark assigned task_id as in_progress on start. Mark task_id as completed on success. Mark task_id as failed on failure — never abandon a task. If additional work is discovered, create new tasks via TaskCreate before returning." |
| P11 Context Sufficiency | EXEMPT | Judge is a pure evaluator operating on eval criteria provided at eval_path and artifact files at contract paths. Evaluation criteria are fully specified in the eval file. No domain knowledge discovery needed — the judge verifies observable artifact state against explicit criteria. Exemption applies: operates on data fully provided in the JSON contract. |

**Result: 11/11 PASS**
