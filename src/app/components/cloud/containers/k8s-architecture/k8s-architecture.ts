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
  { name: 'kube-apiserver', type: 'keyword', desc: 'Single entry point — all kubectl commands hit this REST API' },
  { name: 'etcd', type: 'keyword', desc: 'Distributed key-value store — the only stateful component of the control plane' },
  { name: 'kube-scheduler', type: 'keyword', desc: 'Assigns pending Pods to nodes based on resource requests and constraints' },
  { name: 'kube-controller-manager', type: 'keyword', desc: 'Runs reconciliation controllers (Deployment, ReplicaSet, Node, etc.)' },
  { name: 'kubelet', type: 'keyword', desc: 'Node agent — ensures containers described by PodSpecs are running' },
  { name: 'kube-proxy', type: 'keyword', desc: 'Implements Service networking on each node via iptables/IPVS rules' },
  { name: 'CNI plugin', type: 'keyword', desc: 'Container Network Interface — provides pod networking (Calico, Cilium, Flannel)' },
  { name: 'Reconciliation loop', type: 'keyword', desc: 'Observe desired state → compare with actual → act to close the gap' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Control Plane Components',
    points: [
      'kube-apiserver: RESTful API gateway — all kubectl commands, controller watches, and kubelet registration go through it.',
      'etcd: distributed, consistent key-value store that holds ALL cluster state. Only kube-apiserver writes to etcd directly.',
      'kube-scheduler: watches for unscheduled Pods and assigns them to nodes by filtering (feasibility) then scoring (preference).',
      'kube-controller-manager: runs many reconciliation controllers as goroutines — Deployment, ReplicaSet, Node, Endpoint, etc.',
      'cloud-controller-manager: optional, cloud-specific controllers for LoadBalancer services, node lifecycle, and storage.',
    ],
  },
  {
    heading: 'Worker Node Components',
    points: [
      'kubelet: node agent — reads PodSpecs from the API server and ensures containers are running and healthy via the CRI.',
      'kube-proxy: programs iptables/IPVS rules on each node to implement Service virtual IPs and load balancing.',
      'Container runtime: implements CRI (Container Runtime Interface) — containerd (default) or CRI-O.',
      'CNI plugin: provides pod-to-pod networking across nodes — Calico, Cilium, Flannel are common choices.',
      'Each node registers itself with kube-apiserver; the Node controller in kube-controller-manager monitors heartbeats.',
    ],
  },
  {
    heading: 'The Reconciliation Loop',
    points: [
      'Every Kubernetes controller runs the same loop: Get current state → Compute diff vs desired state → Act to close gap → Requeue.',
      'Desired state is declared in manifests (Deployments, Services) stored in etcd via kube-apiserver.',
      'Actual state is what controllers observe from the cluster — running pods, endpoint IPs, node conditions.',
      'Controllers use watch (not polling) — the API server streams events to controllers when resources change.',
      'This declarative model means you describe WHAT you want, not HOW to achieve it — K8s figures out the steps.',
    ],
  },
  {
    heading: 'How a Pod Gets Scheduled',
    points: [
      '1. You apply a Deployment manifest → kube-apiserver stores it in etcd.',
      '2. Deployment controller notices: desired 3 replicas, actual 0 → creates 3 ReplicaSets → creates 3 Pods with nodeName unset.',
      '3. Scheduler watches for Pods with no nodeName → filters nodes (resource fit, taints) → scores → sets nodeName in etcd.',
      '4. kubelet on the chosen node watches for Pods assigned to itself → pulls image → starts container via containerd.',
      '5. kubelet reports pod status back to kube-apiserver → controllers update their state accordingly.',
    ],
  },
  {
    heading: 'Control Plane vs. Data Plane Responsibilities',
    points: [
      'The control plane (API server, etcd, scheduler, controller manager) makes decisions about desired cluster state and stores that state — it does NOT run application workloads itself, keeping cluster management logically separate from the workloads it manages.',
      'The data plane (worker nodes running kubelet, kube-proxy, and the container runtime) is where actual application pods run — a control plane outage does not immediately stop already-running pods, since kubelet continues managing existing pods independently for a period.',
      'etcd is the single source of truth for all cluster state — losing etcd data (without backups) means losing the cluster\'s entire configuration and object state, which is why etcd backup and restore procedures are a critical, non-optional operational concern.',
      'This separation of concerns (declarative desired state in the control plane, reconciliation loops continuously working to match actual state to desired state) is the core architectural pattern underlying essentially every Kubernetes controller, not just the built-in ones.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Cluster info',
    language: 'bash',
    code: '# View cluster component status\n' +
      'kubectl cluster-info\n' +
      'kubectl get componentstatuses   # etcd, scheduler, controller-manager\n' +
      '\n' +
      '# List nodes with roles and versions\n' +
      'kubectl get nodes -o wide\n' +
      '\n' +
      '# Describe a node (capacity, allocatable, conditions, pods)\n' +
      'kubectl describe node <node-name>\n' +
      '\n' +
      '# View control plane pods (in managed clusters they run as system pods)\n' +
      'kubectl get pods -n kube-system\n' +
      '\n' +
      '# Check kubelet on a node (SSH in, then:)\n' +
      'systemctl status kubelet\n' +
      'journalctl -u kubelet -f\n' +
      '\n' +
      '# etcd health (runs inside kube-system)\n' +
      'kubectl exec -n kube-system etcd-<node> -- \\\n' +
      '  etcdctl endpoint health \\\n' +
      '  --cacert /etc/kubernetes/pki/etcd/ca.crt \\\n' +
      '  --cert   /etc/kubernetes/pki/etcd/server.crt \\\n' +
      '  --key    /etc/kubernetes/pki/etcd/server.key',
  },
  {
    label: 'Pod scheduling trace',
    language: 'bash',
    code: '# Watch a Pod move through scheduling phases\n' +
      'kubectl apply -f deployment.yaml\n' +
      '\n' +
      '# Events show the scheduling decision:\n' +
      'kubectl get events --sort-by=.lastTimestamp -n default\n' +
      '# Normal  Scheduled  Successfully assigned default/api-6f7d9-abc12 to worker-node-1\n' +
      '# Normal  Pulled     Container image already present\n' +
      '# Normal  Created    Created container api\n' +
      '# Normal  Started    Started container api\n' +
      '\n' +
      '# Which node did the pod land on?\n' +
      'kubectl get pod <pod-name> -o jsonpath=\'{.spec.nodeName}\'\n' +
      '\n' +
      '# Why is a Pod stuck Pending? (scheduler filtering)\n' +
      'kubectl describe pod <pending-pod>\n' +
      '# Events section: "0/3 nodes are available: 3 Insufficient memory"',
  },
  {
    label: 'kubeconfig & contexts',
    language: 'bash',
    code: '# kubeconfig: ~/.kube/config stores cluster connection info\n' +
      '# A context = cluster + user + namespace\n' +
      '\n' +
      '# List available contexts\n' +
      'kubectl config get-contexts\n' +
      '\n' +
      '# Switch context (switch cluster)\n' +
      'kubectl config use-context prod-cluster\n' +
      '\n' +
      '# Set default namespace for current context\n' +
      'kubectl config set-context --current --namespace=my-ns\n' +
      '\n' +
      '# Merge multiple kubeconfigs\n' +
      'export KUBECONFIG=~/.kube/config:~/.kube/dev-cluster.yaml\n' +
      'kubectl config view --flatten > ~/.kube/merged.yaml\n' +
      '\n' +
      '# Useful tools:\n' +
      '# kubectx: switch contexts fast (brew install kubectx)\n' +
      '# kubens:  switch namespaces fast\n' +
      '# k9s:     terminal UI for the cluster',
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Confusing the scheduler with the controller manager',
    wrong: '// "The scheduler creates pods when I apply a Deployment"',
    right: '// Controller manager creates Pods from Deployments/ReplicaSets.\n// Scheduler assigns unscheduled Pods to nodes.',
    explanation: 'The Deployment controller (in kube-controller-manager) creates Pod objects. The scheduler then picks a node for each unscheduled Pod. They are separate components with distinct responsibilities.',
  },
  {
    title: 'Thinking etcd is just a database you can query directly',
    wrong: '// "I\'ll update cluster state directly in etcd to fix a stuck resource"',
    right: '// Always use kubectl or the API server.\n// Direct etcd writes bypass validation, RBAC, and admission webhooks.',
    explanation: 'etcd stores raw key-value data that the API server manages. Writing directly to etcd bypasses all Kubernetes validation, admission controllers, and RBAC. It can corrupt cluster state in ways that are hard to recover from.',
  },
  {
    title: 'Assuming control plane nodes run workload Pods',
    wrong: '// "I need more capacity so I\'ll schedule my app on control plane nodes"',
    right: '// Control plane nodes have a NoSchedule taint by default.\n// Add more worker nodes for workload capacity.',
    explanation: 'Control plane nodes have a node-role.kubernetes.io/control-plane:NoSchedule taint that prevents regular workloads from scheduling there. Running workloads on control plane nodes risks starving the scheduler, controller-manager, and etcd of resources.',
  },
  {
    title: 'Not understanding that kubectl communicates only with kube-apiserver',
    wrong: '// "I ran kubectl get pods but the kubelet reported a different status"',
    right: '// kubelet reports pod status TO kube-apiserver.\n// kubectl READS from kube-apiserver — both see the same state.',
    explanation: 'kubectl only ever talks to kube-apiserver. The kubelet pushes status updates to kube-apiserver. If they seem different, there is a timing delay — the kubelet\'s update has not reached the API server yet, or etcd has a consistency lag.',
  },
  {
    title: 'Ignoring namespace isolation in a multi-team cluster',
    wrong: '# Everyone deploys to "default" namespace\n# Teams overwrite each other\'s resources accidentally',
    right: '# Create namespaces per team/environment:\nkubectl create namespace team-alpha\n# Use RBAC to restrict access per namespace',
    explanation: 'The default namespace is a single flat space — any team can accidentally delete or overwrite another\'s resources. Use namespaces for isolation and combine with RBAC RoleBindings to restrict each team to their own namespace.',
  },
];

