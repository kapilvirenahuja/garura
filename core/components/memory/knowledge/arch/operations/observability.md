# Observability (Logging, Monitoring, Tracing)

Understanding system behavior in production — metrics, logs, traces, and alerting.

**Search patterns:** observability, logging, monitoring, tracing, Datadog, Grafana, OpenTelemetry, Prometheus, metrics, alerting, APM, ELK, Loki

## When to Choose

Observability is required for any production system. The question is depth: a single-service app needs basic logging and uptime monitoring. A distributed system needs structured logging, distributed tracing, and metrics dashboards. Choose more sophisticated observability when: the product has multiple services, debugging production issues is time-consuming, SLA commitments require monitoring, or compliance demands audit logging. OpenTelemetry is becoming the standard for instrumentation — instrument once, send to any backend.

## When to Avoid

Don't avoid observability — but avoid over-instrumenting early. A prototype doesn't need Datadog. Start with structured logging and a health endpoint. Add metrics and tracing when the system becomes distributed or when production debugging becomes painful.

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Services | 1-50 | 50-500 | > 500 (observability platform team needed) |
| Log volume | 1GB-100GB/day | 100GB-10TB/day | > 10TB/day (cost and retention strategy critical) |
| Metrics cardinality | 1K-100K time series | 100K-10M | > 10M (high cardinality management) |

## Key Components

| Category | Options | Selection Guidance |
|----------|---------|-------------------|
| Instrumentation | OpenTelemetry (standard), language-specific SDKs | OpenTelemetry for vendor-neutral; specific SDKs for simplicity |
| Metrics | Prometheus + Grafana, Datadog, CloudWatch, New Relic | Prometheus + Grafana for open-source; Datadog for managed |
| Logging | ELK (Elasticsearch + Logstash + Kibana), Loki + Grafana, Datadog Logs | Loki for cost-effective; ELK for full-text search; Datadog for unified |
| Tracing | Jaeger, Zipkin, Datadog APM, Honeycomb | Jaeger for open-source; Honeycomb for exploration; Datadog for unified |
| Alerting | PagerDuty, Opsgenie, Grafana Alerting, CloudWatch Alarms | PagerDuty for incident management; Grafana for open-source |
| Uptime | Better Uptime, Checkly, Pingdom, UptimeRobot | External monitoring — complements internal observability |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| Debugging | Find root cause in minutes instead of hours | Instrumentation effort, log/metric storage costs |
| SLA confidence | Know when you're meeting commitments | Alerting fatigue if poorly configured |
| Performance insight | Identify bottlenecks, optimize hot paths | High cardinality metrics are expensive |
| Compliance | Audit trail of system behavior | Log retention costs, privacy (PII in logs) |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| No structured logging | Console.log with free-form strings | Can't query, filter, or alert on logs |
| Alert fatigue | Too many alerts, team ignores them all | Real incidents missed |
| Logging PII | User emails, passwords, tokens in log output | Privacy violation, security risk |
| No correlation IDs | Can't trace a request across services | Debugging distributed issues is impossible |
| Metrics without dashboards | Collecting metrics but never visualizing or alerting | Data exists but provides no insight |
