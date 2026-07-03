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
  { name: 'kubectl apply -f file.yaml', type: 'method', desc: 'Declaratively create or update resources from a manifest' },
  { name: 'kubectl get pods -o wide', type: 'method', desc: 'List pods with node, IP, and container details' },
  { name: 'kubectl describe pod <name>', type: 'method', desc: 'Full resource details including events (key for debugging)' },
  { name: 'kubectl logs -f <pod> -c <container>', type: 'method', desc: 'Stream logs; -c selects container in multi-container pods' },
  { name: 'kubectl exec -it <pod> -- sh', type: 'method', desc: 'Interactive shell inside a running container' },
  { name: 'kubectl port-forward <pod> 8080:3000', type: 'method', desc: 'Tunnel local port 8080 to container port 3000' },
  { name: 'kubectl rollout status deploy/<name>', type: 'method', desc: 'Watch a Deployment roll out to completion' },
  { name: 'kubectl delete -f file.yaml', type: 'method', desc: 'Remove all resources defined in a manifest file' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'get, describe, and -o Flags',
    points: [
      'kubectl get <resource> lists resources; add -n <namespace> or -A (all namespaces) to scope.',
      '-o wide adds node, IP, and nominated node columns. -o yaml dumps the full manifest. -o json for scripting.',
      '-o jsonpath extracts specific fields: kubectl get pod mypod -o jsonpath=\'{.status.podIP}\'.',
      'kubectl describe <resource> <name> shows detailed state plus the Events section — always check events first when debugging.',
      'kubectl get events --sort-by=.lastTimestamp -n <ns> gives a chronological view of what happened.',
    ],
  },
  {
    heading: 'apply, create, and delete',
    points: [
      'kubectl apply -f is declarative — it creates or patches resources to match the file. Use this by default.',
      'kubectl create -f is imperative — it fails if the resource already exists.',
      'kubectl delete -f <file> removes exactly the resources defined in that file.',
      'kubectl delete pod <name> --grace-period=0 --force forces immediate deletion (use with caution).',
      'kubectl apply -k <dir> processes Kustomize overlays in a directory — no separate kustomize binary needed.',
    ],
  },
  {
    heading: 'Debugging Commands',
    points: [
      'kubectl logs <pod> -c <container> --previous shows logs from the last (crashed) container instance.',
      'kubectl exec -it <pod> -- bash opens a shell; use -- sh if bash is not available (alpine images).',
      'kubectl debug node/<node-name> -it --image=busybox runs a debug pod on the node with host access.',
      'kubectl cp <pod>:/path/to/file ./local copies files out of a container (uses tar internally).',
      'kubectl top pod / kubectl top node shows CPU and memory usage (requires metrics-server installed).',
    ],
  },
  {
    heading: 'Rollouts and Scaling',
    points: [
      'kubectl rollout status deployment/<name> blocks until the rollout completes or times out.',
      'kubectl rollout history deployment/<name> shows revision history.',
      'kubectl rollout undo deployment/<name> rolls back to the previous revision.',
      'kubectl scale deployment/<name> --replicas=5 manually scales a Deployment.',
      'kubectl set image deployment/<name> <container>=<new-image> triggers a rolling update by changing the image.',
    ],
  },
  {
    heading: 'Imperative Commands vs. Declarative kubectl apply',
    points: [
      'Imperative commands (kubectl run, kubectl create) directly create or modify a specific object right now — fast for quick debugging or one-off tasks, but the resulting change is not captured in any version-controlled manifest.',
      'kubectl apply reconciles a YAML manifest against the cluster\'s current state declaratively, computing and applying only the diff — this is the standard approach for GitOps-style workflows where manifests are the source of truth, not ad-hoc commands.',
      'Mixing imperative changes with declarative manifests causes drift — a manually kubectl edit-ed object no longer matches its source-controlled manifest, and the next kubectl apply may silently overwrite the manual change (or vice versa) depending on which fields changed.',
      'kubectl diff (comparing a local manifest against live cluster state before applying) is a useful safety check to catch unexpected drift before it causes a surprising change during a routine apply.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Daily workflow',
    language: 'bash',
    code: '# Get pods in a namespace with extra info\n' +
      'kubectl get pods -n production -o wide\n' +
      '\n' +
      '# Watch pods update in real-time (Ctrl+C to stop)\n' +
      'kubectl get pods -n production -w\n' +
      '\n' +
      '# Describe a pod to see events (key for debugging)\n' +
      'kubectl describe pod api-7d9b8c6f5-abc12 -n production\n' +
      '\n' +
      '# Stream logs from a specific container\n' +
      'kubectl logs -f api-7d9b8c6f5-abc12 -c api -n production\n' +
      '\n' +
      '# Get logs from previous (crashed) container instance\n' +
      'kubectl logs api-7d9b8c6f5-abc12 -c api --previous\n' +
      '\n' +
      '# Open a shell in a container\n' +
      'kubectl exec -it api-7d9b8c6f5-abc12 -c api -n production -- sh\n' +
      '\n' +
      '# Forward local port to pod for testing\n' +
      'kubectl port-forward pod/api-7d9b8c6f5-abc12 8080:3000 -n production',
  },
  {
    label: 'Apply & rollout',
    language: 'bash',
    code: '# Apply a manifest (create or update)\n' +
      'kubectl apply -f deployment.yaml\n' +
      '\n' +
      '# Apply all manifests in a directory\n' +
      'kubectl apply -f ./k8s/\n' +
      '\n' +
      '# Watch the rollout progress\n' +
      'kubectl rollout status deployment/api -n production\n' +
      '\n' +
      '# Update image (triggers rolling update)\n' +
      'kubectl set image deployment/api api=ghcr.io/org/api:v2.1.0 -n production\n' +
      '\n' +
      '# View rollout history\n' +
      'kubectl rollout history deployment/api -n production\n' +
      '\n' +
      '# Roll back to previous version\n' +
      'kubectl rollout undo deployment/api -n production\n' +
      '\n' +
      '# Scale replicas\n' +
      'kubectl scale deployment/api --replicas=5 -n production\n' +
      '\n' +
      '# Dry-run: see what would change without applying\n' +
      'kubectl apply -f deployment.yaml --dry-run=server',
  },
  {
    label: 'Output & filtering',
    language: 'bash',
    code: '# Output formats\n' +
      'kubectl get deployment api -o yaml      # full manifest\n' +
      'kubectl get deployment api -o json      # JSON for scripting\n' +
      'kubectl get pods -o wide                # +node, +IP columns\n' +
      '\n' +
      '# Extract specific field with jsonpath\n' +
      'kubectl get pod api-abc -o jsonpath=\'{.status.podIP}\'\n' +
      'kubectl get nodes -o jsonpath=\'{.items[*].metadata.name}\'\n' +
      '\n' +
      '# Filter with labels\n' +
      'kubectl get pods -l app=api,env=prod\n' +
      'kubectl get pods --field-selector status.phase=Running\n' +
      '\n' +
      '# Get all resources in all namespaces\n' +
      'kubectl get pods -A\n' +
      'kubectl get all -n production\n' +
      '\n' +
      '# Events sorted by time (great for debugging)\n' +
      'kubectl get events -n production --sort-by=.lastTimestamp\n' +
      '\n' +
      '# Custom columns\n' +
      'kubectl get pods -o custom-columns=NAME:.metadata.name,STATUS:.status.phase,NODE:.spec.nodeName',
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Using kubectl create instead of kubectl apply in CI/CD',
    wrong: 'kubectl create -f deployment.yaml  # fails on second run: already exists',
    right: 'kubectl apply -f deployment.yaml   # idempotent: creates or updates',
    explanation: 'kubectl create is imperative and fails if the resource already exists. kubectl apply is declarative and idempotent — safe to run in every CI/CD pipeline run regardless of whether the resource exists.',
  },
  {
    title: 'Not checking events when a Pod is stuck',
    wrong: '# Pod is Pending — checking only kubectl get pod\n# "Status: Pending" — no useful info',
    right: 'kubectl describe pod <name>   # Events section shows:\n# "0/3 nodes are available: 3 Insufficient memory."',
    explanation: 'kubectl get only shows current state. kubectl describe shows the full resource spec AND the recent events, which contain the actual reason for failures (insufficient resources, image pull errors, failed mounts, etc.).',
  },
  {
    title: 'Forgetting -n <namespace> and wondering why resources are missing',
    wrong: 'kubectl get pods  # returns nothing — resources are in "production" ns',
    right: 'kubectl get pods -n production\n# or set default namespace:\nkubectl config set-context --current --namespace=production',
    explanation: 'kubectl defaults to the "default" namespace. If your workloads run in a custom namespace, you must pass -n <namespace> every time, or update your kubeconfig context to set the namespace as the default for that context.',
  },
  {
    title: 'Force-deleting a Pod to "fix" a stuck Terminating state',
    wrong: 'kubectl delete pod <name> --grace-period=0 --force\n# Pod removed from API but may still be running on node',
    right: '# First investigate WHY it is stuck:\nkubectl describe pod <name>  # check finalizers, volumes\n# If a node is NotReady, wait for node or cordon/drain it',
    explanation: 'Force-deleting bypasses the graceful shutdown sequence and can leave zombie processes on the node or cause two instances of the Pod running simultaneously. Investigate the root cause (finalizers, stuck volumes, NotReady node) before force-deleting.',
  },
  {
    title: 'kubectl exec without specifying the container in multi-container Pods',
    wrong: 'kubectl exec -it <pod> -- sh\n# Connects to wrong container (first listed)',
    right: 'kubectl exec -it <pod> -c <container-name> -- sh\n# kubectl describe pod shows container names',
    explanation: 'When a Pod has multiple containers (app + sidecar), kubectl exec without -c attaches to the first container listed in the spec, which may not be the one you want. Always specify -c <container-name> in multi-container Pods.',
  },
];

