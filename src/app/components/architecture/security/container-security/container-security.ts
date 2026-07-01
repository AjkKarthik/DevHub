import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  { name: 'Non-root User',     type: 'keyword', desc: 'Run container processes as a non-root UID — breach is contained, no host root escalation.' },
  { name: 'Read-only FS',      type: 'keyword', desc: 'readOnlyRootFilesystem: true — attacker cannot write malware or alter config.' },
  { name: 'Image Scanning',    type: 'keyword', desc: 'Trivy/Snyk — detect CVEs in OS packages and language dependencies in container images.' },
  { name: 'Distroless',        type: 'keyword', desc: 'Minimal base images (no shell, no package manager) — drastically reduces attack surface.' },
  { name: 'Pod Security',      type: 'keyword', desc: 'Kubernetes Pod Security Standards — restricted/baseline/privileged policies.' },
  { name: 'seccomp',           type: 'keyword', desc: 'Syscall filter — restricts which Linux system calls a container can make.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Docker Security Principles',
    points: [
      'Containers share the host kernel — they are NOT virtual machines. A container breakout can compromise the host. Minimise the blast radius with non-root users, read-only filesystems, and dropped capabilities.',
      'Non-root user: run as UID 1000+. If an attacker escapes the container as root, they have host root. As a non-root user, they have limited host access.',
      'Read-only root filesystem: `--read-only` or `readOnlyRootFilesystem: true` in K8s. Attacker cannot install tools, modify configs, or write malware. Mount `/tmp` as a separate `tmpfs` for writable scratch space.',
      'Drop all capabilities: `--cap-drop ALL` then `--cap-add` only what is needed (e.g., `NET_BIND_SERVICE` for port <1024). Capabilities like `SYS_PTRACE`, `SYS_ADMIN` are high-risk.',
    ],
  },
  {
    heading: 'Base Image Selection',
    points: [
      'Distroless images (gcr.io/distroless): contain only the runtime (Node.js, JRE, Python) — no shell, no package manager, no utilities. An attacker who gains code execution has no tools to use.',
      'Alpine Linux: ~5 MB, minimal package surface. Not distroless but far smaller than debian/ubuntu. Verify packages are up to date — Alpine uses musl libc which has different CVE profiles.',
      'Pin image versions: `FROM node:20.11.1-alpine3.19` not `FROM node:20-alpine`. Floating tags change unexpectedly — you may pull a compromised image.',
      'Multi-stage builds: build in a full image (with compilers, dev tools); copy only the artifact to a minimal runtime image. Credentials and build-time secrets never enter the final image.',
    ],
  },
  {
    heading: 'Kubernetes Pod Security',
    points: [
      'Pod Security Standards (replacing PSP): Restricted (most secure — no privilege escalation, non-root, read-only FS), Baseline (blocks known privilege escalations), Privileged (no restrictions).',
      'Apply with Pod Security Admission: `pod-security.kubernetes.io/enforce: restricted` label on a namespace.',
      'seccomp: `seccompProfile: RuntimeDefault` — uses the container runtime\'s default syscall allowlist. Blocks obscure syscalls used in kernel exploits.',
      'AppArmor / SELinux: mandatory access control at the OS level. Container runtime can load profiles that restrict file, network, and capability access beyond what seccomp provides.',
    ],
  },
  {
    heading: 'Image Scanning and Supply Chain',
    points: [
      'Scan images in CI before pushing to registry: Trivy, Snyk, Grype. Fail the build on HIGH/CRITICAL CVEs in the base image or application dependencies.',
      'Private registry: push to a private ECR/GCR/ACR rather than pulling from public Docker Hub at deploy time. Rate limits and poisoned images are real risks.',
      'Image signing (Cosign): sign container images with a cryptographic key. Kubernetes admission webhooks can reject unsigned or unsigned-by-trusted-key images.',
      'Regular rebuild: rebuild images on a schedule (weekly) even without code changes — picks up OS package security updates.',
    ],
  },
  {
    heading: 'Minimizing the Container Attack Surface',
    points: [
      'Base image choice matters significantly — a minimal base image (distroless, Alpine) ships far fewer installed packages than a full OS image, directly reducing the number of potential CVEs and the exploitability of the running container if compromised.',
      'Multi-stage Docker builds let you compile/build with a full toolchain in one stage, then copy only the compiled artifact into a minimal final-stage image — eliminating build tools, package managers, and source code from the production image entirely.',
      'Never run a container process as root — set a non-root USER in the Dockerfile and configure the orchestrator (Kubernetes securityContext) to enforce it, limiting the damage a container escape or code execution vulnerability could cause on the host.',
      'Scan container images for known vulnerabilities (Trivy, Snyk, Grype) as part of CI, before images are pushed to a registry — catching a vulnerable dependency at build time is far cheaper than discovering it after deployment to production.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Secure Dockerfile',
    language: 'typescript',
    code: `# ── Multi-stage build: build stage ──────────────────────────────────────────
FROM node:20.11.1-alpine3.19 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production   # install deps

COPY . .
RUN npm run build              # compile TypeScript etc.

# ── Runtime stage: distroless ────────────────────────────────────────────────
FROM gcr.io/distroless/nodejs20-debian12 AS runtime

# Non-root user (distroless has 'nonroot' user built in)
USER nonroot:nonroot

WORKDIR /app

# Copy only built artifact — no source, no dev deps, no compilers
COPY --from=builder --chown=nonroot:nonroot /app/dist ./dist
COPY --from=builder --chown=nonroot:nonroot /app/node_modules ./node_modules

EXPOSE 3000

# No shell in distroless — use CMD array form
CMD ["/app/dist/main.js"]

# ── .dockerignore — keep secrets out of image ────────────────────────────────
# .env
# .env.*
# *.pem *.key
# node_modules
# .git
# Dockerfile`,
  },
  {
    label: 'Kubernetes Security Context',
    language: 'typescript',
    code: `# ── Secure Pod spec ──────────────────────────────────────────────────────────
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  template:
    spec:
      # Pod-level security context
      securityContext:
        runAsNonRoot: true          # Kubernetes rejects root containers
        runAsUser:  1000
        runAsGroup: 1000
        fsGroup:    1000
        seccompProfile:
          type: RuntimeDefault      # default syscall allowlist

      containers:
      - name: api
        image: gcr.io/myproject/api:sha256-abc123  # pinned digest, not tag
        securityContext:
          allowPrivilegeEscalation: false  # cannot gain more privileges
          readOnlyRootFilesystem:    true  # no writing to /
          capabilities:
            drop: [ALL]
            add:  []               # add NET_BIND_SERVICE if needed for port 80

        # Write-only mounts for runtime needs
        volumeMounts:
        - name: tmp
          mountPath: /tmp          # writable scratch space

        # Secrets from Kubernetes Secrets / Vault agent
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key:  database-url

      volumes:
      - name: tmp
        emptyDir: {}               # in-memory tmpfs`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Running containers as root',
    wrong: `# Dockerfile with no USER instruction — runs as root by default
FROM node:20
COPY . .
CMD ["node", "app.js"]`,
    right: `FROM node:20-alpine
# Create non-root user
RUN addgroup -S app && adduser -S app -G app
USER app
COPY --chown=app:app . .
CMD ["node", "app.js"]`,
    explanation: 'Running as root inside a container means a container escape gives the attacker root on the host. A non-root user limits escape impact — the attacker gets a low-privilege shell on the host (or none at all with proper security contexts).',
  },
  {
    title: 'Copying secrets into the image via ENV or COPY',
    wrong: `# Secret baked into image — anyone with docker pull access can read it
ENV DATABASE_PASSWORD=supersecret123
COPY .env /app/.env`,
    right: `# Inject at runtime via K8s Secrets / environment variables
# Never bake secrets into the image layer
# Use: docker run -e DATABASE_URL=$DATABASE_URL myapp`,
    explanation: 'Docker image layers are immutable and readable — `docker history` and `docker inspect` reveal ENV values. `.env` files copied in are readable with `docker run myimage cat /app/.env`. Inject secrets at runtime, never at build time.',
  },
  {
    title: 'Using floating image tags in production',
    wrong: `FROM node:20-alpine   # this image changes without warning
image: myapp:latest   # latest tag in K8s — unpredictable`,
    right: `FROM node:20.11.1-alpine3.19  # pinned exact version
image: gcr.io/myproject/myapp@sha256:abc123...  # pinned digest`,
    explanation: 'Floating tags (`latest`, `20-alpine`) are updated by maintainers at any time. A security patch pull might also pull in a breaking change or a compromised image. Pin to exact versions in Dockerfiles; pin to image digests (SHA256) in Kubernetes manifests.',
  },
  {
    title: 'Not scanning images for CVEs before deploying',
    wrong: `# CI pipeline: build and push without scanning
docker build -t myapp:latest .
docker push myapp:latest`,
    right: `# Add Trivy scan step before push
docker build -t myapp:latest .
trivy image --exit-code 1 --severity HIGH,CRITICAL myapp:latest
docker push myapp:latest`,
    explanation: 'Base images accumulate CVEs over time. Scanning in CI catches HIGH/CRITICAL vulnerabilities before they reach production. Trivy, Grype, and Snyk Container all integrate well into CI pipelines and fail the build on critical findings.',
  },
];

