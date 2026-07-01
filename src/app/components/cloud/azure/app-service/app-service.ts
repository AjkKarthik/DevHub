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
  selector: 'app-azure-app-service',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './app-service.html',
  styleUrl: './app-service.scss'
})
export class AzureAppService {

  quickRef: QuickRefItem[] = [
    { name: 'App Service Plan', type: 'type', desc: 'The compute hosting unit — defines region, OS, tier (Free/Shared/Basic/Standard/Premium/Isolated), and instance count.' },
    { name: 'Web App', type: 'type', desc: 'The application hosted on a plan. Multiple web apps can share one plan and its compute resources.' },
    { name: 'Deployment Slot', type: 'type', desc: 'A live environment (e.g. staging) separate from production. Swap slots for zero-downtime releases; 20% of traffic can be routed to a slot.' },
    { name: 'Kudu', type: 'type', desc: 'The App Service SCM (Source Control Manager) dashboard at <app>.scm.azurewebsites.net — log streaming, console, process explorer, deployment history.' },
    { name: 'SCM_DO_BUILD_DURING_DEPLOYMENT', type: 'syntax', desc: 'App setting that enables Oryx build on the server side — useful for Node.js and Python apps deployed as source code.' },
    { name: 'Always On', type: 'keyword', desc: 'Prevents the app worker process from going idle after 20 minutes of inactivity. Required on Basic tier and above for background jobs.' },
    { name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE', type: 'syntax', desc: 'When set to false in container apps, disables the shared /home storage mount — needed for multi-instance Docker deployments.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'App Service Plans & Tiers',
      points: [
        'An App Service Plan defines the region, OS (Windows or Linux), pricing tier, and number of VM instances. All web apps, API apps, and function apps on a plan share its compute — you pay for the plan, not per app.',
        'Free (F1) and Shared (D1): Multi-tenant, shared compute, no custom domain SSL, limited CPU minutes/day. Only for development and testing.',
        'Basic (B1–B3): Dedicated VMs, custom domain + SSL, manual scaling up to 3 instances. Suitable for low-traffic production apps.',
        'Standard (S1–S3): Adds deployment slots (5), autoscale (up to 10 instances), and Traffic Manager integration. The most common choice for production web apps.',
        'Premium (P1v3–P3v3): Better CPU/RAM than Standard, up to 30 instances, 20 slots, VNET integration. Use when you need higher performance or VNET isolation without Isolated tier cost.',
        'Isolated (I1v2–I3v2): Dedicated App Service Environment (ASE) in your own VNet — highest security, no shared infrastructure. Use for PCI-DSS, HIPAA, and apps that cannot share hardware.',
      ]
    },
    {
      heading: 'Deployment Methods',
      points: [
        'GitHub Actions / Azure DevOps: The recommended CI/CD path. Publish profile or OIDC federated identity authorises the pipeline to deploy. Use az webapp deploy or the AzureWebApp@1 task.',
        'Zip Deploy: az webapp deploy --type zip --src-path app.zip. Fast and simple — Azure extracts the zip and runs the app. Oryx build can run server-side if SCM_DO_BUILD_DURING_DEPLOYMENT=true.',
        'Container Deploy: Point the web app at an Azure Container Registry image. On push, a webhook triggers App Service to pull the new image. Enable CI in the Deployment Center to automate this.',
        'Local Git Deploy: Configure a Git remote at https://<app>.scm.azurewebsites.net/<app>.git. Push code; Kudu runs the build. Suitable for small teams without a CI pipeline.',
        'Run from Package (WEBSITE_RUN_FROM_PACKAGE=1): The app runs directly from a zip without extraction. Eliminates file lock issues and cold start from disk I/O. Recommended for production .NET apps.',
      ]
    },
    {
      heading: 'Deployment Slots & Traffic Splitting',
      points: [
        'Deployment slots are live environments (staging, canary, QA) that share the same App Service Plan. Each slot has its own URL (<app>-staging.azurewebsites.net) and its own app settings.',
        'Slot swap: Azure routes traffic from staging to production atomically — no downtime, no IP change. Warm up: the new production slot is warmed before the swap, so users see no cold-start delay.',
        'Sticky settings: Mark app settings as "slot settings" to prevent them from swapping. DB connection strings and environment flags (ASPNETCORE_ENVIRONMENT=Production) should be slot-sticky.',
        'Traffic routing: Send a percentage of production traffic to a named slot for A/B testing or canary releases. The x-ms-routing-name cookie pins a user to a slot for session consistency.',
        'Swap with preview: First phase routes production traffic to staging. You validate, then complete or roll back. Enables blue/green deployments with a manual approval gate.',
      ]
    },
    {
      heading: 'Scaling, Configuration & Diagnostics',
      points: [
        'Autoscale rules: Define scale-out (+1 instance) when CPU > 70% for 5 minutes, scale-in when < 30%. App Service autoscale acts on the plan — all apps on the plan scale together.',
        'App Settings and Connection Strings: Injected as environment variables at runtime. Override appsettings.json without redeploying. Prefer Key Vault references (secret URIs) over plaintext secrets.',
        'Always On: Keeps the app worker process running even with no traffic. Without it, the process exits after 20 minutes idle and the next request triggers a cold start. Enable on Basic tier and above for background workers.',
        'Health Check: Configure a health check path (/health). App Service monitors it every minute — instances that fail N consecutive checks are removed from the load balancer rotation and replaced.',
        'Diagnostic Logs: Enable Application Logging (App Service logs, stored to blob or filesystem), Detailed Error Messages, and Web Server Logs. Stream live with az webapp log tail for real-time debugging.',
      ]
    },
    {
      heading: 'App Service Plans and the Shared Resource Model',
      points: [
        'An App Service Plan defines the underlying compute (VM size, tier) that one or more Web Apps run on — multiple apps can share a single plan, sharing its compute resources, which is cost-efficient for smaller apps but means one app\'s heavy load can affect others sharing the same plan.',
        'Scaling in App Service can be vertical (moving to a larger plan tier/size) or horizontal (adding more instances of the same plan) — horizontal scaling requires the application to be stateless or use external session storage, since instances are not guaranteed to share in-memory state.',
        'Deployment slots (staging, production) allow zero-downtime deployments via slot swapping — the new version is warmed up in a staging slot before traffic is switched, avoiding the cold-start delay users would otherwise experience on a direct production deployment.',
        'The Free and Shared tiers run on shared infrastructure with other customers\' apps, with no SLA guarantee — production workloads should use Standard tier or above, which provides dedicated compute and an actual availability SLA.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Create & Deploy',
      language: 'bash',
      code: `# Create a resource group, plan, and web app
az group create --name my-rg --location eastus

az appservice plan create \\
  --name my-plan \\
  --resource-group my-rg \\
  --sku S1 \\
  --is-linux

az webapp create \\
  --name my-webapp-unique \\
  --resource-group my-rg \\
  --plan my-plan \\
  --runtime "DOTNETCORE:8.0"

# Deploy a zip package
az webapp deploy \\
  --name my-webapp-unique \\
  --resource-group my-rg \\
  --type zip \\
  --src-path ./publish.zip

# Stream live logs
az webapp log tail \\
  --name my-webapp-unique \\
  --resource-group my-rg`
    },
    {
      label: 'Slots & Swap',
      language: 'bash',
      code: `# Create a staging slot
az webapp deployment slot create \\
  --name my-webapp-unique \\
  --resource-group my-rg \\
  --slot staging

# Deploy to staging slot (not production)
az webapp deploy \\
  --name my-webapp-unique \\
  --resource-group my-rg \\
  --slot staging \\
  --type zip \\
  --src-path ./publish.zip

# Route 20% of production traffic to staging (canary)
az webapp traffic-routing set \\
  --name my-webapp-unique \\
  --resource-group my-rg \\
  --distribution staging=20

# Swap staging to production (zero-downtime)
az webapp deployment slot swap \\
  --name my-webapp-unique \\
  --resource-group my-rg \\
  --slot staging \\
  --target-slot production`
    },
    {
      label: 'App Settings & Autoscale',
      language: 'bash',
      code: `# Set app settings (injected as env vars)
az webapp config appsettings set \\
  --name my-webapp-unique \\
  --resource-group my-rg \\
  --settings ASPNETCORE_ENVIRONMENT=Production \\
             WEBSITE_RUN_FROM_PACKAGE=1

# Key Vault reference for a secret
az webapp config appsettings set \\
  --name my-webapp-unique \\
  --resource-group my-rg \\
  --settings DB_CONNECTION=@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/db-conn/)

# Enable Always On
az webapp config set \\
  --name my-webapp-unique \\
  --resource-group my-rg \\
  --always-on true

# Autoscale the plan (S1+): scale out when CPU > 70%
az monitor autoscale create \\
  --resource-group my-rg \\
  --resource my-plan \\
  --resource-type Microsoft.Web/serverfarms \\
  --name my-autoscale \\
  --min-count 1 --max-count 5 --count 1

az monitor autoscale rule create \\
  --resource-group my-rg \\
  --autoscale-name my-autoscale \\
  --scale out 1 \\
  --condition "CpuPercentage > 70 avg 5m"`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using the Free or Shared tier for production apps',
      wrong: `az appservice plan create --sku F1  # shared multi-tenant, ~60 CPU min/day`,
      right: `az appservice plan create --sku B1  # dedicated VM, custom SSL, no CPU cap`,
      explanation: 'Free/Shared tiers run on shared multi-tenant VMs with CPU minute quotas, no autoscale, and no deployment slots. They are for development only. Use at least Basic for any production traffic, and Standard for autoscale and slots.'
    },
    {
      title: 'Not marking environment-specific settings as slot-sticky',
      wrong: `# Deploy swaps DB_CONNECTION too — staging now points to prod DB!`,
      right: `az webapp config appsettings set --slot-settings DB_CONNECTION=...`,
      explanation: 'By default, ALL app settings swap with the slot. Connection strings and environment flags (ASPNETCORE_ENVIRONMENT) must be marked slot-sticky so they stay bound to the slot, not move with the code.'
    },
    {
      title: 'Leaving Always On disabled for background services',
      wrong: `# Always On: false (default on Free/Shared) — worker exits after 20 min idle`,
      right: `az webapp config set --always-on true`,
      explanation: 'Without Always On, the App Service worker process exits after 20 minutes with no requests. Background jobs and health-check endpoints stop running. Enable Always On on Basic tier and above for any app that must run continuously.'
    },
    {
      title: 'Storing secrets in app settings as plaintext instead of Key Vault references',
      wrong: `--settings DB_PASSWORD=P@ssw0rd123  # visible in portal and deployment logs`,
      right: `--settings DB_PASSWORD=@Microsoft.KeyVault(SecretUri=https://vault.azure.net/secrets/db-pwd/)`,
      explanation: 'Plaintext secrets in app settings are visible to anyone with Contributor access to the App Service. Use Key Vault references — the app resolves the secret at runtime using Managed Identity, and the value never appears in the portal or logs.'
    },
  ];

  challenge: Challenge = {
    title: 'Parse App Service health check response',
    language: 'typescript',
    description: 'App Service health checks call a path (e.g. /health) and expect a 2xx response within 30 seconds. Write a function checkHealth(responses: { statusCode: number; durationMs: number }[]): { healthy: number; unhealthy: number; avgDuration: number } that counts healthy (2xx within 30s) vs unhealthy responses and computes average duration across ALL responses. Round avgDuration to 0 decimal places.',
    hints: [
      'Healthy = statusCode >= 200 && statusCode < 300 && durationMs <= 30000',
      'Count unhealthy = total - healthy',
      'avgDuration = sum of all durations / total count, rounded with Math.round()',
    ],
    starterCode: `export function checkHealth(
  responses: { statusCode: number; durationMs: number }[]
): { healthy: number; unhealthy: number; avgDuration: number } {
  return { healthy: 0, unhealthy: 0, avgDuration: 0 };
}`,
    solution: `export function checkHealth(
  responses: { statusCode: number; durationMs: number }[]
): { healthy: number; unhealthy: number; avgDuration: number } {
  if (responses.length === 0) return { healthy: 0, unhealthy: 0, avgDuration: 0 };
  const healthy = responses.filter(
    r => r.statusCode >= 200 && r.statusCode < 300 && r.durationMs <= 30000
  ).length;
  const avgDuration = Math.round(
    responses.reduce((sum, r) => sum + r.durationMs, 0) / responses.length
  );
  return { healthy, unhealthy: responses.length - healthy, avgDuration };
}

// Test
const results = [
  { statusCode: 200, durationMs: 120 },
  { statusCode: 200, durationMs: 450 },
  { statusCode: 503, durationMs: 31000 },
];
console.log(checkHealth(results));
// { healthy: 2, unhealthy: 1, avgDuration: 10523 }`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is an App Service Plan?',
      options: [
        'A billing account for Azure subscriptions',
        'The compute hosting unit that defines region, OS, tier, and instance count',
        'A GitHub Actions workflow for deployments',
        'A container registry for App Service images'
      ],
      answer: 1,
      explanation: 'The App Service Plan defines the underlying compute (region, OS, VM tier/size, instance count). Multiple web apps can run on the same plan and share its resources. You pay for the plan, not per app.'
    },
    {
      q: 'What does a deployment slot swap do?',
      options: [
        'Deletes the staging slot and creates a new one',
        'Routes all traffic from one slot to another atomically with no downtime',
        'Copies app settings from production to staging',
        'Restarts both slots simultaneously'
      ],
      answer: 1,
      explanation: 'A slot swap atomically moves the staging app to production (and vice versa) without IP changes or downtime. Azure pre-warms the incoming slot before traffic switches, eliminating cold starts for end users.'
    },
    {
      q: 'Which App Service tier is the minimum that supports autoscale and deployment slots?',
      options: ['Free (F1)', 'Basic (B1)', 'Standard (S1)', 'Premium (P1v3)'],
      answer: 2,
      explanation: 'Standard tier (S1+) adds autoscale (up to 10 instances) and deployment slots (5 slots). Basic supports manual scaling and custom SSL but no slots or autoscale. Free and Shared are multi-tenant development tiers only.'
    },
    {
      q: 'What does WEBSITE_RUN_FROM_PACKAGE=1 do?',
      options: [
        'Deploys the app from an npm package registry',
        'Runs the app directly from a zip file without extracting files to disk',
        'Enables the Kudu package manager',
        'Installs dependencies automatically on every restart'
      ],
      answer: 1,
      explanation: 'WEBSITE_RUN_FROM_PACKAGE=1 makes App Service mount a zip file as read-only and run the app directly from it. No file extraction = no disk I/O on startup, no file lock issues, and faster cold starts. Recommended for production .NET apps.'
    },
    {
      q: 'Why should DB connection strings be marked as slot-sticky settings?',
      options: [
        'To make them faster to read at runtime',
        'So they are encrypted automatically',
        'So the staging slot keeps its own DB connection and does not get the production DB on swap',
        'To allow them to be set via the Azure portal only'
      ],
      answer: 2,
      explanation: 'By default, all app settings swap with the slot. If your connection string is not slot-sticky, after a swap staging gets the production DB string — your test environment now points to production data. Mark environment-specific values as slot settings to keep them bound to their slot.'
    },
    {
      q: 'What is the purpose of deployment slots in Azure App Service?',
      options: [
        'Deployment slots allow running multiple versions of the app simultaneously for A/B testing permanently',
        'Deployment slots are staging environments — swap a warmed-up slot to production with zero downtime and instant rollback',
        'Deployment slots are separate App Service Plans at lower cost',
        'Deployment slots only work with static web apps',
      ],
      answer: 1,
      explanation: 'Deployment slots (staging, QA, etc.) are live instances of the app with their own hostnames. Deploy to staging, warm it up (health checks, cache fill), then swap: Azure atomically redirects production traffic to the staging slot. Rollback is another swap. Slot-specific settings (connection strings, app settings marked sticky) stay with their slot across swaps — so staging can point to a staging DB while production points to the prod DB.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do multiple web apps share the same App Service Plan?',
      a: 'All web apps on a plan run on the same set of VM instances. They share CPU, memory, and disk I/O. If one app has a CPU spike, it affects all other apps on the plan. For production apps with different load profiles, put them on separate plans or use Premium v3 with isolated performance guarantees. The benefit of sharing: cost efficiency when apps have complementary usage patterns.'
    },
    {
      q: 'What is the difference between a deployment slot swap and a blue/green deployment?',
      a: 'They are the same concept with different names. A <strong>slot swap</strong> is App Service\'s implementation of <strong>blue/green</strong>: staging (blue) is warmed up, then all production (green) traffic is atomically redirected to the warmed staging slot. The old production becomes the new staging — you can swap back instantly if something goes wrong. The key advantage over a VM deployment is zero downtime and instant rollback.'
    },
    {
      q: 'How do you securely pass a database password to an App Service app?',
      a: 'Use a <strong>Key Vault reference</strong> in the app setting value: <code>@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/db-pwd/)</code>. Enable Managed Identity on the App Service, then grant it <em>Key Vault Secrets User</em> on the vault. At runtime, App Service resolves the reference and injects the actual secret value as the environment variable — the plaintext secret never appears in the portal or deployment history.'
    },
    {
      q: 'When would you use App Service vs Azure Container Apps vs AKS?',
      a: '<strong>App Service</strong>: simplest PaaS for web apps and APIs with language runtimes (.NET, Node, Python, Java, PHP). No container knowledge needed. <strong>Container Apps</strong>: containerised apps with auto-scaling to zero, Dapr integration, and event-driven scaling — serverless Kubernetes without cluster management. <strong>AKS</strong>: full Kubernetes control — when you need custom operators, complex networking (Istio), or workloads that do not fit the PaaS model. App Service is cheapest and simplest; AKS is most powerful and most complex.'
    },
    {
      q: 'How does App Service autoscale work and what are its limits?',
      a: 'Autoscale operates on the App Service Plan — it adds or removes VM instances based on metric thresholds (CPU %, memory, HTTP queue length) or a schedule. Scale-out adds an instance; scale-in removes one. The Standard tier supports up to 10 instances; Premium up to 30. Autoscale has a cool-down period (default 5 minutes) between actions to avoid oscillation. All apps sharing the plan scale together — there is no per-app instance count.'
    },
    {
      q: 'What is the purpose of App Service Deployment Slots?',
      a: 'Deployment slots are live environments (staging, QA) within the same App Service. You deploy to a slot, warm it up, then <strong>swap</strong> it into production with zero downtime. Azure swaps the routing instantly; if issues arise, swap back. Slot settings can be marked as slot-specific (not swapped) or shared.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Azure App Service is a fully managed PaaS for web apps and APIs — choose a plan tier for compute, deploy code or containers, use slots for zero-downtime swaps, and autoscale without managing VMs.',
    mustKnow: [
      'Plan tier determines compute, instances, and features: Free < Basic < Standard (slots + autoscale) < Premium < Isolated (ASE)',
      'Multiple apps share one plan; pay per plan not per app',
      'Deployment slots (Standard+): staging → production swap is atomic, zero-downtime, instantly reversible',
      'Slot-sticky settings stay with the slot on swap — always mark DB connection strings and environment flags as sticky',
      'WEBSITE_RUN_FROM_PACKAGE=1: run from zip without extraction — eliminates file locks, faster cold start',
      'Key Vault references in app settings + Managed Identity = no plaintext secrets in portal or logs',
    ],
    interviewFocus: [
      'Explain the deployment slot swap process and how it achieves zero downtime',
      'Why must connection strings be slot-sticky, and what breaks if they are not?',
      'When would you choose App Service vs Container Apps vs AKS?',
      'How does autoscale work in App Service and what are its plan-level implications?',
    ],
  };
}
