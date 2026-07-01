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
  { name: 'FROM', type: 'keyword', desc: 'Set base image — FROM node:20-alpine' },
  { name: 'RUN', type: 'keyword', desc: 'Execute shell command and commit a new layer' },
  { name: 'COPY', type: 'keyword', desc: 'Copy files from build context into image' },
  { name: 'WORKDIR', type: 'keyword', desc: 'Set working directory for subsequent instructions' },
  { name: 'ENV', type: 'keyword', desc: 'Set environment variable — ENV NODE_ENV=production' },
  { name: 'EXPOSE', type: 'keyword', desc: 'Document container listens on port (informational)' },
  { name: 'CMD', type: 'keyword', desc: 'Default command — overridable at docker run' },
  { name: 'ENTRYPOINT', type: 'keyword', desc: 'Fixed entrypoint — CMD becomes its args' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Dockerfile Instructions & Layer Caching',
    points: [
      'Each RUN/COPY/ADD instruction creates a new layer; Docker caches layers that haven\'t changed.',
      'Order instructions from least-changed to most-changed: system packages first, app source last.',
      'Combine related RUN commands with && to reduce layer count and image size.',
      'COPY package*.json ./ && RUN npm ci before COPY . . caches node_modules across code changes.',
      'Use .dockerignore to exclude node_modules, .git, and test files from the build context.',
    ],
  },
  {
    heading: 'CMD vs ENTRYPOINT',
    points: [
      'CMD provides default arguments — docker run myimage bash overrides CMD completely.',
      'ENTRYPOINT is the fixed executable — docker run myimage arg appends arg to ENTRYPOINT.',
      'Shell form (CMD echo hi) runs via /bin/sh -c, which doesn\'t receive OS signals correctly.',
      'Exec form (CMD ["node", "server.js"]) runs directly — PID 1 receives SIGTERM cleanly.',
      'Combine ENTRYPOINT ["node"] CMD ["server.js"]: entrypoint fixed, script overridable.',
    ],
  },
  {
    heading: 'Base Image Selection',
    points: [
      'alpine variants are tiny (~5 MB) but use musl libc — some native modules may not compile.',
      'slim variants (node:20-slim) strip dev tools but keep glibc — safer for most Node/Python apps.',
      'distroless images (gcr.io/distroless/nodejs20) have no shell — minimal attack surface.',
      'Always pin exact versions (node:20.11.0-alpine3.19) — node:latest changes break reproducibility.',
      'Use official images from Docker Hub verified publishers or Docker Official Images.',
    ],
  },
  {
    heading: 'Security Hardening in Dockerfiles',
    points: [
      'Create a non-root user: RUN addgroup -S app && adduser -S app -G app; USER app.',
      'Avoid running apt-get update in a separate RUN — stale cache can install old packages.',
      'Never store secrets in ENV or ARG — they appear in docker history and image metadata.',
      'Use --no-cache with apk/apt and clean package manager caches in the same RUN layer.',
      'Set HEALTHCHECK to let Docker (and Compose/K8s) know when the container is ready.',
    ],
  },
  {
    heading: 'Layer Caching and Dockerfile Instruction Order',
    points: [
      'Docker caches each instruction\'s resulting layer — if an instruction and its inputs are unchanged from a previous build, Docker reuses the cached layer instead of re-executing it, meaningfully speeding up rebuilds.',
      'Ordering instructions from least-to-most frequently changing (copying dependency manifests and installing dependencies BEFORE copying application source code) maximizes cache hits, since source code changes far more often than dependency lists.',
      'A single change anywhere in a layer invalidates the cache for that layer AND every layer after it — this is why placing a frequently-changing COPY . . early in the Dockerfile defeats caching for all subsequent instructions, even unrelated ones.',
      'CI build caching (via --cache-from or BuildKit\'s remote cache export) extends this same layer-caching benefit across separate CI runs on ephemeral build machines, which otherwise would have no local cache to reuse between builds.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Node.js Dockerfile',
    language: 'bash',
    code: '# syntax=docker/dockerfile:1\n' +
      'FROM node:20-alpine AS base\n' +
      'WORKDIR /app\n' +
      '\n' +
      '# --- deps stage: install prod deps ---\n' +
      'FROM base AS deps\n' +
      'COPY package*.json ./\n' +
      'RUN npm ci --only=production\n' +
      '\n' +
      '# --- build stage: compile TypeScript ---\n' +
      'FROM base AS build\n' +
      'COPY package*.json ./\n' +
      'RUN npm ci\n' +
      'COPY . .\n' +
      'RUN npm run build\n' +
      '\n' +
      '# --- runtime stage ---\n' +
      'FROM node:20-alpine AS runtime\n' +
      'RUN addgroup -S app && adduser -S app -G app\n' +
      'WORKDIR /app\n' +
      'COPY --from=deps /app/node_modules ./node_modules\n' +
      'COPY --from=build /app/dist ./dist\n' +
      'USER app\n' +
      'EXPOSE 3000\n' +
      'HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:3000/health || exit 1\n' +
      'CMD ["node", "dist/server.js"]',
  },
  {
    label: 'Python Dockerfile',
    language: 'bash',
    code: '# syntax=docker/dockerfile:1\n' +
      'FROM python:3.12-slim AS base\n' +
      'ENV PYTHONDONTWRITEBYTECODE=1 \\\n' +
      '    PYTHONUNBUFFERED=1\n' +
      'WORKDIR /app\n' +
      '\n' +
      '# Install system deps in one layer, clean cache\n' +
      'RUN apt-get update && apt-get install -y --no-install-recommends \\\n' +
      '    libpq5 \\\n' +
      '  && rm -rf /var/lib/apt/lists/*\n' +
      '\n' +
      'COPY requirements.txt .\n' +
      'RUN pip install --no-cache-dir -r requirements.txt\n' +
      '\n' +
      'COPY . .\n' +
      '\n' +
      '# Non-root user\n' +
      'RUN adduser --system --no-create-home appuser\n' +
      'USER appuser\n' +
      '\n' +
      'EXPOSE 8000\n' +
      'CMD ["gunicorn", "app:create_app()", "-b", "0.0.0.0:8000"]',
  },
  {
    label: '.dockerignore',
    language: 'bash',
    code: '# .dockerignore — keep build context lean\n' +
      'node_modules\n' +
      'dist\n' +
      '.git\n' +
      '.gitignore\n' +
      '*.md\n' +
      'tests/\n' +
      '__pycache__/\n' +
      '*.pyc\n' +
      '.env\n' +
      '.env.*\n' +
      'docker-compose*.yml\n' +
      'Dockerfile*\n' +
      '\n' +
      '# Validate context size before build:\n' +
      '# docker build --no-cache . 2>&1 | head -5\n' +
      '# (first line shows "Sending build context to Docker daemon  X kB")',
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Putting COPY . . before package install',
    wrong: 'COPY . .\nRUN npm ci',
    right: 'COPY package*.json ./\nRUN npm ci\nCOPY . .',
    explanation: 'Any source change invalidates the COPY . . layer, forcing npm ci to re-run on every build. Install deps first so that layer is cached as long as package.json is unchanged.',
  },
  {
    title: 'Running as root in production',
    wrong: 'FROM node:20-alpine\nCOPY . .\nCMD ["node", "server.js"]',
    right: 'RUN addgroup -S app && adduser -S app -G app\nUSER app\nCMD ["node", "server.js"]',
    explanation: 'Containers run as root by default. If an attacker escapes the process, they own the host filesystem. Always create and switch to a non-root user before the CMD.',
  },
  {
    title: 'Using shell form for CMD',
    wrong: 'CMD node server.js',
    right: 'CMD ["node", "server.js"]',
    explanation: 'Shell form wraps the command in /bin/sh -c, making /bin/sh PID 1. Docker signals (SIGTERM on docker stop) never reach node, causing a 10-second timeout kill. Exec form makes node PID 1 and receives signals directly.',
  },
  {
    title: 'apt-get update in a separate RUN',
    wrong: 'RUN apt-get update\nRUN apt-get install -y curl',
    right: 'RUN apt-get update && apt-get install -y --no-install-recommends curl \\\n  && rm -rf /var/lib/apt/lists/*',
    explanation: 'Cached RUN apt-get update layers go stale. If the install layer is rebuilt days later, apt still uses the stale index and may pull old packages. Always update and install in one RUN, then clean the cache.',
  },
  {
    title: 'Storing secrets in ENV or ARG',
    wrong: 'ARG DB_PASSWORD\nENV DB_PASSWORD=${DB_PASSWORD}',
    right: '# Pass secrets at runtime:\n# docker run -e DB_PASSWORD="..." myimage\n# Or use Docker secrets / K8s Secrets',
    explanation: 'ARG values are visible in docker history and stored in the image manifest. ENV variables are baked into every layer. Anyone with image pull access can read them. Pass secrets at runtime via environment variables or secret mounts.',
  },
];

