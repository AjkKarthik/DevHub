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
  { name: 'Error budget',     type: 'keyword', desc: 'Allowable downtime under your SLO. A 99.9% SLO has 8.77 hours/year of budget. When the budget is spent, reliability work takes priority.' },
  { name: 'Budget burn rate', type: 'keyword', desc: 'How fast you are consuming the error budget relative to sustainable rate (1×). 14× burn rate = budget exhausted in 2.5 days.' },
  { name: 'Budget policy',    type: 'keyword', desc: 'Agreement between dev and SRE: when budget is at 0%, feature releases pause until reliability work replenishes it.' },
  { name: 'Toil',             type: 'keyword', desc: 'Manual, repetitive, automatable work that scales with service growth. Not creative engineering. SRE rule: keep toil < 50% of each engineer\'s time.' },
  { name: 'Toil elimination', type: 'keyword', desc: 'Automating or eliminating toil creates engineering capacity. Projects: automated deploys, self-healing restarts, certificate rotation automation.' },
  { name: 'Reliability roadmap', type: 'keyword', desc: 'Error budget policy creates an objective, shared priority list: whatever is burning the budget fastest gets fixed next.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Error Budget Mechanics',
    points: [
      'If your SLO is 99.9% availability, you have 0.1% of time available for failures — about 43.8 minutes per month or 8.77 hours per year. That 0.1% is your error budget.',
      'The error budget is shared between: planned maintenance, risky feature deployments, infrastructure experiments (chaos engineering), and unplanned incidents. Spending it on incidents leaves less for innovation.',
      'Track burn rate, not just remaining budget. A 14× burn rate means you are consuming 14 times more budget than your SLO allows. At 14×, the monthly budget exhausts in 2.5 days.',
      'Multi-window burn rate: combine a short window (1h, for fast detection) and a long window (6h, for significance) to avoid alerting on brief spikes. Both windows must exceed the threshold before firing.',
    ],
  },
  {
    heading: 'The Error Budget Policy',
    points: [
      'An error budget policy is the formal agreement between product/dev and SRE about what happens at each budget level. Without it, budget tracking is just a metric — not a decision mechanism.',
      'Typical policy: > 50% budget remaining → normal feature velocity, risky experiments allowed. 25-50% remaining → only low-risk deploys, consult SRE. < 25% → freeze all non-critical deploys, focus on reliability. 0% → complete feature freeze, incident review required before resuming.',
      'The policy gives product and engineering a shared language for reliability vs. velocity trade-offs. Product managers can see the budget burning and understand why reliability work is being prioritised.',
      'Budget allocation: decide in advance what % of budget can be spent on planned maintenance vs. experiments vs. feature deployments. Unexpected incidents should not consume the entire budget, leaving nothing for innovation.',
    ],
  },
  {
    heading: 'Understanding Toil',
    points: [
      'Toil is operational work that is: manual (no automation), repetitive (same steps every time), automatable (could in principle be replaced by code), O(n) with service growth (more services = more toil), and lacks enduring value (doing it doesn\'t improve the system).',
      'Examples: manually restarting pods for known OOM issues, manually rotating TLS certificates every 90 days, manually approving deployments that always pass, manually cleaning up completed batch jobs, manually checking dashboard health each morning.',
      'Toil is not inherently bad — some is unavoidable. The goal is to keep it below 50% of engineering time. When toil exceeds 50%, engineers lose time to improve the system — and the toil tends to grow faster than the team, leading to burnout.',
      'Overhead vs. toil: overhead (meetings, code reviews, on-call prep) is not toil — it has strategic value and does not scale directly with service load. Toil is strictly the repetitive, automatable, growth-scaling operational work.',
    ],
  },
  {
    heading: 'Eliminating Toil Through Automation',
    points: [
      'Toil elimination is not "automate everything" — it is targeted automation of the highest-volume toil. Rank toil by: frequency × time-per-instance to find the highest-ROI automation targets.',
      'Common toil automation projects: auto-restarting pods on OOM with alerting for the root cause, automated certificate rotation (Let\'s Encrypt + cert-manager), automated database cleanup jobs, progressive deployment pipelines that remove manual approval gates.',
      'Measure the impact: track toil hours per sprint before and after automation. A well-executed automation project can recover 2-4 hours per engineer per week — compounding over a year, that\'s 100+ engineering hours per person.',
      'Anti-toil principle: when designing a new service or feature, ask "what operational work will this create?" Design to minimise operational toil up front — good design is cheaper than post-hoc automation.',
    ],
  },
  {
    heading: 'Using Error Budgets to Balance Reliability and Velocity',
    points: [
      'An error budget is the inverse of an SLO — a 99.9% availability target implies a 0.1% error budget, representing the amount of unreliability the team is explicitly allowed to spend on releases, experiments, and planned maintenance without violating the reliability commitment.',
      'When the error budget is not exhausted, teams have license to ship features and take calculated risks; when it is exhausted (too much downtime or errors already occurred in the period), the team shifts focus to reliability work and slows the pace of risky changes until the budget recovers.',
      'This mechanism removes the perpetual, unproductive tension between "ship fast" and "be reliable" by making reliability a quantified, negotiated budget rather than an open-ended, undefined expectation — both product and engineering can agree on the same objective number.',
      'Toil (manual, repetitive, automatable operational work) directly competes with the time available for both feature work and genuine reliability improvements — tracking toil explicitly and setting a cap on how much of the team\'s time it should consume creates pressure to invest in automation that reduces it over time.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Error Budget Tracking',
    language: 'bash',
    code: `# PromQL queries for error budget tracking

# ── REMAINING ERROR BUDGET (%) for a 99.9% SLO ──────────────────
# SLO = 0.999 → error rate target = 0.001 (0.1%)

# Error rate over the SLO window (30 days)
error_rate_30d = (
  1 - (
    sum(rate(http_requests_total{code!~"5.."}[30d])) /
    sum(rate(http_requests_total[30d]))
  )
)

# Error budget consumed (0 = none consumed, 1 = fully consumed)
budget_consumed = error_rate_30d / 0.001

# Remaining budget percentage
budget_remaining_pct = (1 - budget_consumed) * 100

# ── BURN RATE CALCULATION ────────────────────────────────────────
# Current burn rate = current error rate / error rate target
burn_rate_1h = (
  sum(rate(http_requests_total{code=~"5.."}[1h])) /
  sum(rate(http_requests_total[1h]))
) / 0.001

# Alert: critical burn (page)
# Fire when both short AND long window show > 14x burn rate
ALERT: ErrorBudgetBurningCritical
  EXPR:
    (
      sum(rate(http_requests_total{code=~"5.."}[1h])) /
      sum(rate(http_requests_total[1h]))
    ) / 0.001 > 14
    AND
    (
      sum(rate(http_requests_total{code=~"5.."}[6h])) /
      sum(rate(http_requests_total[6h]))
    ) / 0.001 > 14
  FOR: 2m
  LABELS: severity: critical

# ── BUDGET EXHAUSTION TIME ───────────────────────────────────────
# At current burn rate, when will the budget be exhausted?
# time_remaining_hours = budget_remaining / (burn_rate * error_budget_per_hour)
# error_budget_per_day = 0.001 * 24 hours = 86.4 seconds of downtime allowed per day
# At 14x burn rate: budget exhausted in 30d / 14 = 2.14 days`,
  },
  {
    label: 'Toil Tracking',
    language: 'typescript',
    code: `// Toil inventory — track in a spreadsheet or JIRA custom field
// Template for quarterly toil review

interface ToilItem {
  name: string;
  description: string;
  frequencyPerMonth: number;
  minutesPerInstance: number;
  automatable: boolean;
  automationEffortDays: number;
}

const toilInventory: ToilItem[] = [
  {
    name: 'Manual TLS certificate renewal',
    description: 'Renew 12 certs across 4 services every 90 days',
    frequencyPerMonth: 0.33,   // every 3 months
    minutesPerInstance: 120,   // 2 hours per renewal cycle
    automatable: true,
    automationEffortDays: 3,   // cert-manager + Let's Encrypt setup
  },
  {
    name: 'OOM pod restart',
    description: 'Worker pod hits memory limit, manual kubectl rollout restart',
    frequencyPerMonth: 12,     // ~3/week
    minutesPerInstance: 15,
    automatable: true,
    automationEffortDays: 5,   // memory limit tuning + auto-restart with alert
  },
  {
    name: 'Deployment approval gate',
    description: 'Approve staging→prod deploys after CI passes — always approved',
    frequencyPerMonth: 80,     // 4/day, 20 working days
    minutesPerInstance: 5,
    automatable: true,
    automationEffortDays: 8,   // progressive delivery with automatic promotion
  },
];

function computeToilRoi(item: ToilItem): { monthlyHours: number; paybackMonths: number } {
  const monthlyHours = (item.frequencyPerMonth * item.minutesPerInstance) / 60;
  const paybackMonths = item.automatable
    ? item.automationEffortDays / (monthlyHours / 8)  // days of effort / days saved per month
    : Infinity;
  return { monthlyHours: Math.round(monthlyHours * 10) / 10, paybackMonths: Math.round(paybackMonths * 10) / 10 };
}

toilInventory.forEach(item => {
  const roi = computeToilRoi(item);
  console.log(\`\${item.name}: \${roi.monthlyHours}h/month, payback \${roi.paybackMonths} months\`);
});
// OOM restart: 3h/month, payback 13.3 months
// Deployment gate: 6.7h/month, payback 9.6 months  ← automate first!
// TLS renewal: 0.7h/month, payback 36.4 months`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Using an error budget without a policy — just a metric, not a decision',
    wrong: `// Error budget dashboard is set up
// Budget shows 15% remaining this month
// But: no policy exists for what happens at 15%
// Result: dev team ships 3 new features and 2 risky DB migrations
// Budget hits 0%
// Still no agreed action — debate about what "0% budget" means
// The error budget is decorative, not operational`,
    right: `// Error budget policy (document, signed by VP Eng and VP Product):
// > 50% remaining: normal velocity, experiments allowed
// 25-50% remaining: no risky deploys, SRE review required
// < 25% remaining: reliability sprint — no features
// 0% remaining: complete feature freeze + incident board meeting
// Policy enforced via deploy gate: check budget before promotion`,
    explanation: 'An error budget without a policy is just a metric. The value of error budgets is that they create an objective, pre-agreed mechanism for prioritising reliability over velocity when needed. Without a policy, the same debate happens every time: "Should we ship this?" With a policy, the answer is automatic — look at the budget number, apply the rule. Write the policy, get sign-off from both engineering and product leadership, then automate enforcement.',
  },
  {
    title: 'Counting all manual work as toil — conflating toil with overhead',
    wrong: `// Team labels everything manual as "toil"
// Code reviews: "toil" (repetitive, manual)
// On-call handoff docs: "toil" (manual, every 2 weeks)
// Architecture review for new service: "toil" (manual, takes time)
// Team spends 30% of sprint trying to "eliminate toil"
// But these activities have lasting strategic value
// Automating them would remove important human judgement checkpoints`,
    right: `// Toil is specifically: manual, repetitive, automatable, O(n) with load, no enduring value
// Code reviews: overhead — has enduring value (knowledge sharing, quality gate) → NOT toil
// On-call handoff: overhead — strategic, but not O(n) with traffic → NOT toil
// Pod restart for known OOM: TOIL — same steps every time, automatable, scales with pod count`,
    explanation: 'Toil has a precise definition in SRE: it must be all of manual, repetitive, automatable, and lacking enduring value. Overhead (meetings, code reviews, planning) is not toil — it has strategic value and human judgement is the point. Mislabelling overhead as toil wastes engineering capacity on automating things that shouldn\'t be automated. Identify genuine toil using the full definition before committing to automation.',
  },
  {
    title: 'Alerting on error budget remaining percentage instead of burn rate',
    wrong: `# Alert fires when budget drops below 20% remaining
- alert: ErrorBudgetLow
  expr: budget_remaining_pct < 20
  # Problem: at a 3x burn rate, you have 10 days before exhaustion
  # At a 14x burn rate, you have 2 days — but the alert fires the same way
  # No urgency signal — on-call doesn't know if they have 10 days or 2 hours`,
    right: `# Alert on BURN RATE — tells you how urgently to act
- alert: ErrorBudgetBurningFast
  expr: burn_rate_6h > 6     # warning: 6x = budget exhausted in 5 days
  severity: warning
- alert: ErrorBudgetBurningCritical
  expr: burn_rate_1h > 14 AND burn_rate_6h > 14  # page: budget exhausted in 2.5 days
  severity: critical
# Burn rate alert = immediate urgency signal. Remaining% alert = daily dashboard check`,
    explanation: 'Budget remaining tells you how much you have left, but not how urgent the situation is. A 10% remaining budget at 0.5× burn rate means you have plenty of time. A 10% remaining budget at 20× burn rate means the budget is gone in hours. Alert on burn rate for operational urgency, and display remaining budget on dashboards for trend awareness. Multi-window burn rate (short + long window both exceeding threshold) reduces false positives from brief spikes.',
  },
  {
    title: 'Eliminating toil without tracking time savings',
    wrong: `// Team spends 2 sprints automating the certificate renewal process
// Before automation: 2 hours/month
// After: 0 hours/month
// Saved: 2 hours/month = 24 hours/year
// Automation cost: 2 engineers × 2 sprints = 160 hours
// Payback: 6.7 years — the engineers who built it will likely not be here
// But nobody did this calculation before starting`,
    right: `// Calculate ROI before committing to automation
// Monthly toil: 2h. Automation effort: 160h
// Payback: 160h / 2h/month = 80 months = 6.7 years
// Decision: NOT worth automating now
// Better target: deployment approval gate
// Monthly toil: 6.7h. Effort: 40h. Payback: 6 months → automate!`,
    explanation: 'Not all toil is worth eliminating. Automation has an up-front cost that must be recovered through time savings. Before starting an automation project, compute: (monthly hours saved) × (months until recoup) vs. engineering cost. If payback > 24 months, the toil is probably tolerable — or the automation approach is too expensive. Rank toil items by ROI (payback period) and automate the highest-ROI items first.',
  },
];