const challenge: Challenge = {
  title: 'kubectl Command Builder',
  language: 'typescript',
  description: 'Write a function buildKubectlCommand(opts) that builds a kubectl command string from an options object. Support: verb (get/describe/apply/delete/logs/exec), resource, name, namespace, container, outputFormat (-o yaml/json/wide/jsonpath), labelSelector (-l), follow (for logs -f), and interactive (for exec -it).',
  hints: [
    'Start with "kubectl " + opts.verb',
    'Add resource and optional name: "get pods api-abc"',
    'Add -n namespace if provided',
    'Add -l labelSelector if provided (get/describe only)',
    'Add -o outputFormat if provided',
    'For logs: add -f if follow; add -c container if provided',
    'For exec: add -it if interactive; append -- sh at the end',
  ],
  starterCode: 'interface KubectlOpts {\n  verb: \'get\' | \'describe\' | \'apply\' | \'delete\' | \'logs\' | \'exec\';\n  resource?: string;\n  name?: string;\n  namespace?: string;\n  container?: string;\n  outputFormat?: string;\n  labelSelector?: string;\n  follow?: boolean;\n  interactive?: boolean;\n  file?: string;\n}\n\nfunction buildKubectlCommand(opts: KubectlOpts): string {\n  // TODO: build the kubectl command string\n  return \'kubectl \';\n}',
  solution: 'interface KubectlOpts {\n  verb: \'get\' | \'describe\' | \'apply\' | \'delete\' | \'logs\' | \'exec\';\n  resource?: string;\n  name?: string;\n  namespace?: string;\n  container?: string;\n  outputFormat?: string;\n  labelSelector?: string;\n  follow?: boolean;\n  interactive?: boolean;\n  file?: string;\n}\n\nfunction buildKubectlCommand(opts: KubectlOpts): string {\n  const parts: string[] = [\'kubectl\', opts.verb];\n\n  if (opts.file && (opts.verb === \'apply\' || opts.verb === \'delete\')) {\n    parts.push(\'-f\', opts.file);\n  } else {\n    if (opts.resource) parts.push(opts.resource);\n    if (opts.name) parts.push(opts.name);\n  }\n\n  if (opts.namespace) parts.push(\'-n\', opts.namespace);\n\n  if (opts.labelSelector && [\'get\', \'describe\', \'delete\'].includes(opts.verb)) {\n    parts.push(\'-l\', opts.labelSelector);\n  }\n\n  if (opts.outputFormat && [\'get\', \'describe\'].includes(opts.verb)) {\n    parts.push(\'-o\', opts.outputFormat);\n  }\n\n  if (opts.verb === \'logs\') {\n    if (opts.follow) parts.push(\'-f\');\n    if (opts.container) parts.push(\'-c\', opts.container);\n  }\n\n  if (opts.verb === \'exec\') {\n    if (opts.interactive) parts.push(\'-it\');\n    if (opts.container) parts.push(\'-c\', opts.container);\n    parts.push(\'--\', \'sh\');\n  }\n\n  return parts.join(\' \');\n}',
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the difference between kubectl apply and kubectl create?',
    options: [
      'apply is for Pods; create is for Deployments',
      'apply is declarative and idempotent; create is imperative and fails if resource exists',
      'apply requires a running cluster; create works offline',
      'They are identical — create is just an older alias',
    ],
    answer: 1,
    explanation: 'kubectl apply patches resources to match the manifest — safe to run repeatedly (idempotent). kubectl create fails with "already exists" on the second run. In CI/CD pipelines, always use apply.',
  },
  {
    q: 'Which command shows you WHY a Pod is in the Pending state?',
    options: [
      'kubectl get pod <name> -o yaml',
      'kubectl logs <name>',
      'kubectl describe pod <name> — specifically the Events section',
      'kubectl top pod <name>',
    ],
    answer: 2,
    explanation: 'kubectl describe pod includes the Events section which shows messages from the scheduler, kubelet, and controllers. For a Pending pod, this is where you\'ll see "Insufficient memory", "no nodes match affinity", or "PVC not found".',
  },
  {
    q: 'How do you stream logs from a specific container in a multi-container Pod?',
    options: [
      'kubectl logs <pod> --all-containers',
      'kubectl logs <pod> -c <container-name> -f',
      'kubectl exec <pod> -- tail -f /var/log/app.log',
      'kubectl describe pod <pod> | grep log',
    ],
    answer: 1,
    explanation: '-c <container-name> selects which container\'s logs to stream. -f follows the log in real time. Without -c, kubectl logs attaches to the first container listed in the Pod spec. Use kubectl describe pod to find container names.',
  },
  {
    q: 'What does kubectl rollout undo deployment/<name> do?',
    options: [
      'Deletes the Deployment and re-creates it from scratch',
      'Pauses the current rollout mid-way',
      'Rolls the Deployment back to the previous revision',
      'Scales the Deployment to 0 replicas',
    ],
    answer: 2,
    explanation: 'kubectl rollout undo reverts to the previous revision stored in the Deployment\'s rollout history. You can target a specific revision with --to-revision=<n>. The Deployment controller then performs a rolling update back to the previous image/spec.',
  },
  {
    q: 'What flag shows resource usage (CPU/memory) for pods?',
    options: [
      'kubectl get pods --metrics',
      'kubectl describe pod --resources',
      'kubectl top pod',
      'kubectl stats pod',
    ],
    answer: 2,
    explanation: 'kubectl top pod shows current CPU and memory usage for pods. kubectl top node shows node-level usage. Both require metrics-server to be installed in the cluster. Without metrics-server, the command returns an error.',
  },
  { q: 'What does kubectl rollout status deployment/myapp do, and how does it differ from kubectl get deployment/myapp?', options: ['They are identical commands', 'rollout status blocks and streams progress until the rollout finishes (or times out), reporting when the new ReplicaSet is fully available; get just prints the current object state once, with no waiting', 'rollout status only works after the rollout has already finished', 'get deployment triggers a new rollout, while rollout status does not'], answer: 1, explanation: 'kubectl rollout status watches the Deployment\'s rollout in real time and blocks the terminal until it either completes successfully or hits the progressDeadlineSeconds timeout, printing progress like "Waiting for deployment... 2 of 3 updated replicas are available" — this makes it the standard way to gate a CI/CD pipeline step on a rollout actually succeeding. kubectl get deployment/myapp just returns a snapshot of the object\'s current fields with no waiting or progress tracking.' },
];

