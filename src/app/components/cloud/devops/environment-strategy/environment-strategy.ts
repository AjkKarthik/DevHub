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
  selector: 'app-devops-environment-strategy',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './environment-strategy.html',
  styleUrl: './environment-strategy.scss'
})
export class DevopsEnvironmentStrategy {

  quickRef: QuickRefItem[] = [
    { name: 'Environment Parity',  type: 'keyword', desc: 'Dev, staging, and prod use the same OS, runtime versions, and config shape — bugs caught earlier' },
    { name: 'Ephemeral Environment', type: 'keyword', desc: 'Short-lived environment spun up per PR and destroyed on merge — enables parallel branch testing' },
    { name: 'Feature Flag',        type: 'keyword', desc: 'Runtime toggle to enable/disable code paths without a new deployment — decouples deploy from release' },
    { name: 'Environment Promotion', type: 'keyword', desc: 'Artefact progresses dev → staging → prod only after gate checks pass at each stage' },
    { name: 'Secrets Management',  type: 'keyword', desc: 'Per-environment credentials stored in Vault / Key Vault / SSM — never hardcoded or in source control' },
    { name: 'IaC per Environment', type: 'keyword', desc: 'Separate Terraform workspaces or Kustomize overlays define each environment\'s infra declaratively' },
    { name: 'Trunk-Based Dev',     type: 'keyword', desc: 'Short-lived feature branches merged to main daily — avoids long-running env-specific branches' },
    { name: 'Smoke Test',          type: 'keyword', desc: 'Minimal post-deploy test verifying the service is alive before routing traffic' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Environment Tiers',
      points: [
        'Development (local/dev): individual developer machines or shared dev cluster. Fast feedback, no stability guarantee.',
        'Integration/Test: shared environment where branches are merged and integrated. Automated tests run here.',
        'Staging (pre-prod): production-like environment used for final acceptance testing, performance tests, and stakeholder demo.',
        'Production: live customer-facing environment. Changes should arrive here with high confidence from the prior stages.',
        'Some teams add QA, UAT, or Canary tiers — but every additional tier adds maintenance cost. Keep only tiers you actively use.',
      ]
    },
    {
      heading: 'Environment Parity',
      points: [
        'Environment parity means dev, staging, and prod are as similar as possible: same OS, same runtime version, same dependency versions, same config shape.',
        'The "works on my machine" problem is a parity failure — something is different between the developer\'s environment and production.',
        'Docker solves OS/runtime parity. IaC (Terraform, Bicep) solves infrastructure parity. Environment-specific config via injected secrets (not baked-in) solves config parity.',
        'Gaps to close: database engine + version, environment variables, external service mocks vs real services, OS-level dependencies.',
      ]
    },
    {
      heading: 'Ephemeral Environments',
      points: [
        'An ephemeral environment is created on-demand for a PR, lives while the PR is open, and is destroyed on merge.',
        'Benefits: isolated testing per branch, parallel development without environment contention, no "this env is broken for everyone" problems.',
        'Implementation: GitHub Actions / Azure Pipelines triggers on PR open, provisions infra via Terraform/Helm, deploys the branch build, posts the URL as a PR comment.',
        'Cost control: auto-destroy on PR merge/close; add a TTL (destroy after 24h of inactivity); use smaller/cheaper SKUs than prod.',
        'Tools: Vercel/Netlify (frontend), Argo CD (Kubernetes), environment-per-namespace pattern, Pulumi Automation API.',
      ]
    },
    {
      heading: 'Feature Flags — Decoupling Deploy from Release',
      points: [
        'A feature flag (feature toggle) is a runtime conditional that enables or disables a code path without redeployment.',
        'Deploy the code to production disabled → enable for internal users → canary to 5% → 100% rollout → remove flag.',
        'Types: release toggles (ship incomplete features safely), experiment toggles (A/B tests), ops toggles (kill switches), permission toggles (per-tenant).',
        'Tools: LaunchDarkly, Azure App Configuration, AWS AppConfig, GrowthBook (open source), or simple config-file toggles.',
        'Flags have a lifecycle — flag debt accumulates fast. Establish a max-age policy and remove flags after rollout.',
      ]
    },
    {
      heading: 'Secrets Management',
      points: [
        'Never store secrets (API keys, passwords, connection strings) in source control — even in private repos.',
        'Per-environment secrets: each environment has its own credentials. Rotating prod secrets does not affect staging.',
        'Tools: HashiCorp Vault, Azure Key Vault, AWS Secrets Manager, GCP Secret Manager, Kubernetes Secrets (with encryption at rest).',
        'Injection pattern: CI/CD pipeline retrieves secrets at deploy time and injects as environment variables or mounted files — the app never knows where they came from.',
        'Secret scanning: tools like gitleaks or GitHub secret scanning detect accidentally committed credentials and alert immediately.',
      ]
    },
    {
      heading: 'Environment Promotion Gates',
      points: [
        'Promotion gates are automated checks that must pass before an artefact can proceed to the next environment.',
        'Example gates: unit tests pass, code coverage >80%, SAST scan clean, integration tests pass, performance benchmark met, manual sign-off.',
        'The same artefact (Docker image, NuGet package) is promoted — it is never rebuilt per environment. Only config changes between environments.',
        '"Build once, deploy many" principle: the artefact promoted to prod is bit-for-bit identical to what passed all tests in staging.',
        'Failed gates block promotion and notify the team — they do not silently skip. Silent skips defeat the purpose.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Ephemeral Env — GitHub Actions',
      language: 'bash',
      code: `# .github/workflows/ephemeral-env.yml
# Creates a preview environment for every PR

name: PR Preview Environment

on:
  pull_request:
    types: [opened, synchronize, reopened, closed]

jobs:
  deploy-preview:
    if: github.event.action != 'closed'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: |
          IMAGE="ghcr.io/\${{ github.repository }}:pr-\${{ github.event.number }}"
          docker build -t "\$IMAGE" .
          docker push "\$IMAGE"

      - name: Deploy to preview namespace
        run: |
          NAMESPACE="pr-\${{ github.event.number }}"
          kubectl create namespace "\$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
          helm upgrade --install "app-\$NAMESPACE" ./charts/app \\
            --namespace "\$NAMESPACE" \\
            --set image.tag="pr-\${{ github.event.number }}" \\
            --set ingress.host="\$NAMESPACE.preview.example.com"

      - name: Post preview URL as PR comment
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚀 Preview: https://pr-\${{ github.event.number }}.preview.example.com'
            })

  cleanup-preview:
    if: github.event.action == 'closed'
    runs-on: ubuntu-latest
    steps:
      - name: Delete preview namespace
        run: kubectl delete namespace "pr-\${{ github.event.number }}" --ignore-not-found`,
    },
    {
      label: 'Feature Flag Pattern',
      language: 'typescript',
      code: `// Simple feature flag service — replace with LaunchDarkly/AppConfig in production

interface FeatureFlags {
  newCheckoutFlow: boolean;
  experimentalSearch: boolean;
  darkModeEnabled: boolean;
}

class FeatureFlagService {
  private flags: FeatureFlags;

  constructor(private config: Record<string, string>) {
    // Flags injected via environment variables at deploy time
    this.flags = {
      newCheckoutFlow:    config['FLAG_NEW_CHECKOUT'] === 'true',
      experimentalSearch: config['FLAG_EXP_SEARCH'] === 'true',
      darkModeEnabled:    config['FLAG_DARK_MODE'] === 'true',
    };
  }

  isEnabled(flag: keyof FeatureFlags): boolean {
    return this.flags[flag] ?? false;
  }
}

// Usage in application code
const flags = new FeatureFlagService(process.env as Record<string, string>);

function renderCheckout(user: { id: string }) {
  if (flags.isEnabled('newCheckoutFlow')) {
    return renderNewCheckout(user);
  }
  return renderLegacyCheckout(user);
}

// Deploy lifecycle:
// 1. Deploy with FLAG_NEW_CHECKOUT=false (code ships, feature hidden)
// 2. Enable for internal users via env var or flag management tool
// 3. Canary: enable for 5% of users, watch error rates
// 4. Full rollout: FLAG_NEW_CHECKOUT=true for all
// 5. Remove the flag and the dead code path`,
    },
    {
      label: 'Terraform Workspace per Env',
      language: 'bash',
      code: `# Terraform workspace pattern — one state file per environment
# Each workspace shares the same .tf files; only variable values differ

# Create workspaces
terraform workspace new dev
terraform workspace new staging
terraform workspace new prod

# Switch and apply per environment
terraform workspace select dev
terraform apply -var-file=envs/dev.tfvars

terraform workspace select staging
terraform apply -var-file=envs/staging.tfvars

terraform workspace select prod
terraform apply -var-file=envs/prod.tfvars

# Example envs/dev.tfvars
# instance_type = "t3.micro"
# min_instances = 1
# max_instances = 2
# db_tier       = "db.t3.micro"

# Example envs/prod.tfvars
# instance_type = "m5.large"
# min_instances = 3
# max_instances = 20
# db_tier       = "db.r6g.large"

# The same Terraform code provisions both environments;
# only the variable values change — enforcing parity in structure.

# Promotion gate in CI/CD:
# 1. Apply to dev  → run smoke tests  → pass
# 2. Apply to staging → run full suite → manual approval
# 3. Apply to prod  → monitor for 30 min → done`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Snowflake environments (manually configured)',
      wrong: `# Ops manually SSH into staging and prod servers
# to install packages, edit config files, restart services
# No record of what changed or when`,
      right: `# All environment config is in IaC (Terraform/Ansible/Helm)
# Changes go through PR review like application code
# Infra is reproducible — delete and recreate in minutes`,
      explanation: 'Snowflake environments (each unique, manually maintained) cause "works in staging but not prod" bugs and make disaster recovery slow. IaC means every environment is reproducible and auditable.',
    },
    {
      title: 'Rebuilding artefacts per environment',
      wrong: `# CI pipeline: build for dev, build for staging, build for prod
# Each environment compiles its own Docker image
# Environment-specific flags baked into the binary`,
      right: `# Build once: one Docker image tagged with git SHA
# Promote the same image through dev → staging → prod
# Only config/secrets differ between environments (injected at runtime)`,
      explanation: '"Build once, deploy many" ensures what is tested in staging is exactly what runs in prod. Rebuilding per environment introduces subtle differences that can hide bugs until production.',
    },
    {
      title: 'Hardcoded secrets in source control',
      wrong: `# config/production.json
{
  "database": {
    "password": "Sup3rS3cr3t!",
    "host": "prod-db.internal"
  }
}`,
      right: `# Inject secrets at runtime from a secrets manager
# config/production.json has only structure:
{
  "database": {
    "password": "\${DB_PASSWORD}",
    "host": "\${DB_HOST}"
  }
}`,
      explanation: 'Secrets in source control are permanently exposed — even after deletion, git history retains them. Every secret should be fetched from a secrets manager at deploy or runtime, never stored in the repo.',
    },
    {
      title: 'Feature flags never removed',
      wrong: `// 2 years later: 47 active feature flags
// Nobody knows which are safe to remove
// Every code path guarded by 3+ flag combinations
// Testing is exponentially complex`,
      right: `// Flag lifecycle policy:
// 1. Create flag with ticket and expiry date
// 2. Roll out fully → remove flag from code within 1 sprint
// 3. Monthly flag audit — remove anything older than 30 days post-rollout`,
      explanation: 'Feature flag debt accumulates fast. Every live flag is a branching code path that must be tested. Establish a removal policy when the flag is created, not after the fact.',
    },
    {
      title: 'Skipping environment parity for databases',
      wrong: `# Dev: SQLite in-memory
# Staging: PostgreSQL 12
# Prod: PostgreSQL 15
# Result: queries work in dev/staging but fail in prod`,
      right: `# All environments: PostgreSQL 15 (same major version)
# Dev: local Docker container  (postgres:15)
# Staging: managed RDS/Cloud SQL (postgres 15)
# Prod: managed RDS/Cloud SQL (postgres 15)`,
      explanation: 'Database engine mismatches are a common source of "works in staging, broken in prod" bugs — SQL syntax, JSON support, and index behaviour all vary between versions. Match the engine and major version across all environments.',
    },
    {
      title: 'Shared staging environment with no isolation',
      wrong: `# One staging environment shared by 5 teams
# Team A's broken deploy breaks staging for everyone
# "Staging is always broken" — teams stop testing there`,
      right: `# Ephemeral per-PR environments for feature testing
# Shared staging only for integration/E2E tests
# Environment ownership clear — one team owns each env`,
      explanation: 'A permanently broken shared staging environment becomes useless — teams start deploying to prod without testing. Ephemeral environments per PR eliminate the shared mutable state problem.',
    },
  ];

  challenge: Challenge = {
    title: 'Environment Config Validator',
    language: 'typescript',
    description: `Build a function that validates environment configuration before deployment. It should:

1. Check all required environment variables are present
2. Validate that secrets are not hardcoded (no obvious patterns like "password123" or "secret")
3. Verify environment-specific rules (e.g. prod must have a minimum replica count ≥ 2)
4. Return a validation result with all errors (not just the first one)`,
    hints: [
      'Collect all errors before returning — don\'t short-circuit on first failure',
      'Use a regex to detect obviously weak/hardcoded secrets',
      'Prod-specific rules can be handled with a conditional block',
      'Return type should include isValid boolean + errors array',
    ],
    starterCode: `interface EnvConfig {
  NODE_ENV: 'development' | 'staging' | 'production';
  DATABASE_URL: string;
  API_KEY: string;
  REPLICAS: number;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

const REQUIRED_VARS: (keyof EnvConfig)[] = [
  'NODE_ENV', 'DATABASE_URL', 'API_KEY', 'REPLICAS', 'LOG_LEVEL'
];

function validateEnvConfig(config: Partial<EnvConfig>): ValidationResult {
  // TODO: implement
  return { isValid: true, errors: [] };
}`,
    solution: `const WEAK_SECRET_PATTERN = /^(password|secret|12345|admin|changeme|test)/i;

function validateEnvConfig(config: Partial<EnvConfig>): ValidationResult {
  const errors: string[] = [];

  // 1. Check all required variables are present
  for (const key of REQUIRED_VARS) {
    if (config[key] === undefined || config[key] === '') {
      errors.push(\`Missing required variable: \${key}\`);
    }
  }

  // 2. Check for obviously hardcoded/weak secrets
  if (config.API_KEY && WEAK_SECRET_PATTERN.test(config.API_KEY)) {
    errors.push('API_KEY appears to be a weak or hardcoded value — use a secrets manager');
  }
  if (config.DATABASE_URL && config.DATABASE_URL.includes('password123')) {
    errors.push('DATABASE_URL contains a hardcoded password — inject from secrets manager');
  }

  // 3. Production-specific rules
  if (config.NODE_ENV === 'production') {
    if ((config.REPLICAS ?? 0) < 2) {
      errors.push('Production requires REPLICAS >= 2 for high availability');
    }
    if (config.LOG_LEVEL === 'debug') {
      errors.push('Production should not use debug log level — use info or warn');
    }
  }

  return { isValid: errors.length === 0, errors };
}

// Test:
const result = validateEnvConfig({
  NODE_ENV: 'production',
  DATABASE_URL: 'postgres://user:password123@db/prod',
  API_KEY: 'secret-key',
  REPLICAS: 1,
  LOG_LEVEL: 'debug',
});
// errors: [
//   'DATABASE_URL contains a hardcoded password',
//   'API_KEY appears to be a weak or hardcoded value',
//   'Production requires REPLICAS >= 2',
//   'Production should not use debug log level',
// ]`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does "build once, deploy many" mean in the context of environment promotion?',
      options: [
        'The same source code is recompiled for each environment',
        'A single Docker image/artefact is built and promoted through dev → staging → prod without rebuilding',
        'Only one deployment is allowed per day across all environments',
        'Build scripts are shared across environments but run separately',
      ],
      answer: 1,
      explanation: '"Build once, deploy many" means the artefact (Docker image, binary) is built exactly once with a git SHA tag, then promoted through environments. This guarantees what passes testing in staging is bit-for-bit identical to what runs in production.',
    },
    {
      q: 'What is the primary benefit of ephemeral environments?',
      options: [
        'They are cheaper to run than permanent environments',
        'They eliminate shared mutable state — each PR gets an isolated environment, preventing one branch from breaking others',
        'They make rollbacks easier in production',
        'They reduce the number of environment tiers needed',
      ],
      answer: 1,
      explanation: 'Ephemeral environments give each PR its own isolated deployment, eliminating "staging is broken for everyone" scenarios caused by a bad deploy from another team. They are created on PR open and destroyed on merge.',
    },
    {
      q: 'What is the main purpose of a feature flag (feature toggle)?',
      options: [
        'To switch between different database schemas without downtime',
        'To enable/disable code paths at runtime without redeployment, decoupling deploy from release',
        'To toggle between dark and light mode in the UI',
        'To switch between microservices versions in a service mesh',
      ],
      answer: 1,
      explanation: 'Feature flags decouple deployment from release. Code can be deployed to production in a disabled state, then progressively enabled (internal users → canary → full rollout) without any new deployment.',
    },
    {
      q: 'What is an environment promotion gate?',
      options: [
        'A Kubernetes admission controller that validates pod specs',
        'A set of automated checks (tests, scans, approvals) that must pass before an artefact can move to the next environment',
        'A DNS change that routes traffic from one environment to another',
        'A scheduled maintenance window for production deployments',
      ],
      answer: 1,
      explanation: 'Promotion gates are automated quality checks between environments. Examples: tests pass, coverage threshold met, security scan clean, performance benchmark met. Only artefacts that pass all gates are promoted to the next environment.',
    },
    {
      q: 'Which of the following is the correct approach to secrets management across environments?',
      options: [
        'Store secrets in config files committed to a private git repository',
        'Use the same credentials across dev, staging, and prod for simplicity',
        'Each environment has its own credentials fetched from a secrets manager at deploy/runtime',
        'Encrypt secrets with base64 and store them in environment variable files',
      ],
      answer: 2,
      explanation: 'Per-environment secrets from a secrets manager (Vault, Key Vault, Secrets Manager) is the correct approach. Each environment has isolated credentials so rotating prod secrets does not affect staging. Base64 is encoding, not encryption — it provides no security.',
    },
    {
      q: 'What is "environment parity" and why does it matter?',
      options: [
        'Running the same number of instances in dev and production',
        'Keeping dev, staging, and production environments as similar as possible — same OS, same dependencies, same config structure — to eliminate "works on my machine" failures',
        'Using the same deployment pipeline for all environments',
        'Ensuring all environments use the same cloud provider'],
      answer: 1,
      explanation: 'Environment parity (from 12-Factor App) means minimising differences between environments. When dev uses SQLite and prod uses PostgreSQL, bugs only appearing in production. When dev uses an older Node.js version, code that passes locally fails in CI. Strategies: Docker containers (same runtime everywhere), docker-compose for local service dependencies, same Terraform modules with different variable files, environment-specific config injected via env vars not code.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How many environments should a team have?',
      a: 'As few as necessary. The minimum viable set is: local dev + one integration/test environment + production. Staging adds value when you need a full production-like environment for final acceptance testing or performance tests. Every additional tier adds maintenance cost — only add tiers you actively use and that provide genuine quality gates.',
    },
    {
      q: 'What is the difference between a canary deployment and a feature flag?',
      a: 'A canary deployment routes a percentage of traffic to a new version of the service (e.g. 5% of requests go to v2). A feature flag enables a code path for a percentage of users within the same service version. Canary is an infrastructure-level traffic split; feature flags are application-level toggles. They solve related but different problems and are often used together.',
    },
    {
      q: 'How do you handle database migrations across environments?',
      a: 'Run migrations as part of the deployment pipeline, before the new application version starts. Each environment has its own database — migrations applied to dev first, then staging (and tested), then prod. Use a migration tool (Flyway, Liquibase, EF Core Migrations) that tracks which migrations have run. Never run migrations directly against production by hand.',
    },
    {
      q: 'What is environment drift and how do you prevent it?',
      a: 'Environment drift happens when environments diverge over time — someone manually changes a config in prod, or a package is installed on staging but not dev. Prevention: enforce IaC for all infrastructure changes (no manual SSH), run periodic drift detection (terraform plan to verify no unmanaged changes), and treat any manual change as a bug to be codified.',
    },
    {
      q: 'When should you use separate AWS accounts vs separate namespaces for environments?',
      a: 'Separate AWS accounts give the strongest isolation: independent IAM, billing, service limits, and blast radius. Use for prod vs non-prod at minimum. Separate Kubernetes namespaces within one account are cheaper but share IAM and the control plane — good for ephemeral PR environments or dev tiers. The rule: the higher the risk of a non-prod action affecting prod, the stronger the isolation needed.',
    },
    {
      q: 'How do you manage configuration differences across environments without hardcoding them?',
      a: 'The 12-Factor App principle: config belongs in the environment, not the code. Strategies: (1) Environment variables — store all env-specific config (DB URLs, API keys, feature flags) in env vars. Inject via Docker --env-file, Kubernetes ConfigMaps/Secrets, or cloud-native parameter stores (AWS SSM, Azure App Config). (2) Config maps per environment — Helm values files (values-dev.yaml, values-prod.yaml) with environment-specific overrides. (3) External config services — AWS AppConfig, Azure App Configuration, HashiCorp Consul — enable runtime config changes without redeployment. Never commit secrets to Git; use sealed secrets, external-secrets-operator, or Vault for production secrets.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Environment strategy is about keeping environments consistent, isolated, and automated — so what passes testing in staging is exactly what runs in production.',
    mustKnow: [
      'Environment parity: same OS, runtime, DB version across dev/staging/prod',
      '"Build once, deploy many" — same artefact promoted, only config changes per environment',
      'Ephemeral environments: created per PR, destroyed on merge — eliminates shared-state problems',
      'Feature flags decouple deploy from release — code ships disabled, then progressively enabled',
      'Secrets per environment, fetched from a secrets manager — never in source control',
      'Promotion gates: automated checks that must pass before advancing to next environment',
      'Snowflake environments (manual config) cause drift and "works in staging" bugs',
    ],
    interviewFocus: [
      'Explain "build once, deploy many" and why rebuilding per environment is an anti-pattern',
      'What is an ephemeral environment and when would you use one?',
      'How do feature flags decouple deploy from release? Give a rollout lifecycle',
      'How do you manage secrets across multiple environments without hardcoding them?',
    ],
  };
}
