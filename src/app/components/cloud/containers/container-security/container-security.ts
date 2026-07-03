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
  { name: 'runAsNonRoot: true', type: 'keyword', desc: 'Pod/container must run as non-root user (UID != 0)' },
  { name: 'readOnlyRootFilesystem', type: 'keyword', desc: 'Container filesystem is read-only — writes must go to volumes' },
  { name: 'allowPrivilegeEscalation: false', type: 'keyword', desc: 'Prevent process from gaining more privileges than its parent' },
  { name: 'capabilities: drop: [ALL]', type: 'keyword', desc: 'Remove all Linux capabilities from the container process' },
  { name: 'seccompProfile: RuntimeDefault', type: 'keyword', desc: 'Apply the container runtime\'s default seccomp syscall filter' },
  { name: 'Trivy', type: 'keyword', desc: 'Image vulnerability scanner — scan for CVEs in layers and packages' },
  { name: 'PodSecurity (PSA)', type: 'keyword', desc: 'Pod Security Admission — enforces privileged/baseline/restricted policies' },
  { name: 'NetworkPolicy', type: 'keyword', desc: 'Restricts pod-to-pod traffic — default deny + allow-list is best practice' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Security Contexts',
    points: [
      'securityContext at Pod level applies to all containers; at container level it overrides the Pod-level setting.',
      'runAsNonRoot: true + runAsUser: 1000 prevents containers from running as root (UID 0).',
      'readOnlyRootFilesystem: true makes the container filesystem read-only — use emptyDir or PVC for writable paths.',
      'allowPrivilegeEscalation: false prevents setuid binaries from gaining elevated privileges (e.g. sudo).',
      'capabilities: drop: [ALL] removes all Linux capabilities; add back only what is strictly needed (NET_BIND_SERVICE for port 80).',
    ],
  },
  {
    heading: 'Seccomp and AppArmor',
    points: [
      'seccomp (secure computing mode) filters which Linux syscalls a container can make.',
      'RuntimeDefault: uses the container runtime\'s built-in filter — blocks ~40% of syscalls not needed by typical apps.',
      'Localhost: load a custom seccomp profile from the node filesystem for fine-grained control.',
      'AppArmor: MAC (mandatory access control) profiles restrict file/network access by path — applied via pod annotations.',
      'Both seccomp and AppArmor are defence-in-depth — they limit blast radius if a container is compromised.',
    ],
  },
  {
    heading: 'Image Scanning and Supply Chain',
    points: [
      'Scan images in CI with Trivy: trivy image --exit-code 1 --severity CRITICAL ghcr.io/org/app:tag.',
      'Fail builds on CRITICAL/HIGH CVEs; block MEDIUM by policy; track LOW as noise.',
      'Use minimal base images (distroless, alpine) to reduce the number of packages and CVE surface.',
      'Sign images with Cosign (sigstore) and verify signatures at admission with a policy engine (Kyverno, OPA Gatekeeper).',
      'Use image digest references (image@sha256:...) in production — tags are mutable; digests are immutable.',
    ],
  },
  {
    heading: 'Pod Security Admission (PSA)',
    points: [
      'PSA (GA in K8s 1.25) enforces security standards at namespace level via labels.',
      'Levels: privileged (no restrictions), baseline (prevents known escalations), restricted (best-practice hardening).',
      'Mode: enforce (reject), audit (log), warn (warn in API response) — set all three for graduated rollout.',
      'Label: pod-security.kubernetes.io/enforce: restricted on a namespace enforces restricted profile.',
      'PSA replaces the deprecated PodSecurityPolicy (PSP) removed in K8s 1.25.',
    ],
  },
  {
    heading: 'Image Scanning and Supply Chain Security',
    points: [
      'Vulnerability scanning tools (Trivy, Grype, Docker Scout) analyze image layers against known CVE databases, catching known-vulnerable base images or dependencies before they reach production — integrating scanning into CI blocks vulnerable images from ever being deployed.',
      'Base image choice significantly affects attack surface — a minimal distroless or Alpine-based image has far fewer installed packages (and therefore fewer potential CVEs) than a full Ubuntu-based image carrying unnecessary tooling.',
      'Image signing (via Cosign/Sigstore) and provenance attestation let a deployment pipeline verify an image was built by a trusted process and has not been tampered with since, addressing supply-chain risks that vulnerability scanning alone does not cover.',
      'Scanning at build time catches known vulnerabilities at that point in time, but new CVEs are discovered continuously — periodic re-scanning of already-deployed images is necessary to catch vulnerabilities disclosed after an image was originally built and deployed.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Hardened Pod spec',
    language: 'bash',
    code: 'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: api\nspec:\n  template:\n    spec:\n      # Pod-level security context\n      securityContext:\n        runAsNonRoot: true\n        runAsUser: 1000\n        runAsGroup: 3000\n        fsGroup: 2000\n        seccompProfile:\n          type: RuntimeDefault\n      containers:\n        - name: api\n          image: ghcr.io/org/api@sha256:abc123...  # digest pin\n          securityContext:\n            allowPrivilegeEscalation: false\n            readOnlyRootFilesystem: true\n            capabilities:\n              drop: [ALL]\n              add: []         # add NET_BIND_SERVICE if app binds port < 1024\n          volumeMounts:\n            - name: tmp\n              mountPath: /tmp   # writable scratch space\n            - name: cache\n              mountPath: /app/.cache\n      volumes:\n        - name: tmp\n          emptyDir: {}\n        - name: cache\n          emptyDir: {}',
  },
  {
    label: 'Image scanning (Trivy)',
    language: 'bash',
    code: '# Scan a local image\ntrivy image --severity CRITICAL,HIGH ghcr.io/org/api:v1.2.0\n\n# Fail CI on CRITICAL CVEs\ntrivy image --exit-code 1 --severity CRITICAL ghcr.io/org/api:v1.2.0\n\n# Scan a Dockerfile for misconfigurations\ntrivy config --severity HIGH,CRITICAL ./Dockerfile\n\n# Scan a K8s manifest for security issues\ntrivy k8s --report summary ./k8s/\n\n# Sign image with Cosign (sigstore)\ncosign sign --key cosign.key ghcr.io/org/api@sha256:abc123\n\n# Verify signature before pulling\ncosign verify --key cosign.pub ghcr.io/org/api@sha256:abc123\n\n# GitHub Actions — scan on every push\n# - uses: aquasecurity/trivy-action@master\n#   with:\n#     image-ref: ghcr.io/org/api:${{ github.sha }}\n#     exit-code: \'1\'\n#     severity: CRITICAL,HIGH',
  },
  {
    label: 'Pod Security Admission',
    language: 'bash',
    code: '# Label a namespace to enforce the restricted profile\nkubectl label namespace production \\\n  pod-security.kubernetes.io/enforce=restricted \\\n  pod-security.kubernetes.io/enforce-version=latest \\\n  pod-security.kubernetes.io/audit=restricted \\\n  pod-security.kubernetes.io/warn=restricted\n\n# Test: dry-run a Pod that violates restricted\nkubectl apply --dry-run=server -f privileged-pod.yaml -n production\n# Error: pods "bad-pod" is forbidden: violates PodSecurity "restricted:latest"\n\n# Check what profile a namespace enforces\nkubectl get namespace production -o jsonpath=\'{.metadata.labels}\'\n\n# Kyverno policy: require non-root containers\napiVersion: kyverno.io/v1\nkind: ClusterPolicy\nmetadata:\n  name: require-non-root\nspec:\n  validationFailureAction: Enforce\n  rules:\n    - name: check-non-root\n      match:\n        resources: { kinds: [Pod] }\n      validate:\n        message: "Containers must not run as root"\n        pattern:\n          spec:\n            containers:\n              - securityContext:\n                  runAsNonRoot: true',
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Running containers as root by default',
    wrong: '# No securityContext — container runs as root (UID 0)\ncontainers:\n  - name: api\n    image: ghcr.io/org/api:v1',
    right: 'securityContext:\n  runAsNonRoot: true\n  runAsUser: 1000\n  allowPrivilegeEscalation: false',
    explanation: 'Docker containers run as root by default unless the Dockerfile creates and switches to a non-root user. A root container process can read any file on the node if it escapes the container. Always set runAsNonRoot: true and a non-zero runAsUser.',
  },
  {
    title: 'Using mutable image tags (:latest) in production',
    wrong: 'image: ghcr.io/org/api:latest  # tag can be overwritten without warning',
    right: 'image: ghcr.io/org/api@sha256:abc123def456...  # immutable digest',
    explanation: 'Image tags like :latest or :v1 are mutable — a registry push can replace them without changing the tag. In production, reference images by digest (sha256:...) so the exact image content is pinned and cannot change without updating the manifest.',
  },
  {
    title: 'Not scanning images before deployment',
    wrong: '# No scanning in CI — deploying whatever the build produced\n# A dependency introduced a CRITICAL CVE last week',
    right: '# In CI pipeline:\ntrivy image --exit-code 1 --severity CRITICAL ghcr.io/org/api:$SHA\n# Fail the build; fix before deploying',
    explanation: 'Container images frequently inherit CVEs from base images or dependencies. Without scanning in CI, you may deploy images with known CRITICAL vulnerabilities. Integrate Trivy (or Snyk, Grype) into CI and fail builds on CRITICAL severity.',
  },
  {
    title: 'Granting containers unnecessary Linux capabilities',
    wrong: 'securityContext:\n  capabilities:\n    add: [SYS_ADMIN]  # extremely powerful — avoid',
    right: 'securityContext:\n  capabilities:\n    drop: [ALL]\n    add: [NET_BIND_SERVICE]  # only if binding port < 1024',
    explanation: 'SYS_ADMIN grants near-root access and is a common container escape vector. Drop ALL capabilities first, then add only what is strictly required. Most applications need zero capabilities if they run as non-root on ports > 1024.',
  },
  {
    title: 'Not applying a default-deny NetworkPolicy',
    wrong: '# No NetworkPolicy — all pods can talk to all pods\n# A compromised pod can reach the database directly',
    right: '# Default deny-all ingress in each namespace:\napiVersion: networking.k8s.io/v1\nkind: NetworkPolicy\nmetadata: { name: default-deny-ingress }\nspec:\n  podSelector: {}    # matches all pods\n  policyTypes: [Ingress]',
    explanation: 'By default all Pods in a cluster can communicate with all other Pods. A compromised frontend can reach the database directly. Apply a default-deny NetworkPolicy to each namespace and then explicitly allow only required traffic with allow-list policies.',
  },
];