const challenge: Challenge = {
  title: 'K8s Component Role Matcher',
  language: 'typescript',
  description: 'Write a function that takes a Kubernetes event description string and returns which component most likely generated it. Map common event patterns to components: "Successfully assigned" → scheduler, "Created container" → kubelet, "Scaled replica" → controller-manager, "Started container" → kubelet, "Allocated IP" → kube-proxy/CNI.',
  hints: [
    'Use a list of [pattern, component] pairs',
    'Test each pattern against the event string (case-insensitive)',
    'Return the first match, or "unknown" if none match',
    'Patterns: "Successfully assigned" → scheduler, "Created container" or "Started container" → kubelet',
    '"Scaled" or "Created ReplicaSet" → kube-controller-manager',
  ],
  starterCode: 'function identifyComponent(event: string): string {\n  // TODO: match event to K8s component\n  return \'unknown\';\n}',
  solution: 'function identifyComponent(event: string): string {\n  const patterns: [RegExp, string][] = [\n    [/Successfully assigned/i, \'kube-scheduler\'],\n    [/Created container|Started container|Pulling image|Pulled image/i, \'kubelet\'],\n    [/Scaled (up|down)|Created ReplicaSet|Killing container/i, \'kube-controller-manager\'],\n    [/Allocated IP|Adding interface/i, \'CNI plugin / kube-proxy\'],\n    [/FailedScheduling|no nodes available/i, \'kube-scheduler\'],\n    [/BackOff|CrashLoopBackOff/i, \'kubelet\'],\n    [/Unhealthy|Liveness probe failed/i, \'kubelet\'],\n  ];\n\n  for (const [re, component] of patterns) {\n    if (re.test(event)) return component;\n  }\n  return \'unknown\';\n}',
};

