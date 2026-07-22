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
  { name: 'FROM ... AS <name>', type: 'syntax', desc: 'Name a build stage for COPY --from reference' },
  { name: 'COPY --from=<stage>', type: 'syntax', desc: 'Copy artifacts from a named stage into current stage' },
  { name: 'alpine', type: 'keyword', desc: 'Tiny ~5 MB musl-based Linux — fast downloads, minimal attack surface' },
  { name: 'distroless', type: 'keyword', desc: 'No shell/package manager — just the app runtime, minimal CVEs' },
  { name: '--target <stage>', type: 'syntax', desc: 'Build only up to a named stage: docker build --target build .' },
  { name: 'BuildKit', type: 'keyword', desc: 'Modern build backend — parallel stages, secret mounts, cache mounts' },
  { name: 'COPY --from=image', type: 'syntax', desc: 'Copy files from an external image (not just stages)' },
  { name: '--cache-from', type: 'syntax', desc: 'Seed layer cache from a registry image in CI: --cache-from type=registry,ref=image' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Why Multi-Stage Builds?',
    points: [
      'A single-stage build that compiles code retains the compiler, test tools, and dev dependencies in the final image.',
      'Multi-stage builds let you compile in a "builder" stage, then COPY only the compiled artifacts into a lean runtime image.',
      'Result: images can shrink from 1+ GB (node + build tools) to under 100 MB (Alpine + dist folder).',
      'Fewer packages in the final image means fewer CVEs — the compiler and source code are simply not there.',
      'Each stage is an independent image layer; Docker BuildKit can run independent stages in parallel.',
    ],
  },
  {
    heading: 'Stage Naming and COPY --from',
    points: [
      'Name stages with AS: FROM golang:1.22 AS builder — use the name in COPY --from=builder.',
      'COPY --from can reference any named stage OR a fully qualified external image.',
      'Example external: COPY --from=golang:1.22 /usr/local/go /usr/local/go — pulls just the Go runtime.',
      'docker build --target builder stops after the builder stage — useful for debugging.',
      'Unnamed stages (no AS) can only be referenced by index: COPY --from=0.',
    ],
  },
  {
    heading: 'Base Image Choices for the Runtime Stage',
    points: [
      'alpine (~5 MB): minimal attack surface, fast pull; musl libc can break native modules — test carefully.',
      'slim (e.g. node:20-slim): strips dev tools but keeps glibc — safer for most Node/Python workloads.',
      'distroless (gcr.io/distroless/nodejs20): no shell, no package manager, extremely minimal CVE surface.',
      'scratch: truly empty image — used for statically compiled Go/Rust binaries with no dependencies.',
      'Always pin the tag (node:20.11.0-alpine3.19) to prevent silent base-image upgrades breaking prod.',
    ],
  },
  {
    heading: 'BuildKit and Cache Optimisation',
    points: [
      'Enable BuildKit: DOCKER_BUILDKIT=1 docker build . or set in /etc/docker/daemon.json.',
      'BuildKit runs independent stages in parallel — a test stage and a prod stage build simultaneously.',
      'RUN --mount=type=cache,target=/root/.npm npm ci caches the npm download cache between builds.',
      'RUN --mount=type=secret,id=npm_token,target=/root/.npmrc npm ci avoids baking auth tokens in layers.',
      'In CI, use --cache-from type=registry,ref=myimage:cache to warm the build cache from the registry.',
    ],
  },
  {
    heading: 'Why Multi-Stage Builds Reduce Attack Surface, Not Just Size',
    points: [
      'Beyond the well-known size benefit, multi-stage builds exclude build-time tooling (compilers, package managers, build caches) from the final image — this directly reduces the attack surface available to an attacker who compromises a running container, since fewer installed tools means fewer potential exploitation paths.',
      'Build secrets (API tokens needed only during the build, like a private registry credential) that are only used in an early build stage never appear in the final image\'s layers when multi-stage builds are structured correctly — a security benefit distinct from simple size reduction.',
      'A minimal final-stage base image (distroless, scratch, or Alpine) combined with multi-stage builds compounds this benefit — the build stage can use a full-featured image with all necessary tooling, while the runtime stage carries only the compiled artifact and its minimal runtime dependencies.',
      'Multi-stage builds also improve build cache reuse across unrelated final images — a shared early build stage (like a common dependency-installation layer) can be cached and reused across multiple final-stage variants built from the same Dockerfile pattern.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Go multi-stage',
    language: 'bash',
    code: '# syntax=docker/dockerfile:1\n' +
      '\n' +
      '# --- Stage 1: compile ---\n' +
      'FROM golang:1.22-alpine AS builder\n' +
      'WORKDIR /src\n' +
      'COPY go.mod go.sum ./\n' +
      'RUN go mod download\n' +
      'COPY . .\n' +
      'RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/server ./cmd/server\n' +
      '\n' +
      '# --- Stage 2: test (derives FROM builder, so runs AFTER it;\n' +
      '#     but runs in parallel with the runtime stage below) ---\n' +
      'FROM builder AS test\n' +
      'RUN go test ./...\n' +
      '\n' +
      '# --- Stage 3: minimal runtime (scratch = zero base) ---\n' +
      'FROM scratch AS runtime\n' +
      'COPY --from=builder /bin/server /server\n' +
      'COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/\n' +
      'EXPOSE 8080\n' +
      'ENTRYPOINT ["/server"]',
  },
  {
    label: 'Node.js multi-stage',
    language: 'bash',
    code: '# syntax=docker/dockerfile:1\n' +
      '\n' +
      '# --- Stage 1: install all deps + build ---\n' +
      'FROM node:20-alpine AS build\n' +
      'WORKDIR /app\n' +
      'COPY package*.json ./\n' +
      'RUN npm ci\n' +
      'COPY . .\n' +
      'RUN npm run build && npm prune --production\n' +
      '\n' +
      '# --- Stage 2: distroless runtime ---\n' +
      'FROM gcr.io/distroless/nodejs20-debian12 AS runtime\n' +
      'WORKDIR /app\n' +
      'COPY --from=build /app/node_modules ./node_modules\n' +
      'COPY --from=build /app/dist ./dist\n' +
      'EXPOSE 3000\n' +
      'CMD ["dist/server.js"]',
  },
  {
    label: 'BuildKit cache mounts',
    language: 'bash',
    code: '# syntax=docker/dockerfile:1\n' +
      '# Enable BuildKit: DOCKER_BUILDKIT=1 docker build .\n' +
      '\n' +
      'FROM node:20-alpine AS build\n' +
      'WORKDIR /app\n' +
      'COPY package*.json ./\n' +
      '\n' +
      '# Cache npm download cache between builds (never in final layer)\n' +
      'RUN --mount=type=cache,target=/root/.npm \\\n' +
      '    npm ci\n' +
      '\n' +
      'COPY . .\n' +
      'RUN npm run build\n' +
      '\n' +
      '# --- CI pipeline with registry cache ---\n' +
      '# docker build \\\n' +
      '#   --cache-from type=registry,ref=ghcr.io/org/app:cache \\\n' +
      '#   --cache-to   type=registry,ref=ghcr.io/org/app:cache,mode=max \\\n' +
      '#   -t ghcr.io/org/app:latest .\n' +
      '\n' +
      '# --- Target a specific stage (e.g. debug builder) ---\n' +
      '# docker build --target build -t myapp:debug .',
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Copying entire source into the runtime stage',
    wrong: 'FROM node:20-alpine AS runtime\nCOPY --from=build /app .\nCMD ["node", "src/server.ts"]',
    right: 'COPY --from=build /app/dist ./dist\nCOPY --from=build /app/node_modules ./node_modules',
    explanation: 'COPY --from=build /app copies everything including source, node_modules, test files and devDependencies. Only copy the compiled output and production node_modules into the runtime stage.',
  },
  {
    title: 'Using :latest in FROM for reproducibility',
    wrong: 'FROM golang:latest AS builder\nFROM alpine:latest AS runtime',
    right: 'FROM golang:1.22-alpine3.19 AS builder\nFROM alpine:3.19 AS runtime',
    explanation: ':latest changes whenever a new version is released. Two builds a week apart can produce different binaries. Pin exact versions so builds are reproducible and security scans are deterministic.',
  },
  {
    title: 'Not running tests in a stage',
    wrong: '# No test stage — tests only run in CI separately\nFROM golang:1.22 AS builder\nRUN go build ./...',
    right: 'FROM golang:1.22 AS builder\nRUN go build ./...\nFROM builder AS test\nRUN go test ./...\nFROM scratch AS runtime\nCOPY --from=builder /bin/app /app',
    explanation: 'Embedding tests as a build stage ensures the image cannot be built without passing tests. Since the test stage derives FROM builder, it runs after builder finishes — but it runs in parallel with the runtime stage (which also derives FROM builder independently), so the total build time is barely extended.',
  },
  {
    title: 'Using scratch without CA certificates',
    wrong: 'FROM scratch\nCOPY --from=builder /bin/server /server\nENTRYPOINT ["/server"]',
    right: 'FROM scratch\nCOPY --from=builder /bin/server /server\nCOPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/\nENTRYPOINT ["/server"]',
    explanation: 'scratch has no CA certificates. Any HTTPS call your binary makes will fail with "certificate signed by unknown authority". Copy the certs from the builder stage.',
  },
  {
    title: 'Forgetting to prune devDependencies before copying node_modules',
    wrong: 'COPY --from=build /app/node_modules ./node_modules  # includes devDeps',
    right: 'RUN npm prune --production  # in build stage\n# then:\nCOPY --from=build /app/node_modules ./node_modules',
    explanation: 'Node devDependencies (TypeScript compiler, jest, eslint) can be larger than production deps. Run npm prune --production in the build stage before copying node_modules to the runtime stage.',
  },
];

