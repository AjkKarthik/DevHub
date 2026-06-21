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
  { name: 'HPA', type: 'keyword', desc: 'HorizontalPodAutoscaler — scales replica count based on CPU/memory/custom metrics' },
  { name: 'targetCPUUtilizationPercentage', type: 'keyword', desc: 'Legacy v1 field: scale when avg CPU exceeds this % of requests' },
  { name: 'metrics: type: Resource', type: 'keyword', desc: 'v2 API: scale on CPU or memory as a % of requests or absolute value' },
  { name: 'metrics: type: External', type: 'keyword', desc: 'Scale on metrics from outside the cluster (queue length, request rate)' },
  { name: 'scaleDown.stabilizationWindowSeconds', type: 'keyword', desc: 'Cooldown window — prevents rapid scale-down after a traffic spike' },
  { name: 'VPA', type: 'keyword', desc: 'VerticalPodAutoscaler — adjusts CPU/memory requests/limits per pod' },
  { name: 'KEDA', type: 'keyword', desc: 'Kubernetes Event-Driven Autoscaling — scale on queues, Kafka, Prometheus, cron, etc.' },
  { name: 'metrics-server', type: 'keyword', desc: 'In-cluster component that provides CPU/memory metrics to HPA from kubelet' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'How HPA Works',
    points: [
      'HPA watches a Deployment (or StatefulSet) and adjusts its replica count to keep a metric at a target value.',
      'The control loop runs every 15 seconds (default) and queries metrics-server or a custom metrics adapter.',
      'Desired replicas = ceil(currentReplicas × (currentMetricValue / desiredMetricValue)).',
      'HPA respects minReplicas and maxReplicas — it will never scale below or above these bounds.',
      'CPU/memory metrics are measured as a percentage of each pod\'s resource requests — always set requests before using HPA.',
    ],
  },
  {
    heading: 'HPA v2 — Multiple Metrics',
    points: [
      'HPA v2 (autoscaling/v2) supports multiple metrics simultaneously — HPA scales to satisfy ALL of them.',
      'Resource metrics: CPU or memory as utilization % or absolute value.',
      'Pod metrics: average value of a metric across all pods (e.g. http_requests_per_second from Prometheus).',
      'External metrics: metrics from outside the cluster (AWS SQS queue depth, Pub/Sub backlog).',
      'Object metrics: metrics from a specific Kubernetes object (e.g. requests-per-second on an Ingress).',
    ],
  },
  {
    heading: 'Scale Behaviour and Cooldowns',
    points: [
      'Scale-up: fast by default — adds replicas quickly to handle traffic spikes.',
      'Scale-down: slow by default — stabilizationWindowSeconds (300s default) prevents rapid removal after a spike.',
      'behavior.scaleDown.policies lets you limit scale-down rate: e.g. remove at most 10% of pods per 60 seconds.',
      'behavior.scaleUp.policies: limit scale-up rate for workloads where rapid scaling is harmful.',
      'Tune the stabilization window: too long → pods idle and waste money; too short → thrashing on bursty traffic.',
    ],
  },
  {
    heading: 'KEDA and VPA',
    points: [
      'KEDA (Kubernetes Event-Driven Autoscaler) extends HPA with 60+ scalers: Kafka, RabbitMQ, AWS SQS, Redis, Prometheus, cron schedules.',
      'KEDA can scale to zero (0 replicas) when there is no work — ideal for event-driven batch processors.',
      'Standard HPA cannot scale to zero — minReplicas minimum is 1.',
      'VPA (VerticalPodAutoscaler) adjusts requests/limits vertically — useful for workloads with variable memory needs.',
      'VPA + HPA conflict on the same resource metric — use VPA on memory, HPA on CPU/custom metrics, or use KEDA for both.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'HPA v2 (CPU + memory)',
    language: 'bash',
    code: 'apiVersion: autoscaling/v2\nkind: HorizontalPodAutoscaler\nmetadata:\n  name: api-hpa\n  namespace: production\nspec:\n  scaleTargetRef:\n    apiVersion: apps/v1\n    kind: Deployment\n    name: api\n  minReplicas: 2\n  maxReplicas: 20\n  metrics:\n    - type: Resource\n      resource:\n        name: cpu\n        target:\n          type: Utilization\n          averageUtilization: 60    # scale when avg CPU > 60% of requests\n    - type: Resource\n      resource:\n        name: memory\n        target:\n          type: Utilization\n          averageUtilization: 80    # also scale on memory pressure\n  behavior:\n    scaleDown:\n      stabilizationWindowSeconds: 300   # wait 5 min before scaling down\n      policies:\n        - type: Percent\n          value: 10\n          periodSeconds: 60             # remove at most 10% per minute\n    scaleUp:\n      stabilizationWindowSeconds: 0    # scale up immediately\n      policies:\n        - type: Percent\n          value: 100\n          periodSeconds: 15             # can double replicas every 15s',
  },
  {
    label: 'KEDA (queue-based)',
    language: 'bash',
    code: '# KEDA ScaledObject: scale on AWS SQS queue depth\napiVersion: keda.sh/v1alpha1\nkind: ScaledObject\nmetadata:\n  name: worker-scaler\n  namespace: production\nspec:\n  scaleTargetRef:\n    apiVersion: apps/v1\n    kind: Deployment\n    name: order-processor\n  minReplicaCount: 0     # scale to zero when queue is empty\n  maxReplicaCount: 50\n  pollingInterval: 10    # check queue every 10 seconds\n  cooldownPeriod: 60     # wait 60s after queue drains before scaling to 0\n  triggers:\n    - type: aws-sqs-queue\n      metadata:\n        queueURL: https://sqs.us-east-1.amazonaws.com/123/orders\n        queueLength: "10"  # 1 replica per 10 messages\n        awsRegion: us-east-1\n      authenticationRef:\n        name: keda-aws-credentials\n---\n# KEDA cron scaler: pre-warm replicas before business hours\n  triggers:\n    - type: cron\n      metadata:\n        timezone: America/New_York\n        start: 0 8 * * 1-5    # Mon-Fri 8am: scale up\n        end: 0 20 * * 1-5     # Mon-Fri 8pm: scale down\n        desiredReplicas: "10"',
  },
  {
    label: 'kubectl HPA inspection',
    language: 'bash',
    code: '# Check HPA status and current metrics\nkubectl get hpa -n production\n# NAME      REFERENCE         TARGETS         MINPODS  MAXPODS  REPLICAS\n# api-hpa   Deployment/api    45%/60%, 70%/80%  2        20       4\n\n# Describe for events and conditions\nkubectl describe hpa api-hpa -n production\n# Conditions:\n#   AbleToScale: True — ScaleDownStabilized\n#   ScalingActive: True — ValidMetricFound\n#   ScalingLimited: False\n\n# Watch replicas change in real time\nkubectl get deployment api -n production -w\n\n# Check if metrics-server is installed\nkubectl top pods -n production\nkubectl top nodes\n\n# Install metrics-server (if missing)\nkubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml\n\n# Force immediate scale check (delete HPA and recreate, or patch)\nkubectl patch hpa api-hpa -n production -p \'{"spec":{"minReplicas":3}}\'',
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Using HPA without setting resource requests on pods',
    wrong: 'containers:\n  - name: api\n    image: myapp:v1\n    # no resources block\n# HPA reports "unknown" for CPU utilization — never scales',
    right: 'containers:\n  - name: api\n    image: myapp:v1\n    resources:\n      requests:\n        cpu: "250m"\n        memory: "256Mi"\n# HPA now has a baseline to calculate utilization %',
    explanation: 'HPA calculates CPU utilization as currentUsage / requests. Without requests set, the denominator is zero and HPA reports "unknown" for the metric — it will never trigger scaling. Always set resource requests before creating an HPA.',
  },
  {
    title: 'Setting targetCPUUtilizationPercentage too high (e.g. 90%)',
    wrong: '# Target 90% CPU utilization\ntargetCPUUtilizationPercentage: 90\n# By the time HPA adds replicas, pods are already saturated\n# New replicas take 30-60s to start — requests pile up',
    right: '# Target 60% — leaves headroom for traffic spikes\ntarget:\n  type: Utilization\n  averageUtilization: 60\n# HPA adds replicas while pods still have capacity',
    explanation: 'If the target utilization is too high (>80%), HPA only triggers when pods are already near capacity. New replicas take 30–60 seconds to start and pass health checks. During that window, pods are overloaded. Target 50–70% to maintain headroom for the scaling latency.',
  },
  {
    title: 'Not installing metrics-server before creating HPAs',
    wrong: '# HPA created but metrics-server not installed\nkubectl describe hpa api-hpa\n# Warning: FailedGetResourceMetric: unable to get metrics for resource cpu\n# Condition: ScalingActive: False — FailedGetScale',
    right: '# Install metrics-server first\nkubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml\n# Verify: kubectl top pods should return data before creating HPA',
    explanation: 'HPA requires metrics-server (or a compatible metrics adapter) to read CPU/memory usage. Many local clusters (kind, minikube) and some cloud clusters don\'t have it pre-installed. Without it, HPA shows "FailedGetResourceMetric" and never scales. Install and verify kubectl top pods works first.',
  },
  {
    title: 'Combining VPA and HPA on the same resource metric',
    wrong: '# VPA adjusting CPU requests\n# HPA scaling on CPU utilization\n# VPA raises requests → HPA sees lower utilization → scales down\n# VPA lowers requests → HPA sees higher utilization → scales up\n# Infinite feedback loop',
    right: '# Option 1: VPA in Off mode (recommendation only), HPA on CPU\n# Option 2: VPA manages memory; HPA scales on custom metrics (not CPU)\n# Option 3: Replace both with KEDA for event-driven workloads',
    explanation: 'VPA and HPA cannot both manage the same resource metric — they create a feedback loop. VPA raises CPU requests → HPA sees utilization drop → scales down; VPA lowers requests → HPA sees utilization spike → scales up. If you need both: use VPA for memory, HPA for custom/external metrics; or use KEDA which handles both dimensions.',
  },
  {
    title: 'Ignoring scale-down stabilization causing pod thrashing',
    wrong: '# Default or 0s stabilization window\nbehavior:\n  scaleDown:\n    stabilizationWindowSeconds: 0\n# After a traffic spike subsides: 20 → 10 → 4 → 10 → 6 → 10 replicas\n# Pods constantly starting and stopping (thrashing)',
    right: 'behavior:\n  scaleDown:\n    stabilizationWindowSeconds: 300   # 5-min window\n    policies:\n      - type: Percent\n        value: 20\n        periodSeconds: 60   # remove at most 20% per minute',
    explanation: 'Without a stabilization window, HPA aggressively removes replicas the moment metrics drop — then adds them back when the next request burst arrives. This pod thrashing wastes resources on repeated container startups and can cause user-visible latency. The default 300s window for scale-down is usually correct; only reduce it for cost-sensitive batch workloads.',
  },
];

