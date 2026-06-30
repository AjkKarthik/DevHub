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
  { name: 'ConfigMap', type: 'class', desc: 'Non-sensitive key-value config — env vars, config files, CLI args' },
  { name: 'Secret', type: 'class', desc: 'Base64-encoded sensitive data — passwords, tokens, TLS certs' },
  { name: 'envFrom:', type: 'keyword', desc: 'Load ALL keys from a ConfigMap/Secret as environment variables' },
  { name: 'valueFrom:', type: 'keyword', desc: 'Inject a single key as a named environment variable' },
  { name: 'volumeMounts:', type: 'keyword', desc: 'Mount ConfigMap/Secret as files in the container filesystem' },
  { name: 'immutable: true', type: 'keyword', desc: 'Prevent changes to ConfigMap/Secret — improves perf, forces rotation' },
  { name: 'External Secrets Operator', type: 'keyword', desc: 'Sync secrets from Vault/AWS SSM/GCP Secret Manager into K8s Secrets' },
  { name: 'Sealed Secrets', type: 'keyword', desc: 'Encrypt K8s Secrets for safe GitOps storage in version control' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'ConfigMaps — Non-Sensitive Configuration',
    points: [
      'ConfigMap stores key-value pairs for configuration that is not secret — feature flags, connection strings, config files.',
      'Inject as env vars: envFrom: configMapRef loads all keys; env: valueFrom: configMapKeyRef loads one key.',
      'Mount as files: volumeMounts point to a Volume of type configMap — each key becomes a file.',
      'ConfigMaps are namespace-scoped — a Pod can only reference ConfigMaps in the same namespace.',
      'Updates to a mounted ConfigMap are reflected in the container within ~1 minute (env vars require Pod restart).',
    ],
  },
  {
    heading: 'Secrets — Sensitive Data',
    points: [
      'Secrets are base64-encoded (NOT encrypted at rest by default) — enable Encryption at Rest in etcd for real security.',
      'Types: Opaque (generic), kubernetes.io/tls, kubernetes.io/dockerconfigjson, kubernetes.io/service-account-token.',
      'Access same as ConfigMap: envFrom/valueFrom for env vars, volume mounts for files.',
      'Secrets mounted as volumes are stored in tmpfs (in-memory) — not written to node disk.',
      'RBAC controls which Pods/ServiceAccounts can read which Secrets — follow least-privilege.',
    ],
  },
  {
    heading: 'Secret Management Best Practices',
    points: [
      'Never store plain-text Secrets in Git. Use Sealed Secrets (encrypted SealedSecret CRD) or External Secrets Operator.',
      'External Secrets Operator syncs from Vault, AWS Secrets Manager, GCP Secret Manager, Azure Key Vault.',
      'Rotate secrets by updating the Secret object — mounted file volumes update automatically; env vars need rollout.',
      'Use immutable: true on ConfigMaps/Secrets that should not change — K8s stops watching for updates, improving performance.',
      'Audit: kubectl get secret -n <ns> shows what exists; RBAC audit logs show who accessed what.',
    ],
  },
  {
    heading: 'Projected Volumes & Service Account Tokens',
    points: [
      'Projected volumes merge multiple sources (ConfigMap, Secret, ServiceAccount token) into one mount path.',
      'ServiceAccount tokens are auto-mounted at /var/run/secrets/kubernetes.io/serviceaccount/token.',
      'Use automountServiceAccountToken: false to disable the default token for Pods that don\'t need API access.',
      'Workload Identity (GKE/AKS/EKS) binds Kubernetes ServiceAccounts to cloud IAM roles — no long-lived credentials.',
      'IRSA (AWS): annotate the ServiceAccount with the IAM role ARN; the Pod gets short-lived AWS credentials automatically.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'ConfigMap usage',
    language: 'bash',
    code: '# Create ConfigMap from literal values\nkubectl create configmap app-config \\\n  --from-literal=LOG_LEVEL=info \\\n  --from-literal=FEATURE_FLAGS=dark-mode,beta-ui\n\n# Create ConfigMap from a file\nkubectl create configmap nginx-conf --from-file=nginx.conf\n\n---\n# ConfigMap manifest\napiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: app-config\n  namespace: production\ndata:\n  LOG_LEVEL: info\n  DATABASE_HOST: postgres.production.svc.cluster.local\n  app.properties: |\n    feature.dark-mode=true\n    feature.beta-ui=false\n\n---\n# Use in a Pod\nspec:\n  containers:\n    - name: api\n      image: ghcr.io/org/api:v1\n      # Load all keys as env vars:\n      envFrom:\n        - configMapRef:\n            name: app-config\n      # Or load a single key:\n      env:\n        - name: LOG_LEVEL\n          valueFrom:\n            configMapKeyRef:\n              name: app-config\n              key: LOG_LEVEL\n      # Mount as a config file:\n      volumeMounts:\n        - name: config\n          mountPath: /etc/app\n          readOnly: true\n  volumes:\n    - name: config\n      configMap:\n        name: app-config\n        items:\n          - key: app.properties\n            path: app.properties',
  },
  {
    label: 'Secrets',
    language: 'bash',
    code: '# Create a Secret (kubectl base64-encodes values automatically)\nkubectl create secret generic db-secret \\\n  --from-literal=DB_PASSWORD=my-secret-pw \\\n  --from-literal=DB_URL=postgres://user:my-secret-pw@db:5432/app\n\n# Create TLS secret\nkubectl create secret tls api-tls \\\n  --cert=tls.crt --key=tls.key\n\n---\n# Secret manifest (values are base64-encoded)\napiVersion: v1\nkind: Secret\nmetadata:\n  name: db-secret\n  namespace: production\ntype: Opaque\ndata:\n  DB_PASSWORD: bXktc2VjcmV0LXB3  # echo -n \'my-secret-pw\' | base64\n\n---\n# Use in a Pod\nspec:\n  containers:\n    - name: api\n      env:\n        - name: DB_PASSWORD\n          valueFrom:\n            secretKeyRef:\n              name: db-secret\n              key: DB_PASSWORD\n      volumeMounts:\n        - name: secrets\n          mountPath: /run/secrets\n          readOnly: true\n  volumes:\n    - name: secrets\n      secret:\n        secretName: db-secret',
  },
  {
    label: 'External Secrets',
    language: 'bash',
    code: '# External Secrets Operator: sync from AWS SSM\napiVersion: external-secrets.io/v1beta1\nkind: ExternalSecret\nmetadata:\n  name: db-secret\n  namespace: production\nspec:\n  refreshInterval: 1h\n  secretStoreRef:\n    name: aws-secrets-manager\n    kind: SecretStore\n  target:\n    name: db-secret          # K8s Secret name to create\n    creationPolicy: Owner\n  data:\n    - secretKey: DB_PASSWORD # Key in the K8s Secret\n      remoteRef:\n        key: prod/myapp/db   # Path in AWS Secrets Manager\n        property: password   # JSON key within the secret\n\n---\n# Sealed Secrets (encrypt for GitOps)\n# Install: helm install sealed-secrets sealed-secrets/sealed-secrets\n# Encrypt:\nkubeseal --format yaml < secret.yaml > sealed-secret.yaml\n# sealed-secret.yaml is safe to commit to Git\n# Controller decrypts it in the cluster using its private key',
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Treating base64 encoding as encryption',
    wrong: '# "The Secret is secure — it\'s base64 encoded in etcd"\n# Anyone with kubectl access can read it:\nkubectl get secret db-secret -o jsonpath=\'{.data.DB_PASSWORD}\' | base64 -d',
    right: '# Enable encryption at rest in etcd (EncryptionConfiguration)\n# Use RBAC to restrict who can get/list Secrets\n# Use External Secrets Operator to avoid storing secrets in etcd at all',
    explanation: 'base64 is encoding, not encryption. Any cluster user with get Secret RBAC permission can read the decoded value trivially. Enable etcd encryption at rest and restrict Secret access via RBAC.',
  },
  {
    title: 'Storing Secrets in Git as plain-text YAML',
    wrong: '# secret.yaml committed to Git:\napiVersion: v1\nkind: Secret\ndata:\n  DB_PASSWORD: bXktc2VjcmV0LXB3  # base64 — easily decoded',
    right: '# Option 1: Sealed Secrets (SealedSecret CRD — safe to commit)\n# Option 2: External Secrets Operator (secrets live in Vault/SSM)\n# Option 3: .gitignore secret.yaml; apply manually or via CI',
    explanation: 'Base64-encoded Secrets in Git are essentially plain text in your history forever. Use Sealed Secrets (encrypted with the cluster\'s public key) or External Secrets Operator so the actual values never touch Git.',
  },
  {
    title: 'Not restarting Pods after updating an env-var ConfigMap',
    wrong: '# Updated ConfigMap LOG_LEVEL: debug\n# Pod still shows LOG_LEVEL=info\n# "Why didn\'t it update?"',
    right: '# Env vars are set at Pod start — updating a ConfigMap\n# does NOT update running Pods\nkubectl rollout restart deployment/api   # trigger restart',
    explanation: 'Environment variables are injected at Pod start from the ConfigMap values at that moment. Updating the ConfigMap does not update running Pods. You must restart the Pods (kubectl rollout restart) to pick up the new values. Mounted file volumes DO update automatically (within ~1 min).',
  },
  {
    title: 'Using one giant ConfigMap for all environments',
    wrong: '# One ConfigMap with dev, staging, prod keys:\ndata:\n  dev_DB_HOST: dev-db\n  prod_DB_HOST: prod-db\n  # Pods read the wrong key by mistake',
    right: '# Separate ConfigMaps per namespace/environment:\n# namespace: dev  → ConfigMap: app-config\n# namespace: prod → ConfigMap: app-config\n# Same key names, different namespaces',
    explanation: 'Namespace-isolated ConfigMaps with identical key names per environment is the K8s-native pattern. Pods reference the same ConfigMap name; the namespace provides isolation. One giant ConfigMap requires Pods to know which prefix to use, creating coupling.',
  },
  {
    title: 'Granting broad Secret RBAC (get * in secrets)',
    wrong: '# ClusterRole:\nrules:\n  - apiGroups: [""]\n    resources: [secrets]\n    verbs: [get, list, watch]  # all secrets in cluster',
    right: '# Role (namespaced, not ClusterRole):\nrules:\n  - apiGroups: [""]\n    resources: [secrets]\n    resourceNames: [db-secret, api-key]  # only specific secrets\n    verbs: [get]',
    explanation: 'list and watch on Secrets lets a compromised Pod enumerate ALL secrets in the namespace (or cluster with ClusterRole). Restrict to get on specific secret names using resourceNames. Never grant list/watch on secrets unless absolutely required.',
  },
];

