# Java/Kotlin + Spring Boot

Enterprise-grade backend framework with dependency injection, comprehensive ecosystem, and battle-tested patterns.

**Search patterns:** Java, Kotlin, Spring Boot, enterprise, JVM, Spring, microservices, dependency injection, Hibernate, enterprise backend

## When to Choose

Spring Boot is the enterprise standard. Choose when: the organization has Java/Kotlin expertise, the product is enterprise-grade with complex business logic, the team values mature patterns (dependency injection, AOP, transaction management), or the product operates in heavily regulated industries where Java's stability and tooling maturity reduce risk. JVM's performance, garbage collection, and tooling ecosystem are proven at massive scale. Kotlin offers modern syntax while retaining full Java interop. Products in BFSI, healthcare, government, and large enterprise SaaS frequently choose Spring Boot for its ecosystem maturity and organizational familiarity.

## When to Avoid

Avoid for small teams building MVPs — Spring Boot's conventions and boilerplate slow down rapid prototyping. Avoid when the team is JavaScript/Python-first. Avoid for serverless-first architectures — JVM cold starts are 2-10 seconds without GraalVM native image. Avoid when the product is a simple API that Node.js or Python could serve in half the code.

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Team size | 5-500 | 500+ | — (Java scales to very large teams) |
| Complexity | Enterprise applications, complex business logic | Any | Simple CRUD (over-engineered) |
| Throughput | 10K-500K req/sec | 500K+ (with reactive) | — |

## Key Components

| Component | Options | Selection Guidance |
|-----------|---------|-------------------|
| Language | Java 21+, Kotlin | Kotlin for modern syntax; Java for maximum hiring pool |
| Framework | Spring Boot, Quarkus, Micronaut | Spring Boot for ecosystem; Quarkus for cloud-native/fast startup |
| ORM | Spring Data JPA / Hibernate, jOOQ, MyBatis | JPA for standard; jOOQ for type-safe SQL; MyBatis for SQL-first |
| Messaging | Spring Kafka, Spring AMQP, Spring Cloud Stream | Spring Cloud Stream for abstraction; native clients for control |
| Security | Spring Security | Standard — comprehensive auth, authz, CSRF, session management |
| Testing | JUnit 5, Mockito, TestContainers, Spring Boot Test | TestContainers for integration tests with real databases |

## Reference Architecture

```
src/main/
├── java/com/example/app/
│   ├── config/               # Spring configuration, beans
│   ├── auth/
│   │   ├── controller/      # REST controllers
│   │   ├── service/         # Business logic
│   │   ├── repository/      # Data access (Spring Data)
│   │   ├── model/           # JPA entities
│   │   └── dto/             # Request/response DTOs
│   ├── orders/
│   │   └── ...
│   └── shared/
│       ├── exception/       # Global exception handling
│       ├── security/        # Security configuration
│       └── audit/           # Audit logging
└── resources/
    ├── application.yml      # Configuration
    └── db/migration/        # Flyway/Liquibase migrations
```

## Evolution Paths

| From | To | Trigger | Approach |
|------|----|---------|----------|
| Spring Boot monolith | Spring Cloud microservices | Scale, team split | Spring Cloud provides service discovery, config server, gateway |
| Spring Boot | Spring Boot + GraalVM | Serverless/container cold start | GraalVM native image reduces startup to < 100ms |
| Java | Kotlin | Modern syntax, null safety | Gradual migration — Kotlin and Java coexist in same project |
| Spring Boot | Quarkus | Cloud-native, faster startup | Consider for new services; Quarkus is Spring-compatible |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| Enterprise ecosystem | Comprehensive — security, messaging, data, cloud | Steep learning curve for the full Spring ecosystem |
| Stability | Proven at scale for 20+ years | Conservative — adopts new patterns slowly |
| Tooling | Best IDE support (IntelliJ), profiling, debugging | JVM memory footprint is higher than Go/Rust |
| Talent pool | Largest enterprise developer pool globally | Senior Spring developers are expensive |
| JVM performance | JIT compilation optimizes hot paths over time | Cold start is slow (2-10s without GraalVM) |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Enterprise astronaut | Over-engineering with patterns (AbstractFactoryBeanFactoryBean) | Unmaintainable, unnecessary abstraction |
| Annotation overload | Business logic hidden in 15 layers of annotations | Hard to trace, debug, and test |
| Ignoring Kotlin | Staying on Java when Kotlin would reduce boilerplate significantly | More code to write and maintain |
| Monolith without modules | Spring Boot app with no package boundaries | Spaghetti — worse than no framework |
| Test without containers | Mocking everything instead of using TestContainers | Tests pass but production fails |
