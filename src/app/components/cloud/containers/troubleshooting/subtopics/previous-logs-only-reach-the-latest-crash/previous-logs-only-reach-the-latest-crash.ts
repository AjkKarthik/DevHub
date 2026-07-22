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
  templateUrl: './previous-logs-only-reach-the-latest-crash.html',
  styleUrl: './previous-logs-only-reach-the-latest-crash.scss'
})
export class PreviousLogsOnlyReachTheLatestCrashSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own advice repeats "--previous shows the crash" without a limit',
      points: [
        'The main page\'s own theory states plainly: "kubectl logs --previous retrieves logs from a container\'s PREVIOUS instance after a crash and restart." The mistake entry, quiz, and QnA all repeat this same advice as if `--previous` were a general window into every past crash a Pod has ever had.',
        'Nowhere does the main page qualify WHICH previous instance `--previous` actually reaches, or what happens once a CrashLoopBackOff pod has already restarted several times before an engineer gets around to investigating it — a very common real-world sequence, since alerting and human response time both take a while.',
      ]
    },
    {
      heading: 'What actually happens: --previous reaches exactly ONE prior instance — the most recent one — never further back',
      points: [
        'Per how `kubectl logs --previous` actually works, it retrieves logs from only the SINGLE most recently terminated container instance for that Pod — not a rolling history of every crash. Once a container has restarted MORE than once, the logs from any crash before the immediately-preceding one are already gone from what `kubectl logs` can access at all, `--previous` included.',
        'This means that by the time an engineer notices a CrashLoopBackOff alert and runs `kubectl logs <pod> --previous`, if the pod has already cycled through several restarts since the alert first fired (a realistic scenario, especially overnight or during a slow-to-page incident), they may be looking at the log output from a LATER crash than the one that actually matters — and the ORIGINAL failure\'s own diagnostic detail (which might differ from later, cascading failures) is permanently inaccessible via kubectl alone.',
        'The main page\'s own container-runtime detail about log ROTATION (mentioned only for a completely different mistake entry, about apps writing to files instead of stdout) compounds this in a different way: even the single most recent previous instance\'s logs are subject to the runtime\'s own rotation limits, meaning a very verbose crash can lose its EARLIEST lines even within that one retrievable instance. The only real fix for either limitation is shipping logs to an external, persistent system (Fluentd, Promtail, Vector, or similar) BEFORE Kubernetes\' own transient log retention discards them — kubectl\'s own log access was never designed to be a durable, multi-crash history.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: '--previous only ever reaches the MOST RECENT crash',
      language: 'bash',
      code: `# The main page's own api-xyz pod, now several restarts deep into
# an ongoing CrashLoopBackOff -- the FIRST crash happened hours ago,
# with a distinct root cause; LATER crashes are secondary/cascading
# failures triggered by the pod's own repeated restart attempts:

kubectl get pod api-xyz -n production
# NAME      READY   STATUS             RESTARTS   AGE
# api-xyz   0/1     CrashLoopBackOff   14         3h

# An engineer, just starting to investigate, runs the main page's
# own documented command:
kubectl logs api-xyz -n production --previous
# ... shows logs from crash #14 (the MOST RECENT one) ...
# Error: ECONNREFUSED connecting to redis:6379
# -- this is a DIFFERENT, downstream symptom (redis unreachable,
#    possibly because THIS pod's own repeated restarts are what's
#    overwhelming a connection pool) -- NOT the original root cause
#    that started this whole CrashLoopBackOff 3 hours and 13 restarts
#    ago, which is now completely unrecoverable via kubectl.

# Crashes #1 through #13's own logs are simply gone -- there is no
# --previous=13 or any equivalent kubectl flag to reach further back
# than the single most recent terminated instance.`,
    },
    {
      label: 'Why centralized logging is the only real fix for this gap',
      language: 'bash',
      code: `# Check whether this cluster ships logs anywhere BEFORE they're
# lost to kubectl's own transient, single-instance retention:
kubectl get pods -n logging
# NAME                      READY   STATUS
# fluent-bit-abc12          1/1     Running   <- good, logs ARE
#                                                 being centralized

# If a log-shipping DaemonSet like this exists, the ORIGINAL crash's
# own logs (crash #1, from 3 hours ago) are very likely still
# queryable in the external system, even though kubectl itself has
# long since lost access to them:
# -- e.g., in Loki via LogQL:
#    {pod="api-xyz", namespace="production"} |= "FATAL" | json
#    | line_format "{{.timestamp}} {{.msg}}"
# -- filtering by the ORIGINAL crash's own timestamp (3 hours ago),
#    not just the most recent one --previous alone can reach.

# Without a log-shipping DaemonSet at all, the earlier crashes'
# diagnostic detail is genuinely, permanently gone -- the practical
# lesson for any cluster expected to run CrashLoopBackOff-prone
# workloads reliably is that kubectl logs --previous is a USEFUL
# first-response tool, not a substitute for centralized log
# retention -- exactly the gap the main page's own advice never
# flags as a limitation.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A pod has been in CrashLoopBackOff for 3 hours with 14 restarts by the time an on-call engineer investigates. Following the main page\'s own documented command, they run <code>kubectl logs api-xyz --previous</code> and see a Redis connection error, conclude that\'s the root cause, and spend an hour fixing Redis connectivity — but the pod keeps crashing afterward with the exact same pattern. Using this subtopic\'s theory, what likely went wrong with their diagnosis?',
    hint: 'The pod has restarted 14 times. Does <code>--previous</code> reach back to crash #1 (the original failure), or does it only ever reach the SINGLE most recent one?',
    solution: 'Per this subtopic\'s theory, the engineer most likely diagnosed a SYMPTOM of the ongoing crash loop rather than its original root cause. kubectl logs --previous only ever retrieves logs from the single most recently terminated container instance — in this case, crash #14, not crash #1 from three hours and thirteen restarts earlier. The Redis connection error they found in crash #14\'s logs could very plausibly be a DOWNSTREAM consequence of the pod\'s own repeated restart cycle (e.g., a connection pool getting exhausted by repeated reconnect attempts, or a dependency that only becomes unreachable once the pod has been flapping for a while) rather than the actual original trigger. Because crashes #1 through #13\'s own logs are permanently inaccessible via kubectl once superseded by later restarts, there was no way to verify this using kubectl alone — fixing the Redis symptom naturally didn\'t resolve the underlying issue, since it was never the true root cause. The reliable fix for this class of problem is having a centralized log-shipping system (Fluentd, Promtail, Vector) in place BEFORE an incident occurs, so the original crash\'s own logs remain queryable long after kubectl itself has moved past them.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'kubectl logs --previous provides access to the full history of every past crash a Pod has experienced, letting an engineer investigate the ORIGINAL failure even after many subsequent restarts.',
      reality: 'Per this subtopic\'s theory, --previous only ever reaches the SINGLE most recently terminated container instance — once a Pod has restarted more than once, logs from any earlier crash are already inaccessible via kubectl, --previous included.'
    },
    {
      thought: 'In an ongoing CrashLoopBackOff, every individual crash shares the same root cause, so investigating whichever crash --previous happens to reach is functionally equivalent to investigating the original one.',
      reality: 'Per this subtopic\'s exercise, later crashes in an ongoing loop can be genuinely different, downstream symptoms caused by the repeated restart cycle itself (exhausted connection pools, dependency timing issues) rather than a repeat of the original failure — diagnosing the wrong one can lead to fixing a symptom while the real cause remains unaddressed.'
    },
    {
      thought: 'Since kubectl logs --previous is the documented, standard tool for post-crash diagnosis, no additional logging infrastructure is necessary for reliably troubleshooting CrashLoopBackOff incidents.',
      reality: 'Per this subtopic\'s theory, kubectl\'s own log retention is transient and limited to one prior instance — reliably diagnosing an incident that involves many restarts before human investigation begins requires a centralized log-shipping system in place beforehand, not just kubectl access after the fact.'
    }
  ];
}
