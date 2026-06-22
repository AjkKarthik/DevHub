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
  selector: 'app-tf-cicd',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './cicd.html',
  styleUrl: './cicd.scss',
})
export class TfCicd {
  quickRef: QuickRefItem[] = [
    { name: 'terraform plan -out=plan.tfplan', type: 'keyword', desc: 'Save plan file for deterministic apply in CI.' },
    { name: 'terraform apply plan.tfplan',     type: 'keyword', desc: 'Apply the exact saved plan — no interactive prompt.' },
    { name: 'TF_VAR_name',                    type: 'keyword', desc: 'Pass variable values via environment variables.' },
    { name: 'OIDC / Workload Identity',        type: 'keyword', desc: 'Keyless auth — no long-lived credentials in CI.' },
    { name: 'Atlantis',                        type: 'keyword', desc: 'PR-driven Terraform automation server.' },
    { name: 'terraform fmt -check',           type: 'keyword', desc: 'Fail CI if HCL is not formatted.' },
    { name: 'terraform validate',             type: 'keyword', desc: 'Syntax/type check without provider API calls.' },
    { name: 'TF_IN_AUTOMATION=true',          type: 'keyword', desc: 'Suppresses interactive hints in CI output.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'CI/CD Principles for Terraform',
      points: [
        'Pull request workflow: plan on PR open/update, apply on merge to main — never apply from local.',
        'Plan is not apply: always save the plan file (-out) and apply exactly that file, not a fresh plan.',
        'State locking: remote backend (S3+DynamoDB, Terraform Cloud) prevents concurrent applies in CI.',
        'Secrets in CI: never hardcode credentials — use OIDC (keyless), secret managers, or CI vault integration.',
        'Set TF_IN_AUTOMATION=true to suppress interactive prompts and hints in CI output.',
      ],
    },
    {
      heading: 'GitHub Actions Workflow',
      points: [
        'Use OIDC with aws-actions/configure-aws-credentials@v4 — no static AWS keys in CI.',
        'Run terraform fmt -check, terraform validate, and tflint on PR — fail fast on style/syntax issues.',
        'Comment the plan output on the PR using hashicorp/setup-terraform outputs.',
        'Apply only on push to main (after merge) — never apply from feature branches.',
        'Cache .terraform/ directory or use provider mirror to speed up init.',
      ],
    },
    {
      heading: 'Atlantis',
      points: [
        'Atlantis runs as a webhook server — GitHub/GitLab/Bitbucket webhooks trigger plan and apply.',
        'atlantis plan on a PR comment → Atlantis posts plan output as a PR comment.',
        'atlantis apply after approval → Atlantis applies and merges PR when clean.',
        'Atlantis requires access to your state backend and cloud provider — runs in your own infrastructure.',
        'atlantis.yaml controls which directories/workspaces to plan and which approval rules to enforce.',
      ],
    },
    {
      heading: 'OIDC Keyless Authentication',
      points: [
        'OIDC lets GitHub Actions assume an IAM role without storing AWS_SECRET_ACCESS_KEY in CI.',
        'Configure a GitHub OIDC identity provider in AWS IAM; create a role with trust policy allowing the repo.',
        'In the workflow: use aws-actions/configure-aws-credentials with role-to-assume — no static keys.',
        'Same pattern for Azure (azure/login@v2 with federated credential) and GCP (google-github-actions/auth).',
        'OIDC tokens are short-lived and scoped — far more secure than rotating long-lived access keys.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'GitHub Actions — Plan',
      language: 'bash',
      code: `# .github/workflows/terraform-plan.yml
name: Terraform Plan
on:
  pull_request:
    branches: [main]

permissions:
  id-token: write   # OIDC
  contents: read
  pull-requests: write

jobs:
  plan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS Credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsRole
          aws-region: us-east-1

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: "1.9.0"

      - name: Terraform Init
        run: terraform init
        env:
          TF_IN_AUTOMATION: "true"

      - name: Terraform Format Check
        run: terraform fmt -check -recursive

      - name: Terraform Validate
        run: terraform validate

      - name: Terraform Plan
        id: plan
        run: terraform plan -out=plan.tfplan -no-color
        env:
          TF_VAR_environment: production

      - name: Comment Plan on PR
        uses: actions/github-script@v7
        with:
          script: |
            const output = \`\${{ steps.plan.outputs.stdout }}\`;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '### Terraform Plan\\n\`\`\`hcl\\n' + output + '\\n\`\`\`'
            })`,
    },
    {
      label: 'GitHub Actions — Apply',
      language: 'bash',
      code: `# .github/workflows/terraform-apply.yml
name: Terraform Apply
on:
  push:
    branches: [main]

permissions:
  id-token: write
  contents: read

jobs:
  apply:
    runs-on: ubuntu-latest
    environment: production   # requires manual approval in GitHub Environments
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS Credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsRole
          aws-region: us-east-1

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: "1.9.0"

      - name: Terraform Init
        run: terraform init
        env:
          TF_IN_AUTOMATION: "true"

      - name: Terraform Plan
        run: terraform plan -out=plan.tfplan
        env:
          TF_VAR_environment: production

      # Apply the EXACT saved plan — no drift between plan and apply
      - name: Terraform Apply
        run: terraform apply -auto-approve plan.tfplan`,
    },
    {
      label: 'Atlantis Config',
      language: 'bash',
      code: `# atlantis.yaml — in repo root
version: 3
automerge: true
delete_source_branch_on_merge: true

projects:
  - name: infra-prod
    dir: environments/prod
    workspace: default
    terraform_version: v1.9.0
    apply_requirements:
      - approved           # PR must be approved before apply
      - mergeable          # PR must be mergeable (no conflicts)
    workflow: prod

  - name: infra-staging
    dir: environments/staging
    workspace: default
    terraform_version: v1.9.0

workflows:
  prod:
    plan:
      steps:
        - init
        - plan:
            extra_args: ["-var-file=prod.tfvars"]
    apply:
      steps:
        - apply`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Running terraform apply in CI without a saved plan',
      wrong: `# CI runs plan then a fresh apply — different resources may apply!
- run: terraform plan
- run: terraform apply -auto-approve
# The apply is a SECOND evaluation — state may have changed between runs`,
      right: `# Save plan file, apply exactly that file
- run: terraform plan -out=plan.tfplan
- run: terraform apply plan.tfplan
# -auto-approve not needed with a plan file
# Guarantees what you reviewed IS what gets applied`,
      explanation: 'Running plan then a separate auto-approve apply means CI evaluates the graph twice. State could change between runs (concurrent pipeline, manual changes). Always save -out and apply the file.',
    },
    {
      title: 'Storing long-lived AWS credentials in CI secrets',
      wrong: `# .github/workflows/apply.yml
env:
  AWS_ACCESS_KEY_ID: \${{ secrets.AWS_ACCESS_KEY_ID }}
  AWS_SECRET_ACCESS_KEY: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
# Rotated? Leaked? Security incident waiting to happen`,
      right: `# OIDC — no static credentials
permissions:
  id-token: write
steps:
  - uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: arn:aws:iam::123456789012:role/CIRole
      aws-region: us-east-1
# Short-lived token, scoped to this repo/branch`,
      explanation: 'OIDC lets the workflow assume an IAM role without storing static credentials. Tokens are short-lived, auditable, and scoped — no rotation needed and no secrets to leak.',
    },
    {
      title: 'Not locking the Terraform version in CI',
      wrong: `# setup-terraform without pinning version
- uses: hashicorp/setup-terraform@v3
# Uses latest — plan output can differ between runs if TF version changes`,
      right: `- uses: hashicorp/setup-terraform@v3
  with:
    terraform_version: "1.9.0"  # exact version
# Also add required_version = "~> 1.9" in terraform {} block
# .terraform-version file also read by tfenv`,
      explanation: 'Unpinned Terraform versions cause non-deterministic CI. A minor version upgrade can change plan output format or provider behavior. Pin the exact version in both setup-terraform and required_version.',
    },
  ];

  challenge: Challenge = {
    title: 'Write a GitHub Actions Terraform Plan Workflow',
    language: 'typescript',
    description: 'Write a complete GitHub Actions workflow file that: triggers on PRs to main, uses OIDC to assume an AWS role (arn:aws:iam::111111111111:role/TFRole), initializes Terraform, runs fmt check and validate, saves plan to plan.tfplan, and posts the plan output as a PR comment. Use TF_IN_AUTOMATION=true.',
    hints: [
      'permissions: id-token: write, pull-requests: write',
      'aws-actions/configure-aws-credentials@v4 with role-to-assume',
      'terraform plan -out=plan.tfplan -no-color',
      'github-script action to post comment',
    ],
    starterCode: `# .github/workflows/tf-plan.yml
name: Terraform Plan
on:
  pull_request:
    branches: [main]

permissions:
  # TODO: OIDC + PR write

jobs:
  plan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # TODO: OIDC credentials
      # TODO: setup-terraform pinned version
      # TODO: init, fmt check, validate
      # TODO: plan -out=plan.tfplan
      # TODO: post plan as PR comment`,
    solution: `# .github/workflows/tf-plan.yml
name: Terraform Plan
on:
  pull_request:
    branches: [main]

permissions:
  id-token: write
  contents: read
  pull-requests: write

jobs:
  plan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::111111111111:role/TFRole
          aws-region: us-east-1

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: "1.9.0"

      - run: terraform init
        env: { TF_IN_AUTOMATION: "true" }

      - run: terraform fmt -check -recursive

      - run: terraform validate

      - id: plan
        run: terraform plan -out=plan.tfplan -no-color

      - uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '### Plan\n\`\`\`\n' + \`\${{ steps.plan.outputs.stdout }}\` + '\n\`\`\`'
            })`,
  };

  quiz: QuizQuestion[] = [
    { q: 'Why save a plan file with -out instead of running apply separately?', options: ['Plans are faster', 'The plan file guarantees what you reviewed is exactly what gets applied', 'It skips locking', 'It avoids provider initialization'], answer: 1, explanation: 'The -out plan file is deterministic. Applying a fresh plan risks drift between the review stage and apply stage (concurrent changes, state updates). The saved file locks in exactly what was planned.' },
    { q: 'What does TF_IN_AUTOMATION=true do?', options: ['Enables auto-approve', 'Suppresses interactive hints and prompts in CI output', 'Skips state locking', 'Formats output as JSON'], answer: 1, explanation: 'TF_IN_AUTOMATION=true tells Terraform it is running in CI. It suppresses hints like "Run terraform apply..." which would clutter CI logs and confuse parsing.' },
    { q: 'What is OIDC authentication advantage in CI?', options: ['Faster plan execution', 'No long-lived credentials stored in CI secrets — short-lived tokens only', 'Works without a backend', 'Allows parallel applies'], answer: 1, explanation: 'OIDC lets the CI workflow assume a cloud role using a short-lived JWT. No static access keys are stored in CI secrets, eliminating the rotation/leakage problem.' },
    { q: 'What does Atlantis do?', options: ['A Terraform GUI dashboard', 'A PR-based automation server that plans on PR and applies on merge', 'A testing framework', 'A drift detection service'], answer: 1, explanation: 'Atlantis is an open-source Terraform automation server. It listens to PR webhooks, runs terraform plan, posts output as comments, and applies on PR merge after approval.' },
  ];

  qna: QnaItem[] = [
    { q: 'How do you handle multiple environments in CI?', a: 'Use matrix strategies (GitHub Actions matrix) or separate workflow files per environment. Directory-per-environment pattern works well: environments/dev, environments/staging, environments/prod — each runs independently with separate state backends.' },
    { q: 'Should I run terraform apply automatically or require approval?', a: 'For production, always require an explicit approval gate — GitHub Environments with required reviewers, or Atlantis apply_requirements: [approved]. Only staging/dev should be automatic. Never auto-apply to production from CI without a human review.' },
    { q: 'How do I pass secrets to Terraform in CI?', a: 'Use TF_VAR_name environment variables set from CI secret store. For cloud secrets (API keys, DB passwords), prefer reading them from a secret manager (AWS Secrets Manager, Vault) inside the HCL using a data source rather than injecting via CI.' },
    { q: 'What is Terraform Cloud vs self-hosted CI?', a: 'Terraform Cloud provides managed plan/apply, remote state, policy enforcement (Sentinel), and cost estimation. Self-hosted CI (GitHub Actions + S3 backend) is cheaper and gives more control. Terraform Cloud is worth it for teams wanting managed execution and audit trails.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Terraform CI/CD: plan on PR (save -out file), apply on merge with OIDC auth — never apply a fresh plan without review.',
    mustKnow: [
      'terraform plan -out=plan.tfplan → terraform apply plan.tfplan (deterministic)',
      'TF_IN_AUTOMATION=true suppresses interactive prompts in CI',
      'OIDC: keyless AWS auth with role-to-assume — no static keys in CI secrets',
      'Pin Terraform version in setup-terraform and required_version',
      'Atlantis: PR webhooks trigger plan/apply with approval gates',
      'Apply to production only after human review — use GitHub Environments or Atlantis requirements',
    ],
    interviewFocus: [
      'Why save a plan file in CI instead of running apply directly?',
      'How do you authenticate Terraform in GitHub Actions without static credentials?',
      'What approval controls do you put around production applies?',
    ],
  };
}
