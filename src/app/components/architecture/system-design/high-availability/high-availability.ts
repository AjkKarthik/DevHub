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
  { name: 'Availability',     type: 'keyword', desc: 'Uptime / (Uptime + Downtime). 99.9% = 8.7h/yr downtime; 99.99% = 52 min/yr.' },
  { name: 'Active-passive',   type: 'keyword', desc: 'One active node handles traffic; standby is ready to take over on failure.' },
  { name: 'Active-active',    type: 'keyword', desc: 'Multiple nodes all handle traffic. Load is distributed; failed node needs no warmup — but detection still takes a health-check interval.' },
  { name: 'SPOF',             type: 'keyword', desc: 'Single Point of Failure — one component whose failure brings down the system.' },
  { name: 'Health check',     type: 'keyword', desc: 'Load balancer probes /health endpoint; removes unhealthy nodes from rotation.' },
  { name: 'Graceful shutdown',type: 'keyword', desc: 'Service drains in-flight requests before stopping; no dropped connections.' },
  { name: 'Blue-green deploy',type: 'keyword', desc: 'Two identical environments; traffic switches from blue to green. Instant rollback.' },
  { name: 'Canary release',   type: 'keyword', desc: 'Route small % of traffic to new version; roll forward or back based on metrics.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'The nines of availability',
    points: [
      '99% (two nines): 87.6 hours/year downtime — acceptable only for internal tools.',
      '99.9% (three nines): 8.76 hours/year — typical SLA for SaaS products.',
      '99.99% (four nines): 52.6 min/year — enterprise grade; requires redundancy at every tier.',
      '99.999% (five nines): 5.26 min/year — telecom grade; requires active-active multi-region.',
      'Availability of a serial chain = product of individual availabilities: 99.9% × 99.9% = 99.8%.',
    ],
  },
  {
    heading: 'Active-passive failover',
    points: [
      'Primary node handles all traffic; standby syncs data but serves no requests.',
      'On failure: health check detects primary down → load balancer or DNS points to standby.',
      'Failover time: 30s–2min depending on detection + switchover (hot standby) or cold start.',
      'Used by: PostgreSQL primary/replica, Redis Sentinel, most managed DB offerings.',
    ],
  },
  {
    heading: 'Active-active',
    points: [
      'All nodes serve traffic simultaneously. Load balancer distributes requests across all.',
      'No warmup delay for the surviving nodes — they already handle traffic. Detecting the failed node still takes a health-check interval (typically 10-90s, depending on interval × unhealthy-threshold config), so the failover is fast, not literally instant.',
      'Requirement: stateless application layer OR shared session store (Redis).',
      'Database active-active is harder: multi-leader replication with conflict resolution needed.',
    ],
  },
  {
    heading: 'Eliminating single points of failure',
    points: [
      'Map your system: for each component, ask "what happens if this fails alone?"',
      'Load balancer: use two LBs with DNS failover or anycast VIP.',
      'Database: primary + at least one synchronous replica for automatic failover.',
      'Application layer: deploy at least 2 instances across availability zones.',
      'Message queue: Kafka multi-broker, SQS (AWS-managed HA), RabbitMQ mirrored queues.',
    ],
  },
  {
    heading: 'Measuring and Communicating Availability',
    points: [
      'Availability is typically expressed as a percentage of uptime over a period — "three nines" (99.9%) allows roughly 8.7 hours of downtime per year, "five nines" (99.999%) allows only about 5 minutes, and each additional nine roughly multiplies the required engineering investment.',
      'Availability targets should be set per-component based on actual business impact, not uniformly applied — a payment processing path may need 99.99%, while an internal analytics dashboard may be perfectly acceptable at 99.5%, and treating all components identically wastes engineering effort on low-impact systems.',
      'Redundancy alone does not guarantee availability if failover is not automatic and fast — a system with a hot standby that requires manual intervention to activate has effectively the same availability as a system with no standby, since human response time dominates the actual downtime.',
      'Error budgets (derived from an availability SLO — a 99.9% target implies an 0.1% error budget) give teams a data-driven way to balance reliability work against feature velocity, since spending the full error budget on planned changes is an acceptable, quantified risk rather than an emergency.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Health Check Endpoint',
    language: 'typescript',
    code: `// Express health check — used by load balancer + orchestrator (Kubernetes)

app.get('/health', async (req, res) => {
  const checks = await Promise.allSettled([
    db.ping(),         // database reachable?
    redis.ping(),      // cache reachable?
    kafka.isHealthy(), // message queue reachable?
  ]);

  const [db_, cache_, queue_] = checks.map(c => c.status === 'fulfilled');
  const allHealthy = db_ && cache_ && queue_;

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    checks: { database: db_, cache: cache_, queue: queue_ },
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION,
  });
});

// Liveness probe: "is the process alive?" — simple ping
app.get('/health/live', (_req, res) => res.json({ status: 'alive' }));

// Readiness probe: "can I serve traffic?" — checks dependencies
app.get('/health/ready', async (_req, res) => {
  const ready = await db.ping().then(() => true).catch(() => false);
  res.status(ready ? 200 : 503).json({ ready });
});`,
  },
  {
    label: 'Graceful Shutdown',
    language: 'typescript',
    code: `// Graceful shutdown — drain in-flight requests before stopping

const server = app.listen(3000);
let isShuttingDown = false;

async function gracefulShutdown(signal: string): Promise<void> {
  console.log(\`\${signal} received — starting graceful shutdown\`);
  isShuttingDown = true;

  // Stop accepting new connections
  server.close(async () => {
    try {
      // Close DB connection pool
      await db.end();
      // Close Kafka producer (flush pending messages)
      await kafka.producer.disconnect();
      // Close Redis connection
      await redis.quit();
      console.log('Graceful shutdown complete');
      process.exit(0);
    } catch (err) {
      console.error('Error during shutdown', err);
      process.exit(1);
    }
  });

  // Force exit after 30s (Kubernetes terminationGracePeriodSeconds)
  setTimeout(() => {
    console.error('Forced shutdown — timeout exceeded');
    process.exit(1);
  }, 30_000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

// Reject new requests during shutdown
app.use((req, res, next) => {
  if (isShuttingDown) return res.status(503).json({ error: 'Service shutting down' });
  next();
});`,
  },
  {
    label: 'Blue-Green Deployment',
    language: 'bash',
    code: `# Blue-green deployment — zero-downtime switch

# Current state: blue is live, green is idle

# 1. Deploy new version to green environment
kubectl set image deployment/app-green app=myapp:v2.0.0

# 2. Wait for green to be ready
kubectl rollout status deployment/app-green

# 3. Run smoke tests on green (via internal endpoint, not public)
curl https://green-internal.example.com/health
curl https://green-internal.example.com/api/smoke-test

# 4. Switch traffic from blue to green (AWS ALB target group swap)
aws elbv2 modify-listener \
  --listener-arn arn:aws:elasticloadbalancing:... \
  --default-actions Type=forward,TargetGroupArn=arn-green

# 5. Monitor error rates for 5 minutes
# If errors spike → instant rollback by switching back to blue:
aws elbv2 modify-listener \
  --listener-arn arn:aws:elasticloadbalancing:... \
  --default-actions Type=forward,TargetGroupArn=arn-blue

# Blue stays running until green is confirmed stable (keep for 30min)
# Then scale down blue to save cost`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Single availability zone deployment',
    wrong: `# All instances in us-east-1a
# AWS data center issue in 1a → all instances down simultaneously`,
    right: `# Spread across at least 2 AZs:
# us-east-1a: 2 instances, us-east-1b: 2 instances
# Auto-scaling group: min=2, desired=4, multi-AZ enabled
# ALB routes across both AZs automatically`,
    explanation: 'A single AZ deployment has 100% blast radius from zone-level failures (power, networking). Always deploy across 2+ availability zones, even for non-critical services.',
  },
  {
    title: 'No health check on dependencies',
    wrong: `// Health endpoint always returns 200:
app.get('/health', (req, res) => res.json({ status: 'ok' }));
// Load balancer thinks service is healthy even when DB is down`,
    right: `// Health check should verify critical dependencies:
app.get('/health', async (req, res) => {
  const dbOk = await db.ping().then(() => true).catch(() => false);
  res.status(dbOk ? 200 : 503).json({ database: dbOk });
});`,
    explanation: 'A health endpoint that always returns 200 misleads the load balancer — traffic keeps routing to a dead instance. Health checks must verify that the service can actually serve requests.',
  },
  {
    title: 'Hardcoded timeouts that are too long',
    wrong: `// Default HTTP timeout: 30 seconds
// 100 concurrent requests × 30s timeout = all threads blocked
// Cascading failure: service B is slow → service A threads exhausted`,
    right: `// Set short timeouts + circuit breaker:
const client = axios.create({ timeout: 2000 }); // 2s timeout
// Circuit breaker opens after 5 failures → fail fast instead of blocking`,
    explanation: 'Long timeouts under high load exhaust thread pools. A slow downstream service cascades into upstream failures. Set aggressive timeouts (1-3s for most APIs) and use circuit breakers.',
  },
  {
    title: 'Manual failover instead of automated',
    wrong: `# On-call engineer wakes at 3am
# Manually SSH to replica
# Run pg_ctl promote
# Update DNS
# Total: 15-30 minutes downtime`,
    right: `# Use automated failover:
# PostgreSQL + Patroni: automatic election in < 30 seconds
# AWS RDS Multi-AZ: automatic failover in 60-120 seconds
# Route53 health check: automatic DNS failover in < 60 seconds`,
    explanation: 'Manual failover at 3am takes 15-30 minutes and is error-prone. Automated failover with Patroni, RDS Multi-AZ, or cloud-native tools achieves failover in under 2 minutes — while you sleep.',
  },
];

