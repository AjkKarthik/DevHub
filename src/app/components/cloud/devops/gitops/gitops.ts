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
  selector: 'app-devops-gitops',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './gitops.html',
  styleUrl: './gitops.scss'
})
export class DevopsGitops {

  quickRef: QuickRefItem[] = [
    { name: 'GitOps',              type: 'keyword', desc: 'Operational model using Git as the single source of truth for declarative infrastructure and application config' },
    { name: 'Reconciliation',      type: 'keyword', desc: 'Continuous loop: GitOps agent compares desired state (Git) with actual state (cluster) and corrects drift' },
    { name: 'ArgoCD',              type: 'keyword', desc: 'Kubernetes-native GitOps tool: watches a Git repo, syncs manifests to cluster, shows health in UI' },
    { name: 'Flux',                type: 'keyword', desc: 'CNCF GitOps toolkit: operator set that reconciles Git repos, Helm charts, and OCI artifacts to Kubernetes' },
    { name: 'Sync Policy',         type: 'keyword', desc: 'ArgoCD setting: manual (approve PRs to sync) or automated (auto-apply every 3 minutes)' },
    { name: 'Health Status',       type: 'keyword', desc: 'ArgoCD reports: Healthy, Progressing, Degraded, Suspended, Missing — per resource' },
    { name: 'Application CRD',     type: 'keyword', desc: 'ArgoCD Application custom resource: defines source repo, target cluster, and sync policy' },
    { name: 'Kustomization',       type: 'keyword', desc: 'Flux CRD: defines a set of Kubernetes manifests to apply from a GitRepository source' },
    { name: 'HelmRelease',         type: 'keyword', desc: 'Flux CRD: manages a Helm chart release — upgrades automatically when chart or values change in Git' },
    { name: 'Image Automation',    type: 'keyword', desc: 'Flux feature: watches a container registry, updates image tags in Git automatically on new push' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is GitOps?',
      points: [
        'GitOps is an operational model defined by Weaveworks (2017): Git is the single source of truth for both application code and infrastructure configuration.',
        'The four GitOps principles (OpenGitOps): (1) Declarative — desired state described in files. (2) Versioned — stored in Git, immutable history. (3) Pulled automatically — agents pull and apply, not CI/CD pushing. (4) Continuously reconciled — agents detect and correct drift.',
        'Key shift from traditional CD: traditional CD pushes changes to the cluster (CI/CD agent runs kubectl apply). GitOps pulls — an agent inside the cluster watches Git and applies changes.',
        'Benefits: audit trail built into git history, rollback = `git revert`, cluster state always matches Git, no cluster credentials needed in CI/CD pipeline.',
        'GitOps is specifically for Kubernetes/container workloads. It is not a general-purpose deployment tool — use traditional CD for serverless, VMs, or non-K8s targets.',
      ]
    },
    {
      heading: 'ArgoCD',
      points: [
        'ArgoCD is a declarative GitOps tool for Kubernetes. It watches a Git repository and ensures the cluster state matches the manifests in that repo.',
        'Core concept: an `Application` CRD defines source (Git repo + path + branch) and destination (cluster + namespace). ArgoCD continuously reconciles the two.',
        'Sync: when Git changes, ArgoCD compares current cluster state with desired Git state and shows a diff. Manual sync: human approves. Automated sync: applies immediately.',
        'Health: ArgoCD evaluates each Kubernetes resource\'s health: Deployment healthy = all pods running; Degraded = pods crashing or not enough replicas.',
        'Rollback: in ArgoCD UI, click "Rollback" → select a previous sync revision → ArgoCD re-applies those manifests. Alternatively: `git revert` the commit and ArgoCD auto-syncs.',
      ]
    },
    {
      heading: 'Flux',
      points: [
        'Flux is a CNCF graduated project — a set of Kubernetes controllers (operators) that implement GitOps via custom resources.',
        'Flux controllers: Source Controller (watches Git/Helm/OCI), Kustomize Controller (applies manifests), Helm Controller (manages Helm releases), Notification Controller (sends alerts), Image Automation Controller (updates image tags in Git).',
        '`GitRepository` CRD: points Flux at a Git repo + branch. `Kustomization` CRD: tells Flux which path in the repo to apply as a Kustomize overlay.',
        '`HelmRelease` CRD: Flux installs/upgrades a Helm chart when the chart version or values file in Git changes — fully GitOps-native Helm.',
        'Image automation: Flux can watch a container registry for new tags, write the new tag to a file in Git, and then reconcile the cluster — closing the loop without any CI/CD changes.',
      ]
    },
    {
      heading: 'GitOps Repository Patterns',
      points: [
        'Monorepo: all apps and environment configs in one Git repo. Simple for small teams; access control is coarse-grained.',
        'App-of-apps (ArgoCD): a root ArgoCD Application that points to a directory of other Application manifests — hierarchical management of many apps from one repo.',
        'Environment branches: `main` → dev, `staging` branch → staging, `production` branch → prod. Simple but mixes app code and infra config.',
        'Environment directories (recommended): single `main` branch with `environments/dev/`, `environments/staging/`, `environments/prod/` directories. Promotions = copying/merging a manifest change from one directory to the next via PR.',
        'Config repo separate from app repo: app code in `myapp` repo; Kubernetes manifests in `myapp-config` repo. CI updates the config repo after building; ArgoCD watches the config repo. Cleanest separation of concerns.',
      ]
    },
    {
      heading: 'Sync Policies & Auto-Remediation',
      points: [
        'Manual sync (default): ArgoCD shows "OutOfSync" but waits for a human to click Sync. Good for production where you want human review before applying.',
        'Automated sync: ArgoCD applies changes automatically when Git changes. Can also enable `selfHeal: true` — if someone does a manual `kubectl apply` that diverges from Git, ArgoCD reverts it within 3 minutes.',
        '`prune: true`: when a resource is removed from Git, ArgoCD deletes it from the cluster. Without prune, removed manifests are left as orphans.',
        'Sync waves: use `argocd.argoproj.io/sync-wave: "-1"` annotation to control order — databases and CRDs (wave -1) before applications (wave 0).',
        'Flux interval: by default Flux reconciles every 10 minutes. `interval: 1m` on a Kustomization for faster sync; `interval: 1h` for production for cost-efficiency.',
      ]
    },
    {
      heading: 'Secrets in GitOps',
      points: [
        'The GitOps problem: everything in Git, but secrets cannot be in Git (even private repos).',
        'Sealed Secrets (Bitnami): encrypt a Secret with the cluster\'s public key → commit the `SealedSecret` to Git → the controller decrypts it with the private key only inside the cluster.',
        'External Secrets Operator: a CRD (`ExternalSecret`) references a secret in AWS Secrets Manager / Azure Key Vault / HashiCorp Vault. The operator fetches and syncs it as a Kubernetes Secret. The source of truth is the secret store, not Git.',
        'SOPS (Mozilla): encrypt YAML files with AWS KMS, GCP KMS, or age keys before committing. Decrypt at apply time. Works natively with Flux via decryption config.',
        'Best practice: use External Secrets Operator for most teams — it keeps secrets in an audited secret store and avoids encryption key management complexity.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'ArgoCD Application',
      language: 'bash',
      code: `# ArgoCD Application CRD — deploy myapp to production

# argocd-app.yaml:
# apiVersion: argoproj.io/v1alpha1
# kind: Application
# metadata:
#   name: myapp-production
#   namespace: argocd
# spec:
#   project: default
#   source:
#     repoURL: https://github.com/myorg/myapp-config.git
#     targetRevision: main
#     path: environments/production
#   destination:
#     server: https://kubernetes.default.svc
#     namespace: production
#   syncPolicy:
#     automated:
#       prune: true       # delete resources removed from Git
#       selfHeal: true    # revert manual kubectl changes
#     syncOptions:
#     - CreateNamespace=true
#     retry:
#       limit: 3
#       backoff:
#         duration: 5s
#         factor: 2

kubectl apply -f argocd-app.yaml

# Check sync status:
argocd app get myapp-production
argocd app sync myapp-production   # force manual sync
argocd app rollback myapp-production 5  # rollback to revision 5

# App-of-apps pattern — one Application manages many:
# spec.source.path: apps/           # directory of Application YAMLs
# Each Application.yaml in apps/ deploys one microservice`,
    },
    {
      label: 'Flux GitRepository + Kustomization',
      language: 'bash',
      code: `# Bootstrap Flux into a cluster (writes Flux CRDs + controllers to Git):
flux bootstrap github \
  --owner=myorg \
  --repository=fleet-infra \
  --branch=main \
  --path=clusters/production \
  --personal

# GitRepository — tells Flux where to watch:
# apiVersion: source.toolkit.fluxcd.io/v1
# kind: GitRepository
# metadata:
#   name: myapp
#   namespace: flux-system
# spec:
#   interval: 1m
#   url: https://github.com/myorg/myapp-config
#   ref:
#     branch: main
#   secretRef:
#     name: myapp-github-creds

# Kustomization — tells Flux what to apply:
# apiVersion: kustomize.toolkit.fluxcd.io/v1
# kind: Kustomization
# metadata:
#   name: myapp-production
#   namespace: flux-system
# spec:
#   interval: 10m
#   sourceRef:
#     kind: GitRepository
#     name: myapp
#   path: ./environments/production
#   prune: true
#   healthChecks:
#   - apiVersion: apps/v1
#     kind: Deployment
#     name: myapp
#     namespace: production

# Check reconciliation:
flux get kustomizations
flux reconcile kustomization myapp-production --with-source`,
    },
    {
      label: 'Sealed Secrets',
      language: 'bash',
      code: `# Sealed Secrets — encrypt secrets for safe Git storage

# Install Sealed Secrets controller (via Helm):
helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets
helm install sealed-secrets sealed-secrets/sealed-secrets \
  --namespace kube-system

# Install kubeseal CLI:
# Download from https://github.com/bitnami-labs/sealed-secrets/releases

# Fetch the cluster's public key:
kubeseal --fetch-cert \
  --controller-name=sealed-secrets \
  --controller-namespace=kube-system \
  > pub-cert.pem

# Create a regular Kubernetes Secret (DO NOT commit this):
kubectl create secret generic db-credentials \
  --from-literal=password=supersecret \
  --dry-run=client -o yaml > secret.yaml

# Encrypt it with the cluster's public key:
kubeseal --format yaml \
  --cert pub-cert.pem \
  < secret.yaml > sealed-secret.yaml

# NOW safe to commit sealed-secret.yaml to Git:
git add sealed-secret.yaml
git commit -m "feat: add sealed DB credentials"
git push

# ArgoCD/Flux applies the SealedSecret; controller decrypts it to a Secret
# The original secret.yaml is NEVER committed

# To rotate: re-encrypt with current cert, commit new SealedSecret`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Committing plain Kubernetes Secrets to Git',
      wrong: `# apiVersion: v1
# kind: Secret
# metadata:
#   name: db-creds
# data:
#   password: c3VwZXJzZWNyZXQ=   # base64 — NOT encryption!
# Committed to Git: anyone with repo access can decode this`,
      right: `# Option 1: SealedSecret (encrypted with cluster public key)
# kubectl create secret ... --dry-run=client -o yaml | kubeseal > sealed.yaml
# apiVersion: bitnami.com/v1alpha1
# kind: SealedSecret  <-- safe to commit
# spec:
#   encryptedData:
#     password: AgBy3i4OJSWK+PiTySYZZA9rO43cGDEq...

# Option 2: ExternalSecret (reference, not value, in Git)
# kind: ExternalSecret
# spec:
#   secretStoreRef: { name: aws-secrets-manager }
#   data: [{ secretKey: password, remoteRef: { key: prod/db/password } }]`,
      explanation: 'Kubernetes Secrets are base64-encoded, not encrypted. Committing them to Git exposes credentials to anyone with repo access — including if the repo ever becomes public. Use Sealed Secrets (encrypted value in Git) or External Secrets Operator (reference only in Git, value in a secret store).',
    },
    {
      title: 'Manual kubectl apply in a GitOps cluster',
      wrong: `# Ops engineer applies a quick fix directly:
kubectl set image deployment/myapp myapp=myapp:hotfix123
# Works for now...
# 3 minutes later: ArgoCD/Flux reconciles
# Reverts the deployment to what's in Git
# "Why did my fix disappear?!"`,
      right: `# In GitOps: ALL changes go through Git
# 1. Create a PR with the image tag change
# 2. Get reviewed, merge
# 3. ArgoCD/Flux applies it
# For emergencies: use ArgoCD UI to sync a specific revision
# Or: temporarily disable self-heal, apply, then immediately push to Git`,
      explanation: 'With selfHeal enabled, any manual kubectl change that diverges from Git will be reverted within minutes. This is a feature, not a bug — it prevents configuration drift. But it surprises engineers who forget they are in a GitOps cluster. All operational changes must go through Git, even hotfixes.',
    },
    {
      title: 'Storing app code and K8s manifests in the same repo',
      wrong: `# Repo: myapp/
# src/           <- application code
# kubernetes/    <- K8s manifests in the same repo
# Every commit to src/ triggers:
# 1. Docker build
# 2. K8s manifest update (image tag)
# 3. ArgoCD reconcile
# Git history mixes app changes with infra changes — hard to audit`,
      right: `# Two repos:
# myapp/ (app code)         myapp-config/ (K8s manifests)
# CI builds myapp, pushes   ArgoCD watches myapp-config
# image, then opens PR to   Promotions are PRs in myapp-config
# myapp-config updating      independent of app code history
# the image tag`,
      explanation: 'Mixing app code and K8s manifests creates a coupling: every code commit triggers a reconcile even if manifests didn\'t change. Separate repos give clean separation: the config repo\'s git history is a pure audit log of what was deployed and when. Promotions across environments are PRs in the config repo, reviewed by ops.',
    },
    {
      title: 'No sync wave annotations for dependency ordering',
      wrong: `# ArgoCD applies all resources simultaneously:
# - Deployment (depends on ConfigMap and Secret)
# - ConfigMap
# - Secret
# - CRDs (required by Deployments)
# Result: race condition — Deployment may start before ConfigMap exists
# Intermittent sync failures`,
      right: `# Use sync-wave annotations:
# CRDs and namespaces:        sync-wave: "-2"
# ConfigMaps and Secrets:     sync-wave: "-1"
# Deployments and Services:   sync-wave: "0" (default)
# Post-deploy smoke tests:    sync-wave: "1"
# argocd.argoproj.io/sync-wave: "-1"`,
      explanation: 'Without sync waves, ArgoCD applies all resources in a single wave — Deployments may start before their ConfigMaps or CRDs exist. Use `argocd.argoproj.io/sync-wave` annotations to declare ordering: CRDs and namespaces first (wave -2), config before deployments (wave -1), smoke tests after (wave +1).',
    },
    {
      title: 'No health checks on Flux Kustomizations',
      wrong: `# Kustomization applies manifests but has no health checks:
# spec:
#   path: ./environments/production
#   # No healthChecks defined
# Result: Flux reports "Applied" even if the Deployment is crashlooping
# "It's deployed" — but it's not actually healthy`,
      right: `# spec:
#   path: ./environments/production
#   healthChecks:
#   - apiVersion: apps/v1
#     kind: Deployment
#     name: myapp
#     namespace: production
#   # Flux waits until Deployment is Healthy before reporting success
#   # Notifications fire on health state change, not just apply`,
      explanation: 'Without `healthChecks`, Flux reports "Ready" as soon as manifests are applied — even if the Deployment is crash-looping. Add healthChecks to Kustomizations so Flux waits for actual health before reporting success and sends notifications on degraded health.',
    },
    {
      title: 'ArgoCD Application pointing directly at main branch',
      wrong: `# spec:
#   source:
#     repoURL: https://github.com/myorg/myapp-config.git
#     targetRevision: main  # mutable — any push deploys immediately
# Direct push to main = instant production deploy
# No PR review for production manifest changes
# Accidental push can break production`,
      right: `# Production: targetRevision: HEAD with protected branch
# Require PR review before merging to main
# Staging: targetRevision: main (auto-sync)
# Production: targetRevision: main + manual sync (require human approval)
# Or: separate production branch with PR-only merges`,
      explanation: 'Pointing production ArgoCD directly at `main` with automated sync means any direct push to main deploys to production instantly. Use branch protection to require PR reviews, or configure production ArgoCD with manual sync so a human approves each production reconciliation.',
    },
  ];

  challenge: Challenge = {
    title: 'GitOps Drift Detector',
    language: 'typescript',
    description: `Build a function that detects configuration drift between desired state (Git) and actual state (cluster).

Given two arrays of Kubernetes resource specs — desired (from Git) and actual (from cluster) — identify:
1. Missing resources: in desired but not in actual (need to be created)
2. Extra resources: in actual but not in desired (orphaned, need pruning)
3. Drifted resources: in both but with different values (need reconciliation)

A resource is identified by its kind + name combination.`,
    hints: [
      'Build a Map keyed by "kind/name" for both desired and actual arrays',
      'Missing = keys in desired not in actual',
      'Extra = keys in actual not in desired',
      'Drifted = keys in both but values differ (compare replicas and image)',
      'JSON.stringify is good enough for value comparison here',
    ],
    starterCode: `interface K8sResource {
  kind: string;
  name: string;
  replicas?: number;
  image?: string;
}

interface DriftReport {
  missing: K8sResource[];   // in Git, not in cluster
  extra: K8sResource[];     // in cluster, not in Git (orphaned)
  drifted: Array<{ desired: K8sResource; actual: K8sResource }>;
  inSync: number;           // count of resources that match exactly
}

function detectDrift(desired: K8sResource[], actual: K8sResource[]): DriftReport {
  // TODO: implement
  return { missing: [], extra: [], drifted: [], inSync: 0 };
}`,
    solution: `function detectDrift(desired: K8sResource[], actual: K8sResource[]): DriftReport {
  const toKey = (r: K8sResource) => r.kind + '/' + r.name;
  const desiredMap = new Map(desired.map(r => [toKey(r), r]));
  const actualMap  = new Map(actual.map(r  => [toKey(r), r]));

  const missing: K8sResource[] = [];
  const drifted: Array<{desired: K8sResource; actual: K8sResource}> = [];
  let inSync = 0;

  for (const [key, desiredR] of desiredMap) {
    if (!actualMap.has(key)) {
      missing.push(desiredR);
    } else {
      const actualR = actualMap.get(key)!;
      if (JSON.stringify(desiredR) !== JSON.stringify(actualR)) {
        drifted.push({ desired: desiredR, actual: actualR });
      } else {
        inSync++;
      }
    }
  }

  const extra = [...actualMap.keys()]
    .filter(k => !desiredMap.has(k))
    .map(k => actualMap.get(k)!);

  return { missing, extra, drifted, inSync };
}

// Test:
const desired = [
  { kind: 'Deployment', name: 'api',     replicas: 3, image: 'api:v2' },
  { kind: 'Deployment', name: 'worker',  replicas: 2, image: 'worker:v1' },
  { kind: 'Service',    name: 'api-svc', image: undefined },
];
const actual = [
  { kind: 'Deployment', name: 'api',     replicas: 1, image: 'api:v2' },  // drifted replicas
  { kind: 'Deployment', name: 'worker',  replicas: 2, image: 'worker:v1' }, // in sync
  { kind: 'Deployment', name: 'legacy',  replicas: 1, image: 'legacy:v3' }, // extra (orphaned)
];
console.log(detectDrift(desired, actual));
// missing: [Service api-svc], extra: [Deployment legacy], drifted: [api replicas], inSync: 1`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the key architectural difference between traditional CD (push) and GitOps (pull)?',
      options: [
        'Traditional CD stores config in databases; GitOps uses YAML files',
        'Traditional CD: CI/CD pipeline pushes changes to the cluster. GitOps: an agent inside the cluster pulls desired state from Git and applies it',
        'Traditional CD requires manual approval; GitOps is fully automated',
        'GitOps only works with Helm charts; traditional CD works with raw manifests',
      ],
      answer: 1,
      explanation: 'In traditional push-based CD, a CI/CD pipeline (GitHub Actions, Jenkins) holds cluster credentials and pushes changes via kubectl. In GitOps, a controller (ArgoCD, Flux) runs inside the cluster and continuously pulls desired state from Git — the cluster credentials never leave the cluster, and drift is corrected automatically.',
    },
    {
      q: 'What does ArgoCD\'s `selfHeal: true` option do?',
      options: [
        'It automatically fixes failing pods by restarting them',
        'It reverts manual kubectl changes that diverge from the desired state in Git',
        'It automatically merges PRs in the config repository',
        'It scales deployments up when they become unhealthy',
      ],
      answer: 1,
      explanation: 'With `selfHeal: true`, ArgoCD continuously compares actual cluster state with Git and reverts any divergence — including manual `kubectl apply` or `kubectl scale` commands — back to what Git specifies, typically within 3 minutes. This prevents configuration drift but means all changes must go through Git.',
    },
    {
      q: 'Why can\'t you commit plain Kubernetes Secrets to Git in GitOps?',
      options: [
        'Kubernetes Secrets use a format that Git cannot diff correctly',
        'Kubernetes Secrets are base64-encoded (not encrypted) — anyone with repo access can decode the values',
        'ArgoCD does not support applying Secret resources',
        'Git has a 1MB file size limit that Secrets often exceed',
      ],
      answer: 1,
      explanation: 'Kubernetes Secrets are only base64-encoded for transport — not encrypted. Anyone with git clone access can `base64 -d` the value. In GitOps, use Sealed Secrets (encrypted value safe for Git), External Secrets Operator (reference to a secret store, not the value), or SOPS (file-level encryption with KMS keys).',
    },
    {
      q: 'What is the ArgoCD "App of Apps" pattern?',
      options: [
        'An ArgoCD Application that bundles multiple container images into one deployment',
        'A root ArgoCD Application that points to a directory of other Application manifests, enabling hierarchical management of many apps',
        'A Helm chart that deploys ArgoCD along with all your applications in one command',
        'An ArgoCD plugin that synchronises applications across multiple clusters simultaneously',
      ],
      answer: 1,
      explanation: 'App of Apps: a root ArgoCD Application watches a directory of `Application` YAML files. Each of those Applications manages one microservice or component. This enables you to manage an entire fleet of services by pointing ArgoCD at a single root App — add a service by adding an Application YAML to the apps directory.',
    },
    {
      q: 'What is configuration drift in a Kubernetes cluster and how does GitOps prevent it?',
      options: [
        'Drift is when container images become outdated — GitOps prevents it by auto-updating images',
        'Drift is when actual cluster state diverges from desired state — GitOps prevents it via continuous reconciliation that detects and corrects divergence',
        'Drift is when Git branches diverge — GitOps uses branch protection to prevent unauthorized merges',
        'Drift is performance degradation over time — GitOps prevents it by auto-scaling based on Git-defined resource limits',
      ],
      answer: 1,
      explanation: 'Configuration drift occurs when someone makes a direct change to the cluster (kubectl apply, scale, edit) without updating Git — the "source of truth" then disagrees with reality. GitOps controllers continuously compare Git state with cluster state and reconcile any differences, preventing drift from accumulating.',
    },
    {
      q: 'What is the reconciliation loop in GitOps and what does it do?',
      options: [
        'A scheduled backup process for Git repositories',
        'The controller continuously compares actual cluster state with desired state in Git and applies changes to eliminate drift',
        'A merge request approval process',
        'A CI pipeline that runs on every commit'],
      answer: 1,
      explanation: 'The GitOps operator (ArgoCD, Flux) runs a reconciliation loop: observe actual state → compare to desired state in Git → if drift detected, apply changes to make actual = desired. This loop runs continuously (typically every few minutes) or is triggered by Git push events. Crucially, manual kubectl changes are also detected as drift and overwritten — the cluster can only be changed through Git. This guarantees auditability and self-healing.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do you promote a release from staging to production in GitOps?',
      a: 'Promotions in GitOps are Git operations. Common patterns: (1) **Environment directories** — open a PR changing the image tag (or Helm values) in `environments/production/` to match what was validated in `environments/staging/`. ArgoCD/Flux applies it after merge. (2) **Environment branches** — merge changes from the `staging` branch to `production` branch via PR. (3) **CI automation** — CI opens the PR to the config repo automatically after staging smoke tests pass, requiring only human approval. The PR is the deployment decision record — who approved it and when is in Git history.',
    },
    {
      q: 'When should I choose ArgoCD over Flux?',
      a: 'ArgoCD: better UI (visual app health dashboard, sync status, diff view), good for teams that want a central ops console, supports multi-tenant RBAC within the tool, has a CLI (`argocd`) for scripting. Flux: more Kubernetes-native (pure CRD-based, no server component to manage), better Helm native support (`HelmRelease` CRD), image automation built in, used by Microsoft/AWS/GKE for their managed GitOps offerings. Choose ArgoCD if your team values the UI and multi-app management. Choose Flux if you prefer a minimal controller footprint and native Kubernetes tooling. Both implement the same GitOps principles — technical differences are smaller than team preference.',
    },
    {
      q: 'How do you handle a hotfix in GitOps if the normal PR review cycle is too slow?',
      a: 'Option 1 (preferred): Expedite the PR — GitOps PR approval can be fast. Most teams can merge a hotfix PR in under 10 minutes with on-call available. Configure branch protection to require only 1 reviewer for the config repo. Option 2: Temporarily suspend selfHeal on ArgoCD for the specific Application, apply the fix directly, then immediately push the change to Git and re-enable selfHeal. Never leave selfHeal disabled — risk of drift accumulating. Option 3: Use a feature flag to disable the broken feature without redeploying. The worst option: skip Git entirely and apply directly to the cluster, hoping to update Git "later" — it never gets done.',
    },
    {
      q: 'What is Flux image automation and how does it work?',
      a: 'Flux image automation closes the CD loop for container registries. Setup: (1) `ImageRepository` CRD — Flux watches a container registry for new tags. (2) `ImagePolicy` CRD — defines which tags to select (e.g., semver `>=1.0.0`, or regex `main-*`). (3) `ImageUpdateAutomation` CRD — when a new matching tag appears, Flux updates the image reference in a file in Git (with a commit message like "chore: update myapp to v1.2.3") and pushes. ArgoCD/Flux then reconciles the cluster with the new image. This means pushing a new Docker image automatically deploys to the environment — no CI changes needed.',
    },
    {
      q: 'How do you handle multi-cluster GitOps with ArgoCD?',
      a: 'ArgoCD supports multi-cluster natively: register additional clusters with `argocd cluster add <context>`. Each Application specifies `destination.server` pointing to the cluster API endpoint. For fleet management: use ArgoCD ApplicationSets — a single CR that generates Applications across multiple clusters based on cluster selectors, Git directories, or a cluster list. Example: a single ApplicationSet deploys your app to all clusters tagged `env=production`. Changes in Git propagate to all production clusters simultaneously. Alternatively, run one ArgoCD instance per cluster (simpler blast radius isolation, more ops overhead).',
    },
    {
      q: 'How do you manage secrets in a GitOps workflow without committing them to Git?',
      a: 'Secrets must not be in the Git repo (even a private one). Options: (1) Sealed Secrets (Bitnami) — encrypt a Secret with a public key; the sealed secret CipherText is safe to commit; only the controller in the cluster can decrypt it with the private key. (2) External Secrets Operator — define ExternalSecret CRDs that reference secrets in AWS Secrets Manager, Azure Key Vault, or HashiCorp Vault; the operator syncs them to native Kubernetes Secrets. (3) Vault Agent Sidecar — inject secrets into pods at runtime from Vault. (4) SOPS — Mozilla SOPS encrypts YAML/JSON files with cloud KMS keys; only users with KMS access can decrypt; safe to commit the encrypted file. External Secrets Operator is the most popular GitOps-native approach for cloud-hosted secrets.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'GitOps: Git = single source of truth for Kubernetes; agents (ArgoCD/Flux) pull and reconcile continuously; drift auto-corrected; rollback = git revert; secrets via Sealed Secrets or External Secrets Operator.',
    mustKnow: [
      'GitOps = declarative + versioned in Git + agent pulls (not CI pushes) + continuous reconciliation',
      'ArgoCD: Application CRD, sync policy (manual/auto), selfHeal reverts manual kubectl changes',
      'Flux: GitRepository + Kustomization CRDs; HelmRelease for Helm; image automation for tag updates',
      'Secrets: never commit plain Secrets (only base64) — use Sealed Secrets or External Secrets Operator',
      'Promotions = PRs in the config repo, not kubectl commands',
      'Sync waves: CRDs first (wave -2), config before deployments (wave -1), smoke tests after (wave +1)',
      'Config repo separate from app repo: cleaner history, independent access control',
    ],
    interviewFocus: [
      'What is the difference between push-based CD and pull-based GitOps?',
      'How do you handle secrets in a GitOps workflow?',
      'How would you promote a release from staging to production in GitOps?',
      'What is configuration drift and how does ArgoCD selfHeal prevent it?',
    ],
  };
}
