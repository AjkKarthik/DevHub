import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface IQItem {
  difficulty: 'junior' | 'mid' | 'senior';
  category: string;
  question: string;
  answer: string;
}

const questions: IQItem[] = [
  {
    difficulty: 'junior',
    category: 'Fundamentals',
    question: 'What are the three pillars of observability?',
    answer: '<strong>Metrics, Logs, and Traces</strong> — each provides a different lens into system behaviour.<br><br><strong>Metrics</strong>: numerical measurements aggregated over time (request rate, error rate, latency percentiles). Low storage cost, ideal for dashboards and alerting.<br><strong>Logs</strong>: discrete events with context (structured JSON with requestId, userId, error message). High detail, used for root cause investigation after an alert fires.<br><strong>Traces</strong>: end-to-end request paths across services, showing which service/function caused latency. Uses parent-child span relationships with a shared traceId.<br><br>The three pillars complement each other: metrics trigger an alert, traces find the slow service, logs explain what happened in that service.',
  },
  {
    difficulty: 'junior',
    category: 'Metrics',
    question: 'What are the RED metrics and why are they useful?',
    answer: '<strong>R</strong>ate — requests per second. How much traffic is the service receiving?<br><strong>E</strong>rrors — fraction (or count) of requests that fail. Are users experiencing failures?<br><strong>D</strong>uration — latency distribution (p50, p99, p999). How long do successful requests take?<br><br>RED metrics are useful because they directly measure user-visible service behaviour. CPU at 80% might be fine — but a 5% error rate always means users are failing. Every service should have RED dashboards. They are the first thing to check during an incident to identify which service is degraded.',
  },
  {
    difficulty: 'junior',
    category: 'Logging',
    question: 'Why should production logs be structured JSON instead of plain text?',
    answer: 'Plain text logs are human-readable but machine-unfriendly. You cannot efficiently query "all ERROR logs where userId = 123" from plain text at scale.<br><br>Structured JSON logging gives each field a name, making logs queryable:<br><code>{"level":"error","msg":"Payment failed","userId":"123","traceId":"abc","durationMs":502}</code><br><br>Benefits:<br>• Every field is filterable/queryable in Loki, Elasticsearch, or CloudWatch Logs<br>• traceId field enables jumping from a log entry directly to the matching distributed trace<br>• Log aggregation tools can parse fields automatically without fragile regex<br>• Consistent schema across services enables cross-service log analysis<br><br>Never log PII (names, emails, card numbers) — sanitise before logging.',
  },
  {
    difficulty: 'junior',
    category: 'Alerting',
    question: 'What is the difference between alerting on symptoms vs causes? Give an example.',
    answer: '<strong>Cause-based alert</strong>: triggers when an internal metric exceeds a threshold, regardless of user impact. Example: "CPU > 80%." CPU can be high during legitimate batch processing with zero user impact — this produces false positives and alert fatigue.<br><br><strong>Symptom-based alert</strong>: triggers when user-observable behaviour degrades. Example: "HTTP error rate > 1%." This only fires when users are actually experiencing failures — every fire is actionable.<br><br>Prefer symptom-based alerts for paging engineers. Use cause-based alerts as tickets or dashboard panels for capacity planning — they provide context once you know there is a symptom, but should not wake someone up at 3am on their own.',
  },
  {
    difficulty: 'mid',
    category: 'SLO',
    question: 'Explain SLI, SLO, and SLA. How are they related?',
    answer: '<strong>SLI (Service Level Indicator)</strong>: the actual measurement. Example: "fraction of HTTP requests returning 200 OK in < 500ms over the last 5 minutes." A ratio between 0 and 1.<br><br><strong>SLO (Service Level Objective)</strong>: the target for the SLI. Example: "The SLI must be ≥ 99.9% over a rolling 30-day window." This is the internal engineering commitment — no contractual force.<br><br><strong>SLA (Service Level Agreement)</strong>: a contractual commitment to the customer, typically less strict than the SLO (so the team has headroom before breaching the contract). Example: "We guarantee 99.5% availability. Below this, customers receive service credits."<br><br>Relationship: SLI is measured → compared against SLO → SLO headroom protects SLA. Engineers defend the SLO; legal/commercial teams own the SLA.',
  },
  {
    difficulty: 'mid',
    category: 'Tracing',
    question: 'What is distributed tracing and why is it needed in microservices?',
    answer: 'Distributed tracing tracks a single request as it flows through multiple services, constructing a complete timeline (trace) of every operation involved.<br><br>A trace is a collection of spans. Each span represents one unit of work (an HTTP handler, a database query, a cache lookup). Spans have: traceId (shared across all services for this request), spanId (unique to this span), parentSpanId (links to the calling span), start time, duration, and attributes.<br><br>Why microservices need it: in a monolith, a profiler or stack trace shows the slow function. In microservices, "the checkout is slow" might involve 8 services. Without tracing, you SSH into each service looking for clues. With tracing: one Jaeger URL shows the complete trace tree — the 2-second DB query in the inventory service on line 234 of ProductRepository.ts caused the slowness.',
  },
  {
    difficulty: 'mid',
    category: 'Metrics',
    question: 'What is the difference between a Prometheus Counter and a Gauge? When do you use each?',
    answer: '<strong>Counter</strong>: monotonically increasing — it only ever goes up (or resets to 0 on restart). Use for: total request count, total errors, total bytes processed. In PromQL, use rate() to get the per-second rate of change: `rate(http_requests_total[5m])`.<br><br><strong>Gauge</strong>: can go up or down — represents a current value. Use for: current active connections, queue depth, memory in use, temperature. In PromQL, use directly: `process_resident_memory_bytes`.<br><br>Common mistake: using a Gauge for request counts — the value flickers as requests complete, making it useless for rate calculation. Use a Counter for any cumulative count, and derive rates from it with rate() or increase().',
  },
  {
    difficulty: 'mid',
    category: 'Alerting',
    question: 'What is a multi-window burn rate alert and why is it better than a simple threshold alert?',
    answer: 'A <strong>multi-window burn rate alert</strong> fires when the error budget is being consumed faster than sustainable, using two time windows simultaneously to balance sensitivity and specificity.<br><br>Example for a 99.9% SLO: fire when BOTH (burn rate over 1h > 14×) AND (burn rate over 6h > 14×).<br><br><strong>Why better than threshold alert</strong>:<br>• Threshold: "error rate > 2%" — fires whenever error rate spikes, even for 30-second blips. High false positive rate.<br>• Single window burn: fires faster but misses significance — a 2-minute spike at 14× barely dents the budget but triggers the alert.<br>• Multi-window: the short window detects the problem quickly; the long window confirms it is sustained and significant, not a transient spike. Result: alerts that fire when the budget is genuinely at risk, not on noise.',
  },
  {
    difficulty: 'mid',
    category: 'OpenTelemetry',
    question: 'What is OpenTelemetry and why has it become the industry standard?',
    answer: 'OpenTelemetry (OTel) is a vendor-neutral, open-source observability framework providing: standardised APIs for emitting traces, metrics, and logs; SDKs for 10+ languages; a Collector for receiving, processing, and exporting telemetry; and the OTLP wire protocol for transporting data.<br><br><strong>Why it won</strong>:<br>• Before OTel: each APM vendor (Datadog, New Relic, Dynatrace) required a proprietary agent. Switching vendors meant re-instrumenting every service.<br>• With OTel: instrument once with the standard SDK. Switch export backends by changing collector configuration — no code changes. Lock-in is eliminated.<br>• CNCF graduation: vendor-neutral governance means no single company controls the standard. Google, Microsoft, Splunk, Datadog, and others all contribute.<br>• The OTLP protocol is now supported by virtually every observability backend, making OTel the de facto industry standard for new instrumentation.',
  },
  {
    difficulty: 'senior',
    category: 'SLO',
    question: 'How do error budgets change the relationship between development and SRE?',
    answer: 'Error budgets replace the adversarial "reliability vs velocity" debate with a quantitative, policy-driven mechanism:<br><br><strong>Without budgets</strong>: Dev wants to ship features fast; SRE wants stability. "Should we deploy this risky change?" is a human negotiation — often political, often arbitrary.<br><br><strong>With budgets</strong>: the budget number answers the question objectively. 40% remaining + low-risk deploy → yes. 5% remaining + risky migration → no. The policy is pre-agreed, so there is no negotiation at deploy time.<br><br><strong>Aligned incentives</strong>: Development wants to spend budget on features; incidents consume budget unexpectedly. So development has an incentive to write reliable code — unreliable features eat the budget they need for future velocity.<br><br><strong>SRE perspective</strong>: SRE is not the gatekeeper — the budget is. SRE focuses on enabling development to move safely rather than blocking deploys. The budget policy makes the trade-offs explicit and shared.',
  },
  {
    difficulty: 'senior',
    category: 'Architecture',
    question: 'Your service has low CPU utilisation but consistently high p99 latency. How do you diagnose this?',
    answer: 'Low CPU + high p99 is the classic event loop blocking or lock contention pattern. Diagnosis approach:<br><br><strong>1. Check event loop lag</strong> (Node.js): `monitorEventLoopDelay()` histogram. If p99 lag > 100ms, a synchronous operation is occupying the event loop.<br><br><strong>2. Examine trace exemplars</strong>: in Grafana, click the ◆ on the p99 spike to get the specific trace. Which span accounts for the duration? Is it a DB query, an external call, or within the service itself?<br><br><strong>3. Lock/mutex contention</strong> (Java/Go): thread dump or goroutine dump. Threads blocked waiting for a lock show the contention point.<br><br><strong>4. Connection pool exhaustion</strong>: check the DB connection pool wait metric. If requests wait for an available connection, p99 is high (waiter queue) while CPU is low (nothing executing while waiting).<br><br><strong>5. CPU profiling</strong>: capture a CPU profile during the high-latency period. The hot synchronous function will be wide in the flamegraph even at "low CPU" — because it briefly maxes one core while other cores are idle.<br><br>Root causes by frequency: (1) synchronous I/O in hot path, (2) connection pool undersized, (3) GC pressure (short-lived allocations), (4) mutex contention in thread pool.',
  },
  {
    difficulty: 'senior',
    category: 'Design',
    question: 'How would you design the observability strategy for a new microservice from day one?',
    answer: 'Start with the question: "How will we know this service is working correctly?" before writing the first line of business logic.<br><br><strong>Day 1 — instrumentation</strong>:<br>• Add OTel SDK (auto-instrumentation for HTTP, DB frameworks)<br>• Add Prometheus client: RED counter/histogram + service-specific business metrics<br>• Structured logging with requestId, userId, traceId correlation<br>• Health check endpoint: /health (liveness) + /ready (readiness)<br><br><strong>Day 1 — integration</strong>:<br>• Register in Prometheus scrape config<br>• Add to log aggregation pipeline (Loki/ELK)<br>• Add to Jaeger/Tempo trace backend<br><br><strong>Week 1 — SLIs</strong>:<br>• Define 1-3 SLIs that capture user experience for this service<br>• Measure for 2 weeks before setting the SLO target<br>• Build RED dashboard with deploy annotations<br><br><strong>Week 2 — alerting</strong>:<br>• Add burn rate alert based on SLO<br>• Write runbook for the alert (day 1, not after first incident)<br>• Add to on-call rotation if user-facing<br><br><strong>Month 1 — verify</strong>:<br>• Run one chaos experiment (pod kill) to verify resilience and observability both work<br>• Check: did the experiment show up on dashboards? Did logs have traceIds?',
  },
  {
    difficulty: 'senior',
    category: 'Chaos',
    question: 'Describe the process for running a production chaos experiment safely.',
    answer: 'A production chaos experiment requires significantly more rigor than a staging experiment:<br><br><strong>Pre-requisites before running in production</strong>:<br>1. Same experiment has run successfully in staging with the expected blast radius<br>2. Steady-state is well-understood and measurable from dashboards<br>3. SLI dashboards are real-time with < 15s delay<br>4. Abort mechanism tested and ready<br>5. Team knows: who is watching, who can abort, abort criteria defined<br><br><strong>The process</strong>:<br>1. Schedule with team — never surprise production chaos<br>2. Record steady-state metrics for 10 minutes before start<br>3. Annotate the experiment start in Grafana<br>4. Inject the fault with minimum blast radius (1 pod, 2 minutes to start)<br>5. Watch dashboards continuously — is steady state maintained?<br>6. After experiment ends: annotate stop, observe recovery<br>7. Document: did hypothesis hold? What was the actual blast radius?<br><br><strong>Abort criteria</strong>: define upfront. Example: "if error rate > 2× baseline for > 30 seconds, abort." Have the abort command in a terminal tab before starting.<br><br><strong>Scale gradually</strong>: first run = 1 pod, 2 minutes. Subsequent runs = increase duration or scope based on confidence from previous runs.',
  },
  {
    difficulty: 'senior',
    category: 'eBPF',
    question: 'What is eBPF and how does it enable observability without code changes?',
    answer: 'eBPF (Extended Berkeley Packet Filter) is a Linux kernel subsystem that allows sandboxed programs to run in kernel space, verified by the kernel to be safe before execution.<br><br><strong>How it enables zero-code-change observability</strong>:<br>• Services send and receive data through kernel system calls (read(), write(), connect()). eBPF attaches to these kernel functions via kprobes.<br>• HTTP: the kernel socket layer receives raw bytes before they reach the application. eBPF can parse the HTTP protocol from these bytes — extracting method, path, status, latency — without any application-side instrumentation.<br>• Database queries: eBPF intercepts the PostgreSQL or MySQL wire protocol at the socket level — reading SQL statements and timing them before they reach the application or after the response returns.<br>• Process execution, file access, network connections: all observable via eBPF tracepoints without any agent in the application.<br><br><strong>Tools built on eBPF</strong>: Pixie (K8s auto-instrumentation), Cilium/Hubble (network flows), Pyroscope (continuous CPU profiling), Tetragon (security observability).<br><br><strong>Trade-off</strong>: cannot observe application-level business context (user IDs, custom business events) — these still require application instrumentation. eBPF gives you the infrastructure layer automatically.',
  },
];

const DIFFICULTIES = ['All', 'junior', 'mid', 'senior'] as const;
const CATEGORIES_IP = ['All', ...Array.from(new Set(questions.map(q => q.category)))];

@Component({
  selector: 'app-obs-interview-prep',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './interview-prep.html',
  styleUrl: './interview-prep.scss',
})
export class ObsInterviewPrep {
  activeDifficulty = signal<string>('All');
  activeCategory = signal<string>('All');
  openIndex = signal<number | null>(null);

  difficulties = DIFFICULTIES;
  categories = CATEGORIES_IP;
  questions = questions;

  filtered() {
    const d = this.activeDifficulty();
    const c = this.activeCategory();
    return this.questions.filter(q =>
      (d === 'All' || q.difficulty === d) &&
      (c === 'All' || q.category === c)
    );
  }

  toggle(i: number) {
    this.openIndex.set(this.openIndex() === i ? null : i);
  }

  setDifficulty(d: string) { this.activeDifficulty.set(d); this.openIndex.set(null); }
  setCategory(c: string)   { this.activeCategory.set(c);   this.openIndex.set(null); }
}
