import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';

@Component({
  selector: 'app-devops-kubernetes-deployments',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './kubernetes-deployments.html',
  styleUrl: './kubernetes-deployments.scss'
})
export class DevopsKubernetesDeployments {

  quickRef: QuickRefItem[] = [
    { name: 'kubectl apply -f', type: 'syntax', desc: 'Apply manifest file(s) declaratively; idempotent — safe to re-run' },
    { name: 'kubectl rollout status', type: 'syntax', desc: 'Wait for a Deployment rollout to finish; non-zero exit on failure' },
    { name: 'kubectl rollout undo', type: 'syntax', desc: 'Roll back a Deployment to the previous ReplicaSet revision' },
    { name: 'helm install / upgrade', type: 'syntax', desc: 'Install or upgrade a Helm release; --atomic rolls back on failure' },
    { name: 'helm rollback', type: 'syntax', desc: 'Revert a release to a previous revision stored in Helm history' },
    { name: 'Kustomize overlay', type: 'keyword', desc: 'Layer environment-specific patches over a base without forking it' },
    { name: 'kustomize build | kubectl apply', type: 'syntax', desc: 'Render Kustomize and apply in one pipeline step' },
    { name: 'RollingUpdate strategy', type: 'keyword', desc: 'Default Deployment strategy; gradually replaces old Pods with new ones' },
    { name: 'maxSurge / maxUnavailable', type: 'keyword', desc: 'Control rollout speed: surge = extra Pods allowed, unavailable = Pods that can be down' },
    { name: 'readinessProbe', type: 'keyword', desc: 'Gate traffic to a Pod until it reports Ready; prevents bad deploys serving requests' },
    { name: 'ArgoCD sync', type: 'keyword', desc: 'Reconcile cluster state to the Git-declared desired state' },
    { name: 'Flux HelmRelease', type: 'keyword', desc: 'Custom resource that declares a Helm chart release managed by Flux' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Deployment strategies in Kubernetes',
      points: [
        'RollingUpdate (default): replaces old Pods gradually, zero downtime, configurable with maxSurge and maxUnavailable. Safe for stateless services.',
        'Recreate: terminates all old Pods then creates new ones. Brief downtime; use when old and new versions cannot run simultaneously (breaking schema changes).',
        'Blue/Green: run two identical environments simultaneously; cut traffic over instantly via a Service selector swap or Ingress weight update. Instant rollback by switching back.',
        'Canary: route a small percentage of traffic to the new version first; observe metrics; gradually shift 100%. Argo Rollouts or Flagger automates the analysis and promotion.',
        'A/B testing differs from canary: route specific users (by header, cookie, region) rather than a percentage. Requires a smart proxy (nginx, Istio, AWS ALB) that can inspect request metadata.',
      ]
    },
    {
      heading: 'Probes — the deployment safety net',
      points: [
        'readinessProbe: Kubernetes only sends traffic to a Pod when this probe succeeds. Critical during rolling updates — prevents routing to partially started Pods.',
        'livenessProbe: Kubernetes restarts a Pod if this probe fails. Use for detecting deadlocks or infinite loops that don\'t crash the process.',
        'startupProbe: gives slow-starting applications time to initialise before liveness checks begin. Prevents premature restarts on first boot.',
        'Always configure readinessProbe in production. A Deployment with a wrong image tag will stall with 0 ready replicas rather than serving errors — much safer than a crashloop that briefly serves traffic.',
        'Probe types: HTTP GET (most common), TCP socket, exec (run a command inside the container). Prefer httpGet /healthz with a dedicated lightweight handler.',
      ]
    },
    {
      heading: 'Helm — the Kubernetes package manager',
      points: [
        'Helm packages Kubernetes manifests into Charts — versioned, parameterisable bundles. A Chart defines templates; values.yaml provides defaults; users override with -f custom-values.yaml or --set.',
        'helm upgrade --install is the idempotent CD command: installs on first run, upgrades on subsequent runs with the same release name.',
        '--atomic rolls back automatically if any resource fails to become ready within a timeout — prevents half-deployed releases.',
        'Helm history tracks all revisions; helm rollback <release> <revision> reverts to any prior state in seconds.',
        'Chart repositories: Helm Hub / Artifact Hub aggregates public charts; organisations host private charts in OCI-compatible registries (ACR, ECR, GHCR).',
      ]
    },
    {
      heading: 'Kustomize — overlays without templating',
      points: [
        'Kustomize uses overlays rather than templates: a base directory contains vanilla manifests, overlays add/patch only what differs per environment.',
        'Patches can be strategic merge patches (JSON/YAML that merges into the base object) or JSON patches (surgical field-level edits). No Go template syntax required.',
        'Kustomize is built into kubectl since 1.14: kubectl apply -k ./overlays/production.',
        'Common overlay changes: image tags (newTag: v1.2.3), replica count, resource limits, namespace, ConfigMap values.',
        'Use Kustomize when: the same chart is deployed many times with minor per-environment differences and you don\'t need a full package manager (no versioning, no repo). Use Helm when packaging for distribution.',
      ]
    },
    {
      heading: 'kubectl in CI/CD pipelines',
      points: [
        'Authenticate the pipeline to the cluster using a short-lived kubeconfig written from a CI secret (KUBECONFIG env var or --kubeconfig flag) or a cloud provider\'s CLI (az aks get-credentials, aws eks update-kubeconfig).',
        'Use a dedicated ServiceAccount with least-privilege RBAC — not cluster-admin. Scope permissions to the single namespace being deployed.',
        'kubectl set image deployment/myapp app=registry/image:SHA is a fast image swap that preserves all other manifest fields and triggers a rolling update.',
        'kubectl rollout status deployment/myapp --timeout=120s: returns exit code 0 on success, 1 on timeout. Wire to pipeline failure gate.',
        'For GitOps, the pipeline should not run kubectl directly — it should update the image tag in the Git manifest file and commit. ArgoCD/Flux then detects the change and reconciles.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'kubectl + Helm Deploy Pipeline',
      language: 'bash',
      code: `# ─── GitHub Actions: deploy to Kubernetes ────────────────────────────────────

# .github/workflows/deploy.yml (triggered after image push)
name: Deploy to Kubernetes

on:
  workflow_run:
    workflows: ["Docker Build & Push"]
    types: [completed]
    branches: [main]

jobs:
  deploy:
    if: \$\{\{ github.event.workflow_run.conclusion == 'success' }}
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Configure kubectl
        run: |
          mkdir -p ~/.kube
          echo "\$\{\{ secrets.KUBECONFIG }}" | base64 -d > ~/.kube/config

      # ── Option A: kubectl set image (fastest for single-image updates) ──────
      - name: Update deployment image
        run: |
          IMAGE=ghcr.io/\$\{\{ github.repository }}:\$\{\{ github.sha }}
          kubectl set image deployment/myapp app=\${IMAGE} -n production
          kubectl rollout status deployment/myapp -n production --timeout=120s

      # ── Option B: Helm upgrade (preferred for complex releases) ─────────────
      - name: Helm upgrade
        uses: azure/setup-helm@v4
        with:
          version: '3.14.0'

      - name: Deploy with Helm
        run: |
          helm upgrade --install myapp ./charts/myapp \\
            --namespace production \\
            --set image.tag=\$\{\{ github.sha }} \\
            --set replicaCount=3 \\
            --atomic \\
            --timeout 120s \\
            --wait

      # ── Rollback on failure (Helm handles this with --atomic) ────────────────
      - name: Rollback on failure
        if: failure()
        run: |
          helm rollback myapp -n production
          kubectl rollout status deployment/myapp -n production

# ─── Kubernetes Deployment manifest ──────────────────────────────────────────

# k8s/deployment.yaml
# apiVersion: apps/v1
# kind: Deployment
# metadata:
#   name: myapp
#   namespace: production
# spec:
#   replicas: 3
#   selector:
#     matchLabels:
#       app: myapp
#   strategy:
#     type: RollingUpdate
#     rollingUpdate:
#       maxSurge: 1
#       maxUnavailable: 0        # never take a Pod offline during rollout
#   template:
#     metadata:
#       labels:
#         app: myapp
#     spec:
#       containers:
#       - name: app
#         image: ghcr.io/org/myapp:WILL_BE_REPLACED_BY_CI
#         ports:
#         - containerPort: 3000
#         readinessProbe:
#           httpGet:
#             path: /healthz
#             port: 3000
#           initialDelaySeconds: 5
#           periodSeconds: 10
#         livenessProbe:
#           httpGet:
#             path: /healthz
#             port: 3000
#           initialDelaySeconds: 15
#           periodSeconds: 30
#         resources:
#           requests:
#             cpu: "100m"
#             memory: "128Mi"
#           limits:
#             cpu: "500m"
#             memory: "512Mi"`,
    },
    {
      label: 'Kustomize Overlays',
      language: 'bash',
      code: `# ─── Directory structure ─────────────────────────────────────────────────────
# k8s/
# ├── base/
# │   ├── kustomization.yaml
# │   ├── deployment.yaml
# │   └── service.yaml
# └── overlays/
#     ├── staging/
#     │   ├── kustomization.yaml
#     │   └── replicas-patch.yaml
#     └── production/
#         ├── kustomization.yaml
#         └── replicas-patch.yaml

# ─── base/kustomization.yaml ─────────────────────────────────────────────────
# apiVersion: kustomize.config.k8s.io/v1beta1
# kind: Kustomization
# resources:
#   - deployment.yaml
#   - service.yaml

# ─── overlays/production/kustomization.yaml ───────────────────────────────────
# apiVersion: kustomize.config.k8s.io/v1beta1
# kind: Kustomization
# namePrefix: prod-
# namespace: production
# resources:
#   - ../../base
# images:
#   - name: ghcr.io/org/myapp
#     newTag: "abc1234"         # CI updates this field via kustomize edit set image
# patches:
#   - path: replicas-patch.yaml

# ─── overlays/production/replicas-patch.yaml ─────────────────────────────────
# apiVersion: apps/v1
# kind: Deployment
# metadata:
#   name: myapp
# spec:
#   replicas: 5

# ─── overlays/staging/kustomization.yaml ─────────────────────────────────────
# apiVersion: kustomize.config.k8s.io/v1beta1
# kind: Kustomization
# namePrefix: stg-
# namespace: staging
# resources:
#   - ../../base
# images:
#   - name: ghcr.io/org/myapp
#     newTag: "abc1234"

# ─── CI pipeline steps using Kustomize ───────────────────────────────────────

# Update image tag in the overlay (modifies kustomization.yaml in-place)
cd k8s/overlays/production
kustomize edit set image ghcr.io/org/myapp:new-sha-here

# Preview what will be applied (diff against cluster)
kubectl diff -k k8s/overlays/production

# Apply the overlay
kubectl apply -k k8s/overlays/production

# Or render to stdout for GitOps (pipe to git commit)
kustomize build k8s/overlays/production | kubectl apply -f -

# ─── GitHub Actions Kustomize step ───────────────────────────────────────────
# - name: Update image tag and apply
#   run: |
#     cd k8s/overlays/production
#     kustomize edit set image ghcr.io/org/myapp=ghcr.io/org/myapp:\$\{\{ github.sha }}
#     kubectl apply -k .
#     kubectl rollout status deployment/prod-myapp -n production --timeout=120s`,
    },
    {
      label: 'Canary with Argo Rollouts',
      language: 'bash',
      code: `# ─── Argo Rollouts Canary Rollout resource ───────────────────────────────────

# apiVersion: argoproj.io/v1alpha1
# kind: Rollout
# metadata:
#   name: myapp
#   namespace: production
# spec:
#   replicas: 10
#   selector:
#     matchLabels:
#       app: myapp
#   template:
#     metadata:
#       labels:
#         app: myapp
#     spec:
#       containers:
#       - name: app
#         image: ghcr.io/org/myapp:abc1234
#         readinessProbe:
#           httpGet: { path: /healthz, port: 3000 }
#   strategy:
#     canary:
#       steps:
#       - setWeight: 10        # send 10% traffic to new version
#       - pause: { duration: 2m }
#       - analysis:            # automated metric analysis
#           templates:
#           - templateName: success-rate
#       - setWeight: 50        # 50% traffic if analysis passed
#       - pause: { duration: 5m }
#       - setWeight: 100       # full traffic
#       canaryService: myapp-canary
#       stableService: myapp-stable

# ─── AnalysisTemplate: check success rate via Prometheus ─────────────────────

# apiVersion: argoproj.io/v1alpha1
# kind: AnalysisTemplate
# metadata:
#   name: success-rate
# spec:
#   metrics:
#   - name: success-rate
#     interval: 30s
#     successCondition: result[0] >= 0.95    # >= 95% success rate
#     failureLimit: 3
#     provider:
#       prometheus:
#         address: http://prometheus:9090
#         query: |
#           sum(rate(http_requests_total{job="myapp",status!~"5.."}[5m]))
#           /
#           sum(rate(http_requests_total{job="myapp"}[5m]))

# ─── Manual Rollout commands ──────────────────────────────────────────────────

# Watch rollout progress
kubectl argo rollouts get rollout myapp -n production --watch

# Abort and roll back immediately
kubectl argo rollouts abort myapp -n production

# Promote (skip remaining steps and go full traffic)
kubectl argo rollouts promote myapp -n production

# ─── CI pipeline: update image in Rollout ────────────────────────────────────
# kubectl argo rollouts set image myapp app=ghcr.io/org/myapp:\$\{\{ github.sha }} -n production
# kubectl argo rollouts status myapp -n production --timeout=600s`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'No readinessProbe on the deployment',
      wrong: `spec:
  containers:
  - name: app
    image: myapp:v2
    # No readinessProbe`,
      right: `spec:
  containers:
  - name: app
    image: myapp:v2
    readinessProbe:
      httpGet:
        path: /healthz
        port: 3000
      initialDelaySeconds: 5
      periodSeconds: 10`,
      explanation: 'Without a readinessProbe, Kubernetes routes traffic to a Pod as soon as it starts — before the application is ready. A slow start or bad config will cause requests to fail. readinessProbe gates traffic so Pods only receive requests when they report ready.',
    },
    {
      title: 'Using kubectl apply in a GitOps setup',
      wrong: `# CD pipeline applies manifests directly
kubectl apply -f k8s/deployment.yaml
kubectl set image deployment/myapp app=myapp:new-tag`,
      right: `# Pipeline commits the new tag to Git
kustomize edit set image myapp:new-sha
git commit -am "deploy: update image to new-sha"
git push
# ArgoCD/Flux detects the change and reconciles`,
      explanation: 'In a GitOps model, Git is the single source of truth. Pipelines that directly kubectl apply bypass the audit trail, diff visibility, and drift detection that GitOps provides. Update Git; let the GitOps controller apply.',
    },
    {
      title: 'Using cluster-admin for the CI service account',
      wrong: `# RBAC for CI pipeline
kind: ClusterRoleBinding
roleRef:
  kind: ClusterRole
  name: cluster-admin     # full cluster access`,
      right: `kind: Role
metadata:
  namespace: production
rules:
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get","patch","update"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get","list"]`,
      explanation: 'Granting cluster-admin to a CI pipeline means a compromised pipeline secret gives an attacker full control of the cluster. Use a namespaced Role with the minimum verbs needed: update images in one namespace, not delete namespaces across the cluster.',
    },
    {
      title: 'No resource requests/limits on containers',
      wrong: `containers:
- name: app
  image: myapp:v2
  # No resources block`,
      right: `containers:
- name: app
  image: myapp:v2
  resources:
    requests:
      cpu: "100m"
      memory: "128Mi"
    limits:
      cpu: "500m"
      memory: "512Mi"`,
      explanation: 'Without resource requests, the scheduler cannot make intelligent placement decisions. Without limits, a misbehaving container can starve other Pods on the node. Requests are also required for Pod Disruption Budgets and Horizontal Pod Autoscaling to work correctly.',
    },
    {
      title: 'Not waiting for rollout completion in CI',
      wrong: `kubectl set image deployment/myapp app=myapp:new-tag -n production
echo "Deployed!"   # exits 0 even if rollout fails`,
      right: `kubectl set image deployment/myapp app=myapp:new-tag -n production
kubectl rollout status deployment/myapp -n production --timeout=120s
# Exit code 1 if rollout fails — pipeline fails too`,
      explanation: 'kubectl set image returns immediately after updating the spec. Without rollout status, your pipeline reports success while Pods may still be crashing. Always wait for the rollout to finish and fail the pipeline if it does not converge.',
    },
  ];

  challenge: Challenge = {
    title: 'Rollout Risk Analyser',
    language: 'typescript',
    description: `Analyse a Kubernetes deployment configuration and return a risk report.

Given a deployment config object, check for these risks and their severity:
1. No readinessProbe → "critical": "Pods will receive traffic before they are ready"
2. No resource limits → "high": "Container can consume unbounded CPU/memory"
3. No resource requests → "high": "Scheduler cannot make optimal placement decisions"
4. maxUnavailable === 0 AND maxSurge === 0 → "critical": "RollingUpdate will stall — can never start new Pods"
5. image tag ends with ':latest' → "medium": "Mutable tag breaks rollback and cache invalidation"
6. replicas === 1 → "medium": "Single replica has no fault tolerance"
7. No livenessProbe → "low": "Deadlocked containers will not be restarted"

Return: { risks: { severity, message }[], score: number }
Score = 100 - (critical × 25 + high × 15 + medium × 10 + low × 5), minimum 0.`,
    hints: [
      'Define the DeploymentConfig interface with nested objects for strategy, container, resources.',
      'Use optional chaining (?.) to safely access nested fields like container?.readinessProbe.',
      'For the stall check, look at rollingUpdate.maxUnavailable AND maxSurge both being 0.',
      'Score = max(0, 100 - penalties). Return it alongside the risks array.',
    ],
    starterCode: `interface RollingUpdate { maxSurge: number; maxUnavailable: number; }
interface Probe { path: string; port: number; }
interface Resources { requests?: { cpu: string; memory: string }; limits?: { cpu: string; memory: string }; }
interface ContainerSpec { image: string; readinessProbe?: Probe; livenessProbe?: Probe; resources?: Resources; }
interface DeploymentConfig {
  replicas: number;
  strategy: { type: 'RollingUpdate' | 'Recreate'; rollingUpdate?: RollingUpdate; };
  container: ContainerSpec;
}

interface Risk { severity: 'critical' | 'high' | 'medium' | 'low'; message: string; }
interface Report { risks: Risk[]; score: number; }

function analyseRollout(config: DeploymentConfig): Report {
  const risks: Risk[] = [];

  // TODO: check all 7 risk conditions

  const penalties = { critical: 25, high: 15, medium: 10, low: 5 };
  const score = Math.max(0, 100 - risks.reduce((s, r) => s + penalties[r.severity], 0));
  return { risks, score };
}

// Test
const config: DeploymentConfig = {
  replicas: 1,
  strategy: { type: 'RollingUpdate', rollingUpdate: { maxSurge: 0, maxUnavailable: 0 } },
  container: {
    image: 'myapp:latest',
    resources: { requests: { cpu: '100m', memory: '128Mi' } },
  },
};
const report = analyseRollout(config);
console.log('Score:', report.score);
report.risks.forEach(r => console.log(\`[\${r.severity.toUpperCase()}] \${r.message}\`));`,
    solution: `interface RollingUpdate { maxSurge: number; maxUnavailable: number; }
interface Probe { path: string; port: number; }
interface Resources { requests?: { cpu: string; memory: string }; limits?: { cpu: string; memory: string }; }
interface ContainerSpec { image: string; readinessProbe?: Probe; livenessProbe?: Probe; resources?: Resources; }
interface DeploymentConfig {
  replicas: number;
  strategy: { type: 'RollingUpdate' | 'Recreate'; rollingUpdate?: RollingUpdate; };
  container: ContainerSpec;
}

interface Risk { severity: 'critical' | 'high' | 'medium' | 'low'; message: string; }
interface Report { risks: Risk[]; score: number; }

function analyseRollout(config: DeploymentConfig): Report {
  const risks: Risk[] = [];
  const { container, strategy, replicas } = config;
  const ru = strategy.rollingUpdate;

  if (!container.readinessProbe) {
    risks.push({ severity: 'critical', message: 'No readinessProbe: Pods will receive traffic before they are ready' });
  }
  if (ru && ru.maxUnavailable === 0 && ru.maxSurge === 0) {
    risks.push({ severity: 'critical', message: 'RollingUpdate will stall: maxUnavailable=0 and maxSurge=0 means no Pods can be replaced' });
  }
  if (!container.resources?.limits) {
    risks.push({ severity: 'high', message: 'No resource limits: container can consume unbounded CPU/memory and starve other Pods' });
  }
  if (!container.resources?.requests) {
    risks.push({ severity: 'high', message: 'No resource requests: scheduler cannot make optimal placement decisions' });
  }
  if (container.image.endsWith(':latest')) {
    risks.push({ severity: 'medium', message: 'Image tagged :latest — mutable tag breaks rollback and Docker layer cache' });
  }
  if (replicas === 1) {
    risks.push({ severity: 'medium', message: 'Single replica: no fault tolerance; node failure causes downtime' });
  }
  if (!container.livenessProbe) {
    risks.push({ severity: 'low', message: 'No livenessProbe: deadlocked containers will not be automatically restarted' });
  }

  const penalties = { critical: 25, high: 15, medium: 10, low: 5 };
  const score = Math.max(0, 100 - risks.reduce((s, r) => s + penalties[r.severity], 0));
  return { risks, score };
}

const config: DeploymentConfig = {
  replicas: 1,
  strategy: { type: 'RollingUpdate', rollingUpdate: { maxSurge: 0, maxUnavailable: 0 } },
  container: {
    image: 'myapp:latest',
    resources: { requests: { cpu: '100m', memory: '128Mi' } },
  },
};
const report = analyseRollout(config);
console.log('Score:', report.score);   // 0 (capped)
report.risks.forEach(r => console.log(\`[\${r.severity.toUpperCase()}] \${r.message}\`));
// [CRITICAL] No readinessProbe
// [CRITICAL] RollingUpdate will stall
// [HIGH] No resource limits
// [MEDIUM] Image tagged :latest
// [MEDIUM] Single replica
// [LOW] No livenessProbe`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does maxUnavailable: 0 mean in a Kubernetes RollingUpdate strategy?',
      options: [
        'The rollout will not start until all existing Pods are terminated',
        'No existing Pods will be terminated until new Pods are Ready — zero downtime rolling update',
        'Only 0% of new Pods will be created during the update',
        'The rollout is paused until manually resumed',
      ],
      answer: 1,
      explanation: 'maxUnavailable: 0 means no Pod from the existing ReplicaSet will be taken offline until there is a replacement Ready to serve traffic. Combined with maxSurge: 1, Kubernetes creates one extra Pod first, waits for it to be Ready, then terminates one old Pod — strictly zero downtime.',
    },
    {
      q: 'What is the key difference between Helm and Kustomize?',
      options: [
        'Helm runs only on AWS; Kustomize runs on any cloud',
        'Helm uses Go templates and chart versioning; Kustomize patches plain YAML without templating',
        'Kustomize requires a Helm chart to exist before it can work',
        'Helm only supports single-environment deployments',
      ],
      answer: 1,
      explanation: 'Helm uses Go templates ({{ .Values.image.tag }}) and versioned Charts in repositories — ideal for distributable packages. Kustomize overlays plain YAML without templating — simpler and built into kubectl. Helm is better for packaging for distribution; Kustomize is better for internal multi-environment ops.',
    },
    {
      q: 'Why should a CI/CD pipeline wait for kubectl rollout status before reporting success?',
      options: [
        'kubectl apply is asynchronous; the status check confirms the Pods are actually Running and Ready',
        'kubectl rollout status compresses the image to reduce registry storage',
        'Kubernetes requires status confirmation before accepting the next deployment',
        'It prevents the next PR from being merged until deployment is complete',
      ],
      answer: 0,
      explanation: 'kubectl apply/set image updates the Deployment spec immediately and returns. The actual Pod replacement happens asynchronously. Without rollout status --timeout, the pipeline exits 0 even if all new Pods crashloop. The status check blocks until all replicas are Ready or the timeout is reached.',
    },
    {
      q: 'In an Argo Rollouts canary strategy, what triggers an automatic rollback?',
      options: [
        'The new image has a different tag than the current image',
        'An AnalysisTemplate metric breaches its successCondition within the configured failureLimit',
        'More than 10% of nodes are reporting NotReady',
        'The rollout has been running for longer than the pause duration',
      ],
      answer: 1,
      explanation: 'Argo Rollouts evaluates AnalysisTemplate metrics (e.g., Prometheus success rate) during canary steps. If the metric fails successCondition more than failureLimit times, the rollout is automatically aborted and the traffic weight is returned to 0% for the new version.',
    },
    {
      q: 'Which RBAC scope is appropriate for a CI pipeline service account deploying to one namespace?',
      options: [
        'ClusterRole: cluster-admin — it needs to manage images across all namespaces',
        'ClusterRole: view — read access to all resources everywhere',
        'Role scoped to the target namespace with only update/patch on Deployments',
        'No RBAC needed — pipeline uses the default service account',
      ],
      answer: 2,
      explanation: 'Least-privilege: the pipeline only needs to update Deployment images and check rollout status in one namespace. A namespaced Role with verbs: [get, patch, update] on apps/deployments and [get, list] on pods gives exactly what is needed without exposing the rest of the cluster.',
    },
    {
      q: 'What does maxUnavailable: 0 in a rolling update strategy ensure?',
      options: [
        'That all old pods are replaced simultaneously',
        'That zero old pods are terminated until at least one new pod is ready — no capacity is lost during the rollout',
        'That the deployment never updates automatically',
        'That rollbacks are disabled'],
      answer: 1,
      explanation: 'maxUnavailable: 0 means Kubernetes cannot terminate any old pod until a new pod passes its readiness probe. Combined with maxSurge: 1 (one extra pod during rollout), the deployment always maintains full desired capacity. This is the safest rolling update: capacity never drops below 100%. Downside: rollout takes longer. For zero-downtime deployments where losing even one pod\'s capacity is unacceptable (e.g., running at capacity), use maxUnavailable: 0.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between a Deployment and a StatefulSet?',
      a: 'Deployments manage stateless workloads: Pods are interchangeable, can be created/deleted in any order, and share a single Service endpoint. StatefulSets manage stateful workloads: each Pod gets a stable hostname (pod-0, pod-1), stable storage (PersistentVolumeClaim per Pod), and Pods are created/deleted in order. Use StatefulSets for databases, Kafka, Elasticsearch — anything that needs pod identity or stable storage.',
    },
    {
      q: 'How do you roll back a failed Helm release?',
      a: 'helm rollback <release-name> [revision] -n <namespace>. Without a revision number, Helm rolls back to the previous release. View history with helm history <release-name>. If you deployed with --atomic, Helm automatically rolls back on any resource failure within the timeout. For manual rollback after the fact, helm history shows all revisions with their status.',
    },
    {
      q: 'What is a Pod Disruption Budget (PDB) and when is it important?',
      a: 'A PDB limits how many Pods of a Deployment can be unavailable simultaneously during voluntary disruptions (node drain, cluster upgrades). Example: minAvailable: 2 ensures at least 2 Pods are always Running during a drain. Without a PDB, a cluster upgrade might drain nodes aggressively and take all replicas offline. PDBs are critical for high-availability workloads and should be defined alongside the Deployment.',
    },
    {
      q: 'How does kubectl diff help before applying changes?',
      a: 'kubectl diff -f manifest.yaml or kubectl diff -k ./overlays/prod shows a unified diff of what will change in the cluster without applying anything. It compares the submitted manifest against the live object in the cluster using the same server-side apply logic. Use it in CI as a plan step — output the diff as a PR comment so reviewers can see exactly what Kubernetes will change before approving the deployment.',
    },
    {
      q: 'What is image pull policy and which setting should production use?',
      a: 'imagePullPolicy controls when Kubernetes pulls the container image: Always (pull on every Pod start), IfNotPresent (pull only if not cached on the node), Never (never pull — must be pre-pulled). Production should use IfNotPresent with immutable SHA-tagged images. Always causes unnecessary registry roundtrips and introduces registry availability as a dependency for Pod scheduling. Never risks stale or absent images. IfNotPresent + SHA tags = cached after first pull, always the correct version.',
    },
    {
      q: 'What is a PodDisruptionBudget (PDB) and why is it important for deployments?',
      a: 'A PodDisruptionBudget limits the number of pods of a deployment that can be unavailable simultaneously during voluntary disruptions (node upgrades, rolling deployments, cluster scaling). spec.minAvailable: 2 means at least 2 replicas must always be running; Kubernetes will not evict more pods than this allows. Without a PDB: a node upgrade might evict all pods of a stateful application simultaneously, causing downtime. With PDB: Kubernetes evicts pods one at a time, waiting for replacements. Set PDB for any stateful service or service with strict availability requirements. PDBs do not prevent involuntary disruptions (hardware failures, OOM kills) — only voluntary ones like kubectl drain.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Deploy to Kubernetes from CI/CD using kubectl, Helm, and Kustomize — with probes, RBAC, and rollout safety gates.',
    mustKnow: [
      'RollingUpdate: maxUnavailable=0 + maxSurge=1 = zero-downtime rollout; Recreate = brief downtime',
      'readinessProbe gates traffic; livenessProbe restarts deadlocked containers; startupProbe covers slow starts',
      'kubectl rollout status --timeout=120s: fail the pipeline if the rollout does not converge',
      'Helm --atomic auto-rolls back on failure; helm rollback <name> <revision> for manual rollback',
      'Kustomize overlays: patch only environment differences; kustomize edit set image updates the tag in-place',
      'CI RBAC: namespaced Role, not cluster-admin — scope to update/patch Deployments in one namespace',
      'In GitOps: pipeline commits the image tag to Git; ArgoCD/Flux applies — do NOT kubectl apply in the pipeline',
    ],
    interviewFocus: [
      'Explain the difference between RollingUpdate, Blue/Green, and Canary — when to use each',
      'Why is readinessProbe required for zero-downtime deployments? What happens without it?',
      'How does Helm --atomic improve CD safety compared to plain kubectl apply?',
      'In a GitOps workflow, what does the pipeline do vs. what does ArgoCD do?',
    ],
  };
}
