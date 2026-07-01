import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

const quickRef: QuickRefItem[] = [
  { name: 'PersistentVolume (PV)', type: 'class', desc: 'Cluster-level storage resource — provisioned by admin or dynamically' },
  { name: 'PersistentVolumeClaim (PVC)', type: 'class', desc: 'Pod\'s request for storage — bound to a matching PV' },
  { name: 'StorageClass', type: 'class', desc: 'Dynamic provisioner config — creates PVs on demand when PVCs are created' },
  { name: 'ReadWriteOnce (RWO)', type: 'keyword', desc: 'Mounted read-write by one node at a time (most block storage)' },
  { name: 'ReadWriteMany (RWX)', type: 'keyword', desc: 'Mounted read-write by many nodes simultaneously (NFS, EFS, Ceph)' },
  { name: 'Retain', type: 'keyword', desc: 'Reclaim policy: PV kept when PVC deleted — manual cleanup required' },
  { name: 'Delete', type: 'keyword', desc: 'Reclaim policy: PV and underlying storage deleted when PVC deleted' },
  { name: 'volumeClaimTemplates:', type: 'keyword', desc: 'StatefulSet field — creates a dedicated PVC per Pod replica' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'PV, PVC, and StorageClass',
    points: [
      'PersistentVolume (PV): cluster-level resource representing a piece of storage — NFS, EBS, GCE PD, etc.',
      'PersistentVolumeClaim (PVC): namespace-level resource requesting storage by size and access mode.',
      'Binding: Kubernetes matches PVCs to PVs by size, access mode, and storageClass. Bound is a 1:1 relationship.',
      'StorageClass enables dynamic provisioning — when a PVC references a StorageClass, a PV is automatically created.',
      'In cloud environments, StorageClass provisions cloud disks (EBS, GCE PD, Azure Disk) on demand.',
    ],
  },
  {
    heading: 'Access Modes',
    points: [
      'ReadWriteOnce (RWO): read-write by a single node — standard for block storage (EBS, GCE PD, Azure Disk).',
      'ReadOnlyMany (ROX): read-only by many nodes — useful for shared config or static assets.',
      'ReadWriteMany (RWX): read-write by many nodes — requires network storage (NFS, EFS, Azure Files, Ceph RBD).',
      'ReadWriteOncePod (RWOP): K8s 1.22+ — read-write by exactly ONE Pod (stronger than RWO which is per-node).',
      'Access mode must match what the storage backend supports — EBS only supports RWO, not RWX.',
    ],
  },
  {
    heading: 'Reclaim Policies',
    points: [
      'Retain: when PVC is deleted, PV enters Released state. Data is preserved. Admin must manually reclaim/delete.',
      'Delete: when PVC is deleted, PV and underlying storage (the cloud disk) are automatically deleted.',
      'Recycle (deprecated): basic scrub — replaced by dynamic provisioning.',
      'Default policy for dynamically-provisioned StorageClasses is usually Delete — data gone with PVC.',
      'For production databases, use Retain so you can recover data if a PVC is accidentally deleted.',
    ],
  },
  {
    heading: 'StatefulSets and volumeClaimTemplates',
    points: [
      'StatefulSets use volumeClaimTemplates to create a dedicated PVC per Pod replica automatically.',
      'Each replica gets a PVC named <template-name>-<pod-name>: data-postgres-0, data-postgres-1.',
      'PVCs are NOT deleted when a StatefulSet Pod is deleted or scaled down — data is preserved.',
      'Delete the StatefulSet with --cascade=orphan to keep PVCs; delete PVCs explicitly to release storage.',
      'Headless Service + StatefulSet enables stable DNS (postgres-0.postgres.ns.svc.cluster.local) for peer discovery.',
    ],
  },
  {
    heading: 'The PV/PVC Abstraction and Dynamic Provisioning',
    points: [
      'A PersistentVolume (PV) represents actual provisioned storage (a cloud disk, an NFS share), while a PersistentVolumeClaim (PVC) is a user\'s REQUEST for storage matching certain criteria (size, access mode) — this separation lets application manifests request storage generically without needing to know the underlying infrastructure details.',
      'Dynamic provisioning (via a StorageClass) automatically creates a new PV on-demand when a PVC is created, eliminating the need for a cluster administrator to manually pre-provision storage — most modern clusters rely on dynamic provisioning rather than static PV pre-creation.',
      'Access modes (ReadWriteOnce, ReadWriteMany, ReadOnlyMany) constrain how many nodes can mount a volume simultaneously — many cloud block storage types only support ReadWriteOnce, meaning a volume can only be attached to Pods on a single node at a time, a common surprise when trying to scale a stateful workload across nodes.',
      'The reclaim policy (Retain, Delete, Recycle) determines what happens to the underlying storage after its PVC is deleted — Delete policy destroys the actual data, while Retain preserves it for manual recovery, a critical distinction to get right for data that must survive accidental PVC deletion.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'PVC + StorageClass',
    language: 'bash',
    code: '# StorageClass — dynamic EBS provisioner (AWS)\napiVersion: storage.k8s.io/v1\nkind: StorageClass\nmetadata:\n  name: fast-ssd\nprovisioner: ebs.csi.aws.com\nparameters:\n  type: gp3\n  iops: "3000"\n  throughput: "125"\nreclaimPolicy: Retain       # preserve data on PVC delete\nvolumeBindingMode: WaitForFirstConsumer  # wait until Pod scheduled\n\n---\n# PersistentVolumeClaim — request 20Gi on fast-ssd\napiVersion: v1\nkind: PersistentVolumeClaim\nmetadata:\n  name: postgres-data\n  namespace: production\nspec:\n  storageClassName: fast-ssd\n  accessModes: [ReadWriteOnce]\n  resources:\n    requests:\n      storage: 20Gi\n\n---\n# Pod using the PVC\nspec:\n  containers:\n    - name: postgres\n      image: postgres:16-alpine\n      volumeMounts:\n        - name: data\n          mountPath: /var/lib/postgresql/data\n  volumes:\n    - name: data\n      persistentVolumeClaim:\n        claimName: postgres-data',
  },
  {
    label: 'StatefulSet with PVC templates',
    language: 'bash',
    code: 'apiVersion: apps/v1\nkind: StatefulSet\nmetadata:\n  name: postgres\n  namespace: production\nspec:\n  serviceName: postgres       # headless service name\n  replicas: 3\n  selector:\n    matchLabels: { app: postgres }\n  template:\n    metadata:\n      labels: { app: postgres }\n    spec:\n      containers:\n        - name: postgres\n          image: postgres:16-alpine\n          env:\n            - name: POSTGRES_PASSWORD\n              valueFrom:\n                secretKeyRef: { name: pg-secret, key: password }\n          volumeMounts:\n            - name: data\n              mountPath: /var/lib/postgresql/data\n  volumeClaimTemplates:\n    - metadata:\n        name: data\n      spec:\n        storageClassName: fast-ssd\n        accessModes: [ReadWriteOnce]\n        resources:\n          requests:\n            storage: 50Gi\n# Creates: data-postgres-0, data-postgres-1, data-postgres-2\n# Each pod gets its own PVC bound to its own cloud disk',
  },
  {
    label: 'Storage inspection',
    language: 'bash',
    code: '# List PVCs and their status\nkubectl get pvc -n production\n# NAME            STATUS   VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS\n# postgres-data   Bound    pvc-xxx  20Gi       RWO            fast-ssd\n\n# List PVs (cluster-wide)\nkubectl get pv\n\n# Describe a PVC (check bound PV, events)\nkubectl describe pvc postgres-data -n production\n\n# Check StorageClasses\nkubectl get storageclass\n# NAME               PROVISIONER             ...\n# fast-ssd           ebs.csi.aws.com\n# standard (default) kubernetes.io/gce-pd\n\n# Resize a PVC (StorageClass must allow expansion)\nkubectl patch pvc postgres-data -n production \\\n  -p \'{"spec":{"resources":{"requests":{"storage":"50Gi"}}}}\'\n\n# Delete StatefulSet without deleting PVCs:\nkubectl delete statefulset postgres --cascade=orphan',
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Using emptyDir for database storage',
    wrong: 'volumes:\n  - name: db-data\n    emptyDir: {}   # deleted when Pod is removed — all data lost',
    right: 'volumes:\n  - name: db-data\n    persistentVolumeClaim:\n      claimName: postgres-data  # survives Pod restarts',
    explanation: 'emptyDir is ephemeral — it is deleted when the Pod is removed from the node (crash, scale-down, node failure). Always use PVCs backed by a PV for any data you need to persist across Pod restarts.',
  },
  {
    title: 'Not matching the access mode to what the storage backend supports',
    wrong: '# Requesting RWX from an EBS-backed StorageClass\naccessModes: [ReadWriteMany]  # EBS only supports RWO\n# PVC stays Pending indefinitely',
    right: '# Use RWX only with backends that support it:\n# EFS (AWS), Filestore (GCP), Azure Files, NFS, Ceph\naccessModes: [ReadWriteMany]\nstorageClassName: efs-sc',
    explanation: 'Block storage (AWS EBS, GCE PD, Azure Disk) only supports RWO. Requesting RWX from these backends leaves the PVC in Pending state forever. For shared file access across multiple Pods/nodes, use a network filesystem like NFS, EFS, Azure Files, or Ceph.',
  },
  {
    title: 'Deleting a StatefulSet and expecting PVCs to be cleaned up',
    wrong: 'kubectl delete statefulset postgres\n# PVCs data-postgres-0/1/2 still exist\n# Cloud disks still billed — forgotten orphans',
    right: '# Delete PVCs explicitly after deleting the StatefulSet:\nkubectl delete pvc -l app=postgres -n production\n# Or delete with cascade if you want everything gone',
    explanation: 'StatefulSet deletion preserves PVCs by design to protect data. The cloud disks continue to be provisioned and billed. Explicitly delete PVCs after removing a StatefulSet if you no longer need the data.',
  },
  {
    title: 'Using reclaimPolicy: Delete for production databases',
    wrong: 'reclaimPolicy: Delete  # in StorageClass for prod DB\n# Accidentally delete PVC → DB data permanently gone',
    right: 'reclaimPolicy: Retain  # PV and disk survive PVC deletion\n# Data recoverable; admin must manually clean up',
    explanation: 'The Delete reclaim policy destroys the underlying storage (the cloud disk) when the PVC is deleted — including accidental deletions. For production databases, use Retain so the disk survives PVC deletion and data can be recovered.',
  },
  {
    title: 'Not using WaitForFirstConsumer volume binding mode in multi-zone clusters',
    wrong: 'volumeBindingMode: Immediate\n# PV provisioned in zone-a\n# Pod scheduled in zone-b → cannot mount — stuck Pending',
    right: 'volumeBindingMode: WaitForFirstConsumer\n# PV provisioned in the same zone as the scheduled Pod',
    explanation: 'With Immediate binding, the PV is created in whatever zone the storage provisioner chooses, before the Pod is scheduled. If the Pod lands in a different zone, it cannot mount the volume. WaitForFirstConsumer delays provisioning until the Pod is scheduled, ensuring the PV is in the correct zone.',
  },
];

const challenge: Challenge = {
  title: 'Storage Class Selector',
  language: 'typescript',
  description: 'Write a function that takes a workload description and recommends the best storage access mode. Rules: if shared: true and multiNode: true → ReadWriteMany; if readOnly: true → ReadOnlyMany; if replicas > 1 and not shared → warn that RWO won\'t work across nodes; default → ReadWriteOnce.',
  hints: [
    'Check shared + multiNode for RWX first',
    'Check readOnly for ROX',
    'Check replicas > 1 with no shared flag — this is a common mistake to warn about',
    'Default to RWO for single-replica stateful workloads',
    'Return { accessMode: string; warning?: string }',
  ],
  starterCode: 'interface WorkloadStorage {\n  shared: boolean;    // multiple Pods share the same volume\n  multiNode: boolean; // Pods run on different nodes\n  readOnly: boolean;\n  replicas: number;\n}\n\ninterface StorageRecommendation {\n  accessMode: string;\n  warning?: string;\n}\n\nfunction recommendAccessMode(w: WorkloadStorage): StorageRecommendation {\n  // TODO: return access mode recommendation\n  return { accessMode: \'ReadWriteOnce\' };\n}',
  solution: 'interface WorkloadStorage {\n  shared: boolean;\n  multiNode: boolean;\n  readOnly: boolean;\n  replicas: number;\n}\n\ninterface StorageRecommendation {\n  accessMode: string;\n  warning?: string;\n}\n\nfunction recommendAccessMode(w: WorkloadStorage): StorageRecommendation {\n  if (w.readOnly) {\n    return { accessMode: \'ReadOnlyMany\' };\n  }\n\n  if (w.shared && w.multiNode) {\n    return {\n      accessMode: \'ReadWriteMany\',\n      warning: \'RWX requires network storage (NFS, EFS, Ceph) — verify your StorageClass supports it\'\n    };\n  }\n\n  if (w.replicas > 1 && !w.shared) {\n    return {\n      accessMode: \'ReadWriteOnce\',\n      warning: `RWO mounts on one node at a time — with ${w.replicas} replicas, all Pods must land on the same node or each needs its own PVC (use StatefulSet volumeClaimTemplates)`\n    };\n  }\n\n  return { accessMode: \'ReadWriteOnce\' };\n}',
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the relationship between a PVC and a PV?',
    options: [
      'PVC is the storage; PV is the request',
      'PVC is a namespace-level request; PV is the cluster-level storage resource — they bind 1:1',
      'PV is a template; PVC creates multiple copies of it',
      'They are interchangeable names for the same resource',
    ],
    answer: 1,
    explanation: 'PersistentVolumeClaim is a namespace-scoped request for storage (size, access mode). PersistentVolume is the actual cluster-scoped storage resource. Kubernetes binds them 1:1 when a PVC is created, either by finding a matching existing PV or by dynamically provisioning one via a StorageClass.',
  },
  {
    q: 'Which access mode allows a volume to be mounted read-write by multiple nodes simultaneously?',
    options: [
      'ReadWriteOnce (RWO)',
      'ReadOnlyMany (ROX)',
      'ReadWriteMany (RWX)',
      'ReadWriteOncePod (RWOP)',
    ],
    answer: 2,
    explanation: 'ReadWriteMany (RWX) allows the volume to be mounted read-write by multiple nodes at once. This requires network-based storage that supports concurrent writes — NFS, AWS EFS, Azure Files, or Ceph. Standard block storage (EBS, GCE PD) only supports RWO.',
  },
  {
    q: 'What happens to StatefulSet PVCs when you delete the StatefulSet?',
    options: [
      'PVCs are deleted immediately along with the StatefulSet',
      'PVCs are retained — StatefulSet deletion does not delete PVCs',
      'PVCs enter a Terminating state and are cleaned up within 5 minutes',
      'PVCs are renamed with a timestamp suffix and archived',
    ],
    answer: 1,
    explanation: 'By design, deleting a StatefulSet does NOT delete its PVCs. This protects data from accidental deletion during StatefulSet upgrades or recreations. You must explicitly delete the PVCs with kubectl delete pvc or use kubectl delete statefulset --cascade=foreground to cascade.',
  },
  {
    q: 'What does volumeBindingMode: WaitForFirstConsumer do?',
    options: [
      'Delays PV creation until the PVC is 1 day old',
      'Provisions the PV in the same availability zone as the Pod that claims it',
      'Waits for manual admin approval before binding',
      'Queues PVC binding until a Pod requests the volume',
    ],
    answer: 1,
    explanation: 'WaitForFirstConsumer delays PV provisioning until a Pod that claims the PVC is scheduled. This ensures the PV is provisioned in the same availability zone as the Pod. With Immediate mode, the PV may be provisioned in a different zone, preventing the Pod from mounting it.',
  },
  {
    q: 'What reclaim policy should you use for a production database StorageClass?',
    options: [
      'Delete — automatically clean up when PVC is deleted',
      'Recycle — scrub and reuse the volume',
      'Retain — preserve the PV and underlying disk even if the PVC is deleted',
      'Archive — move data to cold storage on deletion',
    ],
    answer: 2,
    explanation: 'Retain keeps the PV and underlying cloud disk when a PVC is deleted — even accidentally. The PV enters Released state and must be manually cleaned up or rebound. For production databases, this is the safe choice: data survives accidental PVC deletion.',
  },
  { q: 'If a PVC requests 10Gi but the smallest available matching PV is 20Gi, what does Kubernetes bind the PVC to?', options: ['Binding fails — PV size must exactly match the PVC request', 'Kubernetes binds the PVC to the smallest PV that satisfies the request (20Gi here), even though it exceeds the requested size — the PVC does not get exactly 10Gi, it gets the whole bound PV', 'Kubernetes automatically splits the 20Gi PV into two 10Gi volumes', 'The PVC is bound but capped to using only 10Gi of the 20Gi PV'], answer: 1, explanation: 'Static PV binding matches a PVC to the SMALLEST PV whose capacity is >= the requested size and whose access mode/StorageClass match — but binding is all-or-nothing at the PV\'s actual size, not a partial allocation. So a 10Gi PVC bound to a 20Gi PV gives that pod access to the full 20Gi, "wasting" 10Gi of the claim\'s original intent. This is precisely the coordination problem dynamic provisioning (via StorageClass) solves — it provisions a PV sized to exactly match each PVC request instead of relying on pre-created PVs of arbitrary sizes.' },
];