const challenge: Challenge = {
  title: 'Dockerfile Linter',
  language: 'typescript',
  description: 'Write a function that takes a Dockerfile string and returns an array of lint warnings. Check for: running as root (no USER instruction), shell-form CMD, apt-get update in a separate RUN from the install, and missing .dockerignore reminder (COPY . . without a preceding comment mentioning dockerignore).',
  hints: [
    'Split the Dockerfile into lines and track which instructions appear',
    'Check if any USER instruction exists before CMD/ENTRYPOINT',
    'Shell-form CMD looks like: CMD echo or CMD node — no leading [',
    'Look for a standalone RUN apt-get update line (not combined with &&)',
    'Return each warning with a line number and message',
  ],
  starterCode: 'function lintDockerfile(content: string): Array<{ line: number; warning: string }> {\n  const warnings: Array<{ line: number; warning: string }> = [];\n  const lines = content.split(\'\\n\');\n  // TODO: check for common Dockerfile mistakes\n  return warnings;\n}',
  solution: 'function lintDockerfile(content: string): Array<{ line: number; warning: string }> {\n  const warnings: Array<{ line: number; warning: string }> = [];\n  const lines = content.split(\'\\n\');\n  let hasUser = false;\n  let hasAptUpdate = false;\n  let aptUpdateLine = -1;\n\n  for (let i = 0; i < lines.length; i++) {\n    const ln = lines[i].trim();\n    const num = i + 1;\n\n    if (/^USER\\s+/i.test(ln)) hasUser = true;\n\n    // Shell-form CMD: CMD <text> with no leading [\n    if (/^CMD\\s+[^\\[]/i.test(ln)) {\n      warnings.push({ line: num, warning: \'CMD uses shell form — prefer exec form CMD ["executable", "arg"] for correct signal handling\' });\n    }\n\n    // Standalone apt-get update\n    if (/^RUN\\s+apt-get\\s+update\\s*$/i.test(ln)) {\n      hasAptUpdate = true;\n      aptUpdateLine = num;\n    }\n\n    // apt-get install in a separate RUN after a standalone update\n    if (hasAptUpdate && /^RUN\\s+apt-get\\s+install/i.test(ln)) {\n      warnings.push({ line: aptUpdateLine, warning: \'apt-get update is in a separate RUN from install — combine them to avoid stale cache\' });\n      hasAptUpdate = false;\n    }\n  }\n\n  if (!hasUser) {\n    warnings.push({ line: lines.length, warning: \'No USER instruction found — container will run as root\' });\n  }\n\n  return warnings;\n}',
};

