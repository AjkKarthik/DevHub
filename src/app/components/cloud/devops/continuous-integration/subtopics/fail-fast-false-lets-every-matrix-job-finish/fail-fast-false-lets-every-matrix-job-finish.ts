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
  templateUrl: './fail-fast-false-lets-every-matrix-job-finish.html',
  styleUrl: './fail-fast-false-lets-every-matrix-job-finish.scss'
})
export class FailFastFalseLetsEveryMatrixJobFinishSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own first code tab sets fail-fast: false with zero explanation anywhere on the page',
      points: [
        'The main page\'s own "CI Pipeline (GitHub Actions)" code tab defines a matrix across three Node versions and includes `fail-fast: false` right next to it. Neither the theory sections nor the QnA ever mention `fail-fast` again — a reader has to guess what it does or what the default even is.',
        'GitHub\'s own documentation on matrix strategies states the mechanism directly: "If any of the jobs with continue-on-error: false fail, all jobs that are in progress or queued will be cancelled." This cancellation is the DEFAULT behavior (`fail-fast: true`) — every other matrix combination stops the moment one of them fails, whether or not it had actually finished running yet.',
      ]
    },
    {
      heading: 'Why the main page\'s own matrix specifically needs fail-fast: false to be useful at all',
      points: [
        'With the default `fail-fast: true`, if the Node 18 job in the main page\'s own matrix fails first, GitHub Actions cancels the still-running Node 20 and Node 22 jobs immediately — a developer investigating a Node-18-specific failure gets zero information about whether the SAME change also breaks (or doesn\'t break) on Node 20/22, since those jobs never got to finish.',
        'Setting `fail-fast: false`, exactly as the main page\'s own code tab does, is what makes a compatibility matrix actually useful for its stated purpose: every Node version runs to completion regardless of what happens in the others, so a single CI run reports the FULL compatibility picture across all three versions at once, instead of stopping at the first failure and leaving the rest unknown.',
        'The tradeoff the main page never states: `fail-fast: false` spends more compute on every failed run (every matrix combination completes instead of most being canceled early) — worth it for a genuine cross-version compatibility check, but wasteful for a matrix that exists purely to parallelize otherwise-identical work (like the main page\'s own separate Test Parallelisation sharding example), where an early failure really does mean the whole run is going to fail regardless.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'fail-fast: true (the default) -- one failure cancels the rest',
      language: 'bash',
      code: `# jobs:
#   ci:
#     strategy:
#       matrix:
#         node: [18, 20, 22]
#       # fail-fast defaults to true -- not written here on purpose,
#       # to show what happens with NO override at all.
#     steps:
#       - run: npm test

# Push a commit that only breaks on Node 18:
#
# Node 18 job: FAILS at 2 minutes in.
# Per GitHub's own docs: "all jobs that are in progress or queued
# will be cancelled" -- so:
# Node 20 job: was still running at 1:30 in -- CANCELED, no result.
# Node 22 job: was still queued, waiting for a runner -- CANCELED,
#              never even started.
#
# Result: you know Node 18 is broken. You have NO idea whether
# Node 20 or 22 are also broken -- the matrix's whole purpose
# (a full compatibility picture) was defeated by the first failure.`,
    },
    {
      label: 'fail-fast: false (the main page\'s own choice) -- every combination finishes',
      language: 'bash',
      code: `# jobs:
#   ci:
#     strategy:
#       matrix:
#         node: [18, 20, 22]
#       fail-fast: false   # exactly what the main page's own
#                          # first code tab already sets
#     steps:
#       - run: npm test

# Same commit, only breaks on Node 18:
#
# Node 18 job: FAILS at 2 minutes in. NOT canceled -- it's already
#              the one that failed, it just reports its own result.
# Node 20 job: keeps running, uninterrupted by Node 18's failure.
#              Finishes at 3 minutes: PASSES.
# Node 22 job: also keeps running. Finishes at 3:10: PASSES.
#
# Result: one CI run, three complete results -- Node 18 fails,
# Node 20 and 22 both pass. A developer immediately knows exactly
# how narrow the compatibility problem is, in a single push, instead
# of needing several follow-up pushes to check each version.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team removes `fail-fast: false` from their Node compatibility matrix (reverting to the default) to "save CI minutes." The next release, a change breaks only on the oldest supported Node version. The team assumes, since the pipeline went red, that the change is broken everywhere and spends a day investigating unrelated Node 20/22 code paths before realizing the newer versions were never actually tested by that run. Using this subtopic\'s theory, explain what actually happened.',
    hint: 'Per this subtopic\'s theory, when the oldest-Node job failed, what happened to the runs for the OTHER Node versions — did they finish and report their own result, or something else?',
    solution: 'With `fail-fast` back at its default of true, the moment the oldest Node version\'s job failed, GitHub Actions canceled every other still-running or still-queued matrix job — per GitHub\'s own docs, "all jobs that are in progress or queued will be cancelled." The Node 20 and Node 22 jobs never actually finished running against this change at all; they were killed mid-run (or never started), which is indistinguishable in the UI from simply not having results yet. The team\'s assumption that "the pipeline is red, so it\'s broken everywhere" was never actually tested — the CI run only produced real evidence about the oldest Node version, not the other two. The fix is restoring `fail-fast: false` on this specific matrix, since its whole purpose (a full compatibility picture in one run) requires every combination to run to completion regardless of failures elsewhere.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'When one job in a GitHub Actions matrix fails, the other matrix jobs keep running by default, since they\'re independent combinations testing different things.',
      reality: 'Per this subtopic\'s theory, GitHub\'s own docs describe the OPPOSITE default: "all jobs that are in progress or queued will be cancelled" the moment one matrix job fails. Independence between combinations is not the default — `fail-fast: false` has to be set explicitly to get it, exactly as the main page\'s own first code tab does.'
    },
    {
      thought: 'fail-fast: false is just a nice-to-have that makes CI output slightly more complete — the main page could have left it out with no real consequence.',
      reality: 'This subtopic\'s theory shows it\'s load-bearing for the main page\'s own stated goal — a Node-version compatibility matrix that cancels every OTHER version\'s job the instant one version fails cannot actually tell you which versions are affected, defeating the entire point of running a multi-version matrix in the first place.'
    },
    {
      thought: 'Since fail-fast: false gives more complete information, it should be the default choice for every matrix, not just compatibility checks.',
      reality: 'Per this subtopic\'s theory, the tradeoff cuts the other way for a matrix that exists purely to PARALLELIZE otherwise-identical work (like sharded test runs) — an early failure there really does mean the whole run is doomed, so canceling the rest (the default, fail-fast: true) saves real compute with no loss of useful information.'
    }
  ];
}