const qna: QnaItem[] = [
  {
    q: 'Can I resize a PersistentVolumeClaim after it is created?',
    a: 'Yes, if the StorageClass has allowVolumeExpansion: true. Patch the PVC with a larger storage request: kubectl patch pvc my-pvc -p \'{"spec":{"resources":{"requests":{"storage":"50Gi"}}}}\'. The underlying volume is resized and the filesystem is expanded (may require the Pod to restart). You cannot shrink a PVC.',
  },
  {
    q: 'What is the difference between a static PV and dynamic provisioning?',
    a: 'Static: an admin manually creates PV objects pointing to pre-provisioned storage (e.g., an existing NFS export or cloud disk). When a PVC matches the PV\'s size and access mode, they bind. Dynamic: a StorageClass defines a provisioner; when a PVC references the StorageClass, Kubernetes automatically creates the PV and the underlying storage resource. Dynamic is preferred in cloud environments.',
  },
  {
    q: 'How do I back up persistent volumes in Kubernetes?',
    a: 'Options: (1) Velero: open-source cluster backup tool that snapshots PVCs to object storage (S3, GCS). (2) Cloud snapshots: use kubectl or CSI snapshotting (VolumeSnapshot) to take cloud disk snapshots. (3) App-level backup: pg_dump for PostgreSQL, mysqldump for MySQL — independent of Kubernetes. Velero with CSI snapshotting is the most K8s-native approach.',
  },
  {
    q: 'What is a CSI driver and why does it matter?',
    a: 'CSI (Container Storage Interface) is the standard plugin interface for storage systems to integrate with Kubernetes. Cloud providers ship CSI drivers (aws-ebs-csi-driver, gce-pd-csi-driver) that replace the deprecated in-tree volume plugins. CSI drivers support dynamic provisioning, snapshots, cloning, and volume expansion. Always use CSI drivers over legacy in-tree plugins for new clusters.',
  },
  {
    q: 'Can two Pods share the same PVC?',
    a: 'Only if the PV\'s access mode is RWX (ReadWriteMany). With RWO, only one node can mount the volume at a time — if two Pods on different nodes both claim the same RWO PVC, the second Pod fails to start. For shared storage between replicas, use RWX with a compatible backend (NFS, EFS, Ceph) or give each Pod its own PVC via StatefulSet volumeClaimTemplates.',
  },
  { q: 'What are the three Kubernetes PersistentVolume access modes?', a: 'ReadWriteOnce (RWO): mounted as read-write by ONE node. Most block storage supports this including AWS EBS, GCP PD, and Azure Disk. ReadOnlyMany (ROX): mounted as read-only by MANY nodes simultaneously, rarely used in practice. ReadWriteMany (RWX): mounted as read-write by MANY nodes simultaneously, requires shared or distributed storage such as NFS, CephFS, Azure Files, or AWS EFS; only specific CSI drivers support RWX. Note that RWO is node-level not pod-level, so multiple pods on the SAME node can share a RWO volume. For true single-pod exclusivity, use pod anti-affinity rules or StatefulSets.' },
];