const challenge: Challenge = {
  title: 'HPA Desired Replica Calculator',
  language: 'typescript',
  description: 'Implement the Kubernetes HPA replica calculation formula. Given currentReplicas, currentMetricValue (e.g. current average CPU utilization %), desiredMetricValue (target %), minReplicas, and maxReplicas, return the number of replicas HPA would set. Formula: desiredReplicas = ceil(currentReplicas × (currentMetricValue / desiredMetricValue)), clamped to [minReplicas, maxReplicas].',
  hints: [
    'Use Math.ceil for rounding up',
    'Calculate ratio = currentMetricValue / desiredMetricValue',
    'desiredReplicas = Math.ceil(currentReplicas * ratio)',
    'Clamp result between minReplicas and maxReplicas',
    'Return minReplicas if currentMetricValue is 0',
  ],
  starterCode: 'function hpaDesiredReplicas(\n  currentReplicas: number,\n  currentMetricValue: number,\n  desiredMetricValue: number,\n  minReplicas: number,\n  maxReplicas: number\n): number {\n  // TODO: implement HPA formula\n  return currentReplicas;\n}\n\n// Examples:\n// hpaDesiredReplicas(4, 80, 60, 2, 20) => 6  (80/60 * 4 = 5.33 → ceil → 6)\n// hpaDesiredReplicas(4, 30, 60, 2, 20) => 2  (30/60 * 4 = 2.0 → ceil → 2)\n// hpaDesiredReplicas(4, 120, 60, 2, 20) => 8 (120/60 * 4 = 8.0)',
  solution: 'function hpaDesiredReplicas(\n  currentReplicas: number,\n  currentMetricValue: number,\n  desiredMetricValue: number,\n  minReplicas: number,\n  maxReplicas: number\n): number {\n  if (currentMetricValue === 0) return minReplicas;\n  const desired = Math.ceil(currentReplicas * (currentMetricValue / desiredMetricValue));\n  return Math.max(minReplicas, Math.min(maxReplicas, desired));\n}\n\nconsole.log(hpaDesiredReplicas(4, 80, 60, 2, 20));  // 6\nconsole.log(hpaDesiredReplicas(4, 30, 60, 2, 20));  // 2\nconsole.log(hpaDesiredReplicas(4, 120, 60, 2, 20)); // 8\nconsole.log(hpaDesiredReplicas(2, 0, 60, 2, 20));   // 2 (already at min)',
};

