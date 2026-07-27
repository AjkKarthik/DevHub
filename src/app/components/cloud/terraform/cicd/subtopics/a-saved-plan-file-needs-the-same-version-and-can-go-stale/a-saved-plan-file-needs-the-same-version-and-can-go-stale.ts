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
  templateUrl: './a-saved-plan-file-needs-the-same-version-and-can-go-stale.html',
  styleUrl: './a-saved-plan-file-needs-the-same-version-and-can-go-stale.scss'
})
export class ASavedPlanFileNeedsTheSameVersionAndCanGoStaleSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states the plan-then-apply rule without its two operational preconditions',
      points: [
        'The main page\'s theory says: "Plan is not apply: always save the plan file (-out) and apply exactly that file, not a fresh plan." Correct and important — but it treats <code>-out</code> as if saving the file alone guarantees a faithful apply later. Two things can silently break that guarantee, and the main page names neither.',
      ]
    },
    {
      heading: 'Precondition one: the apply job must use the same Terraform version as the plan job',
      points: [
        'A saved plan file is tied to the specific Terraform CLI version (and provider versions) that generated it. Every stage in a pipeline that touches state — plan, apply, output, destroy — needs to run the SAME version; a plan job on one version and an apply job on a different one is a real, documented source of apply failures or subtly incorrect behavior, not just a theoretical mismatch.',
        'The practical implication for CI specifically: pin the Terraform version explicitly in the workflow (rather than letting each job resolve "latest" independently) and reuse the exact same setup step\'s output across the plan and apply jobs, rather than trusting two separately-configured jobs to happen to agree.',
      ]
    },
    {
      heading: 'Precondition two: the plan file goes stale the moment state changes underneath it',
      points: [
        'A saved plan file is a snapshot computed against the state as it existed AT PLAN TIME. If anything changes the real state between plan and apply — a different pipeline run applying first, someone running Terraform locally, drift being reconciled — the saved plan no longer matches reality, and <code>apply</code> against it fails with an explicit error rather than silently applying something wrong.',
        'This is precisely why the main page\'s own state-locking point ("prevents concurrent applies from corrupting state") and the plan-artifact point are not two independent best practices — they work together: locking prevents a SIMULTANEOUS conflicting write, but only closing the gap between plan and apply (keeping it short, and not letting other pipeline runs sneak in between) prevents the SEQUENTIAL staleness that locking alone does not address.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Version mismatch across plan and apply jobs',
      language: 'bash',
      code: `# Plan job -- resolves "latest" independently:
- uses: hashicorp/setup-terraform@v3
  with:
    terraform_version: latest   # resolves to, say, 1.8.2 today
- run: terraform plan -out=tfplan

# Apply job -- runs later, "latest" may have moved:
- uses: hashicorp/setup-terraform@v3
  with:
    terraform_version: latest   # could resolve to 1.8.3 by now
- run: terraform apply tfplan
# Error: the plan file was created with a different Terraform
# version than is currently running -- or worse, a SUBTLE
# behavior difference that doesn't error but applies something
# not quite what was reviewed.

# Fix: pin explicitly, reused identically across every job
# that touches this plan/state:
- uses: hashicorp/setup-terraform@v3
  with:
    terraform_version: "1.8.2"   # exact, same value everywhere`,
    },
    {
      label: 'A stale plan: the error, and why the gap matters',
      language: 'bash',
      code: `# Plan job (Monday, PR opened):
terraform plan -out=tfplan
# Saved plan reflects state exactly as of right now.

# ...several days pass. A separate hotfix pipeline applies
# unrelated changes to the SAME state in the meantime...

# Apply job (Thursday, PR finally approved and merged):
terraform apply tfplan
# Error: Saved plan is stale
#   The given plan file can no longer be applied because the
#   state was changed by another operation after the plan was
#   created.

# Locking (DynamoDB, native backend locking) only prevents a
# SIMULTANEOUS conflicting write during either operation --
# it does nothing to prevent THIS sequential staleness, which
# is why keeping the plan-to-apply gap short (and re-planning
# if too much time or too many other applies have passed) is
# a separate, necessary discipline on top of locking.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own plan-then-apply pattern, a team saves a plan artifact on PR open and applies it after merge, sometimes days later if review takes a while. Their remote backend has locking enabled (DynamoDB), so they assume concurrent-write corruption is fully handled. One day the apply step fails with "Saved plan is stale," even though no lock conflict occurred. What did locking not protect against here, and what practice closes that specific gap?',
    hint: 'Locking prevents two operations from writing to state AT THE SAME MOMENT. Does it say anything about state having changed at a DIFFERENT moment, before the apply even started?',
    solution: 'State locking only prevents SIMULTANEOUS conflicting writes — it says nothing about state having already changed, sequentially, sometime between when the plan was saved and when apply finally ran (here, a separate pipeline run applying unrelated changes to the same state in the days the PR sat in review). The saved plan was computed against state as it existed at plan time, and once that state moved, the plan no longer matches reality — Terraform correctly refuses to apply it rather than silently applying something stale. The practice that closes this gap is keeping the plan-to-apply window short, and re-running plan (rather than reusing an old artifact) if too much time has passed or other applies are known to have run against the same state in between.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Saving a plan with -out and applying that exact file, as the main page recommends, is sufficient on its own to guarantee the apply matches what was reviewed, regardless of how much time passes or what else touches the state in between.',
      reality: 'Per this subtopic\'s theory, a saved plan file is a snapshot tied to state as it existed at plan time — if state changes before apply runs, Terraform detects the mismatch and refuses to apply the now-stale plan.'
    },
    {
      thought: 'State locking (via DynamoDB or a backend\'s native locking) fully covers the risk of applying a plan against changed state, since it is the mechanism that protects state integrity in CI.',
      reality: 'Per this subtopic\'s theory, locking specifically prevents SIMULTANEOUS conflicting writes — it does not prevent a saved plan from going stale due to a SEQUENTIAL state change that happened cleanly, with no lock conflict, sometime before apply ran.'
    },
    {
      thought: 'Using terraform_version: latest in each CI job\'s setup step is a convenient way to always get the newest features, with no real downside for a plan-then-apply pipeline.',
      reality: 'Per this subtopic\'s theory, "latest" resolving independently in separate plan and apply jobs risks a version mismatch between the two — the saved plan file is tied to the Terraform version that created it, so pipeline stages should pin an exact, identical version rather than each resolving latest on its own.'
    }
  ];
}
