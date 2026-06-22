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
  { name: 'requests.cpu', type: 'keyword', desc: 'CPU reserved for scheduling — the scheduler uses this, not limits' },
  { name: 'requests.memory', type: 'keyword', desc: 'Memory reserved; scheduler places pod on nodes with enough free' },
  { name: 'limits.cpu', type: 'keyword', desc: 'Hard CPU cap — process is throttled (not killed) when exceeded' },
  { name: 'limits.memory', type: 'keyword', desc: 'Hard memory cap — container is OOMKilled when exceeded' },
  { name: 'QoS: Guaranteed', type: 'keyword', desc: 'requests == limits for all containers — highest eviction priority' },
  { name: 'QoS: Burstable', type: 'keyword', desc: 'requests < limits, or only one set — middle eviction priority' },
  { name: 'QoS: BestEffort', type: 'keyword', desc: 'No requests or limits at all — evicted first under node pressure' },
  { name: 'LimitRange', type: 'keyword', desc: 'Sets default requests/limits per namespace — applied to pods without explicit values' },
  { name: 'ResourceQuota', type: 'keyword', desc: 'Caps total CPU/memory/object count per namespace' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Requests vs Limits',
    points: [
      'requests: the amount the scheduler reserves when placing the pod — the node must have at least this much free.',
      'limits: the hard cap enforced at runtime by the Linux cgroup — the container cannot exceed this.',
      'CPU limit: exceeded CPU is throttled (CFS scheduler) — the process slows down but is never killed.',
      'Memory limit: exceeded memory causes the container to be OOMKilled (killed by the OS Out-of-Memory killer) — the pod restarts.',
      'Setting requests too low → pods land on overloaded nodes (noisy neighbour). Too high → wasted capacity and scheduling failures.',
    ],
  },
  {
    heading: 'Quality of Service Classes',
    points: [
      'Kubernetes assigns every pod a QoS class based on its resource configuration.',
      'Guaranteed: every container has requests == limits for both CPU and memory. Evicted last.',
      'Burstable: at least one container has requests or limits set, but not Guaranteed. Evicted second.',
      'BestEffort: no container has any requests or limits. Evicted first under memory pressure.',
      'QoS class determines eviction order when a node is under memory pressure — always set both requests and limits for production workloads.',
    ],
  },
  {
    heading: 'LimitRange and ResourceQuota',
    points: [
      'LimitRange: applied to a namespace — sets default requests/limits for pods that don\'t specify them, and enforces min/max bounds.',
      'Without a LimitRange, a pod with no requests/limits is BestEffort and can consume unlimited node resources.',
      'ResourceQuota: caps total resource consumption in a namespace — total CPU requests, memory requests, number of pods, PVCs, etc.',
      'Combine LimitRange + ResourceQuota: LimitRange ensures every pod has sane defaults; ResourceQuota prevents namespace-level exhaustion.',
      'kubectl describe namespace <ns> shows current quota usage vs limits.',
    ],
  },
  {
    heading: 'Sizing Requests and Limits Correctly',
    points: [
      'Start with Prometheus/VPA recommendations: observe actual usage over 7+ days before setting production values.',
      'Vertical Pod Autoscaler (VPA) in recommendation mode gives per-container suggestions based on historic usage.',
      'Set memory requests == memory limits (Guaranteed QoS) for stateful and latency-sensitive workloads.',
      'For CPU: set requests to p50 usage, limits to 2-4× p99 usage — CPU throttling is better than OOMKill.',
      'Use metrics-server (kubectl top pods) for current usage; Prometheus + Grafana for historical trends.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Requests & Limits',
    language: 'bash',
    code: 'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: api\nspec:\n  template:\n    spec:\n      containers:\n        - name: api\n          image: ghcr.io/org/api:v1\n          resources:\n            requests:\n              cpu: "250m"       # 0.25 vCPU reserved for scheduling\n              memory: "256Mi"   # 256 MiB reserved\n            limits:\n              cpu: "1000m"      # 1 vCPU hard cap (throttled if exceeded)\n              memory: "512Mi"   # 512 MiB hard cap (OOMKilled if exceeded)\n\n# CPU units:\n#   1000m = 1 vCPU, 250m = 0.25 vCPU, 100m = 0.1 vCPU\n# Memory units:\n#   Ki = kibibytes, Mi = mebibytes, Gi = gibibytes\n#   128Mi = 134,217,728 bytes (NOT 128,000,000)\n\n# Check current usage:\n# kubectl top pods -n <namespace>\n# kubectl top nodes',
  },
  {
    label: 'LimitRange',
    language: 'bash',
    code: '# LimitRange: set defaults for any pod in this namespace that omits resources\napiVersion: v1\nkind: LimitRange\nmetadata:\n  name: default-limits\n  namespace: production\nspec:\n  limits:\n    - type: Container\n      default:            # applied if container has no limits\n        cpu: "500m"\n        memory: "256Mi"\n      defaultRequest:     # applied if container has no requests\n        cpu: "100m"\n        memory: "128Mi"\n      max:                # no container may exceed these\n        cpu: "4"\n        memory: "4Gi"\n      min:                # no container may go below these\n        cpu: "50m"\n        memory: "64Mi"',
  },
  {
    label: 'ResourceQuota',
    language: 'bash',
    code: '# ResourceQuota: cap total namespace consumption\napiVersion: v1\nkind: ResourceQuota\nmetadata:\n  name: production-quota\n  namespace: production\nspec:\n  hard:\n    requests.cpu: "20"          # total CPU requests across all pods\n    requests.memory: "40Gi"     # total memory requests\n    limits.cpu: "40"\n    limits.memory: "80Gi"\n    pods: "100"                 # max 100 pods in this namespace\n    persistentvolumeclaims: "20"\n    services: "10"\n    secrets: "50"\n    configmaps: "50"\n\n# Check quota usage:\n# kubectl describe resourcequota production-quota -n production\n# kubectl describe namespace production',
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Setting no resource requests or limits (BestEffort)',
    wrong: 'containers:\n  - name: api\n    image: myapp:v1\n    # no resources block — BestEffort QoS class',
    right: 'containers:\n  - name: api\n    image: myapp:v1\n    resources:\n      requests: { cpu: "100m", memory: "128Mi" }\n      limits:   { cpu: "500m", memory: "256Mi" }',
    explanation: 'Pods with no resource requests are BestEffort class and are the first to be evicted when a node runs out of memory. They can also consume unbounded CPU and memory, starving other workloads. Always set both requests and limits for production pods.',
  },
  {
    title: 'Setting requests much higher than actual usage (over-provisioning)',
    wrong: 'resources:\n  requests:\n    cpu: "4"       # app uses 200m on average\n    memory: "8Gi"  # app uses 500Mi on average',
    right: 'resources:\n  requests:\n    cpu: "300m"     # slightly above p95 usage\n    memory: "600Mi" # slightly above p95 usage\n  limits:\n    cpu: "1"\n    memory: "1Gi"',
    explanation: 'Over-provisioned requests waste node capacity — the scheduler reserves resources that are never used. This leads to "Pending" pods even though nodes have free capacity, and higher cloud costs. Use kubectl top pods + VPA recommendations to right-size requests to actual usage plus a safety margin.',
  },
  {
    title: 'Treating CPU limit exceeded as a crash (OOMKill confusion)',
    wrong: '# Assuming the pod crashed because of CPU issues\n# Setting cpu limits very high "to be safe"\nlimits:\n  cpu: "16"   # unnecessary; wastes node capacity',
    right: '# CPU is throttled, not killed. Check for throttling:\n# kubectl top pods shows actual CPU\n# CPU throttling shows in container metrics: container_cpu_cfs_throttled_seconds_total\n# Memory is killed: watch for OOMKilled in kubectl describe pod',
    explanation: 'CPU and memory behave differently when limits are exceeded. CPU limit exceeded → process is throttled (slows down, not killed). Memory limit exceeded → container is OOMKilled and restarted. OOMKilled appears in kubectl describe pod as "OOMKilled" in the last state. CPU throttling causes latency spikes but no restart.',
  },
  {
    title: 'Not having a LimitRange in namespaces used by multiple teams',
    wrong: '# No LimitRange — any developer can deploy a pod with no limits\n# One team\'s misconfigured pod can exhaust the entire node\'s memory',
    right: '# Apply a LimitRange to every namespace:\nkind: LimitRange\nspec:\n  limits:\n    - type: Container\n      default: { cpu: "500m", memory: "256Mi" }\n      defaultRequest: { cpu: "100m", memory: "128Mi" }',
    explanation: 'Without a LimitRange, pods deployed without a resources block get BestEffort QoS and can consume unlimited node resources. In multi-tenant clusters, this means one team\'s unbounded pod can starve other workloads. LimitRange ensures every pod has sane defaults without requiring developers to always specify resources.',
  },
  {
    title: 'Setting memory requests != limits, causing noisy neighbour OOMKills',
    wrong: 'resources:\n  requests:\n    memory: "128Mi"  # scheduler places on node with 128Mi free\n  limits:\n    memory: "2Gi"   # but can actually consume 2Gi — 15x overcommit',
    right: '# For latency-sensitive or stateful workloads: set equal (Guaranteed QoS)\nresources:\n  requests: { memory: "512Mi" }\n  limits:   { memory: "512Mi" }  # requests == limits = Guaranteed',
    explanation: 'When memory requests are much lower than limits, the scheduler places many pods on a node assuming low usage. If they all burst simultaneously, the node runs out of memory and OOMKills start cascading. For critical workloads, set requests == limits (Guaranteed QoS) to prevent this overcommit scenario.',
  },
];