const challenge: Challenge = {
  title: 'Eliminate single points of failure from a web architecture',
  language: 'typescript',
  description: `Review this architecture and identify all SPOFs:

Current architecture:
- 1 Nginx load balancer (single server)
- 2 app servers (Node.js)
- 1 PostgreSQL primary (no replica)
- 1 Redis instance (session store)
- 1 S3-compatible object store in one region

Requirements:
- 99.99% uptime SLA (52 min/year downtime budget)
- Handle regional datacenter failure
- Zero-downtime deployments

For each SPOF:
1. Identify the risk
2. Propose the fix
3. Estimate remaining downtime`,
  hints: [
    'Load balancer itself is a SPOF — use cloud LB or two LBs + anycast',
    'Single PostgreSQL = SPOF — need primary + sync replica + auto failover',
    'Single Redis = SPOF for sessions — Redis Sentinel or Redis Cluster',
    '99.99% requires multi-AZ; regional failure needs multi-region',
  ],
  starterCode: `interface SPOF {
  component: string;
  risk: string;
  fix: string;
  downtimeImpact: string;
}

const spofs: SPOF[] = [
  // 1. Nginx load balancer
  // 2. PostgreSQL primary
  // 3. Redis instance
  // 4. Object store (single region)
];`,
  solution: `const spofs: SPOF[] = [
  {
    component: 'Nginx load balancer (single server)',
    risk: 'Server failure → 100% traffic down. No redundancy.',
    fix: 'Replace with AWS ALB or GCP Load Balancer (cloud-managed HA). Or: 2× Nginx + Keepalived VIP + BGP anycast.',
    downtimeImpact: 'Fixed: cloud LB is multi-AZ by default — SPOF eliminated.',
  },
  {
    component: 'PostgreSQL primary (no replica)',
    risk: 'Primary failure → all writes fail; data potentially lost.',
    fix: 'Add synchronous replica in different AZ. Use Patroni for auto-election or AWS RDS Multi-AZ.',
    downtimeImpact: 'Fixed: auto-failover in 60-120s → ~2 min unplanned downtime/yr.',
  },
  {
    component: 'Redis (single instance)',
    risk: 'Redis crash → all sessions lost; users logged out; rate limiters reset.',
    fix: 'Redis Sentinel (1 primary + 2 replicas + 3 sentinels) or ElastiCache with Multi-AZ.',
    downtimeImpact: 'Fixed: sentinel failover in 30s → negligible downtime.',
  },
  {
    component: 'Object store (single region)',
    risk: 'Regional failure → media/files unavailable; errors on all media requests.',
    fix: 'Enable cross-region replication on S3. Serve via CloudFront CDN (cached copies available even during origin outage).',
    downtimeImpact: 'Fixed: CDN serves stale content during outage; RPO < 1 min with CRR.',
  },
];
// Remaining risk: single-region app layer. 99.99% with multi-AZ is achievable.
// 99.999% requires multi-region active-active (separate project).`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the maximum annual downtime for a 99.99% availability SLA?',
    options: ['8.76 hours', '52.6 minutes', '5.26 minutes', '1 hour'],
    answer: 1,
    explanation: '99.99% = 0.01% downtime. 0.0001 × 365 × 24 × 60 = 52.6 minutes per year. 99.9% = 8.76 hrs/yr; 99.999% = 5.26 min/yr.',
  },
  {
    q: 'Active-active deployment provides which advantage over active-passive?',
    options: [
      'Lower cost (fewer servers)',
      'Zero failover delay — remaining nodes absorb traffic instantly',
      'Simpler data consistency',
      'Easier to deploy',
    ],
    answer: 1,
    explanation: 'In active-passive, failing over to the standby takes 30s–2min. In active-active, all nodes already handle traffic — a failed node is just removed from rotation with no warmup needed.',
  },
  {
    q: 'A service with three 99.9% components in series has what availability?',
    options: ['99.9%', '99.7%', '99.0%', '98.1%'],
    answer: 1,
    explanation: 'Availability in series = product of availabilities: 0.999 × 0.999 × 0.999 = 0.997 = 99.7%. Serial chains multiply downtime risk. Use redundancy and parallelism to break serial dependencies.',
  },
  { q: 'A service depends on two independent downstream dependencies, each with a 99.99% availability SLA. What is the resulting availability of a request that requires BOTH dependencies to succeed, and why is the naive "still four nines" assumption wrong?', options: ['Still 99.99%, since both dependencies are individually four-nines', 'Approximately 99.98% — availabilities multiply for dependencies required in series (0.9999 × 0.9999 ≈ 0.9998), so composing several "four nines" dependencies serially degrades the overall availability below any single one of them, roughly doubling the effective downtime budget with just two dependencies', 'Exactly 100%, since redundant dependencies cancel out failure risk', 'It depends only on the slower of the two dependencies\' latency, not their availability'], answer: 1, explanation: 'Availability for independent components required in series multiplies rather than averages: P(all succeed) = P(A succeeds) × P(B succeeds). Two 99.99% dependencies in series yield roughly 99.98% combined — about 105 minutes/year of allowed downtime instead of 52, since a failure in EITHER dependency fails the composite request. This compounds further with more serial dependencies, which is why a system with many microservice hops each individually meeting "four nines" can still end up with a much worse end-to-end availability than any single service in the chain — a key reason architects push for redundancy/fallbacks on critical dependencies rather than assuming each service\'s own SLA automatically composes safely.' },
  { q: 'What is an SLA, SLO, and SLI and how do they relate?', options: ['They are different names for the same availability metric', 'SLI is the measured metric, SLO is the target for that metric, and SLA is the contractual commitment derived from SLOs with penalties for violations', 'SLA is for external customers only; SLO and SLI are internal engineering metrics with no business impact', 'SLI measures individual requests; SLO measures service availability; SLA measures infrastructure uptime'], answer: 1, explanation: 'SLI (Service Level Indicator) is a measured metric: request success rate, P99 latency, or error rate. SLO (Service Level Objective) is the target for that SLI: 99.9% of requests succeed, P99 latency under 200ms. SLOs are internal engineering commitments. SLA (Service Level Agreement) is the contract with customers that commits to specific SLOs with defined consequences like credits or refunds for violations. SLAs are derived from SLOs with some buffer: if your SLO is 99.9%, your SLA might commit to 99.5% to avoid constant violations.' },
  { q: 'What is a single point of failure (SPOF) and how do you eliminate one?', options: ['A component that is accessed by only a single user at a time', 'A component whose failure causes the entire system to fail, eliminated by adding redundant instances with automatic failover', 'Any component running on a single physical server', 'A synchronous database write that blocks the entire request pipeline'], answer: 1, explanation: 'A SPOF is any component whose failure causes the entire system to stop working. Common SPOFs: a single load balancer, a single database primary, a single DNS server, a single region deployment. Eliminate SPOFs by: adding redundant instances behind a load balancer, deploying database replicas with automatic failover, using multiple DNS providers, and deploying across multiple availability zones or regions. For each critical component, ask what happens if it fails: if the answer is total outage, it is a SPOF that needs redundancy.' },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between liveness and readiness probes?',
    a: 'Liveness probe: "is the process running?" If it fails, Kubernetes restarts the container. Used to detect deadlocks or infinite loops. Readiness probe: "can this instance serve traffic?" If it fails, Kubernetes removes the pod from the Service endpoints — traffic stops routing to it but the container stays running. Readiness is for dependency failures (DB down); liveness is for process crashes.',
  },
  {
    q: 'How do you achieve zero-downtime deployments?',
    a: 'Three techniques: (1) Rolling update — replace instances one-at-a-time, always keeping N-1 running. (2) Blue-green — deploy to idle environment, switch traffic atomically, instant rollback. (3) Canary — route 5% of traffic to new version, watch metrics, gradually increase to 100%. Each requires stateless application instances (sessions in Redis, not in-process).',
  },
  { q: 'A "zero-downtime" rolling deployment goes smoothly at the infrastructure level (health checks pass, no failed requests), but users report brief errors during the rollout window specifically on requests that touch a JSON field the new code renamed. Why does an infrastructurally-perfect rolling deployment still cause user-visible errors here, and what practice would have caught it before deploying?', a: 'During a rolling deployment, OLD and NEW code versions are simultaneously serving live traffic for the duration of the rollout — if the new version writes a renamed/restructured field but the old version (still running on not-yet-updated instances) doesn\'t know about that new shape, requests routed to old instances that then read data written by new instances (or vice versa) can fail deserialization or misinterpret the payload, even though every individual instance is healthy and passing its own health checks. This is why "zero-downtime infrastructure" and "zero-downtime APPLICATION behavior" are different guarantees: the deployment mechanism only promises instances stay up, not that two different code versions agree on data shape during the overlap window. The practice that catches this ahead of time is enforcing backward- AND forward-compatible schema changes (expand-contract: add the new field alongside the old one, deploy code that writes both, only remove the old field in a LATER deploy after all instances are on the new version) rather than a single deploy that renames a field outright.' },
  { q: 'What is an error budget and how is it used to balance reliability and feature velocity?', a: 'An error budget is the amount of unreliability permitted by the SLO — but there are two genuinely different ways to measure it, not two interchangeable restatements of the same number. A REQUEST-based error budget (0.1% of requests allowed to fail for a 99.9% SLO) is Google\'s SRE book\'s preferred approach, since it reflects actual user impact and works even when the service is never fully "down." A TIME-based error budget (about 8.7 hours of downtime per year) only equals the request-based figure if "down" means literally zero successful requests during that window — a service with scattered partial failures can burn its request-based budget while never registering as fully down on a time-based measure. The error budget (whichever way it\'s measured) is shared between planned outages (maintenance), incidents, and risk taken with deployments. If the error budget is consumed, engineering focus shifts to reliability work and risky deployments are paused. If the budget is healthy, the team can move faster and take more deployment risks. Error budgets align incentives between product teams (who want features fast) and SRE teams (who want reliability) by giving both a shared metric to optimize.' },
  { q: 'How do you implement graceful shutdown for a service to achieve zero connection drops during restarts?', a: 'Graceful shutdown procedure: (1) Receive SIGTERM signal from the orchestrator. (2) Stop accepting new connections by deregistering from the load balancer or marking the health check as unhealthy. (3) Wait for in-flight requests to complete, up to a configurable drain timeout (typically 15-30 seconds). (4) Close database connections and flush buffers. (5) Exit cleanly. Kubernetes sends SIGTERM before a pod terminates and waits for the terminationGracePeriodSeconds before sending SIGKILL. Configure the pre-stop hook to add a short sleep before SIGTERM processing so the load balancer has time to remove the pod from rotation before it stops accepting connections.' },
  { q: 'What is multi-AZ versus multi-region deployment and when do you need each?', a: 'Multi-AZ: deploy replicas across multiple Availability Zones within one region. Each AZ has independent power and networking; an AZ failure (which happens occasionally) does not affect other AZs. Multi-AZ adds resilience against individual AZ outages at relatively low latency cost since AZs in a region are connected with low-latency fiber. This is the minimum for production services. Multi-region: deploy across multiple geographic regions like us-east-1 and eu-west-1. Provides resilience against region-wide outages (which are very rare but do occur) and reduces latency for globally distributed users. Multi-region adds significant operational complexity including data synchronization, conflict resolution for writes, and routing policy management. Use multi-region only when business requirements demand the additional resilience or when you have substantial user populations in multiple geographies.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Eliminate SPOFs at every tier; active-active for instant failover; automate health checks and failover; spread across AZs.',
  mustKnow: [
    '99.9% = 8.76 hrs/yr; 99.99% = 52 min/yr; 99.999% = 5 min/yr',
    'Active-passive: standby synced, failover 30s-2min; active-active: instant',
    'Serial availability = product of component availabilities',
    'Liveness probe: restart on failure; readiness probe: remove from rotation',
    'Graceful shutdown: drain connections before stopping (SIGTERM + 30s)',
    'Blue-green: instant rollback; canary: gradual traffic shift with metrics',
  ],
  interviewFocus: [
    'Calculate combined availability of a multi-tier system',
    'Identify SPOFs in a given architecture diagram',
    'Explain active-active vs active-passive with failover time difference',
    'Describe zero-downtime deployment strategy for stateful vs stateless services',
  ],
};

@Component({
  selector: 'app-sysdesign-high-availability',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './high-availability.html',
  styleUrl: './high-availability.scss',
})
export class SysdesignHighAvailability {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
