# Microsoft Azure

Microsoft's cloud platform — deepest enterprise integration, Active Directory, Office 365, and hybrid cloud.

**Search patterns:** Azure, Microsoft, App Service, AKS, Cosmos DB, Azure Functions, Active Directory, Office 365, hybrid cloud, enterprise

## When to Choose

Azure is the natural choice for Microsoft-centric organizations. Active Directory integration, Office 365 connectivity, and Azure DevOps create a cohesive enterprise development platform. Choose when: the organization runs on Microsoft (Active Directory, Teams, SharePoint, Office 365), enterprise customers require Azure compliance certifications, the product needs hybrid cloud (on-premises + cloud), or .NET is the primary tech stack. Azure's government cloud (Azure Government, Azure DoD) is strong for US government contracts. Cosmos DB provides globally distributed multi-model database capabilities that are unique in the market.

## When to Avoid

Avoid when the team is not in the Microsoft ecosystem — Azure's strongest value is ecosystem integration. Avoid for AI/ML-first products where GCP leads. Avoid when the simplest cloud experience is needed — Azure's portal and service naming are often cited as less intuitive than AWS or GCP. Avoid when cost transparency is critical — Azure's pricing model is complex, similar to AWS.

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Team size | 5-10000 | — | — |
| Microsoft ecosystem depth | Deep (AD, O365, Teams) | Any | Non-Microsoft shops (poor fit) |
| Hybrid cloud needs | Strong (Azure Arc, Azure Stack) | — | Cloud-only (AWS/GCP may be simpler) |

## Key Components

| Category | Services | Selection Guidance |
|----------|----------|-------------------|
| Compute | App Service, Azure Functions, AKS, Container Apps | App Service for web apps; Functions for serverless; Container Apps for simple containers; AKS for K8s |
| Database | Azure SQL, Cosmos DB, Azure Database for PostgreSQL | Azure SQL for SQL Server; Cosmos DB for multi-model global; PostgreSQL for open-source |
| Identity | Azure AD (Entra ID), Azure AD B2C | Azure AD for enterprise; B2C for consumer identity |
| AI | Azure OpenAI Service, Azure AI Studio, Cognitive Services | Azure OpenAI for GPT access; AI Studio for custom models |
| DevOps | Azure DevOps, GitHub (Microsoft-owned) | Azure DevOps for enterprise CI/CD; GitHub for open-source |

## Reference Architecture

```
Enterprise Web App:
  Azure Front Door → App Service → Azure SQL
  Azure AD for auth, Key Vault for secrets, Azure Monitor

Microservices:
  API Management → AKS → Cosmos DB
  Service Bus for messaging, Azure Monitor for observability

Serverless:
  API Management → Azure Functions → Cosmos DB
  Event Grid for events, Azure AD B2C for consumer auth
```

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| Microsoft ecosystem | Seamless AD, O365, Teams integration | Less natural for non-Microsoft stacks |
| Hybrid cloud | Best hybrid story (Azure Arc, Azure Stack) | Hybrid adds operational complexity |
| Enterprise compliance | Strong government, healthcare, financial certifications | Enterprise features add cost |
| Cosmos DB | Globally distributed, multi-model, tunable consistency | Expensive at scale, complex pricing (RU/s) |
| AI | Azure OpenAI provides enterprise GPT access | Tied to OpenAI models primarily |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Azure for non-Microsoft stack | Using Azure without AD, O365, .NET integration | Missing Azure's primary value proposition |
| Cosmos DB without RU planning | Deploying Cosmos without understanding request units | Unexpected costs, throttling |
| Ignoring Container Apps | Using full AKS when Container Apps (simpler) suffices | Unnecessary Kubernetes complexity |
