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
  { name: 'Maturity Level 0', type: 'keyword', desc: 'No observability — logs to stdout, no metrics, no tracing, no dashboards. Failures discovered by user reports.' },
  { name: 'Maturity Level 1', type: 'keyword', desc: 'Basic monitoring — system metrics (CPU, memory), uptime checks, simple alerting. Infrastructure visibility but no service-level insight.' },
  { name: 'Maturity Level 2', type: 'keyword', desc: 'Application observability — RED metrics, structured logging, basic distributed tracing. Teams can diagnose incidents within the service.' },
  { name: 'Maturity Level 3', type: 'keyword', desc: 'SLO-driven observability — SLIs measured, SLOs defined, error budgets tracked, multi-window burn rate alerting. Reliability decisions data-driven.' },
  { name: 'Maturity Level 4', type: 'keyword', desc: 'Proactive observability — continuous profiling, chaos engineering, anomaly detection, correlated metrics+traces+logs. Prevention over reaction.' },
  { name: 'Observability ROI', type: 'keyword', desc: 'MTTR reduction × incidents/year × engineer cost/hour. Teams at Level 3+ typically reduce MTTR by 60-80% vs Level 0.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'The Observability Maturity Model',
    points: [
      'Observability maturity describes how capable an organisation is at understanding its systems\' internal state from external outputs. Higher maturity = faster incident detection, faster resolution, and more preventive work.',
      'The model is a framework for identifying gaps and planning incremental improvements — not a scorecard. No organisation starts at Level 4. Progress through each level systematically rather than trying to implement everything simultaneously.',
      'Maturity is per-team, not per-organisation. The payments team might be at Level 3 while the notifications team is at Level 1. Focus investment where the risk and complexity is highest.',
      'The primary business case for observability maturity: MTTR reduction. At Level 0, diagnosing a production incident takes hours. At Level 3, it takes minutes. The cost of engineering time during incidents justifies the investment.',
    ],
  },
  {
    heading: 'Level 0 → Level 1: Getting Visibility',
    points: [
      'Level 0 characteristics: log messages go to stdout with no structured format, services have no health endpoints, failures are discovered via user support tickets or monitoring pings.',
      'To reach Level 1: deploy infrastructure monitoring (Prometheus node_exporter, cloud provider metrics), add uptime checks, create basic on-call rotation, enable log aggregation (CloudWatch, ELK, Loki).',
      'Level 1 gives you: "Is the host alive?" and "Is the process running?" — but not "Are users experiencing errors?" or "Which code path is slow?"',
      'Critical Level 1 addition: add `/health` and `/metrics` endpoints to every service. This is the foundation all higher levels build on.',
    ],
  },
  {
    heading: 'Level 1 → Level 2: Service Visibility',
    points: [
      'Level 2 requirements: RED metrics per service (Rate, Errors, Duration), structured JSON logging with correlation IDs, distributed tracing with at least 1% sampling, service-level dashboards with annotated deploys.',
      'The key shift at Level 2: teams can now answer "which service is causing the user impact?" — previously, the only answer was "something is wrong somewhere".',
      'At Level 2, on-call engineers can identify the affected service and relevant code paths within 5-10 minutes of an alert firing.',
      'Standard Level 2 toolchain: Prometheus + Grafana, structured logging to Loki or ELK, Jaeger or Tempo for tracing, OpenTelemetry SDK in each service.',
    ],
  },
  {
    heading: 'Level 2 → Level 3: SLO-Driven Reliability',
    points: [
      'Level 3 requirements: SLIs defined for every user-facing service, SLOs written and agreed by both engineering and product, error budgets tracked, burn rate alerts replacing threshold alerts.',
      'The key shift at Level 3: reliability becomes data-driven. Instead of "should we deploy this?" being a gut decision, it is answered by "how much error budget do we have?" The policy governs the answer.',
      'Level 3 observability connects to business outcomes: the error budget is directly tied to user experience degradation. Product managers understand the budget in user-impact terms.',
      'Teams at Level 3 have weekly error budget reviews, quarterly SLO reviews, and postmortems with measurable action items.',
    ],
  },
  {
    heading: 'Level 3 → Level 4: Proactive Reliability',
    points: [
      'Level 4 requirements: continuous profiling, chaos engineering (regularly validated), anomaly detection (ML-based or statistical), pillars correlated (traces linked to profiles, metrics linked to trace exemplars).',
      'The key shift at Level 4: from reactive (alert fires, fix it) to proactive (detect degradation trends before they cause incidents, validate resilience before failures occur).',
      'Level 4 teams find and fix performance regressions in profiling data before they manifest as latency spikes in dashboards. They run GameDays to validate resilience quarterly.',
      'The ROI of Level 4 is in prevented incidents: the cost of one major incident (engineer time + revenue loss + customer trust) often exceeds months of investment in Level 4 tooling.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Maturity Assessment',
    language: 'typescript',
    code: `// Observability maturity self-assessment checklist
// Score each area 0-4. Track progress quarter over quarter.

interface MaturityArea {
  area: string;
  level: 0 | 1 | 2 | 3 | 4;
  evidence: string;
  nextStep: string;
}

const assessment: MaturityArea[] = [
  {
    area: 'Metrics',
    level: 2,
    evidence: 'RED metrics on all services, Grafana dashboards, deploy annotations',
    nextStep: 'Define SLOs for all user-facing services, enable error budget tracking',
  },
  {
    area: 'Logging',
    level: 2,
    evidence: 'Structured JSON logs, centralized in Loki, queryable via Grafana',
    nextStep: 'Add correlation IDs to all log lines, link logs to traces via traceId',
  },
  {
    area: 'Tracing',
    level: 1,
    evidence: 'Jaeger deployed, 3 services instrumented with OTel SDK',
    nextStep: 'Instrument all services, add custom business spans, enable trace exemplars',
  },
  {
    area: 'Alerting',
    level: 1,
    evidence: 'Basic threshold alerts (CPU, memory, uptime), PagerDuty connected',
    nextStep: 'Migrate to symptom-based SLI alerts, implement burn rate alerting',
  },
  {
    area: 'SLOs',
    level: 0,
    evidence: 'None defined',
    nextStep: 'Define SLIs for top 3 user-facing services, measure for 30 days, set SLOs',
  },
  {
    area: 'Incident Response',
    level: 2,
    evidence: 'On-call rotation, runbooks for top 5 alerts, blameless postmortems',
    nextStep: 'Add MTTR/MTTD tracking, quarterly postmortem trends review',
  },
  {
    area: 'Profiling',
    level: 0,
    evidence: 'On-demand only, no production profiling',
    nextStep: 'Deploy Pyroscope for continuous profiling on top 3 services',
  },
  {
    area: 'Chaos Engineering',
    level: 0,
    evidence: 'Never run chaos experiments',
    nextStep: 'Run first GameDay: pod kill on staging, verify K8s restart SLO',
  },
];

function computeMaturityScore(areas: MaturityArea[]): {
  average: number;
  weakest: MaturityArea[];
} {
  const sum = areas.reduce((s, a) => s + a.level, 0);
  const sorted = [...areas].sort((a, b) => a.level - b.level);
  return {
    average: Math.round((sum / areas.length) * 10) / 10,
    weakest: sorted.slice(0, 3), // bottom 3 areas by maturity
  };
}

const result = computeMaturityScore(assessment);
console.log(\`Overall maturity: \${result.average}/4\`);
console.log('Priority areas:', result.weakest.map(a => a.area));
// → Priority areas: SLOs, Profiling, Chaos Engineering`,
  },
  {
    label: 'Roadmap Template',
    language: 'typescript',
    code: `# Observability Roadmap — Q1 to Q4

## Q1: Foundation (Level 0 → Level 1)
Goals:
  - All services expose /health and /metrics endpoints
  - Prometheus + Grafana deployed, scraping all services
  - Infrastructure metrics: CPU, memory, disk, network per node
  - Log aggregation: all stdout/stderr to Loki
  - Basic uptime alerts for all services

Milestones:
  Week 2: Prometheus + Grafana + Loki deployed
  Week 4: All 12 services exposing /metrics
  Week 6: Basic alerting configured, on-call rotation established
  Week 8: Review: are we alerted before users report issues?

## Q2: Application Visibility (Level 1 → Level 2)
Goals:
  - RED metrics (Rate/Error/Duration) for all user-facing services
  - Structured JSON logging with requestId and userId fields
  - Distributed tracing: OTel SDK in all 12 services
  - Service-level dashboards with deploy annotations
  - SLI identification: measure what users actually care about

Milestones:
  Week 2: OTel SDK added to top 3 services (payment, auth, api-gateway)
  Week 4: All services have RED dashboards
  Week 6: Structured logs with trace correlation (traceId in log lines)
  Week 8: MTTD measured baseline; set target for Q3

## Q3: SLO-Driven (Level 2 → Level 3)
Goals:
  - SLOs defined for all user-facing services (target: 5 SLOs)
  - Error budgets tracked in Grafana
  - Burn rate alerts replace threshold alerts
  - Error budget policy written and agreed with product
  - Weekly error budget reviews

Milestones:
  Week 2: First 3 SLOs measured (not yet enforced)
  Week 4: Error budget policy signed by VP Eng + VP Product
  Week 6: Burn rate alerts live, old threshold alerts removed
  Week 8: First error budget review with product team

## Q4: Proactive (Level 3 → Level 4)
Goals:
  - Continuous profiling (Pyroscope) on all services
  - First GameDay: zone failure simulation
  - Trace exemplars linked to profiling data
  - Anomaly detection on key SLIs
  - Toil quantified and top toil automated

Milestones:
  Week 2: Pyroscope deployed, profiling data flowing for 2 weeks
  Week 4: First GameDay completed, findings documented
  Week 6: Trace exemplars wired to Pyroscope profiles
  Week 8: Annual observability review — maturity score increase documented`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Trying to reach Level 4 immediately instead of building incrementally',
    wrong: `// Team decision: "We're going all-in on observability"
// Week 1: Deploy OpenTelemetry, Prometheus, Jaeger, Loki, Pyroscope, Chaos Mesh
// Week 2: Try to wire all 50 services with full OTel SDK simultaneously
// Week 4: OTel integration is half-done in 20 services
// Week 6: Chaos experiments being run with no dashboards to observe them
// Week 8: Team exhausted, observability tools running but not actually used
// No SLOs defined, no runbooks updated, alert noise worse than before`,
    right: `// Incremental by quarter:
// Q1: Infrastructure monitoring + log aggregation (Level 1) — 3 services
// Q2: RED metrics + OTel tracing on critical path (Level 2) — 5 more services
// Q3: SLOs + error budgets (Level 3) — extend to all user-facing services
// Q4: Continuous profiling + first GameDay (Level 4 foundations)
// Each quarter: deliver a working, used improvement — not infrastructure debt`,
    explanation: 'Observability tooling has no value if it is not used by engineers to answer questions. Deploying all tools simultaneously spreads effort too thin — nothing gets fully configured, dashboards are empty, alerts are noisy, and teams revert to the old "check the server" approach. Build incrementally: each level must be fully working and actively used before investing in the next. Teams at Level 2 get more value from improving their Level 2 tools than from deploying Level 4 tools without a Level 2 foundation.',
  },
  {
    title: 'Measuring observability by tools deployed, not questions answered',
    wrong: `// "We have observability" checklist:
// ✅ Prometheus deployed
// ✅ Jaeger deployed
// ✅ Loki deployed
// ✅ Grafana deployed
// All tools present — but:
// - No team knows how to use Jaeger
// - Loki has no dashboards built
// - Prometheus alerts fire on CPU but not error rates
// The question "why is checkout slow?" still takes 2 hours to answer`,
    right: `// Measure by question-answering ability:
// "Can we detect a user-facing outage in < 5 minutes?" → Level 1
// "Can we identify which service is failing in < 5 minutes?" → Level 2
// "Can we find the slow code path in a trace in < 10 minutes?" → Level 2
// "Do we have a data-driven reliability vs velocity decision process?" → Level 3
// "Do we validate resilience before incidents?" → Level 4`,
    explanation: 'The purpose of observability tooling is to enable engineers to answer questions about system behaviour quickly. "What tools are deployed" is an input metric. The output metric is "how quickly can we answer important questions?" — Can we tell in < 5 minutes if users are impacted? Can we identify the root cause in < 30 minutes? If the tools are deployed but engineers cannot answer these questions, the maturity is still Level 0 regardless of what the tooling inventory shows.',
  },
  {
    title: 'Not training the team on observability tools — infrastructure without adoption',
    wrong: `// Platform team deploys full observability stack
// Sends email: "Observability tools are available at grafana.internal"
// 3 months later: most engineers still SSH into production servers to debug
// Jaeger has 0 queries per week from application teams
// Engineers: "Tracing is confusing, I don't know what I'm looking at"
// The investment was in tools, not in engineer capability to use them`,
    right: `// Training alongside tool deployment:
// GameDay sessions: "Let's use Jaeger to debug a real trace together"
// Runbook updates: step 2 = "Open Grafana service dashboard at ..."
// New engineer onboarding: 1 hour on dashboards, tracing, and log queries
// Observability office hours: weekly 30min session where anyone can ask
// Measure adoption: weekly unique users of Grafana, Jaeger query counts`,
    explanation: 'Observability tooling adoption requires training and cultural change, not just infrastructure deployment. Engineers who have always debugged by SSH\'ing into servers will continue to do so unless they are shown a better way. Schedule team training sessions, update incident runbooks to explicitly reference dashboards and trace queries, include observability tool usage in new engineer onboarding, and measure adoption as a metric alongside tool deployment. The goal is behaviour change, not tool presence.',
  },
  {
    title: 'No observability for the observability tooling itself',
    wrong: `// Production services are well-observed
// But: Prometheus has no monitoring
// Alertmanager goes down — nobody is paged, all alerts silent
// Jaeger is out of disk — traces dropped for 2 days
// Loki is at capacity — logs being rejected for 1 week
// Teams don't know — their observability appears to be working
// (no errors visible because the tools sending errors are broken)`,
    right: `// Observe your observability stack:
// - Prometheus targets: monitor "up" metric for Prometheus itself
// - Dead man's switch: heartbeat alert to confirm Alertmanager is working
// - Jaeger disk usage: alert at 80%, auto-rotate indices
// - Loki ingestion errors: metric on rejected log lines
// - OTel collector drop rate: spans dropped due to backpressure
// Rule: the monitoring stack needs the same care as production services`,
    explanation: 'The observability stack is critical infrastructure — when it fails, you lose the ability to detect and diagnose production issues. Apply the same observability practices to your observability tools: monitor Prometheus\'s own health, set up a dead man\'s switch for Alertmanager, watch disk usage on Jaeger and Loki, and alert on OTel collector drop rates. A common blind spot: engineers assume their observability is working because "it always has been" — until an incident reveals that traces have been silently dropping for weeks.',
  },
];