const challenge: Challenge = {
  title: 'Container Security Scorer',
  language: 'typescript',
  description: `Implement scoreContainerConfig(config: ContainerConfig): { score: number; issues: string[] } that scores 0-100:
- runAsNonRoot: true → +25 points
- readOnlyRootFilesystem: true → +25 points
- allowPrivilegeEscalation: false → +25 points
- capabilities.drop includes 'ALL' → +25 points
Issues list for each missing security control.`,
  hints: [
    'Start with score 0, add 25 for each passing check',
    'Push to issues array for each failing check',
    'Array.includes() for capabilities check',
  ],
  starterCode: `interface ContainerConfig {
  runAsNonRoot?: boolean;
  readOnlyRootFilesystem?: boolean;
  allowPrivilegeEscalation?: boolean;
  capabilities?: { drop?: string[] };
}
function scoreContainerConfig(config: ContainerConfig): { score: number; issues: string[] } {
  let score = 0;
  const issues: string[] = [];
  // TODO
  return { score, issues };
}`,
  solution: `interface ContainerConfig {
  runAsNonRoot?: boolean;
  readOnlyRootFilesystem?: boolean;
  allowPrivilegeEscalation?: boolean;
  capabilities?: { drop?: string[] };
}
function scoreContainerConfig(config: ContainerConfig): { score: number; issues: string[] } {
  let score = 0;
  const issues: string[] = [];
  if (config.runAsNonRoot) score += 25; else issues.push('Set runAsNonRoot: true');
  if (config.readOnlyRootFilesystem) score += 25; else issues.push('Set readOnlyRootFilesystem: true');
  if (config.allowPrivilegeEscalation === false) score += 25; else issues.push('Set allowPrivilegeEscalation: false');
  if (config.capabilities?.drop?.includes('ALL')) score += 25; else issues.push('Drop ALL capabilities');
  return { score, issues };
}
console.log(scoreContainerConfig({ runAsNonRoot: true, readOnlyRootFilesystem: true, allowPrivilegeEscalation: false, capabilities: { drop: ['ALL'] } }));
// { score: 100, issues: [] }`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Why should containers run as a non-root user?',
    options: [
      'Root containers consume more memory',
      'A container escape as root gives the attacker host root; a non-root escape is significantly less dangerous',
      'Kubernetes requires non-root for networking',
      'Root processes cannot read environment variables',
    ],
    answer: 1,
    explanation: 'Docker containers share the host kernel. If an attacker escapes a root container, they have root on the host — full compromise. A non-root container escape gives the attacker a low-privilege shell, dramatically limiting what they can do to the host.',
  },
  {
    q: 'What is the primary security benefit of a distroless container image?',
    options: [
      'Smaller image size improves deployment speed',
      'No shell or package manager — attacker who gains code execution has no tools to escalate or pivot',
      'Distroless images are automatically updated by Google',
      'They include built-in network encryption',
    ],
    answer: 1,
    explanation: 'Distroless images contain only the language runtime and application — no shell (bash/sh), no package manager (apt/apk), no wget/curl. An attacker who achieves remote code execution cannot install tools, run interactive commands, or easily move laterally.',
  },
  { q: 'What is the Docker daemon socket security risk and how do you mitigate it?', options: ['The Docker socket is unencrypted; use TLS to secure it', 'Mounting the Docker daemon socket into a container gives that container root-equivalent access to the host; mitigate by avoiding socket mounts and using rootless Docker or dedicated container management APIs', 'The Docker socket exposes container logs publicly; restrict access with firewall rules', 'The Docker daemon socket must be restarted daily for security patches to take effect'], answer: 1, explanation: 'Mounting /var/run/docker.sock into a container gives it full control over all containers on the host, equivalent to root access. An attacker who compromises such a container can escape to the host by launching a privileged container. Mitigations: never mount the Docker socket into application containers. Use rootless Docker (daemon runs as a non-root user). Use the Docker API over TLS with client certificate authentication if remote access is needed. For CI/CD systems that need to build Docker images: use BuildKit or Kaniko which run as unprivileged containers. Use dedicated build environments isolated from production.' },
  { q: 'What are the key security principles for Dockerfile best practices?', options: ['Use the latest base image tag for automatic security updates', 'Use minimal base images (distroless, alpine), run as a non-root user, avoid secrets in build args, use multi-stage builds to exclude build tools from the final image', 'Build all images as root for maximum compatibility with file permissions', 'Combine all RUN commands into a single layer for better security isolation'], answer: 1, explanation: 'Dockerfile security: FROM minimal-base (distroless or alpine minimizes attack surface — fewer packages, fewer vulnerabilities). USER nonroot (never run the application as root inside the container — reduces exploit impact). Multi-stage builds: the build stage has compilers and build tools; the final stage contains only the compiled binary. Secrets: never pass API keys via ARG (visible in docker history) or ENV in Dockerfile. Use Docker secrets or environment variables at runtime. Lock base image versions: FROM ubuntu:22.04 not FROM ubuntu:latest. Regularly rebuild images to get updated OS packages.' },
  { q: 'What is a Pod Security Admission controller in Kubernetes and what does it enforce?', options: ['A controller that scans pod images for vulnerabilities before admission', 'A Kubernetes admission webhook that enforces security policies on pods, such as preventing privileged containers, requiring read-only root filesystems, and restricting capabilities', 'A network policy controller that restricts pod-to-pod communication', 'A resource quota controller that limits CPU and memory per namespace'], answer: 1, explanation: 'Pod Security Admission (PSA, successor to PodSecurityPolicy) enforces security standards on pods at admission time. Three predefined policies: Privileged (no restrictions), Baseline (prevents privilege escalation, host network/PID access), Restricted (enforces security best practices: non-root user, no privilege escalation, read-only root filesystem, dropped capabilities). Apply per namespace with labels: pod-security.kubernetes.io/enforce=restricted. Pods that violate the policy are rejected at creation time. Use Restricted for production workloads. Baseline for legacy workloads that cannot immediately meet Restricted requirements.' },
  { q: 'What is a supply chain attack on container images and how do image signing tools prevent it?', options: ['An attack that corrupts the container network supply chain between nodes', 'Modifying a container image between build and deployment (in a registry) to inject malicious code; image signing (Cosign, Notary) ensures the image has not been tampered with since it was signed by the build pipeline', 'An attack that targets the container runtime to break out of the container', 'A replay attack using old container images with known vulnerabilities'], answer: 1, explanation: 'Supply chain attack: an attacker modifies an image in a registry (compromised registry, MitM during push/pull) or compromises the build pipeline to inject malware. Image signing prevents this: after building, the CI pipeline signs the image digest with a private key (Cosign). At deployment, the admission controller (Connaisseur, Kyverno) verifies the signature using the public key before allowing the image to run. Unsigned or invalidly signed images are rejected. Policy: only images signed by the official CI pipeline key are allowed in production. Container image SBOMs (Software Bill of Materials) document all included components for vulnerability tracking.' },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between seccomp and AppArmor/SELinux for container security?',
    a: '<strong>seccomp</strong>: restricts which Linux <em>system calls</em> a container can make. The container runtime\'s default profile blocks ~44 dangerous syscalls (e.g., <code>ptrace</code>, <code>mount</code>, <code>kexec_load</code>). <code>RuntimeDefault</code> is safe for most workloads. <strong>AppArmor / SELinux</strong>: mandatory access control (MAC) — restricts file access, network operations, and capabilities at the OS level. More expressive than seccomp: can say "this process may only read /app, not /etc/passwd." Both are complementary; many hardened Kubernetes setups use all three: seccomp + AppArmor/SELinux + dropped capabilities.',
  },
  {
    q: 'What is a multi-stage Docker build and why does it improve security?',
    a: 'A multi-stage build uses multiple <code>FROM</code> instructions. The first stage (builder) has all build tools — compilers, dev dependencies, test tools. The final stage copies only the compiled artifact to a minimal base image. Security benefits: <ul><li>Secrets used during build (e.g., npm tokens, git credentials) never appear in the final image</li><li>Build tools (compilers, package managers) are not in the runtime image — less attack surface</li><li>Dev dependencies not in production image</li><li>Much smaller image (100MB vs 1GB)</li></ul>',
  },
  { q: 'How do you implement least privilege for containers?', a: 'Least privilege for containers: drop all Linux capabilities and add back only what is needed. Default Docker containers run with a subset of root capabilities; explicitly drop all: --cap-drop=ALL, then add specific needed capabilities: --cap-add=NET_BIND_SERVICE (for binding port 80). Set securityContext.runAsNonRoot: true and runAsUser to a specific non-zero UID in Kubernetes pod specs. Set readOnlyRootFilesystem: true and mount writable volumes only for specific directories (logs, temp). Set allowPrivilegeEscalation: false. Use seccompProfile with a restrictive syscall filter (RuntimeDefault or a custom Seccomp profile). These controls limit what an exploited container process can do on the host.' },
  { q: 'What is namespace isolation in Kubernetes and what are its limitations?', a: 'Kubernetes namespaces provide soft isolation: different teams or environments can use different namespaces with separate RBAC policies and resource quotas. Network policies restrict cross-namespace traffic. However, namespaces are NOT strong security boundaries: the Kubernetes API server serves all namespaces; an RBAC misconfiguration can allow cross-namespace access. Container escapes allow access across namespace boundaries at the host level. Nodes are shared across namespaces unless node affinity and taints restrict placement. For strong isolation between tenants: use separate clusters (true isolation) or virtual clusters (vcluster). Namespace isolation is appropriate for team separation within the same trust domain, not for isolating mutually untrusting tenants.' },
  { q: 'What is a runtime security tool and what does Falco detect?', a: 'Runtime security tools monitor container behavior during execution, detecting anomalous activity that static scanning missed. Falco (CNCF) uses eBPF or kernel module probes to monitor system calls in real time. Detection rules: container opening a shell (exec /bin/bash inside a running production container). Sensitive file reads (/etc/shadow, /proc/1/environ). Unexpected outbound network connections from a container that should not make external calls. Writing to directories that should be read-only. Privilege escalation attempts. Falco rules are YAML-based and customizable. Alerts go to stdout, Slack, or security platforms (Datadog, Splunk). Complements static analysis: static analysis prevents known-bad images; runtime security detects unknown-bad behavior.' },
  { q: 'How do you manage secrets in containerized environments?', a: 'Anti-patterns to avoid: embedding secrets in Docker images or environment variables set at build time. Storing secrets in git repositories with container definitions. Mounting secret files without access controls. Correct approaches: Kubernetes Secrets mounted as volumes or environment variables (encrypted at rest in etcd if configured; still base64-encoded, not truly secret without etcd encryption). External secret stores: HashiCorp Vault, AWS Secrets Manager, or Azure Key Vault. The pod authenticates to the secrets store (via service account, IAM role, or workload identity) and fetches secrets at startup. Sealed Secrets (Bitnami): secrets are encrypted with a cluster-specific public key and can be stored in git; the controller decrypts them in-cluster. Secret rotation: containers should refresh secrets without restart, using dynamic credentials from Vault.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Secure containers: non-root user, read-only FS, drop all capabilities, distroless/minimal base, pinned image digests, scan for CVEs, never bake secrets into image layers.',
  mustKnow: [
    'Non-root: root container escape = host root; non-root escape = limited host access',
    'readOnlyRootFilesystem: attacker cannot install tools or alter config',
    'allowPrivilegeEscalation: false — cannot use setuid or sudo inside container',
    'Drop ALL capabilities; add back only what is needed (NET_BIND_SERVICE)',
    'Distroless images: no shell, no package manager — attacker has no tools post-exploit',
    'Never copy .env or credentials into image layers — inject at runtime via K8s Secrets',
  ],
  interviewFocus: [
    'Why run containers as non-root?',
    'What is the security benefit of a distroless base image?',
    'How do you prevent secrets from being baked into Docker images?',
  ],
};

@Component({
  selector: 'app-sec-container-security',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './container-security.html',
  styleUrl: './container-security.scss',
})
export class SecContainerSecurity {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
