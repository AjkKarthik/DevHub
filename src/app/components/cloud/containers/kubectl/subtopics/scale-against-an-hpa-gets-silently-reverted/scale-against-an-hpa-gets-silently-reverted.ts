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
  templateUrl: './scale-against-an-hpa-gets-silently-reverted.html',
  styleUrl: './scale-against-an-hpa-gets-silently-reverted.scss'
})
export class ScaleAgainstAnHpaGetsSilentlyRevertedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page presents kubectl scale as a durable action, with no mention of what else might be controlling replica count',
      points: [
        'The main page\'s own theory says plainly: "kubectl scale deployment/<name> --replicas=5 manually scales a Deployment." The quiz and revision summary reinforce the same framing — scale is listed alongside rollout status/undo as one more direct, durable lever for controlling a Deployment.',
        'Nothing on the page mentions a HorizontalPodAutoscaler (HPA) at all, or what happens when one already targets the same Deployment `kubectl scale` is being pointed at. The command succeeds either way — kubectl reports the same "deployment.apps/api scaled" success message regardless of whether an HPA is watching.',
        'Whether that success is DURABLE or gets silently undone within moments depends entirely on something invisible from the `kubectl scale` command itself: whether an HPA object already exists, targeting the same Deployment.',
      ]
    },
    {
      heading: 'What actually happens: the HPA\'s own reconciliation loop overwrites spec.replicas on its next tick',
      points: [
        'Running `kubectl scale deployment/api --replicas=5` does exactly one thing: it updates `spec.replicas` on the Deployment object to 5. This is the SAME field an active HPA continuously reconciles toward its OWN computed target, based on the metrics it\'s watching (CPU utilization, memory, or a custom metric).',
        'An HPA\'s reconciliation loop — the same observe/compare/act pattern this hub\'s own K8s Architecture topic describes as the core pattern behind every controller — runs on its own periodic interval (by default roughly every 15 seconds). On its next tick, it computes what `spec.replicas` SHOULD be based on current metrics, and patches the Deployment back to that value, completely overwriting whatever the manual `kubectl scale` command just set.',
        'The practical result: `kubectl scale --replicas=5` against an HPA-managed Deployment can appear to work (the command succeeds, and `kubectl get deployment` may briefly show 5 if you check within that ~15-second window), only to silently revert to whatever the HPA\'s own current target actually is — which might be higher, lower, or coincidentally the same, but is never actually being HELD at 5 because you asked for it.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Watching a manual scale get reverted, step by step',
      language: 'bash',
      code: `# An HPA already targets the "api" Deployment:
kubectl get hpa
# NAME      REFERENCE          TARGETS    MINPODS   MAXPODS   REPLICAS
# api-hpa   Deployment/api     45%/70%    2         10        3

# A manual scale, exactly as the main page's own theory describes:
kubectl scale deployment/api --replicas=5
# deployment.apps/api scaled     <- reports success, same as always

# Checked IMMEDIATELY:
kubectl get deployment api
# NAME   READY   UP-TO-DATE   AVAILABLE
# api    5/5     5            5           <- looks like it worked

# Checked again ~15-30 seconds later (HPA's own reconciliation tick):
kubectl get deployment api
# NAME   READY   UP-TO-DATE   AVAILABLE
# api    3/3     3            3           <- reverted to the HPA's
#                                             own current target,
#                                             not the 5 you asked for

# Confirm the HPA is what did this -- check its own events:
kubectl describe hpa api-hpa
# Events:
#   Normal  SuccessfulRescale   ... New size: 3; reason: All metrics
#           below target`,
    },
    {
      label: 'The actual, durable way to change scaling behavior when an HPA is present',
      language: 'bash',
      code: `# Changing the HPA's OWN bounds is what actually sticks, since the
# HPA's reconciliation loop is what has ongoing authority over
# spec.replicas -- kubectl scale never does, once an HPA exists:

kubectl patch hpa api-hpa --patch '{"spec":{"minReplicas":5}}'
# Now the HPA itself will never scale BELOW 5, regardless of
# metrics -- this is a genuinely durable floor, unlike a one-off
# kubectl scale call.

# To temporarily disable autoscaling entirely and take manual
# control (e.g. during an incident, or a planned maintenance
# window), the HPA itself needs to be removed or paused --
# not just out-argued by a manual scale command:
kubectl delete hpa api-hpa
kubectl scale deployment/api --replicas=5
# NOW this scale command is durable, since nothing is left to
# revert it.

# Re-create the HPA afterward to resume autoscaling:
kubectl autoscale deployment api --cpu-percent=70 --min=2 --max=10`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'During a traffic spike, an on-call engineer runs `kubectl scale deployment/api --replicas=10` to add capacity fast, sees the command succeed, and moves on to the next task. Twenty minutes later, the team is paged again for the same capacity issue — replica count is back down to 4. Using this subtopic\'s theory, what almost certainly happened, and what should the engineer have done differently for a durable fix?',
    hint: 'Per this subtopic\'s theory, does a successful kubectl scale command guarantee the replica count stays at the value you set, or does that depend on whether something else (an HPA) has ongoing authority over the same field?',
    solution: 'Per this subtopic\'s theory, this is almost certainly the HPA reverting the manual scale — the engineer\'s kubectl scale command genuinely succeeded and genuinely set replicas to 10 in that moment, but if an HPA already targets the same Deployment, its own reconciliation loop recalculated the "correct" replica count based on current metrics on its next tick (roughly every 15 seconds) and overwrote the manual value, eventually settling back toward whatever the HPA\'s own metrics-driven target was — in this case, apparently 4. For a durable fix during a real traffic spike, the engineer needed to change something the HPA itself respects, not fight it with a one-off scale command: raising the HPA\'s own `minReplicas` (e.g. `kubectl patch hpa api-hpa --patch \'{"spec":{"minReplicas":10}}\'`) sets a floor the HPA\'s own reconciliation loop will not go below, regardless of metrics — a genuinely durable change, unlike a manual scale that the HPA has full authority to overwrite the very next time it reconciles.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'kubectl scale deployment/<name> --replicas=N durably sets the replica count, the same way the main page\'s own theory presents it, regardless of what else might be configured for that Deployment.',
      reality: 'Per this subtopic\'s theory, this is only true if no HorizontalPodAutoscaler targets the same Deployment — if one does, its own reconciliation loop overwrites spec.replicas on its next tick (roughly every 15 seconds), silently reverting the manual scale to whatever the HPA\'s own metrics-driven target is.'
    },
    {
      thought: 'Since kubectl scale reports "deployment.apps/<name> scaled" as a success message, the replica count it set is guaranteed to stay at that value going forward.',
      reality: 'Per this subtopic\'s exercise, the success message only confirms the command itself succeeded in updating spec.replicas at that moment — it says nothing about whether an HPA (or any other controller with ongoing authority over that field) will immediately overwrite it again.'
    },
    {
      thought: 'To temporarily override an HPA\'s scaling decision during an incident, running kubectl scale with a higher replica count is the correct, durable approach.',
      reality: 'Per this subtopic\'s theory, a plain kubectl scale command against an HPA-managed Deployment gets reverted on the HPA\'s next reconciliation — the durable approaches are either raising the HPA\'s own minReplicas (a floor it respects) or removing/pausing the HPA entirely before scaling manually.'
    }
  ];
}