const challenge: Challenge = {
  title: 'Compute error budget burn rate',
  language: 'typescript',
  description: `Implement computeBurnRate(errorRate: number, sloTarget: number): number
where errorRate is the actual error fraction (e.g. 0.05 = 5% errors)
and sloTarget is the SLO availability target (e.g. 0.999 for 99.9%)
burnRate = actualErrorRate / allowedErrorRate
allowedErrorRate = 1 - sloTarget
Return the burn rate rounded to 2 decimal places.`,
  hints: ['allowedErrorRate = 1 - sloTarget', 'burnRate = errorRate / allowedErrorRate'],
  starterCode: `function computeBurnRate(errorRate: number, sloTarget: number): number {
  return 0;
}

console.log(computeBurnRate(0.001, 0.999));  // 1.0  (burning at exactly target rate)
console.log(computeBurnRate(0.014, 0.999));  // 14.0 (critical: 14x burn rate)
console.log(computeBurnRate(0.0005, 0.999)); // 0.5  (burning at half the target rate)
console.log(computeBurnRate(0.03, 0.99));    // 3.0  (3x burn rate on 99% SLO)`,
  solution: `function computeBurnRate(errorRate: number, sloTarget: number): number {
  const allowedErrorRate = 1 - sloTarget;
  return Math.round((errorRate / allowedErrorRate) * 100) / 100;
}

console.log(computeBurnRate(0.001, 0.999));
console.log(computeBurnRate(0.014, 0.999));
console.log(computeBurnRate(0.0005, 0.999));
console.log(computeBurnRate(0.03, 0.99));`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'A service has a 99.9% SLO and an error rate of 1.4% over the last hour. What is the burn rate, and how urgently does this require action?',
    options: [
      'Burn rate 1.4× — mildly above target, create a ticket for next sprint',
      'Burn rate 14× — critical, the monthly error budget will be exhausted in about 2.5 days at this rate; page on-call immediately',
      'Burn rate 0.14× — below target, no action needed, the service is performing better than the SLO',
      'Burn rate 140× — catastrophic, the service should be taken offline immediately',
    ],
    answer: 1,
    explanation: 'A 99.9% SLO allows 0.1% errors. The burn rate = 1.4% / 0.1% = 14×. At 14× burn rate, the monthly error budget (43.8 minutes) is exhausted in 30 days / 14 = ~2.1 days. This is the "critical page" threshold in multi-window burn rate alerting. The service must be investigated immediately — it is consuming the month\'s reliability budget in 2 days.',
  },
  {
    q: 'Which of the following qualifies as toil under the SRE definition?',
    options: [
      'Weekly architecture review meetings to discuss upcoming service designs',
      'Manually restarting a database pod every Monday because it reliably runs out of connections over the weekend — same steps, every week',
      'Monthly postmortem meetings to review incidents from the prior month',
      'Annual performance reviews and quarterly goal-setting sessions',
    ],
    answer: 1,
    explanation: 'The Monday database pod restart is classic toil: manual (kubectl restart), repetitive (same steps every week), automatable (could be automated with a CronJob or connection pool fix), O(n) with service growth (more DB pods = more restarts), and lacks enduring value (the restart doesn\'t fix the underlying connection leak). The meetings are overhead — they have strategic value and are not automatable without losing their purpose.',
  },
  { q: 'What is an error budget in SRE and how is it calculated?', options: ['A reserved budget in the operations cost center for incident response activities', 'The allowable amount of unreliability in a period calculated as 1 minus the SLO target; if the SLO is 99.9% availability, the error budget is 0.1% or about 43 minutes of downtime per month', 'A count of production errors allowed before triggering a rollback policy', 'The maximum number of incidents an SRE team can respond to in a quarter without team burnout'], answer: 1, explanation: 'Error budget: 100% minus the SLO target. 99.9% availability SLO = 0.1% error budget = 43.8 minutes per month of allowed downtime. Purpose: it is the shared budget between the product team (wants to ship features fast) and the SRE team (wants stability). When the error budget is healthy: teams can deploy frequently. When the error budget is nearly exhausted: deployments slow or stop until the budget replenishes. The error budget makes reliability tradeoffs explicit and data-driven instead of opinion-based. Error budget burn rate: how fast is the budget being consumed? If current burn rate continues, will the budget last the full month?' },
  { q: 'What is error budget burn rate and how does it enable faster alerting?', options: ['Burn rate measures how many errors occur per deployment', 'Burn rate measures how fast the error budget is being consumed relative to the allowed rate; a burn rate of 2x means the budget will be exhausted in half the SLO window, enabling early alerting before users notice sustained impact', 'Burn rate is the rate at which new bugs are introduced into the production codebase', 'Burn rate only applies to financial budgets, not SLO error budgets'], answer: 1, explanation: 'Error budget burn rate: if the error budget should last 30 days and you are burning it at 2x the normal rate, it will be exhausted in 15 days. Multi-window multi-burn-rate alerts (Google SRE book): page immediately when burn rate is very high over a short window (1-hour window at 14x burn rate means budget exhausted in 1 day). Ticket when burn rate is elevated over a medium window (6-hour window at 6x burn rate means budget exhausted in 5 days). This approach: catches severe incidents immediately with low false positive rate. Catches slow-burning problems before they exhaust the budget. The combination of short-window and long-window checks reduces both alert lag and false positive rate.' },
  { q: 'What is toil in SRE and what percentage of SRE time should it consume?', options: ['Toil is any work that does not directly improve service reliability or team capabilities', 'Toil is manual, repetitive, tactical work that scales with service growth but provides no enduring value; SRE teams should keep toil below 50% of their time with the goal of reducing it further', 'Toil is the overhead cost of running a 24/7 on-call rotation', 'Toil refers to legacy systems that are difficult to automate; the industry standard is to accept 80% toil for maintaining such systems'], answer: 1, explanation: 'Toil properties (Google SRE definition): manual (done by hand, not automated). Repetitive (done over and over). Tactical (interrupt-driven, reactive). No enduring value (if done twice, it provides no more value than if done once). Scales with service growth (more traffic means more toil). Examples: manual deployments, restarting a service when a metric spikes, resizing disks manually, responding to repeated non-actionable alerts. SRE teams should keep toil below 50% of working time. Below that: project work that eliminates toil. Measuring toil: categorize each engineering activity each week. Track the toil percentage. If it grows, the team is becoming an ops team not an SRE team.' },
  { q: 'How should a team respond when the error budget is exhausted?', options: ['Immediately roll back all recent deployments and declare an incident', 'Stop all feature deployments and focus engineering capacity on reliability improvements until the budget replenishes or an exception is approved', 'Continue deployments but require additional approval from senior engineering leadership', 'Renegotiate the SLO upward to give more error budget room'], answer: 1, explanation: 'Error budget policy: the team agrees in advance what happens when the budget is exhausted. Typical policy: no new feature releases until the budget replenishes. All engineering capacity redirected to reliability work. Post-incident reviews required before resuming normal deployment cadence. Exception process: if a critical security patch or business-critical feature must ship, it requires explicit approval from a VP-level stakeholder who acknowledges the risk. The policy must be written and agreed upon before it is needed — ad-hoc decisions during a budget crunch are emotionally charged and inconsistent. The error budget policy is the mechanism that makes the SLO meaningful and gives SREs the authority to slow deployments.' },
];

