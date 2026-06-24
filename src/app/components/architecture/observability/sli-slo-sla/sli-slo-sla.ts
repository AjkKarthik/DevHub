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
  { name: 'SLI',            type: 'keyword', desc: 'Service Level Indicator — a specific metric measuring service health. e.g., % requests completing in < 200ms.' },
  { name: 'SLO',            type: 'keyword', desc: 'Service Level Objective — internal target for an SLI. e.g., "99.9% of requests < 200ms over 30 days."' },
  { name: 'SLA',            type: 'keyword', desc: 'Service Level Agreement — contractual commitment to customers. SLA ≥ SLO is a common convention (tighter SLO gives buffer).' },
  { name: 'Error Budget',   type: 'keyword', desc: '100% minus the SLO. Budget for downtime/degradation. If 99.9% SLO, you have 0.1% to spend on incidents each period.' },
  { name: 'Burn Rate',      type: 'keyword', desc: 'How fast the error budget is being consumed. Burn rate = 1 means using budget exactly as expected; > 1 means burning faster.' },
  { name: 'Error Budget Policy', type: 'keyword', desc: 'Agreed actions when budget is exhausted: stop new features, focus only on reliability work until budget recovers.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'SLI, SLO, SLA — The Reliability Hierarchy',
    points: [
      'SLI (Service Level Indicator): the specific metric that measures a service behaviour. Must be measurable in real time. Good SLIs: request success rate, request latency (p99), availability (fraction of successful health checks), data freshness.',
      'SLO (Service Level Objective): the internal target value for an SLI over a rolling time window. "99.5% of checkout requests succeed over 28 days." The SLO is a promise to yourself and your team — it drives engineering decisions.',
      'SLA (Service Level Agreement): the contractual promise to customers. Usually set more conservatively than the SLO so there is a buffer. If you miss an SLA, you owe credits or face legal consequences.',
      'Convention: SLA ≤ SLO < 100%. Example: SLI measures request success rate; SLO = 99.9%; SLA = 99.5%. You internally target 99.9% but only legally commit to 99.5%.',
    ],
  },
  {
    heading: 'Error Budgets',
    points: [
      'Error budget = 1 - SLO. With a 99.9% SLO, the error budget is 0.1% — over 30 days that is 43.2 minutes of allowed downtime/errors.',
      'Error budgets make reliability conversations data-driven. "Can we deploy this risky change?" → "We have 30 minutes of error budget remaining this month. The last risky deploy cost us 15 minutes. Deploy with caution."',
      'When the error budget is exhausted: the team stops feature work and focuses exclusively on reliability improvements until the budget recovers. This is agreed in the Error Budget Policy — not decided ad-hoc when an incident happens.',
      'Burning the error budget faster than expected (burn rate > 1) is an early warning signal that reliability has degraded, even if no alert has fired yet.',
    ],
  },
  {
    heading: 'Choosing Good SLIs',
    points: [
      'Good SLIs directly measure user experience. Bad SLIs measure system internals. CPU utilisation is a bad SLI — high CPU does not mean users are unhappy. p99 request latency is a good SLI — directly reflects user experience.',
      'The four golden signals (Google SRE Book): Latency (how long requests take), Traffic (how much demand), Errors (rate of failing requests), Saturation (resource utilisation approaching limits).',
      'Start with latency and error rate for user-facing services. Add availability for critical data paths. Add saturation (queue depth, memory utilisation) for background workers.',
      'Avoid too many SLOs — 2-4 SLIs per service is enough. More SLOs fragment focus. An alert for every metric you track is not an SLO — it is alert fatigue.',
    ],
  },
  {
    heading: 'Multi-Window, Multi-Burn-Rate Alerting',
    points: [
      'Single threshold alerts have high false-positive rates — a 5-minute spike is caught by both a 1-minute window (false positive) and a 1-hour window (real issue).',
      'Google SRE recommends multi-window alerting: alert when the burn rate is high for BOTH a short window (1h) AND a long window (6h). Reduces false positives dramatically.',
      'Page (wake someone up) on burn rate > 14× for 1h + 5m windows. Ticket (next business day) on burn rate > 1× for 6h + 30m windows.',
      'Example: 99.9% SLO over 30 days. Burn rate 14 = consuming 14× the expected rate. At that pace, the 30-day budget is exhausted in ~2 days.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'SLO Calculations',
    language: 'typescript',
    code: `// SLO, error budget, and burn rate calculations
interface SloConfig {
  target: number;       // e.g., 0.999 for 99.9%
  windowDays: number;   // rolling window
}

interface SloStatus {
  remainingBudgetMinutes: number;
  consumedPercent: number;
  burnRate: number;
  status: 'healthy' | 'at-risk' | 'exhausted';
}

function calculateSloStatus(
  config: SloConfig,
  currentSuccessRate: number  // e.g., 0.9985
): SloStatus {
  const windowMinutes = config.windowDays * 24 * 60;
  const allowedErrorRate = 1 - config.target;       // 0.001
  const actualErrorRate  = 1 - currentSuccessRate;  // 0.0015

  const totalBudgetMinutes = windowMinutes * allowedErrorRate;
  const consumedRate       = actualErrorRate / allowedErrorRate;
  const remainingBudgetMinutes = totalBudgetMinutes * (1 - Math.min(consumedRate, 1));
  const burnRate = actualErrorRate / allowedErrorRate;

  const status: SloStatus['status'] =
    consumedRate >= 1       ? 'exhausted' :
    consumedRate >= 0.8     ? 'at-risk'   : 'healthy';

  return { remainingBudgetMinutes, consumedPercent: consumedRate * 100, burnRate, status };
}

// Example: 99.9% SLO over 30 days, currently at 99.85% success
const result = calculateSloStatus(
  { target: 0.999, windowDays: 30 },
  0.9985
);
console.log(result);
// {
//   remainingBudgetMinutes: 21.6,    ← 21 mins left of 43.2 min budget
//   consumedPercent: 50,             ← burned 50% of budget
//   burnRate: 1.5,                   ← consuming 1.5× expected rate
//   status: 'healthy'
// }`,
  },
  {
    label: 'Prometheus Alerting',
    language: 'typescript',
    code: `# Prometheus SLO alerting rules — multi-window burn rate
# Target: 99.9% availability SLO over 30 days

groups:
  - name: slo-availability
    rules:
      # Recording rules: calculate error rates over multiple windows
      - record: job:http_errors:rate1h
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[1h]))
          /
          sum(rate(http_requests_total[1h]))

      - record: job:http_errors:rate6h
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[6h]))
          /
          sum(rate(http_requests_total[6h]))

      # PAGE alert: burn rate > 14x over both 1h and 5m windows
      # At 14x burn rate, 30-day budget is exhausted in ~2 days
      - alert: SLOBudgetBurnRateCritical
        expr: |
          job:http_errors:rate1h > (14 * 0.001)
          AND
          job:http_errors:rate5m > (14 * 0.001)
        for: 2m
        labels:
          severity: page
        annotations:
          summary: "Error budget burning at 14× rate — page on-call"
          description: "Current error rate {{ $value | humanizePercentage }} exceeds 14× SLO budget"

      # TICKET alert: burn rate > 3x over 6h window
      - alert: SLOBudgetBurnRateWarning
        expr: job:http_errors:rate6h > (3 * 0.001)
        for: 15m
        labels:
          severity: ticket
        annotations:
          summary: "Error budget burning at 3× rate — create reliability ticket"`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Setting SLO = 100% availability',
    wrong: `slo:
  target: 1.0  # 100% availability
  # Error budget = 0 minutes
  # Any incident immediately exhausts budget
  # Impossible to maintain and blocks all deployments`,
    right: `slo:
  target: 0.999  # 99.9% — 43 mins budget/month
  # Or 0.9995 for critical services — 21 mins/month
  # Realistic buffer for planned maintenance and minor incidents`,
    explanation: 'A 100% SLO is impossible and counterproductive. It creates an error budget of zero, meaning any incident immediately burns through the budget and blocks all new feature deployments. SLOs should be ambitious but achievable. Start at 99.9% (three nines) for user-facing services and adjust based on historical data.',
  },
  {
    title: 'Using infrastructure metrics as SLIs instead of user-facing metrics',
    wrong: `# CPU < 80%, Memory < 90%, Disk < 70%
# These do not reflect user experience
# CPU at 70% with all requests timing out → SLI shows green`,
    right: `# Request success rate: successful_requests / total_requests > 99.9%
# Request latency: p99 < 200ms for 99.5% of requests
# Directly correlated with "is the user having a good experience?"`,
    explanation: 'Infrastructure metrics (CPU, memory, disk) are useful for capacity planning but poor SLIs — they don\'t tell you if users are experiencing degraded service. A service can have low CPU while returning 500 errors. Always define SLIs from the user\'s perspective: success rate and latency.',
  },
  {
    title: 'No Error Budget Policy — no agreed actions when budget exhausts',
    wrong: `// SLO is defined but no policy exists
// Budget exhausts → argument about whether to continue releases
// Engineering manager says "ship it anyway"
// Product team overrides reliability concerns
// Trust erodes; SLO becomes decorative`,
    right: `// Error Budget Policy (agreed in advance):
// Budget > 50%: release freely, run experiments
// Budget 10-50%: review risky changes; increase testing
// Budget < 10%: freeze non-critical deployments; focus on reliability
// Budget exhausted: all features paused; reliability sprint begins
// Policy signed off by engineering leadership`,
    explanation: 'An SLO without an Error Budget Policy is toothless. The policy must be agreed before a crisis — not negotiated during one. It should specify concrete actions at different budget levels and be signed off by leadership so it cannot be overridden in the moment by product pressure.',
  },
  {
    title: 'Using a single time window for burn rate alerts',
    wrong: `# Alert on 5-minute error rate spike
- alert: ErrorRateHigh
  expr: rate(http_errors[5m]) / rate(http_requests[5m]) > 0.01
  # Fires constantly on short spikes (false positives)
  # Misses slow budget drain over hours (false negatives)`,
    right: `# Multi-window burn rate: short window (5m) catches fast burns,
# long window (1h) confirms the burn is sustained, not a spike
- alert: SLOBurnRateCritical
  expr: |
    burn_rate_1h > 14
    AND burn_rate_5m > 14`,
    explanation: 'Single-window alerts fire on transient spikes (false positives, alert fatigue) and miss sustained slow burns (false negatives, missed incidents). Multi-window burn rate alerting — requiring both a short and a long window to exceed the threshold — dramatically reduces false positives while catching real budget threats.',
  },
];