const challenge: Challenge = {
  title: 'Secret Rotation Checker',
  language: 'typescript',
  description: 'Write a function that takes an array of Secret metadata objects (name, createdAt timestamp, lastRotatedAt timestamp) and returns secrets that need rotation — either older than maxAgeDays or not rotated within rotationIntervalDays.',
  hints: [
    'Calculate age from createdAt to now',
    'Calculate time since last rotation from lastRotatedAt to now',
    'A secret needs rotation if age > maxAgeDays OR (lastRotatedAt exists and daysSinceRotation > rotationIntervalDays)',
    'Return an array with the secret name and reason for each flagged secret',
    'Use Math.floor((now - date) / 86400000) to convert ms to days',
  ],
  starterCode: 'interface SecretMeta {\n  name: string;\n  createdAt: number;       // Unix ms\n  lastRotatedAt?: number;  // Unix ms, undefined if never rotated\n}\n\ninterface RotationWarning {\n  name: string;\n  reason: string;\n}\n\nfunction checkRotation(\n  secrets: SecretMeta[],\n  now: number,\n  maxAgeDays: number,\n  rotationIntervalDays: number\n): RotationWarning[] {\n  // TODO: return secrets that need rotation\n  return [];\n}',
  solution: 'interface SecretMeta {\n  name: string;\n  createdAt: number;\n  lastRotatedAt?: number;\n}\n\ninterface RotationWarning {\n  name: string;\n  reason: string;\n}\n\nfunction checkRotation(\n  secrets: SecretMeta[],\n  now: number,\n  maxAgeDays: number,\n  rotationIntervalDays: number\n): RotationWarning[] {\n  const warnings: RotationWarning[] = [];\n  const msPerDay = 86_400_000;\n\n  for (const s of secrets) {\n    const ageDays = Math.floor((now - s.createdAt) / msPerDay);\n\n    if (ageDays > maxAgeDays) {\n      warnings.push({ name: s.name, reason: `Secret is ${ageDays} days old (max: ${maxAgeDays})` });\n      continue;\n    }\n\n    if (s.lastRotatedAt !== undefined) {\n      const daysSinceRotation = Math.floor((now - s.lastRotatedAt) / msPerDay);\n      if (daysSinceRotation > rotationIntervalDays) {\n        warnings.push({ name: s.name, reason: `Last rotated ${daysSinceRotation} days ago (interval: ${rotationIntervalDays})` });\n      }\n    } else if (ageDays > rotationIntervalDays) {\n      warnings.push({ name: s.name, reason: `Never rotated and ${ageDays} days old` });\n    }\n  }\n\n  return warnings;\n}',
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the key security difference between a ConfigMap and a Secret?',
    options: [
      'Secrets are encrypted in transit; ConfigMaps are not',
      'Secrets are base64-encoded (and optionally encrypted at rest); ConfigMaps are stored as plain text in etcd',
      'ConfigMaps can be mounted as volumes; Secrets cannot',
      'Secrets require a TLS certificate to access',
    ],
    answer: 1,
    explanation: 'ConfigMaps store plain text in etcd. Secrets store base64-encoded data (easily decoded) and, if Encryption at Rest is enabled, are encrypted in etcd. Secrets also support tmpfs mounts and tighter RBAC. Neither is secure without etcd encryption AND proper RBAC.',
  },
  {
    q: 'You update a ConfigMap whose values are injected as environment variables. What must you do for Pods to pick up the new values?',
    options: [
      'Nothing — env vars update automatically within 1 minute',
      'Restart the Pods — env vars are set at Pod start and do not update in running containers',
      'Apply the updated ConfigMap twice',
      'Delete and recreate the ConfigMap',
    ],
    answer: 1,
    explanation: 'Environment variables from ConfigMaps/Secrets are injected at Pod creation and frozen. Updating the ConfigMap does NOT push new values into running containers. You must restart Pods (kubectl rollout restart deployment/name) to pick up the changes. Mounted file volumes DO update automatically.',
  },
  {
    q: 'Which tool lets you safely commit encrypted Kubernetes Secrets to Git?',
    options: [
      'kubectl encrypt',
      'Sealed Secrets (SealedSecret CRD — encrypted with the cluster\'s public key)',
      'base64 --encode',
      'SOPS with in-cluster decryption',
    ],
    answer: 1,
    explanation: 'Sealed Secrets encrypts a Secret into a SealedSecret CRD using the cluster\'s public key. Only the Sealed Secrets controller in that cluster can decrypt it. The SealedSecret YAML is safe to commit to Git. SOPS with ArgoCD is another valid GitOps approach.',
  },
  {
    q: 'What does External Secrets Operator do?',
    options: [
      'Exports Kubernetes Secrets to external systems like S3',
      'Syncs secrets from external stores (Vault, AWS SSM, GCP Secret Manager) into Kubernetes Secrets',
      'Encrypts Secrets before storing them in etcd',
      'Rotates TLS certificates using Let\'s Encrypt',
    ],
    answer: 1,
    explanation: 'External Secrets Operator watches ExternalSecret resources and fetches the actual secret values from an external store (HashiCorp Vault, AWS Secrets Manager, GCP Secret Manager, Azure Key Vault) at a defined refresh interval, creating and updating Kubernetes Secrets automatically.',
  },
  {
    q: 'Which RBAC verb on Secrets is most dangerous and should be restricted?',
    options: [
      'get — reads a specific secret',
      'create — creates new secrets',
      'list/watch — enumerates ALL secrets and their values',
      'delete — removes secrets',
    ],
    answer: 2,
    explanation: 'list and watch on Secrets return all secrets in scope — a compromised workload with list access can read every secret in a namespace or cluster. Restrict to get on specific secret names using resourceNames. Never grant list/watch unless explicitly required.',
  },
  { q: 'What is the key difference between ConfigMaps and Secrets in Kubernetes?', options: ['ConfigMaps are immutable by default; Secrets are mutable', 'Secrets are Base64-encoded with additional RBAC controls; ConfigMaps store plaintext with no special protection', 'ConfigMaps support live updates into pods; Secrets require pod restarts', 'Secrets are encrypted at rest by default in all Kubernetes clusters'], answer: 1, explanation: 'ConfigMaps store plaintext configuration data. Secrets store sensitive data as Base64 encoding (not encryption). Secrets get additional protections: memory-only storage on nodes via tmpfs, stricter RBAC defaults, and optional envelope encryption at rest via kube-apiserver EncryptionConfiguration. Never put sensitive data in ConfigMaps. Enable EncryptionConfiguration to actually encrypt Secrets at rest.' },
];

