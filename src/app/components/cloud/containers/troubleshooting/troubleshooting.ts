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
  { name: 'kubectl describe pod', type: 'keyword', desc: 'Full pod state + Events section — the first place to look for root cause' },
  { name: 'kubectl logs --previous', type: 'keyword', desc: 'Logs from the last crashed container instance (before restart)' },
  { name: 'CrashLoopBackOff', type: 'keyword', desc: 'Container keeps exiting — check logs + exit code; usually app error or bad config' },
  { name: 'ImagePullBackOff', type: 'keyword', desc: 'Can\'t pull image — wrong name, tag, or missing registry credentials' },
  { name: 'Pending', type: 'keyword', desc: 'Pod not scheduled — insufficient resources, taints, or no matching nodes' },
  { name: 'OOMKilled', type: 'keyword', desc: 'Memory limit exceeded — increase limit or fix memory leak' },
  { name: 'kubectl get events', type: 'keyword', desc: 'Cluster-wide events sorted by time — shows scheduling failures, pull errors' },
  { name: 'k9s', type: 'keyword', desc: 'Interactive terminal UI for navigating pods, logs, and events in real time' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Troubleshooting Methodology',
    points: [
      'Always start with kubectl describe pod <name> — the Events section at the bottom reveals the root cause for most issues.',
      'Work backwards: Pod status → Container state → Events → Logs → Node state.',
      'kubectl get events --sort-by=.lastTimestamp -n <ns> gives a chronological cluster-wide view.',
      'Check the pod phase first: Pending (not scheduled), Running (scheduled, containers starting), Failed/CrashLoop (running but crashing).',
      'For intermittent issues: kubectl logs --previous shows the previous container\'s output before the restart.',
    ],
  },
  {
    heading: 'CrashLoopBackOff',
    points: [
      'Container starts, crashes (non-zero exit), Kubernetes restarts it with exponential back-off (10s, 20s, 40s… up to 5 min).',
      'Common causes: application error on startup, missing environment variable, bad config file, dependency not ready.',
      'Fix steps: kubectl logs <pod> (current) → kubectl logs <pod> --previous (last crash) → check exit code in kubectl describe.',
      'Exit code 1: application error. Exit code 137: OOMKilled (killed by OS, memory). Exit code 139: segfault.',
      'Use an init container to wait for dependencies — avoids CrashLoop caused by "database not ready" race conditions.',
    ],
  },
  {
    heading: 'Pending Pods and Scheduling Failures',
    points: [
      'kubectl describe pod shows "0/3 nodes are available" with the specific reason in the Events section.',
      'Insufficient resources: node doesn\'t have enough CPU/memory to satisfy the pod\'s requests.',
      'Taints and tolerations: node has a taint the pod doesn\'t tolerate — common on master/GPU nodes.',
      'nodeSelector or affinity: no node matches the required labels.',
      'Fix: reduce resource requests, add tolerations, fix node labels, or scale the cluster (Cluster Autoscaler).',
    ],
  },
  {
    heading: 'Service and DNS Debugging',
    points: [
      'Pod runs but can\'t reach a Service: check selector labels match pod labels exactly (case-sensitive).',
      'kubectl get endpoints <svc> — if empty, no pods matched the Service selector.',
      'DNS debugging: kubectl run test --image=busybox --rm -it -- nslookup <service-name>.<namespace>.',
      'Service port vs targetPort: Service port is what clients use; targetPort is the container port.',
      'kubectl port-forward svc/<name> 8080:80 lets you test a Service locally without Ingress.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Pod diagnosis flow',
    language: 'bash',
    code: '# Step 1: Check pod status\nkubectl get pods -n production\n# NAME          READY   STATUS             RESTARTS   AGE\n# api-xyz       0/1     CrashLoopBackOff   5          3m\n\n# Step 2: Describe — read the Events section at the bottom\nkubectl describe pod api-xyz -n production\n# Events:\n#   Warning  BackOff  2m  kubelet  Back-off restarting failed container\n#   Warning  Failed   3m  kubelet  Error: failed to create containerd task:\n\n# Step 3: Current logs\nkubectl logs api-xyz -n production\n\n# Step 4: Previous container logs (before crash)\nkubectl logs api-xyz -n production --previous\n\n# Step 5: Check exit code\nkubectl get pod api-xyz -n production -o jsonpath=\'{.status.containerStatuses[0].lastState.terminated.exitCode}\'\n# 137 = OOMKilled, 1 = app error, 139 = segfault\n\n# Step 6: Shell into running container\nkubectl exec -it api-xyz -n production -- sh\n\n# Step 7: Cluster-wide events (sorted by time)\nkubectl get events -n production --sort-by=.lastTimestamp',
  },
  {
    label: 'Scheduling & resource issues',
    language: 'bash',
    code: '# Pending pod — describe shows scheduling failure reason\nkubectl describe pod my-pod -n production\n# Events:\n#   Warning  FailedScheduling  0/3 nodes are available:\n#   1 node(s) had taint {node-role.kubernetes.io/master: ""}\n#   2 node(s) insufficient memory.\n\n# Check node capacity and allocatable resources\nkubectl describe nodes | grep -A5 "Allocated resources"\n# Requests   cpu: 3700m (92%), memory: 5Gi (89%)\n\n# Check node taints\nkubectl get nodes -o custom-columns=NAME:.metadata.name,TAINTS:.spec.taints\n\n# Check what\'s consuming resources per namespace\nkubectl top pods -n production --sort-by=memory\nkubectl top nodes\n\n# ImagePullBackOff — check image name and credentials\nkubectl describe pod bad-pod | grep -A3 "Failed to pull"\n# Failed to pull image "ghcr.io/org/api:wrong-tag": not found\n\n# Fix: create image pull secret and reference it\nkubectl create secret docker-registry regcred \\\n  --docker-server=ghcr.io \\\n  --docker-username=user \\\n  --docker-password=TOKEN\n# Then add to pod spec:\n# imagePullSecrets:\n#   - name: regcred',
  },
  {
    label: 'Service & DNS debugging',
    language: 'bash',
    code: '# Check if Service has endpoints (pods matched by selector)\nkubectl get endpoints api-service -n production\n# NAME          ENDPOINTS            AGE\n# api-service   10.244.1.5:8080      5m   ← good\n# api-service   <none>               5m   ← no pods matched!\n\n# Compare service selector vs pod labels\nkubectl get svc api-service -o jsonpath=\'{.spec.selector}\'\n# {"app":"api"}\nkubectl get pods -n production --show-labels | grep api\n# api-xyz   Running   app=Api   ← capital A! selector mismatch\n\n# DNS lookup from inside the cluster\nkubectl run dns-test --image=busybox:1.35 --rm -it -- \\\n  nslookup api-service.production.svc.cluster.local\n\n# Port-forward to test Service directly\nkubectl port-forward svc/api-service 8080:80 -n production\ncurl http://localhost:8080/health\n\n# Check Ingress and backend service\nkubectl describe ingress my-ingress -n production\nkubectl get ingress -n production -o wide',
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Not reading the Events section in kubectl describe',
    wrong: '# Only checking pod status:\nkubectl get pods\n# STATUS: Pending — giving up without knowing why\n# Filing a ticket saying "pod won\'t start"',
    right: 'kubectl describe pod <name> -n <ns>\n# Events section at the bottom:\n#   Warning FailedScheduling: 0/3 nodes available:\n#   2 Insufficient memory, 1 node had taint master\n# Actionable root cause in 10 seconds',
    explanation: 'kubectl describe pod is the single most powerful troubleshooting command. The Events section explains WHY a pod is failing — scheduling failures, image pull errors, health check failures, OOMKills. New engineers frequently stop at kubectl get pods status without reading describe, wasting hours on guesswork.',
  },
  {
    title: 'Checking current logs when the container is in CrashLoopBackOff',
    wrong: 'kubectl logs api-pod\n# Error from server: container "api" in pod "api-pod" is not running\n# Or: only sees a few lines before the crash — misses the actual error',
    right: '# Get the previous container\'s logs (before the restart)\nkubectl logs api-pod --previous\n# Shows the full output of the last crashed run\n# Including the fatal error that caused the exit',
    explanation: 'In CrashLoopBackOff, the container keeps restarting. kubectl logs shows the current (possibly empty) run. To see WHY it crashed, use --previous to get the logs from the last terminated container instance. This is where the actual stack trace or error message lives.',
  },
  {
    title: 'Ignoring the distinction between Service port and targetPort',
    wrong: '# Service:\nspec:\n  ports:\n    - port: 80\n      targetPort: 8080\n# Connecting to :80 inside cluster ✓\n# But developer tries curl pod-ip:80 directly and gets "refused"\n# (pod listens on 8080, not 80)',
    right: '# Service port 80 → container port 8080\n# To reach the pod directly: curl pod-ip:8080\n# To reach via Service (in cluster): curl service-name:80\n# Port-forward maps both:\nkubectl port-forward pod/api-pod 8080:8080',
    explanation: 'Service port is the virtual port clients use to reach the Service. targetPort is the actual container port the traffic is forwarded to. They can differ. When debugging, always check both: curl the Service on its port, but curl the pod directly on targetPort. Confusion between these two ports is a frequent cause of "connection refused" errors.',
  },
  {
    title: 'Forgetting that kubectl logs only shows stdout/stderr',
    wrong: '# App writes logs to /var/log/app.log instead of stdout\nkubectl logs api-pod\n# (empty output — no logs visible)\n# Assuming the app is running fine with no output',
    right: '# Option 1: Fix the app to log to stdout/stderr (best practice)\n# Option 2: Shell in and read the file:\nkubectl exec -it api-pod -- tail -f /var/log/app.log\n# Option 3: Use a sidecar log shipper (Fluentd) to read and forward',
    explanation: 'kubectl logs only captures stdout and stderr from the container process. Applications that write to files (e.g. /var/log/app.log) produce no output in kubectl logs. The Kubernetes best practice is to log to stdout — let the container runtime capture it and let log collectors (Fluentd, Promtail) ship it to a centralised system.',
  },
  {
    title: 'Not checking endpoints when a Service connection fails',
    wrong: '# Service exists but app can\'t connect\n# Spending time debugging the app, checking firewall rules\n# Meanwhile the issue is a selector label mismatch',
    right: 'kubectl get endpoints api-service -n production\n# ENDPOINTS: <none>   ← selector matches no pods\n# Compare:\nkubectl get svc api-service -o jsonpath=\'{.spec.selector}\'\n# {"app":"api"}\nkubectl get pods -l app=api -n production\n# (empty — pods have label "app=Api" with capital A)',
    explanation: 'When a Service connection fails, the first check is kubectl get endpoints. If it shows <none>, the Service selector matches zero pods — usually a label mismatch (typo, wrong case, missing label). This takes 5 seconds to diagnose but is often the last thing engineers check after minutes of other investigation.',
  },
];

