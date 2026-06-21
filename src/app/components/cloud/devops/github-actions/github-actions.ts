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
  selector: 'app-devops-github-actions',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './github-actions.html',
  styleUrl: './github-actions.scss'
})
export class DevopsGithubActions {

  quickRef: QuickRefItem[] = [
    { name: 'Workflow',          type: 'keyword', desc: 'YAML file in .github/workflows/ — defines automation triggered by events' },
    { name: 'Event (on:)',       type: 'keyword', desc: 'Trigger: push, pull_request, schedule, workflow_dispatch, workflow_call' },
    { name: 'Job',               type: 'keyword', desc: 'Group of steps that run on the same runner; jobs run in parallel by default' },
    { name: 'Step',              type: 'keyword', desc: 'Individual task in a job: `uses:` (action) or `run:` (shell command)' },
    { name: 'Runner',            type: 'keyword', desc: 'VM that executes jobs: ubuntu-latest, windows-latest, macos-latest, or self-hosted' },
    { name: 'Action',            type: 'keyword', desc: 'Reusable unit of work — from GitHub Marketplace or local .github/actions/' },
    { name: 'Secret',            type: 'keyword', desc: 'Encrypted variable stored at repo/org/environment level; accessed via secrets.NAME' },
    { name: 'Environment',       type: 'keyword', desc: 'Named deployment target (staging, production) with protection rules and secrets' },
    { name: 'Matrix Strategy',   type: 'keyword', desc: 'Run the same job across multiple OS/version combinations in parallel' },
    { name: 'Reusable Workflow', type: 'keyword', desc: 'workflow_call trigger — call entire workflow YAML from another workflow' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'GitHub Actions Architecture',
      points: [
        'GitHub Actions is an event-driven CI/CD platform built into GitHub repositories.',
        'Every workflow is a YAML file in `.github/workflows/`. GitHub watches for trigger events and queues the workflow on an available runner.',
        'Structure hierarchy: Workflow → Job → Step. Multiple jobs run in parallel by default; use `needs:` to add dependencies.',
        'Runners are ephemeral VMs — every job starts with a fresh OS. State between jobs must be passed via artifacts or cache.',
        'Free tier: 2000 minutes/month for public repos (unlimited); private repos: 2000 min free, then metered.',
      ]
    },
    {
      heading: 'Triggers (on:)',
      points: [
        '`push`: triggers on commits to specified branches. Filter with `branches:`, `tags:`, `paths:`.',
        '`pull_request`: triggers on PR open, sync, reopen. Use `branches:` to filter target branch. PR workflows run with read-only token by default.',
        '`schedule`: cron syntax — `cron: "0 2 * * 1"` (every Monday at 2am UTC). Good for nightly dependency scans.',
        '`workflow_dispatch`: manual trigger via GitHub UI or API. Can accept inputs (string, boolean, choice).',
        '`workflow_call`: makes this workflow reusable — other workflows can call it with `uses: org/repo/.github/workflows/build.yml@main`.',
        'Multiple triggers can be combined: `on: [push, pull_request]` or as a map for fine-grained control.',
      ]
    },
    {
      heading: 'Jobs, Steps & Runners',
      points: [
        'Jobs run in parallel unless `needs: [other-job]` creates a dependency chain.',
        '`runs-on`: selects the runner OS. Common: `ubuntu-latest`, `windows-latest`, `macos-latest`. Self-hosted runners have `self-hosted` label.',
        'Steps within a job run sequentially. `uses:` calls an action; `run:` executes shell commands.',
        'Environment variables: `env:` at workflow/job/step level. Step-level overrides job-level; job-level overrides workflow-level.',
        '`if:` conditional expressions on jobs/steps: `if: github.ref == \'refs/heads/main\'` or `if: failure()` for cleanup steps.',
        'Timeout: `timeout-minutes: 30` on jobs prevents runaway builds from consuming minutes.',
      ]
    },
    {
      heading: 'Secrets & Environments',
      points: [
        'Secrets are encrypted at rest and never appear in logs (replaced by `***`). Store API keys, tokens, passwords here — never in YAML.',
        'Scope: Repository secrets (all workflows), Environment secrets (only workflows deploying to that environment), Organisation secrets (shared across repos).',
        'Access: `\$\{\{ secrets.MY_SECRET }}` in YAML. Available as env vars in `run:` steps after injecting: `env: MY_VAR: \$\{\{ secrets.MY_SECRET }}`.',
        'Environments add deployment protection rules: required reviewers, wait timers, and environment-scoped secrets.',
        'Environment URLs: `environment: name: production / url: https://myapp.com` — shows the URL on the workflow run page.',
      ]
    },
    {
      heading: 'Matrix Strategy & Parallelism',
      points: [
        'Matrix builds run the same job with different parameter combinations in parallel — ideal for multi-OS or multi-version testing.',
        'Define combinations under `strategy: matrix: os: [ubuntu, windows] / node: [18, 20]` — GitHub creates one job per combination.',
        '`include:` adds extra combinations; `exclude:` removes specific ones.',
        '`fail-fast: false`: continue running other matrix jobs when one fails (useful for cross-platform testing — you want all results).',
        '`max-parallel: 3`: throttle concurrency if you have limited runners or want to protect downstream services.',
      ]
    },
    {
      heading: 'Reusable Workflows & Composite Actions',
      points: [
        'Reusable workflows (workflow_call): entire workflow YAML callable from another workflow — inputs/outputs/secrets can be passed.',
        'Use for: standard build pipeline, deploy pipeline, security scan — define once, call from many repo workflows.',
        'Composite actions (action.yml): a sequence of steps packaged as a single action — no new runner, runs in the caller\'s job.',
        'JavaScript/Docker actions: full custom logic (JS action runs directly on runner; Docker action runs in a container).',
        'Marketplace: `actions/checkout@v4`, `actions/setup-node@v4`, `actions/cache@v4`, `docker/build-push-action@v5` are the most commonly used.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'CI Workflow (Node)',
      language: 'bash',
      code: `# .github/workflows/ci.yml
# name: CI
# on:
#   push:
#     branches: [main, develop]
#   pull_request:
#     branches: [main]
#
# jobs:
#   build-and-test:
#     runs-on: ubuntu-latest
#     strategy:
#       matrix:
#         node-version: [18, 20, 22]
#       fail-fast: false
#
#     steps:
#       - uses: actions/checkout@v4
#
#       - name: Setup Node.js \$\{\{ matrix.node-version }}
#         uses: actions/setup-node@v4
#         with:
#           node-version: \$\{\{ matrix.node-version }}
#           cache: 'npm'
#
#       - name: Install dependencies
#         run: npm ci
#
#       - name: Run lint
#         run: npm run lint
#
#       - name: Run unit tests
#         run: npm test -- --coverage --watchAll=false
#
#       - name: Upload coverage report
#         uses: actions/upload-artifact@v4
#         with:
#           name: coverage-node\$\{\{ matrix.node-version }}
#           path: coverage/
#           retention-days: 7
#
#       - name: Build production
#         run: npm run build -- --configuration=production

# Run this workflow via GitHub CLI:
gh workflow run ci.yml --ref main

# View recent workflow runs:
gh run list --workflow=ci.yml

# Watch a live run:
gh run watch`,
    },
    {
      label: 'CD Deploy Workflow',
      language: 'bash',
      code: `# .github/workflows/deploy.yml
# Separate CI and CD — deploy only runs when CI passes on main
#
# name: Deploy to Production
# on:
#   workflow_run:
#     workflows: [CI]
#     types: [completed]
#     branches: [main]
#
# jobs:
#   deploy:
#     if: \$\{\{ github.event.workflow_run.conclusion == 'success' }}
#     runs-on: ubuntu-latest
#     environment:
#       name: production
#       url: https://myapp.com
#
#     steps:
#       - uses: actions/checkout@v4
#
#       - name: Configure AWS credentials
#         uses: aws-actions/configure-aws-credentials@v4
#         with:
#           aws-access-key-id: \$\{\{ secrets.AWS_ACCESS_KEY_ID }}
#           aws-secret-access-key: \$\{\{ secrets.AWS_SECRET_ACCESS_KEY }}
#           aws-region: eu-west-1
#
#       - name: Login to ECR
#         uses: aws-actions/amazon-ecr-login@v2
#
#       - name: Build and push Docker image
#         uses: docker/build-push-action@v5
#         with:
#           push: true
#           tags: |
#             \$\{\{ steps.login-ecr.outputs.registry }}/myapp:\$\{\{ github.sha }}
#             \$\{\{ steps.login-ecr.outputs.registry }}/myapp:latest
#
#       - name: Deploy to ECS
#         run: |
#           aws ecs update-service \\
#             --cluster production \\
#             --service myapp \\
#             --force-new-deployment

# Manually trigger with approval gate:
# - Environment "production" has required reviewer configured
# - GitHub shows "Waiting for review" before running deploy steps`,
    },
    {
      label: 'Reusable Workflow Pattern',
      language: 'bash',
      code: `# .github/workflows/reusable-build.yml — define once, call from many repos
#
# name: Reusable Build
# on:
#   workflow_call:
#     inputs:
#       node-version:
#         required: false
#         type: string
#         default: '20'
#       environment:
#         required: true
#         type: string
#     secrets:
#       REGISTRY_TOKEN:
#         required: true
#     outputs:
#       image-tag:
#         description: "Docker image tag"
#         value: \$\{\{ jobs.build.outputs.image-tag }}
#
# jobs:
#   build:
#     runs-on: ubuntu-latest
#     outputs:
#       image-tag: \$\{\{ steps.meta.outputs.tags }}
#     steps:
#       - uses: actions/checkout@v4
#       - uses: actions/setup-node@v4
#         with:
#           node-version: \$\{\{ inputs.node-version }}
#       - run: npm ci && npm run build && npm test
#       - name: Build & push image
#         uses: docker/build-push-action@v5
#         id: meta
#         with:
#           push: true
#           tags: ghcr.io/myorg/myapp:\$\{\{ github.sha }}

# --- caller workflow in another repo ---
# jobs:
#   call-build:
#     uses: myorg/shared-workflows/.github/workflows/reusable-build.yml@main
#     with:
#       node-version: '20'
#       environment: staging
#     secrets:
#       REGISTRY_TOKEN: \$\{\{ secrets.REGISTRY_TOKEN }}
#
#   deploy:
#     needs: call-build
#     runs-on: ubuntu-latest
#     steps:
#       - run: echo "Deploy image \$\{\{ needs.call-build.outputs.image-tag }}"`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Storing secrets in workflow YAML or env vars at repo level',
      wrong: `# .github/workflows/deploy.yml
env:
  DATABASE_URL: postgres://user:password123@prod-db/myapp  # visible in repo!
  API_KEY: sk-live-abc123                                  # NEVER hardcode secrets`,
      right: `# Store secrets via GitHub UI: Settings → Secrets → Actions
# Access in workflow:
env:
  DATABASE_URL: \$\{\{ secrets.DATABASE_URL }}
  API_KEY: \$\{\{ secrets.API_KEY }}`,
      explanation: 'Secrets in YAML are committed to the repo — anyone with read access can see them, and they appear in git history forever. GitHub Actions secrets are encrypted, masked in logs, and never exposed in the repo. Use them for ALL credentials.',
    },
    {
      title: 'Not pinning action versions',
      wrong: `- uses: actions/checkout@main        # can change without warning
- uses: actions/setup-node@latest    # "latest" can break your build
- uses: some-third-party/action@v1   # v1 tag can be overwritten`,
      right: `- uses: actions/checkout@v4           # pin to major version tag
- uses: actions/setup-node@v4         # controlled upgrades
# For third-party actions, pin to SHA for supply-chain security:
- uses: some-third-party/action@a1b2c3d4e5f6  # immutable`,
      explanation: 'Mutable tags like `@main` or `@latest` can be updated (or hijacked in supply chain attacks) and silently change your build. Pin to an immutable SHA for third-party actions and to a major version tag for trusted first-party actions.',
    },
    {
      title: 'Running expensive jobs on every push to every branch',
      wrong: `on:
  push:    # triggers on ALL branches including feature branches
# No path filters — rebuilds for README changes
# No branch filters — runs on 20 feature branches simultaneously`,
      right: `on:
  push:
    branches: [main, develop]
    paths-ignore:
      - '**.md'
      - 'docs/**'
  pull_request:
    branches: [main]`,
      explanation: 'Unfiltered `push` triggers waste minutes (and money on private repos) by rebuilding on every feature branch commit and non-code file change. Filter by branch and paths to run expensive jobs only when needed.',
    },
    {
      title: 'Not caching dependencies',
      wrong: `- uses: actions/setup-node@v4
  with:
    node-version: '20'
- run: npm ci  # downloads all dependencies on every run — slow`,
      right: `- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'           # built-in npm cache in setup-node
- run: npm ci              # cache hit → seconds instead of minutes`,
      explanation: 'Without caching, every CI run downloads gigabytes of npm/pip/maven packages from scratch. `actions/setup-node@v4` has a built-in `cache:` option; `actions/cache@v4` can cache any directory. Cache hits can cut build times by 50–80%.',
    },
    {
      title: 'Deploying directly from a PR workflow',
      wrong: `on:
  pull_request:
    branches: [main]
jobs:
  deploy:
    # Deploys to PRODUCTION on every PR — overwrites prod on every PR!
    # PR workflows run with read tokens — this often fails in surprising ways`,
      right: `# Deploy only from merge to main, not from PRs:
on:
  push:
    branches: [main]
jobs:
  deploy:
    environment: production  # add approval gate here`,
      explanation: 'PR workflows run with a read-only GITHUB_TOKEN and restricted secrets access (by design, for security against fork PRs). They should only run CI (test/lint/build). Deploy only after merge to main, gated by an environment with required reviewer approval.',
    },
    {
      title: 'Missing timeout-minutes on jobs',
      wrong: `jobs:
  build:
    runs-on: ubuntu-latest
    # No timeout — if build hangs (network issue, infinite loop)
    # it runs for 6 HOURS consuming all your quota before being killed`,
      right: `jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 20    # fail fast — don't burn quota on hung builds
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build`,
      explanation: 'GitHub Actions default timeout is 6 hours. A hung build (deadlock, waiting on network) silently burns your quota. Set `timeout-minutes` to slightly above your expected maximum build time — usually 15–30 minutes for most builds.',
    },
  ];

  challenge: Challenge = {
    title: 'Workflow YAML Validator',
    language: 'typescript',
    description: `Build a function that validates a simplified GitHub Actions workflow object.

Rules to enforce:
1. Must have a \`name\` (non-empty string)
2. Must have at least one trigger in \`on\` (push, pull_request, schedule, or workflow_dispatch)
3. Must have at least one job in \`jobs\`
4. Each job must have a \`runsOn\` string
5. Each job must have at least one step
6. Each step must have either \`uses\` or \`run\` (not both, not neither)

Return { valid: boolean, errors: string[] }`,
    hints: [
      'Validate the top-level fields first, then drill into jobs and steps',
      'Collect ALL errors before returning — don\'t short-circuit',
      'The step rule (uses XOR run) can be checked with a simple truth table',
      'Job keys are dynamic — iterate Object.entries(workflow.jobs)',
    ],
    starterCode: `interface WorkflowStep {
  uses?: string;
  run?: string;
}

interface WorkflowJob {
  runsOn: string;
  steps: WorkflowStep[];
}

interface Workflow {
  name: string;
  on: string[];
  jobs: Record<string, WorkflowJob>;
}

function validateWorkflow(wf: Workflow): { valid: boolean; errors: string[] } {
  // TODO: implement
  return { valid: true, errors: [] };
}`,
    solution: `const VALID_TRIGGERS = ['push', 'pull_request', 'schedule', 'workflow_dispatch', 'workflow_call'];

function validateWorkflow(wf: Workflow): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!wf.name || wf.name.trim() === '') {
    errors.push('Workflow must have a non-empty name');
  }

  if (!wf.on || wf.on.length === 0) {
    errors.push('Workflow must have at least one trigger in "on"');
  } else {
    const invalid = wf.on.filter(t => !VALID_TRIGGERS.includes(t));
    if (invalid.length > 0) {
      errors.push(\`Unknown triggers: \${invalid.join(', ')}\`);
    }
  }

  if (!wf.jobs || Object.keys(wf.jobs).length === 0) {
    errors.push('Workflow must have at least one job');
  } else {
    for (const [jobName, job] of Object.entries(wf.jobs)) {
      if (!job.runsOn) {
        errors.push(\`Job "\${jobName}" must have a runsOn value\`);
      }
      if (!job.steps || job.steps.length === 0) {
        errors.push(\`Job "\${jobName}" must have at least one step\`);
      } else {
        job.steps.forEach((step, i) => {
          const hasUses = Boolean(step.uses);
          const hasRun  = Boolean(step.run);
          if (hasUses && hasRun) {
            errors.push(\`Job "\${jobName}" step \${i + 1}: cannot have both "uses" and "run"\`);
          } else if (!hasUses && !hasRun) {
            errors.push(\`Job "\${jobName}" step \${i + 1}: must have either "uses" or "run"\`);
          }
        });
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// Test:
console.log(validateWorkflow({
  name: 'CI',
  on: ['push', 'pull_request'],
  jobs: {
    build: { runsOn: 'ubuntu-latest', steps: [{ uses: 'actions/checkout@v4' }, { run: 'npm ci' }] }
  }
}));
// { valid: true, errors: [] }`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'In GitHub Actions, what is the difference between a Job and a Step?',
      options: [
        'Jobs run on separate runners; steps run sequentially within the same job on the same runner',
        'Steps run on separate runners; jobs run sequentially within the same step',
        'Jobs and steps are interchangeable terms for the same concept',
        'Jobs define triggers; steps define the actual commands to run',
      ],
      answer: 0,
      explanation: 'Jobs run on their own runner VMs — they can run in parallel or have dependency ordering via `needs:`. Steps run sequentially within a single job on the same runner, sharing the filesystem and environment variables.',
    },
    {
      q: 'Which trigger should you use to allow manual workflow execution from the GitHub UI?',
      options: [
        'workflow_call',
        'manual_trigger',
        'workflow_dispatch',
        'repository_dispatch',
      ],
      answer: 2,
      explanation: '`workflow_dispatch` adds a "Run workflow" button to the GitHub Actions UI and enables triggering via the GitHub API. It can accept typed inputs (string, boolean, choice) for parameterised manual runs. `workflow_call` is for calling one workflow from another.',
    },
    {
      q: 'What happens when `fail-fast: false` is set in a matrix strategy?',
      options: [
        'The entire workflow fails immediately if any job fails',
        'Other matrix jobs continue running even if one fails',
        'Jobs are retried automatically on failure',
        'The workflow ignores all failures and always reports success',
      ],
      answer: 1,
      explanation: 'By default (`fail-fast: true`), if one matrix job fails, GitHub cancels all other in-progress matrix jobs. Setting `fail-fast: false` lets all combinations run to completion, which is valuable for cross-platform testing where you want to see results from all OS/version combinations.',
    },
    {
      q: 'Why should you pin third-party actions to a specific commit SHA instead of a tag?',
      options: [
        'SHA references load faster than tag references',
        'Tags can be moved or deleted by the action author, enabling supply chain attacks; SHAs are immutable',
        'GitHub requires SHA pinning for actions in private repositories',
        'SHAs allow automatic minor version updates',
      ],
      answer: 1,
      explanation: 'Git tags are mutable — an action author (or attacker who compromises their account) can update a tag to point to malicious code. A commit SHA is immutable — the exact code you reviewed is exactly what runs. For third-party actions, always pin to a full SHA for supply chain security.',
    },
    {
      q: 'What is the primary difference between a Reusable Workflow and a Composite Action?',
      options: [
        'Composite actions can only run shell commands; reusable workflows can use any action',
        'Reusable workflows are triggered with workflow_call and run on their own runner; composite actions run in the caller\'s job',
        'Reusable workflows are faster because they skip the setup phase',
        'Composite actions are only available to public repositories',
      ],
      answer: 1,
      explanation: 'Reusable workflows (workflow_call) spin up their own runner and have full job-level isolation — they have their own environment, secrets, and concurrency. Composite actions run within the calling job\'s runner, sharing its workspace and environment. Use reusable workflows for full pipelines; composite actions for groups of steps.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I pass data between jobs in a GitHub Actions workflow?',
      a: 'Two mechanisms: (1) **Artifacts** — one job uploads a file with `actions/upload-artifact`, the next downloads it with `actions/download-artifact`. Good for build outputs, test reports. (2) **Job outputs** — a step sets `echo "MY_VALUE=foo" >> $GITHUB_OUTPUT`, the job exposes it with `outputs: my-value: \$\{\{ steps.step-id.outputs.MY_VALUE }}`, and downstream jobs reference it with `\$\{\{ needs.job-name.outputs.my-value }}`. Outputs are strings only; artifacts handle binary/large data.',
    },
    {
      q: 'What is the GITHUB_TOKEN and how is it different from a Personal Access Token?',
      a: 'GITHUB_TOKEN is an automatically-generated, short-lived token unique to each workflow run. It is scoped to the specific repository and automatically expires when the run ends. Default permissions are read-only for PR workflows (security measure for fork PRs). You can grant additional permissions in the workflow: `permissions: contents: write`. A Personal Access Token (PAT) is user-owned, long-lived, and has the user\'s full permissions — only use PATs when GITHUB_TOKEN lacks the scope you need (e.g., pushing to another repo, triggering cross-repo workflows).',
    },
    {
      q: 'How do I cache npm dependencies efficiently in GitHub Actions?',
      a: 'Use the built-in cache in `actions/setup-node@v4`: set `cache: "npm"` and it automatically caches `~/.npm` keyed by `package-lock.json` hash. On cache hit, `npm ci` takes seconds instead of minutes. For more control, use `actions/cache@v4` directly with `key: \$\{\{ runner.os }}-npm-\$\{\{ hashFiles(\'**/package-lock.json\') }}` and `restore-keys: \$\{\{ runner.os }}-npm-`. The restore-keys fallback lets you use a slightly stale cache when the lock file changed, still saving most download time.',
    },
    {
      q: 'What are Environments in GitHub Actions and when should I use them?',
      a: 'Environments are named deployment targets (e.g., staging, production) with three features: (1) **Protection rules** — require a specific reviewer to approve before the job runs, add a wait timer, or restrict to specific branches. (2) **Environment secrets** — secrets only available to jobs deploying to that environment, isolated from regular CI. (3) **Deployment URL** — shown on the run page linking to the live deployment. Use environments for any job that deploys to a shared/production system — the required reviewer is your "four-eyes" gate for production changes.',
    },
    {
      q: 'How do I handle secret rotation without breaking running workflows?',
      a: 'Add the new secret value under a new name first (e.g., `DATABASE_URL_V2`), update your workflow to reference it, merge to main, let the new workflow run successfully. Then delete the old secret. This zero-downtime rotation ensures no running workflow loses its secret mid-run. For infrastructure-managed secrets (AWS, Azure, Vault), use short-lived OIDC tokens instead of long-lived secret values — the workflow fetches a temporary credential via `aws-actions/configure-aws-credentials` without storing any secret at all.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'GitHub Actions: event-driven CI/CD in .github/workflows/ YAML — Workflow → Job (parallel, own runner) → Step (sequential, shell or action); triggered by push/PR/schedule/dispatch.',
    mustKnow: [
      'Jobs run in parallel by default on separate runners; use `needs:` for ordering',
      'Secrets accessed via `\$\{\{ secrets.NAME }}` — never hardcode credentials in YAML',
      'Pin third-party actions to commit SHAs to prevent supply chain attacks',
      'Matrix strategy: run same job across multiple OS/version combos in parallel',
      'Reusable workflows (workflow_call) run on own runner; composite actions run in caller\'s job',
      'Set `timeout-minutes` to prevent hung builds consuming quota',
      'Deploy only from push to main gated by an environment with required reviewer — never from PR',
    ],
    interviewFocus: [
      'Explain the Job vs Step hierarchy and how data passes between jobs',
      'What is GITHUB_TOKEN, what are its default permissions, and when do you need a PAT instead?',
      'How would you structure a CI + CD pipeline — what triggers what?',
      'Why pin third-party actions to SHA instead of tags?',
    ],
  };
}
