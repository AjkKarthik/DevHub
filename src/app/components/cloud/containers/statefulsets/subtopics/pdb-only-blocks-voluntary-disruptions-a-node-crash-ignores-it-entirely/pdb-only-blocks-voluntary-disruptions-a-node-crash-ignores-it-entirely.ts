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
  templateUrl: './pdb-only-blocks-voluntary-disruptions-a-node-crash-ignores-it-entirely.html',
  styleUrl: './pdb-only-blocks-voluntary-disruptions-a-node-crash-ignores-it-entirely.scss'
})
export class PdbOnlyBlocksVoluntaryDisruptionsANodeCrashIgnoresItEntirelySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own mistake entry says "a PDB throttles voluntary disruptions" without ever contrasting it with the alternative',
      points: [
        'The main page\'s own "Not setting a PodDisruptionBudget" mistake entry explains what happens WITHOUT a PDB ("a cluster upgrade or kubectl drain can remove all StatefulSet pods simultaneously") and states the fix throttles "voluntary disruptions" — but the word "voluntary" appears repeatedly across the page\'s theory, mistakes, and quiz with no explicit definition of what it excludes.',
        'The main page\'s own quiz question about minAvailable: 2 asks what it enforces "during voluntary disruptions (node drain, cluster upgrade)" — correctly scoped, but a reader who internalizes "PDB keeps 2 replicas Running" as a general availability guarantee, without registering the "voluntary" qualifier as meaningfully EXCLUSIVE of other disruption types, could easily walk away believing a PDB provides general protection against losing replicas.',
      ]
    },
    {
      heading: 'What a PDB actually does nothing for: real node crashes, kernel panics, hardware failures',
      points: [
        'Per Kubernetes\' own documentation, disruptions are split into exactly two categories: VOLUNTARY (a node drain, a Pod eviction, `kubectl delete pod`, a cluster autoscaler scaling down a node — anything initiated intentionally through the Eviction API) and INVOLUNTARY (a node hardware failure, a kernel panic that kills the kubelet, a network partition, a VM being deleted out from under the cluster). A PodDisruptionBudget is checked ONLY by the Eviction API path — it has no mechanism to intercept, delay, or throttle an involuntary disruption at all.',
        'This means the exact scenario the main page\'s own mistake entry warns about for the VOLUNTARY case — "a cluster upgrade or kubectl drain can remove all StatefulSet pods simultaneously" — can still happen just as easily via an INVOLUNTARY path that a PDB is powerless to stop: if the underlying cloud provider suffers a zone-wide hardware event and 2 of 3 nodes hosting the main page\'s own 3-replica postgres StatefulSet crash simultaneously, `minAvailable: 2` never gets consulted at all — there is no eviction request for it to block.',
        'A PDB is best understood as a coordination tool for planned, CLUSTER-ADMIN-INITIATED maintenance, not a general high-availability guarantee — genuine resilience against involuntary disruptions comes from a completely different set of mechanisms: spreading replicas across failure domains (pod anti-affinity, topology spread constraints across zones/nodes), running enough replicas that a single-digit number of simultaneous involuntary failures still leaves a quorum, and application-level replication/failover — none of which a PDB provides or substitutes for.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The PDB correctly blocks a voluntary drain...',
      language: 'bash',
      code: `# The main page's own postgres-pdb, exactly as its code tab shows:
# apiVersion: policy/v1
# kind: PodDisruptionBudget
# metadata:
#   name: postgres-pdb
#   namespace: data
# spec:
#   minAvailable: 2
#   selector:
#     matchLabels: { app: postgres }

# An admin attempts to drain a node hosting postgres-1, as part of a
# planned cluster upgrade -- this IS a voluntary disruption, routed
# through the Eviction API:
kubectl drain node-3 --ignore-daemonsets
# evicting pod data/postgres-1
# error when evicting pod "postgres-1": Cannot evict pod as it would
# violate the pod's disruption budget.
# -- correctly BLOCKED. Exactly the protection the main page's own
#    mistake entry describes.`,
    },
    {
      label: '...but does nothing at all for an actual node crash',
      language: 'bash',
      code: `# Same PDB, same StatefulSet -- but this time node-3 and node-5
# (hosting postgres-1 and postgres-2) suffer a genuine, unplanned
# hardware failure simultaneously -- an INVOLUNTARY disruption, with
# no Eviction API request involved at all:
kubectl get nodes
# NAME     STATUS
# node-1   Ready
# node-3   NotReady   <- hardware failure, not a drain
# node-5   NotReady   <- hardware failure, not a drain

kubectl get pods -n data -l app=postgres
# NAME         READY   STATUS    NODE
# postgres-0   1/1     Running   node-1
# postgres-1   0/1     Unknown   node-3   <- unreachable, not evicted
# postgres-2   0/1     Unknown   node-5   <- unreachable, not evicted

# minAvailable: 2 is violated RIGHT NOW -- only 1 of 3 replicas is
# actually Running -- but the PDB never blocked anything, because
# nothing ever asked the Eviction API's permission. There was no
# voluntary action to throttle. The main page's own PDB provides
# ZERO protection against this exact scenario, despite being the
# recommended fix for "a cluster upgrade... can take down your
# whole database."

kubectl get pdb postgres-pdb -n data
# NAME           MIN AVAILABLE   ALLOWED DISRUPTIONS
# postgres-pdb   2               0
# -- "ALLOWED DISRUPTIONS: 0" only describes how many MORE voluntary
#    evictions would be permitted -- it says nothing about, and has
#    no bearing on, the involuntary outage already in progress.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team sets <code>minAvailable: 2</code> on their 3-replica postgres StatefulSet, following the main page\'s own mistake-entry fix exactly. During a postmortem after an outage where 2 of 3 replicas went down simultaneously due to a cloud provider\'s zone-wide hardware failure, someone asks "why didn\'t our PDB protect us here — isn\'t that exactly what it\'s for?" Using this subtopic\'s theory, how would you answer?',
    hint: 'A PDB is checked by exactly one thing: the Eviction API. Does a real hardware failure — as opposed to a planned <code>kubectl drain</code> — ever go through the Eviction API at all?',
    solution: 'Per this subtopic\'s theory, the PDB never had a chance to protect against this outage, because a PodDisruptionBudget is only ever consulted by the Eviction API — the code path used for VOLUNTARY disruptions like kubectl drain, manual pod eviction, or a cluster autoscaler scaling down a node. A cloud provider\'s zone-wide hardware failure is an INVOLUNTARY disruption: the nodes simply became unreachable, with no eviction request ever submitted for the PDB to evaluate or block. minAvailable: 2 being violated in practice (only 1 of 3 replicas actually Running) is a completely separate fact from whether the PDB itself did anything — it didn\'t, because nothing asked its permission. The correct takeaway isn\'t that the PDB failed or was misconfigured; it\'s that PDBs were never designed to protect against this category of failure at all. Real resilience against involuntary disruptions requires different mechanisms entirely — spreading replicas across failure domains via anti-affinity or topology spread constraints, and running the application\'s own replication/failover, none of which the PDB provides.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A PodDisruptionBudget with minAvailable: 2 guarantees at least 2 replicas stay Running under any circumstances, including a node crash or hardware failure — that\'s what "disruption budget" sounds like it should mean.',
      reality: 'Per this subtopic\'s theory, a PDB is checked ONLY by the Eviction API, which handles VOLUNTARY disruptions exclusively — a real node crash, kernel panic, or hardware failure is an INVOLUNTARY disruption that never goes through the Eviction API, so the PDB provides zero protection against it, regardless of its minAvailable value.'
    },
    {
      thought: 'The main page\'s own repeated phrase "voluntary disruptions" is just a formal Kubernetes term for "disruptions in general" — a stylistic choice rather than a meaningfully narrower category.',
      reality: 'Per this subtopic\'s theory, "voluntary" specifically and deliberately excludes a whole separate category (involuntary disruptions: node failure, kernel panic, network partition) that a PDB has no mechanism to affect at all — the qualifier is doing real, load-bearing work, not just stylistic phrasing.'
    },
    {
      thought: 'Since the main page\'s own mistake entry recommends a PDB specifically to prevent "a cluster upgrade or kubectl drain" from taking down a whole database, having a PDB in place means that same database is now generally protected from unexpected simultaneous replica loss.',
      reality: 'Per this subtopic\'s exercise, a PDB protects against exactly the PLANNED, voluntary scenario it was designed for (drains, upgrades) — it provides no protection at all against the unplanned, involuntary scenario (crashes, hardware failure) that can just as easily take down the same number of replicas simultaneously.'
    }
  ];
}
