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
  templateUrl: './a-zonal-pvc-can-strand-a-rescheduled-statefulset-pod-in-pending.html',
  styleUrl: './a-zonal-pvc-can-strand-a-rescheduled-statefulset-pod-in-pending.scss'
})
export class AZonalPvcCanStrandARescheduledStatefulsetPodInPendingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own mistake entry treats WaitForFirstConsumer as a complete, permanent fix',
      points: [
        'The main page\'s own "Not using WaitForFirstConsumer volume binding mode" mistake entry presents this as a straightforward before/after fix: Immediate binding causes a zone mismatch; WaitForFirstConsumer "delays provisioning until the Pod is scheduled, ensuring the PV is in the correct zone." The explanation stops there, framed as a one-time provisioning-moment problem that WaitForFirstConsumer solves once and for all.',
        'The main page\'s own StatefulSet theory bullet says only that "PVCs are NOT deleted when a StatefulSet Pod is deleted or scaled down — data is preserved," without connecting this PVC persistence to what happens if that SAME Pod later needs to be scheduled onto a node in a DIFFERENT zone than the one its already-bound PV lives in.',
      ]
    },
    {
      heading: 'What actually happens after the initial provisioning moment: the PV\'s zone is now permanently fixed, and a StatefulSet Pod can still be rescheduled across zones',
      points: [
        'WaitForFirstConsumer only solves the zone-matching problem AT THE MOMENT the PVC is first provisioned — once a zonal PV (a real cloud disk, physically located in one specific availability zone) is bound to a StatefulSet Pod\'s PVC, that binding is permanent for the life of that PVC. Nothing about WaitForFirstConsumer, or any other setting, prevents that SAME Pod from later being rescheduled to a node in a different zone (a node failure, a rolling update touching node affinity/topology rules, a cluster autoscaler event).',
        'When that reschedule happens, the Pod\'s own PVC is still bound to the ORIGINAL zone\'s PV — but a zonal block-storage disk (AWS EBS, GCE PD, Azure Disk) can only attach to nodes within its own zone. The Pod becomes permanently stuck Pending, unable to mount its own already-bound volume, since the scheduler cannot place it on any node that can actually attach that specific PV.',
        'The documented recovery requires deleting BOTH the stranded Pod AND its PVC (in that order — deleting only the Pod lets the StatefulSet controller recreate it while the PVC, and therefore its zone-locked binding, is untouched) so a brand-new PVC can be created and dynamically provisioned in whichever zone the Pod actually lands in next — which, for a StatefulSet\'s per-replica data volume, means accepting that this specific replica\'s data is effectively starting fresh in a new PV, not attaching to the surviving disk.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'WaitForFirstConsumer solves the FIRST provisioning, not every future reschedule',
      language: 'bash',
      code: `# The main page's own StatefulSet, correctly using
# volumeBindingMode: WaitForFirstConsumer via its fast-ssd
# StorageClass -- postgres-0 gets scheduled to a node in us-east-1a,
# and its PVC is provisioned correctly, in that same zone:
kubectl get pod postgres-0 -o wide
# NAME         READY   STATUS    NODE
# postgres-0   1/1     Running   node-3   # node-3 is in us-east-1a

kubectl get pv $(kubectl get pvc data-postgres-0 -o jsonpath='{.spec.volumeName}') \\
  -o jsonpath='{.spec.nodeAffinity}'
# ... topology.kubernetes.io/zone: us-east-1a  <- locked in, permanent

# Weeks later, node-3 fails entirely. The StatefulSet controller
# recreates postgres-0 -- but the ONLY other available capacity is
# in a different zone, us-east-1b:
kubectl get nodes -L topology.kubernetes.io/zone
# NAME     STATUS     ZONE
# node-3   NotReady   us-east-1a
# node-7   Ready      us-east-1b

kubectl get pod postgres-0
# NAME         READY   STATUS    AGE
# postgres-0   0/1     Pending   12m
# -- WaitForFirstConsumer already did its job back when this PVC was
#    FIRST provisioned -- it has no further effect now. The Pod's
#    PVC is bound to a PV physically in us-east-1a, which cannot
#    attach to any node in us-east-1b, and there is no healthy node
#    left in us-east-1a to schedule onto.`,
    },
    {
      label: 'The documented recovery: delete PVC AND Pod, in that order',
      language: 'bash',
      code: `# Deleting only the Pod does NOT fix this -- the StatefulSet
# controller just recreates it with the SAME PVC reference, hitting
# the identical zone mismatch again:
kubectl delete pod postgres-0
# postgres-0 recreated -- still Pending, same zone conflict

# The documented fix: delete the PVC FIRST, then the Pod --
kubectl delete pvc data-postgres-0
kubectl delete pod postgres-0

# The StatefulSet controller recreates BOTH postgres-0 and a brand
# new data-postgres-0 PVC together. With WaitForFirstConsumer still
# in effect, the NEW PVC provisions in whichever zone the Pod
# actually gets scheduled to this time (us-east-1b, if that's where
# capacity exists) -- but this is a FRESH, empty PV, not the
# original data-bearing disk from us-east-1a. Recovering the actual
# DATA (not just getting the Pod running again) requires restoring
# from a backup (e.g. Velero, or the main page's own pg_dump
# app-level option) onto this new volume -- WaitForFirstConsumer
# guarantees a CORRECTLY-ZONED volume for the new Pod, it does not,
# and cannot, guarantee the SAME data survives a cross-zone reschedule.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team runs a 3-replica StatefulSet with <code>volumeBindingMode: WaitForFirstConsumer</code>, exactly as the main page\'s own mistake-entry fix recommends, and confirms each Pod\'s PVC provisioned correctly in the same zone as its Pod when the StatefulSet was first created. Months later, a zone-wide outage takes down the node running <code>postgres-1</code>, and its replacement Pod gets permanently stuck <code>Pending</code>. The team is confused, since they already applied the documented WaitForFirstConsumer fix. Using this subtopic\'s theory, why didn\'t that fix prevent this?',
    hint: 'WaitForFirstConsumer controls what happens at PVC PROVISIONING time. Is provisioning time the same moment as every future time the Pod might need to be rescheduled?',
    solution: 'Per this subtopic\'s theory, WaitForFirstConsumer only solved the zone-matching problem at the ORIGINAL provisioning moment — it correctly ensured postgres-1\'s PVC was provisioned in the same zone as the node it was first scheduled to. It has no ongoing effect after that: once bound, the PVC is permanently attached to a specific zonal PV, physically located in that one zone. When the zone-wide outage removes every node in that zone, the StatefulSet controller can only reschedule postgres-1 onto a node in a DIFFERENT zone — but that zonal disk cannot attach there, so the Pod is stuck Pending, unable to mount its own already-bound volume. This isn\'t a failure of WaitForFirstConsumer; it solved the exact problem it was designed for (first-time provisioning), but a StatefulSet\'s per-replica PVC persisting indefinitely — a feature the main page\'s own theory calls out as intentional, to protect data — means that same persisted binding can later strand a Pod during a zone failure. Recovery requires deleting both the PVC and the Pod (PVC first) so a fresh PVC can provision in the new zone, accepting that this specific replica\'s original data must be restored from a backup rather than reattached.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own mistake-entry fix, volumeBindingMode: WaitForFirstConsumer, is a permanent, ongoing guarantee that a StatefulSet Pod and its PVC will always be schedulable together, for the life of the StatefulSet.',
      reality: 'Per this subtopic\'s theory, WaitForFirstConsumer only governs the FIRST provisioning moment. Once a zonal PV is bound, that binding is fixed — if the Pod later needs to be rescheduled to a different zone (a node or zone failure), nothing about WaitForFirstConsumer prevents the Pod from getting stuck Pending, since it already did its one job.'
    },
    {
      thought: 'Since the main page\'s own StatefulSet theory says PVCs are preserved (not deleted) when a Pod is deleted or scaled down, this persistence is purely a data-safety feature with no downside.',
      reality: 'Per this subtopic\'s exercise, that same persistence is precisely what can strand a Pod after a zone failure — the PVC survives, permanently bound to a now-unreachable zonal PV, blocking the replacement Pod from being scheduled anywhere the volume can actually attach.'
    },
    {
      thought: 'Deleting just the stuck Pod and letting the StatefulSet controller recreate it is enough to resolve a cross-zone scheduling deadlock like this.',
      reality: 'Per this subtopic\'s theory, deleting only the Pod recreates it with the SAME PVC reference, hitting the identical zone conflict again immediately — the documented fix requires deleting the PVC as well (before the Pod), accepting that the new PVC\'s data starts fresh unless restored from a backup.'
    }
  ];
}