const challenge: Challenge = {
  title: 'Pod Status Classifier',
  language: 'typescript',
  description: 'Write a function that classifies a pod\'s status and returns a suggested troubleshooting action. Input: { phase: string, reason?: string, exitCode?: number }. Map known statuses to actions: CrashLoopBackOff → "Check kubectl logs --previous and exit code"; ImagePullBackOff/ErrImagePull → "Verify image name/tag and imagePullSecrets"; Pending → "Check kubectl describe pod for scheduling failure"; OOMKilled (exitCode 137) → "Increase memory limit or fix memory leak"; Running → "Pod is healthy". Return { status, action }.',
  hints: [
    'Check reason field for CrashLoopBackOff, ImagePullBackOff, ErrImagePull',
    'Check exitCode === 137 for OOMKilled (takes priority over generic crash)',
    'Check phase === "Pending" for scheduling issues',
    'Check phase === "Running" for healthy state',
    'Return a generic action for unknown statuses',
  ],
  starterCode: 'interface PodStatus {\n  phase: string;\n  reason?: string;\n  exitCode?: number;\n}\n\ninterface DiagnosisResult {\n  status: string;\n  action: string;\n}\n\nfunction diagnosePod(status: PodStatus): DiagnosisResult {\n  // TODO: classify and suggest action\n  return { status: "Unknown", action: "Run kubectl describe pod for details" };\n}',
  solution: 'interface PodStatus {\n  phase: string;\n  reason?: string;\n  exitCode?: number;\n}\n\ninterface DiagnosisResult {\n  status: string;\n  action: string;\n}\n\nfunction diagnosePod(status: PodStatus): DiagnosisResult {\n  const { phase, reason, exitCode } = status;\n\n  if (reason === "CrashLoopBackOff") {\n    if (exitCode === 137) {\n      return { status: "OOMKilled in CrashLoop", action: "Increase memory limit or fix memory leak — exitCode 137 means OOMKill" };\n    }\n    return { status: "CrashLoopBackOff", action: "Run kubectl logs <pod> --previous and check exit code in kubectl describe pod" };\n  }\n\n  if (reason === "ImagePullBackOff" || reason === "ErrImagePull") {\n    return { status: reason, action: "Verify image name/tag exists and check imagePullSecrets for private registries" };\n  }\n\n  if (phase === "Pending") {\n    return { status: "Pending", action: "Run kubectl describe pod — check Events for scheduling failure (resources, taints, affinity)" };\n  }\n\n  if (exitCode === 137) {\n    return { status: "OOMKilled", action: "Container exceeded memory limit — increase limits.memory or fix memory leak" };\n  }\n\n  if (phase === "Running") {\n    return { status: "Running", action: "Pod is healthy — check application-level health if issues persist" };\n  }\n\n  return { status: "Unknown", action: "Run kubectl describe pod and kubectl get events for details" };\n}',
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the first kubectl command you should run when a pod shows CrashLoopBackOff?',
    options: [
      'kubectl delete pod <name> to force a fresh start',
      'kubectl describe pod <name> to read Events, then kubectl logs <name> --previous for the crash output',
      'kubectl rollout restart deployment/<name> to redeploy all replicas',
      'kubectl get nodes to check if a node is unhealthy',
    ],
    answer: 1,
    explanation: 'CrashLoopBackOff means the container keeps exiting. The diagnosis flow: kubectl describe pod to read Events and exit code → kubectl logs <pod> --previous to see what the container printed before crashing. The --previous flag is critical — without it you only see the current (possibly empty) run, not the one that crashed.',
  },
  {
    q: 'A pod is Pending and kubectl describe shows "0/3 nodes are available: 3 Insufficient memory." What is the fix?',
    options: [
      'Restart the pod with kubectl delete pod',
      'Reduce the pod\'s memory requests, or add nodes with more capacity',
      'Add an imagePullSecret to the pod spec',
      'Label the pod with node-selector to target a specific node',
    ],
    answer: 1,
    explanation: 'Pending with "Insufficient memory" means the pod\'s memory requests exceed what is free on all nodes. Options: lower the memory requests if they are over-provisioned; use kubectl top nodes to identify nodes with free capacity; or add new nodes (Cluster Autoscaler can do this automatically). Do not delete and recreate — the pod will remain Pending for the same reason.',
  },
  {
    q: 'What does exit code 137 mean in a Kubernetes container?',
    options: [
      'The container exited successfully but with a non-standard code',
      'The container was killed by the OS Out-of-Memory killer (OOMKilled) — memory limit exceeded',
      'The container failed to connect to the Kubernetes API server',
      'The image entrypoint was not found in the container filesystem',
    ],
    answer: 1,
    explanation: 'Exit code 137 = 128 + 9 (SIGKILL). In Kubernetes, this means the container was killed by the Linux OOM killer because it exceeded its memory limit. You can confirm by checking kubectl describe pod — the lastState shows "OOMKilled" as the reason. Fix: increase limits.memory or profile the application for memory leaks.',
  },
  {
    q: 'kubectl get endpoints my-service shows ENDPOINTS: <none>. What does this mean?',
    options: [
      'The service has not received any traffic yet and has no connections',
      'No pods matched the service\'s selector — usually a label mismatch between the service and pods',
      'The service is of type ExternalName and does not track endpoints',
      'The endpoint controller is down and needs to be restarted',
    ],
    answer: 1,
    explanation: 'When a Service has no endpoints, it means zero pods matched its selector. The Service\'s spec.selector is compared against pod labels — if they don\'t match exactly (including case), the endpoint list is empty and all connections through the Service will fail. Compare kubectl get svc <name> -o jsonpath=\'{.spec.selector}\' against kubectl get pods --show-labels.',
  },
  {
    q: 'Why does kubectl logs show no output for a pod in CrashLoopBackOff?',
    options: [
      'kubectl logs requires the --all-containers flag to show output for crashing pods',
      'You may be viewing the current (just-started) container — use --previous to see the crashed instance\'s output',
      'Logs are only available after a pod has been Running for at least 60 seconds',
      'CrashLoopBackOff puts the pod in a quarantine state that blocks log access',
    ],
    answer: 1,
    explanation: 'CrashLoopBackOff causes rapid restarts. kubectl logs shows the CURRENT running container, which may have just started and produced no output yet. The error that caused the crash is in the PREVIOUS container\'s output. Use kubectl logs <pod> --previous to read the last terminated container\'s stdout/stderr.',
  },
  { q: 'A pod is stuck in CrashLoopBackOff. What is the most likely cause and how do you diagnose it?', options: ['The node has run out of memory and is evicting the pod repeatedly', 'The container starts but immediately exits due to application errors, missing config, or a failed healthcheck; diagnose with kubectl logs --previous', 'The service account lacks permissions required to start the container process', 'The container image is corrupted in the registry and cannot be executed'], answer: 1, explanation: 'CrashLoopBackOff means the container starts, crashes, and Kubernetes restarts it with exponential backoff from 10 seconds up to 5 minutes max. Common causes: unhandled exception at startup, missing required env var or config file, wrong entrypoint command, or failed liveness probe. Debug with kubectl logs pod --previous for logs before the crash, and kubectl describe pod pod to see the Events section with exit code and restart count.' },
];

