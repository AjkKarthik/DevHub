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
  templateUrl: './not-ready-eviction-is-taint-based-not-a-fixed-flag.html',
  styleUrl: './not-ready-eviction-is-taint-based-not-a-fixed-flag.scss'
})
export class NotReadyEvictionIsTaintBasedNotAFixedFlagSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own QnA describes eviction as a single global timer — that mechanism has been superseded',
      points: [
        'The main page\'s own QnA answer describes node-failure handling as: "kubelet sends heartbeats every 10 seconds. If no heartbeat is received for the node-monitor-grace-period (default 40 seconds), the Node controller marks the node NotReady. After the pod-eviction-timeout (default 5 minutes), the controller evicts Pods." Read as written, this sounds like one fixed, global 5-minute timer applies uniformly to every pod on every NotReady node.',
        'That description matches Kubernetes\' PRE-1.13 eviction mechanism — a pair of kube-controller-manager command-line flags. Since Kubernetes 1.13, the default eviction mechanism has been taint-based eviction, a genuinely different system with the same DEFAULT numeric outcome (5 minutes) but a completely different, more flexible underlying mechanism the main page never mentions.',
        'This matters beyond terminology: the modern mechanism is configurable PER POD, not just globally — something the old flag-based framing the main page describes cannot express at all.',
      ]
    },
    {
      heading: 'What actually happens: a NoExecute taint, and a per-pod tolerationSeconds',
      points: [
        'When a node becomes NotReady or unreachable, the Node controller applies a `node.kubernetes.io/not-ready:NoExecute` (or `:unreachable:NoExecute`) TAINT to the node — not a bare status flag. Per Kubernetes\' own tainting model, a `NoExecute` taint evicts any pod already running there UNLESS that pod tolerates the taint.',
        'Every pod, by default, automatically receives a toleration for these two specific taints with `tolerationSeconds: 300` — injected transparently by an admission controller (DefaultTolerationSeconds) at pod creation time, which is WHY the default observed behavior still lines up with the "5 minutes" the main page states, even though the mechanism producing that number is entirely different from a global controller-manager flag.',
        'Because it is a per-pod toleration, an individual pod (or a whole Deployment\'s pod template) can explicitly set its own `tolerationSeconds` — shorter, for latency-sensitive workloads that should fail over fast, or much longer, for a stateful workload where premature rescheduling onto a different node would be worse than waiting. The main page\'s own flag-based framing has no equivalent per-pod knob at all — `pod-eviction-timeout` (where it still exists as a legacy setting) is cluster-wide only.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What the Node controller actually applies when a node goes NotReady',
      language: 'bash',
      code: `# A node stops sending heartbeats. After node-monitor-grace-period
# (still ~40s by default), the Node controller:

kubectl describe node worker-3
# Conditions:
#   Type     Status
#   Ready    Unknown        <- node's own condition, not yet a taint

# The Node controller then applies a taint (not just a status flag):
kubectl describe node worker-3 | grep Taints
# Taints: node.kubernetes.io/unreachable:NoExecute

# Every pod that was already running on worker-3, per Kubernetes'
# own tainting rules, is subject to eviction under this NoExecute
# taint -- UNLESS it tolerates it. Check what toleration a normal
# pod actually has (added automatically, not written by the user):
kubectl get pod myapp-7f9d8-abc12 -o jsonpath='{.spec.tolerations}'
# [{"key":"node.kubernetes.io/not-ready","operator":"Exists",
#   "effect":"NoExecute","tolerationSeconds":300},
#  {"key":"node.kubernetes.io/unreachable","operator":"Exists",
#   "effect":"NoExecute","tolerationSeconds":300}]
# -- injected automatically at pod creation, not something the
# Deployment manifest ever declared explicitly.`,
    },
    {
      label: 'Overriding the default per pod -- something the old flag-based model can\'t do',
      language: 'bash',
      code: `# A latency-sensitive Deployment that should fail over FAST --
# override the default 300s down to 15s for this workload only:

# deployment.yaml
# spec:
#   template:
#     spec:
#       tolerations:
#         - key: "node.kubernetes.io/not-ready"
#           operator: "Exists"
#           effect: "NoExecute"
#           tolerationSeconds: 15
#         - key: "node.kubernetes.io/unreachable"
#           operator: "Exists"
#           effect: "NoExecute"
#           tolerationSeconds: 15

# A different Deployment (e.g. a stateful workload where premature
# rescheduling is worse than waiting) can go the OTHER direction --
# tolerate indefinitely by omitting tolerationSeconds entirely:
#       tolerations:
#         - key: "node.kubernetes.io/not-ready"
#           operator: "Exists"
#           effect: "NoExecute"
#           # no tolerationSeconds -- tolerates forever, never evicted
#           # purely from this taint (still subject to other eviction
#           # paths, e.g. manual intervention)

# The main page's own pod-eviction-timeout flag has no per-workload
# equivalent at all -- it is a single, cluster-wide setting that
# would apply identically to every pod on every node.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A platform team, following the main page\'s own QnA, sets the cluster-wide `--pod-eviction-timeout` flag on kube-controller-manager to 60 seconds, expecting every pod cluster-wide to be rescheduled 60 seconds after its node goes NotReady. After the change, they observe pods are still being evicted at the original ~300 second mark. Using this subtopic\'s theory, explain why the flag change had no effect.',
    hint: 'Per this subtopic\'s theory, is `--pod-eviction-timeout` still the mechanism actually controlling eviction timing on a modern (1.13+) Kubernetes cluster, or has it been superseded by something else that reads its timing from a different place?',
    solution: 'Per this subtopic\'s theory, the flag change had no effect because `--pod-eviction-timeout` is the legacy, pre-1.13 mechanism — on a modern cluster using taint-based eviction (the default since 1.13), eviction timing is actually controlled by each pod\'s own `tolerationSeconds` value against the `node.kubernetes.io/not-ready`/`unreachable` NoExecute taints, not by this controller-manager flag. Since the team never touched the DefaultTolerationSeconds admission controller\'s own default (which injects `tolerationSeconds: 300` into every pod that doesn\'t specify its own), every pod on the cluster continued being evicted at the original ~300 second mark regardless of the flag change — the flag they modified simply is not consulted by the actual eviction path anymore. To genuinely change the default timing cluster-wide, they would need to either reconfigure the DefaultTolerationSeconds admission controller\'s own default, or set `tolerationSeconds` explicitly in every pod template — the flag-based lever they reached for no longer does what the main page\'s own QnA (describing the pre-1.13 mechanism) implies it does.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Node-failure pod eviction timing on a modern Kubernetes cluster is controlled by a single, global kube-controller-manager flag (pod-eviction-timeout), the same way the main page\'s own QnA describes it.',
      reality: 'Per this subtopic\'s theory, modern Kubernetes (1.13+) uses taint-based eviction by default — a NoExecute taint applied to the NotReady/unreachable node, combined with each pod\'s own tolerationSeconds — which has superseded the flag-based mechanism, even though the DEFAULT numeric outcome (5 minutes) happens to match.'
    },
    {
      thought: 'Since every pod experiences roughly the same 5-minute eviction delay by default, there is no way to make one specific Deployment fail over faster (or slower) than the rest of the cluster.',
      reality: 'Per this subtopic\'s exercise, the taint-based mechanism is configurable PER POD via tolerationSeconds in the pod template — a latency-sensitive Deployment can set a much shorter value, and a stateful workload can set a much longer one (or omit it to tolerate indefinitely), independent of every other workload on the same cluster.'
    },
    {
      thought: 'Changing the cluster-wide pod-eviction-timeout flag on kube-controller-manager is still the correct way to adjust node-failure eviction timing on a current Kubernetes cluster.',
      reality: 'Per this subtopic\'s theory, this flag belongs to the legacy, superseded eviction mechanism — on a cluster using the current default (taint-based eviction), changing it has no effect on actual eviction timing, since the real timing comes from each pod\'s own tolerationSeconds against the relevant NoExecute taints.'
    }
  ];
}
