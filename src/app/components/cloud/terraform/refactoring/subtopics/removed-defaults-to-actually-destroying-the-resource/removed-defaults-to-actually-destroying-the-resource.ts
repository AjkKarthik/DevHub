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
  templateUrl: './removed-defaults-to-actually-destroying-the-resource.html',
  styleUrl: './removed-defaults-to-actually-destroying-the-resource.scss'
})
export class RemovedDefaultsToActuallyDestroyingTheResourceSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page frames removed {} as simply the declarative version of state rm, without flagging a critical behavior difference',
      points: [
        'The main page\'s QnA describes it this way: "removed {} is the declarative counterpart to terraform state rm. It removes a resource from state (and optionally destroys it)." Framing it as "the declarative counterpart to state rm" invites reading removed {} as behaving like state rm by default, with destruction as an opt-in extra — that reading is backwards.',
      ]
    },
    {
      heading: 'The actual default: removed {} DESTROYS the real resource unless told not to',
      points: [
        'By default, a <code>removed {}</code> block removes the resource from state AND destroys the actual infrastructure — this is the OPPOSITE default from <code>terraform state rm</code>, which NEVER destroys real infrastructure under any circumstance, only ever touching Terraform\'s own tracking of the resource.',
        'To get <code>state rm</code>-equivalent behavior (remove from state, leave the real resource alone) with <code>removed {}</code>, you must explicitly add a nested <code>lifecycle { destroy = false }</code> block — without it, the default destroy behavior applies.',
      ]
    },
    {
      heading: 'Why this default makes sense once understood — and why it is still a real trap for anyone assuming the two tools are interchangeable',
      points: [
        'The default is arguably the more common intent: usually when a resource block is deleted from configuration entirely, you actually WANT the corresponding infrastructure destroyed too (that IS what plain resource-removal-from-HCL already does without any removed block at all) — removed {} \'s real value-add over just deleting the block is making that destroy REVIEWABLE in a plan before it happens, not changing whether destruction occurs by default.',
        'The trap is specifically for anyone reaching for removed {} because they already know and trust state rm\'s "never destroys" behavior, and assume the newer, declarative tool inherited that same safety property — it did not, and the main page\'s own "declarative counterpart to state rm" framing does nothing to correct that assumption.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'removed {} — the DEFAULT destroys the resource',
      language: 'bash',
      code: `# Intent: "clean up state for a resource that's already gone"
# (the mental model borrowed from terraform state rm)

removed {
  from = aws_instance.orphan
  # no lifecycle block -- DEFAULT behavior applies
}

$ terraform plan
# Terraform will perform the following actions:
#   # aws_instance.orphan will be destroyed
#   - resource "aws_instance" "orphan" {
#       ...
#     }
#
# NOT what "clean up state, like state rm" usually means --
# this plan will DESTROY the real EC2 instance if applied.`,
    },
    {
      label: 'The explicit opt-out for state-only removal',
      language: 'bash',
      code: `# To get the SAME behavior as "terraform state rm" --
# remove from state, leave the real resource untouched --
# destroy = false must be set explicitly:

removed {
  from = aws_instance.orphan
  lifecycle {
    destroy = false
  }
}

$ terraform plan
# Terraform will perform the following actions:
#   # aws_instance.orphan will no longer be managed by Terraform
#   # (but will not be destroyed)
#
# NOW this matches the "declarative state rm" mental model --
# but only because destroy = false was added explicitly.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own framing of removed {} as "the declarative counterpart to terraform state rm," an engineer writes a plain removed { from = aws_s3_bucket.legacy } block with no lifecycle argument, intending only to stop Terraform from managing a bucket that another team has taken over — the same "clean up state, don\'t touch the real thing" intent as state rm. What actually happens on apply, and what should the block have included instead?',
    hint: 'Does removed {} inherit state rm\'s "never destroys real infrastructure" property by default, or is that an explicit opt-in?',
    solution: 'On apply, Terraform will DESTROY the real S3 bucket — the opposite of the engineer\'s intent. Unlike terraform state rm, which never destroys real infrastructure under any circumstance, a removed {} block defaults to actually destroying the resource unless told otherwise. To get the state-rm-equivalent "remove from state, leave the real resource alone" behavior, the block needed an explicit lifecycle { destroy = false } — removed { from = aws_s3_bucket.legacy; lifecycle { destroy = false } }. Without it, the plain removed block destroys the bucket on apply, which for a bucket another team has taken over ownership of could mean real, unrecoverable data loss.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since the main page describes removed {} as "the declarative counterpart to terraform state rm," a plain removed block with no extra arguments behaves the same way state rm does by default — removing from state without touching real infrastructure.',
      reality: 'Per this subtopic\'s theory, removed {} defaults to the OPPOSITE of state rm\'s behavior — it destroys the real resource by default, and only matches state rm\'s "never destroy" behavior when lifecycle { destroy = false } is explicitly added.'
    },
    {
      thought: 'The destroy attribute on a removed block\'s lifecycle block is an opt-IN — you have to explicitly ask for destruction to happen, similar to how prevent_destroy is an opt-in safety guard.',
      reality: 'Per this subtopic\'s theory, destruction is the DEFAULT for removed {} — destroy = false is the opt-OUT you must explicitly add to prevent it, the reverse of how an opt-in safety feature like prevent_destroy works.'
    },
    {
      thought: 'removed {} is strictly safer than terraform state rm, since it makes the removal reviewable in a plan before it happens.',
      reality: 'Per this subtopic\'s theory, removed {} being reviewable in a plan is a genuine advantage, but that reviewability doesn\'t change what the DEFAULT action actually is — the default plan for a plain removed block shows a destroy, which is a materially different (and more dangerous, if unintended) outcome than state rm ever produces.'
    }
  ];
}
