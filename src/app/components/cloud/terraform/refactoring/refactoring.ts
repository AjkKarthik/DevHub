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
  selector: 'app-tf-refactoring',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './refactoring.html',
  styleUrl: './refactoring.scss',
})
export class TfRefactoring {
  quickRef: QuickRefItem[] = [
    { name: 'moved {}',             type: 'syntax',  desc: 'Declarative state move (TF 1.1+) — no CLI command needed.' },
    { name: 'terraform state mv',   type: 'keyword', desc: 'Imperative: rename/move resource address in state.' },
    { name: 'terraform state rm',   type: 'keyword', desc: 'Remove a resource from state without destroying it.' },
    { name: 'removed {}',           type: 'syntax',  desc: 'Declarative state removal with lifecycle destroy option (TF 1.7+).' },
    { name: 'terraform state list', type: 'keyword', desc: 'Show all resource addresses tracked in state.' },
    { name: 'terraform state pull', type: 'keyword', desc: 'Download current state JSON for inspection or backup.' },
    { name: '-target=resource',     type: 'keyword', desc: 'Apply/plan only a specific resource — use sparingly.' },
    { name: 'for_each migration',   type: 'keyword', desc: 'Splitting count-indexed resources to for_each keyed.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why Refactoring is Risky',
      points: [
        'Terraform identifies resources by their address (e.g. aws_instance.web). Renaming in HCL = destroy + recreate.',
        'State operations separate the HCL rename from state — you tell Terraform "this is the same resource, just renamed".',
        'Always run terraform plan after any state operation to verify zero destructive changes.',
        'Take a state backup before any mutation: terraform state pull > backup.tfstate.',
        'Prefer declarative moved {} / removed {} blocks over imperative terraform state mv — they are version-controlled.',
      ],
    },
    {
      heading: 'moved {} Block (TF 1.1+)',
      points: [
        'moved {} in HCL tells Terraform that a resource was renamed — no state CLI command needed.',
        'from: old address, to: new address — both in the same HCL file.',
        'Applies automatically on the next terraform apply — state is updated transparently.',
        'moved {} blocks can be left in the codebase permanently or removed after all team members have applied.',
        'Supports moving into/out of modules: from = aws_instance.web, to = module.compute.aws_instance.web.',
      ],
    },
    {
      heading: 'Breaking Monoliths',
      points: [
        'Monolithic root modules grow to hundreds of resources — hard to plan, risky to apply, slow in CI.',
        'Break by responsibility: extract network, compute, database into separate state backends.',
        'Migration pattern: add moved {} to move resources into new module addresses; verify plan shows 0 changes.',
        'terraform_remote_state: new modules read outputs from existing state without coupling code.',
        'Incremental extraction is safer than big-bang rewrites — move one resource group at a time.',
      ],
    },
    {
      heading: 'count to for_each Migration',
      points: [
        'count = 3 creates resources indexed as [0], [1], [2] — deleting index 1 destroys [1] and renumbers [2].',
        'for_each keyed resources (e.g. for_each = toset(["a","b","c"])) are stable — removing "b" leaves "a" and "c" intact.',
        'Migrating: use moved {} to rename aws_instance.web[0] → aws_instance.web["prod"] etc.',
        'After migration, plan should show 0 resource changes — only state address changes.',
        'for_each is always preferred over count for collections of distinct resources.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'moved {} Block',
      language: 'bash',
      code: `# Scenario: rename aws_instance.web → aws_instance.app
# Without moved {}: Terraform destroys web and creates app

# main.tf — add moved block BEFORE renaming the resource
moved {
  from = aws_instance.web
  to   = aws_instance.app
}

# Now rename in HCL:
resource "aws_instance" "app" {  # was "web"
  ami           = "ami-0c02fb55956c7d316"
  instance_type = "t3.micro"
}

# terraform plan → shows 0 resource changes (only state address update)
# terraform apply → updates state, no real infra changes

# --- Moving into a module ---
moved {
  from = aws_instance.app
  to   = module.compute.aws_instance.app
}`,
    },
    {
      label: 'count → for_each Migration',
      language: 'bash',
      code: `# Before: count-indexed resources
resource "aws_instance" "web" {
  count         = 3
  ami           = "ami-0c02fb55956c7d316"
  instance_type = "t3.micro"
  # addresses: aws_instance.web[0], [1], [2]
}

# After: for_each keyed resources (stable on deletion)
locals {
  instances = {
    "prod-a" = "us-east-1a"
    "prod-b" = "us-east-1b"
    "prod-c" = "us-east-1c"
  }
}

resource "aws_instance" "web" {
  for_each          = local.instances
  ami               = "ami-0c02fb55956c7d316"
  instance_type     = "t3.micro"
  availability_zone = each.value
  tags              = { Name = each.key }
  # addresses: aws_instance.web["prod-a"], ["prod-b"], ["prod-c"]
}

# Add moved blocks to migrate state addresses:
moved {
  from = aws_instance.web[0]
  to   = aws_instance.web["prod-a"]
}
moved {
  from = aws_instance.web[1]
  to   = aws_instance.web["prod-b"]
}
moved {
  from = aws_instance.web[2]
  to   = aws_instance.web["prod-c"]
}`,
    },
    {
      label: 'State Commands',
      language: 'bash',
      code: `# Always backup state before any state manipulation!
terraform state pull > backup-$(date +%Y%m%d-%H%M%S).tfstate

# List all tracked resources
terraform state list

# Show a specific resource's attributes
terraform state show aws_instance.web

# Imperative rename (use moved {} instead when possible)
terraform state mv aws_instance.web aws_instance.app
terraform state mv 'module.old.aws_vpc.main' 'module.new.aws_vpc.main'

# Remove resource from state WITHOUT destroying real infra
# Use case: resource was deleted out of band, clean up state
terraform state rm aws_instance.orphan

# Remove multiple resources (e.g. before extracting to new module)
terraform state rm aws_instance.web[0] aws_instance.web[1]

# After ANY state manipulation: verify
terraform plan   # must show no destructive changes!`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Renaming a resource in HCL without moved {}',
      wrong: `# main.tf — just rename the resource label
resource "aws_instance" "app" {   # was "web"
  ami           = "ami-0c02fb55956c7d316"
  instance_type = "t3.micro"
}
# terraform plan shows: -/+ destroy web + create app = DOWNTIME!`,
      right: `# Add moved {} FIRST, then rename
moved {
  from = aws_instance.web
  to   = aws_instance.app
}
resource "aws_instance" "app" {
  ami           = "ami-0c02fb55956c7d316"
  instance_type = "t3.micro"
}
# terraform plan → 0 changes. State address updated, no real infra change.`,
      explanation: 'Renaming a resource label in HCL without a moved {} block causes Terraform to destroy the old resource and create a new one. The moved {} block tells Terraform these are the same resource.',
    },
    {
      title: 'Running terraform state mv without a plan verification',
      wrong: `# Moved state for a resource rename
terraform state mv aws_instance.web aws_instance.app
# Applied without checking — HCL still says "web" → plan will destroy "web"!`,
      right: `# After any state mv:
terraform state mv aws_instance.web aws_instance.app

# ALWAYS verify with plan before applying
terraform plan
# Expected: 0 changes (no destroy/create)
# If plan shows destroy: HCL rename didn't happen yet — fix HCL first`,
      explanation: 'After terraform state mv, always run terraform plan and verify it shows no destroy/create operations. The HCL must be updated to match the new address before applying — otherwise the old resource gets destroyed.',
    },
    {
      title: 'Using -target to work around planning issues',
      wrong: `# Apply just one resource to "avoid breaking things"
terraform apply -target=aws_instance.web
# Later: state is out of sync with config → unpredictable future plans`,
      right: `# Investigate WHY other resources would change in a full plan
terraform plan   # see all changes
# Fix root cause (wrong variable, missing moved {}, etc.)
# Then apply normally:
terraform apply
# Only use -target for true break-glass emergencies with a post-fix plan`,
      explanation: '-target applies only selected resources, leaving state inconsistent with HCL. Future plans may show unexpected changes. Always fix the root cause. Reserve -target for genuine emergencies followed by a full plan/apply.',
    },
  ];

  challenge: Challenge = {
    title: 'Migrate count to for_each',
    language: 'typescript',
    description: 'You have aws_s3_bucket.backup with count=2 (addresses [0] and [1]). Migrate to for_each using a map {"primary": "us-east-1", "secondary": "us-west-2"} without destroying the existing buckets. Write the new for_each resource block, the moved {} blocks for both indexes, and explain what terraform plan should show after migration.',
    hints: [
      'for_each = local.backups where local.backups is the map',
      'bucket name can use each.key',
      'Two moved {} blocks: [0] → ["primary"], [1] → ["secondary"]',
      'After migration: terraform plan must show 0 resource changes',
    ],
    starterCode: `# Before (count-based):
resource "aws_s3_bucket" "backup" {
  count  = 2
  bucket = "my-backup-\${count.index}"
}
# Addresses: aws_s3_bucket.backup[0], [1]

# TODO: Add moved {} blocks for [0] and [1]

# TODO: Replace count resource with for_each version
locals {
  backups = {}  # TODO: fill in the map
}
resource "aws_s3_bucket" "backup" {
  # TODO: use for_each
}`,
    solution: `# Migrate count → for_each with moved {} blocks
locals {
  backups = {
    "primary"   = "us-east-1"
    "secondary" = "us-west-2"
  }
}

moved {
  from = aws_s3_bucket.backup[0]
  to   = aws_s3_bucket.backup["primary"]
}

moved {
  from = aws_s3_bucket.backup[1]
  to   = aws_s3_bucket.backup["secondary"]
}

resource "aws_s3_bucket" "backup" {
  for_each = local.backups
  bucket   = "my-backup-\${each.key}"
  tags     = { Region = each.value }
}

# After migration, terraform plan shows:
# "No changes. Your infrastructure matches the configuration."
# (0 resource changes — only state addresses updated)`,
  };

  quiz: QuizQuestion[] = [
    { q: 'What does a moved {} block prevent?', options: ['Resource from being created', 'Terraform from destroying and recreating a renamed resource', 'State from being updated', 'Provider from being initialized'], answer: 1, explanation: 'A moved {} block tells Terraform that an existing resource was renamed in HCL. Without it, Terraform sees the old address as deleted and the new one as new — causing unnecessary destroy+create.' },
    { q: 'Why is for_each preferred over count for distinct resources?', options: ['for_each is faster', 'for_each uses stable string keys — removing one item does not renumber others', 'count cannot use maps', 'for_each supports more resource types'], answer: 1, explanation: 'count resources are indexed numerically. Removing index 1 from [0,1,2] renumbers [2] to [1], causing an unwanted replacement. for_each keys are stable — removing "b" from a set leaves "a" and "c" untouched.' },
    { q: 'What should terraform plan show after state mv + HCL rename?', options: ['Destroy old + create new', 'No resource changes', 'Module init required', 'Provider update required'], answer: 1, explanation: 'After a correct state mv (or moved {} block) and matching HCL rename, terraform plan should show no resource changes. Only the state address changed — no real infrastructure was modified.' },
    { q: 'When is it safe to use -target?', options: ['Routine applies to speed things up', 'Emergency break-glass situations — must be followed by a full plan/apply', 'When some resources fail validation', 'For all production applies'], answer: 1, explanation: '-target applies only selected resources, leaving other resources out of sync. Use it only for genuine emergencies. Always follow with a full terraform plan and apply to restore consistency.' },
  ];

  qna: QnaItem[] = [
    { q: 'Should I keep moved {} blocks forever?', a: 'You can remove moved {} blocks once all team members and CI pipelines have applied past the rename. Leaving them in place is also safe — they are no-ops after the first apply. For widely-used public modules, keep them to support users who may not apply frequently.' },
    { q: 'How do I move resources between state files (different backends)?', a: 'Use terraform state pull to export both states, terraform state mv --state-out to move resources to the target state file, and terraform state push to upload. Or use terraform state mv with -state= and -state-out= flags. The moved {} block only works within the same state.' },
    { q: 'What is the removed {} block (TF 1.7+)?', a: 'removed {} is the declarative counterpart to terraform state rm. It removes a resource from state (and optionally destroys it). The destroy attribute controls whether the real resource is destroyed. Cleaner than terraform state rm because it is version-controlled.' },
    { q: 'How do I safely break a monolith into multiple state files?', a: 'Incremental: 1) Add moved {} to map resources to new module addresses, 2) Extract the module, 3) Verify plan shows 0 changes, 4) Create a new root for the extracted module with its own backend, 5) Use terraform state mv to transfer state. Repeat one layer at a time.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Refactor Terraform safely with declarative moved {} blocks — always verify plan shows zero changes before and after any state manipulation.',
    mustKnow: [
      'moved { from = old.address; to = new.address } prevents destroy+recreate on rename',
      'Always backup state before any mutation: terraform state pull > backup.tfstate',
      'After state mv: terraform plan must show 0 resource changes',
      'for_each stable keys prevent renumbering; use moved {} to migrate from count',
      '-target is break-glass only — always follow with a full plan/apply',
      'removed {} (TF 1.7+): declarative state removal, version-controlled alternative to state rm',
    ],
    interviewFocus: [
      'How do you rename a Terraform resource without destroying it?',
      'Why is for_each preferred over count for distinct resources?',
      'How do you safely extract resources from a monolithic root module?',
    ],
  };
}