const challenge: Challenge = {
  title: 'Maturity score calculator',
  language: 'typescript',
  description: `Implement getMaturityLevel(scores: number[]): { average: number; level: string }
where scores are 0-4 values for different areas.
Average them (round to 1 decimal place).
Level: 0-0.9="Level 0", 1.0-1.9="Level 1", 2.0-2.9="Level 2", 3.0-3.9="Level 3", 4.0="Level 4"`,
  hints: ['Sum and divide for average', 'Use Math.floor on the average to pick the level label'],
  starterCode: `function getMaturityLevel(scores: number[]): { average: number; level: string } {
  return { average: 0, level: 'Level 0' };
}

const LEVELS = ['Level 0', 'Level 1', 'Level 2', 'Level 3', 'Level 4'];
console.log(getMaturityLevel([1, 2, 1, 0, 1]));   // { average: 1.0, level: 'Level 1' }
console.log(getMaturityLevel([3, 3, 2, 3, 2]));   // { average: 2.6, level: 'Level 2' }
console.log(getMaturityLevel([4, 4, 4, 4, 4]));   // { average: 4.0, level: 'Level 4' }`,
  solution: `function getMaturityLevel(scores: number[]): { average: number; level: string } {
  const LEVELS = ['Level 0', 'Level 1', 'Level 2', 'Level 3', 'Level 4'];
  const avg = scores.reduce((s, n) => s + n, 0) / scores.length;
  const average = Math.round(avg * 10) / 10;
  const levelIndex = Math.min(Math.floor(average), 4);
  return { average, level: LEVELS[levelIndex] };
}

console.log(getMaturityLevel([1, 2, 1, 0, 1]));
console.log(getMaturityLevel([3, 3, 2, 3, 2]));
console.log(getMaturityLevel([4, 4, 4, 4, 4]));`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'A team has Prometheus and Grafana deployed but all their alerts are on CPU and memory thresholds. Engineers describe incident diagnosis as "check every service until we find the problem." What maturity level are they?',
    options: [
      'Level 3 — they have dashboards and alerting, which are Level 3 requirements',
      'Level 1 — they have infrastructure monitoring but no service-level visibility, cannot identify which service is causing user impact',
      'Level 2 — Prometheus and Grafana are Level 2 tools, so having them means Level 2',
      'Level 0 — they have no metrics at all',
    ],
    answer: 1,
    explanation: 'Level 1 organisations have infrastructure monitoring (CPU, memory, uptime) but no service-level observability. The diagnostic description "check every service until we find the problem" is characteristic of Level 1 — teams can see that hosts are alive, but cannot quickly identify which service is causing user impact. Level 2 requires RED metrics (Rate, Errors, Duration) per service, structured logging, and distributed tracing so that the affected service is identifiable within minutes, not after a manual multi-service investigation.',
  },
  {
    q: 'What is the primary business justification for investing in observability maturity?',
    options: [
      'Observability tools are required for SOC 2 and ISO 27001 compliance, so investment is mandatory regardless of ROI',
      'MTTR reduction: moving from Level 0 to Level 3 typically reduces incident diagnosis time from hours to minutes, saving significant engineering cost per incident',
      'Observability tools help with code reviews and PR approvals by showing which code paths are most-used in production',
      'Observability at higher maturity levels allows teams to eliminate all production incidents',
    ],
    answer: 1,
    explanation: 'The primary ROI of observability investment is MTTR (Mean Time To Resolve) reduction. At Level 0, diagnosing a production incident takes hours of SSH sessions and manual inspection. At Level 3, the same incident is identified from a trace exemplar in minutes. The business case: (hours saved per incident) × (incidents per year) × (engineer hourly cost) = annual value. For organisations with frequent incidents, this ROI calculation easily justifies significant observability investment. Higher maturity also prevents incidents, but MTTR reduction is the most directly measurable benefit.',
  },
  { q: 'What are the typical levels of an observability maturity model?', options: ['Beginner, Intermediate, Advanced, Expert — based on team experience with tools', 'Level 1 reactive (metrics and alerts for known failures), Level 2 proactive (all three pillars, SLOs), Level 3 predictive (anomaly detection, capacity forecasting), Level 4 optimized (observability as code, chaos engineering integration)', 'Bronze, Silver, Gold, Platinum — based on the number of monitored services', 'DORA metrics levels: low, medium, high, elite — applied to observability capability'], answer: 1, explanation: 'Observability maturity levels: Level 1 (Reactive): basic metrics and alerting. React to incidents. No SLOs. Limited log aggregation. No distributed tracing. Level 2 (Proactive): all three pillars (metrics, logs, traces) in place. Defined SLOs with error budgets. Dashboards per service. On-call runbooks. Incident review process. Level 3 (Predictive): anomaly detection on key metrics. Capacity planning dashboards. Proactive incident prevention. Chaos engineering to find unknown weaknesses. Business metrics correlated with technical metrics. Level 4 (Optimized): observability as code (dashboards and alerts in git). Continuous validation of SLOs. Automated remediation for known failure patterns. Observability-driven development (teams improve observability as a standard part of feature work).' },
  { q: 'What are DORA metrics and how do they relate to observability maturity?', options: ['Disk, Object storage, RAM, and Archive — the four storage tiers in a mature observability stack', 'Deployment Frequency, Lead Time for Changes, Change Failure Rate, and Time to Restore Service — metrics that measure software delivery performance, enabled by good observability', 'Data Observability, Runtime Analysis, and Alerting — three components of the DORA framework', 'DORA metrics are not related to observability; they measure financial performance of engineering teams'], answer: 1, explanation: 'DORA metrics (DevOps Research and Assessment): Deployment Frequency: how often code is deployed to production. Measured from CI/CD pipeline metrics. Lead Time for Changes: time from code commit to production. Change Failure Rate: the percentage of deployments causing production incidents. Requires incident tracking correlated with deployment data. Time to Restore Service (MTTR): how long it takes to recover from an incident. Requires incident tracking with start and end timestamps. Connection to observability: fast MTTR requires good observability (metrics, logs, traces to diagnose quickly). Low change failure rate requires: good canary deployment metrics, rollback capability, and deployment annotations in dashboards. High deployment frequency is safe only with good observability enabling fast incident detection and recovery.' },
  { q: 'What does observability as code mean and what are its benefits?', options: ['Running the observability infrastructure (Prometheus, Grafana) inside containers as infrastructure as code', 'Managing all observability configuration — dashboards, alert rules, SLOs, data source connections — as version-controlled code with peer review, enabling consistent and auditable observability', 'Writing observability instrumentation using a domain-specific language instead of general-purpose code', 'Using automated code analysis tools to identify missing instrumentation in application source code'], answer: 1, explanation: 'Observability as code (OaC): store all observability configuration in git: alert rules (Prometheus rules YAML, Terraform Grafana alert rules). Dashboards (Grafana JSON, Grafonnet). SLO definitions. Data source configurations. Benefits: peer review: changes to alerts and dashboards go through pull requests. Version history: who changed this alert and why. Rollback: revert a bad alert change. Consistency: generate dashboards for all microservices from a single template. CI/CD: deploy observability changes through the same pipeline as application changes. Disaster recovery: recreate the entire observability stack from code after a failure. Tools: Grafana Grizzly, Terraform Grafana provider, Prometheus Operator (Kubernetes CRDs for alerts and rules), Jsonnet for alert rule templating.' },
  { q: 'How do you measure the effectiveness of your observability investment?', options: ['By counting the number of dashboards and alerts created per quarter', 'By tracking MTTR, alert noise ratio, the percentage of incidents detected before users report them, and the percentage of incidents where the root cause was identified using observability data', 'By measuring the storage cost of logs, metrics, and traces in the centralized observability platform', 'By counting the number of on-call engineers and comparing it to industry benchmarks'], answer: 1, explanation: 'Observability effectiveness metrics: MTTR (Mean Time to Restore): the primary outcome metric. Good observability enables faster diagnosis and recovery. Track MTTR trends over time and after observability improvements. Alert signal-to-noise ratio: (actionable alerts) / (total alerts fired). Improving this ratio indicates better alert quality. Aim above 90%. Detection: what percentage of incidents are detected by alerting vs reported by users? Users should never be the first to report a problem. Root cause identification: what percentage of incident postmortems identify a root cause? If the team frequently cannot find the root cause, observability data is insufficient. Mean Time to Detect (MTTD): how long between the first technical symptom and alert firing? Should be under 5 minutes for critical failures. Observability coverage: what percentage of services have dashboards, SLOs, and tracing configured?' },
];