const qna: QnaItem[] = [
  {
    q: 'What is the --dry-run=server flag and when should I use it?',
    a: 'kubectl apply -f manifest.yaml --dry-run=server sends the manifest to the API server for validation without persisting it. It runs admission webhooks and validation just like a real apply, so you see exactly what would happen. Use it before applying changes to production to catch validation errors.',
  },
  {
    q: 'How do I apply multiple YAML documents in a single file?',
    a: 'Separate documents in one YAML file with ---. kubectl apply -f manifests.yaml will create/update all resources in one call. You can also use kubectl apply -f ./k8s/ to apply all YAML files in a directory recursively with -R.',
  },
  {
    q: 'What is the difference between kubectl get all and kubectl get <specific-resource>?',
    a: 'kubectl get all does NOT get all resources — it only gets a subset (pods, services, deployments, replicasets, statefulsets, daemonsets, jobs, cronjobs). It misses ConfigMaps, Secrets, PVCs, and CRDs. Use kubectl api-resources to list all resource types and query them individually.',
  },
  {
    q: 'How do I quickly generate a YAML manifest without writing it from scratch?',
    a: 'Use --dry-run=client -o yaml to generate manifests: kubectl create deployment api --image=nginx --dry-run=client -o yaml > deployment.yaml. This gives you a working starting manifest that you can customise. Works for most resource types: pod, service, configmap, secret, etc.',
  },
  {
    q: 'What is kubectl port-forward and when is it useful?',
    a: 'kubectl port-forward creates a temporary tunnel from a local port to a port on a Pod, Service, or Deployment. It\'s useful for testing a service locally without exposing it to the network: kubectl port-forward svc/api 8080:80. The tunnel exists only while the command is running — it is not a permanent networking solution.',
  },
  { q: 'How do you get logs from a crashed or restarting pod?', a: 'Use kubectl logs <pod> --previous to get logs from the PREVIOUS container instance before it crashed. For multi-container pods specify the container with -c <container>. For streaming logs use kubectl logs -f <pod>. To get logs from all pods matching a label use kubectl logs -l app=myapp --all-containers=true. For persistent log access after pod deletion, use a log aggregation system like Loki, Elasticsearch, or Datadog that tails container logs via a DaemonSet before pods are removed.' },
];

const revision: RevisionSummary = {
  oneLiner: 'kubectl is the daily driver — apply for declarative changes, describe+events for debugging, logs/exec for runtime inspection, rollout for deployment control.',
  mustKnow: [
    'kubectl apply -f is idempotent — use it in CI/CD; kubectl create fails if resource exists',
    'kubectl describe pod → Events section is the first stop for any debugging',
    '-n <namespace> required unless default namespace; -A for all namespaces',
    'kubectl logs -f -c <container> --previous for last crashed instance',
    'kubectl rollout status/undo for deployment control; kubectl scale for quick replicas change',
    'kubectl get -o yaml, -o jsonpath for manifest export and field extraction',
  ],
  interviewFocus: [
    'Walk through how you would debug a CrashLoopBackOff pod',
    'What is the difference between kubectl apply and kubectl create?',
    'How do you roll back a bad Deployment in Kubernetes?',
    'How do you access a service that has no external endpoint for local testing?',
  ],
};

@Component({
  selector: 'app-k8s-kubectl',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent,
    PageCompleteComponent,
  ],
  templateUrl: './kubectl.html',
  styleUrl: './kubectl.scss',
})
export class K8sKubectl {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
