# Go Backend

Compiled, statically typed language designed for simplicity, concurrency, and high-performance services.

**Search patterns:** Go, Golang, high-performance, concurrency, microservices, goroutines, compiled, API, cloud-native, CLI

## When to Choose

Go is the right choice when performance, simplicity, and operational reliability matter. It compiles to a single binary — no runtime, no dependency management at deploy time. Goroutines handle millions of concurrent connections efficiently. Choose when: the service handles high throughput (payment processing, real-time data, API gateways), the team values explicit error handling and simplicity over framework magic, or the product is infrastructure-adjacent (CLI tools, DevOps tooling, platform services). Go dominates cloud-native tooling (Docker, Kubernetes, Terraform are all Go). Products with high-performance requirements and teams comfortable with a lower-level language benefit most.

## When to Avoid

Avoid when rapid prototyping is the priority — Go's explicit error handling and lack of generics (improving but still limited) slow down initial development compared to Python or TypeScript. Avoid for ML/AI-heavy products — Python's ecosystem is far superior. Avoid when the team is JavaScript/Python-first and there's no Go expertise — the language is simple but the idioms are different. Avoid for simple CRUD APIs where Node.js or Python would be faster to develop.

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Team size | 3-50 | 50-200 | > 200 (manageable — Go scales well with teams) |
| Throughput | 10K-1M req/sec | 1M+ | — (Go handles extreme throughput) |
| Complexity | Microservices, APIs, CLI tools, infra | Full web applications | Complex UI rendering (not Go's strength) |

## Key Components

| Component | Options | Selection Guidance |
|-----------|---------|-------------------|
| HTTP framework | Standard library (net/http), Gin, Echo, Fiber, Chi | net/http for simplicity; Gin for ecosystem; Echo for middleware |
| ORM / DB | GORM, sqlx, Ent, pgx (raw) | sqlx for SQL-first; GORM for ActiveRecord pattern; pgx for performance |
| Validation | go-playground/validator, custom | validator for struct tags; custom for complex rules |
| Testing | Standard library (testing), testify, gomock | Standard library + testify covers most needs |
| Observability | OpenTelemetry, Prometheus, Zap (logging) | OpenTelemetry for tracing; Prometheus for metrics; Zap for structured logging |
| gRPC | grpc-go, Connect (Buf) | grpc-go for standard; Connect for modern HTTP-based gRPC |

## Reference Architecture

```
cmd/
├── api/                      # API server entrypoint
│   └── main.go
├── worker/                   # Background worker entrypoint
│   └── main.go
└── cli/                      # CLI tool entrypoint
    └── main.go
internal/                     # Private application code
├── auth/
│   ├── handler.go           # HTTP handlers
│   ├── service.go           # Business logic
│   ├── repository.go        # Database access
│   └── model.go             # Domain types
├── orders/
│   └── ...
└── platform/                # Shared infrastructure
    ├── database/
    ├── middleware/
    ├── config/
    └── observability/
pkg/                          # Public reusable packages (if any)
go.mod
go.sum
```

## Evolution Paths

| From | To | Trigger | Approach |
|------|----|---------|----------|
| Node.js / Python service | Go service | Performance bottleneck, high throughput needed | Rewrite specific service; keep others in original language |
| Go monolith | Go microservices | Team split, independent scaling | Extract services; Go's small binary size makes deployment easy |
| Go API | Go + Python sidecar | ML/AI features needed | Python service for ML; Go for API and orchestration |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| Performance | Near-C performance, minimal runtime overhead | More verbose code than Python/TypeScript |
| Simplicity | Explicit, no magic, easy to read someone else's code | Boilerplate (error handling, no generics for all patterns) |
| Deployment | Single binary, no runtime dependencies | Cross-compilation needed for different OS/arch |
| Concurrency | Goroutines handle millions of concurrent operations | Need to understand channels, mutexes, race conditions |
| Reliability | Strong typing, compile-time checks, no null pointer (mostly) | Slower to prototype than dynamic languages |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Framework-heavy Go | Using heavy frameworks that fight Go's philosophy | Loses Go's simplicity advantage |
| Ignoring context.Context | Not propagating context for cancellation and timeouts | Resource leaks, uncontrolled goroutines |
| Goroutine leak | Spawning goroutines without proper lifecycle management | Memory leak, resource exhaustion |
| Package spaghetti | Circular imports, unclear package boundaries | Build failures, unmaintainable code |
| Over-engineering interfaces | Interface for every type when only one implementation exists | Unnecessary indirection, harder to navigate |
