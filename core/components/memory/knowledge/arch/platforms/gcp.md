# Google Cloud Platform (GCP)

Google's cloud platform — strong in data, AI/ML, Kubernetes, and developer experience.

**Search patterns:** GCP, Google Cloud, Cloud Run, BigQuery, Firebase, GKE, Vertex AI, Pub/Sub, Spanner, cloud, Google

## When to Choose

GCP excels at data-heavy and AI/ML-heavy products. BigQuery for analytics, Vertex AI for ML, and Cloud TPUs for training are best-in-class. Kubernetes was born at Google, and GKE is the most mature managed Kubernetes. Firebase provides a rapid development platform for mobile and web apps. Choose when: the product is data/analytics-heavy, ML/AI is a core feature, the team prefers Kubernetes and wants the best K8s experience, or the product is a mobile app where Firebase provides authentication, database, hosting, and push notifications in one platform. GCP's pricing model (sustained use discounts, per-second billing) is often cheaper than AWS for steady workloads.

## When to Avoid

Avoid when enterprise customers mandate AWS or Azure. Avoid when the broadest service catalog is needed — GCP has fewer services than AWS. Avoid for government/defense where FedRAMP at the highest levels is needed (AWS and Azure lead). Avoid when the organization has deep AWS or Azure expertise. GCP's enterprise support and account management historically lagged AWS, though it's improving.

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Team size | 3-5000 | — | — |
| Data/ML workloads | Any (GCP's strength) | — | — |
| Global regions | 40 regions | — | Fewer regions than AWS in some areas |

## Key Components

| Category | Services | Selection Guidance |
|----------|----------|-------------------|
| Compute | Cloud Run, GKE, Compute Engine, Cloud Functions | Cloud Run for containers (simplest); GKE for Kubernetes; Functions for serverless |
| Database | Cloud SQL, Firestore, Spanner, Bigtable, AlloyDB | Cloud SQL for relational; Firestore for document (Firebase); Spanner for global SQL |
| Storage | Cloud Storage, Persistent Disk | Cloud Storage for objects (S3 equivalent) |
| Data/Analytics | BigQuery, Dataflow, Pub/Sub, Dataproc | BigQuery for analytics (best-in-class); Pub/Sub for messaging |
| AI/ML | Vertex AI, Gemini API, Cloud TPU, AutoML | Vertex AI for ML platform; Gemini API for LLM; TPU for training |
| Firebase | Auth, Firestore, Hosting, Cloud Messaging, Analytics | Firebase for rapid mobile/web development — all-in-one |

## Reference Architecture

```
Mobile/Web App (Firebase):
  Firebase Hosting → Cloud Functions → Firestore
  Firebase Auth, Cloud Messaging for push, Analytics

Container App:
  Cloud Load Balancer → Cloud Run → Cloud SQL
  Cloud Storage for assets, Pub/Sub for events

Data/ML Platform:
  Pub/Sub → Dataflow → BigQuery (analytics)
  Vertex AI for model training → Cloud Run for model serving
```

## Evolution Paths

| From | To | Trigger | Approach |
|------|----|---------|----------|
| Firebase | GCP (full) | Outgrow Firebase limits, need more services | Keep Firebase Auth/Firestore; add Cloud Run, Cloud SQL |
| AWS | GCP | Data/ML focus, Kubernetes preference | Multi-cloud transition; start with data layer (BigQuery) |
| Cloud Run | GKE | Need Kubernetes features (service mesh, advanced networking) | Cloud Run to GKE migration — same container images |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| Data/ML | Best-in-class BigQuery, Vertex AI, TPUs | Fewer general services than AWS |
| Kubernetes | Best managed K8s (GKE) | GKE is opinionated — less flexibility than self-managed |
| Firebase | Rapid mobile/web development | Vendor lock-in, scaling limitations at high volume |
| Pricing | Often cheaper (sustained use discounts, per-second billing) | Fewer pricing options than AWS |
| Developer experience | Clean console, good documentation | Smaller community, fewer Stack Overflow answers |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Firebase for everything | Using Firebase past its scaling limits | Cost explosion, performance issues at scale |
| Ignoring Cloud Run | Over-engineering with GKE when Cloud Run suffices | Unnecessary Kubernetes operational overhead |
| BigQuery for OLTP | Using BigQuery for transactional workloads | Not designed for low-latency point queries |