const qna: QnaItem[] = [
  {
    q: 'How do you set a realistic SLO target for a new service?',
    a: 'Use existing measurements rather than aspiring to what you think is "good": <ol><li><strong>Measure what you have</strong>: for an existing service, measure actual availability over the last 90 days. If the service achieves 99.5% without specific reliability investment, use 99% as the SLO (give yourself headroom).</li><li><strong>For new services</strong>: start conservatively (99% or 99.5%). You can tighten the SLO after 3-6 months of operational data. Starting with 99.99% for an untested service creates a budget that expires in minutes.</li><li><strong>Consider dependencies</strong>: your service cannot have a higher SLO than your dependencies. If PostgreSQL has 99.9% availability, your service built on it cannot promise 99.99%.</li><li><strong>Match user expectations</strong>: a batch data pipeline can have 99% SLO (4.4 hours/month downtime) because users expect eventual data. A payment service likely needs 99.9% or higher because users expect instant transactions.</li><li><strong>Write the SLO with user-impact framing</strong>: "99.9% of payment requests succeed" is a user-impacting SLO. "Server CPU < 80%" is not an SLO — users don\'t experience CPU directly.</li></ol>Review and adjust SLOs quarterly based on operational data and business feedback.',
  },
  {
    q: 'What is the relationship between error budgets and feature velocity?',
    a: 'Error budgets create a quantitative trade-off mechanism between reliability and feature velocity: <ul><li><strong>Budget remaining → velocity permitted</strong>: each risky deploy "costs" some budget. If the budget is nearly spent, risky deploys are blocked — automatically, not by negotiation.</li><li><strong>Fast-moving teams can take risks</strong>: a team with strong deployment tooling, good rollbacks, and rigorous testing can move faster because their deployments are low-risk — they consume little budget even when they occasionally fail.</li><li><strong>Reliability work = buying back velocity</strong>: when the budget is low, the engineering team can invest in reliability improvements (better testing, faster rollbacks, chaos engineering) that reduce the cost of future deployments. This is a self-regulating system.</li><li><strong>Removes negotiation</strong>: without error budgets, "can we ship this risky thing?" is a human negotiation. With error budgets, it is a number: "we have 30% budget remaining and this deploy costs approximately 5% — yes, go ahead." Engineering and product managers agree on the policy once, then execute automatically.</li></ul>The goal is not to prevent all risk — it is to quantify risk and make informed trade-offs. A team that never spends its error budget is being too conservative; they should move faster.',
  },
  { q: 'How do you calculate and track error budget consumption?', a: 'Error budget calculation: monthly budget = (1 - SLO) x total request count or total minutes. For 99.9% availability: 0.001 x 43,200 minutes per month = 43.2 minutes of allowed downtime. Budget consumed = actual downtime minutes or failed request count in the period. Budget remaining = total budget - consumed. Tracking: Prometheus recording rules compute the error rate and availability in real time. Grafana dashboard shows: current burn rate, budget consumed this period, budget remaining, projected days until exhaustion at current burn rate. Alerting: alert when burn rate exceeds critical thresholds. Alert when budget is 50% consumed with 10 days remaining. Weekly summary: send a weekly digest of SLO performance and budget status to the team and stakeholders. This keeps reliability visible and creates accountability.' },
  { q: 'What are the key strategies for reducing toil in SRE practice?', a: 'Automate repetitive tasks: identify the most frequent toil categories. Build automation for each category. Runbook automation: convert manual runbooks into automated remediation scripts (auto-restart on OOM, auto-scale on CPU spike). Self-healing systems: configure Kubernetes health checks, PodDisruptionBudgets, and HPA to automatically recover without human intervention. Alert quality: fix alerts that require repetitive manual actions but no judgment. Either automate the action or fix the underlying issue. Capacity automation: use autoscaling instead of manual instance sizing. Deployment automation: CI/CD pipeline eliminates manual deployment steps. Toil budget enforcement: SREs must spend fewer than 50% of hours on toil. Track toil time weekly. If the percentage rises, it is a signal to invest more in automation before adding new features.' },
  { q: 'What happens to error-budget-driven release gating if a team simply raises its SLO target whenever the budget starts running low, rather than fixing the underlying reliability issues?', a: 'This defeats the entire self-regulating mechanism: the error budget only works as an objective, trustworthy signal if the SLO target itself is stable and reflects a genuine reliability commitment to users — a team that loosens its SLO (say, from 99.9% to 99.5%) purely to manufacture budget room whenever they hit a real problem is gaming the metric rather than responding to it, and the "shared goal" dynamic breaks down because the budget no longer reflects actual user-facing reliability, just whatever number keeps the feature pipeline flowing. Healthy error-budget practice treats the SLO target itself as a rarely-changed commitment (revisited deliberately, with stakeholder buy-in, based on genuine changes in user expectations) — not a dial to be adjusted reactively whenever it becomes inconvenient.' },
  { q: 'How do you identify and categorize toil effectively in an SRE team?', a: 'Toil identification methods: time tracking: ask engineers to categorize their time weekly. Categories: toil (repetitive manual work), projects (automation, reliability improvements), overhead (meetings, email). Interrupt tracking: log every unplanned interruption during on-call. Category: alert response, manual action, user request, deployment issue. Common high-toil categories: manual deployments and rollbacks. Restarting services that hit OOM or hang. Resizing storage volumes. Responding to non-actionable alerts. Manually running scripts that should run automatically. Toil prioritization: calculate toil hours per week per category. Estimate automation effort. ROI = (hours saved per month) / (hours to automate). Start with the highest ROI categories. Tracking: quarterly toil review. Present toil metrics to engineering leadership. Use toil trends to justify headcount or automation investment.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Error budget = allowed failure time under SLO. Budget policy enforces reliability vs velocity. Toil = manual, repetitive, automatable, no enduring value. Alert on burn rate not remaining %.',
  mustKnow: [
    'Error budget = 1 - SLO availability. 99.9% SLO → 43.8 min/month budget. Shared between maintenance, experiments, incidents.',
    'Burn rate = actual error rate / allowed error rate. 14× burn = budget exhausted in 2.5 days at 30-day window.',
    'Multi-window burn rate alert: short window (1h) AND long window (6h) both exceed threshold to prevent false positives.',
    'Error budget policy: pre-agreed action at each budget level (50%, 25%, 0%). Written agreement between dev and SRE/product.',
    'Toil definition: ALL of — manual, repetitive, automatable, O(n) with service growth, no enduring value. Meetings are overhead, not toil.',
    'Prioritise toil elimination by ROI: (monthly hours saved) / (automation effort hours). Automate highest-ROI toil first.',
  ],
  interviewFocus: [
    'What is an error budget and how does it create a trade-off between reliability and velocity?',
    'A service has a 99.9% SLO and a 2% error rate over the last hour. What is the burn rate?',
    'What qualifies as toil vs overhead? Give an example of each.',
  ],
};

@Component({
  selector: 'app-obs-error-budgets',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './error-budgets-toil.html',
  styleUrl: './error-budgets-toil.scss',
})
export class ObsErrorBudgetsToil {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
