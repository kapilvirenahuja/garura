---
id: technology/backend-java-spring
title: "Java/Kotlin + Spring Boot: enterprise-grade backend"
conditions:
  surface: backend-api
  stack: java-kotlin-spring
  domain: enterprise-or-regulated
  team-size: 5-500
  stage: growth-or-scale
evolve_when: []
provenance: "documented (recovered from the prior KB into the v1 KB under #434)"
---

# Java/Kotlin + Spring Boot: enterprise-grade backend

## Topic
The backend choice for enterprise-grade systems: dependency injection, a
comprehensive ecosystem, and battle-tested patterns on a JVM proven at massive
scale.

## Conditions

### When to choose
The org has Java/Kotlin expertise; the product is enterprise-grade with complex
business logic; the team values mature patterns (DI, AOP, declarative
transactions); or you are in a heavily regulated industry (BFSI, healthcare,
government, enterprise SaaS) where the ecosystem's maturity and the large talent
pool matter. The JVM is proven at very large scale.

### When to avoid
Small teams building an MVP — conventions and boilerplate slow early prototyping;
a JS/Python-first team; serverless-first where cold starts hurt (without GraalVM
native); or a simple API that Node.js would serve in less code. When fast
iteration matters more than structure, this is the wrong tool.

### Scale profile
| Dimension | Sweet spot | Stretch | Break point |
|-----------|-----------|---------|-------------|
| Team size | 5–500 | scales to 1000+ | — (talent pool is deep) |
| Complexity | enterprise apps, complex domains | any | simple CRUD (over-engineered) |
| Throughput | 10K–500K req/s | 500K+ (reactive) | scales very large |

## Recommendation
| Concern | Options | Guidance |
|---------|---------|----------|
| Language | Java 21+; Kotlin | hiring pool vs modern syntax + null safety (full interop) |
| Framework | Spring Boot; Quarkus; Micronaut | ecosystem vs cloud-native fast-startup |
| ORM | Spring Data JPA/Hibernate; jOOQ; MyBatis | standard vs type-safe SQL vs SQL-first |
| Messaging | Spring Kafka; Spring AMQP; Spring Cloud Stream | broker-specific vs abstraction |
| Security | Spring Security | the standard — authn/z, CSRF, sessions |
| Testing | JUnit 5; Mockito; TestContainers; Spring Boot Test | TestContainers for real DBs |

Reference shape: `config/` (beans), feature packages (`auth/`, `orders/` each with
controller, service, repository, model, dto), `shared/` (exception, security,
audit), `resources/` (application.yml, migrations).

## Rationale
The gains: a comprehensive ecosystem (security, messaging, data, cloud), 20+ years
of proven scale, best-in-class IDE/profiling/debugging support, and the largest
enterprise talent pool. The costs: a steep learning curve, conservative adoption of
new patterns, higher JVM memory, slow cold starts without GraalVM, expensive senior
developers, and a real "enterprise astronaut" over-engineering risk. Choose it when
the domain complexity and regulatory/scale demands justify the structure — not for
a product still hunting PMF.

## Evolve when
| From | To | Trigger |
|------|----|---------|
| Spring Boot monolith | Spring Cloud microservices | scale / team split — discovery, config server, gateway |
| Spring Boot | GraalVM native | serverless / container cold-start — native image, startup < 100ms |
| Java | Kotlin | want modern syntax — gradual, coexists in one project |
| Spring Boot | Quarkus / Micronaut | cloud-native, faster startup — for new services |

## Provenance
documented — recovered from the prior KB (`arch/stacks/backend-java-spring.md`)
and reshaped into the v1 template under #434.
