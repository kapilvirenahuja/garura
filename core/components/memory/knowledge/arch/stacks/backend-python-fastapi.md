# Python Backend (FastAPI / Django)

Python server-side frameworks — FastAPI for modern async APIs, Django for batteries-included web applications.

**Search patterns:** Python, FastAPI, Django, async, ML integration, API, Pydantic, data science, backend, Flask, ASGI

## When to Choose

Python is the natural backend choice when the product involves ML/AI, data processing, or scientific computing — the ML ecosystem (PyTorch, TensorFlow, scikit-learn, LangChain) is Python-native. FastAPI is modern, async-first, and auto-generates OpenAPI docs from type hints — ideal for API-first products. Django is batteries-included (ORM, admin, auth, sessions) — ideal when you need a full web framework fast. Choose when: the product has ML/AI components, the team is Python-first, or the BRD mentions data processing, analytics, or AI features. Products building agentic features, RAG systems, or ML pipelines naturally land on Python.

## When to Avoid

Avoid for I/O-heavy real-time applications where Node.js or Go perform better. Avoid for large enterprise applications where Java Spring's enterprise patterns or .NET's ecosystem is more suitable. Python's GIL limits true parallelism for CPU-bound work (use multiprocessing or Rust extensions). Avoid when TypeScript full-stack is the goal — language switching between frontend and backend has a cost.

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Team size | 1-30 | 30-100 | > 100 (need strict architecture) |
| Request throughput | 1K-50K req/sec (FastAPI async) | 50K+ | Very high throughput (consider Go) |
| ML integration | Any | Heavy pipeline | — (Python is the standard for ML) |

## Key Components

| Component | Options | Selection Guidance |
|-----------|---------|-------------------|
| Framework | FastAPI (async APIs), Django (full-stack), Flask (minimal) | FastAPI for API-first; Django for admin-heavy; Flask for minimal |
| ORM | SQLAlchemy, Django ORM, Tortoise (async), Prisma (Python) | SQLAlchemy for FastAPI; Django ORM for Django; Tortoise for async |
| Validation | Pydantic (FastAPI built-in), Django forms/serializers, marshmallow | Pydantic for FastAPI — type-safe, auto-docs |
| Task queue | Celery, Dramatiq, Huey, ARQ (async) | Celery for ecosystem; ARQ for async-native |
| ML serving | FastAPI + model loading, Ray Serve, TorchServe, vLLM | FastAPI for simple; Ray Serve for complex; vLLM for LLM inference |
| Testing | pytest, httpx (async test client), factory_boy | pytest is the standard; httpx for async API tests |

## Reference Architecture

```
# FastAPI structure
src/
├── api/
│   ├── routes/
│   │   ├── auth.py
│   │   ├── orders.py
│   │   └── ml.py          # ML model endpoints
│   ├── dependencies.py     # Dependency injection
│   └── middleware.py
├── core/
│   ├── config.py           # Settings from environment
│   ├── security.py         # Auth, JWT, permissions
│   └── database.py         # SQLAlchemy setup
├── models/                  # Database models
├── schemas/                 # Pydantic request/response schemas
├── services/                # Business logic
├── ml/                      # ML models, inference, pipelines
│   ├── models/             # Trained model files / loading
│   ├── pipeline.py         # Inference pipeline
│   └── embeddings.py       # Embedding generation
└── main.py
```

## Evolution Paths

| From | To | Trigger | Approach |
|------|----|---------|----------|
| Flask | FastAPI | Need async, auto-docs, type safety | Migrate endpoints; Pydantic replaces manual validation |
| Django monolith | Django + FastAPI services | API-first needed alongside admin | FastAPI for public API; Django for admin/CMS |
| Python monolith | Python + Go/Rust services | CPU-bound bottleneck | Extract hot path to Go/Rust; keep Python for ML/business logic |
| Jupyter notebooks | FastAPI service | Productionize ML model | Wrap model in FastAPI endpoint; add proper error handling and monitoring |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| ML ecosystem | Best-in-class ML/AI libraries, LangChain, PyTorch | Not the fastest runtime for pure API serving |
| Developer experience | Clean syntax, fast to write, auto-generated docs (FastAPI) | Dynamic typing can hide bugs (use type hints + mypy) |
| Django admin | Free admin interface for data management | Django's opinions may conflict with custom architecture |
| Async support | FastAPI handles thousands of concurrent connections | GIL limits CPU parallelism; need multiprocessing for CPU work |
| Data science bridge | Same language for prototype notebooks and production | Notebook code != production code; needs proper engineering |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Notebook-to-production | Copying Jupyter notebook code directly to production | No error handling, no logging, no testing, memory leaks |
| Sync in async | Blocking synchronous calls inside async endpoints | Event loop blocks, all requests stall |
| No type hints | Skipping type annotations in FastAPI | Loses auto-documentation, validation, IDE support |
| Django for API-only | Using Django's full web framework just for REST APIs | Unnecessary overhead; FastAPI is lighter |
| Global model loading | Loading ML models at import time | Slow startup, memory issues, can't reload models |
