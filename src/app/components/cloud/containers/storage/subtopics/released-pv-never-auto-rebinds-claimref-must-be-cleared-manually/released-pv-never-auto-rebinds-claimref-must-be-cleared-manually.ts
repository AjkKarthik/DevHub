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
  templateUrl: './released-pv-never-auto-rebinds-claimref-must-be-cleared-manually.html',
  styleUrl: './released-pv-never-auto-rebinds-claimref-must-be-cleared-manually.scss'
})
export class ReleasedPvNeverAutoRebindsClaimrefMustBeClearedManuallySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own theory describes Released as a state, but not what blocks reuse',
      points: [
        'The main page\'s own "Reclaim Policies" theory bullet says: "Retain: when PVC is deleted, PV enters Released state. Data is preserved. Admin must manually reclaim/delete." This correctly flags that manual action is needed, but frames it as being about DATA cleanup — deciding what to do with the leftover data — not about what specifically blocks the PV from being usable again.',
        'The main page\'s own mistake entry ("Using reclaimPolicy: Delete for production databases") recommends Retain specifically so "data is recoverable" — but never walks through the actual mechanical steps of recovering that data by binding a NEW PVC to the Released PV.',
      ]
    },
    {
      heading: 'What actually blocks reuse: the PV\'s own claimRef still points at the old, deleted PVC',
      points: [
        'Per Kubernetes\' own documented binding behavior, a PV only becomes Available for a NEW PVC to bind to if it "has not reserved PersistentVolumeClaims through its claimRef field." A Released PV still HAS a claimRef — pointing at the UID of the now-deleted PVC that used to own it — even though that PVC no longer exists.',
        'This means creating a brand-new PVC with identical size, access mode, and storageClassName to the deleted one will NOT automatically bind to the Released PV, even though every visible criterion matches — the PV stays stuck in Released state, and the new PVC stays Pending, because Kubernetes checks the stale claimRef first, before ever comparing size/access-mode/storageClass.',
        'The documented fix is manually clearing the PV\'s claimRef field (`kubectl patch pv <name> -p \'{"spec":{"claimRef":null}}\'`), which flips the PV back to Available — only then can a new PVC bind to it (or the new PVC can target it directly and deterministically via its own `spec.volumeName` field, bypassing normal matching-based binding entirely).',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A "matching" new PVC still won\'t bind to a Released PV',
      language: 'bash',
      code: `# The main page's own scenario: postgres-data PVC deleted,
# reclaimPolicy: Retain kept the underlying disk and its PV:
kubectl delete pvc postgres-data -n production

kubectl get pv
# NAME       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS     CLAIM
# pvc-abc123 20Gi       RWO            Retain           Released   production/postgres-data
#                                                        ^^^^^^^^   still shows the OLD claim

# Creating a NEW PVC with identical size/access mode/storageClass --
# looks like it should bind right back to the same PV:
kubectl apply -f - <<EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data-restored
  namespace: production
spec:
  storageClassName: fast-ssd
  accessModes: [ReadWriteOnce]
  resources: { requests: { storage: 20Gi } }
EOF

kubectl get pvc postgres-data-restored -n production
# NAME                     STATUS    VOLUME   CAPACITY   AGE
# postgres-data-restored   Pending            <none>     30s
# -- stuck Pending. The Released PV's claimRef still references the
#    OLD, deleted "production/postgres-data" PVC by UID -- Kubernetes
#    checks this BEFORE ever comparing size/access-mode/storageClass,
#    and refuses to bind a different PVC to a PV that still has one.`,
    },
    {
      label: 'The fix: clear claimRef, or bind explicitly by name',
      language: 'bash',
      code: `# Fix 1 -- clear the stale claimRef, flipping the PV back to Available:
kubectl patch pv pvc-abc123 -p '{"spec":{"claimRef":null}}'

kubectl get pv pvc-abc123
# NAME       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      CLAIM
# pvc-abc123 20Gi       RWO            Retain           Available
# -- now Available; the next matching PVC (including the already-
#    Pending postgres-data-restored above) binds to it automatically
#    within the normal reconciliation loop -- no PVC recreation needed.

# Fix 2 -- skip matching-based binding entirely, targeting this exact
# PV by name from a fresh PVC (useful when several Released PVs exist
# and you need to guarantee which SPECIFIC one a new PVC recovers):
# apiVersion: v1
# kind: PersistentVolumeClaim
# metadata:
#   name: postgres-data-restored
# spec:
#   storageClassName: fast-ssd
#   accessModes: [ReadWriteOnce]
#   resources: { requests: { storage: 20Gi } }
#   volumeName: pvc-abc123   # <- binds to THIS PV specifically,
#                            #    still requires claimRef cleared first`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own advice, a team used <code>reclaimPolicy: Retain</code> on their production database\'s StorageClass. After an accidental PVC deletion, they create a brand-new PVC with the exact same size, access mode, and storageClassName, expecting Kubernetes to automatically rebind it to the still-intact PV holding their data. The new PVC instead sits in <code>Pending</code> indefinitely. Using this subtopic\'s theory, why doesn\'t matching criteria alone cause the rebind?',
    hint: 'A Released PV still has a field pointing at the OLD, deleted PVC. Does Kubernetes\' binding logic check that field before or after comparing size, access mode, and storageClass?',
    solution: 'Per this subtopic\'s theory, the new PVC stays Pending because the Released PV\'s claimRef field still references the UID of the OLD, now-deleted PVC — and Kubernetes\' binding logic checks whether a PV already has a claimRef BEFORE it ever compares size, access mode, or storageClassName against a candidate PVC. A Released PV, despite the main page\'s own Retain policy correctly preserving its underlying data, is not automatically returned to the pool of bindable ("Available") PVs just because its old claim is gone — its claimRef simply isn\'t cleared automatically. The fix is an explicit, manual admin action: patching the PV to null out its claimRef field, which flips the PV\'s status from Released to Available, at which point the already-Pending new PVC (or any future matching PVC) binds normally through the ordinary reconciliation loop — exactly the "manual reclaim" step the main page\'s own theory names but never walks through mechanically.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A Released PV is functionally equivalent to a freshly-provisioned Available PV — any new PVC matching its size, access mode, and StorageClass will bind to it automatically, since the old PVC is already gone.',
      reality: 'Per this subtopic\'s theory, a Released PV still carries a claimRef pointing at the deleted PVC\'s UID, and Kubernetes checks this field before evaluating any matching criteria at all — a Released PV will not bind to a new PVC until an admin manually clears claimRef, regardless of how well the new PVC matches.'
    },
    {
      thought: 'The main page\'s own "Admin must manually reclaim/delete" language for the Retain policy is only about deciding what to do with the leftover DATA (keep it, archive it, delete it) — not about anything blocking the PV\'s own reuse.',
      reality: 'Per this subtopic\'s theory, the manual step is specifically about the PV OBJECT\'s own claimRef field, a distinct, mechanical prerequisite that exists independently of any decision about the underlying data — even if an admin wants to reuse the SAME data immediately, the claimRef must still be cleared first.'
    },
    {
      thought: 'Recreating a PVC with a `volumeName` field pointing directly at a Released PV\'s name is enough to bind them together, bypassing the claimRef issue entirely.',
      reality: 'Per this subtopic\'s theory, specifying volumeName still requires the target PV\'s claimRef to be cleared first — targeting a PV by name changes HOW the binding is matched (skipping the general size/access-mode search), it does not bypass the underlying claimRef precondition that gates binding in the first place.'
    }
  ];
}
