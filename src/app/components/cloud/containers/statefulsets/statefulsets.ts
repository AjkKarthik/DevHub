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
  { name: 'StatefulSet', type: 'keyword', desc: 'Manages stateful Pods with stable names (pod-0, pod-1) and stable storage' },
  { name: 'Headless Service', type: 'keyword', desc: 'clusterIP: None — gives each pod its own DNS entry (pod-0.svc.ns.svc.cluster.local)' },
  { name: 'volumeClaimTemplates', type: 'keyword', desc: 'Creates a PVC per Pod replica — PVCs persist beyond Pod restarts' },
  { name: 'DaemonSet', type: 'keyword', desc: 'Runs exactly one Pod per node — log agents, monitoring, CNI plugins' },
  { name: 'PodDisruptionBudget', type: 'keyword', desc: 'Guarantees minimum available replicas during voluntary disruptions (upgrades, drains)' },
  { name: 'Init containers', type: 'keyword', desc: 'Run sequentially before app containers start — schema migrations, seed data, wait-for-dependency' },
  { name: 'updateStrategy: RollingUpdate', type: 'keyword', desc: 'StatefulSet rolls Pods in reverse-ordinal order (pod-N → pod-0) with partition control' },
  { name: 'tolerations', type: 'keyword', desc: 'Allow a DaemonSet Pod to schedule on tainted nodes (e.g. master nodes)' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'StatefulSet — Stable Identity',
    points: [
      'StatefulSet gives each Pod a stable, predictable name: <name>-0, <name>-1, ..., <name>-N.',
      'Each Pod gets its own DNS hostname via a Headless Service: pod-0.myservice.namespace.svc.cluster.local.',
      'Pods start in order (0 → N) and terminate in reverse order (N → 0) — critical for leader/follower databases.',
      'Unlike Deployments, StatefulSet Pods are NOT interchangeable — pod-0 is always the same logical instance.',
      'volumeClaimTemplates creates a dedicated PVC per Pod; when pod-0 restarts, it remounts the same PVC.',
    ],
  },
  {
    heading: 'When to Use StatefulSet vs Deployment',
    points: [
      'Use Deployment for stateless apps: web servers, APIs, workers — replicas are identical and interchangeable.',
      'Use StatefulSet for: databases (PostgreSQL, MySQL, MongoDB), message brokers (Kafka, RabbitMQ), distributed caches (Redis Cluster) — anything needing stable identity or per-replica storage.',
      'StatefulSet is harder to operate: you must handle replication setup, leader election, and failover at the application layer.',
      'Consider managed cloud databases (RDS, Cloud SQL) instead of running databases in K8s — lower operational burden.',
      'Operators (e.g. Zalando Postgres Operator, Percona Operator) wrap StatefulSet complexity into a managed CRD.',
    ],
  },
  {
    heading: 'DaemonSet — One Pod Per Node',
    points: [
      'DaemonSet ensures exactly one Pod runs on every (or selected) node in the cluster.',
      'Common use cases: log collectors (Fluentd, Promtail), metrics agents (node-exporter), CNI plugins (Calico, Cilium), security scanners.',
      'nodeSelector or affinity restricts the DaemonSet to a subset of nodes (e.g. only GPU nodes).',
      'Tolerations allow scheduling on tainted nodes — without tolerations, DaemonSet pods skip tainted nodes.',
      'DaemonSet uses RollingUpdate strategy by default — updateStrategy.rollingUpdate.maxUnavailable controls pace.',
    ],
  },
  {
    heading: 'PodDisruptionBudget and Init Containers',
    points: [
      'PodDisruptionBudget (PDB) limits voluntary disruptions: node drain, cluster upgrade, manual scale-down.',
      'minAvailable: 2 ensures at least 2 replicas are always Running during disruptions.',
      'maxUnavailable: 1 means at most 1 replica can be disrupted at a time.',
      'Init containers run before the main container and must complete successfully — used for migrations, config rendering, waiting for dependencies.',
      'Init containers share the same volumes as the main container — write a config file in init, read it in app.',
    ],
  },
  {
    heading: 'Stable Identity: What StatefulSets Guarantee That Deployments Don\'t',
    points: [
      'StatefulSet pods get stable, predictable names (web-0, web-1, web-2) that persist across restarts — a Deployment\'s pods get random suffixes and are fully interchangeable, which is why Deployments cannot support workloads where a specific pod\'s identity matters (like a database replica knowing its own role).',
      'Each StatefulSet pod gets its own persistent volume claim that follows that specific pod across rescheduling — pod web-1 always reattaches to ITS OWN volume, not a randomly assigned one, which is essential for stateful workloads like databases where data must stay associated with a specific replica.',
      'StatefulSet pods are created and terminated in strict ORDER (0, then 1, then 2, and reverse order for termination) by default — this ordered rollout matters for clustered stateful applications where a later replica may depend on an earlier one already being initialized.',
      'Because of these guarantees, StatefulSets are reserved for genuinely stateful, identity-sensitive workloads (databases, distributed consensus systems) — using a StatefulSet for a stateless application adds unnecessary operational complexity (ordered rollouts, stable storage) with no corresponding benefit.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'StatefulSet (Postgres)',
    language: 'bash',
    code: 'apiVersion: apps/v1\nkind: StatefulSet\nmetadata:\n  name: postgres\n  namespace: data\nspec:\n  serviceName: postgres-headless    # must match the Headless Service name\n  replicas: 3\n  selector:\n    matchLabels:\n      app: postgres\n  template:\n    metadata:\n      labels:\n        app: postgres\n    spec:\n      containers:\n        - name: postgres\n          image: postgres:16-alpine\n          env:\n            - name: POSTGRES_PASSWORD\n              valueFrom:\n                secretKeyRef: { name: pg-secret, key: password }\n          ports:\n            - containerPort: 5432\n          volumeMounts:\n            - name: data\n              mountPath: /var/lib/postgresql/data\n  volumeClaimTemplates:          # creates one PVC per replica\n    - metadata:\n        name: data\n      spec:\n        accessModes: [ReadWriteOnce]\n        storageClassName: fast-ssd\n        resources:\n          requests:\n            storage: 20Gi\n---\n# Headless Service — gives each pod its own DNS entry\napiVersion: v1\nkind: Service\nmetadata:\n  name: postgres-headless\n  namespace: data\nspec:\n  clusterIP: None             # headless: no virtual IP\n  selector:\n    app: postgres\n  ports:\n    - port: 5432\n# Pod DNS: postgres-0.postgres-headless.data.svc.cluster.local',
  },
  {
    label: 'DaemonSet (log agent)',
    language: 'bash',
    code: 'apiVersion: apps/v1\nkind: DaemonSet\nmetadata:\n  name: promtail\n  namespace: monitoring\nspec:\n  selector:\n    matchLabels:\n      app: promtail\n  updateStrategy:\n    type: RollingUpdate\n    rollingUpdate:\n      maxUnavailable: 1\n  template:\n    metadata:\n      labels:\n        app: promtail\n    spec:\n      tolerations:\n        - key: node-role.kubernetes.io/control-plane\n          operator: Exists\n          effect: NoSchedule      # also run on control-plane nodes\n      containers:\n        - name: promtail\n          image: grafana/promtail:2.9.0\n          args: [-config.file=/etc/promtail/config.yml]\n          volumeMounts:\n            - name: varlog\n              mountPath: /var/log\n              readOnly: true\n            - name: config\n              mountPath: /etc/promtail\n      volumes:\n        - name: varlog\n          hostPath:\n            path: /var/log\n        - name: config\n          configMap:\n            name: promtail-config',
  },
  {
    label: 'PDB + Init container',
    language: 'bash',
    code: '# PodDisruptionBudget: ensure 2 replicas always available during drain\napiVersion: policy/v1\nkind: PodDisruptionBudget\nmetadata:\n  name: postgres-pdb\n  namespace: data\nspec:\n  minAvailable: 2\n  selector:\n    matchLabels:\n      app: postgres\n---\n# Init container: wait for upstream service, then run migration\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: api\nspec:\n  template:\n    spec:\n      initContainers:\n        - name: wait-for-db\n          image: busybox:1.35\n          command: [\'sh\', \'-c\',\n            \'until nc -z postgres-headless.data 5432; do echo waiting; sleep 2; done\']\n        - name: run-migrations\n          image: ghcr.io/org/api-migrate:v1.2.0\n          command: [\'./migrate\', \'up\']\n          env:\n            - name: DATABASE_URL\n              valueFrom:\n                secretKeyRef: { name: pg-secret, key: url }\n      containers:\n        - name: api\n          image: ghcr.io/org/api:v1.2.0',
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Running a StatefulSet without a Headless Service',
    wrong: '# Using a ClusterIP Service instead of headless\nkind: Service\nspec:\n  clusterIP: 10.96.0.50   # virtual IP — hides individual pod addresses',
    right: '# Headless service — each pod gets its own DNS A record\nkind: Service\nspec:\n  clusterIP: None\n  # pod-0.myservice.ns.svc.cluster.local resolves directly to pod-0',
    explanation: 'StatefulSets require a Headless Service (clusterIP: None) to provide stable DNS names for each pod. Without it, the spec.serviceName field reference has no effect and pod-to-pod communication (e.g. database replication) cannot use stable hostnames. Always create the Headless Service before the StatefulSet.',
  },
  {
    title: 'Deleting a StatefulSet without cascading PVC deletion',
    wrong: '# Delete the StatefulSet — PVCs are NOT deleted automatically\nkubectl delete statefulset postgres\n# PVCs data-postgres-0, data-postgres-1, data-postgres-2 still exist\n# Leaving orphaned PVCs consuming storage and money',
    right: '# Explicitly delete PVCs after confirming data is backed up\nkubectl delete pvc -l app=postgres -n data\n# Or use helm uninstall which handles PVC lifecycle via chart hooks',
    explanation: 'Kubernetes intentionally retains PVCs when a StatefulSet is deleted to prevent accidental data loss. This means PVCs accumulate silently. After deleting a StatefulSet, check for and clean up orphaned PVCs unless you intend to reattach them to a new StatefulSet.',
  },
  {
    title: 'Using a Deployment instead of DaemonSet for node-level agents',
    wrong: '# Deployment with replicas matching node count\nkind: Deployment\nspec:\n  replicas: 10   # matches current node count, but breaks on scale-out',
    right: '# DaemonSet: automatically schedules on every node\nkind: DaemonSet\n# new nodes automatically get the log agent; removed nodes clean up',
    explanation: 'A Deployment with replicas set to node count breaks immediately when nodes are added or removed. DaemonSet handles node lifecycle automatically — it schedules a Pod on every new node and removes the Pod when a node is drained or deleted. Use DaemonSet for log agents, monitoring exporters, and CNI plugins.',
  },
  {
    title: 'Not setting a PodDisruptionBudget for stateful workloads',
    wrong: '# No PDB — kubectl drain can remove all replicas simultaneously\n# A cluster upgrade or node maintenance can take down your whole database',
    right: 'kind: PodDisruptionBudget\nspec:\n  minAvailable: 2   # always keep at least 2 of 3 replicas running\n  selector:\n    matchLabels:\n      app: postgres',
    explanation: 'Without a PDB, a cluster upgrade or kubectl drain can remove all StatefulSet pods simultaneously, causing a full outage. A PDB throttles voluntary disruptions — kubectl drain blocks if removing a node would violate the PDB. Essential for any production stateful workload.',
  },
  {
    title: 'Ignoring StatefulSet Pod ordering for databases',
    wrong: '# podManagementPolicy: Parallel — starts all pods simultaneously\n# pod-1 tries to replicate from pod-0 before pod-0 is Ready\npodManagementPolicy: Parallel',
    right: '# Default (OrderedReady) — starts pod-0, waits for Ready, then pod-1\n# Omit podManagementPolicy to use the safe default\n# Or set it explicitly: podManagementPolicy: OrderedReady',
    explanation: 'StatefulSet\'s default podManagementPolicy is OrderedReady — pod-1 only starts after pod-0 is Ready. Parallel mode starts all pods simultaneously, which breaks databases that need to replicate from an already-running primary. Only use Parallel when your application explicitly supports concurrent startup.',
  },
];

