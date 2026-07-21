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
  templateUrl: './rwop-closes-the-gap-rwo-leaves-same-node-pods-can-still-double-write.html',
  styleUrl: './rwop-closes-the-gap-rwo-leaves-same-node-pods-can-still-double-write.scss'
})
export class RwopClosesTheGapRwoLeavesSameNodePodsCanStillDoubleWriteSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own two facts about RWO and RWOP are never connected to each other',
      points: [
        'The main page\'s own "Access Modes" theory bullet defines RWOP as: "ReadWriteOncePod (RWOP): K8s 1.22+ — read-write by exactly ONE Pod (stronger than RWO which is per-node)." This states the DIFFERENCE between RWO and RWOP as a fact, but never explains WHY that difference matters in practice, or what could go wrong under plain RWO that RWOP prevents.',
        'Separately, the main page\'s own closing QnA answer states: "RWO is node-level not pod-level, so multiple pods on the SAME node can share a RWO volume." This is presented as a standalone clarifying note about RWO\'s scope — the QnA never connects it back to the earlier RWOP theory bullet, even though it is the exact gap RWOP was built to close.',
      ]
    },
    {
      heading: 'What actually connects them: RWO\'s node-level scope is a real double-write risk RWOP exists specifically to prevent',
      points: [
        'Per Kubernetes\' own RWOP enhancement proposal, ReadWriteOnce genuinely does allow MULTIPLE Pods on the SAME node to mount the same volume read-write simultaneously — RWO was only ever a per-node restriction, never a per-Pod one, despite the name reading like a single-writer guarantee to most people encountering it for the first time.',
        'This becomes a real, concrete risk during precisely the kind of event the main page\'s own theory elsewhere describes approvingly — a StatefulSet rolling update, or a Pod being rescheduled — if, for even a brief window, BOTH the old and new Pod for the same replica happen to land on the SAME node while both reference the same RWO PVC, Kubernetes\' RWO access mode alone does nothing to prevent both from mounting it read-write at once, risking exactly the kind of concurrent-write data corruption single-writer applications (most relational databases, many queue implementations) assume can never happen.',
        'ReadWriteOncePod (RWOP), reaching stable/GA in Kubernetes 1.29, closes this specific gap by enforcing TRUE single-Pod exclusivity — the Kubernetes API server itself rejects a second Pod\'s attempt to mount an RWOP-typed volume that is already mounted by any other Pod, regardless of whether that second Pod is on the same node or a different one, removing the same-node loophole that plain RWO always had.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The gap: two Pods, same node, same RWO volume, both mounted read-write',
      language: 'bash',
      code: `# The main page's own postgres StatefulSet, using a PVC with
# accessModes: [ReadWriteOnce] -- if, during a rolling update, both
# the OLD and NEW postgres-0 Pod briefly coexist on the SAME node
# (a real possibility the main page's own Rolling Update theory on
# the Pods & Deployments topic already describes as a normal part of
# how rollouts work):

kubectl get pods -o wide | grep postgres-0
# NAME              READY   STATUS        NODE
# postgres-0-old    1/1     Terminating   node-4
# postgres-0-new    1/1     Running       node-4   <- SAME node

# Both reference the identical RWO PVC:
kubectl get pod postgres-0-old postgres-0-new \\
  -o jsonpath='{.items[*].spec.volumes[*].persistentVolumeClaim.claimName}'
# data-postgres-0 data-postgres-0

# Per the main page's own QnA ("RWO is node-level not pod-level"),
# Kubernetes' RWO access mode does NOT block this -- both Pods being
# on the same node means BOTH can have the volume mounted read-write
# at the exact same moment, with zero API-server-level enforcement
# preventing it. Whether this actually corrupts data depends entirely
# on the application -- a database expecting exclusive file access
# has no idea a second process might be writing to the same files.`,
    },
    {
      label: 'RWOP: the API server itself rejects the second mount attempt',
      language: 'bash',
      code: `# Same scenario, but the PVC's accessModes is now [ReadWriteOncePod]
# instead of [ReadWriteOnce]:
# apiVersion: v1
# kind: PersistentVolumeClaim
# metadata:
#   name: data-postgres-0
# spec:
#   accessModes: [ReadWriteOncePod]   # <- K8s 1.29+ GA
#   resources: { requests: { storage: 50Gi } }

# postgres-0-old is still Terminating, still holding the mount:
kubectl get pod postgres-0-old -o jsonpath='{.status.phase}'
# Running   (still finishing termination)

# postgres-0-new attempts to start on the SAME node -- this time,
# the attempt is rejected outright, regardless of node placement:
kubectl describe pod postgres-0-new | grep -A2 Events
# Warning  FailedMount  kubelet  Unable to attach or mount volumes:
#   ... volume is already exclusively attached to one pod and cannot
#   be attached to another

# postgres-0-new stays in ContainerCreating until postgres-0-old has
# FULLY released the volume -- a real, API-server-enforced guarantee
# that plain RWO never provided, regardless of which node either
# Pod happens to land on.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team runs a single-writer database in a StatefulSet using a PVC with the default <code>ReadWriteOnce</code> access mode. During a routine rolling update, they observe a brief window where the old and new Pod for the same replica are BOTH shown as <code>Running</code> simultaneously on the exact same node. They assume this is harmless, since RWO is documented as "read-write by a single node," and both Pods are on that same single node. Using this subtopic\'s theory, is that assumption correct?',
    hint: 'The main page\'s own QnA draws a distinction between "node-level" and "pod-level" exclusivity for RWO. Which of those two does "both Pods on the same node" actually satisfy?',
    solution: 'No — per this subtopic\'s theory, the team\'s assumption conflates node-level exclusivity (what plain RWO actually guarantees) with pod-level exclusivity (what they likely intended). Per the main page\'s own QnA, RWO is node-level, not pod-level — meaning Kubernetes\' RWO access mode is entirely satisfied by "only one node is mounting this volume," with no restriction at all on how many PODS on that one node can mount it simultaneously. In the described scenario, both the old and new Pod are genuinely on the same single node, so RWO\'s actual guarantee is not violated — but that guarantee was never "only one Pod writes at a time" in the first place, despite the name reading that way. If both Pods\' processes actually attempt concurrent writes during that overlap window, RWO provides zero protection against it. The fix, if true single-writer semantics are required, is switching the PVC\'s access mode to ReadWriteOncePod (RWOP, GA in Kubernetes 1.29) — which enforces real pod-level exclusivity at the API server level, rejecting a second Pod\'s mount attempt outright regardless of node placement, closing exactly this gap.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'ReadWriteOnce (RWO) means exactly what its name suggests: the volume can be read-write mounted by exactly one Pod at a time, anywhere in the cluster.',
      reality: 'Per the main page\'s own QnA and this subtopic\'s theory, RWO is actually node-level, not pod-level — any number of Pods co-located on the SAME node can mount an RWO volume read-write simultaneously, with no API-server enforcement preventing it. Only ReadWriteOncePod (RWOP) provides genuine single-Pod exclusivity.'
    },
    {
      thought: 'The main page\'s own RWOP theory bullet is describing a minor, mostly theoretical refinement over RWO — a stronger guarantee that rarely matters in practice.',
      reality: 'Per this subtopic\'s theory, the gap RWOP closes is a concrete, commonly-triggered risk — an old and new Pod for the same StatefulSet replica briefly coexisting on the same node during an ordinary rolling update is a normal occurrence, not an edge case, and RWO provides zero protection against both mounting the volume read-write during that overlap.'
    },
    {
      thought: 'Switching a PVC from RWO to ReadWriteOncePod (RWOP) is purely additive — it can only add safety, with no operational tradeoff to consider.',
      reality: 'Per this subtopic\'s theory, RWOP\'s strict enforcement means a SECOND Pod\'s mount attempt is rejected outright (FailedMount) until the first Pod fully releases the volume — for workloads that rely on the brief old/new Pod overlap RWO silently tolerates during a rollout, RWOP can introduce a hard blocking wait that RWO never enforced, which is a real behavioral change to account for, not just an upgrade with no side effects.'
    }
  ];
}
