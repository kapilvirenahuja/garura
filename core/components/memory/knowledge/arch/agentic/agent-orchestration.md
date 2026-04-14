# Agent Orchestration

Multi-agent systems with tool use, planning, reasoning loops, and task decomposition.

**Search patterns:** agents, multi-agent, tool use, LangChain, CrewAI, AutoGen, planning, orchestration, reasoning loop, ReAct, function calling, agentic, autonomous

## When to Choose

Agent orchestration is the right pattern when the task requires dynamic decision-making — the system can't just retrieve and generate; it needs to plan, execute, evaluate, and iterate. Choose for: autonomous coding assistants, research agents, customer support with action-taking capability (refund, update account), data analysis that requires multi-step exploration, and any workflow where the LLM decides WHAT to do next (not just generates text). PP-2 = 5 (Agentic/Adaptive) UX directly implies agent orchestration. Products where the AI is a co-worker (not just a search box) need this pattern. Also essential for compound AI systems where multiple specialized agents collaborate on complex tasks.

## When to Avoid

Avoid when the task is well-defined and doesn't require dynamic decision-making. If you can hardcode the steps (retrieve → generate → respond), a RAG pipeline is simpler and more reliable. Agents introduce non-determinism — the same input may produce different execution paths. Avoid for PP-6 = 1 (POC) unless the product IS an agent. Avoid when latency is critical (NFR-3 >= 4) — agent loops involve multiple LLM calls. Avoid when you can't afford unpredictable costs — each agent step is an LLM invocation.

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Agent count | 1-5 specialized agents | 5-15 | > 15 (coordination overhead dominates) |
| Tool count per agent | 3-10 | 10-20 | > 20 (tool selection accuracy degrades) |
| Steps per task | 3-10 | 10-30 | > 30 (cost and latency concerns) |
| Concurrent tasks | 1-10 | 10-100 | > 100 (rate limits, resource management) |

## Key Components

| Component | Options | Selection Guidance |
|-----------|---------|-------------------|
| Agent framework | LangGraph, CrewAI, AutoGen, Semantic Kernel, custom | LangGraph for control; CrewAI for multi-agent; custom for production |
| LLM backbone | GPT-4, Claude, Gemini, open-source (Llama, Mixtral) | GPT-4/Claude for reasoning quality; open-source for cost/privacy |
| Tool interface | OpenAI function calling, Anthropic tool use, MCP | Function calling for simple; MCP for rich tool ecosystem |
| Memory | Conversation buffer, summary memory, vector memory, graph memory | Buffer for short tasks; vector for long-term; graph for relationships |
| Guardrails | Guardrails AI, NeMo Guardrails, custom validators | Essential for production — validate inputs, outputs, and actions |
| Observability | LangSmith, Helicone, Phoenix (Arize), custom logging | LangSmith for LangChain; Helicone for general LLM observability |

## Reference Architecture

```
Single Agent (ReAct):
  User Input → Agent Loop:
    1. Think (LLM reasons about next step)
    2. Act (execute tool / API call)
    3. Observe (process tool output)
    4. Repeat until done or max steps
  → Response

Multi-Agent (Orchestrator + Specialists):
  User Input → Orchestrator Agent
    ├── delegates to → Research Agent (web search, docs)
    ├── delegates to → Code Agent (write, execute, test)
    ├── delegates to → Analysis Agent (data processing)
    └── synthesizes results → Response

src/
├── agents/
│   ├── orchestrator.ts        # Routes tasks to specialists
│   ├── researcher.ts          # Web/doc research
│   ├── analyst.ts             # Data analysis
│   └── executor.ts            # Takes actions (API calls, DB writes)
├── tools/
│   ├── web-search.ts
│   ├── database-query.ts
│   ├── api-client.ts
│   └── file-operations.ts
├── memory/
│   ├── conversation.ts        # Short-term conversation buffer
│   ├── vector-memory.ts       # Long-term semantic memory
│   └── working-memory.ts      # Current task context
├── guardrails/
│   ├── input-validator.ts     # Validate user input
│   ├── output-validator.ts    # Validate agent output
│   └── action-validator.ts    # Validate before executing actions
└── evaluation/
    ├── trajectory-eval.ts     # Did the agent take good steps?
    └── outcome-eval.ts        # Did the agent achieve the goal?
```

**Agent design rules:**
- Agents should have narrow, well-defined responsibilities — not one god-agent
- Always set max step limits — agents without limits can loop forever
- Guardrails on actions are non-negotiable — an agent with database write access needs validation
- Log every step (thought, action, observation) for debugging and evaluation
- Human-in-the-loop for high-stakes actions (financial transactions, data deletion)
- Evaluate both trajectory (did it take good steps?) and outcome (did it get the right answer?)

## Evolution Paths

| From | To | Trigger | Approach |
|------|----|---------|----------|
| RAG pipeline | Single agent | Need dynamic tool selection | Wrap RAG as one tool; add other tools; let agent decide |
| Single agent | Multi-agent | Task complexity exceeds single agent | Specialize by domain; add orchestrator |
| Multi-agent | Hierarchical agents | Scale of sub-tasks grows | Add manager agents that decompose and delegate |
| Custom agents | Agent framework | Reinventing common patterns | Adopt LangGraph or similar for state management, tool integration |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| Flexibility | Handles tasks that can't be hardcoded | Non-deterministic execution paths |
| Capability | Can use tools, take actions, iterate | Multiple LLM calls per task (cost, latency) |
| Autonomy | Reduces human intervention for complex tasks | Requires guardrails to prevent harmful actions |
| Composability | Combine specialized agents for complex workflows | Coordination overhead, debugging complexity |
| User experience | AI that acts, not just informs | User trust requires transparency ("here's what I did and why") |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| God agent | One agent with 50 tools and no specialization | Poor tool selection, confused reasoning |
| Infinite loop | No max step limit, agent retries forever | Cost explosion, user timeout |
| Unguarded actions | Agent can write to database, call APIs without validation | Data corruption, unauthorized actions |
| No observability | Agent reasoning not logged | Impossible to debug, evaluate, or improve |
| Tool overload | Too many tools for the LLM to choose from | Selection accuracy degrades beyond ~15 tools |
| Premature autonomy | Full autonomy before trust is established | Errors at scale before human catches them |