const challenge: Challenge = {
  title: 'Security Context Scorer',
  language: 'typescript',
  description: 'Write a function that takes a container security context object and returns a security score (0–100) and a list of recommendations. Score points for: runAsNonRoot (+25), readOnlyRootFilesystem (+20), allowPrivilegeEscalation: false (+20), capabilities.drop includes ALL (+20), seccompProfile set (+15). Deduct 40 points if runAsUser is 0.',
  hints: [
    'Start at 0 and add points for each hardening setting',
    'Check runAsNonRoot: true for +25',
    'Check allowPrivilegeEscalation: false for +20',
    'Check capabilities.drop includes "ALL" for +20',
    'Check seccompProfile is defined for +15',
    'Deduct 40 if runAsUser === 0',
    'Return score clamped to 0-100 and an array of missing recommendations',
  ],
  starterCode: 'interface SecurityContext {\n  runAsNonRoot?: boolean;\n  runAsUser?: number;\n  readOnlyRootFilesystem?: boolean;\n  allowPrivilegeEscalation?: boolean;\n  capabilities?: { drop?: string[]; add?: string[] };\n  seccompProfile?: { type: string };\n}\n\ninterface SecurityScore {\n  score: number;\n  recommendations: string[];\n}\n\nfunction scoreSecurityContext(ctx: SecurityContext): SecurityScore {\n  // TODO: score and recommend\n  return { score: 0, recommendations: [] };\n}',
  solution: 'interface SecurityContext {\n  runAsNonRoot?: boolean;\n  runAsUser?: number;\n  readOnlyRootFilesystem?: boolean;\n  allowPrivilegeEscalation?: boolean;\n  capabilities?: { drop?: string[]; add?: string[] };\n  seccompProfile?: { type: string };\n}\n\ninterface SecurityScore {\n  score: number;\n  recommendations: string[];\n}\n\nfunction scoreSecurityContext(ctx: SecurityContext): SecurityScore {\n  let score = 0;\n  const recommendations: string[] = [];\n\n  if (ctx.runAsNonRoot === true) score += 25;\n  else recommendations.push(\'Set runAsNonRoot: true\');\n\n  if (ctx.readOnlyRootFilesystem === true) score += 20;\n  else recommendations.push(\'Set readOnlyRootFilesystem: true (add emptyDir for writable paths)\');\n\n  if (ctx.allowPrivilegeEscalation === false) score += 20;\n  else recommendations.push(\'Set allowPrivilegeEscalation: false\');\n\n  if (ctx.capabilities?.drop?.includes(\'ALL\')) score += 20;\n  else recommendations.push(\'Set capabilities.drop: [ALL]\');\n\n  if (ctx.seccompProfile) score += 15;\n  else recommendations.push(\'Set seccompProfile.type: RuntimeDefault\');\n\n  if (ctx.runAsUser === 0) score -= 40;\n\n  return { score: Math.max(0, Math.min(100, score)), recommendations };\n}',
};