const quiz: QuizQuestion[] = [
  {
    q: 'Which control plane component is the ONLY one that reads from and writes to etcd?',
    options: [
      'kube-scheduler',
      'kube-controller-manager',
      'kube-apiserver',
      'kubelet',
    ],
    answer: 2,
    explanation: 'Only kube-apiserver communicates with etcd directly. All other components (scheduler, controller-manager, kubelet) interact with etcd indirectly by reading from and writing to kube-apiserver via the REST API.',
  },
  {
    q: 'What does the kube-scheduler do when it finds a Pod with no nodeName?',
    options: [
      'It creates the Pod\'s containers using the container runtime',
      'It deletes the Pod and tells the Deployment controller to retry',
      'It filters nodes by feasibility, scores them, and sets the nodeName in the Pod spec',
      'It reports an error to etcd and waits for an administrator to assign the node',
    ],
    answer: 2,
    explanation: 'The scheduler watches for Pods without a nodeName. It runs a two-phase selection: filter (eliminate nodes that don\'t meet resource requests, taints, affinity rules) then score (rank remaining nodes). The highest-scoring node is assigned by setting nodeName in the Pod spec via kube-apiserver.',
  },
  {
    q: 'What is the Kubernetes reconciliation loop?',
    options: [
      'A loop that periodically restarts all Pods to ensure freshness',
      'The process where controllers observe desired vs actual state and take action to close the gap',
      'A health check loop that kubelet runs on each container',
      'The etcd consensus protocol for distributed data consistency',
    ],
    answer: 1,
    explanation: 'The reconciliation loop is the core pattern of every Kubernetes controller: observe the desired state (from etcd via kube-apiserver), compare it to the actual current state, and take actions to make actual match desired. Controllers use watches for efficiency rather than polling.',
  },
  {
    q: 'Which component runs on every worker node and ensures containers are running?',
    options: [
      'kube-proxy',
      'kube-scheduler',
      'kube-controller-manager',
      'kubelet',
    ],
    answer: 3,
    explanation: 'kubelet is the node agent that runs on every worker node. It watches for PodSpecs assigned to its node (via kube-apiserver) and uses the container runtime (containerd/CRI-O) to start, stop, and monitor containers. It also reports node and pod status back to kube-apiserver.',
  },
  {
    q: 'What happens to a Deployment\'s Pods if you delete the kube-controller-manager?',
    options: [
      'All Pods are immediately deleted',
      'Pods keep running but no reconciliation occurs — crashed Pods won\'t be replaced',
      'The kubelet takes over Deployment management',
      'kube-apiserver automatically promotes a backup controller-manager',
    ],
    answer: 1,
    explanation: 'Pods are long-running processes managed by the container runtime via kubelet — they keep running independently. However, with no controller-manager, no reconciliation happens. If a Pod crashes or a node goes down, the Deployment will not create replacement Pods until the controller-manager is restored.',
  },
  { q: 'What is the role of etcd in Kubernetes?', options: ['It runs container workloads on worker nodes', 'It is the distributed key-value store that holds all cluster state including objects, config, and secrets', 'It routes network traffic between pods across nodes', 'It schedules pods to available nodes based on resource availability'], answer: 1, explanation: 'etcd is the single source of truth for all Kubernetes cluster state. Every object you create such as Pod, Deployment, Service, or Secret is stored as a key-value pair. Only the API server communicates with etcd directly. etcd uses the Raft consensus algorithm for leader election and consistency. Back up etcd regularly with etcdctl snapshot save because losing etcd without a backup means losing all cluster state.' },
];

