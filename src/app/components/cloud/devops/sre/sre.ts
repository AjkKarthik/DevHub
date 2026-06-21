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
  selector: 'app-devops-sre',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './sre.html',
  styleUrl: './sre.scss'
})
export class DevopsSre {

  quickRef: QuickRefItem[] = [
    { name: 'SLI', type: 'keyword', desc: 'Service Level Indicator — a measurable metric of service behaviour (e.g. availability, latency p99, error rate)' },
    { name: 'SLO', type: 'keyword', desc: 'Service Level Objective — the target value for an SLI (e.g. 99.9% availability over a rolling 30-day window)' },
    { name: 'SLA', type: 'keyword', desc: 'Service Level Agreement — a contractual commitment to customers; SLO is the internal target, SLA is the external promise with financial consequences' },
    { name: 'Error budget', type: 'keyword', desc: '1 − SLO expressed as allowed downtime (e.g. 99.9% SLO = 43.8 min/month budget). Guides risk tolerance for releases' },
    { name: 'Toil', type: 'keyword', desc: 'Manual, repetitive, automatable work that scales with service load and provides no enduring value. SRE golden rule: toil < 50% of work' },
    { name: 'Burn rate', type: 'keyword', desc: 'How fast the error budget is being consumed relative to its replenishment rate. Burn rate > 1 means the budget runs out before the window ends' },
    { name: 'Availability', type: 'keyword', desc: 'Time the service is operational and responding correctly. Typically: successful_requests / total_requests over a time window' },
    { name: 'Capacity planning', type: 'keyword', desc: 'Predicting future resource needs from traffic trends; ensures infrastructure keeps up with growth without over-provisioning' },
    { name: 'Blameless post-mortem', type: 'keyword', desc: 'Structured incident review focusing on systemic causes and preventive actions — not on blaming individuals' },
    { name: 'MTTR / MTTD', type: 'keyword', desc: 'Mean Time To Recover (from failure start to service restoration) / Mean Time To Detect (from failure start to alert fire)' },
    { name: 'CUJ', type: 'keyword', desc: 'Critical User Journey — the key paths a user takes through your service; SLOs should be defined per CUJ, not per infrastructure component' },
    { name: 'Reliability target', type: 'keyword', desc: 'The acceptable range of reliability — not 100% (unachievable, stifles velocity) but high enough that users do not notice failures' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'SLIs, SLOs, SLAs, and error budgets',
      points: [
        'An SLI (Service Level Indicator) is a carefully defined quantitative measure of the service — availability, request latency, error rate, throughput, or saturation.',
        'An SLO (Service Level Objective) is the target value for an SLI: "the 99th-percentile latency of successful search requests, measured over a rolling 28-day window, shall be below 200 ms."',
        'An SLA (Service Level Agreement) is a formal contract with the customer; breaching it has financial or legal consequences. The SLO is the internal target — usually tighter than the SLA to give breathing room.',
        'Error budget = 1 − SLO. A 99.9% SLO gives 0.1% error budget = 43.8 minutes of downtime per month. Error budget is the permissible amount of unreliability. Spending it on a big feature launch is a business decision, not a failure.',
        'When the error budget is exhausted: freeze new releases, focus all engineering on reliability until the budget replenishes. This aligns incentives — dev and ops share the same budget.',
      ]
    },
    {
      heading: 'Choosing the right SLIs and setting SLO targets',
      points: [
        'Define SLIs from the user perspective, not the infrastructure perspective. "Database query latency" is an implementation detail; "checkout page loads in < 2s" is user-facing.',
        'Good SLI categories: Availability (request success ratio), Latency (percentile thresholds), Quality (serving correct responses, not degraded), Freshness (data staleness for read-heavy systems).',
        'Measure SLIs at the right boundary: from the load balancer or API gateway, not inside the service. Captures real user experience including network and infrastructure failures.',
        'SLO target selection: start with current measured performance, then slightly tighten. Do not aim for 100% — it is unachievable (deployments, planned maintenance) and stifles velocity. Google suggests 3 nines (99.9%) is often the sweet spot.',
        'Percentile selection: p50 catches half the users; p99 catches the worst experience for 1% of users; p999 is for tail-latency investigation. Alert on p99 for user-facing SLOs; use p50 for capacity planning.',
      ]
    },
    {
      heading: 'Toil identification and elimination',
      points: [
        'Toil is the kind of work tied to running a production service that is manual, repetitive, automatable, tactical (reactive, not proactive), lacks enduring value, and scales linearly with service growth.',
        'The SRE principle: toil should be less than 50% of an SRE team\'s time. If it exceeds 50%, the team cannot improve reliability — it is just keeping the lights on.',
        'Identifying toil: anything done manually more than twice a week, any alert that always has the same remediation, any runbook step that is just a copy-paste command — these are toil candidates.',
        'Eliminating toil: automate the remediation (not just the detection), build self-healing systems, push alerts down to lower severity by fixing the root cause, remove alerts that do not require human action.',
        'Toil budget: track toil hours per week and trend them over time. Toil that is not declining means reliability investment is not making progress.',
      ]
    },
    {
      heading: 'Error budget burn rate and alerting',
      points: [
        'Burn rate measures how fast the error budget is consumed relative to the window. A burn rate of 1 means the budget runs out exactly at the end of the window. A burn rate of 2 means it runs out in half the window.',
        'Multi-window alerting: a 1-hour window with 14.4× burn rate detects a severe incident within minutes (fires in ~5 min) — page immediately. A 6-hour window with 6× burn rate is for slower, sustained degradation — ticket.',
        'The SRE book\'s recommended alert thresholds for a 30-day error budget: (1) page if burn rate > 14.4× in 1h AND > 14.4× in 5m; (2) ticket if > 6× in 6h AND > 6× in 30m; (3) no alert if < 1× (budget not burning).',
        'Dead man\'s switch / watchdog: an alert that fires if the alerting pipeline itself has been silent for too long. If Prometheus stops scraping or Alertmanager crashes, you need to know.',
        'Reduce alert fatigue: every page must be actionable and require human judgement. Alerts that wake someone up but resolve on their own are toil — fix the underlying issue and remove the alert.',
      ]
    },
    {
      heading: 'Reliability practices: capacity planning and post-mortems',
      points: [
        'Capacity planning: track service traffic, identify growth trends, project resource needs 6–12 months ahead. Run load tests (k6, Locust, JMeter) at 2× and 4× expected peak to discover limits before users do.',
        'Auto-scaling reduces the need for precise capacity planning but introduces its own risks: scaling lag during sudden spikes, cold-start latency, and scale-in flapping. Set appropriate cooldown periods and minimum instance counts.',
        'Blameless post-mortems: written within 48 hours of an incident. Structure: timeline of events, contributing factors (systemic, not human), lessons learned, and specific action items with owners and deadlines.',
        'The "Five Whys" technique: ask "why did this happen?" five times to dig through symptoms to root causes. Stop when you reach a process or system gap that can be permanently fixed.',
        'Reliability is a feature: treating reliability work as overhead is a cultural anti-pattern. Error budgets make reliability concrete — the team knows exactly how much unreliability is budgeted and negotiates launches against it.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'SLO Prometheus Recording Rules',
      language: 'bash',
      code: `# ── Prometheus recording rules for SLO tracking ──────────────────────────
# prometheus/rules/slo-api.yml
#
# groups:
#   - name: slo_api_availability
#     interval: 30s
#     rules:
#       # Request success ratio over the last 5 minutes (SLI)
#       - record: job:http_requests_success:rate5m
#         expr: |
#           sum(rate(http_requests_total{job="api",status!~"5.."}[5m]))
#           /
#           sum(rate(http_requests_total{job="api"}[5m]))
#
#       # Rolling 28-day availability SLI
#       - record: job:http_requests_success:rate28d
#         expr: |
#           sum(rate(http_requests_total{job="api",status!~"5.."}[28d]))
#           /
#           sum(rate(http_requests_total{job="api"}[28d]))
#
#       # Error budget remaining (SLO = 99.9%)
#       - record: job:slo_budget_remaining
#         expr: |
#           1 - (
#             (1 - job:http_requests_success:rate28d{job="api"})
#             / (1 - 0.999)
#           )
#
# ── SLO burn rate alerting (multi-window) ────────────────────────────────
# groups:
#   - name: slo_burnrate_alerts
#     rules:
#       # Page immediately: >14.4x burn over 1h and 5m
#       - alert: SLOBurnRateCritical
#         expr: |
#           (job:slo_error_rate:rate1h > (14.4 * 0.001))
#           and
#           (job:slo_error_rate:rate5m > (14.4 * 0.001))
#         for: 2m
#         labels: { severity: page }
#         annotations:
#           summary: "SLO budget burning at >14.4x rate — page P1"
#           runbook: "https://wiki.internal/runbooks/slo-burnrate"
#
#       # Ticket: >6x burn over 6h and 30m
#       - alert: SLOBurnRateHigh
#         expr: |
#           (job:slo_error_rate:rate6h > (6 * 0.001))
#           and
#           (job:slo_error_rate:rate30m > (6 * 0.001))
#         for: 15m
#         labels: { severity: ticket }
#         annotations:
#           summary: "SLO budget burning at >6x rate — create reliability ticket"`,
    },
    {
      label: 'Error Budget Calculator (TypeScript)',
      language: 'typescript',
      code: `// ── SLO error budget calculations ────────────────────────────────────────

interface SloConfig {
  name: string;
  targetPercent: number;    // e.g. 99.9
  windowDays: number;       // e.g. 30
}

interface BudgetStatus {
  sloTarget: number;
  errorBudgetMinutes: number;
  errorBudgetRequests: number;
  remainingPercent: number;
  burnRate: number;
  status: 'healthy' | 'warning' | 'critical' | 'exhausted';
}

function calculateErrorBudget(
  config: SloConfig,
  currentSuccessRate: number,   // 0–1, e.g. 0.9985
  totalRequests: number         // in the window
): BudgetStatus {
  const targetRate = config.targetPercent / 100;
  const errorBudgetFraction = 1 - targetRate;

  // Allowed downtime in minutes
  const windowMinutes = config.windowDays * 24 * 60;
  const errorBudgetMinutes = windowMinutes * errorBudgetFraction;

  // Allowed failed requests
  const errorBudgetRequests = Math.floor(totalRequests * errorBudgetFraction);

  // How much of the budget has been spent
  const actualErrorRate = 1 - currentSuccessRate;
  const remainingPercent = Math.max(
    0,
    (errorBudgetFraction - actualErrorRate) / errorBudgetFraction * 100
  );

  // Burn rate: actual error rate / allowed error rate
  const burnRate = actualErrorRate / errorBudgetFraction;

  const status: BudgetStatus['status'] =
    remainingPercent <= 0    ? 'exhausted' :
    burnRate >= 14.4         ? 'critical'  :
    burnRate >= 6            ? 'warning'   :
                               'healthy';

  return {
    sloTarget: config.targetPercent,
    errorBudgetMinutes: Math.round(errorBudgetMinutes),
    errorBudgetRequests,
    remainingPercent: Math.round(remainingPercent * 10) / 10,
    burnRate: Math.round(burnRate * 100) / 100,
    status,
  };
}

// ── Usage ─────────────────────────────────────────────────────────────────
const checkoutSlo: SloConfig = {
  name: 'checkout-availability',
  targetPercent: 99.9,
  windowDays: 30,
};

const budget = calculateErrorBudget(
  checkoutSlo,
  0.9982,         // 99.82% success rate measured in the window
  10_000_000      // 10M total requests this month
);

console.log(\`Budget remaining: \${budget.remainingPercent}%\`);
console.log(\`Burn rate: \${budget.burnRate}x\`);
console.log(\`Status: \${budget.status}\`);
// Budget remaining: 18%
// Burn rate: 8.2x
// Status: warning — open a reliability ticket`,
    },
    {
      label: 'Toil Tracker & Post-Mortem Template',
      language: 'bash',
      code: `# ── Toil classification checklist ────────────────────────────────────────
# Is this work TOIL? Score 1 point for each:
#   [ ] Manual — requires human to execute
#   [ ] Repetitive — same thing done more than twice a week
#   [ ] Automatable — could be done by a script or system
#   [ ] Reactive — triggered by external event, not planned
#   [ ] No enduring value — doing it doesn't make the service better
#   [ ] Scales with load — more traffic = more of this work
#
# Score 4+/6 = toil. Prioritise for automation.
# Example toil: manually restarting pods when memory OOMs
# Fix: configure container resource limits + liveness probe auto-restart

# ── Toil elimination process ──────────────────────────────────────────────
# 1. Identify: log every on-call action; tag manual remediation steps
# 2. Quantify: how many minutes/week? Is it trending up with service load?
# 3. Automate: write a runbook first, then automate the runbook
# 4. Eliminate the alert: if auto-remediation is reliable, remove the alert
# 5. Track: measure toil hours monthly; toil should trend down

# ── Blameless post-mortem template (Markdown) ─────────────────────────────
# # Post-Mortem: [Short incident title]
# **Date:** 2024-06-21 | **Severity:** P1 | **Duration:** 47 min
# **Author:** [Name] | **Reviewers:** [Team]
#
# ## Impact
# - 12% of checkout requests failed for 47 minutes
# - Estimated 8,400 affected users
# - Revenue impact: ~£14,000 based on average order value
#
# ## Timeline (all times UTC)
# - 14:32 Deployment of v2.5.0 completed
# - 14:38 Error rate alert fires (SLO burn rate >14.4x)
# - 14:41 On-call engineer acknowledged
# - 14:49 Root cause identified: connection pool exhausted after new feature
# - 15:03 Rolled back to v2.4.1 via helm rollback
# - 15:19 Error rate returned to baseline
#
# ## Root Cause
# The new async payment webhook handler opened a database connection per
# request without returning connections to the pool. Under load, the pool
# of 10 connections was exhausted within minutes of deploy.
#
# ## Contributing Factors
# - No load test covering the webhook endpoint before release
# - Connection pool exhaustion not included in pre-deploy checklist
# - Alert threshold set too high — fired 6 minutes after error rate spike
#
# ## Action Items
# | Action | Owner | Due |
# |--------|-------|-----|
# | Add connection pool exhaustion to pre-deploy checklist | Alice | 2024-06-28 |
# | Load test webhook endpoint at 10x expected volume | Bob | 2024-07-05 |
# | Add DB connection pool saturation to SLO dashboard | Alice | 2024-06-28 |
# | Reduce SLO alert threshold to fire within 2 min | Carol | 2024-06-24 |
#
# ## Lessons Learned
# - Integration tests did not cover the connection pool under load
# - Rollback took 14 min — target is < 5 min; invest in faster rollback automation`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Setting SLO targets before measuring current performance',
      wrong: `// Arbitrarily pick 99.99% because it "sounds good"
slo.target = 99.99;
// Actual measured availability: 99.7%
// Team immediately breaches SLO — credibility destroyed`,
      right: `// Measure first: 28-day rolling availability = 99.82%
// Set SLO slightly below current performance: 99.8%
// Then improve incrementally toward 99.9%`,
      explanation: 'SLOs without data are guesses. Measure your current SLI for a full window first, then set the target slightly below what you are already achieving. Tighten it as reliability improves.'
    },
    {
      title: 'Defining SLIs on infrastructure metrics instead of user experience',
      wrong: `// SLI: "CPU utilisation < 70%"
// SLI: "Database query time < 50ms"
// — These are implementation details, not user experience`,
      right: `// SLI: "99% of checkout page requests complete in < 2s"
// SLI: "Search returns correct results for > 99.9% of queries"
// — Measure what the user experiences, not what the server feels`,
      explanation: 'Infrastructure metrics (CPU, DB latency) do not directly correlate with whether users are having a good experience. Define SLIs that measure user-observable behaviour at the service boundary.'
    },
    {
      title: 'Treating every alert as urgent — alert fatigue',
      wrong: `# Every anomaly pages the on-call engineer
# Result: 40+ pages per week, most auto-resolve
# On-call ignores pages → real incident missed`,
      right: `# Pages require human judgement AND immediate action
# Tickets: high-priority but can wait until business hours
# Logs: interesting but no action needed
# Prune: remove any alert that auto-resolves consistently`,
      explanation: 'Alert fatigue kills reliability. If an alert fires and the engineer ignores it because "it always resolves itself," that alert is toil. Automate the remediation or remove the alert; the signal is not worth the noise.'
    },
    {
      title: 'Aiming for 100% availability',
      wrong: `// "We cannot afford any downtime — SLO must be 100%"
// Result: engineers never deploy new features
// Result: no error budget to spend on innovation
// Result: every deployment is a crisis`,
      right: `// 99.9% SLO = 43.8 min/month error budget
// Spend the budget on risky-but-valuable feature launches
// Freeze launches only when budget is exhausted`,
      explanation: '100% availability is unachievable (planned maintenance alone violates it) and actively harmful — it paralyses teams. Error budgets make reliability a negotiable resource, not an absolute requirement.'
    },
    {
      title: 'Post-mortems that blame individuals',
      wrong: `# Post-mortem conclusion:
# "Alice pushed the bad config without reviewing it.
#  She should be more careful in future."
# Action item: "Alice to attend code review training"`,
      right: `# Post-mortem conclusion:
# "A misconfigured connection pool was merged without
#  a load test. The review checklist did not include
#  connection pool settings."
# Action: Add pool config to automated pre-deploy validation`,
      explanation: 'Blameless means: the system allowed this to happen — fix the system. If Alice could cause the outage, so can any engineer in the same situation. Fix the process, not the person; you keep Alice and prevent the next incident.'
    },
    {
      title: 'Confusing SLO with SLA',
      wrong: `// "Our SLA is 99.9% — that is our SLO"
// SLA breach = customer compensation
// Operating at SLA target leaves zero buffer
// One bad hour exceeds both SLO and SLA simultaneously`,
      right: `// SLA (external, contractual): 99.5% availability
// SLO (internal target):          99.9% availability
// Error budget = 0.1% = 43 min/month
// SLA breach is extremely rare because SLO is much tighter`,
      explanation: 'Set your internal SLO tighter than your SLA. The gap between them is your buffer — the SLO fires alerts and freezes releases long before you breach the SLA and owe customers compensation.'
    },
  ];

  challenge: Challenge = {
    title: 'SLO Budget Status Classifier',
    language: 'typescript',
    description: `Write a function \`classifyBudgetStatus(config: SloInput, window: WindowData): BudgetResult\` that:

Given:
- \`config\`: \`{ sloPercent: number, windowDays: number }\` (e.g. \`{ sloPercent: 99.9, windowDays: 30 }\`)
- \`window\`: \`{ totalRequests: number, failedRequests: number, elapsedDays: number }\`

Returns \`BudgetResult\`:
- \`errorBudgetMinutes\`: total allowed downtime-minutes in the full window
- \`budgetUsedPercent\`: percentage of the error budget consumed so far (capped at 100)
- \`projectedBurnRate\`: extrapolated burn rate for the full window based on elapsed portion
- \`recommendation\`: one of \`'deploy' | 'caution' | 'freeze'\`
  - \`'deploy'\`: budget used < 50% AND projected burn rate < 2×
  - \`'freeze'\`: budget used >= 100% OR projected burn rate >= 14.4×
  - \`'caution'\`: everything else`,
    hints: [
      'Error budget fraction = 1 - (sloPercent / 100)',
      'Error budget minutes = windowDays * 24 * 60 * errorBudgetFraction',
      'Actual error rate = failedRequests / totalRequests',
      'Projected burn rate = (actualErrorRate / errorBudgetFraction) * (windowDays / elapsedDays)',
    ],
    starterCode: `interface SloInput { sloPercent: number; windowDays: number; }
interface WindowData { totalRequests: number; failedRequests: number; elapsedDays: number; }
interface BudgetResult {
  errorBudgetMinutes: number;
  budgetUsedPercent: number;
  projectedBurnRate: number;
  recommendation: 'deploy' | 'caution' | 'freeze';
}

function classifyBudgetStatus(config: SloInput, window: WindowData): BudgetResult {
  // TODO: implement
  return { errorBudgetMinutes: 0, budgetUsedPercent: 0, projectedBurnRate: 0, recommendation: 'caution' };
}

// Test:
console.log(classifyBudgetStatus(
  { sloPercent: 99.9, windowDays: 30 },
  { totalRequests: 1_000_000, failedRequests: 200, elapsedDays: 15 }
));
// budgetUsedPercent: ~13.3, projectedBurnRate: ~0.27, recommendation: 'deploy'

console.log(classifyBudgetStatus(
  { sloPercent: 99.9, windowDays: 30 },
  { totalRequests: 500_000, failedRequests: 1500, elapsedDays: 5 }
));
// budgetUsedPercent: ~100, projectedBurnRate: ~9, recommendation: 'freeze'`,
    solution: `interface SloInput { sloPercent: number; windowDays: number; }
interface WindowData { totalRequests: number; failedRequests: number; elapsedDays: number; }
interface BudgetResult {
  errorBudgetMinutes: number;
  budgetUsedPercent: number;
  projectedBurnRate: number;
  recommendation: 'deploy' | 'caution' | 'freeze';
}

function classifyBudgetStatus(config: SloInput, window: WindowData): BudgetResult {
  const errorBudgetFraction = 1 - config.sloPercent / 100;
  const windowMinutes = config.windowDays * 24 * 60;
  const errorBudgetMinutes = Math.round(windowMinutes * errorBudgetFraction);

  const actualErrorRate = window.failedRequests / window.totalRequests;

  // How much of the budget has been consumed so far
  const budgetUsedPercent = Math.min(
    100,
    Math.round((actualErrorRate / errorBudgetFraction) * 1000) / 10
  );

  // Extrapolate to the full window based on elapsed portion
  const elapsedFraction = window.elapsedDays / config.windowDays;
  const projectedBurnRate =
    Math.round((actualErrorRate / errorBudgetFraction / elapsedFraction) * 100) / 100;

  const recommendation: BudgetResult['recommendation'] =
    (budgetUsedPercent >= 100 || projectedBurnRate >= 14.4)
      ? 'freeze'
      : (budgetUsedPercent < 50 && projectedBurnRate < 2)
        ? 'deploy'
        : 'caution';

  return { errorBudgetMinutes, budgetUsedPercent, projectedBurnRate, recommendation };
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Your service has a 99.9% SLO over a 30-day window. How many minutes of downtime are allowed per month?',
      options: ['4.38 minutes', '43.8 minutes', '438 minutes', '0 — 99.9% means no downtime'],
      answer: 1,
      explanation: '30 days × 24 hours × 60 minutes = 43,200 minutes. 0.1% of that = 43.2 minutes. The error budget is 43.8 minutes (slight variation depending on month length).'
    },
    {
      q: 'What does a burn rate of 14.4× mean for a 30-day SLO window?',
      options: [
        'The error rate is 14.4 times the SLO target',
        'The error budget will be exhausted in about 50 hours (2 days) if it continues',
        'The service has 14.4× more capacity than it needs',
        'The p99 latency is 14.4 times the SLO threshold',
      ],
      answer: 1,
      explanation: 'Burn rate 14.4× means the budget is consumed 14.4 times faster than it replenishes. 30 days / 14.4 = ~2.1 days. At this rate, the month\'s error budget is gone in ~50 hours. The SRE book recommends paging immediately at this level.'
    },
    {
      q: 'Which of these is toil?',
      options: [
        'Writing a load test for a new microservice',
        'Manually restarting a pod every morning because it leaks memory overnight',
        'Designing the auto-scaling policy for a new cluster',
        'Running a blameless post-mortem after an incident',
      ],
      answer: 1,
      explanation: 'Toil is work that is manual, repetitive, automatable, and scales with service load. "Restart pod every morning" checks all boxes. The fix is to configure a liveness probe or fix the memory leak — then the alert and manual action disappear.'
    },
    {
      q: 'Your team\'s error budget is exhausted for the month. What is the SRE-recommended response?',
      options: [
        'Page the on-call engineer immediately and declare an incident',
        'Freeze new feature releases and focus all engineering on reliability improvements',
        'Raise the SLO target to create more budget',
        'Negotiate a lower SLA with customers to reduce pressure',
      ],
      answer: 1,
      explanation: 'When the error budget is exhausted, the correct response is to freeze new releases (which risk spending more budget) and invest all engineering capacity in reliability improvements until the budget replenishes. This is the mechanism that aligns dev and SRE incentives.'
    },
    {
      q: 'What is the key difference between an SLO and an SLA?',
      options: [
        'SLO is measured in minutes; SLA is measured as a percentage',
        'SLO is an internal reliability target; SLA is a contractual promise with financial consequences for breach',
        'SLO is for APIs; SLA is for infrastructure components',
        'SLO and SLA are interchangeable terms for the same concept',
      ],
      answer: 1,
      explanation: 'SLO is the internal target the engineering team operates to. SLA is the external contract with customers — breaching it may trigger credits or penalties. The SLO is set tighter than the SLA so that engineering detects and fixes problems before they ever reach the SLA threshold.'
    },
    {
      q: 'Which of the following is NOT toil by the SRE definition?',
      options: [
        'Manually restarting a service every Tuesday after a weekly database job',
        'Responding to the same noisy alert that auto-resolves after 10 minutes',
        'Automating the provisioning of new developer environments',
        'Manually scaling up replicas every Friday before weekend traffic',
      ],
      answer: 2,
      explanation: 'Automating developer environment provisioning provides enduring value — it does not scale with service load and eliminates future manual work. It is the opposite of toil: it is reliability engineering. The other three are repetitive, manual, and automatable.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do you set an SLO for a brand-new service with no historical data?',
      a: 'Start with an SLO that matches the infrastructure SLA: if you are running on a cloud provider with a 99.9% uptime SLA for VMs and databases, 99.5% for your service is reasonable for a starting point. Run the service for one full window (28–30 days), measure the actual SLI, then set the SLO slightly below what you achieved. Tighten it each quarter as reliability improves.'
    },
    {
      q: 'How many nines should we target? Is 99.999% achievable?',
      a: 'Five nines (99.999%) = 5.26 minutes of downtime per year. Achieving this requires zero-downtime deployments, multi-region active/active setups, and deeply ingrained reliability culture. For most SaaS products, 99.9%–99.95% is a reasonable target. Chasing five nines costs orders of magnitude more than three nines and often requires sacrificing velocity. Choose the minimum reliability level at which users are not noticeably impacted by failures — usually around 99.9% for consumer apps, potentially higher for financial or healthcare systems.'
    },
    {
      q: 'What is the difference between MTTD and MTTR, and which is more important to reduce?',
      a: 'MTTD (Mean Time To Detect) is the time from when an incident starts to when the on-call engineer knows about it. MTTR (Mean Time To Recover) is the time from incident start to full service restoration. Both matter, but MTTR is more important to optimise — a fast detection is worthless without a fast resolution. Reduce MTTD with better alerting; reduce MTTR by investing in runbooks, clear rollback procedures, better observability tools, and game days (chaos engineering exercises).'
    },
    {
      q: 'Should SREs be embedded in product teams or centralised in a platform team?',
      a: 'Both models work and the industry has examples of each. Embedded SREs become deep domain experts and reduce handover friction; they risk becoming a crutch that product teams rely on instead of owning their own reliability. Centralised SREs build consistent tooling and standards across teams; they risk being too far from the code to drive meaningful change. Many organisations use a hybrid: a central SRE platform team provides tools and standards, and an SRE "consulting" rotation embeds temporarily in product teams to raise their reliability practices.'
    },
    {
      q: 'How do you handle a service where achieving the SLO requires more infrastructure cost than the business can justify?',
      a: 'This is a business decision, not a technical one. Present the options clearly: (a) fund the infrastructure to hit the SLO; (b) lower the SLO to match what the current infrastructure can sustain; (c) accept a higher-than-normal error rate and inform customers via the SLA. The SRE role is to make the trade-offs visible and quantified, not to silently over-engineer reliability that the business did not budget for.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'SRE operationalises reliability through measurable SLIs, targeted SLOs, error budgets that fund risk, toil elimination, burn-rate alerting, and blameless post-mortems.',
    mustKnow: [
      'SLI = measurable metric; SLO = target for the SLI; SLA = external contract (tighter than SLA internally)',
      'Error budget = 1 − SLO; spending it is a legitimate business trade-off, not a failure',
      '99.9% SLO = 43.8 minutes allowed downtime per 30-day window',
      'Burn rate > 1 = budget exhausts before window ends; > 14.4× → page immediately',
      'Toil < 50% of SRE time; identify, automate, and eliminate it systematically',
      'Blameless post-mortems: timeline + contributing factors + action items with owners and dates',
      'Set SLO tighter than SLA — the gap is your reliability buffer before financial consequences',
    ],
    interviewFocus: [
      'Explain SLI, SLO, SLA, and error budget using a concrete example (e.g. a checkout service)',
      'What does a burn rate of 14.4× mean, and why is that the paging threshold?',
      'What is toil and how do you eliminate it? Give a real example of toil and its fix',
      'How would you run a blameless post-mortem — what sections does it have?',
      'Your error budget is exhausted three weeks into the month. What do you do?',
    ],
  };
}
