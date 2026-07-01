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
  selector: 'app-azure-devops-pipelines',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './devops-pipelines.html',
  styleUrl: './devops-pipelines.scss'
})
export class AzureDevopsPipelines {

  quickRef: QuickRefItem[] = [
    { name: 'Azure Repos', type: 'type', desc: 'Git repositories hosted in Azure DevOps. Unlimited private repos, branch policies, pull request workflows, and integration with Pipelines.' },
    { name: 'Azure Pipelines', type: 'type', desc: 'CI/CD service defined in YAML. Stages → Jobs → Steps. Runs on Microsoft-hosted agents or self-hosted agents. Free tier: 1 parallel job, 1800 min/month.' },
    { name: 'Stage', type: 'type', desc: 'A logical phase of the pipeline (Build, Test, Deploy-Staging, Deploy-Prod). Stages run sequentially by default; use dependsOn for parallel execution.' },
    { name: 'Job', type: 'type', desc: 'A unit of work that runs on an agent. Jobs within a stage can run in parallel. Each job gets a fresh agent environment.' },
    { name: 'Service Connection', type: 'type', desc: 'Stored credential that lets a pipeline authenticate to external services (Azure subscription, Docker Hub, GitHub, Kubernetes cluster) without embedding secrets in YAML.' },
    { name: 'Environment', type: 'type', desc: 'Deployment target (staging, production) with optional approval gates, deployment history, and resource associations (Kubernetes namespaces, VMs).' },
    { name: 'Library / Variable Group', type: 'type', desc: 'Shared variables and secrets accessible across pipelines. Can link to Azure Key Vault to fetch secrets at pipeline runtime.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Pipeline YAML Structure',
      points: [
        'An Azure Pipeline is defined in azure-pipelines.yml at the repository root. The hierarchy is: Pipeline → Trigger/PR → Stages → Jobs → Steps. Steps are the atomic units: script (shell command), task (reusable action like DotNetCoreCLI, Docker, AzureWebApp).',
        'Triggers control when the pipeline runs: trigger (branch push — CI), pr (pull request), schedule (cron expression), or manual. The trigger block can filter by branch, path, or tag. resources.pipelines triggers downstream pipelines when an upstream pipeline completes.',
        'Microsoft-hosted agents: pre-provisioned VMs (ubuntu-latest, windows-latest, macos-latest) with common toolchains installed. Each job gets a fresh VM — no state persists between jobs. Self-hosted agents persist tool caches and credentials between runs.',
        'Templates: extract reusable job/step/stage blocks into separate YAML files and reference them with template: path/to/template.yml. Parameterise templates for reuse across environments and applications — the recommended approach for multi-team pipelines.',
        'Pipeline decorators (org-level): inject steps before/after every job in the organisation — enforce security scanning, mandatory tests, or telemetry without requiring each pipeline to opt in.',
      ]
    },
    {
      heading: 'Environments & Approvals',
      points: [
        'An Environment represents a deployment target (staging, production). Associate Kubernetes namespaces or VM resource groups with environments for deployment tracking. Every deployment job that targets an environment is recorded in the Environment\'s deployment history.',
        'Approval gates: add Required Approvals to an environment (portal: Pipelines → Environments → Approvals and checks). When a stage targets an environment with approvals, the pipeline pauses and waits for a named approver to approve (or reject) before proceeding.',
        'Branch policies on environments: only allow deployments from specific branches (e.g. only main → production). Prevents feature branches from deploying directly to production — enforces the branch protection model.',
        'Exclusive lock: only one deployment to an environment at a time. Prevents concurrent deployments to the same target that could cause race conditions or state corruption.',
        'Service hooks: send pipeline events (build completed, deployment started/completed) to external systems (Teams, Slack, ServiceNow) for notification and ITSM ticket creation.',
      ]
    },
    {
      heading: 'Service Connections & Secrets',
      points: [
        'Service Connections store authentication to external services. Types: Azure Resource Manager (deploy to subscriptions — uses a service principal or Workload Identity Federation), Docker Registry, GitHub, Kubernetes, Generic (stores a URL + token). Created in Project Settings → Service Connections.',
        'Workload Identity Federation for Azure service connections: the pipeline presents a short-lived OIDC token that Entra ID exchanges for an Azure access token. No client secret stored in Azure DevOps — eliminates secret rotation for Azure deployments.',
        'Variable Groups: shared variables across pipelines. Link a Variable Group to Azure Key Vault — Azure DevOps fetches secret values at runtime using a service principal. Secrets are masked in logs. Use $(variableName) syntax in pipeline YAML.',
        'Pipeline secrets: define sensitive variables at pipeline/stage level with the "secret" lock icon (portal) or in YAML with value in Library. Secrets are never echoed in logs (Azure DevOps masks them). Avoid printing them explicitly.',
        'YAML variable syntax: $(varName) for pipeline variables. $[variables.varName] for runtime expressions. ${{ parameters.paramName }} for template parameters (compile-time). Using the wrong syntax causes missed substitutions — especially common when mixing template parameters with runtime conditions.',
      ]
    },
    {
      heading: 'Artifacts & Azure Boards',
      points: [
        'Azure Artifacts: private package feeds for NuGet, npm, Maven, Python, and Universal Packages. Pipelines publish packages as build artifacts; downstream pipelines or projects consume them. Upstream sources allow proxying public registries (npmjs.com, nuget.org) through a single Artifacts feed.',
        'Pipeline Artifacts: files published within a pipeline (publish: path, artifact: name) and downloaded in subsequent jobs or stages (download: current). Used for build outputs — compiled binaries, Docker images, test results. Different from Artifacts feeds (which are versioned packages).',
        'Azure Boards: Agile work tracking — Epics → Features → User Stories → Tasks. Boards, Backlogs, Sprints, and queries. Link commits and PRs to work items (AB#1234 in commit message auto-links). Work item status transitions on merge (resolve → close).',
        'Branch strategy: Gitflow (main/develop/feature/release/hotfix) works well in Azure Repos. Trunk-based development (short-lived feature branches, frequent merges to main) is preferred for CI/CD. Branch policies on main: require PR, require at least 1 reviewer, require linked work item, require passing build.',
        'Test Plans: manual test cases, test suites, and exploratory testing sessions. Link automated tests to test plans. Track pass/fail history across pipeline runs. Required for formal UAT in regulated industries.',
      ]
    },
    {
      heading: 'YAML Pipelines vs. Classic Editor — Why YAML Won',
      points: [
        'YAML pipelines are defined as code, checked into the same repository as the application — this means pipeline changes go through the same code review and version history as application code, unlike the Classic (GUI-based) editor where pipeline configuration lives outside source control.',
        'Pipeline-as-code enables branching pipeline behavior naturally — a feature branch can modify its own build/test steps via its own azure-pipelines.yml, something the Classic editor\'s single shared UI configuration cannot easily replicate per-branch.',
        'Templates in YAML pipelines let common stages (a standard build-test-deploy sequence) be defined once and reused across many pipelines, reducing duplication that would otherwise require manually replicating configuration across each pipeline\'s Classic editor setup.',
        'The tradeoff for YAML\'s power and reviewability is a steeper initial learning curve compared to the Classic editor\'s visual drag-and-drop interface — most teams find this tradeoff worthwhile given the long-term maintainability benefits of pipeline-as-code.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Pipeline YAML (CI/CD)',
      language: 'bash',
      code: `# azure-pipelines.yml — .NET API build, test, deploy to App Service
trigger:
  branches:
    include: [main, develop]
  paths:
    exclude: ['*.md', 'docs/**']

variables:
  buildConfiguration: 'Release'
  dotnetVersion: '8.x'

stages:
- stage: Build
  jobs:
  - job: BuildAndTest
    pool:
      vmImage: 'ubuntu-latest'
    steps:
    - task: UseDotNet@2
      inputs: { packageType: sdk, version: '\$(dotnetVersion)' }
    - script: dotnet restore
      displayName: 'Restore packages'
    - script: dotnet build --configuration \$(buildConfiguration) --no-restore
      displayName: 'Build'
    - script: dotnet test --no-build --configuration \$(buildConfiguration) --collect:"XPlat Code Coverage"
      displayName: 'Test'
    - task: PublishTestResults@2
      inputs: { testResultsFormat: VSTest, testResultsFiles: '**/*.trx' }
    - task: DotNetCoreCLI@2
      inputs: { command: publish, publishWebProjects: true, arguments: '--output \$(Build.ArtifactStagingDirectory)' }
    - publish: \$(Build.ArtifactStagingDirectory)
      artifact: webapp

- stage: DeployStaging
  dependsOn: Build
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
  jobs:
  - deployment: DeployToStaging
    environment: staging
    pool: { vmImage: 'ubuntu-latest' }
    strategy:
      runOnce:
        deploy:
          steps:
          - download: current
            artifact: webapp
          - task: AzureWebApp@1
            inputs:
              azureSubscription: 'my-service-connection'
              appName: 'my-app-staging'
              package: '\$(Pipeline.Workspace)/webapp/**/*.zip'`
    },
    {
      label: 'Variable Groups & Key Vault',
      language: 'bash',
      code: `# Create a variable group linked to Key Vault (CLI)
az pipelines variable-group create \\
  --organization https://dev.azure.com/MyOrg \\
  --project MyProject \\
  --name prod-secrets \\
  --authorize true \\
  --variables placeholder=true

# Link to Key Vault (done in portal: Library → Variable Group → Link secrets from Azure Key Vault)
# Then reference in YAML:

# azure-pipelines.yml
variables:
- group: prod-secrets   # imports all Key Vault secrets as variables

stages:
- stage: Deploy
  jobs:
  - job: Deploy
    steps:
    - script: echo "DB password is masked: \$(db-password)"
    # db-password is fetched from Key Vault at runtime, masked in logs

# Workload Identity Federation service connection (no stored secret):
# 1. Go to Project Settings -> Service Connections
# 2. New -> Azure Resource Manager -> Workload Identity federation (automatic)
# 3. Azure DevOps creates a federated credential on the Entra app registration
# 4. Pipelines get short-lived OIDC tokens — no expiry management needed

# Reference the service connection in a task:
- task: AzureCLI@2
  inputs:
    azureSubscription: 'my-wi-connection'   # Workload Identity Federation connection
    scriptType: bash
    scriptLocation: inlineScript
    inlineScript: az group list --output table`
    },
    {
      label: 'Branch Policies & PR Validation',
      language: 'bash',
      code: `# Set branch policy on 'main' — require PR with build validation
az repos policy build create \\
  --organization https://dev.azure.com/MyOrg \\
  --project MyProject \\
  --repository-id <repo-id> \\
  --branch main \\
  --enabled true \\
  --blocking true \\
  --build-definition-id <pipeline-id> \\
  --queue-on-source-update-only true \\
  --manual-queue-only false \\
  --valid-duration 720

# Require minimum 1 reviewer
az repos policy approver-count create \\
  --organization https://dev.azure.com/MyOrg \\
  --project MyProject \\
  --repository-id <repo-id> \\
  --branch main \\
  --enabled true --blocking true \\
  --minimum-approver-count 1 \\
  --creator-vote-counts false \\
  --allow-downvotes false \\
  --reset-on-source-push true

# List all policies on a branch
az repos policy list \\
  --organization https://dev.azure.com/MyOrg \\
  --project MyProject \\
  --branch main \\
  --output table`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Deploying to production without an environment approval gate',
      wrong: `# Deploy stage targets 'production' environment with no approvals configured`,
      right: `# In Azure DevOps portal: Environments → production → Approvals and checks → Add Required approvals`,
      explanation: 'Without an approval gate on the production environment, every successful build on main automatically deploys to production. Add Required Approvals (or Branch Control checks) to the production environment — the pipeline pauses until a named approver (or team) explicitly approves. This is the primary guard against accidental or premature production deployments.'
    },
    {
      title: 'Storing secrets in YAML pipeline variables instead of Library/Key Vault',
      wrong: `variables:
  DB_PASSWORD: "SuperSecret123!"  # Committed to repo — visible to all`,
      right: `variables:
- group: prod-secrets  # Variable group linked to Key Vault`,
      explanation: 'YAML files are committed to the repository — any variable value in YAML is visible to anyone with repo access. Store secrets in a Variable Group (with Key Vault link) or as locked pipeline variables (set via portal, not YAML). Azure DevOps masks secret values in logs, but only if declared as secrets — plain YAML variables are not masked.'
    },
    {
      title: 'Using client secret service connections instead of Workload Identity Federation',
      wrong: `# Service connection type: "Service principal (manual)" — stores client secret, expires in 1-2 years`,
      right: `# Service connection type: "Workload Identity federation (automatic)" — no secret, auto-renewed`,
      explanation: 'Classic service principal connections store a client secret in Azure DevOps that expires in 1–2 years — rotation requires updating both the Entra app registration and the service connection. Workload Identity Federation (OIDC) issues short-lived tokens per pipeline run — no stored secret, no rotation needed. Use WIF for all new Azure service connections.'
    },
    {
      title: 'Not caching dependencies between pipeline runs',
      wrong: `- script: npm install  # Downloads all packages fresh on every run — slow and expensive`,
      right: `- task: Cache@2
  inputs:
    key: 'npm | "$(Agent.OS)" | package-lock.json'
    restoreKeys: 'npm | "$(Agent.OS)"'
    path: $(npm_config_cache)
- script: npm ci`,
      explanation: 'Microsoft-hosted agents start fresh every job — no npm, NuGet, or pip cache. Without caching, every run re-downloads all dependencies (can be 2–5 minutes). The Cache@2 task stores the dependency directory between runs keyed on the lock file hash. Only downloads when the lock file changes — dramatically reduces build time for dependency-heavy projects.'
    },
  ];

  challenge: Challenge = {
    title: 'Pipeline stage dependency resolver',
    language: 'typescript',
    description: 'Azure Pipeline stages use dependsOn to specify execution order. Given a list of stages (each with a name and optional dependsOn array), write getExecutionOrder(stages: Stage[]): string[][] returning batches of stages that can run in parallel — each batch only starts when all stages it depends on have completed.',
    hints: [
      'Stages with no dependsOn (or empty array) are in the first batch',
      'A stage can run when all its dependencies appear in previous batches',
      'Use a set of completed stage names to track what is done',
      'Loop until all stages are placed',
    ],
    starterCode: `interface Stage { name: string; dependsOn?: string[]; }

export function getExecutionOrder(stages: Stage[]): string[][] {
  return [];
}`,
    solution: `interface Stage { name: string; dependsOn?: string[]; }

export function getExecutionOrder(stages: Stage[]): string[][] {
  const batches: string[][] = [];
  const completed = new Set<string>();
  const remaining = [...stages];

  while (remaining.length > 0) {
    const batch = remaining.filter(s =>
      (s.dependsOn ?? []).every(dep => completed.has(dep))
    );
    if (batch.length === 0) throw new Error('Circular or missing dependency');
    batches.push(batch.map(s => s.name));
    batch.forEach(s => { completed.add(s.name); remaining.splice(remaining.indexOf(s), 1); });
  }
  return batches;
}

const stages = [
  { name: 'Build' },
  { name: 'Test', dependsOn: ['Build'] },
  { name: 'DeployStaging', dependsOn: ['Test'] },
  { name: 'IntegrationTest', dependsOn: ['DeployStaging'] },
  { name: 'DeployProd', dependsOn: ['IntegrationTest'] },
];
console.log(getExecutionOrder(stages));
// [['Build'], ['Test'], ['DeployStaging'], ['IntegrationTest'], ['DeployProd']]`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the hierarchy of an Azure Pipeline YAML file from top to bottom?',
      options: [
        'Steps → Jobs → Stages → Pipeline',
        'Pipeline → Stages → Jobs → Steps',
        'Pipeline → Jobs → Stages → Steps',
        'Stages → Pipeline → Steps → Jobs'
      ],
      answer: 1,
      explanation: 'The hierarchy is Pipeline → Stages → Jobs → Steps. A Pipeline has one or more Stages (logical phases like Build, Test, Deploy). Each Stage has one or more Jobs (run on an agent). Each Job has one or more Steps (script commands or Tasks). Jobs within a stage can run in parallel; stages run sequentially unless dependsOn creates a parallel path.'
    },
    {
      q: 'What is a Service Connection in Azure Pipelines?',
      options: [
        'A network link between the pipeline agent and the deployment target',
        'A stored credential that lets a pipeline authenticate to external services without embedding secrets in YAML',
        'A connection string stored in a Variable Group',
        'A pipeline trigger that fires when an external service sends a webhook'
      ],
      answer: 1,
      explanation: 'A Service Connection stores authentication details (service principal, Workload Identity Federation, username/password, token) for an external service. Pipelines reference connections by name (azureSubscription: \'my-connection\') — no credentials in YAML. Types: Azure Resource Manager, Docker Registry, GitHub, Kubernetes, Generic. Credentials are stored encrypted in Azure DevOps.'
    },
    {
      q: 'What is the benefit of Workload Identity Federation for Azure service connections?',
      options: [
        'It allows pipelines to run without an Azure subscription',
        'It eliminates stored client secrets — pipelines get short-lived OIDC tokens exchanged for Azure access tokens',
        'It provides a static IP for the pipeline agent',
        'It enables parallel job execution without additional charges'
      ],
      answer: 1,
      explanation: 'Classic service connections store a client secret that expires in 1–2 years and must be rotated. Workload Identity Federation (OIDC) issues a short-lived OIDC token per pipeline run that Entra ID exchanges for an Azure access token. No secret stored in Azure DevOps, no rotation needed, better security audit trail. Use WIF for all new Azure service connections.'
    },
    {
      q: 'How do environment approvals work in Azure Pipelines?',
      options: [
        'Approvals are configured in the YAML file under the deploy stage',
        'Configure Required Approvals on the environment resource in the portal — the pipeline pauses until an approver acts',
        'Approvals are triggered by creating a work item in Azure Boards',
        'Approvals are automatic based on test pass rates'
      ],
      answer: 1,
      explanation: 'Environment approvals are configured in the Azure DevOps portal (Pipelines → Environments → select env → Approvals and checks → Add), not in YAML. When a deployment job targets an environment with approvals, the pipeline pauses and sends a notification. Named approvers must approve or reject before the deployment proceeds. This keeps production deployment gates outside the control of the pipeline YAML itself.'
    },
    {
      q: 'What does the Cache@2 task do in a pipeline?',
      options: [
        'Caches HTTP responses from external API calls made during the build',
        'Stores and restores build dependency directories between pipeline runs based on a cache key',
        'Caches the compiled binary output for faster deployments',
        'Implements Redis caching for the deployed application'
      ],
      answer: 1,
      explanation: 'Cache@2 stores a directory (e.g., node_modules, NuGet packages, pip cache) keyed on a hash (e.g., package-lock.json content). On the next run, if the key matches, the cached directory is restored — skipping the download step. If the key doesn\'t match (lock file changed), the cache is rebuilt. Dramatically reduces build time for dependency-heavy projects on Microsoft-hosted agents that start fresh each run.'
    },
    {
      q: 'What is the purpose of Azure DevOps Environments with approvals?',
      options: [
        'To automatically roll back failed deployments',
        'To gate deployments so a human must approve before a pipeline continues to a protected environment',
        'To restrict which agents can run pipeline jobs',
        'To set Azure RBAC on resource groups',
      ],
      answer: 1,
      explanation: 'Azure DevOps Environments let you define deployment targets like production with approval gates a designated reviewer must approve before the pipeline deploys to that environment.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use GitHub Actions vs Azure Pipelines?',
      a: '<strong>Azure Pipelines</strong>: deep integration with Azure DevOps (Boards, Repos, Artifacts, Test Plans), enterprise features (environments with approvals, YAML templates across projects, pipeline decorators, audit logs), strong Windows support, and self-hosted agents with pools. <strong>GitHub Actions</strong>: tight GitHub integration (hosted on github.com, marketplace actions ecosystem), simpler setup for open-source projects, OIDC to Azure is equally supported. If your organisation uses Azure DevOps end-to-end, Azure Pipelines is the natural choice. If your code is on GitHub and you don\'t need the full ADO suite, GitHub Actions is simpler and equally capable for CI/CD to Azure.'
    },
    {
      q: 'What are YAML templates in Azure Pipelines and why should I use them?',
      a: 'YAML templates let you extract reusable pipeline logic (stage/job/step blocks) into separate .yml files and reference them with <code>template: path/to/file.yml</code>. Benefits: (1) <strong>DRY</strong>: a build+test step sequence defined once, used by many pipelines. (2) <strong>Standardisation</strong>: platform team publishes approved templates (security scan, compliance check); product teams include them without knowing the internals. (3) <strong>Parameters</strong>: templates accept parameters (<code>${{ parameters.environment }}</code>) for environment-specific customisation. (4) <strong>Central updates</strong>: fix a template once, all pipelines referencing it get the fix on next run. Strongly recommended for multi-team organisations.'
    },
    {
      q: 'What is the difference between pipeline Artifacts and Azure Artifacts?',
      a: '<strong>Pipeline Artifacts</strong>: files produced and consumed within a single pipeline run — built binaries, test results, zipped packages. Published with the <code>publish:</code> shortcut and downloaded with <code>download:</code>. Not versioned, not shareable across pipelines by name (only by pipeline run reference). <strong>Azure Artifacts</strong>: versioned package feeds (NuGet, npm, Maven, Python, Universal Packages). Packages are published by one pipeline, consumed by many pipelines or developers. Versioned (1.0.0, 1.0.1), browseable in the portal, with upstream proxy to public registries. Use Pipeline Artifacts for build-deploy handoffs within a pipeline; use Azure Artifacts for reusable library packages shared across projects.'
    },
    {
      q: 'How do you roll back a failed deployment in Azure Pipelines?',
      a: 'Azure Pipelines supports rollback strategies: (1) <strong>Re-run a previous successful run</strong>: find the last good run in pipeline history, re-run the deploy stage from that run (uses the artifact from that run). (2) <strong>Deployment strategy rollback</strong>: with <code>strategy: runOnce</code>, add an <code>on: failure: steps</code> block that deploys the previous artifact version. (3) <strong>Blue-green or slot swap</strong>: App Service deployment slots — swap staging → production on success; on failure, swap back (production → staging) instantly. (4) <strong>Canary</strong>: route a small % of traffic to new version; on errors, redirect all traffic back to old version. For Kubernetes, use Helm rollback: <code>helm rollback my-release 0</code> to go to the previous chart revision.'
    },
    {
      q: 'What are pipeline conditions and how do you use them?',
      a: 'Conditions control whether a stage, job, or step runs. Built-in conditions: <code>succeeded()</code> (default), <code>failed()</code>, <code>always()</code>, <code>succeededOrFailed()</code>. Custom conditions combine these with variable checks: <code>and(succeeded(), eq(variables[\'Build.SourceBranch\'], \'refs/heads/main\'))</code> — only run on main branch success. Use cases: (1) Deploy to production only on main branch. (2) Run cleanup step even if the build fails. (3) Skip tests if only documentation changed. (4) Conditional variable group: load prod secrets only for prod deployments. Conditions are evaluated at the start of each stage/job/step — they cannot reference variables set later in the same run.'
    },
    {
      q: 'How do Azure DevOps service connections work?',
      a: 'Service connections store credentials (service principal, workload identity, token) that pipelines use to authenticate to external services (Azure, Docker Hub, Kubernetes). They are scoped to a project and can be restricted to specific pipelines. Workload identity federation is the modern approach — no secrets stored, just federated trust.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Azure DevOps combines Repos (Git), Boards (Agile), and Pipelines (YAML CI/CD) — with Environments for approval-gated deployments, Service Connections for secure auth, and Variable Groups for secret management.',
    mustKnow: [
      'Pipeline hierarchy: Pipeline → Stages → Jobs → Steps — jobs within a stage run in parallel by default',
      'Environments with Required Approvals: the only way to gate production deployments in Azure Pipelines',
      'Workload Identity Federation service connections: no stored client secret, OIDC token per run',
      'Variable Groups linked to Key Vault: secrets fetched at runtime, masked in logs, no rotation needed',
      'Cache@2 task: persist node_modules/NuGet packages between runs keyed on lock file hash',
      'YAML templates: reusable stage/job/step blocks — DRY pipelines, enforced organisational standards',
    ],
    interviewFocus: [
      'Explain the difference between a Stage, Job, and Step in Azure Pipelines',
      'How do environment approvals prevent accidental production deployments?',
      'What is Workload Identity Federation and why is it better than a client secret service connection?',
      'How would you roll back a failed production deployment?',
    ],
  };
}
