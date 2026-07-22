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
  templateUrl: './hpa-scales-against-requests-not-limits-a-low-request-is-hypersensitive.html',
  styleUrl: './hpa-scales-against-requests-not-limits-a-low-request-is-hypersensitive.scss'
})
export class HpaScalesAgainstRequestsNotLimitsALowRequestIsHypersensitiveSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own QnA mentions HPA only as a contrast to VPA, never explaining its own math',
      points: [
        'The main page\'s own QnA answer on VPA says: "HPA scales the number of pod replicas based on metrics (CPU, memory, custom)." This is accurate but entirely silent on WHAT the percentage in a typical HPA rule is actually a percentage OF — a detail that turns out to interact directly with the requests-vs-limits distinction this entire page is about.',
        'The main page\'s own sizing advice elsewhere recommends setting "requests to p50 usage" — deliberately LOW relative to actual peak usage, by design, so the scheduler doesn\'t over-reserve capacity. Nothing on the page connects this deliberately-low request value to what happens if that same Deployment also has an HPA attached.',
      ]
    },
    {
      heading: 'What HPA actually measures against: the CPU REQUEST, not the limit — making a low request hypersensitive',
      points: [
        'Per Kubernetes\' own documented HPA behavior, a resource-metric-based HorizontalPodAutoscaler (the common `targetCPUUtilizationPercentage` or `Resource` metric type) computes utilization as a percentage of the pod\'s own CPU REQUEST, not its limit: `utilization% = (current CPU usage / CPU request) × 100`. The CPU limit plays no role in this calculation at all.',
        'This means the main page\'s own p50-sizing advice for requests, applied to a Deployment that also has an HPA, has a real side effect the page never states: a LOW request value (by design, since it\'s meant to represent typical rather than peak usage) makes the percentage calculation extremely sensitive — a small absolute increase in actual CPU usage translates into a large percentage swing relative to a small request denominator, which can trigger scale-up events far more eagerly than the same absolute usage change would against a higher request value.',
        'Concretely: a container with `requests.cpu: 100m` and an HPA target of 75% scales up once actual usage reaches just 75m — a genuinely small, easy-to-hit absolute value — while the SAME container\'s limit might be 1000m (10× higher, exactly matching the main page\'s own "2-4× p99" limit-sizing advice), meaning the HPA can trigger well before the container is anywhere near its own throttling point. The two numbers (request-based HPA trigger, limit-based throttling trigger) are answering two completely different questions and can be very far apart.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A low, correctly-sized request makes HPA fire early',
      language: 'bash',
      code: `# The main page's own recommended sizing pattern applied to a
# Deployment that also has an HPA attached:
# resources:
#   requests:
#     cpu: "100m"      # p50 usage, per the main page's own advice
#   limits:
#     cpu: "1"          # ~10x request, per "2-4x p99" advice

# apiVersion: autoscaling/v2
# kind: HorizontalPodAutoscaler
# metadata:
#   name: api-hpa
# spec:
#   scaleTargetRef: { kind: Deployment, name: api }
#   minReplicas: 2
#   maxReplicas: 10
#   metrics:
#     - type: Resource
#       resource:
#         name: cpu
#         target: { type: Utilization, averageUtilization: 75 }

# The math the main page's own QnA never states:
#   75% of the REQUEST (100m) = 75m triggers scale-up
#   ... NOT 75% of the LIMIT (1000m) = 750m

kubectl top pods -l app=api
# NAME       CPU(cores)
# api-abc    82m
# -- only 82m of ACTUAL usage -- a small, unremarkable absolute
#    number -- but already ABOVE the 75m trigger point, so the HPA
#    scales up right now, while this pod is nowhere near its own
#    1000m throttling limit at all.

kubectl get hpa api-hpa
# NAME      REFERENCE       TARGETS   MINPODS   MAXPODS   REPLICAS
# api-hpa   Deployment/api  82%/75%   2         10        3
# -- "82%" here means 82% of the 100m REQUEST, not of the 1000m limit.`,
    },
    {
      label: 'Why this makes p50-sized requests and HPA a real tension',
      language: 'bash',
      code: `# The main page's own advice, read together, creates a genuine
# design tension it never names directly:
#
#   "Set requests to p50 usage" (this page's own sizing advice)
#     -> makes the HPA's percentage denominator SMALL
#     -> makes the HPA trigger on SMALL absolute usage increases
#     -> can cause frequent, twitchy scale-up/down cycling for a
#        workload whose usage naturally varies a lot around its p50

# The practical reconciliation teams commonly use -- NOT a request
# change (which would undermine the scheduler-efficiency reason
# requests are set low in the first place), but choosing the HPA's
# OWN target percentage deliberately, independent of how the request
# itself was sized for scheduling purposes:

# If the intent is "scale up once usage reaches roughly HALF the
# CPU limit" (a stable, predictable trigger point regardless of how
# low the request itself is), calculate the target explicitly:
#   averageUtilization = (limit / request) * desiredLimitPercentage
#   = (1000m / 100m) * 50   = 500
# -- yes, targets ABOVE 100% are valid and common specifically for
#    this reason -- it means "500% of the request," which equals
#    "50% of the limit" for THIS specific request/limit ratio.

# apiVersion: autoscaling/v2
# ...
#     target: { type: Utilization, averageUtilization: 500 }
# -- now genuinely triggers at ~half of the 1000m limit, not at a
#    twitchy 75m absolute value derived from the p50 request alone.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team follows the main page\'s own advice and sets a Deployment\'s CPU request to its measured p50 usage (100m) and its limit to roughly 10x that (1000m), matching the "2-4x p99" guidance. They then attach an HPA with <code>averageUtilization: 75</code>, expecting it to scale up once the pod is using around 75% of its 1000m limit (750m) — comfortably close to the throttling point. Instead, the HPA scales up almost immediately, while actual usage is nowhere near the limit. Using this subtopic\'s theory, why did the HPA trigger so early?',
    hint: 'The HPA percentage in this configuration is 75% of WHICH number — the 1000m limit, or the 100m request?',
    solution: 'Per this subtopic\'s theory, the HPA scaled up early because averageUtilization: 75 means 75% of the pod\'s CPU REQUEST (100m), not its limit (1000m) — Kubernetes\' own HPA implementation for resource metrics always computes utilization as a percentage of the request, with no role for the limit at all. 75% of a 100m request is just 75m of actual CPU usage — a small, easily-reached absolute number, completely disconnected from the 1000m limit the team assumed the percentage was relative to. The team\'s p50-based request sizing (correct advice for efficient scheduling, per the main page\'s own guidance) directly caused this HPA hypersensitivity as an unstated side effect: a low request denominator makes any given percentage target correspond to a much smaller absolute usage trigger. To actually target "scale up around 50% of the limit" as intended, the HPA\'s own averageUtilization needs to be calculated relative to the request/limit ratio — (limit / request) × desired-limit-percentage — which can validly exceed 100%, since it is being expressed as a percentage of the (smaller) request, not the (larger) limit.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A HorizontalPodAutoscaler\'s CPU utilization percentage (e.g. averageUtilization: 75) is calculated relative to the container\'s CPU LIMIT, the same number that determines when CFS throttling kicks in.',
      reality: 'Per this subtopic\'s theory, Kubernetes\' own HPA implementation calculates resource-metric utilization percentage relative to the CPU REQUEST exclusively — the limit plays no role in this calculation at all, making it a completely separate number from the one that governs throttling.'
    },
    {
      thought: 'Since the main page\'s own advice to set requests at p50 usage is specifically about scheduler efficiency, it has no side effects on any other Kubernetes feature that also happens to reference the request value.',
      reality: 'Per this subtopic\'s exercise, a deliberately low, p50-based request value directly makes any attached HPA\'s percentage-based target more sensitive to small absolute usage changes, since the request serves as the denominator in the HPA\'s own utilization calculation — a real, unstated interaction between two independently-reasonable pieces of advice.'
    },
    {
      thought: 'An HPA\'s averageUtilization value can never validly exceed 100%, since "utilization" inherently means a percentage of some maximum, capped naturally at full usage.',
      reality: 'Per this subtopic\'s theory, values above 100% are valid and commonly used specifically to express a target relative to the LIMIT when the request is much smaller than the limit — since the percentage is computed against the request, not the limit, "500%" is a legitimate way to express "roughly 50% of a limit that is 10x the request."'
    }
  ];
}