const challenge: Challenge = {
  title: 'StatefulSet Replica Namer',
  language: 'typescript',
  description: 'Write a function that generates the DNS hostnames for all replicas in a StatefulSet. Given a StatefulSet name, namespace, service name, and replica count, return an array of fully-qualified DNS names in the format: <statefulset>-<index>.<service>.<namespace>.svc.cluster.local',
  hints: [
    'Pods are named <statefulset>-0, <statefulset>-1, ..., <statefulset>-(N-1)',
    'The DNS pattern is: <pod-name>.<headless-service>.<namespace>.svc.cluster.local',
    'Use Array.from with a mapping function to generate the array',
    'Index goes from 0 to replicas-1',
  ],
  starterCode: 'function statefulSetDns(\n  statefulSetName: string,\n  namespace: string,\n  serviceName: string,\n  replicas: number\n): string[] {\n  // TODO: generate DNS hostnames\n  return [];\n}\n\n// Expected: statefulSetDns("postgres", "data", "postgres-headless", 3)\n// => [\n//   "postgres-0.postgres-headless.data.svc.cluster.local",\n//   "postgres-1.postgres-headless.data.svc.cluster.local",\n//   "postgres-2.postgres-headless.data.svc.cluster.local"\n// ]',
  solution: 'function statefulSetDns(\n  statefulSetName: string,\n  namespace: string,\n  serviceName: string,\n  replicas: number\n): string[] {\n  return Array.from({ length: replicas }, (_, i) =>\n    `${statefulSetName}-${i}.${serviceName}.${namespace}.svc.cluster.local`\n  );\n}\n\nconsole.log(statefulSetDns("postgres", "data", "postgres-headless", 3));\n// [\n//   "postgres-0.postgres-headless.data.svc.cluster.local",\n//   "postgres-1.postgres-headless.data.svc.cluster.local",\n//   "postgres-2.postgres-headless.data.svc.cluster.local"\n// ]',
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the key difference between a StatefulSet and a Deployment?',
    options: [
      'StatefulSets support more replicas than Deployments',
      'StatefulSet Pods have stable, predictable names and per-replica persistent storage; Deployment Pods are interchangeable',
      'Deployments cannot be scaled while StatefulSets can',
      'StatefulSets run on all nodes automatically like a DaemonSet',
    ],
    answer: 1,
    explanation: 'StatefulSet Pods have stable identities (pod-0, pod-1) and optional per-replica PVCs via volumeClaimTemplates. When pod-0 restarts, it gets the same name and the same PVC. Deployment Pods are stateless and interchangeable — a restarted pod gets a new random name and no persistent storage claim.',
  },
  {
    q: 'What is a Headless Service and why does a StatefulSet need one?',
    options: [
      'A service with no resource limits — used for performance testing',
      'A service with clusterIP: None — gives each StatefulSet pod its own DNS A record for peer discovery',
      'A service that routes traffic to the Pod with the lowest CPU usage',
      'A service without a selector — used for external endpoints',
    ],
    answer: 1,
    explanation: 'A Headless Service (clusterIP: None) does not create a virtual IP. Instead, it creates individual DNS A records for each pod: pod-0.svc.namespace.svc.cluster.local. StatefulSets reference this service via spec.serviceName so pods can address each other by stable hostname — essential for database replication and distributed systems.',
  },
  {
    q: 'When is a DaemonSet the correct workload type to use?',
    options: [
      'When you need exactly N replicas spread evenly across nodes',
      'When you need exactly one Pod per node — log agents, monitoring exporters, CNI plugins',
      'When you need Pods to start in a specific order',
      'When Pods need persistent storage with stable names',
    ],
    answer: 1,
    explanation: 'DaemonSet ensures exactly one Pod runs on every (selected) node. It automatically adds a Pod when new nodes join and removes the Pod when nodes leave. Perfect for node-level infrastructure: Fluentd/Promtail for logs, Prometheus node-exporter for metrics, Calico/Cilium CNI plugins, security scanners.',
  },
  {
    q: 'What does a PodDisruptionBudget with minAvailable: 2 enforce?',
    options: [
      'At least 2 Pods must be scheduled before the application starts serving traffic',
      'During voluntary disruptions (node drain, cluster upgrade), at least 2 replicas must remain Running',
      'The StatefulSet will always create exactly 2 more replicas than requested',
      'The HPA will not scale below 2 replicas under any conditions',
    ],
    answer: 1,
    explanation: 'PDB minAvailable: 2 tells Kubernetes: "during any voluntary disruption (node drain, Pod eviction, cluster upgrade), keep at least 2 replicas Running." If complying with the PDB would require leaving fewer than 2 replicas, the disruption is blocked until another replica becomes available.',
  },
  {
    q: 'What is the purpose of volumeClaimTemplates in a StatefulSet?',
    options: [
      'It creates a single shared PVC that all replicas mount simultaneously',
      'It creates one PVC per replica — each pod gets its own persistent volume that survives pod restarts',
      'It defines the storage class for the StatefulSet\'s config files',
      'It generates ConfigMaps from files on the node filesystem',
    ],
    answer: 1,
    explanation: 'volumeClaimTemplates creates a dedicated PVC for each replica: data-postgres-0, data-postgres-1, etc. When postgres-0 restarts (on the same or different node), it remounts its own PVC with the data intact. This is fundamentally different from a volume shared by all replicas — each pod owns its own data disk.',
  },
  { q: 'What is a headless service and why do StatefulSets require one?', options: ['A service with no selector that routes traffic through manual endpoint management', 'A service with clusterIP: None that returns pod IPs directly via DNS instead of a virtual IP', 'A deprecated service type that has been replaced by EndpointSlices in modern Kubernetes', 'A service used only for debugging purposes with no active port mappings'], answer: 1, explanation: 'A headless service with clusterIP: None does not create a virtual IP and does not load balance. DNS queries return the actual pod IPs directly. For StatefulSets each pod also gets a stable DNS record in the format pod-name.service.namespace.svc.cluster.local. This enables direct pod addressing needed for consensus protocols like Raft and Paxos, client-side load balancing, and peer discovery. Kafka, ZooKeeper, Cassandra, and Elasticsearch all require headless services for cluster formation.' },
];

