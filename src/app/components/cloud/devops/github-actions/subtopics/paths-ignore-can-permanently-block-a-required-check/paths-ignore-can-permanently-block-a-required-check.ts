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
  templateUrl: './paths-ignore-can-permanently-block-a-required-check.html',
  styleUrl: './paths-ignore-can-permanently-block-a-required-check.scss'
})
export class PathsIgnoreCanPermanentlyBlockARequiredCheckSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page recommends paths-ignore as a pure cost/speed optimisation — it can silently combine with branch protection to permanently block a PR',
      points: [
        'The main page\'s own "Running expensive jobs on every push to every branch" mistake entry recommends adding paths-ignore: [\'**.md\', \'docs/**\'] as the fix, framed entirely around efficiency: "Unfiltered push triggers waste minutes... Filter by branch and paths to run expensive jobs only when needed." Nothing on the page connects this to the main page\'s own separate Branch Protection theory, which recommends "require status checks to pass before merging."',
        'GitHub\'s own documentation describes exactly what happens when these two features are combined on the same workflow: "If a workflow is skipped due to path filtering, branch filtering or a commit message, then checks associated with that workflow will remain in a \'Pending\' state. A pull request that requires those checks to be successful will be blocked from merging."',
        'This is a genuinely different failure mode from a check that runs and fails — a skipped check never reports ANY status, pass or fail. GitHub shows it as perpetually "Expected — Waiting for status to be reported," and per its own documentation, the PR simply cannot be merged, no matter how long anyone waits, because the check that would report success is the exact one that paths-ignore prevented from ever running.',
      ]
    },
    {
      heading: 'Exactly when this triggers, and the documented workaround',
      points: [
        'The trap specifically requires two independent configuration choices to combine: (1) a workflow with paths-ignore (or branches filtering) that can legitimately skip a given push, and (2) that same workflow\'s job(s) marked as a REQUIRED status check in the repository\'s branch protection rules. Neither setting alone causes a problem — a paths-ignore workflow with no required-check dependency just quietly doesn\'t run; a required check on a workflow with no path filters always runs and always reports something.',
        'A documentation-only PR (changing just a README.md, exactly the kind of change the main page\'s own paths-ignore: [\'**.md\'] example is designed to skip) is precisely the scenario that triggers this: if that CI workflow is also a required status check, the PR is now permanently stuck — the change the paths-ignore rule was written to exempt from CI is the same change that CI-as-a-required-check now refuses to let merge, for the opposite reason (no status was ever reported, not that a status failed).',
        'GitHub\'s own documented workaround uses conditional job execution rather than removing the path filter or the required-check status entirely: run the job unconditionally (so it ALWAYS reports a status), but make its actual work conditional — checking which files changed as a first step, and skipping the expensive remaining steps (while still exiting with a real, reported success) when nothing relevant changed. This preserves both the cost-saving intent behind paths-ignore AND the always-reported status branch protection depends on.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own paths-ignore fix -- fine on its own, until it\'s a required check',
      language: 'bash',
      code: `# Matches the main page's own "right" fix for the mistake entry:

# on:
#   push:
#     branches: [main, develop]
#     paths-ignore:
#       - '**.md'
#       - 'docs/**'
#   pull_request:
#     branches: [main]

# This workflow's job is ALSO configured as a required status check
# in the repo's branch protection rules (a completely separate
# setting, on a completely separate settings page -- nothing warns
# you these two configurations interact).

# A contributor opens a PR that ONLY changes README.md:
# - The push/PR triggers this workflow
# - paths-ignore correctly determines nothing relevant changed
# - GitHub Actions skips the workflow entirely -- by design, exactly
#   as the main page's own advice intends, to save CI minutes

# But per GitHub's own documentation: "If a workflow is skipped due
# to path filtering... checks associated with that workflow will
# remain in a 'Pending' state. A pull request that requires those
# checks to be successful will be blocked from merging."
#
# The PR now shows: "Expected — Waiting for status to be reported"
# -- forever. Merging is blocked. The check never ran, so it never
# reports success, no matter how long the PR sits open.`,
    },
    {
      label: 'The documented fix -- always run, conditionally skip the WORK',
      language: 'bash',
      code: `# Instead of paths-ignore on the trigger itself, run the job
# UNCONDITIONALLY (so it always reports a real status), and make
# the expensive work conditional on what actually changed:

# on:
#   push: { branches: [main, develop] }
#   pull_request: { branches: [main] }
#   # NOTE: no paths-ignore here -- the workflow now always runs

# jobs:
#   build-and-test:
#     runs-on: ubuntu-latest
#     steps:
#       - uses: actions/checkout@v4

#       - name: Check for relevant changes
#         id: changes
#         uses: dorny/paths-filter@v3
#         with:
#           filters: |
#             code:
#               - '!**.md'
#               - '!docs/**'

#       - name: Install dependencies
#         if: steps.changes.outputs.code == 'true'
#         run: npm ci

#       - name: Run tests
#         if: steps.changes.outputs.code == 'true'
#         run: npm test

#       # No "if:" here -- this step (and therefore the JOB) always
#       # completes and reports a real status, whether or not the
#       # expensive steps above actually ran:
#       - name: Report status
#         run: echo "Docs-only change or tests passed -- reporting success"

# Now a README-only PR: the job still RUNS (so branch protection's
# required check gets a real, reported status), but the expensive
# npm ci / npm test steps are skipped via "if:", preserving the
# main page's own cost-saving intent without the permanently-stuck
# check GitHub's own docs warn about.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team implements exactly the main page\'s own paths-ignore recommendation on their CI workflow, and separately (in an unrelated PR, configured by a different team member) marks that same CI workflow as a required status check in branch protection settings. Weeks later, a contributor opens a PR that only updates the CONTRIBUTING.md file. The PR sits with a check labeled "Expected — Waiting for status to be reported" that never changes, and the merge button stays disabled indefinitely. Using this subtopic\'s theory, explain precisely why this specific PR is stuck, and why "just wait longer" or "re-run the check" will not resolve it.',
    hint: 'Per this subtopic\'s theory, does the workflow associated with the stuck check actually RUN for this PR at all, given its paths-ignore configuration and the file that was changed? If a workflow never runs, is there any status for it to eventually report, no matter how long the PR waits?',
    solution: 'This PR is stuck because, per this subtopic\'s theory, the two independently-configured settings — paths-ignore on the CI workflow, and that same workflow being a required status check — have combined into exactly the trap GitHub\'s own documentation describes. CONTRIBUTING.md matches the workflow\'s own paths-ignore: [\'**.md\'] pattern, so GitHub Actions correctly and intentionally skips running the workflow entirely for this push — exactly the behavior the main page\'s own paths-ignore advice is designed to produce, for exactly the kind of change it is designed to exempt. But because branch protection separately requires that same workflow\'s check to succeed before merging, and the workflow never ran at all, there is no status — neither pass nor fail — for it to ever report. "Just wait longer" will not help, per this subtopic\'s theory, because nothing is actually pending completion; the workflow already finished being skipped, permanently, for this specific push. "Re-run the check" typically has no effect either, since there is no workflow run to re-trigger for a check that GitHub never queued in the first place. The actual fix requires changing the workflow\'s configuration itself — per this subtopic\'s theory, converting it to always run (removing the paths-ignore trigger filter) while making its expensive WORK conditional via an if: check on the individual steps, so the job unconditionally reports a real status regardless of which files changed.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'paths-ignore is a pure efficiency optimization with no downside beyond saving CI minutes — the main page\'s own framing ("waste minutes... rebuilds for README changes") describes its complete set of tradeoffs.',
      reality: 'This subtopic\'s theory shows a real, separate downstream consequence when combined with branch protection: per GitHub\'s own documentation, "checks associated with that workflow will remain in a \'Pending\' state" when the workflow is skipped, and "a pull request that requires those checks to be successful will be blocked from merging" — a genuinely different failure mode from the cost/speed tradeoff the main page describes.'
    },
    {
      thought: 'A pull request stuck on "Expected — Waiting for status to be reported" just needs more time, or a manual re-run of the check, to eventually resolve.',
      reality: 'This subtopic\'s exercise shows that when the underlying cause is a skipped (not failed, not still-running) workflow, there is no pending completion to wait for and typically no workflow run to re-trigger — the check will remain in that state indefinitely until the workflow\'s own trigger configuration is changed to actually run and report a status for that specific kind of change.'
    },
    {
      thought: 'This interaction between paths-ignore and required status checks is an obscure edge case unlikely to affect a typical team\'s setup.',
      reality: 'This subtopic\'s theory shows the trap requires only two very common, independently reasonable configuration choices — path-filtered CI (exactly what the main page\'s own mistake entry recommends) and that same CI workflow marked as a required check (exactly what the main page\'s own separate Branch Protection theory recommends) — meaning a team following BOTH of the main page\'s own pieces of advice, configured by different people at different times, can hit this without either configuration looking wrong in isolation.'
    }
  ];
}
