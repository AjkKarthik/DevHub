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
  templateUrl: './refresh-false-and-refresh-only-do-near-opposite-things.html',
  styleUrl: './refresh-false-and-refresh-only-do-near-opposite-things.scss'
})
export class RefreshFalseAndRefreshOnlyDoNearOppositeThingsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page lists both flags side by side, without warning how easy they are to mix up',
      points: [
        'The main page\'s quick reference lists <code>terraform plan -refresh-only</code> ("Show drift without proposing config changes") right next to <code>-refresh=false</code> ("Skip provider API refresh — faster plan, but stale state"). They share the word "refresh" and sit one line apart — a name-based skim can easily land on the wrong one when reaching for "the drift-detection flag."',
      ]
    },
    {
      heading: 'They do near-opposite things: one performs ONLY a refresh, the other SKIPS refresh entirely',
      points: [
        '<code>-refresh-only</code> makes Terraform do a full provider-API refresh and build a plan whose ONLY purpose is comparing real infrastructure to state — this is the drift-detection flag, exactly as the main page describes it.',
        '<code>-refresh=false</code> does the opposite: it tells Terraform to SKIP the refresh step entirely and trust whatever is already sitting in the state file, without checking real infrastructure at all. This makes the plan faster (no provider API calls for the refresh step), but it means any drift that happened since the last refresh is completely invisible to that plan — the exact opposite of what someone reaching for "the drift flag" usually wants.',
      ]
    },
    {
      heading: 'The real risk of the mix-up: a false "no changes" plan right before a broken apply',
      points: [
        'If a resource was deleted or changed outside Terraform and a plan runs with <code>-refresh=false</code>, that plan can report "no changes needed" purely because it never checked reality — the state file still shows the old data. The FOLLOWING apply (which does refresh, by default) can then fail unexpectedly, because Terraform only discovers the real-world discrepancy at that later point.',
        'The two flags are also mutually exclusive in practice — you cannot combine <code>-refresh=false</code> with <code>-refresh-only</code> planning mode, since a refresh-only plan\'s entire purpose (refreshing and reporting drift) would be self-defeating with refresh disabled.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: '-refresh-only: the drift-detection flag',
      language: 'bash',
      code: `# Full provider-API refresh, plan reports ONLY drift, no config changes
terraform plan -refresh-only

# Output example:
# ~ aws_instance.web
#     ~ instance_type = "t3.micro" -> "t3.large"
#       (changed outside Terraform)
#
# This IS checking real infrastructure right now -- the whole
# point of -refresh-only is to surface exactly this kind of gap.`,
    },
    {
      label: '-refresh=false: the OPPOSITE flag',
      language: 'bash',
      code: `# Skips the refresh step entirely -- trusts whatever is already
# in the state file, makes ZERO provider API calls to check reality
terraform plan -refresh=false

# Someone manually resized the same aws_instance in the console
# a moment ago. This plan output:
# No changes. Your infrastructure matches the configuration.
#
# WRONG -- or rather, technically correct for what it checked:
# it never looked at real infrastructure at all. The drift is
# real, just invisible to THIS specific plan.

# The following apply (default refresh behavior) then discovers
# the real state and can behave unexpectedly:
terraform apply
# Terraform now refreshes for real, sees the drift, and may
# propose changes the earlier -refresh=false plan gave no warning of.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate says "run the refresh flag before merging, to make sure there\'s no drift" and pastes terraform plan -refresh=false as the command to run. Is this the right flag for checking drift, and if not, what should it be instead?',
    hint: 'One of these two flags performs a refresh specifically to check reality; the other skips checking reality entirely to save time. Which one did the teammate paste?',
    solution: 'No, -refresh=false is the wrong flag — it does the opposite of checking for drift: it SKIPS the provider-API refresh entirely and trusts whatever is already in the state file, so it cannot detect any drift that happened since the last refresh at all. It would report "no changes" even if real infrastructure had genuinely diverged. The correct flag for checking drift is -refresh-only (terraform plan -refresh-only), which performs a full refresh specifically so the plan can compare real infrastructure against state and surface exactly what changed outside Terraform.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since -refresh=false and -refresh-only both contain the word "refresh" and appear next to each other in Terraform\'s flag reference, they are variations on the same drift-checking behavior.',
      reality: 'Per this subtopic\'s theory, they do near-opposite things — -refresh-only performs a refresh specifically to detect drift, while -refresh=false skips the refresh step entirely, making any drift invisible to that plan.'
    },
    {
      thought: '-refresh=false is a safe way to quickly check for drift when you want a faster plan than the full -refresh-only flow.',
      reality: 'Per this subtopic\'s theory, -refresh=false makes drift checking impossible for that plan run — it trusts the existing state file without ever calling the provider API to see what changed, which is the opposite of a faster drift check.'
    },
    {
      thought: 'A "No changes. Your infrastructure matches the configuration." result from terraform plan -refresh=false is a reliable confirmation that no drift exists.',
      reality: 'Per this subtopic\'s theory, a -refresh=false plan never checks real infrastructure at all — a "no changes" result only means the state file matches the configuration, which says nothing about whether reality has drifted from that state file.'
    }
  ];
}
