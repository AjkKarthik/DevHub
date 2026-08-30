import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-azure-container-apps',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './container-apps.html',
  styleUrl: './container-apps.scss'
})
export class AzureContainerApps {

  quickRef: QuickRefItem[] = [
    { name: 'Container Apps Environment', type: 'type', desc: 'Shared boundary for a group of container apps — shared VNet, Log Analytics workspace, and Dapr configuration.' },
    { name: 'Revision', type: 'type', desc: 'An immutable snapshot of a container app configuration. Traffic can be split across multiple active revisions for canary/A-B deployments.' },
    { name: 'KEDA ScaledObject', type: 'type', desc: 'Built-in event-driven scaling — scales apps to zero based on HTTP traffic, Azure queues, Event Hubs, or custom metrics.' },
    { name: 'Dapr sidecar', type: 'type', desc: 'Optional Distributed Application Runtime sidecar — provides service invocation, pub/sub, state management, and secret access.' },
    { name: 'Ingress', type: 'type', desc: 'HTTP/HTTPS routing for the container app. Set targetPort, traffic weights per revision, custom domains, and TLS certificates.' },
    { name: 'Job', type: 'type', desc: 'A Container Apps Job runs a container to completion on a schedule, on-demand, or triggered by an event — like a Kubernetes Job but serverless.' },
    { name: 'Workload Profile', type: 'type', desc: 'In Dedicated environments, workload profiles specify the VM type (Consumption, D4, E8, GPU) for different app tiers.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Container Apps Environment & Architecture',
      points: [
        'Container Apps runs on a managed Kubernetes layer — you never interact with Kubernetes directly. The unit of deployment is a Container App, not a Pod or Deployment.',
        'A Container Apps Environment is a shared boundary (namespace-like) for a group of apps. Apps in the same environment share a VNet, a Log Analytics workspace, and Dapr configuration. Apps in different environments cannot communicate via Dapr without going through HTTP.',
        'Two environment types: Consumption-only (fully serverless, no dedicated nodes, lowest cost) and Workload Profile (mix of Consumption and dedicated VM profiles — use for consistent performance or GPU workloads).',
        'Each container app runs one or more containers per replica. A revision is an immutable snapshot of the app\'s configuration — every time you update image, env vars, or resources, a new revision is created. Old revisions can keep receiving traffic during canary rollouts.',
        'Container Apps supports both ingress (HTTP/HTTPS) and non-HTTP workloads. Non-HTTP apps (background workers, queue processors) disable ingress and rely on KEDA for event-based scaling.',
      ]
    },
    {
      heading: 'Scaling: KEDA & Scale to Zero',
      points: [
        'Container Apps uses KEDA natively for all scaling. You define scale rules that watch trigger sources — HTTP traffic, Azure Storage Queue depth, Service Bus message count, Event Hub consumer lag, or custom metrics.',
        'HTTP scaling: Container Apps automatically scales based on concurrent HTTP requests per replica. The default is 10 concurrent requests per instance, configurable via --scale-rule-http-concurrency.',
        'Scale to zero: with no traffic or events, replicas drop to 0. The first request after zero-scale triggers a cold start (new container must start). Use min-replicas: 1 for latency-sensitive apps.',
        'Scale rules can combine triggers — an app could scale on both HTTP requests and a queue depth simultaneously, taking the maximum of the two to determine replica count.',
        'Scaling limits: set --min-replicas and --max-replicas. If you never set a scale rule at all, Container Apps silently applies a default HTTP rule capped at just 10 replicas — not 300. The true configurable ceiling for --max-replicas is 1,000 (same for Consumption and Workload Profile environments); 300 is only a historical Azure portal slider cap, not a plan-level default.',
      ]
    },
    {
      heading: 'Dapr Integration',
      points: [
        'Dapr (Distributed Application Runtime) is an optional sidecar that runs alongside your container. Enable with --enable-dapr and set an app ID. Dapr listens on port 3500 (HTTP) or 50001 (gRPC).',
        'Service invocation: call another Dapr-enabled app in the same environment by app ID — GET http://localhost:3500/v1.0/invoke/{appId}/method/{methodName}. Dapr handles service discovery, retries, and mTLS.',
        'Pub/sub: publish to a topic and subscribe in another app using Dapr component bindings (Azure Service Bus, Event Hubs, Redis Streams). Apps are decoupled — publisher does not know about subscribers.',
        'State management: read/write key-value state to a backing store (Azure Redis, Cosmos DB, Azure Table) via the Dapr state API — without SDK for each store. Swap state stores by changing a component YAML.',
        'Secret management: retrieve secrets from Azure Key Vault via the Dapr secrets API — a unified interface regardless of the secret store. The app never needs Key Vault SDK or managed identity configuration itself.',
      ]
    },
    {
      heading: 'Revisions, Traffic Splitting & Jobs',
      points: [
        'Single revision mode: only one active revision at a time. Traffic automatically moves to the latest revision on update. Use for simple apps that do not need canary or A/B testing.',
        'Multiple revision mode: multiple revisions can be active simultaneously. Assign traffic weights (e.g. 90% to stable, 10% to canary). Promote canary to 100% when validated, deactivate the old revision.',
        'Container Apps Jobs are container runs that execute to completion. Types: Manual (triggered via CLI or API), Scheduled (cron), Event-triggered (KEDA-based — fire when a queue has messages).',
        'Jobs are ideal for: database migrations (run before app starts), data processing pipelines, report generation, and any batch workload that must run once and exit rather than serve continuous traffic.',
        'Secret management in Container Apps: define secrets at the app level (referenced from Key Vault or plaintext) and inject them as environment variables or mounted volumes. Updating or deleting a secret never automatically affects an already-running revision — you must either restart the existing revision or deploy a new one; an unversioned Key Vault reference is the one exception, since Container Apps re-fetches it and auto-restarts affected revisions within 30 minutes on its own.',
      ]
    },
    {
      heading: 'Container Apps vs. AKS — Choosing the Right Abstraction Level',
      points: [
        'Container Apps is built on Kubernetes under the hood (KEDA, Dapr, Envoy) but abstracts away cluster management entirely — you deploy containers directly without ever provisioning nodes, managing upgrades, or configuring a control plane, unlike AKS where you own the cluster.',
        'This abstraction is ideal for teams that want Kubernetes-style scaling and microservices patterns (event-driven scaling via KEDA, service-to-service calls via Dapr) without taking on Kubernetes\'s operational complexity — a meaningful middle ground between App Service and full AKS.',
        'The tradeoff for this simplicity is reduced control — you cannot directly access the underlying Kubernetes API or install arbitrary CRDs/Operators the way you could on a self-managed AKS cluster, since the Kubernetes layer is intentionally hidden.',
        'Scale-to-zero support in Container Apps (unlike standard AKS deployments, which typically keep at least one replica running) makes it particularly cost-effective for intermittent or event-driven workloads that do not need to be always-on.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Create & Deploy',
      language: 'bash',
      code: `# Create environment
az containerapp env create \\
  --name my-env \\
  --resource-group my-rg \\
  --location eastus

# Deploy a container app from ACR
az containerapp create \\
  --name my-api \\
  --resource-group my-rg \\
  --environment my-env \\
  --image myregistry.azurecr.io/my-api:latest \\
  --registry-server myregistry.azurecr.io \\
  --registry-identity system \\
  --target-port 8080 \\
  --ingress external \\
  --min-replicas 0 \\
  --max-replicas 10 \\
  --env-vars "ENV=production" \\
             "DB_URL=secretref:db-connection"

# Add a secret (Key Vault reference)
az containerapp secret set \\
  --name my-api \\
  --resource-group my-rg \\
  --secrets "db-connection=keyvaultref:https://myvault.vault.azure.net/secrets/db/"

# Update to new image (creates new revision)
az containerapp update \\
  --name my-api \\
  --resource-group my-rg \\
  --image myregistry.azurecr.io/my-api:v2`
    },
    {
      label: 'Traffic Splitting & KEDA',
      language: 'bash',
      code: `# Enable multiple revision mode for canary
az containerapp revision set-mode \\
  --name my-api \\
  --resource-group my-rg \\
  --mode multiple

# Send 10% traffic to new revision
az containerapp ingress traffic set \\
  --name my-api \\
  --resource-group my-rg \\
  --revision-weight my-api--v1=90 my-api--v2=10

# List revisions and their traffic weights
az containerapp revision list \\
  --name my-api \\
  --resource-group my-rg \\
  --output table

# Add Service Bus queue scale rule (KEDA)
az containerapp update \\
  --name my-worker \\
  --resource-group my-rg \\
  --scale-rule-name sb-rule \\
  --scale-rule-type azure-servicebus \\
  --scale-rule-auth "connection=servicebus-connection" \\
  --scale-rule-metadata "queueName=orders" "messageCount=5" \\
  --min-replicas 0 --max-replicas 20`
    },
    {
      label: 'Dapr & Jobs',
      language: 'bash',
      code: `# Create app with Dapr enabled
az containerapp create \\
  --name order-service \\
  --resource-group my-rg \\
  --environment my-env \\
  --image myregistry.azurecr.io/order-service:latest \\
  --enable-dapr \\
  --dapr-app-id order-service \\
  --dapr-app-port 8080 \\
  --target-port 8080 \\
  --ingress internal

# Dapr service invocation (from within the app):
# GET http://localhost:3500/v1.0/invoke/payment-service/method/charge

# Create a scheduled Job (runs every hour)
az containerapp job create \\
  --name report-job \\
  --resource-group my-rg \\
  --environment my-env \\
  --trigger-type Schedule \\
  --cron-expression "0 * * * *" \\
  --image myregistry.azurecr.io/report-generator:latest \\
  --cpu 0.5 --memory 1Gi \\
  --replica-timeout 1800

# Trigger a manual job execution
az containerapp job start \\
  --name report-job \\
  --resource-group my-rg`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Setting min-replicas 0 for latency-sensitive HTTP APIs',
      wrong: `--min-replicas 0  # scale to zero — first request after idle has cold start`,
      right: `--min-replicas 1  # always at least one warm replica for consistent latency`,
      explanation: 'Scale to zero is great for cost but bad for user-facing APIs. When all replicas are at zero, the first request triggers container startup (cold start) which can take 2–30+ seconds. Set min-replicas 1 for any API that must respond quickly. Use zero only for background workers or batch jobs.'
    },
    {
      title: 'Putting multiple unrelated apps in the same environment expecting isolation',
      wrong: `# Dev, staging, and prod apps in one environment — they share logs and VNet`,
      right: `# Separate environments per lifecycle stage: dev-env, staging-env, prod-env`,
      explanation: 'All apps in a Container Apps Environment share the same Log Analytics workspace, VNet, and Dapr configuration. Mixing environments creates noisy logs and potential cross-contamination. Use separate environments per stage (or per team) and separate resource groups.'
    },
    {
      title: 'Storing secrets as plaintext env vars instead of Container Apps secrets',
      wrong: `--env-vars "DB_PASSWORD=P@ssw0rd!"  # visible in portal and logs`,
      right: `# Define as a secret, then reference: --env-vars "DB_PASSWORD=secretref:db-pwd"`,
      explanation: 'Plaintext values in env-vars appear in the portal, CLI output, and activity logs. Define secrets at the app level (--secrets) and reference them with secretref: in env-vars. For production, use Key Vault references so the value is never stored in Container Apps config at all.'
    },
    {
      title: 'Not using Managed Identity for ACR pull — storing registry credentials instead',
      wrong: `--registry-username myuser --registry-password P@ss  # rotates, leaks`,
      right: `--registry-identity system  # system-assigned MI, no credentials to manage`,
      explanation: 'Username/password registry credentials must be rotated and can be leaked. Grant the container app\'s system-assigned Managed Identity the AcrPull role on the registry and use --registry-identity system — zero credentials, automatic token refresh.'
    },
  ];

  challenge: Challenge = {
    title: 'Parse Container Apps revision traffic weights',
    language: 'typescript',
    description: 'Container Apps can split traffic across multiple revisions. Given an array of revision objects { name: string; weight: number }, write:\n1. validateWeights(revisions): boolean — returns true if all weights sum to exactly 100\n2. getActiveRevision(revisions): string — returns the name of the revision with the highest weight (or the last one if tied)',
    hints: [
      'For validateWeights: use reduce() to sum all weights, compare to 100',
      'For getActiveRevision: use reduce() to find the revision with the max weight',
      'Handle edge case: empty array should return false / empty string',
    ],
    starterCode: `interface Revision { name: string; weight: number; }

export function validateWeights(revisions: Revision[]): boolean {
  return false;
}

export function getActiveRevision(revisions: Revision[]): string {
  return '';
}`,
    solution: `interface Revision { name: string; weight: number; }

export function validateWeights(revisions: Revision[]): boolean {
  if (revisions.length === 0) return false;
  return revisions.reduce((sum, r) => sum + r.weight, 0) === 100;
}

export function getActiveRevision(revisions: Revision[]): string {
  if (revisions.length === 0) return '';
  return revisions.reduce((max, r) => r.weight > max.weight ? r : max).name;
}

// Tests
const revs = [{ name: 'v1', weight: 90 }, { name: 'v2', weight: 10 }];
console.log(validateWeights(revs)); // true
console.log(getActiveRevision(revs)); // 'v1'
console.log(validateWeights([{ name: 'v1', weight: 50 }])); // false (50 ≠ 100)`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is a Container Apps Environment?',
      options: [
        'A Docker network bridge',
        'A shared boundary for container apps with a common VNet, log workspace, and Dapr configuration',
        'An Azure subscription boundary',
        'A Kubernetes namespace'
      ],
      answer: 1,
      explanation: 'A Container Apps Environment groups related apps that share a VNet, Log Analytics workspace, and Dapr component configuration. Apps in the same environment can communicate via Dapr service invocation using only app IDs. Apps in different environments must go over HTTP.'
    },
    {
      q: 'What does setting min-replicas to 0 enable in Container Apps?',
      options: [
        'Unlimited maximum scaling',
        'Scale to zero — all replicas are removed when idle, the first request triggers a cold start',
        'Automatic Dapr sidecar injection',
        'Free tier pricing regardless of usage'
      ],
      answer: 1,
      explanation: 'min-replicas=0 enables scale-to-zero: when there is no traffic or events, Container Apps removes all replicas and stops billing for compute. The trade-off is a cold start on the next request. Use min-replicas=1 for latency-sensitive APIs.'
    },
    {
      q: 'What is a Container Apps Revision?',
      options: [
        'A backup copy of the app configuration',
        'An immutable snapshot of the app — created on every configuration update, can receive a traffic weight',
        'A Kubernetes ReplicaSet',
        'A deployment slot similar to App Service'
      ],
      answer: 1,
      explanation: 'A revision is an immutable snapshot of a container app\'s configuration (image, env vars, resources). Every update creates a new revision. In multiple-revision mode, you can assign traffic weights across revisions for canary/A-B testing. Old revisions can be kept for instant rollback.'
    },
    {
      q: 'What does the Dapr sidecar provide in Container Apps?',
      options: [
        'Container image scanning',
        'Service invocation, pub/sub messaging, state management, and secret access via a standard local HTTP/gRPC API',
        'Kubernetes RBAC enforcement',
        'Automatic TLS certificate management'
      ],
      answer: 1,
      explanation: 'Dapr runs as a sidecar alongside your container and exposes a local API (localhost:3500) for service-to-service calls, pub/sub, key-value state, and secrets — all backed by swappable components (Redis, Service Bus, Key Vault). Your app calls Dapr locally; Dapr handles the external service integration.'
    },
    {
      q: 'When would you use a Container Apps Job instead of a regular Container App?',
      options: [
        'When you need more than 10 replicas',
        'For workloads that run to completion — database migrations, report generation, batch processing',
        'When you want to disable Dapr',
        'For HTTP APIs that need zero-downtime deployments'
      ],
      answer: 1,
      explanation: 'Container Apps Jobs are designed for run-to-completion workloads: database migrations, scheduled reports, event-triggered batch processing. They exit with a success/failure code after completing their task. Regular container apps run continuously and serve traffic; jobs execute once and stop.'
    },
    {
      q: 'How does Azure Container Apps autoscaling differ from AKS?',
      options: [
        'Container Apps uses VM scale sets; AKS uses KEDA',
        'Container Apps uses KEDA-based autoscaling out of the box; AKS requires manual KEDA setup',
        'Container Apps cannot scale to zero; AKS can',
        'Both use identical autoscaling mechanisms',
      ],
      answer: 1,
      explanation: 'Azure Container Apps integrates KEDA (Kubernetes Event-driven Autoscaling) natively including scale-to-zero. AKS can use KEDA but requires manual installation and configuration.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should you use Container Apps vs AKS?',
      a: '<strong>Container Apps</strong>: you want serverless containers with auto-scale to zero, Dapr integration, KEDA event-driven scaling, and zero Kubernetes cluster management. Good for microservices, APIs, background workers, and jobs. <strong>AKS</strong>: you need full Kubernetes API access, custom operators/CRDs, complex networking (service mesh, CNI plugins), Windows containers, or workloads that need node-level control. Container Apps is managed AKS under the hood — simpler but less configurable.'
    },
    {
      q: 'How does traffic splitting across revisions work?',
      a: 'Switch the app to <strong>multiple revision mode</strong> (<code>az containerapp revision set-mode --mode multiple</code>). Assign weights to active revisions that sum to 100: e.g. revision-v1=90, revision-v2=10. Azure routes incoming requests proportionally. To complete a canary rollout, shift revision-v2 to 100 and deactivate revision-v1. To roll back, instantly shift all traffic back to revision-v1 — the old revision is still running.'
    },
    {
      q: 'How does Container Apps handle secrets and avoid storing them in plaintext?',
      a: 'Define secrets at the app level with <code>az containerapp secret set</code>. Reference them in env vars as <code>secretref:secret-name</code>. For Key Vault integration, use <code>keyvaultref:https://...</code> — the secret value is fetched at runtime from Key Vault and never stored in Container Apps configuration. Enable a system-assigned Managed Identity and grant it Key Vault Secrets User to use Key Vault references.'
    },
    {
      q: 'What is the difference between Consumption and Workload Profile environments?',
      a: '<strong>Consumption-only environments</strong>: fully serverless, no dedicated VMs, pay per vCPU-second and GiB-second used. Apps scale from zero. Lower cost for unpredictable or spiky workloads. <strong>Workload Profile environments</strong>: mix Consumption workload profile (serverless) with Dedicated profiles (D4, E8, GPU VMs). Use for consistent high-throughput apps, GPU inference, or compliance requirements that mandate dedicated compute. Also required for VNet integration in Consumption-only envs is limited.'
    },
    {
      q: 'How do Container Apps Jobs differ from a regular container app with KEDA?',
      a: 'A regular container app with KEDA scales replicas up/down but <em>stays running</em> — replicas process events continuously. A <strong>Job</strong> starts a new container instance per event (or on schedule), runs it to completion, and terminates. Jobs are better for: database migrations (must run exactly once), report generation (one container per report), and batch tasks where you need a completion guarantee and exit code. Regular apps with KEDA are better for persistent workers that poll continuously.'
    },
    {
      q: 'Can two Container Apps in the SAME environment be on completely different internal networks, isolated from each other?',
      a: 'No — all apps deployed into the same Container Apps environment share that environment\'s single virtual network, meaning they can all potentially reach each other over the internal network by default (subject to any ingress restrictions each app sets). If you need network-level isolation between two groups of apps, you must deploy them into SEPARATE environments (each with its own VNet), not just rely on Container Apps-level configuration within one shared environment — this is the main reason dev and prod are typically placed in entirely separate environments rather than the same one with different app-level settings.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Azure Container Apps is serverless Kubernetes — deploy containers without managing clusters, scale to zero with KEDA, split traffic across revisions for canary releases, and use Dapr for service mesh capabilities.',
    mustKnow: [
      'Environment = shared VNet + logs + Dapr config for a group of apps; separate envs per lifecycle stage',
      'Revision = immutable config snapshot; multiple-revision mode enables canary traffic splitting',
      'Scale to zero (min-replicas=0) saves cost but causes cold starts — use min-replicas=1 for latency-sensitive APIs',
      'KEDA built-in: scale on HTTP concurrency, queue depth, Event Hub lag, or custom metrics',
      'Dapr sidecar: service invocation, pub/sub, state, secrets — all via localhost:3500 API',
      'Jobs for run-to-completion workloads (migrations, batch) vs apps for continuous traffic serving',
    ],
    interviewFocus: [
      'When would you choose Container Apps over AKS?',
      'How does revision-based traffic splitting enable canary deployments?',
      'What is Dapr and what problems does it solve in a microservices architecture?',
      'Explain scale-to-zero: when is it appropriate and when is it not?',
    ],
  };
}
