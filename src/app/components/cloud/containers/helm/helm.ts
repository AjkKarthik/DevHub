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
  { name: 'helm install', type: 'method', desc: 'Install a chart as a named release: helm install myapp ./chart' },
  { name: 'helm upgrade --install', type: 'method', desc: 'Idempotent: install if missing, upgrade if present' },
  { name: 'helm rollback', type: 'method', desc: 'Roll back a release to a previous revision' },
  { name: 'helm values', type: 'keyword', desc: 'values.yaml defines defaults; -f or --set overrides them' },
  { name: '{{ .Values.key }}', type: 'syntax', desc: 'Template action — injects a value from values.yaml' },
  { name: 'helm template', type: 'method', desc: 'Render templates locally without installing — great for debugging' },
  { name: 'helm repo add/update', type: 'method', desc: 'Add and refresh a chart repository index' },
  { name: 'Chart.yaml', type: 'keyword', desc: 'Chart metadata: name, version, appVersion, dependencies' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Chart Structure',
    points: [
      'A Helm chart is a directory with Chart.yaml (metadata), values.yaml (defaults), and templates/ (Go template manifests).',
      'Chart.yaml: name, version (chart version), appVersion (app version), description, dependencies.',
      'templates/: YAML files with Go template actions ({{ }}) — Deployment, Service, Ingress, ConfigMap, etc.',
      'helpers.tpl (_helpers.tpl): named templates (define/include) for reusable snippets like labels and selectors.',
      'charts/: sub-charts (dependencies declared in Chart.yaml and fetched with helm dependency update).',
    ],
  },
  {
    heading: 'Values and Overrides',
    points: [
      'values.yaml provides defaults for every template variable — ship sensible defaults, allow overrides.',
      '-f custom-values.yaml merges a file of overrides on top of defaults (multiple -f files are merged left-to-right).',
      '--set key=value overrides a single value at install/upgrade time — useful for secrets in CI.',
      '--set-string, --set-file, --set-json handle non-string types and file contents.',
      'helm show values <chart> prints the default values.yaml from a chart without installing it.',
    ],
  },
  {
    heading: 'Releases and Lifecycle',
    points: [
      'A release is a named, versioned installation of a chart — one chart can be installed multiple times with different names.',
      'Release history is stored as Secrets in the release namespace — helm history shows all revisions.',
      'helm upgrade bumps the release revision; helm rollback <release> <revision> reverts to an earlier state.',
      'helm upgrade --install is idempotent — the only command you need in a CI/CD pipeline.',
      'helm uninstall removes all release resources and deletes the release from history (add --keep-history to retain).',
    ],
  },
  {
    heading: 'Hooks and Tests',
    points: [
      'Hooks run at specific lifecycle points: pre-install, post-install, pre-upgrade, post-upgrade, pre-delete, pre-rollback.',
      'Use a pre-upgrade hook Job to run DB migrations before the Deployment is upgraded.',
      'helm test runs Jobs annotated with helm.sh/hook: test — useful for smoke tests after install.',
      'hook-delete-policy: before-hook-creation cleans up old hook Pods before a new hook run.',
      'Hooks are ordered by helm.sh/hook-weight annotation — lower weight runs first.',
    ],
  },
  {
    heading: 'Helm Templating and Values Layering',
    points: [
      'Helm charts use Go templating to parametrize Kubernetes manifests — values.yaml provides defaults, which can be overridden per-environment via -f custom-values.yaml or --set flags, letting one chart serve dev, staging, and production with different configuration.',
      'Values files layer in order of specificity, with later-specified files/flags overriding earlier ones — this ordering matters when combining a base values file with an environment-specific override file, since the override must come after the base to actually take effect.',
      'helm template renders manifests locally without touching the cluster, useful for reviewing exactly what YAML a chart install would produce and for GitOps workflows that want to commit rendered manifests rather than apply Helm directly against a cluster.',
      'Helm tracks release history and supports helm rollback to a previous revision, but this only reverts the Kubernetes objects Helm manages — it does not undo external side effects (data migrations, external API calls) that may have happened as part of that release.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Chart structure',
    language: 'bash',
    code: '# Create a new chart scaffold\nhelm create myapp\n# myapp/\n#   Chart.yaml          — chart metadata\n#   values.yaml         — default values\n#   templates/\n#     deployment.yaml\n#     service.yaml\n#     ingress.yaml\n#     _helpers.tpl        — named template helpers\n#   charts/             — sub-chart dependencies\n\n# Chart.yaml\napiVersion: v2\nname: myapp\ndescription: My application Helm chart\ntype: application\nversion: 1.2.0          # chart version (semver)\nappVersion: "2.5.1"     # app version (informational)\ndependencies:\n  - name: postgresql\n    version: "14.0.0"\n    repository: "https://charts.bitnami.com/bitnami"\n    condition: postgresql.enabled\n\n# Fetch dependencies\nhelm dependency update ./myapp',
  },
  {
    label: 'Templates + values',
    language: 'bash',
    code: '# values.yaml\nreplicaCount: 2\nimage:\n  repository: ghcr.io/org/myapp\n  tag: ""\n  pullPolicy: IfNotPresent\nservice:\n  type: ClusterIP\n  port: 80\ningress:\n  enabled: false\n  host: ""\nresources:\n  requests: { cpu: 100m, memory: 128Mi }\n  limits:   { cpu: 500m, memory: 512Mi }\n\n---\n# templates/deployment.yaml (excerpt)\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: {{ include "myapp.fullname" . }}\n  labels: {{ include "myapp.labels" . | nindent 4 }}\nspec:\n  replicas: {{ .Values.replicaCount }}\n  template:\n    spec:\n      containers:\n        - name: {{ .Chart.Name }}\n          image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"\n          imagePullPolicy: {{ .Values.image.pullPolicy }}\n          {{- with .Values.resources }}\n          resources: {{ toYaml . | nindent 12 }}\n          {{- end }}\n\n---\n# templates/_helpers.tpl\n{{- define "myapp.fullname" -}}\n{{ .Release.Name }}-{{ .Chart.Name }}\n{{- end -}}\n\n{{- define "myapp.labels" -}}\nhelm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}\napp.kubernetes.io/name: {{ .Chart.Name }}\napp.kubernetes.io/instance: {{ .Release.Name }}\n{{- end -}}',
  },
  {
    label: 'CLI workflow',
    language: 'bash',
    code: '# Add a chart repository\nhelm repo add bitnami https://charts.bitnami.com/bitnami\nhelm repo update\n\n# Search for a chart\nhelm search repo bitnami/postgresql\n\n# Preview default values\nhelm show values bitnami/postgresql\n\n# Dry-run: render templates without installing\nhelm template myrelease ./myapp -f prod-values.yaml\n\n# Install (idempotent: install or upgrade)\nhelm upgrade --install myapp ./myapp \\\n  -f prod-values.yaml \\\n  --set image.tag=v2.5.1 \\\n  --namespace production \\\n  --create-namespace \\\n  --wait --timeout 5m\n\n# Check release status\nhelm status myapp -n production\nhelm history myapp -n production\n\n# Rollback to revision 2\nhelm rollback myapp 2 -n production\n\n# Uninstall\nhelm uninstall myapp -n production',
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Using helm install in CI/CD instead of helm upgrade --install',
    wrong: 'helm install myapp ./chart   # fails on second run: release already exists',
    right: 'helm upgrade --install myapp ./chart   # idempotent: install or upgrade',
    explanation: 'helm install fails with "release already exists" on the second run. helm upgrade --install is idempotent — it installs on first run and upgrades on subsequent runs. Always use upgrade --install in CI/CD pipelines.',
  },
  {
    title: 'Hardcoding secrets in values.yaml',
    wrong: '# values.yaml committed to Git:\npostgresql:\n  password: mysecretpassword',
    right: '# Pass secrets at install time:\nhelm upgrade --install myapp ./chart \\\n  --set postgresql.password="$DB_PASSWORD"\n# Or reference an existing K8s Secret with externalSecret config',
    explanation: 'values.yaml is committed to Git — any secret stored there is exposed. Pass secret values via --set from CI/CD environment variables (stored in GitHub Actions secrets, Vault, etc.) or use ExternalSecret references to keep secrets out of Helm entirely.',
  },
  {
    title: 'Not pinning chart and image versions',
    wrong: 'helm install myapp bitnami/postgresql   # installs latest chart version\nimage:\n  tag: latest                                # unpinned image',
    right: 'helm install myapp bitnami/postgresql --version 14.0.0\nimage:\n  tag: "16.1.0"  # pin exact version in values.yaml',
    explanation: 'Unpinned charts and images mean your next helm upgrade may install a completely different version, breaking your cluster. Pin chart versions with --version and image tags in values.yaml for reproducible deployments.',
  },
  {
    title: 'Forgetting helm dependency update before packaging',
    wrong: '# Added a dependency to Chart.yaml\n# helm package ./myapp\n# Error: found in Chart.yaml, but missing in charts/ directory',
    right: 'helm dependency update ./myapp   # fetches deps into charts/\nhelm package ./myapp',
    explanation: 'Declaring a dependency in Chart.yaml does not fetch it — you must run helm dependency update to download sub-charts into the charts/ directory. Without this step, helm install and helm package both fail.',
  },
  {
    title: 'Using --set for complex nested or multi-value configurations',
    wrong: 'helm upgrade myapp ./chart \\\n  --set ingress.annotations."nginx\\.ingress\\.kubernetes\\.io/proxy-body-size"=10m\n# Error: complex escaping, easy to get wrong',
    right: '# Use a values file instead:\n# override-values.yaml:\ningress:\n  annotations:\n    nginx.ingress.kubernetes.io/proxy-body-size: 10m\nhelm upgrade myapp ./chart -f override-values.yaml',
    explanation: '--set requires complex escaping for dotted keys, arrays, and nested structures. For anything beyond a simple scalar override, use a -f values file. It is more readable, versionable, and far less error-prone.',
  },
];