const qna: QnaItem[] = [
  {
    q: 'What is k9s and when should I use it over kubectl?',
    a: 'k9s is an interactive terminal UI for Kubernetes. It shows live-updating pod lists, lets you drill into logs and describe output with keyboard shortcuts, and makes navigating between namespaces and resources much faster than typing kubectl commands repeatedly. Use kubectl for scripting, automation, and CI. Use k9s for interactive debugging sessions — it significantly reduces the time to diagnose a production incident.',
  },
  {
    q: 'A pod shows Running but the application is returning 500 errors. Where do I look?',
    a: 'Running means containers started and passed readiness probes — it doesn\'t mean the app is healthy. Check: kubectl logs <pod> for application errors; kubectl describe pod for restart count (restarts increment on crash); check readiness probe configuration (a pod passes readiness even if it\'s serving errors); use kubectl port-forward to hit the app directly and eliminate Ingress/Service as the source; check if the app can reach its database (kubectl exec into the pod and test the connection).',
  },
  {
    q: 'How do I debug a pod that exits immediately before I can exec into it?',
    a: 'Override the entrypoint to keep the container running: kubectl run debug --image=myapp:v1 --command -- sleep infinity. Then exec in and run the app manually: kubectl exec -it debug -- /app/start.sh. You can also change the Deployment\'s command field temporarily. Another approach: check kubectl logs --previous for the crash output, or use an ephemeral debug container: kubectl debug -it <pod> --image=busybox --target=<container>.',
  },
  {
    q: 'What is an ephemeral container and when do I use it?',
    a: 'Ephemeral containers are temporary containers added to a running pod for debugging — they share the pod\'s network and process namespace but do not modify the pod spec. Useful when the main container is a distroless image with no shell. kubectl debug -it <pod> --image=busybox --target=<container-name> adds a busybox container to the pod. You can then inspect the network, run nc/curl, or check /proc for process information.',
  },
  {
    q: 'How do I troubleshoot an Ingress that returns 404 or 502?',
    a: '404: check that the Ingress path rules match the request path exactly (regex vs prefix); check backend serviceName and servicePort match an existing Service. 502 Bad Gateway: the Ingress controller reached the Service but got an error — check pod logs and kubectl get endpoints to verify pods are running. Check Ingress controller logs: kubectl logs -n ingress-nginx deploy/ingress-nginx-controller. Use kubectl describe ingress to see annotations and backend configuration.',
  },
  { q: 'How do you diagnose a pod stuck in Pending state?', a: 'kubectl describe pod pod-name is the first command; check the Events section at the bottom. Common causes: (1) Insufficient resources: no nodes have enough CPU or memory - scale the node group or reduce resource requests. (2) No matching nodes for nodeSelector or affinity rules - check node labels with kubectl get nodes --show-labels. (3) PVC not bound - kubectl describe pvc pvc-name shows if StorageClass is missing or quota is exceeded. (4) Image pull failure showing as ImagePullBackOff - check image name, tag, and registry credentials via imagePullSecrets. (5) Pod disruption budget blocking scheduling - check PDBs in the namespace.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Always start with kubectl describe pod — the Events section reveals root cause. CrashLoop: logs --previous. Pending: resource/taint. <none> endpoints: label mismatch. Exit 137: OOMKilled.',
  mustKnow: [
    'kubectl describe pod: Events section is the root cause for most issues',
    'CrashLoopBackOff: check kubectl logs --previous + exit code (137=OOM, 1=app error)',
    'Pending: describe shows "Insufficient memory/cpu" or taint not tolerated',
    'ImagePullBackOff: wrong image name/tag or missing imagePullSecret',
    'kubectl get endpoints: <none> = selector label mismatch between Service and pods',
    'kubectl port-forward svc/<name>: test Service locally, bypassing Ingress',
  ],
  interviewFocus: [
    'Walk me through how you would diagnose a CrashLoopBackOff pod.',
    'A pod is Pending — what are the possible causes and how do you identify which one?',
    'What does exit code 137 mean and how do you fix it?',
    'A Service connection is failing — what is the first thing you check?',
  ],
};

@Component({
  selector: 'app-k8s-troubleshooting',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent,
    PageCompleteComponent,
  ],
  templateUrl: './troubleshooting.html',
  styleUrl: './troubleshooting.scss',
})
export class K8sTroubleshooting {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