const quiz: QuizQuestion[] = [
  {
    q: 'What does readOnlyRootFilesystem: true do?',
    options: [
      'Prevents the container from reading any files on the host',
      'Makes the container\'s own root filesystem read-only — writes must use mounted volumes',
      'Blocks write access to Kubernetes Secrets and ConfigMaps',
      'Applies a Linux AppArmor profile to the container',
    ],
    answer: 1,
    explanation: 'readOnlyRootFilesystem: true makes the container\'s layered filesystem (the image layers) read-only. Any application that needs to write files must use mounted volumes (emptyDir, PVC). This prevents an attacker from writing files to the container filesystem after compromise.',
  },
  {
    q: 'What is the risk of granting a container the SYS_ADMIN Linux capability?',
    options: [
      'It allows the container to run on the control plane nodes',
      'SYS_ADMIN is near-root access and is a common container escape vector',
      'It gives the container read access to all other namespaces',
      'It enables the container to pull images from private registries',
    ],
    answer: 1,
    explanation: 'SYS_ADMIN is an extremely broad capability covering dozens of privileged operations (mount filesystems, modify kernel parameters, trace processes). It is a well-known container escape vector. Always drop ALL capabilities and only add the specific minimal capability required (e.g. NET_BIND_SERVICE).',
  },
  {
    q: 'Why should production image references use digest (sha256:...) instead of tags?',
    options: [
      'Digests download faster than tagged images',
      'Tags are mutable — a push can replace the image without changing the tag; digests are content-addressed and immutable',
      'Kubernetes only supports digest references for security-sensitive workloads',
      'Tags are not supported in Helm charts',
    ],
    answer: 1,
    explanation: 'An image tag like :v1.2.0 can be overwritten with a different image by pushing to the registry. A SHA256 digest uniquely identifies the exact image content — if the digest matches, you know exactly what you are running. Use digests in production for supply chain integrity.',
  },
  {
    q: 'What are the three Pod Security Admission enforcement levels?',
    options: [
      'low, medium, high',
      'permissive, audit, enforce',
      'privileged, baseline, restricted',
      'open, standard, locked',
    ],
    answer: 2,
    explanation: 'PSA defines three profiles: privileged (no restrictions — for system namespaces), baseline (prevents known privilege escalations — good default for most apps), and restricted (best-practice hardening — requires non-root, no privilege escalation, seccomp, etc.). Applied per-namespace via labels.',
  },
  {
    q: 'What does a default-deny NetworkPolicy in a namespace do?',
    options: [
      'It denies all external traffic to the cluster at the network perimeter',
      'It blocks all ingress to Pods in the namespace by default — explicit allow-list rules are required',
      'It prevents Pods from reaching the Kubernetes API server',
      'It denies traffic from unlabelled Pods only',
    ],
    answer: 1,
    explanation: 'A NetworkPolicy with an empty podSelector (matches all Pods) and policyTypes: [Ingress] blocks all inbound Pod-to-Pod traffic in the namespace. You then add specific NetworkPolicy rules to allow only the traffic you need. This zero-trust model limits blast radius if a Pod is compromised.',
  },
  { q: 'What does running a container with --privileged do?', options: ['Limits CPU usage to a privileged resource tier', 'Grants the container nearly all Linux capabilities and host device access, equivalent to running as root on the host', 'Enables SELinux policy enforcement inside the container', 'Creates a read-only container filesystem for security'], answer: 1, explanation: '--privileged removes nearly all container isolation: the container gets ALL Linux capabilities, can access ALL host devices, mount filesystems, load kernel modules, and modify host network settings. Avoid in production. Instead grant only specific capabilities needed with --cap-add and drop all others with --cap-drop ALL. Use securityContext in the Kubernetes pod spec for fine-grained control per container.' },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between seccomp and AppArmor?',
    a: 'seccomp filters syscalls — it blocks system calls that a container process is not allowed to make (e.g. ptrace, mount). AppArmor is a MAC (Mandatory Access Control) system that enforces path-based access control on files and network operations. Both are defence-in-depth: seccomp limits what the kernel allows; AppArmor limits what the process can access. They are complementary.',
  },
  {
    q: 'What replaced PodSecurityPolicy (PSP) and how do I migrate?',
    a: 'PSP was deprecated in K8s 1.21 and removed in K8s 1.25. It was replaced by Pod Security Admission (PSA), which uses namespace labels to enforce privileged/baseline/restricted profiles. For more granular policies that PSA can\'t express, use Kyverno or OPA Gatekeeper admission webhook policies. The Kubernetes PSP migration guide provides step-by-step instructions.',
  },
  {
    q: 'How do I handle an app that needs write access when readOnlyRootFilesystem is enabled?',
    a: 'Mount emptyDir volumes at the paths that need write access: /tmp, /var/cache, /app/logs. These are in-memory (tmpfs by default) and cleared when the Pod is removed. For persistent write paths, use a PVC. This approach still achieves a read-only image layer while providing writable paths for runtime data.',
  },
  {
    q: 'What is Cosign and why is image signing important?',
    a: 'Cosign (part of the Sigstore project) signs container images by attaching a cryptographic signature to the image manifest in the registry. Policy engines (Kyverno, OPA Gatekeeper) can verify signatures at admission — rejecting unsigned or tampered images. This closes the supply chain gap: even if an attacker compromises your registry, they cannot deploy unsigned images.',
  },
  {
    q: 'Can Pod Security Admission alone prevent a privileged container from running, or is another control also needed?',
    a: 'Pod Security Admission enforcing the "restricted" or "baseline" standard on a namespace will reject a Pod spec requesting privileged: true at admission time — but this only works if the namespace label is actually set correctly, and PSA is a namespace-level opt-in, not a cluster-wide hard block. For defense in depth, most production clusters combine PSA with an admission controller policy engine (OPA Gatekeeper, Kyverno) that enforces the restriction cluster-wide regardless of per-namespace labeling, and with RBAC that prevents most users from creating Pods with privileged securityContext fields in the first place.',
  },
  { q: 'What is a Pod Security Standard and how do you enforce it?', a: 'Pod Security Standards replace deprecated PodSecurityPolicies in Kubernetes 1.25 and later. Three levels: Privileged (no restrictions), Baseline (prevents known privilege escalations such as hostPID, hostNetwork, and privileged containers), Restricted (heavily restricted: no root user, no privilege escalation, seccomp profile required). Enforce via namespace labels: kubectl label namespace myns pod-security.kubernetes.io/enforce=restricted. Also set warn and audit modes to surface violations without blocking deployments. Audit violations appear in the API server audit log.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Harden containers: run as non-root, read-only filesystem, drop ALL capabilities, pin image digests, scan for CVEs — and enforce with PSA and NetworkPolicies.',
  mustKnow: [
    'runAsNonRoot: true + runAsUser: 1000; never UID 0 in production',
    'readOnlyRootFilesystem: true + emptyDir for writable paths',
    'allowPrivilegeEscalation: false; capabilities: drop: [ALL]',
    'seccompProfile: RuntimeDefault — blocks ~40% of unnecessary syscalls',
    'Scan images in CI (Trivy) on CRITICAL; pin to sha256 digest in prod',
    'PSA labels on namespaces (restricted); default-deny NetworkPolicy in every namespace',
  ],
  interviewFocus: [
    'What security context settings do you always set for production containers?',
    'Why are image tags unsafe for production deployments?',
    'What replaced PodSecurityPolicy and how does it work?',
    'How would you implement a zero-trust network model in Kubernetes?',
  ],
};

@Component({
  selector: 'app-k8s-container-security',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent,
    PageCompleteComponent,
  ],
  templateUrl: './container-security.html',
  styleUrl: './container-security.scss',
})
export class K8sContainerSecurity {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
