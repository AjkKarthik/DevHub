import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './terraform-workspace-cannot-parameterize-the-backend-block.html',
  styleUrl: './terraform-workspace-cannot-parameterize-the-backend-block.scss'
})
export class TerraformWorkspaceCannotParameterizeTheBackendBlockSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page shows terraform.workspace working everywhere it demonstrates it — resource names, tags, locals, lookups',
      points: [
        'Every <code>terraform.workspace</code> example on the main page uses it inside RESOURCE arguments, <code>locals</code>, or tag maps — bucket names, instance sizing lookups, environment tags. All correct, and all in places where it genuinely works. The page never mentions the one prominent block where it (and every other expression) is categorically unavailable.',
      ]
    },
    {
      heading: 'Backend configuration is resolved before any expression evaluation happens at all',
      points: [
        'The <code>backend</code> block is read and resolved during <code>terraform init</code>, BEFORE Terraform has evaluated variables, locals, or any other expression — which is exactly why the main page\'s own Remote Backends topic notes that backend configuration "cannot use variables." <code>terraform.workspace</code> falls under the same restriction for the same reason: there is no expression-evaluation phase available yet when the backend is being configured.',
        'This produces a genuine chicken-and-egg situation for the specific idea of "put each workspace\'s state in a differently-named bucket": selecting a workspace requires knowing the backend (to enumerate what workspaces exist), while the proposed backend would require knowing the workspace. Terraform resolves this by making the restriction absolute rather than trying to order it.',
      ]
    },
    {
      heading: 'What actually handles per-workspace state paths — and the escape hatch when a bucket really must differ',
      points: [
        'For the common goal (each workspace\'s state stored separately), no parameterization is needed at all — Terraform already does this automatically, storing non-default workspace state under a workspace-specific path within the SAME configured backend, exactly as the main page\'s own quick reference describes with <code>env:/&lt;workspace&gt;/key</code>.',
        'When a genuinely different bucket/account per environment is required (not just a different path), the answer is the partial-configuration mechanism the main page\'s own Remote Backends topic already covers: keep the static settings in the backend block, and supply the varying ones at init time via <code>terraform init -backend-config=prod.backend.hcl</code> — resolved by the CLI at init, entirely outside the expression system.',
        'Reaching for that escape hatch is also a signal worth heeding: if each environment genuinely needs its own bucket, credentials, and access boundary, separate root configurations per environment (rather than workspaces within one) is usually the better structure — the same conclusion the State topic\'s own workspaces-vs-directories tradeoff arrives at.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The attempt that cannot work',
      language: 'bash',
      code: `# Trying to give each workspace its own state bucket:
terraform {
  backend "s3" {
    bucket = "my-tf-state-\${terraform.workspace}"   # invalid
    key    = "app/terraform.tfstate"
    region = "us-east-1"
  }
}
# Error: Variables not allowed
#   Variables may not be used here.

# Same underlying reason the main page's own Remote Backends
# topic gives for variables: the backend is resolved during
# init, BEFORE any expression evaluation phase exists.
#
# There is also a genuine ordering problem -- selecting a
# workspace requires already knowing the backend (to list what
# workspaces exist), so a backend that depends on the workspace
# has nothing to resolve against.`,
    },
    {
      label: 'What works instead',
      language: 'bash',
      code: `# For the common goal -- separate state per workspace --
# nothing needs parameterizing. Terraform already does it:
terraform {
  backend "s3" {
    bucket = "my-tf-state"
    key    = "app/terraform.tfstate"
    region = "us-east-1"
  }
}
# default workspace  -> app/terraform.tfstate
# "dev" workspace    -> env:/dev/app/terraform.tfstate
# "prod" workspace   -> env:/prod/app/terraform.tfstate
# Automatic, per the main page's own quick-reference note.

# When a genuinely DIFFERENT bucket per environment is needed,
# use partial configuration (already covered by the main page's
# own Remote Backends topic) -- resolved by the CLI at init,
# outside the expression system entirely:

# backend.tf (committed)
terraform {
  backend "s3" {
    key    = "app/terraform.tfstate"
    region = "us-east-1"
    # bucket supplied at init time
  }
}

# prod.backend.hcl
# bucket = "my-tf-state-prod"

# terraform init -backend-config=prod.backend.hcl

# Note: if each env truly needs its own bucket AND credentials,
# separate root configurations per environment is usually the
# better structure than workspaces within one.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team wants each Terraform workspace to store its state in a separately-named S3 bucket, so they write `bucket = "my-tf-state-${terraform.workspace}"` in the backend block — mirroring how the main page uses terraform.workspace successfully in bucket names for actual S3 bucket RESOURCES. terraform init fails with "Variables may not be used here." Why is the backend block categorically different from a resource argument here, and what are the two legitimate approaches depending on what the team actually needs?',
    hint: 'When in the Terraform lifecycle is the backend block resolved, relative to when expressions like terraform.workspace become evaluable?',
    solution: 'The backend block is resolved during `terraform init`, before Terraform has an expression-evaluation phase at all — the same reason the main page\'s own Remote Backends topic notes backend configuration cannot use variables. There is also a genuine ordering problem: selecting a workspace requires already knowing the backend (to enumerate existing workspaces), so a backend depending on the workspace has nothing to resolve against. The two legitimate approaches: (1) if the goal is simply separate state per workspace, nothing is needed — Terraform automatically stores non-default workspace state under a workspace-specific path (`env:/<workspace>/key`) within the same backend; (2) if a genuinely different bucket per environment is required, use partial configuration — keep static settings in the backend block and supply the varying bucket at init time via `terraform init -backend-config=prod.backend.hcl`, resolved by the CLI outside the expression system. If each environment truly needs its own bucket and credentials, that is also a signal that separate root configurations per environment may suit better than workspaces within one.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'terraform.workspace works in any HCL expression context, so it can be used to parameterize the backend block the same way the main page uses it in resource arguments and locals.',
      reality: 'Per this subtopic\'s theory, the backend block is resolved during init before any expression evaluation exists — terraform.workspace is unavailable there for the same reason variables are, categorically, not as a special case.'
    },
    {
      thought: 'Because the backend block cannot be parameterized by workspace, each workspace ends up sharing one state file unless something extra is configured.',
      reality: 'Per this subtopic\'s theory, Terraform already stores each non-default workspace\'s state at a workspace-specific path within the same backend automatically (env:/<workspace>/key) — no parameterization is needed for the common per-workspace-state goal at all.'
    },
    {
      thought: 'Partial configuration with -backend-config is a workaround that effectively restores expression support to the backend block.',
      reality: 'Per this subtopic\'s theory, partial configuration works precisely because it sidesteps expressions entirely — values are supplied by the CLI at init time from a file or flag, never evaluated as HCL expressions, so it is a different mechanism rather than a restored one.'
    }
  ];
}
