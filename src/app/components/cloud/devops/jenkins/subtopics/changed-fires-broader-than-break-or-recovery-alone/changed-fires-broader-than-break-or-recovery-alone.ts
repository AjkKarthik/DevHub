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
  templateUrl: './changed-fires-broader-than-break-or-recovery-alone.html',
  styleUrl: './changed-fires-broader-than-break-or-recovery-alone.scss'
})
export class ChangedFiresBroaderThanBreakOrRecoveryAloneSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own theory recommends changed for exactly the use case it is NOT precise enough for',
      points: [
        'The main page\'s own "Declarative vs Scripted Pipelines" theory lists `post{}` sections and describes `changed` as running "when status changes from previous run — good for Slack notifications only when something breaks or recovers." That description names two specific events — breaking, and recovering — as the reason to reach for `changed`.',
        'Jenkins\'s own documentation defines `changed` more broadly than that: "Only run the steps in post if the current Pipeline\'s run has a different completion status from its previous run." ANY difference in completion status counts — not just a success-to-failure break or a failure-to-success recovery.',
      ]
    },
    {
      heading: 'fixed and regression are the two conditions actually built for "break" and "recover" specifically',
      points: [
        'Per Jenkins\'s own documentation, two OTHER post-conditions exist that the main page never mentions at all: `fixed` — "Only run the steps in post if the current Pipeline\'s run is successful and the previous run failed or was unstable" — and `regression` — "Only run the steps in post if the current Pipeline\'s or status is failure, unstable, or aborted and the previous run was successful."',
        '`fixed` is precisely "recovered" (and only recovered — success now, after a real failure or instability before). `regression` is precisely "broke" (and only broke — a genuine problem now, after a clean previous run). `changed` is broader than either: it also fires for transitions neither `fixed` nor `regression` would call a break or a recovery at all — for example UNSTABLE to FAILURE (already broken, now differently broken) or SUCCESS to ABORTED (a manually canceled run, not a code regression).',
        'A Slack notification wired to `changed`, following the main page\'s own advice literally, will therefore also fire on these edge transitions — someone manually aborting a build produces the exact same "status changed!" alert as an actual regression, which is a real source of alert fatigue the main page\'s own phrasing doesn\'t warn about.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'changed fires on transitions that are neither a break nor a recovery',
      language: 'bash',
      code: `# post {
#   changed {
#     slackSend message: "Build status changed: \${currentBuild.currentResult}"
#   }
# }

# Per the main page's own theory, this is meant to catch "something
# breaks or recovers." But per Jenkins's own docs, changed compares
# ONLY completion status, with no judgment about which direction:

# Run N-1: SUCCESS   -> Run N: FAILURE     -- a real regression. Fires.
# Run N-1: FAILURE   -> Run N: SUCCESS     -- a real recovery.   Fires.
# Run N-1: UNSTABLE  -> Run N: FAILURE     -- already broken, now
#                                             differently broken.  Fires.
# Run N-1: SUCCESS   -> Run N: ABORTED     -- someone manually
#                                             canceled the build,
#                                             nothing regressed.    Fires.
# Run N-1: ABORTED   -> Run N: SUCCESS     -- the build simply ran
#                                             to completion this
#                                             time, no "recovery"
#                                             from any real problem. Fires.

# Every one of these sends the identical "status changed" Slack
# message, even though only two of the five are what the main
# page's own phrasing ("breaks or recovers") actually describes.`,
    },
    {
      label: 'fixed and regression -- the precise tools for exactly break vs. recover',
      language: 'bash',
      code: `# post {
#   regression {
#     // Per Jenkins's own docs: fires only when current status is
#     // failure/unstable/aborted AND the previous run was successful.
#     slackSend message: "REGRESSION: build broke -- \${currentBuild.currentResult}"
#   }
#   fixed {
#     // Per Jenkins's own docs: fires only when current status is
#     // successful AND the previous run failed or was unstable.
#     slackSend message: "FIXED: build recovered after \${currentBuild.previousBuild?.result}"
#   }
# }

# Re-running the same five transitions from the first example
# against THESE two conditions instead of changed:

# SUCCESS  -> FAILURE    -- regression fires.  fixed does not.
# FAILURE  -> SUCCESS    -- fixed fires.       regression does not.
# UNSTABLE -> FAILURE    -- neither fires (previous wasn't SUCCESS).
# SUCCESS  -> ABORTED    -- neither fires (current isn't SUCCESS,
#                            and regression needs failure/unstable/
#                            aborted -- ABORTED actually qualifies,
#                            so regression DOES fire here too, since
#                            its own definition explicitly includes
#                            aborted as a qualifying "broke" status).
# ABORTED  -> SUCCESS    -- fixed fires (previous failed OR was
#                            unstable -- ABORTED doesn't strictly
#                            match either word, so check the exact
#                            wording against your Jenkins version
#                            before relying on this specific case).`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team wires `post { changed { slackSend ... } }` to their pipeline specifically so the on-call channel gets pinged only when a deploy actually breaks or recovers, following the main page\'s own advice. A week later, someone complains the channel is noisy — pings are firing on builds nobody would call a "break" or a "recovery." Using this subtopic\'s theory, explain the likely cause, and the fix.',
    hint: 'Per this subtopic\'s theory, does `changed` only fire on the SPECIFIC transitions a human would call "broke" or "recovered," or on any difference in completion status at all — including things like a manually aborted build?',
    solution: 'The likely cause is `changed` firing on status transitions that are real, technically-different-from-last-time changes, but aren\'t actually a break or a recovery in the way the team means — per this subtopic\'s theory, Jenkins\'s own docs define `changed` as firing whenever "the current Pipeline\'s run has a different completion status from its previous run," with no distinction between a genuine regression and something like a SUCCESS-to-ABORTED transition from someone manually canceling a build. The main page\'s own "good for... when something breaks or recovers" framing describes a narrower use case than what `changed` actually implements. The fix is switching to the two conditions actually built for that narrower case: `regression` (fires only when the current run failed/was unstable/was aborted AND the previous run succeeded) for break alerts, and `fixed` (fires only when the current run succeeded AND the previous run failed or was unstable) for recovery alerts — together giving the on-call channel exactly the two transitions the team originally wanted, without every other status change also triggering a ping.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'post { changed { ... } } is precisely "notify when the build breaks or recovers," exactly as the main page\'s own theory describes it.',
      reality: 'Per this subtopic\'s theory, Jenkins\'s own docs define `changed` more broadly — any difference in completion status from the previous run, not specifically a break or a recovery. Transitions like UNSTABLE-to-FAILURE or SUCCESS-to-ABORTED also count as "changed" even though neither is what most teams mean by "broke" or "recovered."'
    },
    {
      thought: 'There\'s no dedicated Jenkins post-condition for "only when the build actually broke" or "only when it actually recovered" — changed is the closest thing available.',
      reality: 'This subtopic\'s theory shows Jenkins provides exactly these two conditions by name: `regression` (current run failed/unstable/aborted, previous run succeeded) and `fixed` (current run succeeded, previous run failed or was unstable) — the main page never mentions either, but they are the precise, purpose-built tools for the break/recover use case its own `changed` description gestures at.'
    },
    {
      thought: 'Since regression and fixed sound like the "advanced" versions of changed, using changed instead is a simpler, safe default with no real downside.',
      reality: 'This subtopic\'s exercise shows a concrete downside — a `changed`-based notification fires on transitions a team would not consider noteworthy (like a manually aborted build), producing exactly the kind of noisy, low-signal alerting that erodes trust in a notification channel over time.'
    }
  ];
}
