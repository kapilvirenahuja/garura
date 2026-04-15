# Infrastructure as Code (Terraform, Pulumi, CDK)

Defining and provisioning infrastructure through code rather than manual configuration.

**Search patterns:** Terraform, Pulumi, CDK, infrastructure as code, IaC, provisioning, CloudFormation, Ansible, Crossplane, GitOps

## When to Choose

IaC is essential when infrastructure needs to be reproducible, version-controlled, and auditable. Choose when: the product deploys to cloud infrastructure beyond simple PaaS (more than just Vercel or Railway), multiple environments are needed (dev/staging/production), the team wants infrastructure reviewed in PRs like code, or compliance requires audit trails of infrastructure changes. Terraform is the multi-cloud standard. Pulumi uses real programming languages instead of HCL. CDK is AWS-specific but uses TypeScript/Python. Even small teams benefit from IaC once they have more than 5 cloud resources — "click-ops" in the console is non-reproducible and error-prone.

## When to Avoid

Avoid when the deployment target is a managed PaaS that handles infrastructure (Vercel, Railway, Render) — these platforms ARE the infrastructure management. Avoid complex IaC for prototypes — deploy manually, codify later when the architecture stabilizes. Avoid self-hosting Terraform state management unless you have a reason — use Terraform Cloud, Spacelift, or S3 + DynamoDB backend.

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Cloud resources | 10-500 | 500-5000 | > 5000 (module architecture critical) |
| Environments | 2-5 (dev, staging, prod) | 5-20 (per-team, per-region) | > 20 (workspace management strategy needed) |
| Team size (IaC contributors) | 2-20 | 20-100 | > 100 (platform team owns modules, teams consume) |

## Key Components

| Tool | Strengths | Best For |
|------|----------|---------|
| Terraform / OpenTofu | Multi-cloud, largest provider ecosystem, HCL language | Multi-cloud or cloud-agnostic IaC, industry standard |
| Pulumi | Real programming languages (TypeScript, Python, Go, C#), loops, conditions | Teams that prefer code over DSL, complex infrastructure logic |
| AWS CDK | TypeScript/Python for AWS, generates CloudFormation | AWS-only shops, teams that want code over YAML |
| CloudFormation | AWS-native, no extra tooling | Simple AWS deployments, AWS-mandated environments |
| Ansible | Configuration management, imperative, agentless | Server configuration (not provisioning), hybrid cloud |
| Crossplane | Kubernetes-native IaC, GitOps-friendly | K8s-centric teams managing cloud resources as K8s CRDs |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| Reproducibility | Same infrastructure every time, across environments | Learning curve (HCL/Pulumi/CDK), state management |
| Version control | Infrastructure changes reviewed in PRs | Drift detection needed (manual changes vs IaC) |
| Disaster recovery | Recreate entire environment from code | State file is critical — losing it is catastrophic |
| Compliance | Audit trail of every infrastructure change | Policy-as-code adds complexity (Sentinel, OPA) |
| Multi-cloud | Terraform works across all clouds | Lowest common denominator — some cloud-specific features require native tools |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Click-ops | Managing infrastructure through cloud console | Non-reproducible, no audit trail, configuration drift |
| No state backend | Terraform state stored locally | State loss = can't manage existing infrastructure |
| Monolithic state | All infrastructure in one Terraform state file | Slow plans, blast radius of errors is entire infrastructure |
| No modules | Copy-pasting resource blocks instead of reusable modules | Duplication, inconsistency across environments |
| Ignoring drift | Not detecting manual changes that diverge from IaC | IaC doesn't match reality, next apply may destroy resources |