const qna: QnaItem[] = [
  {
    q: 'How do mounted ConfigMap file volumes update compared to environment variables?',
    a: 'ConfigMaps mounted as volumes are updated automatically by kubelet within approximately 1 minute (controlled by kubelet\'s --sync-frequency). The app must re-read the file to pick up the change. Environment variables injected with envFrom/valueFrom are baked in at Pod start — the Pod must be restarted to see changes.',
  },
  {
    q: 'What is the difference between Opaque and kubernetes.io/tls Secret types?',
    a: 'Opaque is the generic Secret type for arbitrary key-value data. kubernetes.io/tls is specifically for TLS certificates — it validates that the Secret contains tls.crt and tls.key fields. Other types include kubernetes.io/dockerconfigjson (registry credentials) and kubernetes.io/service-account-token. Use the correct type so Kubernetes and controllers know how to validate and use the data.',
  },
  {
    q: 'What is Workload Identity / IRSA and why is it better than storing cloud credentials in Secrets?',
    a: 'Workload Identity (GKE/AKS) and IRSA (AWS) bind a Kubernetes ServiceAccount to a cloud IAM role. When a Pod with that ServiceAccount calls a cloud API, it gets short-lived credentials automatically via a webhook/token exchange — no long-lived API keys or secrets in etcd. Credentials rotate automatically and never leave the cluster infrastructure.',
  },
  {
    q: 'Can I create a Secret from a file using kubectl?',
    a: 'Yes: kubectl create secret generic my-secret --from-file=config.json stores the file contents as a key named "config.json". You can rename the key: --from-file=mykey=config.json. For TLS: kubectl create secret tls my-tls --cert=tls.crt --key=tls.key. Kubectl handles the base64 encoding for you.',
  },
  {
    q: 'What does immutable: true on a ConfigMap or Secret do?',
    a: 'Setting immutable: true prevents any updates to the data or binaryData fields. Kubernetes stops watching the object for changes, reducing API server load in clusters with many ConfigMaps. To change an immutable ConfigMap/Secret, you must delete and recreate it (or create a new one and update the Deployment to reference it). Use this for config that should never change after deployment.',
  },
  { q: 'How do you rotate a Kubernetes Secret without restarting pods?', a: 'If the Secret is mounted as a volume (not as an env var), Kubernetes automatically propagates updates to pods within about 1 minute via the kubelet sync period. The application must re-read the file to pick up the new value. For env var injection via envFrom or env.valueFrom.secretKeyRef, pods do NOT receive updates automatically and must be restarted. For zero-downtime rotation: mount as a volume and implement hot-reload in your app, or use a rolling update. ExternalSecrets Operator can automate rotation from HashiCorp Vault, AWS Secrets Manager, or Azure Key Vault.' },
];

