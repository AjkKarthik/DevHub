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
  templateUrl: './resourcequota-rejects-pod-creation-outright-it-never-defaults-to-zero.html',
  styleUrl: './resourcequota-rejects-pod-creation-outright-it-never-defaults-to-zero.scss'
})
export class ResourcequotaRejectsPodCreationOutrightItNeverDefaultsToZeroSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own QnA originally described a "silent zero-counting" behavior that isn\'t what actually happens',
      points: [
        'The main page\'s own QnA answer on ResourceQuota previously explained the LimitRange pairing by saying, without it, "ResourceQuota counts every pod as having zero requests and cannot track consumption accurately" — implying the pod is created successfully, just under-counted against the quota. As part of verifying this content batch, that description was checked against Kubernetes\' own documented behavior and corrected.',
        'The main page\'s own ResourceQuota code tab sets `requests.cpu`/`requests.memory`/`limits.cpu`/`limits.memory` fields in its `hard:` block — exactly the fields that trigger the REAL behavior this subtopic explains, which is stricter (and more immediately visible) than "silently miscounted."',
      ]
    },
    {
      heading: 'What actually happens: pod creation is rejected outright, not silently under-counted',
      points: [
        'Per Kubernetes\' own documented ResourceQuota behavior, once a namespace has an active ResourceQuota that covers compute resources (`requests.cpu`, `requests.memory`, `limits.cpu`, or `limits.memory`), every NEW pod submitted to that namespace is REQUIRED to specify the corresponding fields explicitly — a pod that omits them is rejected outright with an HTTP 403 Forbidden error at admission time, not silently accepted and counted as zero.',
        'This means the main page\'s own hypothetical scenario — a developer deploying "a pod with no resources block" into a namespace protected only by the ResourceQuota shown in the code tab (no LimitRange) — doesn\'t result in an under-tracked BestEffort pod slipping through; it results in the deployment failing to roll out at all, with `kubectl describe replicaset` or `kubectl get events` showing a quota-related admission error on every attempted Pod creation.',
        'LimitRange solves this not by making ResourceQuota\'s counting more accurate after the fact, but by intervening EARLIER in the admission chain — it injects default request/limit values onto the Pod spec BEFORE the ResourceQuota check ever runs, so the pod arrives at the quota check already carrying explicit values and is never rejected for omitting them in the first place. This ordering (LimitRange defaulting, then ResourceQuota checking) is what actually makes the main page\'s own "combine LimitRange + ResourceQuota" advice work, not a tracking-accuracy improvement.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Without a LimitRange: pod creation fails outright, not silently',
      language: 'bash',
      code: `# The main page's own ResourceQuota, applied WITHOUT any LimitRange
# in the same namespace:
# apiVersion: v1
# kind: ResourceQuota
# metadata:
#   name: production-quota
#   namespace: production
# spec:
#   hard:
#     requests.cpu: "20"
#     requests.memory: "40Gi"
#     limits.cpu: "40"
#     limits.memory: "80Gi"

# A developer deploys a Pod with NO resources block at all:
kubectl apply -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: no-resources-pod
  namespace: production
spec:
  containers:
    - name: app
      image: myapp:v1
EOF
# Error from server (Forbidden): error when creating "STDIN": pods
# "no-resources-pod" is forbidden: failed quota: production-quota:
# must specify limits.cpu,limits.memory,requests.cpu,requests.memory
# -- REJECTED immediately. Not created. Not "counted as zero" and
#    silently let through -- the API server refuses to admit it at all.

kubectl get pods -n production | grep no-resources
# (no output -- the pod never existed, not even briefly)`,
    },
    {
      label: 'With a LimitRange: defaults are injected BEFORE the quota check',
      language: 'bash',
      code: `# The SAME ResourceQuota, but now with the main page's own
# LimitRange also applied to the namespace:
# apiVersion: v1
# kind: LimitRange
# metadata:
#   name: default-limits
#   namespace: production
# spec:
#   limits:
#     - type: Container
#       default: { cpu: "500m", memory: "256Mi" }
#       defaultRequest: { cpu: "100m", memory: "128Mi" }

# The IDENTICAL Pod manifest, no resources block, deployed again:
kubectl apply -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: no-resources-pod-2
  namespace: production
spec:
  containers:
    - name: app
      image: myapp:v1
EOF
# pod/no-resources-pod-2 created
# -- succeeds this time. The LimitRange's own admission-time defaulting
#    ran FIRST, injecting requests.cpu: 100m, requests.memory: 128Mi,
#    limits.cpu: 500m, limits.memory: 256Mi onto the Pod spec -- by
#    the time the ResourceQuota check evaluated the same request, the
#    Pod already had explicit, non-empty values to check against.

kubectl get pod no-resources-pod-2 -n production -o jsonpath='{.spec.containers[0].resources}'
# {"limits":{"cpu":"500m","memory":"256Mi"},"requests":{"cpu":"100m","memory":"128Mi"}}
# -- confirms the LimitRange defaults, not empty/zero values, are
#    what's actually on the created Pod object.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A platform team applies the main page\'s own ResourceQuota to a namespace, believing it will "track and cap" total resource usage even for pods that omit their own resources block — expecting those pods to simply count as zero against the quota, matching the main page\'s original QnA description. They have not yet added a LimitRange to the namespace. A developer then tries to deploy a Pod with no resources block. Using this subtopic\'s theory, what actually happens?',
    hint: 'Does a ResourceQuota covering requests.cpu/requests.memory/limits.cpu/limits.memory let a pod without those fields through and just count it inaccurately, or does it reject the pod outright at admission time?',
    solution: 'Per this subtopic\'s theory, the Pod creation fails outright — the API server rejects it at admission time with an HTTP 403 Forbidden error (something like "must specify limits.cpu, limits.memory, requests.cpu, requests.memory"), rather than accepting the Pod and counting it as having zero usage against the quota. This is a stricter, more immediately visible outcome than the "silently under-tracked" behavior the team was expecting — the developer\'s deployment does not roll out at all, and kubectl get events or a failed ReplicaSet/Deployment rollout status would surface the quota-admission error directly. The fix is exactly what the main page\'s own advice already recommends — adding a LimitRange to the namespace — but the REASON it works is different from "improving tracking accuracy": the LimitRange injects default request/limit values onto the Pod spec during admission, BEFORE the ResourceQuota check runs, so the Pod already has explicit values by the time the quota is evaluated and is never rejected for omitting them in the first place.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A ResourceQuota covering compute resources (requests.cpu, limits.memory, etc.) lets a pod without a resources block through, but silently counts it as consuming zero resources against the quota — an under-tracking problem rather than a rejection.',
      reality: 'Per this subtopic\'s theory, Kubernetes rejects such a pod outright at admission time (HTTP 403 Forbidden) — it never gets created, let alone under-counted. The pod creation request itself fails, which is a much more immediately visible failure mode than silent miscounting.'
    },
    {
      thought: 'LimitRange and ResourceQuota work together by LimitRange retroactively correcting ResourceQuota\'s tracking after a pod without explicit resources has already been created.',
      reality: 'Per this subtopic\'s exercise, LimitRange intervenes BEFORE ResourceQuota\'s check ever runs, during the same admission-time processing — it injects default values onto the Pod spec so the pod arrives at the quota check already compliant, rather than fixing anything after the fact.'
    },
    {
      thought: 'Without a LimitRange, a ResourceQuota covering compute resources is a "best effort" control that developers can accidentally bypass by simply omitting a resources block from their Pod spec.',
      reality: 'Per this subtopic\'s theory, the opposite is true — omitting a resources block in a namespace with such a ResourceQuota and no LimitRange makes deployment fail completely, not succeed unrestricted; the quota, in this configuration, is stricter than having no quota at all, not more bypassable.'
    }
  ];
}