const qna: QnaItem[] = [
  {
    q: 'How do init containers differ from regular containers in a Pod?',
    a: 'Init containers run sequentially before any app container starts, and each must complete successfully (exit 0) before the next begins. They share the Pod\'s volumes but not the network namespace. Common uses: run database migrations, wait for dependencies (nc -z service port), render config files, download secrets from a vault. If an init container fails, the Pod is restarted (CrashLoopBackOff) — app containers never start.',
  },
  {
    q: 'Can I use a StatefulSet for a stateless application to get stable pod names?',
    a: 'Technically yes, but it is an antipattern. StatefulSets have overhead: ordered rolling updates (slower than Deployment parallel updates), no automatic PVC cleanup, more complex scaling. Use a Deployment with pod affinity or topology spread constraints if you need controlled placement. Use a StatefulSet only when you genuinely need stable pod identity or per-replica persistent storage.',
  },
  {
    q: 'How does a StatefulSet rolling update work differently from a Deployment?',
    a: 'StatefulSet rolling update proceeds in reverse ordinal order: pod-N is updated first, then pod-(N-1), and so on down to pod-0. It waits for each pod to be Running and Ready before updating the next. The partition field lets you do a canary: set partition: 2 and only pods with ordinal >= 2 are updated — pods 0 and 1 keep the old version. This is ideal for safely upgrading database clusters.',
  },
  {
    q: 'Can a DaemonSet run on master/control-plane nodes?',
    a: 'Not by default — control-plane nodes have a NoSchedule taint (node-role.kubernetes.io/control-plane). Add a toleration in the DaemonSet spec to allow scheduling on tainted nodes. Infrastructure DaemonSets (CNI plugins, kube-proxy) need this; application DaemonSets typically should not run on control-plane nodes. Always validate the effect you are tolerating — NoSchedule vs NoExecute differ in how they handle running pods.',
  },
  {
    q: 'What happens to PVCs when I delete a StatefulSet?',
    a: 'PVCs created by volumeClaimTemplates are NOT deleted when the StatefulSet is deleted — Kubernetes keeps them to prevent accidental data loss. This is intentional. To clean up PVCs: kubectl delete pvc -l app=<name> -n <namespace> after you have confirmed the data is backed up or no longer needed. Alternatively, some Operators manage PVC lifecycle via finalizers and will delete PVCs as part of resource cleanup.',
  },
  { q: 'How does StatefulSet pod deletion and re-creation differ from a Deployment?', a: 'StatefulSet pods are re-created with the SAME name and ordinal such as web-0 and web-1, reattach to the SAME PersistentVolumeClaim, and keep the same stable DNS name across restarts. Deployment pods get a random name suffix, may bind any available PVC from a pool, and their DNS entries change with each restart. StatefulSet guarantees: ordered deployment where web-0 must be Running and Ready before web-1 starts, ordered termination in reverse order, and stable network identity across restarts. Deleting a StatefulSet does NOT delete its PVCs so manual cleanup is required to avoid accumulating storage costs.' },
];