const quiz: QuizQuestion[] = [
  {
    q: 'Why should COPY package*.json ./ come before COPY . . in a Node.js Dockerfile?',
    options: [
      'It installs packages before the app starts',
      'It caches the npm install layer so it only re-runs when package.json changes',
      'It reduces the final image size',
      'It is required by Docker syntax',
    ],
    answer: 1,
    explanation: 'Docker layer caching skips unchanged layers. By copying only package.json first and running npm ci, the expensive install step is cached until package.json changes — even if source code changes frequently.',
  },
  {
    q: 'What is the difference between CMD and ENTRYPOINT?',
    options: [
      'CMD runs before ENTRYPOINT during build',
      'ENTRYPOINT sets the fixed executable; CMD provides default arguments that can be overridden',
      'CMD runs as root; ENTRYPOINT runs as the USER',
      'They are identical — ENTRYPOINT is just the older syntax',
    ],
    answer: 1,
    explanation: 'ENTRYPOINT sets the command that always runs. CMD provides default arguments to ENTRYPOINT (or the default command if no ENTRYPOINT). docker run myimage arg replaces CMD but keeps ENTRYPOINT.',
  },
  {
    q: 'What happens when you use shell-form CMD (CMD node server.js)?',
    options: [
      'The process runs faster because no shell overhead',
      '/bin/sh becomes PID 1 and signals like SIGTERM never reach node',
      'Docker automatically converts it to exec form',
      'The container always exits with code 0',
    ],
    answer: 1,
    explanation: 'Shell form runs via /bin/sh -c, making the shell PID 1. Docker sends SIGTERM to PID 1 on docker stop, but the shell doesn\'t forward it to node, causing a 10-second grace period then SIGKILL. Exec form makes node PID 1 directly.',
  },
  {
    q: 'Which base image is safest for a production Node.js API?',
    options: [
      'node:latest',
      'ubuntu:latest',
      'node:20.11.0-alpine3.19',
      'node:lts',
    ],
    answer: 2,
    explanation: 'Pin exact versions (node:20.11.0-alpine3.19) for reproducible builds. :latest and :lts change over time and can introduce breaking changes. Alpine provides a small attack surface. Ubuntu adds unnecessary packages for production.',
  },
  {
    q: 'Why should secrets never be stored in ARG or ENV instructions?',
    options: [
      'They slow down the build process',
      'Docker does not support string values in ARG/ENV',
      'They appear in docker history and are baked into the image layer metadata',
      'They are automatically expired after container restart',
    ],
    answer: 2,
    explanation: 'ARG values appear in docker history even after they go out of scope. ENV variables are stored in each committed layer. Anyone who can pull or inspect the image can read them. Pass secrets at runtime via environment injection or Docker/K8s secret mounts.',
  },
  { q: 'What is the purpose of HEALTHCHECK in a Dockerfile?', options: ['It restricts the container CPU usage during health monitoring intervals', 'It defines a command Docker runs periodically to determine if the container is healthy', 'It runs automated tests during the image build process', 'It validates the syntax of RUN commands before execution'], answer: 1, explanation: 'HEALTHCHECK CMD curl -f http://localhost/health || exit 1 runs the command periodically: default 30s interval, 30s timeout, 3 retries. Status becomes healthy, unhealthy, or starting. Docker Compose uses this for depends_on with condition: service_healthy. Kubernetes does NOT use Docker healthchecks; define livenessProbe and readinessProbe in the pod spec separately.' },
];

