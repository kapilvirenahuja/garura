# Containerization (Docker, Kubernetes)

Packaging applications in containers for consistent deployment, and orchestrating them at scale.

**Search patterns:** Docker, Kubernetes, K8s, containers, orchestration, Helm, container registry, ECS, GKE, AKS, pod, deployment, microservices

## When to Choose

Docker containers are the standard for packaging applications — consistent environments from development to production, no "works on my machine" problems. Kubernetes is the standard for orchestrating containers at scale — automated scaling, rolling deployments, self-healing, service discovery. Choose Docker when: you need consistent deployment across environments, the product has multiple services, or the team uses different languages/runtimes. Choose Kubernetes when: you're running 5+ services, need automated scaling and self-healing, or the organization standardizes on Kubernetes. For simpler needs, Docker Compose (development/small production) or managed container services (ECS Fargate, Cloud Run, Azure Container Apps) provide container benefits without Kubernetes complexity.

## When to Avoid

Avoid Kubernetes for small teams (< 5 developers) with simple applications — the operational overhead is enormous. Use managed alternatives (ECS Fargate, Cloud Run, Railway) instead. Avoid Docker for serverless-only architectures where the platform handles packaging. Avoid self-managed Kubernetes clusters — use managed services (EKS, GKE, AKS) unless you have dedicated platform engineers.

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Services | 3-50 | 50-500 | > 500 (platform team essential) |
| Team size (for K8s) | 10-200 | 200-1000 | > 1000 (multi-cluster, federation) |
| Pods (K8s) | 10-1000 | 1K-10K | > 10K per cluster (cluster sizing) |

## Key Components

| Component | Options | Selection Guidance |
|-----------|---------|-------------------|
| Container runtime | Docker, containerd, Podman | Docker for development; containerd for K8s production |
| Orchestration | Kubernetes, Docker Compose, Nomad, Docker Swarm | K8s for scale; Compose for development/small prod; Nomad for simplicity |
| Managed K8s | EKS (AWS), GKE (GCP), AKS (Azure) | Match to cloud provider; GKE is most mature |
| Simpler containers | ECS Fargate, Cloud Run, Azure Container Apps | When you want containers without Kubernetes |
| Registry | ECR, GCR, Docker Hub, GitHub Container Registry | Match to cloud provider; GHCR for open-source |
| Package manager | Helm, Kustomize | Helm for templated manifests; Kustomize for overlay-based |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| Consistency | Same environment everywhere | Dockerfile maintenance, image size management |
| Isolation | Process isolation, resource limits | Container networking complexity |
| K8s automation | Auto-scaling, self-healing, rolling updates | Steep learning curve, YAML complexity |
| Portability | Run on any cloud, on-prem, or local | Abstraction hides platform-specific optimizations |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| K8s for everything | Using Kubernetes for a single-service app | Massive operational overhead for no benefit |
| Fat containers | 2GB Docker images with unnecessary dependencies | Slow deploys, security vulnerabilities, wasted storage |
| No health checks | Containers without liveness/readiness probes | K8s can't detect unhealthy pods, no self-healing |
| Root containers | Running processes as root inside containers | Security vulnerability |
| Self-managed K8s | Running your own Kubernetes control plane | Operational nightmare — use managed K8s |