const revision: RevisionSummary = {
  oneLiner: 'StatefulSet: stable pod names (pod-0..N), per-replica PVCs via volumeClaimTemplates, Headless Service for DNS. DaemonSet: one pod per node. PDB protects against voluntary disruptions.',
  mustKnow: [
    'StatefulSet gives pods stable identity (pod-0, pod-1) and stable storage per replica',
    'Headless Service (clusterIP: None) provides DNS: pod-0.svc.ns.svc.cluster.local',
    'volumeClaimTemplates creates one PVC per replica — PVCs survive pod restarts',
    'DaemonSet: exactly one pod per node — log agents, metrics, CNI plugins',
    'PDB minAvailable/maxUnavailable: blocks voluntary disruptions that violate the budget',
    'Init containers: run sequentially before app starts — migrations, wait-for-dependency',
  ],
  interviewFocus: [
    'When would you use a StatefulSet vs a Deployment? Give a real example.',
    'What is a Headless Service and why does a StatefulSet require one?',
    'What happens to PVCs when you delete a StatefulSet?',
    'How do you prevent a cluster upgrade from taking down a database StatefulSet?',
  ],
};

@Component({
  selector: 'app-k8s-statefulsets',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent,
    PageCompleteComponent,
  ],
  templateUrl: './statefulsets.html',
  styleUrl: './statefulsets.scss',
})
export class K8sStatefulsets {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
