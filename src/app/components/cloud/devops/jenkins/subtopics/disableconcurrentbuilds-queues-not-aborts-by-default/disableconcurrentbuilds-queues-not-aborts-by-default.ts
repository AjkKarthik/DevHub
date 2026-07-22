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
  templateUrl: './disableconcurrentbuilds-queues-not-aborts-by-default.html',
  styleUrl: './disableconcurrentbuilds-queues-not-aborts-by-default.scss'
})
export class DisableconcurrentbuildsQueuesNotAbortsByDefaultSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page uses disableConcurrentBuilds() in its own first code tab, but its theory never explains what it actually does',
      points: [
        'The main page\'s own "Declarative Jenkinsfile" code tab includes `disableConcurrentBuilds()` inside `options{}`, right alongside `timeout()` and `buildDiscarder()` — both of which the theory sections explain elsewhere. `disableConcurrentBuilds()` itself is never mentioned again anywhere on the page.',
        'Jenkins\'s own documentation describes it plainly: "Disallow concurrent executions of the Pipeline. Can be useful for preventing simultaneous accesses to shared resources, etc." What it does NOT say, without reading further, is what happens to the SECOND build that triggers while the first one is still running.',
      ]
    },
    {
      heading: 'The default behavior is to queue the new build, not abort the running one — abortPrevious is a separate, opt-in parameter',
      points: [
        'By default, `disableConcurrentBuilds()` makes a second, overlapping build WAIT in the queue until the first one finishes — it does not touch the already-running build at all. Two pushes to the same branch in quick succession still both eventually run, just one after another instead of in parallel.',
        'Per Jenkins\'s own documentation, aborting the in-progress build instead requires an explicit, separate parameter: "options { disableConcurrentBuilds(abortPrevious: true) } to abort the running one and start the new build." Without `abortPrevious: true`, nothing gets aborted — the option\'s whole job, by itself, is only to prevent overlap, not to prioritize the newest commit.',
        'This distinction matters for exactly the deploy stage the main page\'s own first code tab guards with this option: a team that assumes `disableConcurrentBuilds()` alone means "always deploy the latest commit, cancel anything stale" will instead see every push queue up and eventually deploy, one at a time, in the order they arrived — including commits that were already superseded by the time their turn comes.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Default: overlapping builds queue, they don\'t cancel each other',
      language: 'bash',
      code: `# pipeline {
#   agent any
#   options {
#     disableConcurrentBuilds()   // exactly what the main page's own
#                                 // first code tab already uses
#   }
#   stages {
#     stage('Deploy') {
#       steps { sh './deploy.sh' }
#     }
#   }
# }

# Push #1 to main -> Build #41 starts running Deploy.
# Push #2 to main (30 seconds later, superseding #1's commit)
#   -> Build #42 is created immediately, but per Jenkins's own docs,
#      it WAITS in the queue -- it does not touch Build #41 at all.
# Push #3 to main (another commit, before #41 even finishes)
#   -> Build #43 also queues, behind #42.

# End result with the DEFAULT behavior: #41, #42, #43 all eventually
# run, one after another, each deploying whatever commit it was
# queued with -- including #41 and #42's now-superseded commits.
# Nothing was aborted; disableConcurrentBuilds() only ever promised
# to prevent OVERLAP, not to prioritize the newest push.`,
    },
    {
      label: 'abortPrevious: true -- the explicit opt-in for "cancel the stale one"',
      language: 'bash',
      code: `# pipeline {
#   agent any
#   options {
#     disableConcurrentBuilds(abortPrevious: true)
#     // Per Jenkins's own docs: "...to abort the running one and
#     // start the new build."
#   }
#   stages {
#     stage('Deploy') {
#       steps { sh './deploy.sh' }
#     }
#   }
# }

# Push #1 to main -> Build #41 starts running Deploy.
# Push #2 to main (30 seconds later) -> Build #41 is ABORTED
#   immediately, and Build #42 starts running instead.
# Push #3 to main -> Build #42 is aborted, Build #43 starts.

# End result with abortPrevious: true: only #43 (the LATEST commit)
# actually completes a deploy -- #41 and #42 never finish, exactly
# the "always deploy the newest thing, skip anything superseded"
# behavior a team might have assumed the plain
# disableConcurrentBuilds() call already provided.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team adds `disableConcurrentBuilds()` to their Deploy pipeline specifically because they want every push to main to always deploy the LATEST commit, canceling anything still in progress. A week later they notice deploys are taking much longer to reflect the newest commit than expected — every push still seems to run to completion, just queued up one after another. Using this subtopic\'s theory, explain what they misunderstood, and the one-line fix.',
    hint: 'Per this subtopic\'s theory, does the bare `disableConcurrentBuilds()` call, with no further parameters, cancel an in-progress build when a new one is triggered — or does it just prevent them from running at the same time?',
    solution: 'The team misunderstood what `disableConcurrentBuilds()` does by default — per this subtopic\'s theory, Jenkins\'s own docs describe its baseline behavior only as "Disallow concurrent executions of the Pipeline," which means a new build QUEUES behind an already-running one rather than canceling it. The team\'s deploys were never actually canceled — every push\'s build was still running to completion, just serialized one after another, so a burst of pushes produced a growing queue of increasingly stale deploys rather than one fast deploy of the latest commit. The fix is the explicit, separate `abortPrevious: true` parameter — `disableConcurrentBuilds(abortPrevious: true)` — which per Jenkins\'s own docs actually does "abort the running one and start the new build," giving the team the "always deploy the newest, skip anything superseded" behavior they assumed the bare option already provided.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'disableConcurrentBuilds() means Jenkins always cancels an in-progress build the moment a newer one is triggered, so only the latest commit ever actually deploys.',
      reality: 'Per this subtopic\'s theory, the DEFAULT behavior only prevents builds from running at the SAME TIME — a new build queues and waits its turn. Canceling the in-progress build instead requires the separate, explicit `abortPrevious: true` parameter.'
    },
    {
      thought: 'Since the main page\'s own first code tab uses disableConcurrentBuilds() for a Deploy pipeline, that must already be the "cancel stale deploys" configuration.',
      reality: 'This subtopic\'s first code example shows the main page\'s own exact usage (`disableConcurrentBuilds()` with no `abortPrevious` parameter) only serializes overlapping deploys — it does not cancel anything. A team wanting the cancel-stale-deploys behavior needs the additional `abortPrevious: true` parameter the main page never uses or mentions.'
    },
    {
      thought: 'abortPrevious: true is just a performance optimization — a nice-to-have that speeds up queue processing but doesn\'t really change WHICH commit ends up deployed.',
      reality: 'This subtopic\'s second code example shows it changes the actual OUTCOME, not just the speed — without it, every queued commit eventually deploys in order (including stale ones); with it, only the latest commit\'s deploy actually completes, since every earlier one gets aborted as soon as a newer push arrives.'
    }
  ];
}