const challenge: Challenge = {
  title: 'Helm Values Merger',
  language: 'typescript',
  description: 'Write a function that merges Helm values files in order (left-to-right, each overrides the previous). Scalar values are overwritten; objects are merged recursively. Return the merged result. This mirrors how Helm applies multiple -f flags.',
  hints: [
    'Start with a deep copy of the first values object',
    'For each subsequent values object, recursively merge into the accumulator',
    'If both sides have an object at a key — recurse; if the override has a scalar — overwrite',
    'Arrays should be replaced (not merged) — Helm replaces arrays on override',
    'Use typeof value === "object" && !Array.isArray(value) to detect plain objects',
  ],
  starterCode: 'type Values = Record<string, unknown>;\n\nfunction mergeValues(...valueFiles: Values[]): Values {\n  // TODO: merge values left-to-right; scalars overwrite, objects deep-merge, arrays replace\n  return {};\n}',
  solution: 'type Values = Record<string, unknown>;\n\nfunction deepMerge(base: Values, override: Values): Values {\n  const result: Values = { ...base };\n  for (const [key, val] of Object.entries(override)) {\n    if (\n      typeof val === \'object\' && val !== null && !Array.isArray(val) &&\n      typeof result[key] === \'object\' && result[key] !== null && !Array.isArray(result[key])\n    ) {\n      result[key] = deepMerge(result[key] as Values, val as Values);\n    } else {\n      result[key] = val;  // scalar or array: overwrite\n    }\n  }\n  return result;\n}\n\nfunction mergeValues(...valueFiles: Values[]): Values {\n  return valueFiles.reduce((acc, curr) => deepMerge(acc, curr), {} as Values);\n}',
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the difference between a Helm chart version and appVersion?',
    options: [
      'They are the same — both track the chart release',
      'version is the chart\'s own semver; appVersion is the version of the application the chart deploys',
      'appVersion is used by helm upgrade; version is used by helm install',
      'version must always match appVersion for the chart to install',
    ],
    answer: 1,
    explanation: 'version in Chart.yaml is the semver version of the Helm chart itself (packaging). appVersion is the version of the application being packaged (informational, shown in helm list). You can update the chart (bumping version) without changing the app (appVersion) and vice versa.',
  },
  {
    q: 'Which command should you always use in CI/CD pipelines to deploy a Helm chart?',
    options: [
      'helm install — installs the chart fresh every time',
      'helm upgrade — upgrades an existing release',
      'helm upgrade --install — idempotent: installs if missing, upgrades if present',
      'helm apply — declarative apply similar to kubectl apply',
    ],
    answer: 2,
    explanation: 'helm upgrade --install is the idempotent form: on first run it installs the release; on subsequent runs it upgrades it. helm install fails if the release already exists. helm apply is not a real Helm command. Always use upgrade --install in CI/CD.',
  },
  {
    q: 'What does helm template do?',
    options: [
      'Creates a new chart template in the templates/ directory',
      'Renders the chart templates locally and prints the YAML without installing anything',
      'Validates that all template variables have values',
      'Generates a values.yaml from a running release',
    ],
    answer: 1,
    explanation: 'helm template renders all chart templates with the given values and prints the resulting YAML to stdout — no Kubernetes API calls, no installation. Use it to preview what will be applied, diff against current state, or pipe to kubectl apply for GitOps workflows.',
  },
  {
    q: 'What is a Helm hook used for?',
    options: [
      'Hooks are callbacks that notify external systems when a chart is installed',
      'Hooks are Jobs or Pods that run at specific lifecycle points (pre-upgrade, post-install, etc.)',
      'Hooks define dependencies between sub-charts',
      'Hooks are annotations that control Helm\'s retry behaviour',
    ],
    answer: 1,
    explanation: 'Helm hooks are Kubernetes resources (usually Jobs) annotated with helm.sh/hook: pre-upgrade (or post-install, etc.). They run at specific points in the release lifecycle. Common use: a pre-upgrade Job to run database migrations before the new app version starts.',
  },
  {
    q: 'How does Helm store release state in the cluster?',
    options: [
      'In a ConfigMap named helm-releases in kube-system',
      'As Secrets in the release\'s namespace — one Secret per release revision',
      'In a dedicated etcd keyspace separate from main cluster state',
      'In a file on the Helm client machine at ~/.helm/releases',
    ],
    answer: 1,
    explanation: 'Helm v3 stores release state as Kubernetes Secrets (type helm.sh/release.v1) in the release\'s namespace. Each revision is a separate Secret. This is why kubectl get secrets -n myns shows helm secrets alongside your application secrets. Helm v2 used Configmaps or Tiller.',
  },
  { q: 'What is the purpose of helm upgrade --install?', options: ['It reinstalls the Helm CLI from scratch on the current system', 'It upgrades an existing release or installs it if it does not exist, making it idempotent for CI/CD', 'It removes a release and reinstalls the chart from a clean state', 'It upgrades only the chart dependencies without modifying the release'], answer: 1, explanation: 'helm upgrade --install is idempotent: it installs if the release does not exist, or upgrades if it does. This is the standard CI/CD pattern because it works correctly on both first deploy and subsequent updates without needing separate helm install versus helm upgrade logic. Add --atomic to auto-rollback on upgrade failure and --wait to pause until resources are Ready before the command returns.' },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between helm install and helm upgrade?',
    a: 'helm install creates a new release — fails if the release name already exists. helm upgrade updates an existing release — fails if the release does not exist. helm upgrade --install combines both: install on first run, upgrade on subsequent runs. Use upgrade --install exclusively in automated pipelines for idempotency.',
  },
  {
    q: 'How do you pass a list (array) to a Helm template using --set?',
    a: 'Use curly braces: --set "ingress.hosts={host1.com,host2.com}". For complex arrays with objects, use a values file instead — the --set syntax for nested arrays is error-prone. Arrays in Helm override files replace the base list (they are NOT merged).',
  },
  {
    q: 'What is _helpers.tpl used for?',
    a: '_helpers.tpl is a convention for a file of named templates using {{- define "name" -}} ... {{- end -}}. Named templates are reused across multiple template files with {{ include "name" . }}. Common helpers: chart labels, fullname, selector labels. Underscore prefix means Helm does not render it as a manifest directly.',
  },
  {
    q: 'What is Helmfile and when would you use it?',
    a: 'Helmfile is a declarative spec for managing multiple Helm releases across multiple namespaces and clusters in a single file. Instead of running individual helm upgrade commands, helmfile sync applies all releases. It supports environments, secrets (via helm-secrets plugin), and ordering. Useful for managing many charts in a large cluster or mono-repo setup.',
  },
  {
    q: 'How do you test a Helm chart after installation?',
    a: 'Add a Job or Pod in templates/tests/ annotated with helm.sh/hook: test and helm.sh/hook-delete-policy: before-hook-creation. Then run helm test <release-name>. The test Jobs run and Helm reports pass/fail. Common tests: curl the app\'s health endpoint, verify a DB connection, check a config value was injected correctly.',
  },
  { q: 'How do you manage Helm chart secrets securely?', a: 'Never commit plaintext secrets to values files because they end up stored in Helm release history inside the cluster. Options: (1) Helm Secrets plugin encrypts values files with SOPS and GPG before commit. (2) External Secrets Operator syncs values from HashiCorp Vault, AWS Secrets Manager, or Azure Key Vault into Kubernetes Secrets automatically. (3) Override at deploy time with helm upgrade --set db.password= where the value comes from your CI secret store. (4) Store secrets as Kubernetes Secrets separately and reference them with valueFrom.secretKeyRef in chart templates. External Secrets Operator is preferred for automated rotation.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Helm packages K8s manifests as versioned charts with templated values — helm upgrade --install for CI/CD, helm rollback for recovery, hooks for pre-upgrade jobs.',
  mustKnow: [
    'Chart: Chart.yaml (metadata), values.yaml (defaults), templates/ (Go-templated YAML), _helpers.tpl',
    'helm upgrade --install: idempotent in CI/CD; helm install fails on second run',
    'Values precedence: values.yaml < -f file < --set (right-side wins)',
    'Release state stored as Secrets in the release namespace; helm history shows revisions',
    'helm template: render locally for preview/debugging; helm rollback for recovery',
    'Never commit secrets in values.yaml — pass via --set from CI env vars',
  ],
  interviewFocus: [
    'What is the difference between chart version and appVersion?',
    'How would you run a database migration as part of a Helm upgrade?',
    'Why use helm upgrade --install instead of helm install in CI/CD?',
    'How does Helm store release state and how can you roll back?',
  ],
};

@Component({
  selector: 'app-k8s-helm',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent,
    PageCompleteComponent,
  ],
  templateUrl: './helm.html',
  styleUrl: './helm.scss',
})
export class K8sHelm {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
