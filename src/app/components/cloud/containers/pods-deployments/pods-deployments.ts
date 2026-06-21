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
  { name: 'Pod', type: 'class', desc: 'Smallest deployable unit — one or more containers sharing network/storage' },
  { name: 'ReplicaSet', type: 'class', desc: 'Ensures N copies of a Pod template are always running' },
  { name: 'Deployment', type: 'class', desc: 'Manages ReplicaSets for declarative rolling updates and rollbacks' },
  { name: 'RollingUpdate', type: 'keyword', desc: 'Replace old Pods gradually — maxSurge and maxUnavailable control pace' },
  { name: 'Recreate', type: 'keyword', desc: 'Kill all old Pods, then start new ones — causes downtime' },
  { name: 'readinessProbe', type: 'keyword', desc: 'Gate traffic — Pod only receives requests when probe passes' },
  { name: 'livenessProbe', type: 'keyword', desc: 'Restart trigger — kubelet kills and restarts container if probe fails' },
  { name: 'terminationGracePeriodSeconds', type: 'keyword', desc: 'Time kubelet waits after SIGTERM before sending SIGKILL (default 30s)' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Pods — The Atomic Unit',
    points: [
      'A Pod is one or more containers that share a network namespace (same IP) and storage volumes.',
      'Containers in the same Pod communicate via localhost — they co-locate on the same node.',
      'Pods are ephemeral — when a Pod is deleted, its IP and local storage are gone. Never rely on a Pod\'s IP.',
      'Init containers run to completion before app containers start — useful for migrations or config setup.',
      'Sidecar containers (logging, proxies) share the Pod lifecycle and see the same volumes and network.',
    ],
  },
  {
    heading: 'ReplicaSets and Deployments',
    points: [
      'ReplicaSet ensures exactly N copies of a Pod template run at all times — it replaces crashed Pods.',
      'Deployment wraps ReplicaSet and adds rolling update logic — it creates a new RS on image change.',
      'A rolling update creates the new RS, scales it up, and scales the old RS down simultaneously.',
      'Revision history is stored in ReplicaSets; kubectl rollout undo switches back to the previous RS.',
      'Never manage ReplicaSets directly — always use Deployments. RS is an implementation detail.',
    ],
  },
  {
    heading: 'Rolling Update Strategy',
    points: [
      'maxSurge: how many extra Pods above desired count can exist during the update (default 25%).',
      'maxUnavailable: how many Pods below desired can be unavailable during the update (default 25%).',
      'For zero-downtime: set maxUnavailable: 0 — old Pods stay up until new ones pass readinessProbe.',
      'minReadySeconds: seconds a new Pod must be ready before being counted as available (default 0).',
      'Recreate strategy: all old Pods killed first, then new ones started — useful when two versions can\'t coexist.',
    ],
  },
  {
    heading: 'Probes — Readiness and Liveness',
    points: [
      'readinessProbe: Pod receives no traffic from Services until this probe passes. Failing probe removes Pod from Endpoints.',
      'livenessProbe: kubelet restarts the container if this probe fails — use for deadlock detection.',
      'startupProbe: gives slow-starting containers time before liveness kicks in — prevents premature restarts.',
      'Probe types: httpGet (HTTP status 200-399), tcpSocket (port open), exec (command exit 0).',
      'Set initialDelaySeconds to give the container time to start before the first probe fires.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Deployment manifest',
    language: 'bash',
    code: 'apiVersion: apps/v1\n' +
      'kind: Deployment\n' +
      'metadata:\n' +
      '  name: api\n' +
      '  namespace: production\n' +
      'spec:\n' +
      '  replicas: 3\n' +
      '  selector:\n' +
      '    matchLabels:\n' +
      '      app: api\n' +
      '  strategy:\n' +
      '    type: RollingUpdate\n' +
      '    rollingUpdate:\n' +
      '      maxSurge: 1\n' +
      '      maxUnavailable: 0      # zero-downtime\n' +
      '  minReadySeconds: 10        # stay ready 10s before counted as available\n' +
      '  template:\n' +
      '    metadata:\n' +
      '      labels:\n' +
      '        app: api\n' +
      '    spec:\n' +
      '      terminationGracePeriodSeconds: 60\n' +
      '      containers:\n' +
      '        - name: api\n' +
      '          image: ghcr.io/org/api:v1.2.3\n' +
      '          ports:\n' +
      '            - containerPort: 3000\n' +
      '          readinessProbe:\n' +
      '            httpGet: { path: /health, port: 3000 }\n' +
      '            initialDelaySeconds: 5\n' +
      '            periodSeconds: 10\n' +
      '          livenessProbe:\n' +
      '            httpGet: { path: /health, port: 3000 }\n' +
      '            initialDelaySeconds: 15\n' +
      '            failureThreshold: 3\n' +
      '          resources:\n' +
      '            requests: { cpu: 100m, memory: 128Mi }\n' +
      '            limits:   { cpu: 500m, memory: 512Mi }',
  },
  {
    label: 'Init + sidecar pattern',
    language: 'bash',
    code: 'spec:\n' +
      '  initContainers:\n' +
      '    - name: db-migrate\n' +
      '      image: ghcr.io/org/api:v1.2.3\n' +
      '      command: ["node", "scripts/migrate.js"]\n' +
      '      env:\n' +
      '        - name: DATABASE_URL\n' +
      '          valueFrom:\n' +
      '            secretKeyRef: { name: db-secret, key: url }\n' +
      '\n' +
      '  containers:\n' +
      '    - name: api\n' +
      '      image: ghcr.io/org/api:v1.2.3\n' +
      '\n' +
      '    - name: log-shipper    # sidecar: shares volumes + network\n' +
      '      image: fluent/fluent-bit:2.2\n' +
      '      volumeMounts:\n' +
      '        - name: logs\n' +
      '          mountPath: /var/log/app\n' +
      '\n' +
      '  volumes:\n' +
      '    - name: logs\n' +
      '      emptyDir: {}         # ephemeral — cleared on Pod deletion',
  },
  {
    label: 'Rollout commands',
    language: 'bash',
    code: '# Trigger rolling update by changing the image\n' +
      'kubectl set image deployment/api api=ghcr.io/org/api:v1.3.0 -n production\n' +
      '\n' +
      '# Watch the rollout\n' +
      'kubectl rollout status deployment/api -n production\n' +
      '# Waiting for deployment "api" rollout to finish: 1 out of 3 new replicas updated...\n' +
      '\n' +
      '# View revision history\n' +
      'kubectl rollout history deployment/api -n production\n' +
      '# REVISION  CHANGE-CAUSE\n' +
      '# 1         kubectl apply --filename=deployment.yaml\n' +
      '# 2         kubectl set image ...\n' +
      '\n' +
      '# Roll back to previous revision\n' +
      'kubectl rollout undo deployment/api -n production\n' +
      '\n' +
      '# Roll back to a specific revision\n' +
      'kubectl rollout undo deployment/api --to-revision=1 -n production\n' +
      '\n' +
      '# Pause rollout mid-way (canary-style)\n' +
      'kubectl rollout pause deployment/api\n' +
      'kubectl rollout resume deployment/api',
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Not setting a readinessProbe — new Pods get traffic before ready',
    wrong: 'containers:\n  - name: api\n    image: ghcr.io/org/api:v1.3.0\n    # No readinessProbe — receives traffic immediately on start',
    right: 'readinessProbe:\n  httpGet: { path: /health, port: 3000 }\n  initialDelaySeconds: 5\n  periodSeconds: 10',
    explanation: 'Without a readinessProbe, Kubernetes adds the Pod to Service Endpoints as soon as it starts, before the app is ready to serve traffic. This causes connection errors during rolling updates. Always define a readinessProbe.',
  },
  {
    title: 'Using the same probe for readiness and liveness without thought',
    wrong: '# Same probe for both:\nreadinessProbe: { httpGet: /health }\nlivenessProbe: { httpGet: /health }   # if DB is slow, kills healthy containers',
    right: '# readinessProbe: app-level readiness (can it serve traffic?)\n# livenessProbe: is it stuck/deadlocked? Use a cheaper check\nlivenessProbe:\n  httpGet: { path: /livez, port: 3000 }   # returns 200 if process is alive',
    explanation: 'liveness and readiness serve different purposes. A liveness probe that checks an external DB will restart your container when the DB is slow — even though your app is healthy. Liveness should only check if the process itself is stuck or deadlocked.',
  },
  {
    title: 'Deploying Pods directly instead of using a Deployment',
    wrong: 'kind: Pod\nmetadata:\n  name: api\nspec:\n  containers:\n    - name: api\n      image: ghcr.io/org/api:v1.3.0',
    right: 'kind: Deployment\n# Deployment creates and manages ReplicaSets\n# Crashed Pods are replaced; rolling updates are handled automatically',
    explanation: 'A standalone Pod is not restarted if it crashes or if its node goes down. A Deployment (via ReplicaSet) ensures the desired number of replicas are always running and handles rolling updates and rollbacks.',
  },
  {
    title: 'Not setting resource requests — causes unpredictable scheduling',
    wrong: 'containers:\n  - name: api\n    image: ghcr.io/org/api:latest\n    # No resources: block',
    right: 'resources:\n  requests: { cpu: 100m, memory: 128Mi }\n  limits:   { cpu: 500m, memory: 512Mi }',
    explanation: 'Without requests, the scheduler has no signal for placement — it may pack too many containers on one node causing OOMKilled or CPU throttling. Requests also determine QoS class: set requests = limits for Guaranteed (highest priority) class.',
  },
  {
    title: 'maxUnavailable: 0 without maxSurge causes a stuck rollout',
    wrong: 'rollingUpdate:\n  maxSurge: 0\n  maxUnavailable: 0   # nothing can move — deadlock',
    right: 'rollingUpdate:\n  maxSurge: 1          # allow 1 extra Pod\n  maxUnavailable: 0    # keep all old Pods until new ones are ready',
    explanation: 'With both maxSurge and maxUnavailable set to 0, the rollout cannot proceed — it can\'t create new Pods (would exceed desired) and can\'t remove old ones (would go below desired). Set maxSurge >= 1 when maxUnavailable is 0.',
  },
];