const challenge: Challenge = {
  title: 'Compute error budget status',
  language: 'typescript',
  description: `Implement errorBudgetStatus(sloTarget: number, windowDays: number, currentSuccessRate: number): string
Return one of: 'healthy', 'at-risk', 'critical', 'exhausted'
- healthy: consumed < 50% of budget
- at-risk: consumed 50-80% of budget
- critical: consumed 80-100% of budget
- exhausted: consumed > 100%

Budget consumed = (1 - currentSuccessRate) / (1 - sloTarget)`,
  hints: ['Budget consumed ratio = error rate / allowed error rate', 'Compare ratio against 0.5, 0.8, 1.0 thresholds'],
  starterCode: `function errorBudgetStatus(
  sloTarget: number,
  windowDays: number,
  currentSuccessRate: number
): string {
  return 'unknown';
}

console.log(errorBudgetStatus(0.999, 30, 0.9997)); // healthy
console.log(errorBudgetStatus(0.999, 30, 0.9985)); // at-risk
console.log(errorBudgetStatus(0.999, 30, 0.9982)); // critical
console.log(errorBudgetStatus(0.999, 30, 0.998));  // exhausted`,
  solution: `function errorBudgetStatus(
  sloTarget: number,
  _windowDays: number,
  currentSuccessRate: number
): string {
  const allowedErrorRate = 1 - sloTarget;
  const actualErrorRate  = 1 - currentSuccessRate;
  const consumed = actualErrorRate / allowedErrorRate;

  if (consumed > 1.0)  return 'exhausted';
  if (consumed >= 0.8) return 'critical';
  if (consumed >= 0.5) return 'at-risk';
  return 'healthy';
}

console.log(errorBudgetStatus(0.999, 30, 0.9997));
console.log(errorBudgetStatus(0.999, 30, 0.9985));
console.log(errorBudgetStatus(0.999, 30, 0.9982));
console.log(errorBudgetStatus(0.999, 30, 0.998));`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'An SLO is set at 99.9% availability over 30 days. The current success rate is 99.8%. What is the burn rate?',
    options: ['0.2x (consuming budget slower than expected)', '1x (consuming budget at exactly the expected rate)', '2x (consuming budget twice as fast as expected)', '10x (critical — paging situation)'],
    answer: 2,
    explanation: 'Burn rate = actual error rate ÷ allowed error rate. Allowed error rate = 1 - 0.999 = 0.001. Actual error rate = 1 - 0.998 = 0.002. Burn rate = 0.002 ÷ 0.001 = 2. At 2× burn rate, the 30-day budget would be exhausted in 15 days. Worth a ticket, not yet at the page threshold (typically 14×).',
  },
  {
    q: 'Why should an SLA be set more conservatively than the corresponding SLO?',
    options: [
      'SLAs are contractual commitments — missing them incurs financial penalties, so the SLO provides a buffer to absorb incidents before SLA breach',
      'SLAs are only measured annually while SLOs are daily — the longer period requires a lower target',
      'SLAs cover all services while SLOs cover individual endpoints — aggregate availability is always lower',
      'Regulators require SLAs to be at least 5% below SLOs for consumer-facing services',
    ],
    answer: 0,
    explanation: 'The SLO is an internal target the team aspires to meet. The SLA is a legal/commercial commitment. Setting SLA < SLO creates a buffer: the team can miss the SLO slightly without immediately breaching the SLA and triggering customer credits or legal consequences. Example: SLO = 99.9%, SLA = 99.5%. The team can have a bad month and breach the SLO without owing customers anything.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'How many SLOs should a service have?',
    a: 'Two to four SLOs per service is the right range for most teams. Typically: one latency SLO (p99 < X ms) and one availability SLO (error rate < Y%). For critical data services, add a freshness SLO (data no older than Z minutes). More than four SLOs per service fragment focus and create alert fatigue — if everything is an SLO, nothing is. The SLO should represent what would make a user notice degradation and complain, not every operational metric you track. Start with latency and error rate; add more only when evidence shows users care about something else specifically.',
  },
  {
    q: 'What happens when the error budget is exhausted?',
    a: 'The Error Budget Policy (written and agreed in advance) determines this — not ad-hoc negotiation during a crisis. Typical actions: <ul><li><strong>All non-reliability feature work pauses</strong> — product backlog stops, team switches to reliability sprint</li><li><strong>Deployment freeze</strong> on the affected service(s) until the budget recovers</li><li><strong>Postmortem required</strong> for any incident that burned significant budget</li><li><strong>Root cause analysis</strong> and reliability improvements shipped before feature work resumes</li></ul>The key is that the policy is agreed by product, engineering, and leadership <em>before</em> the first incident — so there is no argument about priorities when the budget hits zero. The data (burn rate, remaining budget) makes the decision, not whoever shouts loudest in the incident channel.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'SLI = the metric, SLO = the target, SLA = the contract. Error budget = 1 - SLO; burn rate tells you how fast you\'re spending it.',
  mustKnow: [
    'SLI: user-facing metric (success rate, p99 latency). SLO: internal target. SLA: contractual commitment (always ≤ SLO)',
    'Error budget = 1 - SLO target — the allowed downtime/error rate per window',
    'Burn rate > 1 = consuming budget faster than expected → trending toward SLO breach',
    'Multi-window burn rate alerting (1h + 5m for page, 6h + 30m for ticket) reduces false positives',
    'Error Budget Policy must be agreed in advance — defines actions when budget is at 50%, 80%, 100%',
    'Choose SLIs that directly reflect user experience — not infrastructure metrics like CPU/memory',
  ],
  interviewFocus: [
    'What is the difference between SLI, SLO, and SLA?',
    'What is an error budget and how is it used in engineering decisions?',
    'What is burn rate and why use multi-window alerting?',
  ],
};

@Component({
  selector: 'app-obs-sli-slo-sla',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './sli-slo-sla.html',
  styleUrl: './sli-slo-sla.scss',
})
export class ObsSliSloSla {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