const challenge: Challenge = {
  title: 'QoS Class Classifier',
  language: 'typescript',
  description: 'Write a function that determines the Kubernetes QoS class for a pod given its container resource configurations. Rules: Guaranteed = every container has requests == limits for both cpu and memory. BestEffort = no container has any requests or limits. Otherwise = Burstable. Return "Guaranteed", "Burstable", or "BestEffort".',
  hints: [
    'Check if ALL containers have zero resources → BestEffort',
    'For Guaranteed: every container must have cpu requests == limits AND memory requests == limits',
    'If any container is missing either requests or limits, it cannot be Guaranteed',
    'Any case that is not Guaranteed or BestEffort is Burstable',
  ],
  starterCode: 'interface ResourceSpec { cpu?: string; memory?: string; }\ninterface ContainerResources {\n  requests?: ResourceSpec;\n  limits?: ResourceSpec;\n}\n\ntype QosClass = "Guaranteed" | "Burstable" | "BestEffort";\n\nfunction getQosClass(containers: ContainerResources[]): QosClass {\n  // TODO: determine QoS class\n  return "BestEffort";\n}',
  solution: 'interface ResourceSpec { cpu?: string; memory?: string; }\ninterface ContainerResources {\n  requests?: ResourceSpec;\n  limits?: ResourceSpec;\n}\n\ntype QosClass = "Guaranteed" | "Burstable" | "BestEffort";\n\nfunction getQosClass(containers: ContainerResources[]): QosClass {\n  const hasAny = containers.some(c =>\n    c.requests?.cpu || c.requests?.memory || c.limits?.cpu || c.limits?.memory\n  );\n\n  if (!hasAny) return "BestEffort";\n\n  const allGuaranteed = containers.every(c => {\n    const cpuMatch = c.requests?.cpu && c.limits?.cpu && c.requests.cpu === c.limits.cpu;\n    const memMatch = c.requests?.memory && c.limits?.memory && c.requests.memory === c.limits.memory;\n    return cpuMatch && memMatch;\n  });\n\n  return allGuaranteed ? "Guaranteed" : "Burstable";\n}\n\n// Tests:\nconsole.log(getQosClass([{ requests: { cpu: "100m", memory: "128Mi" }, limits: { cpu: "100m", memory: "128Mi" } }]));\n// "Guaranteed"\nconsole.log(getQosClass([{ requests: { cpu: "100m" }, limits: { cpu: "500m" } }]));\n// "Burstable"\nconsole.log(getQosClass([{}]));\n// "BestEffort"',
};

