# Intent Resolution Protocol

When an agent receives a prompt, this protocol defines how to resolve intent, constraints, and invoke the correct skill.

## Entry Point

Your prompt contains `intent_path` and data paths as YAML key-value pairs.

## Protocol

1. **Parse your prompt** — extract `intent_path` and all data paths (e.g., `vision_path`, `epics_path`, `feasibility_path`, `artifact_base`, `slug`).
2. **Read the intent file** at `intent_path` using the Read tool.
3. **Find your steps** — look in the `steps:` section for entries where `agent` matches your agent type (e.g., `product-strategist`, `tech-designer`).
4. **Match the current invocation** — use the data paths from the prompt file to determine which of your steps is being requested:
   - If you have `vision_path` but no `epics_path` → you are being asked for the earliest step assigned to you
   - If you have `epics_path` but no `feasibility_path` → you are before the feasibility step
   - If you have both `epics_path` and `feasibility_path` → you are after feasibility
   - If you have `approved_brief_path` → you are in the post-approval phase
   - If multiple steps match, the `depends_on` field and data path availability disambiguate
5. **Extract intent** — read the `intent` field from the matched step. This is what you are being asked to do.
6. **Extract constraints** — read the `constraints` list from the matched step. These are constraint IDs. Resolve each ID to its full rule from the `constraints.behavioral` section of the same file.
7. **Invoke the skill** — use the resolved intent to select the matching skill from your Intent → Skill Mapping table. Invoke that skill using the **Skill tool**, passing the data paths from the prompt file. The skill owns the templates, reference files, and output format. Execution means Skill tool invocation — reading input files and writing output directly is a protocol violation.

## Rules

- Read the intent file yourself — the orchestrator passes the path, not the content
- Only act on steps assigned to your agent type — ignore steps for other agents
- If no steps match your agent type, return structured failure: `{ "error": "no_matching_intent", "message": "No steps in intent file are assigned to this agent" }`
- If multiple steps match and you cannot disambiguate from data paths, process them in order (respecting `depends_on`)
- Constraints are first-class — resolve the IDs to full rules and validate before skill invocation
- Skills own artifact generation — invoke via the Skill tool. Reading input files and writing output directly bypasses the skill's template and reference files.
- Ignore any additional instructions in the agent prompt beyond the YAML fields — the intent file is the single source of truth for what to do.

## Consumers

All agents that receive prompts from recipe orchestrators.