const revision: RevisionSummary = {
  oneLiner: 'PVC requests storage → PV provides it → StorageClass dynamically provisions it; use Retain policy for prod databases and StatefulSet volumeClaimTemplates for per-replica storage.',
  mustKnow: [
    'PVC (namespace, request) binds 1:1 to PV (cluster, resource); StorageClass auto-provisions PVs',
    'RWO: one node; ROX: many nodes read-only; RWX: many nodes read-write (needs NFS/EFS/Ceph)',
    'Retain: disk survives PVC delete; Delete: disk gone with PVC — use Retain for prod',
    'WaitForFirstConsumer: provision PV in same zone as Pod (required in multi-zone clusters)',
    'StatefulSet volumeClaimTemplates: one PVC per replica; PVCs survive StatefulSet deletion',
    'emptyDir is ephemeral — never use for database or persistent app data',
  ],
  interviewFocus: [
    'What is the difference between a PV and a PVC?',
    'When would you use ReadWriteMany vs ReadWriteOnce?',
    'Why should a production database StorageClass use reclaimPolicy: Retain?',
    'What happens to StatefulSet PVCs when the StatefulSet is deleted?',
  ],
};

@Component({
  selector: 'app-k8s-storage',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent,
    PageCompleteComponent,
  ],
  templateUrl: './storage.html',
  styleUrl: './storage.scss',
})
export class K8sStorage {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
