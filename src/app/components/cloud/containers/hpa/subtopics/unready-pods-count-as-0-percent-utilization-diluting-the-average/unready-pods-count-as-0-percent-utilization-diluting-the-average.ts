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
  templateUrl: './unready-pods-count-as-0-percent-utilization-diluting-the-average.html',
  styleUrl: './unready-pods-count-as-0-percent-utilization-diluting-the-average.scss'
})
export class UnreadyPodsCountAs0PercentUtilizationDilutingTheAverageSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own formula treats "currentMetricValue" as a single clean number',
      points: [
        'The main page\'s own theory states the core formula plainly: "Desired replicas = ceil(currentReplicas × (currentMetricValue / desiredMetricValue))." The Challenge and quiz both reinforce this exact formula with worked numeric examples — treating `currentMetricValue` as if it were simply "the average CPU usage," with no discussion of which PODS that average is actually computed across.',
        'The main page\'s own QnA on scaling speed does mention that "new pods take 30-60 seconds to start... and pass readiness probes" as a source of LATENCY — but never connects this to a separate, different effect: what those same still-starting pods do to the metric CALCULATION itself while they remain unready.',
      ]
    },
    {
      heading: 'What actually happens: an unready pod is counted at exactly 0% usage, pulling the average down',
      points: [
        'Per Kubernetes\' own documented HPA metric-collection behavior, a Pod that is currently NOT Ready (or whose most recent metric sample was taken while it was not Ready) is NOT excluded from the utilization average — it is included, counted as using exactly 0% of its target resource. This is a real, deliberate inclusion, not an omission or a gap in the calculation.',
        'This means every unready Pod actively PULLS DOWN the computed average utilization the main page\'s own formula uses as `currentMetricValue` — during a rollout where several new Pods are still starting, or a partial incident where a subset of Pods have gone unready, the genuinely high load concentrated on the still-healthy, Ready Pods gets diluted by zeros from the unready ones, producing a lower reported average than what the struggling Ready Pods are actually experiencing.',
        'Kubernetes provides one specific, narrower mitigation for the most common case — freshly-created Pods during an initial startup window — via the `--horizontal-pod-autoscaler-initial-readiness-delay` kubelet flag (default 30s), which gives brand-new Pods a grace period before their unreadiness starts diluting the average. This does NOT help the OTHER case: an existing, previously-Ready Pod that becomes unready later (a failing health check, a partial degradation) still counts as 0% the moment it flips to NotReady, diluting the average for as long as it stays that way, with no separate grace period covering that scenario.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A rollout with new, unready pods masks real load on the old ones',
      language: 'bash',
      code: `# The main page's own api-hpa, target 60% CPU, currently mid-rollout:
kubectl get pods -l app=api -n production
# NAME              READY   STATUS    AGE
# api-old-7d9f8-1    1/1     Running   45m   <- Ready, genuinely loaded
# api-old-7d9f8-2    1/1     Running   45m   <- Ready, genuinely loaded
# api-new-8f2a1-1    0/1     Running   20s   <- NOT Ready yet (new rollout)
# api-new-8f2a1-2    0/1     Running   18s   <- NOT Ready yet (new rollout)

# Actual CPU usage, per pod:
#   api-old-7d9f8-1: 90% of its own request  (genuinely overloaded)
#   api-old-7d9f8-2: 88% of its own request  (genuinely overloaded)
#   api-new-8f2a1-1: 0% -- counted as 0%, since it's not Ready
#   api-new-8f2a1-2: 0% -- counted as 0%, since it's not Ready

# The main page's own formula uses the AVERAGE across all 4:
#   (90 + 88 + 0 + 0) / 4 = 44.5%

kubectl get hpa api-hpa
# NAME      REFERENCE        TARGETS
# api-hpa   Deployment/api   44%/60%
# -- reports 44%, BELOW the 60% target -- HPA sees no reason to scale
#    up further, even though the two ACTUALLY-Ready pods are sitting
#    at ~90% and genuinely need help. The two starting pods' 0%
#    values are diluting the real signal.`,
    },
    {
      label: 'A previously-Ready pod going unready has no dedicated grace period at all',
      language: 'bash',
      code: `# The main page's own mitigation (--horizontal-pod-autoscaler-
# initial-readiness-delay, default 30s) only covers BRAND NEW pods,
# during their FIRST startup window -- it does not apply here:

kubectl get pods -l app=api -n production
# NAME             READY   STATUS    AGE
# api-abc-1        1/1     Running   3h     <- long-Ready, now failing
#                                                its OWN readinessProbe
# api-abc-2        1/1     Running   3h     <- Ready, genuinely loaded

# api-abc-1 just started failing its readinessProbe (e.g. a slow
# downstream dependency) -- it flips to NotReady immediately:
kubectl get pods api-abc-1 -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}'
# False

# From this moment, api-abc-1 counts as 0% in the HPA's own average,
# with NO grace period at all (the initial-readiness-delay flag only
# ever applied to its very first startup, hours ago) -- if enough
# pods follow the same pattern during a partial incident, the
# reported average utilization can drop even as remaining Ready pods
# become genuinely overloaded, delaying the scale-up that's needed
# most exactly when it matters most.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'During a rolling deployment, a team notices their HPA — target 60% CPU, following the main page\'s own formula — reports utilization well under target and does not scale up, even though <code>kubectl top pods</code> shows the OLD, still-Ready pods running hot at 85-90% CPU. They assume the HPA formula itself must be buggy, since "the math doesn\'t add up" against what they see per-pod. Using this subtopic\'s theory, is the formula actually wrong here?',
    hint: 'The main page\'s own formula uses an AVERAGE utilization across pods. Are the new, still-starting pods from this rollout included in that average, and if so, at what value?',
    solution: 'No — per this subtopic\'s theory, the formula itself is correct; what\'s missing from the team\'s mental model is which pods are included in the average and at what value. The new pods created by the rollout are still unready (not yet passed their readinessProbe), and Kubernetes counts an unready pod at exactly 0% utilization in the HPA\'s own average — it is not excluded from the calculation. This means the genuinely high 85-90% usage on the OLD, Ready pods gets averaged together with 0% values from the new, starting pods, producing a diluted overall average that can easily land under the 60% target even though the Ready pods are under real, heavy load. This is exactly consistent with the observed symptom: kubectl top pods shows the truth per-pod, while the HPA\'s own average — correctly computed per its documented formula, including the 0%-counted unready pods — reports something lower. The fix isn\'t to distrust the formula; it\'s to understand that during any period with unready pods (a rollout, or an incident causing some pods to fail their health checks), the reported average utilization systematically understates the load on the pods that actually ARE serving traffic.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A Pod that is not yet Ready is simply excluded from the HPA\'s own utilization average, the same way it would be excluded from receiving traffic via a Service\'s Endpoints — "not counted" seems like the natural, consistent behavior.',
      reality: 'Per this subtopic\'s theory, an unready Pod is NOT excluded — it is actively included in the average, counted at exactly 0% utilization, which measurably pulls the reported average down rather than simply leaving it based on the Ready pods alone.'
    },
    {
      thought: 'The --horizontal-pod-autoscaler-initial-readiness-delay flag (default 30s) protects the HPA\'s utilization average from dilution any time a pod is unready, regardless of when or why it became unready.',
      reality: 'Per this subtopic\'s theory, this flag only covers a pod\'s FIRST startup window, right after creation — a previously-Ready pod that later fails its own readinessProbe and flips to NotReady has no separate grace period at all, and immediately starts diluting the average as soon as it happens.'
    },
    {
      thought: 'If an HPA reports utilization below target while kubectl top pods shows some individual pods running hot, the HPA metric pipeline itself (metrics-server, or the HPA controller) must be malfunctioning or reporting stale data.',
      reality: 'Per this subtopic\'s exercise, this exact symptom is consistent with correctly-functioning HPA math during a rollout or partial incident — unready pods being counted at 0% is documented, intentional behavior, not a bug, so this discrepancy alone is not evidence of a malfunction.'
    }
  ];
}
