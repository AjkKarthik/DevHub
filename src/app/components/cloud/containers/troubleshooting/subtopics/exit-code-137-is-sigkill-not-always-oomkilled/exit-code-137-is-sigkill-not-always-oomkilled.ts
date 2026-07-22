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
  templateUrl: './exit-code-137-is-sigkill-not-always-oomkilled.html',
  styleUrl: './exit-code-137-is-sigkill-not-always-oomkilled.scss'
})
export class ExitCode137IsSigkillNotAlwaysOomkilledSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own quiz and theory state the 137-means-OOM equation as a flat fact',
      points: [
        'The main page\'s own quiz question asks "What does exit code 137 mean in a Kubernetes container?" and its own correct answer states plainly: "The container was killed by the OS Out-of-Memory killer (OOMKilled) — memory limit exceeded." The theory\'s exit-code table repeats the same one-to-one mapping: "Exit code 137: OOMKilled."',
        'The main page\'s own Challenge, "Pod Status Classifier," hard-codes this exact equation into its own solution logic: `if (exitCode === 137) { return "OOMKilled...", ... }` — treating exit code 137 as sufficient, on its own, to conclusively diagnose an OOM kill.',
      ]
    },
    {
      heading: 'What 137 actually confirms: SIGKILL was sent — not specifically WHY',
      points: [
        'Per how Linux and container runtimes report process termination, exit code 137 mechanically means `128 + 9` — the process was terminated by signal 9 (SIGKILL). Kubernetes surfaces this exact same 137 value for EVERY SIGKILL termination, regardless of what actually sent that signal — the Linux OOM killer is only ONE of several sources.',
        'A liveness probe that keeps failing past its `terminationGracePeriodSeconds` window causes kubelet itself to send SIGKILL to force the container to stop — producing exit code 137 with NOTHING to do with memory pressure. A manual `kubectl delete pod --grace-period=0 --force`, or a node-level `docker kill`/`crictl stop` outside of Kubernetes entirely, produces the identical 137 code too.',
        'The field that actually distinguishes these cases is a SEPARATE field the main page\'s own theory never mentions at all: `.status.containerStatuses[].lastState.terminated.reason`. When the Linux OOM killer specifically was the cause, this field is set to the literal string `"OOMKilled"` — for every OTHER source of SIGKILL, this field holds a different value (like `"Error"`) or is absent, even though `exitCode` reads 137 in every single case. Exit code 137 is necessary-but-not-sufficient evidence of an OOM kill; the `reason` field is what actually confirms or rules it out.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two different 137s -- one OOM, one not -- with identical exit codes',
      language: 'bash',
      code: `# Case 1: a genuine OOM kill (main page's own "Exit code 137 =
# OOMKilled" example) -- exitCode AND reason both confirm it:
kubectl get pod oom-pod -o jsonpath='{.status.containerStatuses[0].lastState.terminated}' | jq .
# {
#   "exitCode": 137,
#   "reason": "OOMKilled",        <- confirms it WAS memory pressure
#   "startedAt": "...",
#   "finishedAt": "..."
# }

# Case 2: a container killed because its liveness probe kept failing
# past terminationGracePeriodSeconds -- IDENTICAL exitCode, but a
# completely different reason, revealing this was never about memory:
kubectl get pod slow-shutdown-pod -o jsonpath='{.status.containerStatuses[0].lastState.terminated}' | jq .
# {
#   "exitCode": 137,
#   "reason": "Error",             <- NOT OOMKilled -- SIGKILL came
#                                      from kubelet forcing shutdown
#                                      after the grace period expired
#   "startedAt": "...",
#   "finishedAt": "..."
# }

# The main page's own Challenge solution -- "if (exitCode === 137)
# return OOMKilled" -- would misdiagnose Case 2 as a memory problem,
# sending an engineer to raise limits.memory when the real fix is
# either a faster-shutting-down app or a longer
# terminationGracePeriodSeconds.`,
    },
    {
      label: 'The correct diagnostic order: reason first, exitCode second',
      language: 'bash',
      code: `# The reliable way to actually confirm an OOM kill -- checking
# "reason" FIRST, treating exitCode 137 alone as inconclusive:
kubectl describe pod slow-shutdown-pod -n production | grep -A4 "Last State"
# Last State:  Terminated
#   Reason:    Error              <- the decisive field
#   Exit Code: 137
#   Started:   ...
#   Finished:  ...

# If Reason genuinely reads OOMKilled, THEN treat it as a memory
# issue and act on the main page's own advice (raise limits.memory,
# profile for a leak). If Reason reads anything else -- Error,
# Completed, or is simply absent -- exitCode 137 alone should prompt
# checking OTHER causes instead:
kubectl describe pod slow-shutdown-pod -n production | grep -B2 -A5 "Liveness"
# Liveness:  http-get http://:8080/health delay=5s timeout=1s period=10s #failure=3
# Warning  Unhealthy  kubelet  Liveness probe failed: Get "http://10.244.1.9:8080/health":
#                              context deadline exceeded
# -- reveals the ACTUAL cause: repeated liveness failures forced a
#    kubelet-initiated kill, unrelated to the container's memory usage
#    at all -- raising limits.memory here would fix nothing.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own diagnostic table, an engineer sees <code>exitCode: 137</code> in <code>kubectl describe pod</code> and immediately raises the container\'s <code>limits.memory</code>, assuming this must be an OOM kill. The pod keeps crashing with the same exit code even after the memory increase. Using this subtopic\'s theory, what specific field should have been checked BEFORE concluding this was a memory issue, and why might the fix not have worked?',
    hint: 'Exit code 137 mechanically only confirms that SIGKILL (signal 9) was sent. What SEPARATE field distinguishes "SIGKILL from the OOM killer" from "SIGKILL from some other source"?',
    solution: 'Per this subtopic\'s theory, the engineer should have checked `.lastState.terminated.reason` before concluding this was an OOM kill — exitCode 137 only confirms that SIGKILL was sent, and the OOM killer is just one of several possible sources of that same signal (a failed liveness probe past its grace period, a manual force-delete, and other SIGKILL sources all produce the identical 137 code). If `reason` reads anything other than the literal string "OOMKilled" — commonly "Error" for a grace-period-expired kubelet-initiated kill — then the container was never actually memory-constrained in the first place, which explains exactly why raising limits.memory had no effect: the fix addressed a cause that was never actually present. The real fix in that scenario would be investigating why the container isn\'t shutting down cleanly within its terminationGracePeriodSeconds window (commonly: not handling SIGTERM at all, or a slow in-flight-request drain), or checking why its liveness probe keeps failing in the first place — neither of which has anything to do with the memory limit the engineer adjusted.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Exit code 137, on its own, is sufficient and conclusive evidence that a container was killed specifically by the Linux OOM killer due to exceeding its memory limit — exactly as the main page\'s own quiz and Challenge solution treat it.',
      reality: 'Per this subtopic\'s theory, exit code 137 only confirms that SIGKILL was sent — it does not identify the SOURCE of that signal. The OOM killer is one possible source among several (failed liveness probes past their grace period, manual force-deletes, and others), all producing the identical 137 code.'
    },
    {
      thought: 'The `lastState.terminated.reason` field is a redundant, cosmetic label that always mirrors whatever the exitCode number already implies — checking it separately from exitCode adds no diagnostic value.',
      reality: 'Per this subtopic\'s exercise, `reason` is the field that ACTUALLY distinguishes an OOM kill (reason: "OOMKilled") from every other SIGKILL source (commonly reason: "Error") — two containers can share the identical exitCode 137 while having completely different, non-overlapping root causes, only visible via `reason`.'
    },
    {
      thought: 'If a container keeps showing exit code 137 after its memory limit has already been raised significantly, the limit simply wasn\'t raised high enough yet, and further increases will eventually resolve it.',
      reality: 'Per this subtopic\'s theory, if the underlying cause was never actually memory pressure (confirmed by checking `reason`), no amount of raising the memory limit will fix a recurring 137 — the real fix lies elsewhere entirely, such as graceful-shutdown handling or liveness probe tuning.'
    }
  ];
}
