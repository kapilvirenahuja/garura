# Amazon Web Services (AWS)

The largest cloud platform — broadest service catalog, deepest enterprise adoption, most mature ecosystem.

**Search patterns:** AWS, Amazon, EC2, Lambda, S3, ECS, EKS, DynamoDB, RDS, CloudFront, API Gateway, SQS, SNS, cloud, infrastructure

## When to Choose

AWS is the default choice for enterprise and scale-oriented products. It has the broadest service catalog (200+ services), the most availability zones globally, and the deepest third-party integration ecosystem. Choose when: the organization already uses AWS, enterprise customers expect AWS compliance certifications (SOC2, HIPAA, FedRAMP on AWS), the product needs services that only AWS offers (DynamoDB, Aurora Serverless, Bedrock for AI), or multi-region global deployment is needed. Heavily regulated industries (BFSI, healthcare, government) often mandate AWS due to compliance certifications. Products needing the widest range of managed services — from compute to AI to IoT — find the most options on AWS.

## When to Avoid

Avoid when the team is small and wants simplicity — AWS's breadth creates decision paralysis. Vercel, Railway, or Render are dramatically simpler for small teams. Avoid when cost predictability matters more than flexibility — AWS pricing is complex and easy to overspend on. Avoid when the team has deep GCP or Azure expertise — cloud skills don't transfer 1:1. Avoid for AI/ML-first products where GCP's Vertex AI or TPU offering is stronger.

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Team size | 5-10000 | — | — (AWS scales to any org) |
| Monthly spend | $100-$1M+ | — | — |
| Global regions | Any (33 regions, 105 AZs) | — | — |
| Compliance needs | SOC2, HIPAA, FedRAMP, PCI-DSS, ISO | — | — |

## Key Components

| Category | Services | Selection Guidance |
|----------|----------|-------------------|
| Compute | EC2, Lambda, ECS, EKS, Fargate, App Runner | Lambda for serverless; ECS/Fargate for containers; EKS for Kubernetes |
| Database | RDS (Postgres/MySQL), Aurora, DynamoDB, ElastiCache | RDS/Aurora for relational; DynamoDB for serverless NoSQL; ElastiCache for Redis |
| Storage | S3, EBS, EFS | S3 for objects; EBS for block; EFS for shared file system |
| Networking | VPC, ALB/NLB, CloudFront, Route 53, API Gateway | CloudFront for CDN; ALB for load balancing; API Gateway for serverless APIs |
| Messaging | SQS, SNS, EventBridge, Kinesis, MSK (Kafka) | SQS for queues; SNS for pub/sub; EventBridge for event routing; MSK for Kafka |
| AI/ML | Bedrock, SageMaker, Comprehend, Rekognition | Bedrock for LLM APIs; SageMaker for custom model training |
| Security | IAM, KMS, WAF, Shield, Secrets Manager, GuardDuty | IAM for access control; KMS for encryption; WAF for web protection |
| Observability | CloudWatch, X-Ray, CloudTrail | CloudWatch for metrics/logs; X-Ray for tracing; CloudTrail for audit |

## Reference Architecture

```
Serverless Web App:
  CloudFront → S3 (static) + API Gateway → Lambda → DynamoDB
  Route 53 for DNS, ACM for TLS, Cognito for auth

Container-based:
  ALB → ECS Fargate → RDS Aurora
  ECR for images, Secrets Manager for config, CloudWatch for monitoring

Microservices:
  API Gateway → EKS (Kubernetes)
  MSK (Kafka) for events, ElastiCache for caching, RDS for persistence
  X-Ray for tracing, CloudWatch for metrics
```

## Evolution Paths

| From | To | Trigger | Approach |
|------|----|---------|----------|
| Vercel/Railway | AWS | Scale, compliance, enterprise requirements | Start with managed services (Fargate, RDS); add complexity as needed |
| EC2 instances | Containers (ECS/EKS) | Operational maturity, scaling | Containerize apps; deploy to ECS Fargate first; EKS if Kubernetes needed |
| Containers | Serverless (Lambda) | Cost optimization for spiky workloads | Move event handlers and low-traffic endpoints to Lambda |
| Single region | Multi-region | Global users, disaster recovery | Active-passive first; active-active for mission-critical |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| Breadth | Service for almost any need | Decision paralysis, complexity |
| Scale | Proven at the largest scale globally | Over-engineering risk for small products |
| Compliance | Most certifications of any cloud | Compliance adds configuration complexity |
| Ecosystem | Largest third-party integration ecosystem | Vendor lock-in with AWS-specific services |
| Pricing | Pay-per-use, Reserved Instances for savings | Complex pricing, easy to overspend |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Use every service | Adopting 50 AWS services for a simple app | Operational nightmare, cost explosion |
| No cost alerts | Running without billing alerts or budgets | Surprise bills from misconfigured services |
| Default VPC everything | Not creating proper VPC architecture | Security exposure, networking issues at scale |
| Ignoring IAM | Over-permissive IAM roles ("admin everywhere") | Security vulnerability |
| Manual infrastructure | Click-ops in console instead of IaC | Non-reproducible, no audit trail |
