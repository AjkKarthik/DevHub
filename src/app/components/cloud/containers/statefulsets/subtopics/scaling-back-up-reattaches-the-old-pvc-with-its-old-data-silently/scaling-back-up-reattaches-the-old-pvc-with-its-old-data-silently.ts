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
  templateUrl: './scaling-back-up-reattaches-the-old-pvc-with-its-old-data-silently.html',
  styleUrl: './scaling-back-up-reattaches-the-old-pvc-with-its-old-data-silently.scss'
})
export class ScalingBackUpReattachesTheOldPvcWithItsOldDataSilentlySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own theory frames PVC retention purely as a StatefulSet-deletion topic',
      points: [
        'The main page\'s own mistake entry title, "Deleting a StatefulSet without cascading PVC deletion," and its own QnA answer both frame PVC retention as something that happens when the WHOLE StatefulSet is deleted — the fix given is "explicitly delete PVCs after confirming data is backed up."',
        'The main page\'s own theory bullet does mention PVCs surviving "restarts" ("each StatefulSet pod gets its own persistent volume claim that follows that specific pod across rescheduling") — but never discusses the specific, different scenario of SCALING a StatefulSet DOWN and then back UP, which is a much more routine, frequent operation than deleting the whole StatefulSet.',
      ]
    },
    {
      heading: 'What actually happens on scale-down and scale-back-up: the OLD PVC, with its OLD data, comes back automatically',
      points: [
        'Per Kubernetes\' own documented default behavior, scaling a StatefulSet DOWN (e.g. replicas: 3 → 1) does NOT delete the PVCs belonging to the removed ordinals (postgres-1, postgres-2\'s own data-postgres-1/2 PVCs) — they remain bound, untouched, exactly like the main page\'s own "deleting the whole StatefulSet" scenario, just triggered by a much more common, everyday scaling operation instead.',
        'Scaling BACK UP later (replicas: 1 → 3) recreates postgres-1 and postgres-2 — and because their own PVCs never went away, the StatefulSet controller reattaches each recreated Pod to its EXACT SAME PersistentVolumeClaim, with whatever data was last written to it still intact. This is silent and automatic: there is no prompt, no distinction in `kubectl get pods` output between "genuinely fresh replica" and "replica reattached to old, possibly stale data."',
        'Since Kubernetes 1.27 (beta), an OPT-IN field — `spec.persistentVolumeClaimRetentionPolicy.whenScaled: Delete` — changes this default: setting it causes PVCs belonging to scaled-down ordinals to be deleted once their Pod terminates, so a later scale-up genuinely provisions FRESH PVCs instead of reattaching old ones. This is a separate setting from `whenDeleted` (which governs the main page\'s own "delete the whole StatefulSet" scenario) — both default to `Retain`, preserving the historical, silent-reattachment behavior unless explicitly changed.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Scale down, then back up — the old data silently reappears',
      language: 'bash',
      code: `# The main page's own postgres StatefulSet, 3 replicas, default
# persistentVolumeClaimRetentionPolicy (Retain for both fields --
# the field isn't even set in the main page's own code tab):
kubectl exec postgres-2 -n data -- psql -U postgres -c \\
  "INSERT INTO events VALUES ('scale-down-marker', now());"

# Scale down to save cost during a quiet period:
kubectl scale statefulset postgres --replicas=1 -n data
# postgres-1 and postgres-2 terminate. Their PVCs remain:
kubectl get pvc -n data -l app=postgres
# NAME              STATUS   VOLUME    CAPACITY
# data-postgres-0   Bound    pvc-aaa   20Gi
# data-postgres-1   Bound    pvc-bbb   20Gi   <- still here
# data-postgres-2   Bound    pvc-ccc   20Gi   <- still here, with data

# Weeks later, traffic picks back up -- scale back to 3:
kubectl scale statefulset postgres --replicas=3 -n data
# postgres-1 and postgres-2 are recreated -- reattached to the SAME
# data-postgres-1/2 PVCs automatically, no prompt, no warning:
kubectl exec postgres-2 -n data -- psql -U postgres -c \\
  "SELECT * FROM events WHERE marker='scale-down-marker';"
#      marker         |         inserted_at
# --------------------+------------------------------
#  scale-down-marker   | 2026-06-10 14:22:07...
# -- the WEEKS-OLD data from before the scale-down is back, silently
#    -- this Pod never actually started "fresh" in any sense.`,
    },
    {
      label: 'Opting into genuinely fresh replicas on scale-up',
      language: 'bash',
      code: `# To make scale-down actually free the storage (and force scale-up
# to provision genuinely NEW, empty PVCs), the main page's own
# StatefulSet spec needs an explicit, opt-in field it never shows:
# apiVersion: apps/v1
# kind: StatefulSet
# metadata:
#   name: postgres
# spec:
#   serviceName: postgres-headless
#   replicas: 3
#   persistentVolumeClaimRetentionPolicy:   # <- K8s 1.27+, beta
#     whenDeleted: Retain    # unrelated to this subtopic -- governs
#                            # the main page's own "delete the whole
#                            # StatefulSet" scenario
#     whenScaled: Delete     # <- THIS is what changes scale-down
#   ...

# With whenScaled: Delete, the SAME scale-down-then-up sequence:
kubectl scale statefulset postgres --replicas=1 -n data
# postgres-1/2 terminate AND their PVCs are garbage-collected once
# each condemned Pod fully terminates:
kubectl get pvc -n data -l app=postgres
# NAME              STATUS   VOLUME
# data-postgres-0   Bound    pvc-aaa
# -- data-postgres-1/2 are genuinely gone this time

kubectl scale statefulset postgres --replicas=3 -n data
# postgres-1/2 are recreated with BRAND NEW, empty PVCs -- no old
# data reappears, matching what many teams assume happens by default.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team scales their postgres StatefulSet down from 3 to 1 replica overnight to save cost, then scales back to 3 the next morning, expecting the two new replicas to start completely fresh and rejoin the cluster as blank nodes that will resync from the primary. Instead, postgres-1 and postgres-2 come back up already containing all the data they had before the scale-down, causing a replication conflict. Using this subtopic\'s theory, why did the "new" replicas already have old data?',
    hint: 'What happens to a StatefulSet\'s own per-replica PVCs when you scale DOWN, under the default retention policy the main page\'s own manifest never overrides?',
    solution: 'Per this subtopic\'s theory, this happened because the team\'s StatefulSet was using the default persistentVolumeClaimRetentionPolicy, under which scaling down does NOT delete the PVCs belonging to the removed ordinals — data-postgres-1 and data-postgres-2 remained bound and untouched overnight, still holding whatever data was last written before the scale-down. When the team scaled back up, the StatefulSet controller recreated postgres-1 and postgres-2 and reattached each one to its own EXACT SAME PersistentVolumeClaim automatically — there was no "fresh start," just a Pod resuming with its old, pre-scale-down data intact, which then conflicted with the primary\'s own now-diverged replication state. The main page\'s own theory only discusses PVC retention in the context of deleting the WHOLE StatefulSet, never this much more common scale-down/scale-up cycle. The fix is either treating scale-down as equivalent to "this replica\'s data may resurface later" and planning replication resync accordingly, or explicitly setting persistentVolumeClaimRetentionPolicy.whenScaled: Delete (Kubernetes 1.27+, beta) so scale-down genuinely frees the storage and scale-up provisions fresh, empty PVCs instead.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own PVC-retention behavior only applies when the WHOLE StatefulSet is deleted — scaling the replica count up and down is a routine, everyday operation that behaves differently and provisions fresh storage each time.',
      reality: 'Per this subtopic\'s theory, the SAME retention behavior applies to scaling down under the default policy — PVCs belonging to scaled-down ordinals are retained, untouched, exactly like the main page\'s own "deleting the whole StatefulSet" scenario, just triggered by a far more routine operation.'
    },
    {
      thought: 'A Pod recreated after scaling a StatefulSet back up always starts with a completely empty, freshly-provisioned volume, the same way a brand-new StatefulSet\'s first replicas do.',
      reality: 'Per this subtopic\'s exercise, under the default retention policy, a Pod recreated after scale-up reattaches to its EXACT SAME PersistentVolumeClaim from before the scale-down, with all of its previous data still present — this is silent and automatic, with no distinction shown anywhere in kubectl output.'
    },
    {
      thought: 'persistentVolumeClaimRetentionPolicy has a single setting that governs PVC cleanup for both StatefulSet deletion and replica scale-down together.',
      reality: 'Per this subtopic\'s theory, whenDeleted and whenScaled are two separate, independently-configurable fields — whenDeleted governs the main page\'s own "delete the whole StatefulSet" scenario, while whenScaled specifically governs the scale-down/scale-up cycle this subtopic covers; both default to Retain unless explicitly changed.'
    }
  ];
}