const qna: QnaItem[] = [
  {
    q: 'What is etcd and why is it critical to back up?',
    a: 'etcd is a distributed, strongly consistent key-value store that holds the entire cluster state — all Deployments, Services, Secrets, ConfigMaps, and RBAC rules. If etcd is lost without a backup, the entire cluster configuration is gone. Back up etcd with etcdctl snapshot save regularly, especially before cluster upgrades.',
  },
  {
    q: 'What is the Container Runtime Interface (CRI)?',
    a: 'CRI is a plugin interface that kubelet uses to talk to container runtimes without being tied to a specific one. containerd (used by most managed K8s services) and CRI-O are the two main CRI implementations. Docker was originally used but required a shim (dockershim) that was removed in Kubernetes 1.24.',
  },
  {
    q: 'What is the difference between the control plane and the data plane in Kubernetes?',
    a: 'The control plane (kube-apiserver, etcd, scheduler, controller-manager) decides WHAT should run and WHERE. The data plane (worker nodes with kubelet, kube-proxy, CNI) is WHERE the actual workloads run and where network traffic flows. In managed clusters (EKS, GKE, AKS), the cloud provider manages the control plane; you manage the worker nodes.',
  },
  {
    q: 'How does Kubernetes handle a node that stops responding?',
    a: 'kubelet sends heartbeats to kube-apiserver every 10 seconds. If no heartbeat is received for the node-monitor-grace-period (default 40 seconds), the Node controller marks the node NotReady. After the pod-eviction-timeout (default 5 minutes), the controller evicts Pods from the node and reschedules them on healthy nodes.',
  },
  {
    q: 'What is a kubeconfig context?',
    a: 'A context is a named combination of a cluster, a user, and a namespace, stored in ~/.kube/config. Switching contexts (kubectl config use-context) lets you quickly switch between different clusters or users. Tools like kubectx make this even faster. Each context tells kubectl which API server to connect to and which credentials to use.',
  },
  { q: 'What happens to running workloads when the Kubernetes API server goes down?', a: 'Running workloads CONTINUE to run because kubelet on each node maintains the desired state locally and keeps existing containers alive. New pods cannot be scheduled because the scheduler requires the API server. kubectl commands fail with connection errors. Controllers such as Deployment and ReplicaSet stop reconciling. The cluster is effectively frozen in its current state. This is why control plane HA is critical: multiple API server replicas behind a load balancer and a 3-node etcd cluster prevent single points of failure. Recovery requires restoring etcd from backup or bringing the API server back online.' },
];

const revision: RevisionSummary = {
  oneLiner: 'K8s control plane (apiserver, etcd, scheduler, controller-manager) declares desired state; worker nodes (kubelet, kube-proxy) make it real via the reconciliation loop.',
  mustKnow: [
    'kube-apiserver: only REST entry point; only component that reads/writes etcd',
    'etcd: source of truth for all cluster state — back it up!',
    'kube-scheduler: filters then scores nodes to assign unscheduled Pods',
    'kube-controller-manager: runs all reconciliation controllers (Deployment, ReplicaSet, Node…)',
    'kubelet: node agent — turns PodSpecs into running containers via the CRI',
    'Reconciliation: desired state (etcd) vs actual state → controllers act to close the gap',
  ],
  interviewFocus: [
    'Walk through the lifecycle of a Pod from kubectl apply to running container',
    'What happens to running Pods if the control plane goes down?',
    'Why does only kube-apiserver talk to etcd?',
    'What is the reconciliation loop and why does it matter for reliability?',
  ],
};

@Component({
  selector: 'app-k8s-k8s-architecture',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent,
    PageCompleteComponent,
  ],
  templateUrl: './k8s-architecture.html',
  styleUrl: './k8s-architecture.scss',
})
export class K8sArchitecture {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
