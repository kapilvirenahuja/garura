# .NET / C# Backend

Microsoft's enterprise-grade platform — ASP.NET Core for APIs, strong Azure integration, cross-platform.

**Search patterns:** .NET, C#, ASP.NET, Azure native, enterprise, Microsoft, Blazor, Entity Framework, MAUI, cross-platform

## When to Choose

.NET is the natural choice for organizations invested in the Microsoft ecosystem. ASP.NET Core is high-performance (consistently tops TechEmpower benchmarks), cross-platform (runs on Linux), and has first-class Azure integration. Choose when: the team has C#/.NET expertise, the organization uses Azure, the product is enterprise-grade with complex business logic, or Windows-centric integration is needed (Active Directory, Office 365, SharePoint). C# as a language is modern and expressive — pattern matching, records, nullable reference types, async/await. Products in enterprise SaaS, government (Microsoft-friendly procurement), and organizations with existing .NET investments benefit most.

## When to Avoid

Avoid when the team doesn't know C# — the .NET ecosystem has its own paradigms. Avoid when Azure is not the deployment target — while .NET runs anywhere, the best DX is on Azure. Avoid for ML/AI-heavy products — Python's ecosystem is far superior. Avoid for startups in the JavaScript ecosystem — full-stack TypeScript is simpler with fewer developers.

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Team size | 3-200 | 200+ | — (.NET scales to very large teams) |
| Throughput | 10K-1M req/sec | 1M+ (ASP.NET is very fast) | — |
| Azure integration | Deep | Any cloud | Non-Microsoft shops (cultural mismatch) |

## Key Components

| Component | Options | Selection Guidance |
|-----------|---------|-------------------|
| Framework | ASP.NET Core Minimal APIs, ASP.NET Core MVC, gRPC | Minimal APIs for modern; MVC for traditional; gRPC for internal services |
| ORM | Entity Framework Core, Dapper, NHibernate | EF Core for standard; Dapper for performance-critical queries |
| Auth | ASP.NET Core Identity, Azure AD, Duende IdentityServer | Identity for self-hosted; Azure AD for enterprise; Duende for OpenID Connect |
| Messaging | MassTransit, NServiceBus, Azure Service Bus SDK | MassTransit for abstraction; NServiceBus for enterprise; Azure SDK for Azure-native |
| Testing | xUnit, NUnit, Moq, FluentAssertions, TestContainers | xUnit is the modern standard; FluentAssertions for readable tests |

## Reference Architecture

```
src/
├── Api/                          # ASP.NET Core project
│   ├── Controllers/             # (MVC) or Endpoints/ (Minimal APIs)
│   ├── Middleware/
│   └── Program.cs               # App setup
├── Application/                  # Business logic (use cases)
│   ├── Commands/
│   ├── Queries/
│   └── Services/
├── Domain/                       # Entities, value objects, domain events
│   ├── Entities/
│   ├── ValueObjects/
│   └── Events/
├── Infrastructure/               # Database, messaging, external services
│   ├── Persistence/
│   ├── Messaging/
│   └── ExternalServices/
└── Tests/
    ├── Unit/
    ├── Integration/
    └── Architecture/             # ArchUnitNET for architecture rule tests
```

## Evolution Paths

| From | To | Trigger | Approach |
|------|----|---------|----------|
| .NET Framework (legacy) | .NET 8+ (modern) | Performance, cross-platform, support | Incremental migration — .NET Upgrade Assistant |
| .NET monolith | .NET microservices | Scale, team split | Dapr or .NET Aspire for service orchestration |
| .NET backend | .NET + Python sidecar | ML/AI features | Python service for ML; .NET for API; gRPC communication |
| ASP.NET MVC | Minimal APIs | Simplify, reduce boilerplate | Migrate endpoint by endpoint; Minimal APIs are lighter |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| Performance | Top-tier (ASP.NET Core is among fastest frameworks benchmarked) | JIT warmup (mitigated by AOT in .NET 8+) |
| Azure integration | First-class Azure SDKs, Azure AD, managed services | Less natural on AWS/GCP |
| Language | C# is modern, expressive, strongly typed | Smaller community than JavaScript/Python |
| Enterprise patterns | Clean Architecture, CQRS, MediatR — well-established | Can be over-engineered for simple apps |
| Tooling | Visual Studio, Rider — excellent debugging, profiling | Visual Studio is Windows-centric (Rider is cross-platform) |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Over-abstracting with MediatR | Using MediatR for every method call, not just cross-cutting | Indirection without benefit, harder to trace |
| Clean Architecture for CRUD | Full onion architecture for simple data access | 10x more code than needed |
| Ignoring Minimal APIs | Using full MVC controllers for simple API endpoints | Unnecessary boilerplate in .NET 6+ |
| Staying on .NET Framework | Not migrating to modern .NET (6+) | Missing performance, features, cross-platform |
| Azure lock-in without awareness | Using Azure-specific APIs without abstraction | Difficult migration to other clouds |