const qna: QnaItem[] = [
  {
    q: 'How do you build a business case for observability investment?',
    a: 'Build the business case around incident cost reduction: <ol><li><strong>Measure current MTTR</strong>: from alert fire to service restoration, averaged across the last 6-12 months. If not tracked, estimate from postmortem timelines. Typical Level 0-1 MTTR: 2-4 hours.</li><li><strong>Count incidents per year</strong>: how many SEV1/SEV2 incidents per year?</li><li><strong>Estimate incident cost</strong>: engineer hours × hourly cost × incident duration + revenue impact during outage.</li><li><strong>Estimate MTTR reduction</strong>: Level 2 typically achieves 50-60% MTTR reduction. Level 3: 70-80%. Industry benchmark data is available in DORA reports.</li><li><strong>Present as ROI</strong>: "We spend $X per year on incident engineer time. Level 2 observability (cost: $Y investment + $Z ongoing) will save 60% of that, breaking even in N months."</li></ol>Secondary arguments: developer productivity (faster debugging in staging reduces cycle time), reduced alert fatigue (better mental health and retention), compliance (logs and audit trails for regulatory requirements). The ROI calculation is usually sufficient — observability investment pays back faster than most engineering investments.',
  },
  {
    q: 'How do you prioritise which services to instrument first?',
    a: 'Prioritise by two dimensions: user impact and diagnostic cost: <ol><li><strong>User impact</strong>: which services, if they fail or degrade, directly impact user experience or revenue? Payment service &gt; recommendation service. Map your user request path and instrument the critical path first.</li><li><strong>Diagnostic cost</strong>: which services take longest to diagnose when they fail? Services with complex logic, many dependencies, or high incident frequency have the highest diagnostic cost — and highest ROI for instrumentation.</li><li><strong>Dependency awareness</strong>: distributed tracing requires that at least the entry point (API gateway or BFF) AND the target services both export spans. Instrument the gateway first — it enables end-to-end traces even when dependencies are only partially instrumented.</li><li><strong>Practical ordering</strong>:<ul><li>API gateway / BFF (entry point for all traces)</li><li>Top 3 revenue-impacting services (payment, auth, checkout)</li><li>Any service with &gt;2 SEV2 incidents in the last quarter</li><li>Everything else in order of call frequency</li></ul></li></ol>The goal is that 80% of production incidents can be traced end-to-end with 20% of services instrumented — because those 20% are on the critical path of most requests.',
  },
  { q: 'How do you assess your current observability maturity?', a: 'Observability maturity assessment: metrics coverage: do all production services emit health metrics? Are RED metrics available for all HTTP and gRPC services? Log coverage: are all services emitting structured logs? Are logs centrally aggregated and searchable? Tracing coverage: are all inter-service calls instrumented? Can you trace a request end-to-end? Alerting quality: what is the alert signal-to-noise ratio? Are all critical failure modes covered by alerts? SLO coverage: do all services have defined SLOs? Are error budgets tracked? Incident process: do postmortems document observability gaps? Are gaps tracked as action items? Team fluency: can engineers find relevant dashboards and traces during an incident without help? Scoring: assign 0-3 to each dimension. Sum to get a maturity score. Use the score to prioritize observability investments. Reassess quarterly to track progress.' },
  { q: 'What is the observability-driven development approach?', a: 'Observability-driven development (ODD): integrate observability into the software development lifecycle as a standard practice, not an afterthought. Practices: instrumentation before features: before shipping a new feature, define and implement its success metrics and error tracking. A feature without metrics is invisible. PRE-commit instrumentation: include observability artifacts (metrics, log events, trace spans) in the same pull request as the feature code. Reviewer checklist: does this PR include metrics for the new code path? Are errors logged appropriately? Are new trace spans created for significant operations? SLO-first design: before building a feature, define what success looks like from an SLO perspective. What is the acceptable latency and error rate? Post-deploy verification: after deploying, verify that the new dashboards and metrics look as expected. A deploy without a dashboard review is incomplete. Benefits: earlier detection of instrumentation gaps. Observability becomes a natural part of engineering culture rather than a compliance exercise.' },
  { q: 'How do you prioritize observability improvements across a large service fleet?', a: 'Prioritization framework: business impact first: which services handle the most revenue or the most users? These must have the highest observability coverage. Risk-based: which services have had the most incidents in the last 6 months? High-incident services need better observability most urgently. Complexity: distributed and asynchronous services are harder to debug — prioritize tracing investment here. Incident postmortem action items: after every major incident, observability gaps surface as action items. These are the highest-priority improvements because they reflect real gaps. Maturity gaps: run the maturity assessment above. Fill the lowest-scoring dimensions first (missing logs before missing traces). Team ownership: each team is responsible for their own service observability. Platform team provides the tools and standards. Service teams implement and maintain their observability. Cross-cutting improvements (tracing framework, log shipping) are platform team responsibilities. Track progress: quarterly observability reviews with metrics on coverage and quality for each service.' },
  { q: 'What is AIOps and how does it extend traditional observability?', a: 'AIOps (Artificial Intelligence for IT Operations): applying machine learning to observability data to automate and enhance incident detection, diagnosis, and remediation. Capabilities: anomaly detection: ML models learn the normal behavior of each metric. Alert when a metric deviates significantly without a human-defined threshold. Reduces false positives from misconfigured static thresholds. Noise reduction: group related alerts from a single root cause. Surface the probable root cause instead of hundreds of symptom alerts. Predictive capacity: forecast when resources will be exhausted based on growth trends. Alert before the problem occurs. Automated diagnosis: given an incident, suggest probable root causes by analyzing historical incident patterns and correlating current metric anomalies. Incident correlation: detect when multiple services are experiencing related failures simultaneously (blast radius detection). Tools: Datadog Watchdog, Dynatrace Davis AI, Grafana ML, Amazon DevOps Guru. Limitations: AIOps requires significant historical data to train effectively. It supplements but does not replace good fundamental observability practices.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Four maturity levels: L1 infra visibility, L2 service visibility, L3 SLO-driven, L4 proactive. Build incrementally. Measure by question-answering speed, not tools deployed.',
  mustKnow: [
    'Level 0→1: add /health, /metrics, log aggregation, uptime checks. "Is the host alive?"',
    'Level 1→2: RED metrics, structured logs, OTel tracing. "Which service is failing?"',
    'Level 2→3: SLIs, SLOs, error budgets, burn rate alerts, budget policy. "Data-driven reliability decisions."',
    'Level 3→4: continuous profiling, chaos engineering, anomaly detection, pillar correlation. "Prevention over reaction."',
    'Measure maturity by question-answering ability, not tool count. "Can we detect user impact in < 5 min?" etc.',
    'Business case: MTTR reduction × incidents/year × hourly engineer cost = ROI. Level 2 → 50-60% MTTR improvement.',
  ],
  interviewFocus: [
    'Describe the observability maturity levels and what each enables.',
    'How do you prioritise which services to instrument first?',
    'How would you build a business case for observability investment?',
  ],
};

@Component({
  selector: 'app-obs-maturity',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './observability-maturity.html',
  styleUrl: './observability-maturity.scss',
})
export class ObsObservabilityMaturity {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
