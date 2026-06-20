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
  selector: 'app-devops-docker-cicd',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './docker-cicd.html',
  styleUrl: './docker-cicd.scss'
})
export class DevopsDockerCicd {

  quickRef: QuickRefItem[] = [
    { name: 'docker build', type: 'syntax', desc: 'Build image from Dockerfile; -t names it, --build-arg passes variables' },
    { name: 'docker buildx build', type: 'syntax', desc: 'Extended builder supporting multi-platform and advanced cache mounts' },
    { name: '--cache-from / --cache-to', type: 'syntax', desc: 'Import/export layer cache; enables cross-pipeline caching via registry' },
    { name: 'Multi-stage build', type: 'keyword', desc: 'Multiple FROM statements; only the final stage ships — keeps image lean' },
    { name: 'COPY --from=stage', type: 'syntax', desc: 'Copy artefacts from an earlier build stage into the final image' },
    { name: '.dockerignore', type: 'keyword', desc: 'Excludes files from build context; reduces image size and build time' },
    { name: 'Trivy', type: 'keyword', desc: 'Open-source vulnerability scanner for images, filesystems, and IaC' },
    { name: 'docker scout', type: 'keyword', desc: 'Docker-native image vulnerability scanner integrated into Docker Hub' },
    { name: 'SBOM', type: 'keyword', desc: 'Software Bill of Materials — machine-readable inventory of all dependencies' },
    { name: 'BuildKit', type: 'keyword', desc: 'Modern Docker build backend; required for cache mounts and secret mounts' },
    { name: '--target stage', type: 'syntax', desc: 'Build only up to a named stage; useful for test images in CI' },
    { name: 'docker push', type: 'syntax', desc: 'Push tagged image to registry; always tag with commit SHA for traceability' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why Docker in CI/CD pipelines',
      points: [
        'Containers give reproducible build environments — no "works on my machine" drift between developer laptops and CI runners.',
        'A Dockerfile codifies every build dependency as code, making it auditable and version-controlled.',
        'Images are immutable artefacts: build once, promote through environments; the binary that passes tests is exactly the binary that ships to production.',
        'Container runtimes (Kubernetes, ECS, App Service) consume images directly — the CD step is just "update the image tag".',
        'Image scanning in the CI pipeline catches known CVEs before they reach production, shifting security left.',
      ]
    },
    {
      heading: 'Multi-stage builds — keep production images lean',
      points: [
        'A multi-stage Dockerfile has several FROM instructions. Only the final stage produces the shipped image; earlier stages act as build environments.',
        'Stage 1 (build): install compilers, build tools, dev dependencies, run tests — typically a large SDK image.',
        'Stage 2 (runtime): copy only compiled binaries/assets from stage 1 into a minimal base (alpine, distroless, slim) — no build tools, no source code, no test fixtures.',
        'Result: production image may be 5–20× smaller, with a dramatically smaller attack surface.',
        'Use --target in CI to build only the test stage and fail the pipeline if tests fail, before building the expensive runtime stage.',
      ]
    },
    {
      heading: 'Layer caching — fast incremental builds',
      points: [
        'Docker caches each instruction as a layer. If the instruction and all preceding instructions are unchanged, Docker reuses the cached layer instead of re-executing.',
        'Order matters: copy package manifests (package.json, *.csproj) before copying source code so dependency installation is cached between commits that only change source.',
        'CI runners are ephemeral — layers cached on one machine are gone on the next. Solve with registry-backed cache: --cache-from type=registry,ref=myimage:cache and --cache-to type=registry,ref=myimage:cache,mode=max.',
        'BuildKit cache mounts (RUN --mount=type=cache) persist package manager caches (npm, pip, Maven) without storing them in layers.',
        'GitHub Actions Docker layer caching can also use actions/cache against /tmp/.buildx-cache.',
      ]
    },
    {
      heading: 'Image tagging strategy',
      points: [
        'Tag every image with the Git commit SHA: registry/image:abc1234. This gives a direct link from the running container back to the exact source commit.',
        'Also tag with semantic version on release (v1.2.3) and with branch name for short-lived builds (feature-xyz).',
        'Never use latest as the only tag in production — it breaks rollback and traceability.',
        'Immutability rule: once pushed, never overwrite a SHA-tagged image. Promote the same image across environments; do not rebuild.',
        'Multi-arch builds: use docker buildx with --platform linux/amd64,linux/arm64 to support Apple Silicon developers and ARM cloud instances with a single image manifest.',
      ]
    },
    {
      heading: 'Image scanning and supply chain security',
      points: [
        'Scan for known CVEs before pushing: trivy image myimage:tag or docker scout quickview. Fail the pipeline if critical or high-severity vulns are found.',
        'Scan at build time AND periodically in the registry (vulnerabilities are discovered after images ship; re-scan weekly).',
        'Generate an SBOM (Software Bill of Materials) at build time with syft or docker buildx bake --sbom=true. An SBOM lists every package and its version, enabling fast triage when a new CVE drops.',
        'Sign images with Cosign (sigstore/cosign): pairs a signature with the image digest in the registry. Kubernetes admission controllers can reject unsigned images.',
        'Secrets must never appear in Dockerfile layers — use BuildKit --secret mounts (RUN --mount=type=secret) or pass them at runtime via environment variables, not ARG/ENV.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Multi-Stage Dockerfile + CI Pipeline',
      language: 'bash',
      code: `# ─── Dockerfile (Node.js example) ───────────────────────────────────────────

# Stage 1 — dependencies + test
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --include=dev

FROM deps AS test
COPY . .
RUN npm test -- --passWithNoTests

# Stage 2 — production build
FROM deps AS build
COPY . .
RUN npm run build --if-present

# Stage 3 — lean runtime image
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Only copy what's needed
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

EXPOSE 3000
CMD ["node", "dist/main.js"]

# ─── GitHub Actions CI workflow ───────────────────────────────────────────────

# .github/workflows/docker.yml
name: Docker Build & Push

on:
  push:
    branches: [main, development]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: \$\{\{ github.repository }}

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GHCR
        if: github.event_name != 'pull_request'
        uses: docker/login-action@v3
        with:
          registry: \$\{\{ env.REGISTRY }}
          username: \$\{\{ github.actor }}
          password: \$\{\{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata (tags, labels)
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: \$\{\{ env.REGISTRY }}/\$\{\{ env.IMAGE_NAME }}
          tags: |
            type=sha,format=short
            type=semver,pattern={{version}}
            type=ref,event=branch

      # Build test stage only on PRs — fail fast
      - name: Build & test (PR only)
        if: github.event_name == 'pull_request'
        uses: docker/build-push-action@v5
        with:
          context: .
          target: test
          cache-from: type=gha
          cache-to: type=gha,mode=max

      # Full build + push on merge
      - name: Build & push (merge)
        if: github.event_name != 'pull_request'
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: \$\{\{ steps.meta.outputs.tags }}
          labels: \$\{\{ steps.meta.outputs.labels }}
          cache-from: type=registry,ref=\$\{\{ env.REGISTRY }}/\$\{\{ env.IMAGE_NAME }}:buildcache
          cache-to: type=registry,ref=\$\{\{ env.REGISTRY }}/\$\{\{ env.IMAGE_NAME }}:buildcache,mode=max`,
    },
    {
      label: 'Layer Cache Optimisation',
      language: 'bash',
      code: `# ─── Optimised Dockerfile layer order ───────────────────────────────────────
# Rule: most-stable layers first, most-volatile last.

# BAD — copy everything first, then install: cache busts on every source change
FROM node:22-alpine AS bad
WORKDIR /app
COPY . .                    # <-- cache busts here on any file change
RUN npm ci                  # <-- re-runs on every commit even if package.json unchanged

# GOOD — copy manifests first
FROM node:22-alpine AS good
WORKDIR /app
COPY package*.json ./       # <-- only busts when package.json changes
RUN npm ci                  # <-- cached on every source-only commit
COPY . .                    # source code is volatile — copy last

# ─── BuildKit cache mounts (don't store pkg cache in layers) ─────────────────

# syntax=docker/dockerfile:1
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
# --mount=type=cache persists npm cache across builds without bloating layers
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline
COPY . .
RUN npm run build

# ─── Secret mounts — never bake tokens into layers ───────────────────────────

# syntax=docker/dockerfile:1
FROM node:22-alpine
WORKDIR /app
# Secret is available at /run/secrets/npmrc during this RUN only
# It does NOT appear in any image layer
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm ci
COPY . .

# Build command passes the secret:
# docker buildx build --secret id=npmrc,src=.npmrc .

# ─── Multi-platform build ─────────────────────────────────────────────────────

# Create and use a multi-platform builder
# docker buildx create --name multi --use
# docker buildx build \\
#   --platform linux/amd64,linux/arm64 \\
#   --tag ghcr.io/org/app:1.0.0 \\
#   --push .

# ─── GitHub Actions layer cache with actions/cache ───────────────────────────
# (alternative to registry cache when you control the runner)

# - name: Cache Docker layers
#   uses: actions/cache@v4
#   with:
#     path: /tmp/.buildx-cache
#     key: \$\{\{ runner.os }}-buildx-\$\{\{ github.sha }}
#     restore-keys: |
#       \$\{\{ runner.os }}-buildx-

# - name: Build with local cache
#   uses: docker/build-push-action@v5
#   with:
#     cache-from: type=local,src=/tmp/.buildx-cache
#     cache-to: type=local,dest=/tmp/.buildx-cache-new,mode=max

# - name: Move cache (avoids unbounded growth)
#   run: |
#     rm -rf /tmp/.buildx-cache
#     mv /tmp/.buildx-cache-new /tmp/.buildx-cache`,
    },
    {
      label: 'Image Scanning & Signing',
      language: 'bash',
      code: `# ─── Trivy vulnerability scan ────────────────────────────────────────────────

# Scan local image — fail on CRITICAL severity
trivy image \\
  --exit-code 1 \\
  --severity CRITICAL,HIGH \\
  --ignore-unfixed \\
  myapp:1.0.0

# Output in SARIF format for GitHub Security tab
trivy image \\
  --format sarif \\
  --output trivy-results.sarif \\
  myapp:1.0.0

# GitHub Actions step
# - name: Scan image with Trivy
#   uses: aquasecurity/trivy-action@master
#   with:
#     image-ref: ghcr.io/org/app:abc1234
#     format: sarif
#     output: trivy.sarif
#     exit-code: 1
#     severity: CRITICAL,HIGH
#     ignore-unfixed: true

# - name: Upload scan results to GitHub Security
#   uses: github/codeql-action/upload-sarif@v3
#   with:
#     sarif_file: trivy.sarif

# ─── SBOM generation with Syft ───────────────────────────────────────────────

# Generate SBOM in SPDX JSON format
syft ghcr.io/org/app:abc1234 -o spdx-json=sbom.spdx.json

# Or via docker buildx (attaches SBOM to image manifest)
docker buildx build \\
  --sbom=true \\
  --provenance=true \\
  --tag ghcr.io/org/app:abc1234 \\
  --push .

# View SBOM attached to image
docker buildx imagetools inspect ghcr.io/org/app:abc1234 --format '{{json .SBOM}}'

# ─── Cosign image signing ─────────────────────────────────────────────────────

# Keyless signing with GitHub OIDC (no key management!)
# Runs in GitHub Actions with id-token: write permission

cosign sign ghcr.io/org/app:abc1234

# Verify signature
cosign verify \\
  --certificate-identity "https://github.com/org/repo/.github/workflows/docker.yml@refs/heads/main" \\
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \\
  ghcr.io/org/app:abc1234

# GitHub Actions — sign after push
# - name: Sign the image
#   env:
#     COSIGN_EXPERIMENTAL: 1   # enables keyless signing
#   run: cosign sign --yes ghcr.io/org/app@\$\{\{ steps.build.outputs.digest }}

# ─── Kubernetes: enforce signed images with Kyverno ──────────────────────────

# apiVersion: kyverno.io/v1
# kind: ClusterPolicy
# metadata:
#   name: require-signed-images
# spec:
#   rules:
#   - name: check-image-signature
#     match:
#       resources:
#         kinds: [Pod]
#     verifyImages:
#     - imageReferences: ["ghcr.io/org/*"]
#       attestors:
#       - entries:
#         - keyless:
#             issuer: https://token.actions.githubusercontent.com
#             subject: "https://github.com/org/repo/*"`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using latest as the only tag',
      wrong: `docker build -t myapp:latest .
docker push myapp:latest`,
      right: `SHA=$(git rev-parse --short HEAD)
docker build -t myapp:\${SHA} -t myapp:latest .
docker push myapp:\${SHA}
docker push myapp:latest`,
      explanation: 'latest is mutable — rolling back is impossible without the SHA tag. Always tag with the commit SHA so you can trace which build is deployed and roll back to a specific commit.',
    },
    {
      title: 'Copying source before package manifests',
      wrong: `COPY . .
RUN npm ci`,
      right: `COPY package*.json ./
RUN npm ci
COPY . .`,
      explanation: 'If you copy everything first, any source change busts the npm ci cache layer. Copy only the dependency manifest first so the expensive install step is cached across source-only commits.',
    },
    {
      title: 'Storing secrets in ARG or ENV',
      wrong: `ARG NPM_TOKEN
ENV NPM_TOKEN=\${NPM_TOKEN}
RUN npm ci`,
      right: `# syntax=docker/dockerfile:1
RUN --mount=type=secret,id=npm_token \\
    NPM_TOKEN=\$(cat /run/secrets/npm_token) npm ci`,
      explanation: 'ARG and ENV values are baked into the image layer and visible via docker history and docker inspect. Use BuildKit --mount=type=secret so the token is available only during that RUN step and never stored in any layer.',
    },
    {
      title: 'Building the full image before running tests',
      wrong: `# One-stage build: tests run inside a large prod image
FROM node:22
COPY . .
RUN npm ci && npm test && npm run build`,
      right: `FROM node:22 AS test
COPY . .
RUN npm ci && npm test

FROM node:22-alpine AS runtime
COPY --from=test /app/dist ./dist
RUN npm ci --omit=dev`,
      explanation: 'Multi-stage builds let CI build only the test stage first (--target test). If tests fail, the pipeline stops before building the larger runtime image — saving 30–60 seconds per failed run.',
    },
    {
      title: 'Skipping image scanning before push',
      wrong: `docker build -t myapp:1.0.0 . && docker push myapp:1.0.0`,
      right: `docker build -t myapp:1.0.0 .
trivy image --exit-code 1 --severity CRITICAL,HIGH myapp:1.0.0
docker push myapp:1.0.0`,
      explanation: 'Pushing an unscanned image can ship known critical vulnerabilities to production. Scan before push and fail the pipeline on critical/high findings. Tools: Trivy (open-source), Docker Scout, Snyk Container.',
    },
  ];

  challenge: Challenge = {
    title: 'Dockerfile Optimiser',
    language: 'typescript',
    description: `Analyse a Dockerfile string and return an ordered list of optimisation issues. Check for:
1. COPY . appearing before package manifest copies (cache bust risk) — severity: "high"
2. Secret-like patterns (ARG/ENV with TOKEN, PASSWORD, SECRET, KEY in the name) — severity: "critical"
3. No .dockerignore reference in comments or no NODE_ENV/ASPNETCORE_ENVIRONMENT set in runtime stage — severity: "medium"
4. No multi-stage build (only one FROM instruction) — severity: "medium"
5. Using FROM *:latest as base image — severity: "low"

Return issues as: { severity: 'critical'|'high'|'medium'|'low', message: string }[]
Sort by severity: critical first, then high, medium, low.`,
    hints: [
      'Split the Dockerfile into lines and scan for patterns with indexOf or regex.',
      'Count FROM instructions to detect single-stage builds.',
      'For COPY order: find the first "COPY . " line, then check if any "COPY package" or "COPY *.csproj" line appears after it.',
      'Use a severity order map {critical:0, high:1, medium:2, low:3} to sort results.',
    ],
    starterCode: `interface Issue { severity: 'critical' | 'high' | 'medium' | 'low'; message: string; }

function analyseDockerfile(content: string): Issue[] {
  const lines = content.split('\\n').map(l => l.trim());
  const issues: Issue[] = [];

  // 1. Detect secret patterns in ARG/ENV
  // TODO

  // 2. Detect COPY . before package manifest copies
  // TODO

  // 3. Detect single-stage builds (one FROM)
  // TODO

  // 4. Detect FROM *:latest base images
  // TODO

  // Sort by severity
  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  return issues.sort((a, b) => order[a.severity] - order[b.severity]);
}

// Test
const dockerfile = \`
FROM node:latest
WORKDIR /app
ARG NPM_TOKEN
ENV NPM_TOKEN=\\\${NPM_TOKEN}
COPY . .
COPY package*.json ./
RUN npm ci
RUN npm run build
CMD ["node", "dist/main.js"]
\`;

console.log(analyseDockerfile(dockerfile));`,
    solution: `interface Issue { severity: 'critical' | 'high' | 'medium' | 'low'; message: string; }

function analyseDockerfile(content: string): Issue[] {
  const lines = content.split('\\n').map(l => l.trim());
  const issues: Issue[] = [];

  // 1. Secret patterns in ARG/ENV
  const secretPattern = /^(ARG|ENV)\\s+.*(TOKEN|PASSWORD|SECRET|KEY|PWD)/i;
  for (const line of lines) {
    if (secretPattern.test(line)) {
      issues.push({ severity: 'critical', message: \`Secret baked into layer: "\${line}" — use BuildKit --mount=type=secret instead\` });
    }
  }

  // 2. COPY . before package manifest
  const copyAllIdx = lines.findIndex(l => /^COPY\\s+\\.\\s/.test(l));
  const copyPkgIdx = lines.findIndex(l => /^COPY\\s+.*(package.*json|\\*\\.csproj|requirements\\.txt|go\\.mod)/.test(l));
  if (copyAllIdx !== -1 && copyPkgIdx !== -1 && copyAllIdx < copyPkgIdx) {
    issues.push({ severity: 'high', message: 'COPY . appears before package manifest copy — dependency install cache will bust on every source change' });
  } else if (copyAllIdx !== -1 && copyPkgIdx === -1) {
    issues.push({ severity: 'high', message: 'No package manifest COPY found — ensure you copy package.json / *.csproj before COPY . to enable layer caching' });
  }

  // 3. Single-stage build
  const fromLines = lines.filter(l => l.startsWith('FROM '));
  if (fromLines.length === 1) {
    issues.push({ severity: 'medium', message: 'Single-stage build detected — consider multi-stage to separate build tools from the runtime image' });
  }

  // 4. FROM *:latest base
  for (const line of fromLines) {
    if (/:latest/.test(line) || (/^FROM\\s+[^\\s:]+$/.test(line) && !line.includes('AS'))) {
      issues.push({ severity: 'low', message: \`Unpinned base image: "\${line}" — pin to a specific version tag for reproducible builds\` });
    }
  }

  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  return issues.sort((a, b) => order[a.severity] - order[b.severity]);
}

const dockerfile = \`
FROM node:latest
WORKDIR /app
ARG NPM_TOKEN
ENV NPM_TOKEN=\\\${NPM_TOKEN}
COPY . .
COPY package*.json ./
RUN npm ci
RUN npm run build
CMD ["node", "dist/main.js"]
\`;

const result = analyseDockerfile(dockerfile);
result.forEach(i => console.log(\`[\${i.severity.toUpperCase()}] \${i.message}\`));
// [CRITICAL] Secret baked into layer...
// [HIGH] COPY . appears before package manifest...
// [MEDIUM] Single-stage build detected...
// [LOW] Unpinned base image...`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the primary benefit of a multi-stage Docker build?',
      options: [
        'Faster network uploads to the registry',
        'Smaller production images by excluding build tools and dev dependencies',
        'Support for multiple base operating systems simultaneously',
        'Automatic vulnerability scanning of each stage',
      ],
      answer: 1,
      explanation: 'Multi-stage builds let you compile or test in a full SDK image, then COPY only the output into a minimal runtime image (alpine, distroless). Build tools, compilers, and test fixtures never appear in the final layer.',
    },
    {
      q: 'Why should you copy package manifests before copying source code in a Dockerfile?',
      options: [
        'Docker requires manifests to be first for security reasons',
        'Package managers cannot read files if source code is present',
        'Layer caching: package installs are re-used when only source changes, not manifests',
        'It reduces the image size by de-duplicating layers',
      ],
      answer: 2,
      explanation: 'Docker caches each layer. If package.json hasn\'t changed, the RUN npm ci layer is a cache hit and executes in milliseconds. Copy manifests first → install → copy source so dependency installs survive source-only commits.',
    },
    {
      q: 'What is the safest way to pass a private registry token into a docker build?',
      options: [
        'docker build --build-arg TOKEN=secret',
        'ENV TOKEN=secret in the Dockerfile',
        'BuildKit --mount=type=secret in a RUN instruction',
        'Store the token in a layer labelled HIDDEN',
      ],
      answer: 2,
      explanation: 'ARG and ENV values are stored in image layers and visible via `docker history`. BuildKit secret mounts make the secret available only inside that RUN step via a tmpfs mount — it never appears in any layer and cannot be extracted from the image.',
    },
    {
      q: 'Which tag strategy allows you to reliably roll back a Kubernetes deployment?',
      options: [
        'Tag every image with :latest and keep the most recent',
        'Tag with the feature branch name',
        'Tag with the Git commit SHA (e.g. abc1234)',
        'Tag with the build timestamp',
      ],
      answer: 2,
      explanation: 'The commit SHA uniquely identifies the exact source that produced the image and never changes. To roll back, update the deployment to reference the previous SHA tag. :latest and branch tags are mutable — they point to a different image after the next push.',
    },
    {
      q: 'What does `--cache-from type=registry,ref=image:buildcache` accomplish in a CI pipeline?',
      options: [
        'It pulls the latest production image before building',
        'It imports previously saved layer cache from the registry so ephemeral runners can reuse cached layers',
        'It prevents the image from being pushed until all tests pass',
        'It enables BuildKit multi-platform builds',
      ],
      answer: 1,
      explanation: 'CI runners are ephemeral — local layer cache is lost between runs. Registry-backed cache exports the build cache to a special registry tag after building, and imports it at the start of the next run. This gives stateless runners the benefit of incremental builds.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between BuildKit and the classic Docker builder?',
      a: 'BuildKit is Docker\'s modern build backend (enabled by default since Docker 23). It adds: parallel stage execution (classical builder is serial), cache mounts (--mount=type=cache), secret mounts (--mount=type=secret), SSH agent forwarding, SBOM/provenance attestation, and the extended buildx CLI. Use DOCKER_BUILDKIT=1 or docker buildx build to ensure BuildKit is active on older installations.',
    },
    {
      q: 'How do you make a Docker build work on both AMD64 and ARM64?',
      a: 'Use docker buildx build with --platform linux/amd64,linux/arm64. Buildx creates a multi-architecture image manifest that references separate per-arch images under a single tag. Runners that don\'t have native ARM64 hardware use QEMU emulation — slower but functional. GitHub Actions hosted runners are AMD64; for fast ARM builds use arm64 self-hosted runners or Depot.',
    },
    {
      q: 'What is a distroless base image and when should you use it?',
      a: 'Distroless images (from Google\'s gcr.io/distroless/*) contain only the application runtime — no shell, no package manager, no utilities. They dramatically reduce the attack surface: there\'s no shell for an attacker to exec into. Use them for production stages of compiled languages (Go, Java, .NET) where you COPY just the binary. They\'re harder to debug — for debugging, switch to the :debug variant which adds busybox.',
    },
    {
      q: 'How do you handle vulnerability scanning for images that are already in the registry?',
      a: 'Scan at push time AND run scheduled re-scans (daily or weekly) against all active image tags in the registry. New CVEs are published constantly — an image that was clean at build time may be vulnerable a month later. Most enterprise registries (ACR, ECR, Artifact Registry, Harbor) have built-in continuous scanning and can notify or enforce policies. Trivy also supports scanning remote images: trivy image registry.io/org/app:tag.',
    },
    {
      q: 'What is the difference between COPY and ADD in a Dockerfile?',
      a: 'COPY is the preferred instruction — it copies files or directories from the build context into the image. ADD does everything COPY does but also auto-extracts .tar.gz archives and can download from URLs (not recommended — downloads are uncacheable and non-deterministic). The Docker team recommends always using COPY unless you specifically need ADD\'s extraction feature, in which case document why.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Build lean, signed, scanned images in CI using multi-stage Dockerfiles, registry layer caching, and keyless Cosign signing.',
    mustKnow: [
      'Multi-stage builds: separate build/test stage from lean runtime stage; only the final stage ships',
      'Layer cache order: COPY manifests → install dependencies → COPY source (most-stable first)',
      'Registry-backed cache (--cache-from/--cache-to type=registry) enables cross-runner layer reuse',
      'Tagging: always include commit SHA; never rely on :latest alone for production or rollback',
      'BuildKit secret mounts (--mount=type=secret) — the only safe way to pass tokens into builds',
      'Trivy / Docker Scout: scan before push, fail pipeline on CRITICAL/HIGH unfixed CVEs',
      'Cosign keyless signing with GitHub OIDC — no key management, enforced by Kyverno admission controller',
    ],
    interviewFocus: [
      'Explain multi-stage builds and why they reduce image size and attack surface',
      'How do you enable layer caching on ephemeral CI runners? (registry cache vs actions/cache)',
      'Why is ARG/ENV unsafe for secrets? What is the BuildKit alternative?',
      'Walk through a complete CI pipeline: build → test stage → scan → sign → push',
    ],
  };
}
