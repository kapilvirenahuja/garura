# Backend Quality Standards

Quality checks for backend services covering API design, asynchronous error handling, and database/caching patterns.

## Files

- [api-design-validation.md](api-design-validation.md) — RESTful conventions, input validation, rate limiting, pagination, error response format, and API versioning | Patterns: REST, API design, input validation, rate limiting, pagination, Zod, Joi, Pydantic, unvalidated req.body
- [async-error-handling.md](async-error-handling.md) — Unhandled rejections, empty catches, DLQ routing, timeout config, retry backoff, graceful shutdown | Patterns: async, await, promise, empty catch, dead letter queue, retry, backoff, graceful shutdown, timeout
- [database-caching.md](database-caching.md) — N+1 detection, query optimization, migration safety, connection pooling, cache invalidation, stampede prevention | Patterns: N+1, query optimization, indexes, migration safety, connection pooling, cache invalidation, SELECT *, raw SQL
