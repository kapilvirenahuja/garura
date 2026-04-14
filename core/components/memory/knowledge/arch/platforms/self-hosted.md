# Self-Hosted Infrastructure

Self-managed servers — VPS, bare metal, on-premises, or co-located. Full control, full responsibility.

**Search patterns:** self-hosted, VPS, bare metal, on-premises, Hetzner, DigitalOcean, Linode, OVH, dedicated server, data sovereignty, co-location

## When to Choose

Self-hosting makes sense when cost control, data sovereignty, or specific hardware requirements outweigh the operational burden. Choose when: cloud costs at scale exceed dedicated hardware costs (typically > $5K/month on cloud), regulatory requirements mandate data location that cloud providers can't satisfy, the workload needs specific hardware (GPU servers for ML training, high-memory instances for databases), or the organization has existing data center infrastructure. Hetzner, OVH, and dedicated server providers offer 5-10x better price/performance than cloud for predictable workloads. Products handling extremely sensitive data where cloud provider access is a concern (government, defense, certain healthcare) may require self-hosting.

## When to Avoid

Avoid when the team lacks system administration expertise — self-hosting means you manage security patches, backups, failover, monitoring, and disaster recovery. Avoid for small teams without dedicated operations staff. Avoid when auto-scaling for unpredictable traffic is essential — self-hosted servers have fixed capacity. Avoid when global distribution is needed — managing servers in 10 regions is dramatically harder than using AWS.

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Team size | 5-50 (with ops expertise) | 50-200 | > 200 (internal platform team needed) |
| Monthly compute spend | > $5K (where dedicated beats cloud) | Any | < $500 (cloud is simpler and often cheaper) |
| Predictability | Steady, predictable workloads | Moderate variability | Highly spiky (auto-scaling needed) |

## Key Components

| Component | Options | Selection Guidance |
|-----------|---------|-------------------|
| VPS providers | Hetzner, DigitalOcean, Linode (Akamai), OVH, Vultr | Hetzner for price/performance in EU; DigitalOcean for simplicity |
| Bare metal | Hetzner Dedicated, OVH Bare Metal, Equinix Metal | Hetzner for cost; Equinix for enterprise |
| OS | Ubuntu LTS, Debian, Rocky Linux, NixOS | Ubuntu for ecosystem; NixOS for reproducible deployments |
| Orchestration | Docker Compose, K3s, Nomad, Kubernetes | Docker Compose for small; K3s for lightweight K8s; Nomad for simplicity |
| Reverse proxy | Caddy, Nginx, Traefik | Caddy for auto-TLS simplicity; Traefik for container orchestration |
| Managed add-ons | Managed databases (PlanetScale, Neon, Supabase), managed Redis (Upstash) | Use managed services for stateful components — self-host stateless compute |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| Cost | 5-10x cheaper per unit of compute at scale | Ops team time, hardware lifecycle management |
| Control | Full control over hardware, network, security | Full responsibility for everything |
| Data sovereignty | Data stays exactly where you put it | Must comply with local regulations yourself |
| Performance | Bare metal performance, no noisy neighbors | No auto-scaling, capacity planning needed |
| Privacy | No cloud provider has access to your data | Must implement all security measures yourself |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Self-hosting without ops | No dedicated operations expertise on team | Security vulnerabilities, downtime, data loss |
| No backup strategy | Self-hosted without automated, tested backups | Catastrophic data loss |
| Ignoring security patches | Not maintaining OS and software updates | Security breach |
| Snowflake servers | Manually configured servers, no automation | Non-reproducible, impossible to recover |
| Self-hosting databases | Running PostgreSQL on bare metal without expertise | Data loss, performance issues — use managed DB even with self-hosted compute |
