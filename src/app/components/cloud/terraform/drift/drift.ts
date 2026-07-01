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
  selector: 'app-tf-drift',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './drift.html',
  styleUrl: './drift.scss',
})
export class TfDrift {
  quickRef: QuickRefItem[] = [
    { name: 'terraform plan -refresh-only', type: 'keyword', desc: 'Show drift without proposing config changes.' },
    { name: 'terraform apply -refresh-only', type: 'keyword', desc: 'Update state to match real infra (no resource changes).' },
    { name: 'terraform refresh',             type: 'keyword', desc: 'Deprecated equivalent of apply -refresh-only.' },
    { name: '-refresh=false',               type: 'keyword', desc: 'Skip provider API refresh — faster plan, but stale state.' },
    { name: 'ignore_changes',               type: 'keyword', desc: 'Lifecycle rule — ignore specific attribute changes in plan.' },
    { name: 'Drift report',                 type: 'keyword', desc: 'Scheduled CI job running plan and alerting on non-empty output.' },
    { name: 'Terraform Cloud drift',        type: 'keyword', desc: 'Built-in scheduled drift detection with notifications.' },
    { name: 'terraform plan -detailed-exitcode', type: 'keyword', desc: 'Exit 2 means changes present — useful for drift CI check.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is Drift?',
      points: [
        'Drift: real infrastructure differs from what Terraform state (and HCL) describe.',
        'Causes: manual console changes, automated systems modifying resources, provider-side auto-updates.',
        'Every terraform plan performs a refresh by default — provider APIs are called to fetch current state.',
        'Plan shows drift as proposed changes to bring reality back in line with HCL.',
        'Undetected drift accumulates and leads to surprises during the next apply — catch it early.',
      ],
    },
    {
      heading: 'terraform plan -refresh-only',
      points: [
        '-refresh-only: plan shows only what changed outside Terraform — no config-driven changes.',
        'Output: "~ resource.name: attribute changed from X to Y" — these are real infrastructure changes.',
        'terraform apply -refresh-only: updates state to match real infra without modifying resources.',
        'Use case: a team member manually added a tag in the console — refresh-only accepts it into state.',
        'Replaces terraform refresh (deprecated in TF 0.15) — -refresh-only is safer and reviewable.',
      ],
    },
    {
      heading: 'Automated Drift Detection',
      points: [
        'Schedule a CI job (nightly or hourly) that runs terraform plan -detailed-exitcode.',
        '-detailed-exitcode: exit 0 = no changes, exit 1 = error, exit 2 = changes detected.',
        'If exit code is 2, alert the team (Slack, PagerDuty, GitHub issue) — drift found.',
        'Terraform Cloud: built-in drift detection with scheduled runs and health assessments.',
        'Parse plan JSON (terraform show -json plan.tfplan) for structured drift reporting.',
      ],
    },
    {
      heading: 'Responding to Drift',
      points: [
        'Option 1 — Fix drift: revert the manual change by running terraform apply (HCL wins).',
        'Option 2 — Accept drift: run -refresh-only apply to update state to match reality, then update HCL.',
        'Option 3 — Ignore in plan: lifecycle { ignore_changes = [tags] } to suppress tag drift noise.',
        'Avoid option 3 for structural attributes — only use ignore_changes for truly ephemeral fields.',
        'Root cause: prevent drift by restricting console access (IAM deny on resource modification).',
      ],
    },
    {
      heading: 'Preventing and Detecting Configuration Drift',
      points: [
        'Configuration drift occurs when actual infrastructure state diverges from what Terraform believes it manages — typically caused by manual changes made directly in a cloud console, bypassing Terraform entirely, which Terraform has no visibility into until the next plan or refresh.',
        'terraform plan (which implicitly refreshes state before comparing against configuration) is the primary drift detection mechanism — running plan regularly, even without intending to apply changes, surfaces drift early before it accumulates into a larger, harder-to-reconcile discrepancy.',
        'Scheduled drift detection (running terraform plan on a schedule via CI and alerting if it reports unexpected changes) catches drift proactively rather than discovering it only when someone happens to run Terraform manually — valuable for infrastructure that multiple people or systems might touch outside Terraform.',
        'The most effective long-term drift prevention is organizational, not technical — restricting direct console/API access to production infrastructure (enforcing that ALL changes go through Terraform) eliminates the root cause of drift rather than only detecting it after the fact.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Detect & Accept Drift',
      language: 'bash',
      code: `# Detect drift — shows what changed outside Terraform
terraform plan -refresh-only

# Output example:
# ~ aws_security_group.web
#   ~ ingress {
#       + from_port = 8080   # manually added in console
#     }

# Review: is this intentional? If yes, accept into state:
terraform apply -refresh-only
# State is now updated to match reality — no real infra changes made

# Then: decide whether to add the change to HCL (to preserve it)
# OR revert by running: terraform apply (will remove the manual change)

# ---- Revert drift (HCL wins) ----
terraform plan   # shows: "-" remove the manual ingress rule
terraform apply  # removes manual change, restores HCL state`,
    },
    {
      label: 'Automated Drift CI Job',
      language: 'bash',
      code: `# .github/workflows/drift-detection.yml
name: Drift Detection
on:
  schedule:
    - cron: '0 6 * * 1-5'   # 6am UTC Mon-Fri
  workflow_dispatch:           # manual trigger

jobs:
  detect-drift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/TerraformReadRole
          aws-region: us-east-1

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: "1.9.0"

      - run: terraform init
        env: { TF_IN_AUTOMATION: "true" }

      # Exit code 2 = drift detected; exit 0 = no drift
      - name: Check for Drift
        id: drift
        run: terraform plan -refresh-only -detailed-exitcode -no-color -out=drift.tfplan || true
        continue-on-error: true

      - name: Alert on Drift
        if: steps.drift.outcome == 'failure'  # exit code 2
        uses: slackapi/slack-github-action@v1
        with:
          payload: '{"text":"⚠️ Terraform drift detected in production! Run: terraform plan -refresh-only"}'
        env:
          SLACK_WEBHOOK_URL: \${{ secrets.SLACK_WEBHOOK }}`,
    },
    {
      label: 'ignore_changes Pattern',
      language: 'bash',
      code: `# Suppress drift noise for attributes that legitimately change externally

resource "aws_autoscaling_group" "app" {
  name             = "app-asg"
  min_size         = 1
  max_size         = 10
  desired_capacity = 3

  lifecycle {
    # Ignore desired_capacity — auto-scaling changes this dynamically
    ignore_changes = [desired_capacity]
  }
}

resource "aws_instance" "web" {
  ami           = "ami-0c02fb55956c7d316"
  instance_type = "t3.micro"

  lifecycle {
    # Ignore tag changes made by external cost-allocation tools
    ignore_changes = [tags["LastModifiedBy"], tags["CostCenter"]]
  }
}

# WARNING: ignore_changes hides real drift — use sparingly.
# Never use ignore_changes = all unless you are intentionally
# abandoning Terraform management of that resource.`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Running terraform apply instead of -refresh-only to sync state',
      wrong: `# Drift: team member manually scaled up RDS to db.t3.large
# Running apply to "sync":
terraform apply   # WRONG — this reverts the manual change back to db.t3.micro!
# Terraform applies HCL, not the real state`,
      right: `# First check what drifted:
terraform plan -refresh-only
# Accept the drift into state (no infra change):
terraform apply -refresh-only
# Then update HCL to match:
# instance_class = "db.t3.large"
# Now plan shows no changes`,
      explanation: 'terraform apply applies your HCL — it will revert manual changes. Use -refresh-only to update state to match reality without changing real infrastructure. Then update HCL if the change should be permanent.',
    },
    {
      title: 'Using ignore_changes = all on critical resources',
      wrong: `resource "aws_db_instance" "main" {
  # ...
  lifecycle {
    ignore_changes = all   # "convenient" — Terraform ignores everything!
  }
}
# Security patches, engine upgrades, storage changes — all hidden!`,
      right: `resource "aws_db_instance" "main" {
  # ...
  lifecycle {
    # Only ignore attributes that legitimately drift (e.g. minor_version_upgrade auto-managed)
    ignore_changes = [latest_restorable_time, ca_cert_identifier]
    prevent_destroy = true
  }
}`,
      explanation: 'ignore_changes = all means Terraform never detects or fixes ANY change to that resource. Security-critical changes become invisible. Be specific — only ignore attributes you genuinely need to exclude.',
    },
    {
      title: 'Not using -detailed-exitcode in drift CI scripts',
      wrong: `# drift-check.sh
terraform plan -refresh-only
if [ $? -ne 0 ]; then
  echo "Drift detected!"
fi
# plan exits 0 on SUCCESS (changes found) — this never alerts!`,
      right: `terraform plan -refresh-only -detailed-exitcode
EXIT_CODE=$?
if [ $EXIT_CODE -eq 2 ]; then
  echo "Drift detected — sending alert"
  # send Slack/PagerDuty notification
elif [ $EXIT_CODE -eq 1 ]; then
  echo "Plan error — check credentials/state"
fi
# Exit 0 = no drift, Exit 1 = error, Exit 2 = drift/changes found`,
      explanation: 'terraform plan exits 0 when it succeeds (even with changes). Use -detailed-exitcode: exit 2 means changes were found. Without it, your drift check always reports "no drift" even when drift exists.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a Drift Detection Workflow',
    language: 'typescript',
    description: 'Write a GitHub Actions workflow that runs every weekday at 7am UTC, uses OIDC for AWS auth (role arn:aws:iam::999999999999:role/DriftRole), runs terraform plan -refresh-only -detailed-exitcode, and posts a message to a Slack webhook stored in secrets.SLACK_DRIFT_WEBHOOK if drift is detected (exit code 2). The job should not fail if exit code is 2 (continue-on-error).',
    hints: [
      'cron: "0 7 * * 1-5" for weekday 7am UTC',
      '-detailed-exitcode: exit 0=no drift, 1=error, 2=drift',
      'continue-on-error: true on the plan step',
      'if: steps.plan.outcome == "failure" triggers on exit 2',
    ],
    starterCode: `# .github/workflows/drift.yml
name: Drift Detection
on:
  schedule:
    # TODO: weekday 7am UTC cron

permissions:
  id-token: write
  contents: read

jobs:
  drift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # TODO: OIDC AWS auth
      # TODO: setup-terraform
      # TODO: init
      # TODO: plan -refresh-only -detailed-exitcode (continue-on-error)
      # TODO: Slack alert if drift found`,
    solution: `# .github/workflows/drift.yml
name: Drift Detection
on:
  schedule:
    - cron: '0 7 * * 1-5'

permissions:
  id-token: write
  contents: read

jobs:
  drift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::999999999999:role/DriftRole
          aws-region: us-east-1

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: "1.9.0"

      - run: terraform init
        env: { TF_IN_AUTOMATION: "true" }

      - name: Check Drift
        id: plan
        run: terraform plan -refresh-only -detailed-exitcode -no-color
        continue-on-error: true

      - name: Alert Slack
        if: steps.plan.outcome == 'failure'
        uses: slackapi/slack-github-action@v1
        with:
          payload: '{"text":"Drift detected in prod! Review: terraform plan -refresh-only"}'
        env:
          SLACK_WEBHOOK_URL: \${{ secrets.SLACK_DRIFT_WEBHOOK }}`,
  };

  quiz: QuizQuestion[] = [
    { q: 'What does terraform plan -refresh-only show?', options: ['Config changes to apply', 'Differences between real infrastructure and Terraform state', 'Module dependency graph', 'Provider version updates'], answer: 1, explanation: '-refresh-only queries the provider APIs and shows how real infrastructure differs from what is in state — without proposing any config-driven changes. Pure drift view.' },
    { q: 'What does terraform apply -refresh-only do to real infrastructure?', options: ['Destroys drifted resources', 'Makes no changes to infrastructure — only updates the state file', 'Reverts manual changes', 'Recreates all resources'], answer: 1, explanation: '-refresh-only apply updates the Terraform state to match real infrastructure without making any API calls that change resources. It accepts drift into state.' },
    { q: 'What exit code does -detailed-exitcode return when drift is detected?', options: ['Exit 0', 'Exit 1', 'Exit 2', 'Exit 3'], answer: 2, explanation: '-detailed-exitcode returns: 0 = success, no changes; 1 = error; 2 = success but changes (drift) detected. Use this in CI scripts to differentiate "no drift" from "drift found".' },
    { q: 'When should you use ignore_changes in lifecycle?', options: ['For all resources to speed up plan', 'For specific attributes that legitimately change outside Terraform', 'To prevent all resource updates', 'To disable state refresh'], answer: 1, explanation: 'ignore_changes should be used sparingly for specific attributes that are intentionally managed outside Terraform (e.g. autoscaling desired_capacity, tags set by external tools). Never use ignore_changes = all on production resources.' },
  { q: 'What causes infrastructure drift in Terraform-managed environments?', options: ['Running terraform init updates providers automatically causing drift', 'Manual changes made via cloud consoles or CLIs outside of Terraform workflows', 'Using variables instead of hardcoded values in configurations', 'Upgrading Terraform provider versions in the configuration'], answer: 1, explanation: 'Drift occurs when the actual state of infrastructure differs from what Terraform state records. Common causes: manual changes via the cloud console or CLI, changes made by other automation tools, automatic changes by cloud services like auto-scaling, and expiring temporary resources. Drift makes terraform plan show changes even when no code was modified and can cause apply to fail or undo intentional changes.' },
  { q: 'How does terraform plan detect configuration drift?', options: ['It compares the config file timestamp to the state file timestamp', 'It calls the provider API to read current resource attributes and compares them to state', 'It scans cloud billing records for untracked resources', 'It only detects drift when run with a special --drift flag'], answer: 1, explanation: 'terraform plan calls the provider Read function for each resource in state, fetching current attributes from the cloud API. It then diffs the current attributes against the stored state and the desired configuration. Resources modified outside of Terraform show as changes to revert in the plan. This real-time API check is why plan can be slow for large configurations with many resources.' },
  ];

  qna: QnaItem[] = [
    { q: 'How often should I run drift detection?', a: 'For production, daily (nightly job) is a common baseline. For high-risk environments, hourly makes sense. Terraform Cloud\'s health assessments can run every 1-24 hours. Balance frequency against provider API rate limits and cost.' },
    { q: 'How do I prevent drift from happening in the first place?', a: 'Restrict console/CLI access via IAM policies — deny Modify/Create/Delete on resources managed by Terraform. Use SCPs (AWS) or Azure Policy to enforce. With strict IAM, drift can only happen through Terraform.' },
    { q: 'What is the difference between -refresh-only and terraform refresh?', a: 'terraform refresh (deprecated since TF 0.15) updated state immediately without a review step. -refresh-only creates a reviewable plan first — you see what would change in state before committing. Always prefer -refresh-only.' },
    { q: 'Can I detect drift across many workspaces at once?', a: 'Terraform Cloud runs drift detection per workspace with scheduling. For self-hosted, use a matrix CI job that iterates over directories/workspaces. Tools like Atlantis also support scheduled drift jobs per configured project.' },
  { q: 'How do you remediate drift without disrupting production infrastructure?', a: 'Option 1: if the manual change was correct, update the Terraform configuration to match the new state, then run apply to reconcile. Option 2: use terraform apply -refresh-only to update the state file to match actual infrastructure without making further changes to resources. Option 3: run apply to revert the manual change back to the Terraform-declared state. For critical production systems, prefer option 2 (accepting the manual change) or carefully test option 3 in a lower environment first. Always review the plan output before applying drift remediation.' },
  { q: 'What strategies prevent drift from occurring in the first place?', a: 'Key prevention strategies: enforce no-manual-changes policies using cloud service control policies in AWS or Azure Policies that require all changes to go through Terraform. Use GitOps workflows where every infrastructure change is a pull request that triggers a plan for review. Run scheduled terraform plan jobs that alert when the plan is non-empty outside deployment windows. Audit cloud API calls with CloudTrail or Azure Monitor to detect console-based changes. Use Atlantis or Terraform Cloud to centralize all Terraform runs and prevent local ad-hoc applies by team members.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Drift = real infra differs from state. Detect with plan -refresh-only; accept with apply -refresh-only; prevent with IAM controls and automated detection jobs.',
    mustKnow: [
      'terraform plan -refresh-only: shows what changed outside Terraform (pure drift view)',
      'terraform apply -refresh-only: updates state to match reality — no real infra changes',
      '-detailed-exitcode: 0=no changes, 1=error, 2=changes detected — use in CI drift scripts',
      'ignore_changes: suppress plan noise for specific legitimate drift — use sparingly',
      'Scheduled CI drift job alerts on exit code 2 before manual changes accumulate',
      'Prevent drift at source: restrict IAM console access on Terraform-managed resources',
    ],
    interviewFocus: [
      'What is Terraform drift and how do you detect it?',
      'Difference between terraform plan and terraform plan -refresh-only',
      'How would you set up automated drift detection in CI?',
    ],
  };
}
