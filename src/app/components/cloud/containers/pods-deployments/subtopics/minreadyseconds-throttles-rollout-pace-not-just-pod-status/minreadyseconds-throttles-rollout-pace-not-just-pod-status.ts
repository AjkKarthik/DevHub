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
  templateUrl: './minreadyseconds-throttles-rollout-pace-not-just-pod-status.html',
  styleUrl: './minreadyseconds-throttles-rollout-pace-not-just-pod-status.scss'
})
export class MinreadysecondsThrottlesRolloutPaceNotJustPodStatusSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own theory bullet defines minReadySeconds as a status-reporting delay only',
      points: [
        'The main page\'s own "Rolling Update Strategy" theory bullet says: "minReadySeconds: seconds a new Pod must be ready before being counted as available (default 0)." Read on its own, that sounds like a purely cosmetic delay in when a Pod\'s status FLIPS to "available" — as if it only affects what `kubectl get pods` or `kubectl rollout status` reports, not the actual pace of the rollout itself.',
        'The main page\'s own Deployment manifest code tab sets `minReadySeconds: 10` alongside `maxSurge: 1` and `maxUnavailable: 0`, but never connects these three fields to each other — leaving the reader to assume minReadySeconds is an independent, secondary setting rather than something that interacts directly with how fast maxSurge/maxUnavailable let the rollout proceed.',
      ]
    },
    {
      heading: 'What actually happens: "Available" — not "Ready" — is the count that gates the next surge',
      points: [
        'Per Kubernetes\' own Deployment rollout mechanics, the rolling-update controller does not create the next batch of new Pods purely based on how many Pods have passed their readinessProbe — it uses `status.availableReplicas`, and a Pod only counts as "Available" once it has been continuously Ready for AT LEAST `minReadySeconds`.',
        'This means minReadySeconds directly throttles ROLLOUT SPEED, not just a status label: with the main page\'s own `maxSurge: 1, maxUnavailable: 0, minReadySeconds: 10`, the controller can have at most 1 extra Pod above the desired count at any moment — so it cannot start the NEXT surge Pod until the current surge Pod has been Ready for the full 10 seconds and is counted Available, adding a real, minimum 10-second pause between every single Pod replacement in the rollout.',
        'A Deployment with many replicas and a small maxSurge therefore takes noticeably longer to fully roll out as minReadySeconds grows — for example, rolling 20 replicas one at a time (maxSurge: 1) with minReadySeconds: 10 adds a hard floor of roughly 200 seconds to the total rollout time beyond however long the Pods themselves take to become Ready, purely from this pacing gate.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Ready vs. Available — the distinction the main page never draws',
      language: 'bash',
      code: `# The main page's own manifest:
#   maxSurge: 1
#   maxUnavailable: 0
#   minReadySeconds: 10

# Watching one surge Pod's status transitions during a rollout:
kubectl get pods -w
# NAME                   READY   STATUS    AGE
# web-new-abc123         0/1     Running   2s     <- container started
# web-new-abc123         1/1     Running   4s     <- readinessProbe PASSED (Ready)
# web-new-abc123         1/1     Running   4s     <- still NOT yet "Available"

# Per Kubernetes' own rollout mechanics, "Ready" and "Available" are
# DIFFERENT states:
#   Ready:      the last readinessProbe check succeeded, right now
#   Available:  Ready CONTINUOUSLY for at least minReadySeconds

# The rollout controller's maxSurge/maxUnavailable math uses
# AVAILABLE replicas, not just Ready ones -- so with maxSurge: 1,
# the controller will NOT start the next surge Pod until this one
# has been Ready for the full 10s and flips to Available:

kubectl get deployment web -o jsonpath='{.status.availableReplicas}'
# stays at the OLD count for a full 10s after the new Pod goes Ready
# -- even though "kubectl get pods" already shows 1/1 READY`,
    },
    {
      label: 'Why this adds real, cumulative time to the whole rollout',
      language: 'bash',
      code: `# Deployment with 20 replicas, maxSurge: 1, maxUnavailable: 0,
# minReadySeconds: 10 -- rolling out one Pod at a time.

# For EACH of the 20 replacements, the controller must wait:
#   ~(time for new Pod to become Ready) + 10s (minReadySeconds gate)
# before it is allowed to surge the NEXT replacement Pod.

# Approximate total rollout time floor, purely from minReadySeconds
# (ignoring however long the Pods themselves take to become Ready):
#   20 replacements x 10s minReadySeconds = ~200s minimum

kubectl rollout status deployment/web
# Waiting for deployment "web" rollout to finish: 1 out of 20 new
# replicas have been updated...
# (this line advances roughly once per ~10s+ interval, not instantly
#  the moment each new Pod's container starts passing its probe)

# This is NOT a bug or something to "fix" -- it's the exact,
# intentional purpose of minReadySeconds: giving each new Pod a
# stable soak period before trusting it enough to retire the next
# old Pod, at the direct cost of total rollout duration.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team increases <code>minReadySeconds</code> from 0 to 30 on a Deployment with <code>maxSurge: 1</code>, expecting this to only change how quickly <code>kubectl get pods</code> reports a new Pod as ready. After the change, they notice full rollouts of their 15-replica Deployment now take several minutes longer than before, and file a bug report claiming the rolling-update controller has slowed down for an unrelated reason. Using this subtopic\'s theory, is a code regression in the controller the right explanation?',
    hint: 'What does <code>maxSurge: 1</code> actually gate the NEXT surge Pod on — Ready, or Available? And what does minReadySeconds control the transition from Ready to Available?',
    solution: 'No — per this subtopic\'s theory, this is expected behavior directly caused by the minReadySeconds change, not a controller regression. With maxSurge: 1, only one extra Pod above the desired count is allowed at any time, so the controller must wait for that one surge Pod to become Available — Ready continuously for the full minReadySeconds duration — before it is permitted to start the next replacement. Raising minReadySeconds from 0 to 30 adds a real 30-second pause before EVERY one of the 15 sequential replacements can proceed (since maxSurge: 1 forces them to happen essentially one at a time), for a rollout-time floor increase of roughly 15 x 30s = ~450 seconds (7.5 minutes) purely from this pacing gate — on top of however long the Pods themselves already took to become Ready. This matches the "several minutes longer" symptom precisely, and is exactly the intended tradeoff minReadySeconds makes: a longer soak period per Pod in exchange for more confidence before retiring the next old Pod. The fix, if the team wants faster rollouts, is to lower minReadySeconds (or raise maxSurge to parallelize more replacements) — not to look for a bug in the controller itself.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own <code>minReadySeconds</code> field only delays when a Pod\'s status LABEL flips to "available" in <code>kubectl</code> output — it has no effect on how fast the actual rollout proceeds.',
      reality: 'Per this subtopic\'s theory, the rolling-update controller\'s own maxSurge/maxUnavailable pacing math is based on the Available replica count, not the Ready count — so minReadySeconds directly gates how soon the NEXT surge Pod is allowed to start, adding real, cumulative time to the whole rollout.'
    },
    {
      thought: 'A Pod that shows 1/1 READY in <code>kubectl get pods</code> is immediately usable by the Deployment controller for rollout-pacing decisions, the same instant its readinessProbe passes.',
      reality: 'Per this subtopic\'s theory, "Ready" (the current readinessProbe result) and "Available" (Ready continuously for minReadySeconds) are distinct states — the rollout controller\'s maxSurge/maxUnavailable accounting uses Available, so a Pod can show READY in kubectl well before it counts toward letting the rollout advance.'
    },
    {
      thought: 'Since minReadySeconds defaults to 0 on most Deployments, it is a rarely-relevant setting that only matters for teams who explicitly configure a large value for extra safety.',
      reality: 'Per this subtopic\'s exercise, even a modest non-zero minReadySeconds (like the main page\'s own 10s) compounds across every single Pod replacement in a rollout — on a Deployment with many replicas and a small maxSurge, a seemingly small per-Pod delay adds up to a substantial, easily-overlooked increase in total rollout duration.'
    }
  ];
}