const challenge: Challenge = {
  title: 'Image Size Estimator',
  language: 'typescript',
  description: 'Write a function that analyses a Dockerfile string (multi-stage) and returns an estimate of which files end up in the final stage. Count COPY --from instructions in the last FROM block and list what would be included. Return { stage: string; copies: string[] } for the final stage.',
  hints: [
    'Split on FROM lines to identify stages; the last FROM is the runtime stage',
    'Track the AS name for each stage',
    'Collect COPY --from= lines within the final stage block',
    'Extract the source path from each COPY --from line',
    'Return the stage name and the list of copied paths',
  ],
  starterCode: 'interface StageAnalysis { stage: string; copies: string[]; }\n\nfunction analyseMultiStage(dockerfile: string): StageAnalysis {\n  const lines = dockerfile.split(\'\\n\').map(l => l.trim());\n  // TODO: find the final FROM block and collect COPY --from lines\n  return { stage: \'\', copies: [] };\n}',
  solution: 'interface StageAnalysis { stage: string; copies: string[]; }\n\nfunction analyseMultiStage(dockerfile: string): StageAnalysis {\n  const lines = dockerfile.split(\'\\n\').map(l => l.trim());\n  let currentStage = \'\';\n  let finalStage = \'\';\n  const stageCopies: Record<string, string[]> = {};\n\n  for (const line of lines) {\n    const fromMatch = line.match(/^FROM\\s+\\S+(?:\\s+AS\\s+(\\S+))?/i);\n    if (fromMatch) {\n      currentStage = fromMatch[1] ?? \'final\';\n      finalStage = currentStage;\n      stageCopies[currentStage] = [];\n      continue;\n    }\n\n    const copyMatch = line.match(/^COPY\\s+--from=\\S+\\s+(\\S+)/i);\n    if (copyMatch && currentStage) {\n      stageCopies[currentStage].push(copyMatch[1]);\n    }\n  }\n\n  return { stage: finalStage, copies: stageCopies[finalStage] ?? [] };\n}',
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the main benefit of multi-stage Docker builds?',
    options: [
      'They allow running multiple containers in parallel',
      'They produce smaller, more secure runtime images by leaving build tools out of the final stage',
      'They automatically push images to the registry',
      'They enable running different OS versions in the same container',
    ],
    answer: 1,
    explanation: 'Multi-stage builds separate build-time tooling (compiler, test runner, devDependencies) from the runtime image. Only compiled artifacts are copied to the final stage, resulting in a smaller image with fewer attack vectors.',
  },
  {
    q: 'How do you copy files from a named stage called "builder" into the current stage?',
    options: [
      'IMPORT --from=builder /bin/server /server',
      'COPY --stage=builder /bin/server /server',
      'COPY --from=builder /bin/server /server',
      'RUN cp --from=builder /bin/server /server',
    ],
    answer: 2,
    explanation: 'COPY --from=builder is the correct syntax. --from accepts a stage name (from AS builder), a stage index (0, 1, ...), or an external image reference.',
  },
  {
    q: 'Which base image has NO shell and NO package manager, minimising the CVE attack surface?',
    options: [
      'alpine',
      'ubuntu:slim',
      'distroless',
      'debian:minimal',
    ],
    answer: 2,
    explanation: 'Google\'s distroless images contain only the application runtime (libc, etc.) with no shell, no package manager, and no utilities. This drastically reduces the attack surface and the number of CVEs reported by scanners.',
  },
  {
    q: 'What does docker build --target build do?',
    options: [
      'It builds all stages and tags the result as "build"',
      'It stops building after the stage named "build" and outputs that image',
      'It rebuilds the image from scratch ignoring cache',
      'It targets the build host architecture',
    ],
    answer: 1,
    explanation: '--target <stage-name> tells Docker to stop after building the specified stage. This is useful for debugging build stages or running tests in CI without producing the full runtime image.',
  },
  {
    q: 'Why must you copy CA certificates when using FROM scratch for a Go binary?',
    options: [
      'scratch does not support environment variables',
      'The Go runtime requires certificates to start',
      'scratch has no filesystem at all — HTTPS calls fail without CA cert files',
      'Docker requires at least one COPY instruction',
    ],
    answer: 2,
    explanation: 'FROM scratch starts with a completely empty filesystem — no /etc/ssl/certs, no libc, nothing. If your binary makes any HTTPS connections, TLS verification fails because there are no root CA certificates. Copy them explicitly from the builder stage.',
  },
  { q: 'Can you build and run test suites inside an intermediate multi-stage build stage without that test tooling ending up in the final image?', options: ['No — anything used in any stage always ends up in the final image', 'Yes — add a dedicated test stage that copies the built artifact, runs the test suite there, and simply never COPY --from that stage into the final image', 'Only if the tests are written in the same language as the runtime', 'Testing must always happen in a separate CI step, never inside the Dockerfile'], answer: 1, explanation: 'A common pattern adds a FROM builder AS test stage that installs test dependencies and runs the suite (RUN npm test) — if the tests fail, the whole docker build fails, catching regressions at build time. Since the final production stage only does COPY --from=builder (never COPY --from=test), none of the test framework, test files, or test-only dependencies exist in the shipped image, keeping test tooling completely isolated from the runtime artifact.' },
];

