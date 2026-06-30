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
  selector: 'app-node-deployment',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './deployment.html',
  styleUrl: './deployment.scss'
})
export class NodeDeployment {
  quickRef: QuickRefItem[] = [
    { name: 'Dockerfile', type: 'keyword', desc: 'Multi-stage build: builder stage (full Node + devDeps) + production stage (slim, no devDeps).' },
    { name: '.dockerignore', type: 'keyword', desc: 'Exclude node_modules, .git, .env from Docker build context — faster builds.' },
    { name: 'PM2', type: 'keyword', desc: 'Process manager: cluster mode, auto-restart, zero-downtime reload, log aggregation.' },
    { name: 'Health check', type: 'keyword', desc: 'GET /health endpoint returning 200. Used by K8s, ECS, and load balancers for readiness.' },
    { name: 'Graceful shutdown', type: 'keyword', desc: 'Handle SIGTERM: stop accepting connections, finish in-flight requests, close DB pool.' },
    { name: 'NODE_ENV=production', type: 'keyword', desc: 'Disables dev middleware, enables optimizations. Always set in production containers.' },
    { name: 'Readiness vs Liveness', type: 'keyword', desc: 'Readiness: ready to serve traffic. Liveness: still running (restart if false).' },
    { name: 'npm ci', type: 'keyword', desc: 'Clean install from package-lock.json. Faster and more deterministic than npm install in CI.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Containerising Node.js with Docker',
      points: [
        'Multi-stage Docker builds separate build-time tools from the production image. Stage 1 (builder): install all dependencies, compile TypeScript, run build. Stage 2 (production): copy built artifacts from Stage 1, install only production dependencies. Final image is 60-80% smaller — no TypeScript compiler, no test frameworks, no devDependencies.',
        'Base image choice: node:20-alpine is ~50MB vs node:20-bullseye at ~350MB. Alpine uses musl libc — some native modules may need recompilation. node:20-slim (Debian, no extras) is a safer middle ground (~150MB). Avoid node:20 (full, large) in production.',
        'Never run Node.js as root in containers. Add USER node to the Dockerfile. Node.js ships with a non-root "node" user — use it. If your app needs to bind port 80 or write to root-owned files, fix the architecture rather than running as root.',
        '.dockerignore is essential: exclude node_modules (re-installed in the image), .git (version history — large), .env (secrets), coverage/, dist/ (may conflict with build). A missing .dockerignore sends hundreds of MB to the build context unnecessarily.',
      ]
    },
    {
      heading: 'Process Management and Zero-Downtime Deploys',
      points: [
        'PM2 is the standard Node.js process manager for VM/bare-metal deployments. pm2 start app.js -i max runs in cluster mode across all CPU cores. pm2 reload app performs a zero-downtime rolling restart — workers are replaced one at a time, incoming requests are never dropped.',
        'Graceful shutdown is required for zero-downtime deploys. On SIGTERM (sent by PM2, Docker, K8s): (1) stop accepting new connections (server.close()), (2) wait for in-flight requests to complete, (3) close database connections, (4) exit. Implement a timeout (10s) to force exit if shutdown hangs.',
        'In Kubernetes, update strategy: RollingUpdate (replace pods gradually — zero downtime) vs Recreate (stop all, start new — downtime). Set maxUnavailable: 0 for zero-downtime. K8s sends SIGTERM → waits terminationGracePeriodSeconds → sends SIGKILL. Default grace period: 30s.',
        'Health checks: /health (or /readyz) endpoint returning 200. In K8s: readinessProbe (pod is ready to receive traffic) and livenessProbe (pod should be restarted). Readiness failure removes pod from load balancer without restart. Liveness failure triggers restart.',
      ]
    },
    {
      heading: 'Environment Configuration and CI/CD',
      points: [
        'Environment variables replace config files. Production: inject via container runtime (docker run -e, K8s ConfigMap/Secret, AWS ECS task definition). Development: .env file (never commit). Use dotenv for local development, real env vars in production. Validate at startup: throw if required variables are missing.',
        'npm ci (clean install) is preferred over npm install in CI/CD. It installs exactly what is in package-lock.json (no version resolution), fails if package-lock.json is missing or mismatched, and is faster than npm install. Run npm ci in Docker builds too: RUN npm ci --only=production.',
        'Node.js version pinning: use .nvmrc or .node-version file with exact Node.js version. In Dockerfile: FROM node:20.11.1-alpine (pin minor + patch, not just major). Floating versions (FROM node:20) can break builds when a new Node.js release introduces a regression.',
        'Secrets in production: use a secrets manager (AWS Secrets Manager, HashiCorp Vault, Doppler) to inject secrets at runtime. Never bake secrets into Docker images — they appear in docker history and image layers. Kubernetes Secrets are base64-encoded but not encrypted — use sealed-secrets or external-secrets-operator for encryption.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Production Dockerfile',
      language: 'typescript',
      code: `# syntax=docker/dockerfile:1
FROM node:20.11.1-alpine AS builder

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json package-lock.json ./
RUN npm ci                          # clean install — all deps for build

# Build TypeScript
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build                   # outputs to /app/dist

# ── Production stage ────────────────────────────────────────────────────────
FROM node:20.11.1-alpine AS production

ENV NODE_ENV=production
WORKDIR /app

# Production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

# Don't run as root
USER node

EXPOSE 3000

# Health check (every 30s, 3 retries, 5s timeout)
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \\
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/main.js"]`
    },
    {
      label: 'Health check + graceful shutdown',
      language: 'typescript',
      code: `import { createServer } from 'node:http';

const app = express();

// ── Startup health state ─────────────────────────────────────────────────
let isReady = false;
let isLive  = true;

// Liveness: is the process alive and not in a broken state?
app.get('/healthz', (req, res) => {
  res.status(isLive ? 200 : 503).json({ status: isLive ? 'ok' : 'unhealthy' });
});

// Readiness: is the process ready to serve traffic?
app.get('/ready', (req, res) => {
  res.status(isReady ? 200 : 503).json({ status: isReady ? 'ready' : 'starting' });
});

const server = createServer(app);

// ── Startup ──────────────────────────────────────────────────────────────
async function start() {
  await db.connect();          // wait for DB connection
  server.listen(3000);
  isReady = true;              // only now accept traffic
  console.log('Server ready');
}

// ── Graceful shutdown ────────────────────────────────────────────────────
async function shutdown(signal) {
  console.log(\`Shutting down on \${signal}\`);
  isReady = false;             // stop routing new traffic immediately

  // Stop accepting new connections, wait for in-flight requests
  server.close(async () => {
    await db.end();            // close DB pool after requests drain
    console.log('Graceful shutdown complete');
    process.exit(0);
  });

  // Force exit if shutdown exceeds 10s
  setTimeout(() => {
    console.error('Graceful shutdown timed out — forcing exit');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

start().catch(err => {
  console.error('Startup failed:', err);
  process.exit(1);
});`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Installing devDependencies in production image',
      wrong: `FROM node:20-alpine
COPY package.json package-lock.json ./
RUN npm install    # installs ALL deps including dev — 3x larger image`,
      right: `# In production stage:
RUN npm ci --only=production  # production deps only
# OR use multi-stage build where builder installs everything, production copies only dist/`,
      explanation: 'devDependencies (TypeScript, Jest, ESLint, build tools) double or triple image size and expose unnecessary attack surface. npm ci --only=production installs only production: true dependencies. Multi-stage builds are cleaner — you never risk leaking dev tools.'
    },
    {
      title: 'Running Node.js as root in Docker',
      wrong: `FROM node:20-alpine
WORKDIR /app
# (no USER instruction — runs as root by default)
CMD ["node", "app.js"]`,
      right: `FROM node:20-alpine
WORKDIR /app
COPY --chown=node:node . .
USER node                   # switch to non-root user
CMD ["node", "app.js"]`,
      explanation: 'Running as root in a container means a container escape vulnerability gives the attacker root on the host. node:* images include a non-root "node" user. Always switch with USER node. Use --chown=node:node on COPY to set correct file ownership.'
    },
    {
      title: 'Not handling SIGTERM for graceful shutdown',
      wrong: `// No SIGTERM handler — Docker sends SIGTERM, waits 10s, then SIGKILL
// In-flight requests are abruptly terminated, DB transactions rolled back`,
      right: `process.on('SIGTERM', async () => {
  server.close(async () => {
    await db.end();
    process.exit(0);
  });
});`,
      explanation: 'Docker, Kubernetes, and PM2 send SIGTERM before stopping a process. Without a handler, Node.js continues running until Docker sends SIGKILL after the grace period. In-flight HTTP requests are dropped, DB transactions are rolled back. SIGTERM handler enables clean drain and exit.'
    },
    {
      title: 'Setting readiness to true before dependencies are ready',
      wrong: `server.listen(3000);
isReady = true; // set before DB connected — may crash on first request!
await db.connect();`,
      right: `await db.connect(); // wait for all dependencies first
server.listen(3000);
isReady = true;  // now safe to receive traffic`,
      explanation: 'If a pod is marked ready before its database connection is established, Kubernetes starts routing traffic immediately. The first requests may fail with "DB not connected" errors. Always complete all dependency setup before setting the readiness flag.'
    },
  ];

  challenge: Challenge = {
    title: 'Production-Ready Server with Graceful Shutdown',
    language: 'typescript',
    description: 'Build a production-ready Express server setup with: (1) /healthz liveness endpoint, (2) /ready readiness endpoint (false until DB connects), (3) graceful shutdown handler for SIGTERM/SIGINT that stops accepting connections, waits for in-flight requests, closes DB, then exits, (4) 10-second force-exit timeout. Simulate DB connection with a 100ms async delay.',
    hints: [
      'server.close(callback) stops accepting new connections, calls callback when all current connections close',
      'Set isReady = true only after simulated DB connect resolves',
      'setTimeout(..., 10000).unref() so the timer does not keep the process alive',
    ],
    starterCode: `import express from 'express';
import { createServer } from 'node:http';

const app = express();
let isReady = false;
let isLive  = true;

// TODO: /healthz and /ready endpoints
// TODO: simulated DB connect (100ms delay)
// TODO: server startup (set isReady after DB connects)
// TODO: graceful shutdown handler for SIGTERM and SIGINT`,
    solution: `import express from 'express';
import { createServer } from 'node:http';

const app = express();
let isReady = false;
let isLive  = true;

app.get('/healthz', (req, res) =>
  res.status(isLive ? 200 : 503).json({ ok: isLive }));
app.get('/ready', (req, res) =>
  res.status(isReady ? 200 : 503).json({ ready: isReady }));

app.get('/', (req, res) => res.json({ message: 'Hello' }));

const server = createServer(app);

const db = {
  connect: () => new Promise(resolve => setTimeout(resolve, 100)),
  end:     () => Promise.resolve(),
};

async function start() {
  await db.connect();
  server.listen(3000, () => console.log('Listening on 3000'));
  isReady = true;
}

async function shutdown(signal) {
  console.log(\`\${signal} received — shutting down\`);
  isReady = false;
  server.close(async () => {
    await db.end();
    console.log('Shutdown complete');
    process.exit(0);
  });
  setTimeout(() => { console.error('Force exit'); process.exit(1); }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

start().catch(err => { console.error(err); process.exit(1); });`
  };

  quiz: QuizQuestion[] = [
    { q: 'Why should you use multi-stage Docker builds for Node.js?', options: ['Multi-stage builds run tests automatically', 'They separate build tools from the production image — final image contains only runtime artifacts and production dependencies', 'They are required for TypeScript projects', 'They enable parallel builds'], answer: 1, explanation: 'Stage 1 installs devDependencies and compiles TypeScript. Stage 2 copies only the built output and installs production dependencies. The final image has no TypeScript compiler, test frameworks, or build tools — 60-80% smaller and less attack surface.' },
    { q: 'What is the difference between readiness and liveness probes in Kubernetes?', options: ['Liveness is for DBs, readiness is for the app', 'Readiness: pod ready for traffic (failure removes from load balancer). Liveness: pod alive (failure triggers restart)', 'They are the same thing with different names', 'Readiness runs once; liveness runs continuously'], answer: 1, explanation: 'Readiness failure: pod is removed from the Service endpoint (no new traffic) but not restarted — useful during startup, maintenance, or dependency outages. Liveness failure: pod is killed and restarted — used when the process is alive but stuck in a deadlock or unrecoverable state.' },
    { q: 'Why is npm ci preferred over npm install in Docker and CI/CD?', options: ['npm ci is faster for large projects', 'npm ci installs exactly what is in package-lock.json — deterministic, fails on mismatch, faster than install', 'npm ci supports parallel installs', 'npm ci does not require package.json'], answer: 1, explanation: 'npm install resolves versions (slow) and may update package-lock.json. npm ci reads package-lock.json exactly — same versions every time. If package-lock.json is missing or out of sync, npm ci fails (a safety signal). Also faster: no resolution step.' },
    { q: 'When should you set the readiness probe to true during startup?', options: ['Immediately when the process starts', 'After all critical dependencies (DB, cache) are connected and ready', 'After the first successful request', 'After a fixed 5-second delay'], answer: 1, explanation: 'Setting readiness before dependencies are ready causes Kubernetes to route traffic to a pod that cannot serve requests. DB queries fail, error rates spike. Only set ready=true after all startup tasks complete: DB connection, cache warmup, config loading.' },
    { q: 'What is the purpose of the SIGTERM signal in Node.js deployment?', options: ['Immediately kills the process without cleanup', 'Requests graceful shutdown — process should stop accepting new work and finish in-flight requests', 'Reloads environment variables', 'Triggers a health check'], answer: 1, explanation: 'SIGTERM is sent by orchestrators (Kubernetes, systemd, PM2) when stopping a service. Handle it to gracefully stop the HTTP server (server.close()), finish in-flight requests, close DB connections, and flush logs. Unhandled SIGTERM results in abrupt termination that may drop active requests.' },
    { q: 'What is the difference between horizontal and vertical scaling for Node.js?', options: ['Vertical uses more CPU cores; horizontal uses more RAM', 'Vertical increases resources on one server; horizontal adds more server instances', 'Horizontal is for stateful apps; vertical for stateless', 'They are identical in Node.js context'], answer: 1, explanation: 'Vertical scaling adds CPU/RAM to one server — limited and causes downtime to upgrade. Horizontal scaling adds more Node.js instances behind a load balancer — Node\'s stateless nature (sessions in Redis, no shared memory) makes it ideal for horizontal scaling. cluster module or PM2 handles multiple processes on one machine; Kubernetes/ECS handles multiple machines.' },
  ];

  qna: QnaItem[] = [
    { q: 'Should I use PM2 or Kubernetes for Node.js process management?', a: 'PM2 for: VMs or bare metal, simple deployments, single-server setups, teams without K8s expertise. PM2 handles clustering, crash recovery, zero-downtime reloads, and log management in one tool. Kubernetes for: containerised microservices, multi-server scaling, teams already using K8s, need for advanced deployment strategies (canary, blue-green). In K8s, run Node.js with cluster mode (or N pod replicas) and let K8s restart pods — you don\'t need PM2 inside a container if K8s handles restarts.' },
    { q: 'How do I manage secrets securely in Docker deployments?', a: 'Never bake secrets into Docker images (docker history reveals them). Options: (1) Environment variables injected at runtime: docker run -e DB_URL=... or K8s Secret → env: valueFrom. (2) Docker secrets (Swarm): /run/secrets/<name> file mounted in container. (3) External secrets manager: inject at startup via AWS Secrets Manager SDK, HashiCorp Vault, or Doppler. Verify no secrets in: Dockerfile, docker-compose.yml committed to git, ENV layers in the image, application logs.' },
    { q: 'How do I achieve zero-downtime deploys without Kubernetes?', a: 'PM2: pm2 reload app performs a rolling restart — workers are replaced one at a time. Nginx + upstream: add a new server instance, gradually shift traffic, remove old one. Blue-green deployment: run two identical environments (blue and green), deploy to inactive one, switch load balancer when ready. Rolling update with Node.js cluster: use built-in cluster module, replace workers one at a time with cluster.fork() + worker.kill(). The key for all approaches: implement SIGTERM handler so workers drain in-flight requests before exiting.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Production Node.js: multi-stage Docker, non-root user, health checks, graceful SIGTERM shutdown, npm ci, NODE_ENV=production. Never bake secrets into images.',
    mustKnow: [
      'Multi-stage Docker: builder (devDeps + compile) → production (dist + prod deps only).',
      'USER node in Dockerfile — never run as root in containers.',
      'SIGTERM handler: server.close() → drain DB → exit(0). 10s force-exit timeout.',
      'isReady = true only after all dependencies connected.',
      'Readiness vs Liveness: readiness removes from load balancer; liveness triggers restart.',
      'npm ci for deterministic installs in Docker/CI.',
      'Secrets in env vars or secrets manager — never in Dockerfile.',
    ],
    interviewFocus: [
      'How do you implement graceful shutdown in Node.js?',
      'What is the difference between readiness and liveness probes?',
      'How do multi-stage Docker builds reduce production image size?',
    ]
  };
}