const quiz: QuizQuestion[] = [
  {
    q: 'What happens when a container exceeds its memory limit in Kubernetes?',
    options: [
      'The container is throttled and slows down until usage drops below the limit',
      'The container is OOMKilled by the OS and the pod restarts',
      'The pod is evicted from the node and rescheduled on a node with more memory',
      'The namespace ResourceQuota is decremented to reflect the excess usage',
    ],
    answer: 1,
    explanation: 'When a container exceeds its memory limit, the Linux OOM killer terminates the container process (OOMKill). Kubernetes then restarts the container according to the pod\'s restartPolicy (usually Always). This appears in kubectl describe pod as "OOMKilled" in the Last State. CPU overuse causes throttling (slowdown), not killing.',
  },
  {
    q: 'What QoS class is assigned to a pod where every container has requests == limits for both CPU and memory?',
    options: [
      'BestEffort — because requests equal limits, providing no burst headroom',
      'Guaranteed — the highest QoS class; these pods are evicted last',
      'Burstable — because the pod can burst up to its limits',
      'Priority — a separate QoS class for pods with PriorityClass set',
    ],
    answer: 1,
    explanation: 'Guaranteed QoS requires every container to have identical requests and limits for both cpu and memory. These pods are treated preferentially by the kubelet — they are the last to be evicted under node memory pressure, making Guaranteed the safest QoS class for latency-sensitive or stateful workloads.',
  },
  {
    q: 'What does the CPU unit "250m" mean in a Kubernetes resource specification?',
    options: [
      '250 megabytes of CPU cache',
      '250 millicores, which is 0.25 vCPU (25% of one CPU core)',
      '250 microseconds of CPU time per second',
      '250 MHz of CPU frequency',
    ],
    answer: 1,
    explanation: '"m" in CPU resources means millicores. 1000m = 1 vCPU. 250m = 0.25 vCPU = 25% of one CPU core. CPU is a compressible resource — exceeding the limit throttles the process but does not kill it. Memory is not compressible — exceeding the limit causes OOMKill.',
  },
  {
    q: 'What is the difference between a LimitRange and a ResourceQuota?',
    options: [
      'LimitRange caps per-pod resources; ResourceQuota caps per-container resources',
      'LimitRange sets defaults and bounds per container; ResourceQuota caps total namespace consumption',
      'LimitRange applies to StatefulSets only; ResourceQuota applies to Deployments only',
      'They are aliases for the same Kubernetes object',
    ],
    answer: 1,
    explanation: 'LimitRange operates at the container level within a namespace — it sets default requests/limits for pods that omit them and enforces min/max bounds. ResourceQuota operates at the namespace level — it caps the total sum of all resource requests and limits (and object counts) across the entire namespace.',
  },
  {
    q: 'Why is setting requests too low (below actual usage) dangerous?',
    options: [
      'Pods with low requests receive Guaranteed QoS and are never evicted',
      'The scheduler places too many pods on a node; actual usage exceeds node capacity, causing OOMKills',
      'Low requests trigger automatic HPA scale-down, reducing available replicas',
      'The container runtime ignores limits when requests are set below 100m',
    ],
    answer: 1,
    explanation: 'The scheduler uses requests (not limits) to decide node placement. If requests are set too low, the scheduler overcommits the node — placing 10 pods that each request 100m CPU but actually use 500m each. When they all run at actual usage, the node is overloaded, causing CPU throttling and potentially memory OOMKills across all pods.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'How do I find out what resource requests and limits to set?',
    a: 'Start with kubectl top pods (requires metrics-server) to see current CPU/memory usage. For historical data, query Prometheus: container_cpu_usage_seconds_total and container_memory_working_set_bytes. Set requests at p50 usage + 20% buffer; set limits at p99 usage × 2. The Vertical Pod Autoscaler (VPA) in recommendation mode automates this — run it in Recommend mode and read kubectl describe vpa <name> for per-container suggestions without actually modifying pods.',
  },
  {
    q: 'What is CPU throttling and how do I detect it?',
    a: 'CPU throttling happens when a container uses more CPU than its limit. The Linux CFS scheduler pauses the process to enforce the limit. It does not kill the container, but causes latency spikes and slow response times. Detect with Prometheus: container_cpu_cfs_throttled_seconds_total / container_cpu_cfs_periods_total > 0.25 (25% throttle rate) is a common alert threshold. If throttling is high, increase the CPU limit or optimize the application.',
  },
  {
    q: 'What happens when a namespace exceeds its ResourceQuota?',
    a: 'Kubernetes rejects new resource creation (Pod, Deployment, PVC, etc.) with a "forbidden: exceeded quota" error. Existing resources are not affected — only new creations and updates that would exceed the quota are blocked. This is why ResourceQuota is paired with LimitRange: LimitRange ensures every pod has requests/limits, without which ResourceQuota counts every pod as having zero requests and cannot track consumption accurately.',
  },
  {
    q: 'Should I always set requests == limits (Guaranteed QoS)?',
    a: 'For stateful workloads (databases) and latency-critical services: yes — Guaranteed QoS prevents eviction and avoids noisy neighbour memory contention. For batch jobs and background workers: Burstable is fine — let them burst to use spare node capacity. BestEffort should be avoided in production. The tradeoff: Guaranteed wastes capacity if actual usage is lower than reserved; Burstable is more efficient but risks eviction under pressure.',
  },
  {
    q: 'What is the Vertical Pod Autoscaler (VPA) and how does it differ from HPA?',
    a: 'HPA scales the number of pod replicas based on metrics (CPU, memory, custom). VPA adjusts the requests and limits of existing pods based on observed usage — it right-sizes pods vertically. VPA cannot run concurrently with HPA on the same metric (both would fight each other). Common pattern: use VPA in Recommend mode to gather sizing data, then manually apply the recommendations as static requests/limits, and use HPA for replica scaling.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'requests = scheduler reservation; limits = runtime hard cap. CPU over-limit → throttle. Memory over-limit → OOMKill. QoS: Guaranteed (req==limit) > Burstable > BestEffort.',
  mustKnow: [
    'requests: what the scheduler reserves; limits: the runtime cap (enforced by cgroups)',
    'CPU exceeded → throttled (never killed); memory exceeded → OOMKilled + restart',
    'QoS: Guaranteed (all req==limits) evicted last; BestEffort (no requests) evicted first',
    'LimitRange: sets per-container defaults/min/max in a namespace',
    'ResourceQuota: caps total namespace CPU, memory, pod count, etc.',
    'Right-size with kubectl top pods, Prometheus, or VPA in Recommend mode',
  ],
  interviewFocus: [
    'What is the difference between resource requests and limits in Kubernetes?',
    'What happens when a container exceeds its CPU limit vs its memory limit?',
    'What are the three QoS classes and how are they determined?',
    'What is the difference between LimitRange and ResourceQuota?',
  ],
};

@Component({
  selector: 'app-k8s-resource-limits',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent,
    PageCompleteComponent,
  ],
  templateUrl: './resource-limits.html',
  styleUrl: './resource-limits.scss',
})
export class K8sResourceLimits {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