const challenge: Challenge = {
  title: 'Deployment Health Checker',
  language: 'typescript',
  description: 'Write a function that takes a simplified Deployment status object and returns a health summary. Check: (1) are readyReplicas equal to desiredReplicas? (2) are there unavailableReplicas? (3) is the current generation equal to the observed generation? Return { healthy: boolean; issues: string[] }.',
  hints: [
    'Compare readyReplicas to replicas (desired count)',
    'Check unavailableReplicas > 0',
    'Compare generation to observedGeneration — if they differ, a rollout is in progress',
    'Check if updatedReplicas equals replicas — partial update means rollout ongoing',
    'Return healthy: true only when all checks pass',
  ],
  starterCode: 'interface DeploymentStatus {\n  replicas: number;\n  readyReplicas: number;\n  updatedReplicas: number;\n  availableReplicas: number;\n  unavailableReplicas?: number;\n  generation: number;\n  observedGeneration: number;\n}\n\ninterface HealthSummary { healthy: boolean; issues: string[]; }\n\nfunction checkDeployment(status: DeploymentStatus): HealthSummary {\n  const issues: string[] = [];\n  // TODO: check replica counts and generation\n  return { healthy: issues.length === 0, issues };\n}',
  solution: 'interface DeploymentStatus {\n  replicas: number;\n  readyReplicas: number;\n  updatedReplicas: number;\n  availableReplicas: number;\n  unavailableReplicas?: number;\n  generation: number;\n  observedGeneration: number;\n}\n\ninterface HealthSummary { healthy: boolean; issues: string[]; }\n\nfunction checkDeployment(status: DeploymentStatus): HealthSummary {\n  const issues: string[] = [];\n\n  if (status.generation !== status.observedGeneration) {\n    issues.push(`Rollout in progress: generation ${status.generation} not yet observed (at ${status.observedGeneration})`);\n  }\n\n  if (status.updatedReplicas < status.replicas) {\n    issues.push(`Rolling update incomplete: ${status.updatedReplicas}/${status.replicas} pods updated`);\n  }\n\n  if (status.readyReplicas < status.replicas) {\n    issues.push(`Only ${status.readyReplicas}/${status.replicas} replicas are ready`);\n  }\n\n  if ((status.unavailableReplicas ?? 0) > 0) {\n    issues.push(`${status.unavailableReplicas} replica(s) unavailable`);\n  }\n\n  return { healthy: issues.length === 0, issues };\n}',
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the relationship between a Deployment, ReplicaSet, and Pod?',
    options: [
      'Deployment = Pod; ReplicaSet is just metadata',
      'Deployment manages ReplicaSets, which manage Pods — Deployment adds rollout logic on top of RS',
      'ReplicaSet owns the Deployment and creates Pods on its behalf',
      'They are independent — you choose which one to use',
    ],
    answer: 1,
    explanation: 'Deployment is the top-level object. When you change a Deployment (e.g. update the image), it creates a new ReplicaSet with the new spec and gradually scales it up while scaling down the old RS. Pods are created by ReplicaSets. Never create ReplicaSets directly.',
  },
  {
    q: 'What does maxUnavailable: 0 in a rolling update strategy achieve?',
    options: [
      'The rollout completes instantly with no waiting',
      'Zero old Pods are removed until new Pods pass readinessProbe — zero-downtime update',
      'The rollout is paused until manually resumed',
      'All Pods are killed before any new ones start (Recreate behaviour)',
    ],
    answer: 1,
    explanation: 'maxUnavailable: 0 means no Pod can be taken down until a replacement is ready. Combined with maxSurge: 1 (or more), new Pods are created first, must pass readinessProbe, and only then are old Pods removed. This guarantees zero-downtime rolling updates.',
  },
  {
    q: 'What is the purpose of a readinessProbe?',
    options: [
      'Restart the container if the app crashes',
      'Gate traffic — the Pod only receives Service requests when the probe passes',
      'Ensure the container image was pulled successfully',
      'Monitor memory usage and alert when limits are exceeded',
    ],
    answer: 1,
    explanation: 'readinessProbe controls whether a Pod is added to Service Endpoints. If the probe fails, the Pod is removed from the load balancer until it recovers. This prevents traffic from reaching Pods that are still initialising or temporarily unhealthy.',
  },
  {
    q: 'What happens to a standalone Pod (kind: Pod) if its node goes down?',
    options: [
      'Kubernetes automatically reschedules it on another node',
      'The Pod remains associated with the failed node and is never replaced',
      'The control plane creates a new Pod on a healthy node within 30 seconds',
      'The Pod is marked Evicted and a new one is scheduled by the kubelet',
    ],
    answer: 1,
    explanation: 'Standalone Pods have no controller managing them — if the node fails, the Pod is marked Failed and never replaced. Use Deployments (or StatefulSets/DaemonSets) so a controller watches and replaces Pods when nodes fail.',
  },
  {
    q: 'What does an init container do?',
    options: [
      'Runs alongside the main container and shares its network',
      'Initialises the node before any Pods are scheduled',
      'Runs to completion before app containers start — used for setup tasks like migrations',
      'Monitors the container and restarts it if unhealthy',
    ],
    answer: 2,
    explanation: 'Init containers run sequentially before the app containers start. They must exit with code 0 — if any fail, Kubernetes restarts them until they succeed. Common uses: run DB migrations, wait for a dependency to be ready, or pre-populate a shared volume.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between a liveness probe and a readiness probe?',
    a: 'readinessProbe controls traffic: a failing readiness probe removes the Pod from Service Endpoints (no new requests). livenessProbe controls restarts: a failing liveness probe causes kubelet to kill and restart the container. Use readiness for "not ready yet" (slow startup, temporary overload); use liveness for "stuck/deadlocked" (process frozen, infinite loop).',
  },
  {
    q: 'How many containers can a Pod have, and why would you use more than one?',
    a: 'A Pod can have multiple containers. The most common pattern is one main container plus one or more sidecars — containers that enhance the main app (log shippers like Fluent Bit, Envoy sidecar proxies in service mesh, Vault agent for secret injection). Sidecars share the Pod\'s network (localhost) and volumes but have independent lifecycles.',
  },
  {
    q: 'What is an emptyDir volume and when is it appropriate?',
    a: 'emptyDir is an ephemeral volume created when a Pod is assigned to a node and deleted when the Pod is removed. It is shared between containers in the same Pod. Use it for temporary files, build caches, or communication between a main container and a sidecar. Never use it for data you need to persist across Pod restarts.',
  },
  {
    q: 'What is the CHANGE-CAUSE in kubectl rollout history?',
    a: 'CHANGE-CAUSE is a human-readable annotation (kubernetes.io/change-cause) you can set when applying changes: kubectl annotate deployment/api kubernetes.io/change-cause="bump to v1.3.0". Without it, the history just shows "none". Set it in your CI/CD pipeline for meaningful rollout history.',
  },
  {
    q: 'Why should terminationGracePeriodSeconds be set carefully?',
    a: 'When a Pod is deleted, Kubernetes sends SIGTERM to the container and waits terminationGracePeriodSeconds (default 30s) for it to shut down gracefully. If it does not exit, SIGKILL is sent. For apps that need to finish in-flight requests or flush data, increase this value. For fast-starting workers, decrease it to speed up rolling updates.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'Deployment → ReplicaSet → Pods: use Deployments for rolling updates and rollbacks; always define readiness + liveness probes and resource requests.',
  mustKnow: [
    'Pod: shares network/storage between containers; ephemeral — never rely on its IP',
    'ReplicaSet ensures N replicas; Deployment adds rolling update + rollback logic on top',
    'maxSurge/maxUnavailable control rollout pace; maxUnavailable: 0 = zero-downtime',
    'readinessProbe gates traffic; livenessProbe triggers restart — different purposes!',
    'Init containers run to completion before app containers start',
    'Resource requests required for scheduler placement and QoS class assignment',
  ],
  interviewFocus: [
    'How does a Deployment ensure zero-downtime rolling updates?',
    'What is the difference between readiness and liveness probes?',
    'Why should you never deploy standalone Pods in production?',
    'Walk through what happens when you run kubectl set image deployment/api ...',
  ],
};

@Component({
  selector: 'app-k8s-pods-deployments',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent,
    PageCompleteComponent,
  ],
  templateUrl: './pods-deployments.html',
  styleUrl: './pods-deployments.scss',
})
export class K8sPodsDeployments {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