const qna: QnaItem[] = [
  {
    q: 'Can COPY --from reference an external Docker image, not just a stage?',
    a: 'Yes. COPY --from=golang:1.22 /usr/local/go /usr/local/go pulls the golang image and copies /usr/local/go into the current stage. This is useful for copying tools (like the Go binary) without defining a dedicated FROM stage for them.',
  },
  {
    q: 'How does BuildKit improve multi-stage build performance?',
    a: 'BuildKit analyses the stage dependency graph and runs independent stages in parallel. For example, a test stage and a prod-runtime stage that both derive from the builder stage can run at the same time. It also supports cache mounts (--mount=type=cache) so package downloads are reused across builds without being baked into layers.',
  },
  {
    q: 'What is the difference between alpine and distroless?',
    a: 'Alpine is a minimal Linux distribution with musl libc, BusyBox shell, and the apk package manager — you can exec into it and install tools. Distroless contains only the language runtime (libc, tz data, SSL certs) with no shell or package manager. Distroless is harder to debug but has a significantly smaller CVE surface since there are no extra OS utilities.',
  },
  {
    q: 'How do I pass a private npm token during build without baking it into the image?',
    a: 'Use BuildKit secret mounts: RUN --mount=type=secret,id=npm_token,target=/root/.npmrc npm ci. Pass the secret at build time: docker build --secret id=npm_token,src=.npmrc . The file is available only during that RUN step and never appears in docker history or the image layers.',
  },
  {
    q: 'Should I always use FROM scratch for Go binaries?',
    a: 'Only if your binary is fully statically compiled (CGO_ENABLED=0). If you use cgo or need standard system libraries, use distroless/static or alpine instead. scratch also lacks timezone data and CA certificates, so add those explicitly with COPY --from if your binary needs them.',
  },
  { q: 'How do you optimize Docker layer caching in multi-stage builds?', a: 'Order instructions from least-changing to most-changing: first install system dependencies because they change rarely, then copy dependency manifests such as package.json or csproj files and install dependencies so this step is cached until manifests change, then copy application source code last because it changes every build. Each COPY . . instruction invalidates the cache for all subsequent layers. Separate COPY package.json . from COPY . . so npm install stays cached between code changes. Use --mount=type=cache with BuildKit to persist package manager caches across builds without adding cache files to the image.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Multi-stage builds: compile in a fat builder stage, COPY only artifacts into a lean runtime stage — smaller image, fewer CVEs.',
  mustKnow: [
    'FROM image AS name to define stages; COPY --from=name to pull artifacts across',
    'Build tools, source code, and devDeps never enter the runtime stage',
    'alpine (musl, has shell) vs distroless (no shell, runtime only) vs scratch (empty — Go static binaries)',
    'BuildKit parallel stages, cache mounts (--mount=type=cache), secret mounts (--mount=type=secret)',
    'docker build --target stagename to build only up to that stage',
    'Pin exact base image versions for reproducibility',
  ],
  interviewFocus: [
    'How does a multi-stage build reduce image size and CVE count?',
    'When would you use distroless vs alpine vs scratch?',
    'How would you avoid baking a private registry token into an image layer?',
    'How does BuildKit run stages in parallel, and what determines the dependency order?',
  ],
};

@Component({
  selector: 'app-k8s-multi-stage',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent,
    PageCompleteComponent,
  ],
  templateUrl: './multi-stage.html',
  styleUrl: './multi-stage.scss',
})
export class K8sMultiStage {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
