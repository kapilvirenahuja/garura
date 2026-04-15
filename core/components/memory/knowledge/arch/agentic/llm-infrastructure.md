# LLM Infrastructure

Model serving, routing, evaluation, guardrails, and operational patterns for production LLM deployments.

**Search patterns:** LLM, model serving, fine-tuning, inference, guardrails, evaluation, gateway, LLM ops, prompt management, model router, rate limiting, cost optimization

## When to Choose

LLM infrastructure becomes a distinct architectural concern when the product has multiple LLM-powered features, uses multiple models, or serves enough volume that cost/latency optimization matters. At small scale, a single API key to OpenAI suffices. At production scale, you need: model routing (choose the cheapest model that can handle each request), guardrails (prevent harmful outputs), caching (avoid re-generating identical responses), evaluation (measure quality systematically), and observability (track cost, latency, quality per feature). Any product with PP-2 >= 4 (Omni-Channel+) incorporating AI features needs to think about LLM infrastructure as a platform concern, not a per-feature afterthought.

## When to Avoid

If you're calling one LLM API for one feature, you don't need infrastructure — you need an API client. Don't build LLM infrastructure before you have at least 3 LLM-powered features or 1,000+ daily LLM calls. PP-6 = 1-2 (POC/MVP) should use direct API calls and invest in infrastructure when patterns emerge. Don't build a model router before you've established that different tasks actually need different models.

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| LLM calls/day | 1K-100K | 100K-1M | > 1M (custom infrastructure needed) |
| Model count | 2-5 models in rotation | 5-15 | > 15 (routing complexity) |
| Features using LLM | 3-20 | 20-50 | > 50 (prompt management critical) |
| Monthly LLM cost | $100-$10K | $10K-$100K | > $100K (optimization is high priority) |

## Key Components

| Component | Options | Selection Guidance |
|-----------|---------|-------------------|
| LLM Gateway | LiteLLM, Portkey, custom proxy | LiteLLM for multi-model routing; Portkey for managed; custom for control |
| Guardrails | Guardrails AI, NeMo Guardrails, Lakera, custom | Guardrails AI for structural validation; Lakera for security; NeMo for conversational |
| Prompt management | Langfuse, PromptLayer, Humanloop, version-controlled files | Langfuse for open-source; version-controlled for simplicity |
| Evaluation | Langfuse, Braintrust, custom evals | Langfuse for integrated; Braintrust for specialized; custom for domain-specific |
| Caching | Semantic cache (GPTCache), exact cache (Redis), prompt cache (provider-native) | Provider-native prompt caching first; semantic cache for similar queries |
| Observability | Langfuse, Helicone, Phoenix (Arize), OpenTelemetry | Langfuse for comprehensive; Helicone for cost tracking |
| Fine-tuning | OpenAI fine-tuning, Anyscale, Modal, local (LoRA + QLoRA) | OpenAI for simplicity; local LoRA for privacy/cost |

## Reference Architecture

```
Application → LLM Gateway (routing, caching, guardrails)
                  │
                  ├── Input Guardrails (PII detection, prompt injection, toxicity)
                  ├── Cache Check (semantic or exact)
                  ├── Model Router (task → model mapping)
                  │     ├── GPT-4o for complex reasoning
                  │     ├── Claude for long context
                  │     ├── GPT-4o-mini for simple tasks
                  │     └── Local model for privacy-sensitive
                  ├── Output Guardrails (hallucination check, format validation)
                  ├── Logging (prompt, response, latency, cost, tokens)
                  └── Response

src/
├── llm/
│   ├── gateway.ts              # Central LLM access point
│   ├── router.ts               # Task → model routing logic
│   ├── cache.ts                # Semantic + exact caching
│   ├── guardrails/
│   │   ├── input.ts            # PII strip, injection detect, content filter
│   │   └── output.ts          # Format validation, hallucination check, toxicity
│   ├── providers/
│   │   ├── openai.ts
│   │   ├── anthropic.ts
│   │   └── local.ts           # Ollama, vLLM, etc.
│   ├── prompts/
│   │   ├── templates/         # Version-controlled prompt templates
│   │   └── registry.ts        # Prompt versioning and A/B testing
│   └── evaluation/
│       ├── metrics.ts         # Quality, latency, cost metrics
│       └── datasets/          # Golden datasets for regression testing
└── config/
    ├── models.yaml            # Model configs, costs, rate limits
    └── routing-rules.yaml     # Task → model mapping rules
```

**LLM infrastructure rules:**
- Never embed API keys in code — use environment variables or secrets manager
- Log every LLM call: prompt (or hash), response, model, tokens, latency, cost
- Set spending alerts and rate limits — LLM costs can spike unexpectedly
- Version control prompts — prompt changes are code changes
- Evaluate before deploying prompt changes — golden datasets prevent regression
- Cache aggressively — many queries are repeated or semantically equivalent
- Route to the cheapest model that produces acceptable quality per task

## Evolution Paths

| From | To | Trigger | Approach |
|------|----|---------|----------|
| Direct API calls | LLM Gateway | Multiple features, cost concerns | Centralize through gateway; add caching and routing |
| Single model | Multi-model routing | Cost optimization, capability matching | Add router; map task types to models; measure quality |
| No evaluation | Systematic evaluation | Quality regression noticed | Build golden datasets; run evals on prompt changes |
| API models only | API + local models | Privacy, cost, latency requirements | Add local model (Ollama/vLLM) for suitable tasks; route through gateway |
| No guardrails | Production guardrails | Security/compliance requirements | Add input/output guardrails; PII detection; prompt injection prevention |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| Cost optimization | Route to cheapest capable model; cache repeated queries | Router development, quality measurement per model |
| Quality control | Systematic evaluation, prompt versioning | Evaluation infrastructure, golden dataset maintenance |
| Security | Guardrails prevent harmful outputs, PII leaks | Latency overhead per request, false positive blocking |
| Multi-model | Best model per task, vendor diversification | Integration per provider, routing logic |
| Observability | Understand cost, latency, quality per feature | Logging infrastructure, dashboard development |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| API key in code | Hardcoded provider API keys | Security breach, key rotation nightmare |
| No spending limits | Uncapped LLM API usage | Surprise $50K bill from a bug or attack |
| Prompt in code | Prompts embedded in application code, not managed | Can't A/B test, version, or evaluate prompts independently |
| One model fits all | Using GPT-4 for everything including simple classification | 10-50x cost overhead for tasks a smaller model handles |
| No evaluation | Deploying prompt changes without measuring quality | Silent quality regression |
| Ignoring latency | Adding guardrails, cache checks, routing without measuring latency impact | User experience degrades imperceptibly |