const qna: QnaItem[] = [
  {
    q: 'What is a .dockerignore file and why does it matter?',
    a: '.dockerignore works like .gitignore for the Docker build context. It prevents files like node_modules, .git, and .env from being sent to the Docker daemon when you run docker build. A large build context slows every build and risks accidentally copying secrets into the image.',
  },
  {
    q: 'When should I use ADD instead of COPY?',
    a: 'Almost never — prefer COPY. ADD has two extra features: it auto-extracts tar archives and can fetch URLs. These implicit behaviours make Dockerfiles harder to understand and can introduce unexpected files. Use COPY for files/directories and curl + RUN for URL fetches.',
  },
  {
    q: 'What does EXPOSE do?',
    a: 'EXPOSE is purely documentation — it tells readers (and tools like docker inspect and Compose) which port the container listens on. It does NOT actually publish the port. You still need -p 8080:3000 in docker run or ports: in compose.yml to map the port to the host.',
  },
  {
    q: 'How do I pass build-time configuration without baking secrets into the image?',
    a: 'Use ARG for non-sensitive build-time values (build version, environment name). Pass sensitive values at runtime with docker run -e SECRET=value or via Docker Secrets. For build-time secrets (e.g. a private npm registry token), use RUN --mount=type=secret which provides the value during the RUN but never bakes it into the layer.',
  },
  {
    q: 'What is a HEALTHCHECK and how does Kubernetes use it?',
    a: 'HEALTHCHECK runs a command periodically inside the container to determine if it\'s healthy. docker ps shows healthy/unhealthy status. Kubernetes does NOT use HEALTHCHECK — it uses readinessProbe and livenessProbe in the Pod spec instead. However, HEALTHCHECK is useful for Docker Compose and standalone Docker deployments.',
  },
  { q: 'What is the difference between COPY and ADD in a Dockerfile?', a: 'COPY copies files or directories from the build context to the image. It is simple and predictable and the preferred choice for almost all use cases. ADD does everything COPY does plus it extracts tar archives automatically and can fetch files from URLs. Both of these extra behaviors are anti-patterns: URL fetching caches poorly and adds security risk, and tar auto-extraction makes the Dockerfile less explicit. Rule: always use COPY unless you specifically need tar auto-extraction. For remote files, use a RUN layer with curl so you control caching and cleanup explicitly.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Dockerfiles define image layers — order instructions for cache efficiency, use exec-form CMD, non-root USER, and never bake in secrets.',
  mustKnow: [
    'Layer caching: least-changed instructions first; copy package files before source',
    'Exec form CMD/ENTRYPOINT for correct signal handling (PID 1 receives SIGTERM)',
    'Non-root user with adduser/addgroup before CMD',
    'Combine apt-get update && install in one RUN; clean /var/lib/apt/lists/*',
    'ARG/ENV never for secrets — pass at runtime or use secret mounts',
    '.dockerignore keeps build context lean and secure',
  ],
  interviewFocus: [
    'Why does CMD ["node", "server.js"] behave differently from CMD node server.js?',
    'How would you optimise a Dockerfile to speed up CI builds?',
    'What\'s the risk of storing a DB password in an ENV instruction?',
    'When would you choose alpine vs slim vs distroless?',
  ],
};

@Component({
  selector: 'app-k8s-dockerfile',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent,
    PageCompleteComponent,
  ],
  templateUrl: './dockerfile.html',
  styleUrl: './dockerfile.scss',
})
export class K8sDockerfile {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
