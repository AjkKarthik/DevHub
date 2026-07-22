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
  templateUrl: './stop-with-empty-ps-q-errors-not-noop.html',
  styleUrl: './stop-with-empty-ps-q-errors-not-noop.scss'
})
export class StopWithEmptyPsQErrorsNotNoopSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own batch-operation example only shows the case where it works',
      points: [
        'The main page\'s "Lifecycle & Batch" code tab shows `docker stop $(docker ps -q)` with the comment "# Stop all running containers." The example is written and demonstrated for the case where at least one container is currently running — the only scenario where `docker ps -q` actually produces any output to substitute in.',
        'Nothing on the page addresses the other case: what `docker stop $(docker ps -q)` does when NO containers are running at all. A reader reasonably assumes "stop all running containers," when there are zero running containers, would sensibly do nothing — an empty set has nothing to stop.',
        'That assumption does not hold. `docker ps -q` with no running containers outputs nothing at all — not even a blank line, genuinely zero bytes. Command substitution `$(...)` with empty output does not vanish; it leaves `docker stop` with NO arguments whatsoever, and `docker stop` requires at least one container name or ID to be given.',
      ]
    },
    {
      heading: 'What actually happens, and why this matters specifically for scripts',
      points: [
        'Run interactively with no containers running, `docker stop $(docker ps -q)` expands to plain `docker stop` — the Docker CLI immediately rejects this with a usage error ("requires at least 1 argument") and a non-zero exit code. It is not silent, and it is not a no-op; it is a visible, if easily-dismissed-as-harmless-looking, error.',
        'The practical risk is entirely about scripting context, not interactive use: a cleanup or CI script that runs this exact line unconditionally, as part of a longer sequence (`set -e` or similar), will ABORT the rest of the script the moment it hits this line on a host with no running containers — a state that is completely normal (e.g. right after a previous cleanup step, or on a freshly-provisioned CI runner) but treated as a hard failure purely because of how command substitution interacts with a required-argument command.',
        'The main page\'s own two neighbouring lines in the SAME code tab — `docker container prune -f` and `docker system prune -f` — do NOT have this problem: both are written to tolerate "there is nothing to clean up" as a normal, silently-successful outcome, since neither one requires an explicit list of targets the way `docker stop $(docker ps -q)` does. The batch pattern that works safely for prune does not transfer safely to stop, even though both commands sit in the same "batch cleanup" section of the same tab.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The same line, two different hosts',
      language: 'bash',
      code: `# ── Host A: containers are running ──────────────────────────────────────
docker ps -q
# a1b2c3d4e5f6
# 9f8e7d6c5b4a

docker stop $(docker ps -q)
# expands to: docker stop a1b2c3d4e5f6 9f8e7d6c5b4a
# a1b2c3d4e5f6
# 9f8e7d6c5b4a
# Works exactly as the main page's own comment describes.

# ── Host B: nothing is running (e.g. right after a prior cleanup step) ───
docker ps -q
# (no output at all -- zero bytes, not even a newline)

docker stop $(docker ps -q)
# expands to: docker stop           <-- ZERO arguments
# "docker stop" requires at least 1 argument.
# See 'docker stop --help'.
#
# Usage:  docker stop [OPTIONS] CONTAINER [CONTAINER...]
#
# Exit code: 1

# This is NOT "nothing to stop, moving on" -- it is a real CLI usage
# error, printed to stderr, with a non-zero exit code.`,
    },
    {
      label: 'Why the sibling prune commands in the SAME tab don\'t have this problem',
      language: 'bash',
      code: `# The main page's own neighbouring lines, same "Lifecycle & Batch" tab:

docker container prune -f
# On a host with NOTHING to remove:
# Total reclaimed space: 0B
# Exit code: 0 -- succeeds silently, no error, nothing to fix

docker system prune -f
# Same story -- an empty result set is a completely normal, successful
# outcome for prune, because prune never needs an explicit target list
# substituted in from a separate command. It already knows how to find
# (and gracefully find NONE of) its own targets.

# ── The actual safe fix for the stop-all pattern ──────────────────────────
RUNNING=$(docker ps -q)
if [ -n "$RUNNING" ]; then
  docker stop $RUNNING
fi

# Or, more concisely, using xargs' own built-in "do nothing on empty
# input" behavior:
docker ps -q | xargs -r docker stop
# -r (--no-run-if-empty) skips running the command entirely if xargs
# receives no input at all -- turning the empty-container-list case
# into a genuine, safe no-op instead of a usage error.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A CI pipeline\'s cleanup stage runs several commands in sequence with `set -e` (abort on any command failure), including `docker container prune -f`, `docker system prune -f`, and `docker stop $(docker ps -q)` in that order. On most runs the pipeline completes cleanly. Occasionally — specifically on runs where a PREVIOUS pipeline stage already stopped every container itself — the cleanup stage fails partway through, and the remaining cleanup steps after the failure never run. Using this subtopic\'s theory, which line is most likely responsible, and why does it only fail sometimes?',
    hint: 'Per this subtopic\'s theory, which of these three commands behaves differently (errors instead of succeeding) specifically when there are zero running containers, and does that condition happen on every run or only some?',
    solution: 'Per this subtopic\'s theory, `docker stop $(docker ps -q)` is the most likely culprit, and it only fails intermittently because it only fails on the SPECIFIC condition of zero running containers at the moment it executes — which, per the scenario, only happens on runs where an earlier pipeline stage already stopped everything. On those runs, `docker ps -q` produces no output, the command expands to bare `docker stop` with no arguments, Docker rejects it with a usage error and a non-zero exit code, and `set -e` immediately aborts the rest of the cleanup stage — exactly matching the observed "occasionally fails partway through, remaining steps never run" symptom. The two prune commands earlier in the same stage are NOT the cause, per this subtopic\'s theory, since both tolerate an empty result set as a normal, zero-exit-code success regardless of how many containers were running beforehand. The fix is replacing the bare `docker stop $(docker ps -q)` line with either an explicit empty-check or `docker ps -q | xargs -r docker stop`, so the "zero containers running" case becomes a safe no-op instead of a pipeline-aborting error.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'docker stop $(docker ps -q) is safe to run unconditionally in a cleanup script, since "stop all running containers" naturally does nothing when there are none to stop.',
      reality: 'Per this subtopic\'s theory, when docker ps -q produces no output, the command substitution leaves docker stop with zero arguments — and docker stop requires at least one container argument, so it exits with a real usage error rather than silently doing nothing.'
    },
    {
      thought: 'Since docker container prune -f and docker system prune -f safely handle "nothing to clean up" as a normal outcome, docker stop $(docker ps -q) in the same section of the same code tab must behave the same way.',
      reality: 'Per this subtopic\'s theory, the prune commands never need an externally-substituted target list — they find their own targets internally and tolerate finding none. docker stop $(docker ps -q) instead depends on a SEPARATE command\'s output being non-empty to have any arguments at all, which is a fundamentally different failure mode the neighbouring prune commands don\'t share.'
    },
    {
      thought: 'A script that fails on docker stop $(docker ps -q) when no containers are running is hitting a rare edge case unlikely to occur in normal operation.',
      reality: 'Per this subtopic\'s exercise, "zero containers currently running" is an entirely ordinary state — right after a previous cleanup step, on a freshly-provisioned CI runner, or simply between deployments — making this a realistic, recurring failure mode for any script or pipeline stage that runs this exact pattern unconditionally, not a rare corner case.'
    }
  ];
}
