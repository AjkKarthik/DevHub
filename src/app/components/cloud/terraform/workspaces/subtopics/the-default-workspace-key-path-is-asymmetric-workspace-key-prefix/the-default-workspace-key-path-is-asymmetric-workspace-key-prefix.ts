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
  templateUrl: './the-default-workspace-key-path-is-asymmetric-workspace-key-prefix.html',
  styleUrl: './the-default-workspace-key-path-is-asymmetric-workspace-key-prefix.scss'
})
export class TheDefaultWorkspaceKeyPathIsAsymmetricWorkspaceKeyPrefixSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states both paths correctly, side by side, without flagging that they are structurally different',
      points: [
        'The main page\'s theory says: "The default workspace always exists — its state is at the configured backend key path. Additional workspaces store state at env:/&lt;name&gt;/&lt;key&gt;." Both halves are accurate. Presented as a matched pair, though, it is easy to read as two variations of one scheme rather than what it actually is: the default workspace does NOT participate in the workspace-path scheme at all.',
      ]
    },
    {
      heading: 'Every named workspace gets a prefixed path — default gets the bare key',
      points: [
        'For the S3 backend, a named workspace\'s state lives at <code>&lt;workspace_key_prefix&gt;/&lt;workspace_name&gt;/&lt;key&gt;</code>, with the prefix defaulting to the literal string <code>env:</code> (the colon is genuinely part of the prefix — an unusual-looking but valid S3 key path). So <code>dev</code> lands at <code>env:/dev/app/terraform.tfstate</code>.',
        'The <code>default</code> workspace has no such prefix or name segment at all — its state sits directly at the bare configured <code>key</code>, e.g. <code>app/terraform.tfstate</code>. There is no <code>env:/default/</code> path, and nothing in the bucket layout marks that object as belonging to a workspace at all.',
        'The prefix itself is configurable via the S3 backend\'s <code>workspace_key_prefix</code> argument — useful for avoiding the odd <code>env:</code> literal, or for organizing state under a clearer path. Changing it relocates where NAMED workspaces look for state, while leaving the default workspace\'s bare-key path completely unaffected.',
      ]
    },
    {
      heading: 'Why the asymmetry matters operationally',
      points: [
        'Bucket policies, lifecycle rules, and replication configurations written against a prefix pattern (e.g. granting access to <code>env:/*</code> to cover "all the workspace state") silently exclude the default workspace\'s object entirely — which, in a team that started on <code>default</code> before adopting workspaces, is often the oldest and most important state file.',
        'It also makes the default workspace harder to spot when auditing a state bucket: named workspaces are self-describing in their own paths, while <code>default</code>\'s object is indistinguishable from any other object at that key — reinforcing the same operational-ambiguity concern the main page\'s own quiz raises about leaving production on <code>default</code>.',
        'Changing <code>workspace_key_prefix</code> on an existing configuration relocates where Terraform looks for every named workspace\'s state — existing state objects do not move themselves, so this is a deliberate migration (move the objects, or re-init and migrate), not a cosmetic setting to adjust casually.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The actual bucket layout',
      language: 'bash',
      code: `terraform {
  backend "s3" {
    bucket = "my-tf-state"
    key    = "app/terraform.tfstate"
    region = "us-east-1"
  }
}

# Resulting objects in the bucket:
#
#   app/terraform.tfstate                 <- "default" workspace
#                                            (bare key, NO prefix,
#                                             no workspace segment)
#   env:/dev/app/terraform.tfstate        <- "dev" workspace
#   env:/staging/app/terraform.tfstate    <- "staging" workspace
#   env:/prod/app/terraform.tfstate       <- "prod" workspace
#
# "env:" is the literal default prefix -- the colon really is
# part of the key. There is NO env:/default/ path at all.`,
    },
    {
      label: 'The operational consequence, and workspace_key_prefix',
      language: 'bash',
      code: `# A bucket policy written to cover "all workspace state"
# by prefix SILENTLY MISSES the default workspace:
#   Resource: "arn:aws:s3:::my-tf-state/env:/*"
# -> covers dev, staging, prod
# -> does NOT cover app/terraform.tfstate (the default
#    workspace) -- often the oldest, most important state
#    in a team that started on default before adopting
#    workspaces.

# The prefix is configurable -- useful to avoid the odd
# "env:" literal or organize state more clearly:
terraform {
  backend "s3" {
    bucket               = "my-tf-state"
    key                  = "app/terraform.tfstate"
    region               = "us-east-1"
    workspace_key_prefix = "workspaces"
  }
}
# Named workspaces now resolve to:
#   workspaces/dev/app/terraform.tfstate
# The default workspace is UNAFFECTED -- still the bare
# app/terraform.tfstate.

# Changing this on an EXISTING config relocates where
# Terraform looks for named-workspace state; existing objects
# do not move themselves. Treat it as a deliberate migration.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team writes an S3 bucket policy granting their CI role access to `arn:aws:s3:::my-tf-state/env:/*`, intending to cover "all Terraform workspace state" in the bucket. Their dev, staging, and prod workspaces all work fine, but one long-running configuration consistently fails with an access-denied error on state operations. What is that configuration most likely using, and what does the default workspace\'s state path actually look like?',
    hint: 'The env:/ prefix covers named workspaces. Does every workspace, including the very first one, actually live under that prefix?',
    solution: 'That configuration is almost certainly still on the `default` workspace. The `env:/` prefix only applies to NAMED workspaces — the default workspace\'s state sits directly at the bare configured key (e.g. `app/terraform.tfstate`), with no prefix and no workspace name segment at all; there is no `env:/default/` path. So a policy scoped to `env:/*` covers dev, staging, and prod but silently excludes the default workspace\'s object entirely. This is a common trap in teams that started on `default` before adopting workspaces, since that oldest state file is often the most important one. The fix is either extending the policy to cover the bare key path as well, or migrating that configuration off `default` onto an explicitly named workspace so it participates in the prefix scheme like everything else.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The default workspace stores its state at env:/default/<key>, following the same prefixed path scheme as every other workspace.',
      reality: 'Per this subtopic\'s theory, the default workspace\'s state sits at the bare configured key with no prefix and no workspace name segment — there is no env:/default/ path at all, making it structurally asymmetric with every named workspace.'
    },
    {
      thought: 'The "env:" in a workspace state path is shorthand notation in the docs rather than a literal part of the S3 object key.',
      reality: 'Per this subtopic\'s theory, "env:" is the literal default value of the workspace_key_prefix argument — colon included — and genuinely appears in the S3 key, which is why it looks unusual but is a valid key path.'
    },
    {
      thought: 'Changing workspace_key_prefix is a cosmetic setting that reorganizes existing state objects into the new path automatically.',
      reality: 'Per this subtopic\'s theory, it changes where Terraform LOOKS for named-workspace state — existing objects do not relocate themselves, so changing it on an existing configuration is a deliberate migration, not a cosmetic adjustment.'
    }
  ];
}
