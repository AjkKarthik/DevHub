import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';

@Component({
  selector: 'app-devops-azure-pipelines',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './azure-pipelines.html',
  styleUrl: './azure-pipelines.scss'
})
export class DevopsAzurePipelines {

  quickRef: QuickRefItem[] = [
    { name: 'Pipeline',           type: 'keyword', desc: 'YAML file (azure-pipelines.yml) defining CI/CD automation — stages, jobs, steps' },
    { name: 'Stage',              type: 'keyword', desc: 'Top-level grouping: Build, Test, Deploy — stages run sequentially by default' },
    { name: 'Job',                type: 'keyword', desc: 'Unit of work that runs on an agent pool; jobs within a stage run in parallel' },
    { name: 'Step',               type: 'keyword', desc: 'Individual task: `task:` (built-in), `script:` (shell), or `checkout:`' },
    { name: 'Agent Pool',         type: 'keyword', desc: 'Collection of agents (VMs): microsoft-hosted (ubuntu/windows) or self-hosted' },
    { name: 'Service Connection', type: 'keyword', desc: 'Stored credential linking ADO to external services (Azure, Docker Hub, npm)' },
    { name: 'Variable Group',     type: 'keyword', desc: 'Shared set of variables/secrets linkable to pipelines — optionally backed by Azure Key Vault' },
    { name: 'Template',           type: 'keyword', desc: 'Reusable YAML snippet (jobs.yml, steps.yml) — included with `template:` key' },
    { name: 'Environment',        type: 'keyword', desc: 'Named deployment target (staging, prod) with approval gates and deployment history' },
    { name: 'Artifact',           type: 'keyword', desc: 'Pipeline output published with PublishPipelineArtifact and consumed downstream' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Azure DevOps Pipelines Overview',
      points: [
        'Azure Pipelines is Microsoft\'s cloud CI/CD service — part of Azure DevOps (ADO). Supports any language, any cloud, any OS.',
        'Configuration: a YAML file (typically `azure-pipelines.yml`) checked into the repo root. Classic (UI) pipelines exist but YAML is preferred for code review and versioning.',
        'Hierarchy: Pipeline → Stage → Job → Step. Stages model environments (Build / Test / Deploy Prod); jobs model parallelism; steps model individual tasks.',
        'Triggers: `trigger:` for branch/path pushes; `pr:` for pull request validation; `schedules:` for cron; `resources:` for pipeline-to-pipeline triggers.',
        'Pricing: 1 free Microsoft-hosted parallel job (1800 min/month) for private repos; unlimited for public repos.',
      ]
    },
    {
      heading: 'Stages, Jobs & Dependencies',
      points: [
        'Stages run sequentially unless `dependsOn: []` is specified (removes dependency and enables parallel stages).',
        'Jobs within a stage run in parallel unless `dependsOn:` establishes ordering.',
        '`condition:` controls when a stage/job runs: `succeeded()`, `failed()`, `always()`, `and(succeeded(), eq(variables.Branch, main))`.',
        '`strategy: matrix:` on a job creates parallel runs across combinations: OS × Node version × build config.',
        'Deployment jobs (`deployment:`) run against an Environment and record deployment history — use instead of regular jobs for production deploys.',
      ]
    },
    {
      heading: 'Tasks & Scripts',
      points: [
        'Built-in tasks (task: TaskName@version): `NuGetCommand@2`, `DotNetCoreCLI@2`, `NodeTool@0`, `Docker@2`, `PublishPipelineArtifact@1`, `AzureWebApp@1`.',
        '`script:` runs a shell command (Bash on Linux/Mac, cmd on Windows). `bash:` always runs Bash. `pwsh:` runs PowerShell Core.',
        'Task inputs: `inputs:` block under the task. Most tasks have `versionSpec`, `command`, and `workingDirectory` inputs.',
        '`checkout: self` (implicit default) fetches the repo. `checkout: none` skips it — useful in jobs that only consume artifacts.',
        'displayName on every step/job/stage makes pipeline logs readable — required for professional pipelines.',
      ]
    },
    {
      heading: 'Variables & Variable Groups',
      points: [
        'Variables: defined at pipeline/stage/job level with `variables:` map. Reference as `$(variableName)` in YAML.',
        'Runtime variables: `$[variables.name]` — evaluated at runtime (useful for conditional stages using output variables from prior jobs).',
        'Variable Groups: defined in ADO Library, linked to pipelines via `group: MyGroup`. Can sync to Azure Key Vault — secrets appear as masked pipeline variables.',
        'Secret variables: defined in the pipeline UI or variable group. Never appear in logs. Reference as `$(SECRET_NAME)` — pass to script via `env:` block.',
        'Output variables: `echo "##vso[task.setvariable variable=MY_VAR;isOutput=true]value"` — accessible in downstream jobs as `stageDependencies.StageName.JobName.outputs.stepId.MY_VAR`.',
      ]
    },
    {
      heading: 'Templates & Reuse',
      points: [
        'Templates allow extracting steps, jobs, or stages into separate YAML files — the same pattern as functions in code.',
        'Types: `steps` template (reuse a sequence of steps), `jobs` template (reuse a whole job), `stages` template (reuse an entire stage group).',
        'Include: `template: templates/build-steps.yml` at the step/job/stage level. Parameters passed via `parameters:` on both the template and caller.',
        'Templates can live in a separate repo — reference as `template: templates/build.yml@shared-templates` after declaring the resource.',
        'Nested templates are supported (templates can include other templates) — keep nesting to 2–3 levels for readability.',
      ]
    },
    {
      heading: 'Environments & Deployment Gates',
      points: [
        'An Environment represents a deployment target (Dev, Staging, Production). Created in ADO UI or auto-created by the pipeline.',
        'Approval gates: assigned to an Environment. Requires named approvers to approve before deployment jobs targeting that environment run.',
        'Kubernetes resources: add Kubernetes cluster namespaces as resources within an Environment for deployment tracking and rollout visualization.',
        'Deployment strategies on deployment jobs: `runOnce` (default), `rolling` (update a percentage at a time), `canary` (deploy to a fraction, then full).',
        'Every deployment to an Environment is logged with who triggered it, which artifact version deployed, and the result — giving a full deployment audit trail.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Full YAML Pipeline',
      language: 'bash',
      code: `# azure-pipelines.yml — multi-stage CI/CD pipeline

# trigger:
#   branches:
#     include: [main, develop]
#   paths:
#     exclude: ['*.md', 'docs/**']
#
# pr:
#   branches:
#     include: [main]
#
# variables:
#   buildConfiguration: 'Release'
#   vmImage: 'ubuntu-latest'
#
# stages:
# - stage: Build
#   displayName: 'Build & Test'
#   jobs:
#   - job: BuildJob
#     displayName: 'Build application'
#     pool:
#       vmImage: $(vmImage)
#     steps:
#     - checkout: self
#       displayName: 'Checkout source'
#
#     - task: NodeTool@0
#       displayName: 'Use Node.js 20'
#       inputs:
#         versionSpec: '20.x'
#
#     - script: npm ci
#       displayName: 'Install dependencies'
#
#     - script: npm run lint && npm test -- --coverage
#       displayName: 'Lint and test'
#
#     - script: npm run build -- --configuration=production
#       displayName: 'Build production'
#
#     - task: PublishPipelineArtifact@1
#       displayName: 'Publish build artifact'
#       inputs:
#         targetPath: '$(Build.ArtifactStagingDirectory)'
#         artifactName: 'webapp'
#
# - stage: Deploy_Staging
#   displayName: 'Deploy to Staging'
#   dependsOn: Build
#   condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
#   jobs:
#   - deployment: DeployStaging
#     displayName: 'Deploy to Staging Environment'
#     environment: 'staging'
#     strategy:
#       runOnce:
#         deploy:
#           steps:
#           - task: AzureWebApp@1
#             displayName: 'Deploy to App Service'
#             inputs:
#               azureSubscription: 'MyServiceConnection'
#               appName: 'myapp-staging'
#               package: '$(Pipeline.Workspace)/webapp/**/*.zip'`,
    },
    {
      label: 'Templates & Variable Groups',
      language: 'bash',
      code: `# templates/build-steps.yml — reusable build steps template
# parameters:
# - name: nodeVersion
#   type: string
#   default: '20.x'
# - name: buildConfig
#   type: string
#   default: 'Release'
#
# steps:
# - task: NodeTool@0
#   displayName: 'Use Node.js \$\{\{ parameters.nodeVersion }}'
#   inputs:
#     versionSpec: \$\{\{ parameters.nodeVersion }}
#
# - script: npm ci
#   displayName: 'Install deps'
#
# - script: npm run build -- --configuration=\$\{\{ parameters.buildConfig }}
#   displayName: 'Build (\$\{\{ parameters.buildConfig }})'

# --- Main pipeline using the template ---
# stages:
# - stage: Build
#   jobs:
#   - job: BuildRelease
#     pool:
#       vmImage: 'ubuntu-latest'
#     steps:
#     - template: templates/build-steps.yml
#       parameters:
#         nodeVersion: '20.x'
#         buildConfig: 'Release'

# --- Variable Groups (ADO Library) ---
# variables:
# - group: MyApp-Production-Secrets   # linked from ADO Library
# - name: deployTarget
#   value: 'eastus'
#
# Access Key Vault-backed secret in a step:
# - script: echo "Deploying to $(deployTarget)"
#   env:
#     DB_CONN: $(DATABASE_CONNECTION_STRING)  # from variable group / Key Vault`,
    },
    {
      label: 'Output Variables & Conditions',
      language: 'bash',
      code: `# Passing output variables between jobs

# jobs:
# - job: BuildJob
#   steps:
#   - script: |
#       IMAGE_TAG="$(Build.BuildId)-$(Build.SourceVersion)"
#       echo "##vso[task.setvariable variable=imageTag;isOutput=true]$IMAGE_TAG"
#     name: setImageTag
#     displayName: 'Compute image tag'
#
# - job: DeployJob
#   dependsOn: BuildJob
#   variables:
#     # Reference output variable from prior job:
#     IMAGE_TAG: $[dependencies.BuildJob.outputs['setImageTag.imageTag']]
#   steps:
#   - script: echo "Deploying image $(IMAGE_TAG)"
#     displayName: 'Deploy image'

# Conditional stages based on branch:
# - stage: DeployProd
#   condition: and(
#     succeeded(),
#     eq(variables['Build.SourceBranch'], 'refs/heads/main'),
#     ne(variables['Build.Reason'], 'PullRequest')
#   )

# Matrix job — run on multiple OS + Node versions:
# - job: TestMatrix
#   strategy:
#     matrix:
#       Linux_Node18:
#         vmImage: 'ubuntu-latest'
#         nodeVersion: '18.x'
#       Linux_Node20:
#         vmImage: 'ubuntu-latest'
#         nodeVersion: '20.x'
#       Windows_Node20:
#         vmImage: 'windows-latest'
#         nodeVersion: '20.x'
#   pool:
#     vmImage: $(vmImage)
#   steps:
#   - task: NodeTool@0
#     inputs:
#       versionSpec: $(nodeVersion)
#   - script: npm ci && npm test`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using Classic (GUI) pipelines instead of YAML',
      wrong: `# Clicking through the Azure DevOps UI to define pipeline steps
# Pipeline definition stored in ADO database — not version controlled
# Cannot be code-reviewed, branched, or rolled back via git
# Different team members see different UI depending on permissions`,
      right: `# azure-pipelines.yml checked into the repo
# trigger:
#   branches:
#     include: [main]
# stages: ...
# Reviewed in PRs, tracked in git history, portable across environments`,
      explanation: 'Classic UI pipelines are not version-controlled — you cannot review changes, roll back, or branch them. YAML pipelines live in the repo alongside the code they build, get reviewed in PRs, and make infra changes auditable.',
    },
    {
      title: 'Hardcoding secrets in pipeline YAML',
      wrong: `# azure-pipelines.yml
variables:
  API_KEY: 'sk-live-abc123'          # checked into git!
  DB_PASSWORD: 'SuperSecret2024!'    # never do this`,
      right: `# Use Variable Groups with Key Vault integration:
variables:
- group: MyApp-Production-Secrets    # linked to Azure Key Vault
# Or define as secret variables in the pipeline UI (Settings → Variables)
# Access in steps:
- script: deploy.sh
  env:
    API_KEY: $(API_KEY)              # secret — masked in logs`,
      explanation: 'Secrets in YAML files are committed to the repository. Use ADO Variable Groups backed by Azure Key Vault for secrets — they are encrypted, masked in logs, and audited. Secret variables defined in the pipeline UI are also masked.',
    },
    {
      title: 'Deploying from all branches',
      wrong: `# trigger: '*'  — triggers on every branch push
# stage Deploy:
#   no condition — deploys to production from feature branches!
#   developers accidentally overwrite prod`,
      right: `stages:
# - stage: Deploy
#   condition: and(
#     succeeded(),
#     eq(variables['Build.SourceBranch'], 'refs/heads/main')
#   )
#   # Also: use Environment approval gates for prod`,
      explanation: 'Without branch conditions, any push to any branch can trigger a production deploy. Add `condition:` to deploy stages to restrict to main/release branches, and add environment approval gates for an additional human check before prod.',
    },
    {
      title: 'No displayName on steps and jobs',
      wrong: `# steps:
# - script: npm ci
# - script: npm test
# - task: PublishPipelineArtifact@1
# Pipeline log shows: "CmdLine", "CmdLine", "PublishPipelineArtifact"
# Impossible to debug which step failed without reading script content`,
      right: `# steps:
# - script: npm ci
#   displayName: 'Install npm dependencies'
# - script: npm test -- --coverage
#   displayName: 'Run unit tests with coverage'
# - task: PublishPipelineArtifact@1
#   displayName: 'Publish test coverage report'`,
      explanation: 'Without `displayName`, pipeline logs show generic names like "CmdLine" and task identifiers. This makes debugging slow. Add a displayName to every step, job, and stage — it costs nothing and makes the pipeline log self-documenting.',
    },
    {
      title: 'Not using templates for repeated pipeline patterns',
      wrong: `# 5 repos each defining the same 15-step build pipeline inline
# When the lint rule changes, you update 5 YAMLs manually
# Drift accumulates — one repo uses Node 18, another Node 20`,
      right: `# templates/node-build.yml — define once
# Each repo:
# steps:
# - template: node-build.yml@shared-templates
#   parameters:
#     nodeVersion: '20.x'
# Change once in shared-templates → all repos updated on next run`,
      explanation: 'Copy-pasted pipeline YAML across repos is a maintenance trap. Azure Pipelines templates let you define steps/jobs/stages once in a shared repo, referenced by all consuming pipelines. One update propagates everywhere.',
    },
    {
      title: 'Using deployment jobs without an Environment',
      wrong: `# jobs:
# - job: DeployProd   # regular job, not deployment job
#   steps:
#   - task: AzureWebApp@1
# No approval gate possible, no deployment history, no rollback tracking`,
      right: `# jobs:
# - deployment: DeployProd
#   environment: 'production'   # Environment with approval gate configured
#   strategy:
#     runOnce:
#       deploy:
#         steps:
#         - task: AzureWebApp@1`,
      explanation: 'Regular jobs cannot have approval gates and do not record deployment history. `deployment:` jobs targeting an `environment:` get: approval gates (configured per environment), deployment history with artifact version tracking, and rollback capability from the ADO UI.',
    },
  ];

  challenge: Challenge = {
    title: 'Pipeline Stage Dependency Resolver',
    language: 'typescript',
    description: `Build a function that resolves the execution order of Azure DevOps pipeline stages.

Rules:
1. Stages with no \`dependsOn\` run first (in parallel)
2. A stage runs when ALL its \`dependsOn\` stages have completed
3. Detect circular dependencies and return an error
4. Return an ordered array of arrays — each inner array is a group of stages that run in parallel

Example:
- Build (no deps)
- Test (depends on Build)
- DeployStaging (depends on Build)
- DeployProd (depends on Test, DeployStaging)

Result: [['Build'], ['Test', 'DeployStaging'], ['DeployProd']]`,
    hints: [
      'This is topological sort with Kahn\'s algorithm',
      'Build an in-degree map: for each stage, count how many unresolved dependencies it has',
      'Start with stages whose in-degree is 0 (no dependencies)',
      'After processing a wave, decrement in-degree for downstream stages and add any that hit 0 to next wave',
      'If any stages remain with in-degree > 0 after all waves, there is a circular dependency',
    ],
    starterCode: `interface Stage {
  name: string;
  dependsOn?: string[];
}

function resolveStageOrder(stages: Stage[]): string[][] | { error: string } {
  // TODO: implement topological sort
  return [stages.map(s => s.name)];
}`,
    solution: `function resolveStageOrder(stages: Stage[]): string[][] | { error: string } {
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();

  // Init
  for (const s of stages) {
    inDegree.set(s.name, s.dependsOn?.length ?? 0);
    dependents.set(s.name, []);
  }

  // Build reverse graph: for each dependency, track who depends on it
  for (const s of stages) {
    for (const dep of s.dependsOn ?? []) {
      if (!inDegree.has(dep)) {
        return { error: 'Unknown dependency: ' + dep };
      }
      dependents.get(dep)!.push(s.name);
    }
  }

  const result: string[][] = [];
  let wave = [...inDegree.entries()].filter(([, d]) => d === 0).map(([n]) => n);

  while (wave.length > 0) {
    result.push(wave.sort());
    const next: string[] = [];
    for (const name of wave) {
      for (const dep of dependents.get(name)!) {
        const newDeg = inDegree.get(dep)! - 1;
        inDegree.set(dep, newDeg);
        if (newDeg === 0) next.push(dep);
      }
    }
    wave = next;
  }

  const remaining = [...inDegree.values()].filter(d => d > 0);
  if (remaining.length > 0) {
    return { error: 'Circular dependency detected' };
  }

  return result;
}

// Test:
const stages: Stage[] = [
  { name: 'Build' },
  { name: 'Test', dependsOn: ['Build'] },
  { name: 'DeployStaging', dependsOn: ['Build'] },
  { name: 'DeployProd', dependsOn: ['Test', 'DeployStaging'] },
];
console.log(resolveStageOrder(stages));
// [['Build'], ['DeployStaging', 'Test'], ['DeployProd']]`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'In Azure Pipelines, what is the correct YAML component to use when deploying to a production environment with approval gates?',
      options: [
        'A regular `job:` with a `condition:` expression',
        'A `deployment:` job targeting a named `environment:`',
        'A `stage:` with `dependsOn: []` to run after all other stages',
        'A `script:` step with `continueOnError: false`',
      ],
      answer: 1,
      explanation: '`deployment:` jobs (not regular `job:`) are the correct construct for deployments. They target a named `environment:` which enables: (1) approval gates configured in ADO, (2) deployment history tracking, (3) rollback via the ADO UI. Regular jobs cannot have environment approval gates.',
    },
    {
      q: 'How do you reference an Azure Key Vault secret in a pipeline step?',
      options: [
        'Hardcode it in the YAML with a comment marking it as secret',
        'Link a Variable Group (backed by Key Vault) and reference as $(SECRET_NAME)',
        'Use the `AzureKeyVault@2` task in every step that needs a secret',
        'Pass it as a command-line argument to the AzureCLI task',
      ],
      answer: 1,
      explanation: 'Variable Groups backed by Azure Key Vault sync secrets into the pipeline as masked variables. Link the group with `variables: - group: MyGroup` and access the secret as `$(SECRET_NAME)`. The secret is fetched at runtime, masked in logs, and never stored in YAML. The `AzureKeyVault@2` task is a valid alternative but variable groups are simpler for most use cases.',
    },
    {
      q: 'What does `condition: and(succeeded(), eq(variables[\'Build.SourceBranch\'], \'refs/heads/main\'))` do on a deploy stage?',
      options: [
        'It skips the stage if any previous stage failed, and only runs on the main branch',
        'It runs the stage regardless of success or failure, only on the main branch',
        'It runs the stage if succeeded on any branch except main',
        'It fails the stage immediately if the build is not from a pull request',
      ],
      answer: 0,
      explanation: '`succeeded()` requires all previous stages to have succeeded. `eq(variables[\'Build.SourceBranch\'], \'refs/heads/main\')` restricts to main branch pushes. Combined with `and()`: deploy only when CI passed AND the trigger was a push to main — preventing accidental prod deploys from feature branches.',
    },
    {
      q: 'What is the difference between `$(variableName)` and `$[variables.variableName]` in Azure Pipelines?',
      options: [
        'They are identical — both reference pipeline variables at the same time',
        '`$()` is evaluated at pipeline queue time; `$[]` is evaluated at runtime during execution',
        '`$()` is for user-defined variables; `$[]` is for system predefined variables',
        '`$[]` is for secret variables only; `$()` is for non-secret variables',
      ],
      answer: 1,
      explanation: '`$(var)` is a macro substitution evaluated at queue time (when the pipeline is compiled). `$[variables.var]` is a runtime expression evaluated when that job/step runs — essential for referencing output variables from prior jobs, since those values don\'t exist at queue time.',
    },
    {
      q: 'How do Azure Pipelines templates improve maintainability across multiple repos?',
      options: [
        'They cache build artifacts between repos to speed up builds',
        'They allow defining reusable steps/jobs/stages in a shared repo that multiple pipelines can reference and parameterise',
        'They automatically sync pipeline definitions between repos on push',
        'They compress pipeline YAML to reduce storage costs in ADO',
      ],
      answer: 1,
      explanation: 'Azure Pipelines templates let you extract common steps, jobs, or stages into YAML files in a shared repository. Other pipelines reference them with `template: path/to/template.yml@shared-repo`. When the template changes, all consuming pipelines get the update — eliminating copy-paste drift across repos.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is a Service Connection and why is it needed?',
      a: 'A Service Connection is a stored, named credential in Azure DevOps that allows pipelines to authenticate to external services — Azure subscriptions, Docker Hub, npm, GitHub, Kubernetes clusters, etc. Instead of passing credentials directly in YAML, tasks reference the service connection name: `azureSubscription: "MyAzureConnection"`. ADO handles token refresh, encryption, and audit logging. Service connections are scoped per project and their usage is audited in ADO — much safer than environment variables containing credentials.',
    },
    {
      q: 'How do you pass information from a Build stage to a Deploy stage?',
      a: 'Two mechanisms: (1) **Pipeline Artifacts** — the Build job publishes output with `PublishPipelineArtifact@1`; the Deploy job downloads it with `DownloadPipelineArtifact@2`. Good for binaries, Docker images, test reports. (2) **Output Variables** — a Build step sets `##vso[task.setvariable variable=myVar;isOutput=true]value`; downstream jobs reference it as `$[stageDependencies.BuildStage.BuildJob.outputs[\'stepName.myVar\']]`. Output variables work for string metadata (image tags, version numbers) — artifacts for file content.',
    },
    {
      q: 'What is the difference between `trigger:` and `pr:` in azure-pipelines.yml?',
      a: '`trigger:` fires on pushes to specified branches — it\'s your CI trigger for commits merged to main/develop. `pr:` fires when a pull request targets specified branches — it\'s the PR validation trigger that must pass before merging. They can have different branch filters: `trigger: [main]` might trigger production deploys; `pr: [main, develop]` might run PR validation for any PR targeting either branch. Use both together: PR validates code quality, trigger deploys after merge.',
    },
    {
      q: 'How do rolling and canary deployment strategies work in Azure Pipelines?',
      a: 'Both are deployment strategies on `deployment:` jobs. **Rolling**: divides targets into batches (e.g., 25% at a time). The pipeline deploys to the first batch, runs health checks, then proceeds to the next batch — reducing blast radius. **Canary**: deploys to a small percentage of targets (e.g., 10%), runs validation, then deploys to all. Canary is good for traffic-split deployments where you monitor metrics before full rollout. Configure under `strategy: rolling: maxParallel: 25%` or `strategy: canary: increments: [10, 100]`.',
    },
    {
      q: 'How do you run the same job on both Windows and Linux?',
      a: 'Use `strategy: matrix:` on the job to create parallel runs with different `vmImage` values. Define matrix entries like `{ Ubuntu: { vmImage: "ubuntu-latest" }, Windows: { vmImage: "windows-latest" } }`, then set `pool: vmImage: $(vmImage)` on the job. Each matrix entry creates a separate job run on the specified agent. Use `bash:` steps (not `script:`) to ensure shell compatibility across OS. You can also set `fail-fast: false` equivalent via `maxParallel` to keep all matrix runs going even if one fails.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Azure Pipelines: YAML-defined CI/CD in azure-pipelines.yml — Stage → Job → Step hierarchy; deployment: jobs target Environments with approval gates; templates enable reuse across repos; Variable Groups back secrets from Key Vault.',
    mustKnow: [
      'Hierarchy: Pipeline → Stage → Job → Step — stages sequential, jobs parallel within a stage by default',
      'deployment: jobs (not job:) are required for environment approval gates and deployment history',
      'Service Connections: named credentials for Azure, Docker, npm etc. — never hardcode secrets in YAML',
      'Variable Groups: shared variables/secrets optionally backed by Azure Key Vault',
      'Templates: reusable steps/jobs/stages — define once in shared repo, reference from many pipelines',
      '$(var) = queue-time macro; $[variables.var] = runtime expression — matters for output variables',
      'condition: restricts when stages/jobs run — use to prevent non-main branch deploys',
    ],
    interviewFocus: [
      'Explain the difference between job: and deployment: — when do you use each?',
      'How would you share a common build pipeline across 10 microservice repos?',
      'How do you pass a Docker image tag from a Build stage to a Deploy stage?',
      'What is a Variable Group and how does Azure Key Vault integration work?',
    ],
  };
}