const revision: RevisionSummary = {
  oneLiner: 'ConfigMaps for non-sensitive config, Secrets for sensitive data — inject as env vars or mounted files; use External Secrets or Sealed Secrets for production.',
  mustKnow: [
    'ConfigMap: plain text in etcd; Secret: base64 (NOT encrypted unless etcd encryption at rest is enabled)',
    'envFrom loads all keys; valueFrom loads one key; volumeMount loads keys as files',
    'Mounted file volumes update automatically (~1 min); env vars require Pod restart',
    'Never store Secrets in Git plain text — use Sealed Secrets or External Secrets Operator',
    'RBAC: grant get on specific resourceNames; never grant list/watch on Secrets broadly',
    'Workload Identity/IRSA: no long-lived cloud credentials in Secrets at all',
  ],
  interviewFocus: [
    'Is a Kubernetes Secret actually secure? What makes it so?',
    'How would you handle secret rotation without downtime in Kubernetes?',
    'What is the difference between envFrom and valueFrom?',
    'How do you safely store secrets for a GitOps workflow?',
  ],
};

@Component({
  selector: 'app-k8s-configmaps-secrets',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent,
    PageCompleteComponent,
  ],
  templateUrl: './configmaps-secrets.html',
  styleUrl: './configmaps-secrets.scss',
})
export class K8sConfigmapsSecrets {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