const quiz: QuizQuestion[] = [
  {
    q: 'What prerequisite must be met before HPA can scale on CPU utilization?',
    options: [
      'The Deployment must have at least 3 replicas already running',
      'Resource requests must be set on containers, and metrics-server must be installed',
      'The HPA must be created before the Deployment it targets',
      'A custom metrics adapter must be installed for CPU metrics',
    ],
    answer: 1,
    explanation: 'HPA calculates CPU utilization as currentUsage/requests. Without resource requests, the denominator is zero and HPA reports "unknown" — it won\'t scale. metrics-server must also be installed to provide the usage data. Without either, HPA shows FailedGetResourceMetric and never triggers.',
  },
  {
    q: 'What is the HPA scale-down stabilization window and why does it exist?',
    options: [
      'A time delay before scale-up begins, to avoid reacting to brief traffic spikes',
      'A window during which HPA observes the maximum replica count needed, preventing rapid removal after a spike',
      'The time HPA waits for new pods to pass health checks before scaling further',
      'The interval between HPA control loop iterations (default 15 seconds)',
    ],
    answer: 1,
    explanation: 'The stabilization window (default 300s for scale-down) tells HPA: "look at all replica counts calculated in this window and use the maximum." This prevents rapid scale-down immediately after a traffic spike — if HPA sees you needed 20 replicas 2 minutes ago, it won\'t remove them all at once. Without it, pods thrash: scale up, scale down, scale up again.',
  },
  {
    q: 'What makes KEDA different from standard Kubernetes HPA?',
    options: [
      'KEDA replaces the kubelet and directly manages container processes',
      'KEDA extends HPA with 60+ event sources and can scale to zero replicas',
      'KEDA adjusts resource requests vertically instead of scaling replicas horizontally',
      'KEDA only works with Deployments, not StatefulSets',
    ],
    answer: 1,
    explanation: 'KEDA (Kubernetes Event-Driven Autoscaler) builds on top of HPA and adds scalers for external event sources: Kafka, RabbitMQ, AWS SQS, Redis, Prometheus, HTTP traffic, cron schedules, and 60+ more. Most importantly, KEDA can scale to zero replicas when there is no work — standard HPA minimum is 1. This makes KEDA ideal for batch processors and event-driven workloads.',
  },
  {
    q: 'Using the HPA formula: 4 current replicas, current CPU = 90%, target = 60%. What is the desired replica count?',
    options: ['5', '6', '7', '8'],
    answer: 1,
    explanation: 'desiredReplicas = ceil(currentReplicas × (currentValue / targetValue)) = ceil(4 × (90/60)) = ceil(4 × 1.5) = ceil(6.0) = 6. HPA would scale from 4 to 6 replicas. If the result exceeded maxReplicas, it would be clamped to maxReplicas.',
  },
  {
    q: 'Why should VPA and HPA not both target the same resource metric (e.g. both on CPU)?',
    options: [
      'Kubernetes only allows one autoscaler per Deployment',
      'They create a feedback loop: VPA changes requests → HPA sees different utilization % → scales replicas → VPA reacts again',
      'VPA requires minReplicas: 0 which conflicts with HPA\'s minimum of 1',
      'Both require metrics-server but they use different metric endpoint formats',
    ],
    answer: 1,
    explanation: 'VPA adjusts CPU requests; HPA calculates utilization as usage/requests. If VPA raises requests, HPA sees lower utilization and scales down. With fewer pods, VPA sees higher per-pod usage and raises requests again. This feedback loop causes continuous oscillation. The safe pattern: VPA manages memory; HPA manages custom/external metrics — or use KEDA which handles event-driven scaling without this conflict.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'How quickly does HPA respond to a traffic spike?',
    a: 'The HPA control loop runs every 15 seconds (--horizontal-pod-autoscaler-sync-period). After deciding to scale up, new pods take 30–60 seconds to start, pull images (if not cached), and pass readiness probes. Total latency from spike to serving: 45–90 seconds. Mitigate with: lower targetUtilization (more headroom), pre-warmed nodes (Cluster Autoscaler or node pool), cached images, fast startup times, KEDA with proactive cron scaling for predictable load.',
  },
  {
    q: 'Can HPA scale a StatefulSet?',
    a: 'Yes — HPA supports StatefulSet as a scaleTargetRef. However, scaling a StatefulSet adds/removes replicas in ordinal order (pod-N is added last, removed first). For stateful databases this usually means the primary (pod-0) is never removed. Scaling a database StatefulSet requires the application to handle replication setup and teardown automatically — most production databases use an Operator that manages this.',
  },
  {
    q: 'What is the Cluster Autoscaler and how does it relate to HPA?',
    a: 'HPA scales pods (replicas) within a node. Cluster Autoscaler (CA) scales nodes. They work together: HPA adds pods → if no node has capacity, pods enter Pending state → CA detects Pending pods and provisions a new node → pods schedule. Without CA, HPA is limited to current node capacity. With CA, you get end-to-end elastic scaling from 0 to the cloud provider\'s instance limits.',
  },
  {
    q: 'How do I scale on a custom Prometheus metric with HPA?',
    a: 'You need a custom metrics adapter such as prometheus-adapter. Install it and configure it to expose your Prometheus metric via the custom.metrics.k8s.io API. Then reference it in HPA with type: Pods or type: Object and the metric name. Example: scale when http_requests_per_second (average per pod) exceeds 100. Alternatively, use KEDA which has a built-in Prometheus scaler and requires no custom adapter.',
  },
  {
    q: 'What is the difference between HPA scale-up and scale-down behavior defaults?',
    a: 'Scale-up defaults to immediate and aggressive: stabilizationWindowSeconds: 0 (no delay), allows doubling replicas every 15 seconds. The goal is to respond to traffic spikes quickly. Scale-down defaults to conservative: stabilizationWindowSeconds: 300 (5 minutes), removes at most 100% of excess pods but only after the window passes. The goal is to avoid thrashing after a spike. You can tune both behaviors independently with spec.behavior.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'HPA scales replicas when avg metric % exceeds target: ceil(current × actual/target), clamped to min/max. Requires requests + metrics-server. KEDA adds 60+ scalers and scale-to-zero.',
  mustKnow: [
    'HPA formula: desiredReplicas = ceil(currentReplicas × currentValue/targetValue)',
    'Requires resource requests on all containers + metrics-server installed',
    'v2 API supports multiple metrics (CPU, memory, custom, external) — HPA satisfies ALL',
    'Scale-up: fast (0s window); scale-down: conservative (300s default stabilization)',
    'KEDA: scale to zero on queues/events; 60+ scalers via ScaledObject',
    'VPA + HPA same metric = feedback loop — use different metrics or KEDA',
  ],
  interviewFocus: [
    'Walk me through how HPA decides how many replicas to run.',
    'What prerequisites are needed for HPA CPU scaling to work?',
    'What is the stabilization window and why does scale-down need one?',
    'How does KEDA differ from standard HPA, and when would you choose it?',
  ],
};

@Component({
  selector: 'app-k8s-hpa',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent,
    PageCompleteComponent,
  ],
  templateUrl: './hpa.html',
  styleUrl: './hpa.scss',
})
export class K8sHpa {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
