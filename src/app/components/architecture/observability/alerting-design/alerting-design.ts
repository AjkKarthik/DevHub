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
  { name: 'Actionable alert',  type: 'keyword', desc: 'An alert that, when fired, requires a specific human action. If the response is always "ignore it", the alert should be deleted.' },
  { name: 'Alert fatigue',     type: 'keyword', desc: 'Engineers ignoring alerts because too many fire. The most dangerous state — real incidents get buried in noise.' },
  { name: 'Notification policy', type: 'keyword', desc: 'Routes alerts to contact points based on label matchers (severity, team). Configured in Grafana Alertmanager or Alertmanager.' },
  { name: 'Inhibition rule',   type: 'keyword', desc: 'Suppresses child alerts when a parent alert is already firing. e.g., suppress all service alerts when the host is down.' },
  { name: 'Dead man\'s switch', type: 'keyword', desc: 'An alert that fires when your alerting system itself goes silent — detects when Prometheus or Alertmanager has stopped working.' },
  { name: 'Runbook',           type: 'keyword', desc: 'Documentation for responding to a specific alert — steps to diagnose, mitigate, and resolve. Linked in alert annotations.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'The Principles of Good Alerting',
    points: [
      'Every alert page must require human action. If the response is "watch it and it recovers by itself" or "ignore it, it always does this", delete the alert. Non-actionable alerts create alert fatigue.',
      'Alert on symptoms, not causes. "User error rate > 1%" is a symptom alert — something bad is happening to users right now. "CPU > 80%" is a cause alert — CPU is high for unknown reasons, users may or may not be affected.',
      'Set alert thresholds from SLOs, not from intuition. Your alert should fire when you are in danger of breaching the SLO, not when you feel uncomfortable about a number.',
      'Alert at the lowest confidence level that still requires action. The alternative — waiting for certainty before alerting — means users are already impacted when the alert fires.',
    ],
  },
  {
    heading: 'Alert Tiers: Page, Ticket, Record',
    points: [
      'Page (wake someone up): immediate user impact or imminent SLO breach. Error budget burning at 14× rate, payment service error rate > 5%, database unreachable. Response time: < 5 minutes.',
      'Ticket (next business day): degraded state that is not immediately critical but must be resolved. Error budget at 80%, p99 latency trending up over 24h, disk 80% full. Response time: < 2 business days.',
      'Record (dashboard only): interesting trends worth watching but not actionable yet. Memory growing 5% per week, cache hit rate declining. Response time: weekly review.',
      'Most teams have too many pages and too few tickets. Move non-critical alerts from page to ticket to reduce 3am wake-ups. The page count per engineer per week is a key SRE health metric.',
    ],
  },
  {
    heading: 'Alertmanager Routing',
    points: [
      'Alertmanager (or Grafana Unified Alerting) receives alerts from Prometheus and routes them to contact points based on label matchers.',
      'Contact points: Slack webhook (for ticketed alerts), PagerDuty (for pages), email (for daily summaries), OpsGenie, VictorOps. Each contact point type has different urgency and acknowledgement features.',
      'Notification policy: route by `severity=critical` → PagerDuty, `severity=warning` → Slack #incidents, `team=platform` → platform Slack channel.',
      'Inhibition rules: suppress alerts when a higher-level alert is already active. "Don\'t send 50 service-level alerts when the load balancer is down" — the LB alert already told on-call the root cause.',
    ],
  },
  {
    heading: 'Alert Hygiene Practices',
    points: [
      'Weekly alert review: look at which alerts fired in the last week. For each: was it actionable? Did on-call respond correctly? Does the threshold need adjusting?',
      'Runbook link in every alert: `annotations: { runbook: "https://wiki.internal/runbooks/..." }`. No runbook = first responder is guessing the correct response at 3am.',
      'Dead man\'s switch: `ALERTS{alertname="Watchdog"} absent for 5m` fires when Alertmanager stops sending heartbeats. Catches when your alerting pipeline itself is broken.',
      'Test your alerts: write tests that generate metric data and verify the expected alert fires. An untested alert rule may have a typo in the PromQL that prevents it from ever firing.',
    ],
  },
  {
    heading: 'Reducing Alert Fatigue',
    points: [
      'Alert fatigue occurs when on-call engineers receive so many low-value or non-actionable alerts that they become desensitized, eventually starting to ignore or delay response even to genuinely critical alerts — the single biggest threat to an alerting system\'s long-term effectiveness.',
      'Every alert should be actionable — if an alert fires and the correct response is "acknowledge and go back to sleep," it should not be an alert at all, but instead a dashboard metric or a lower-urgency notification reviewed during business hours.',
      'Alert on symptoms (user-facing impact — elevated error rate, high latency) rather than causes (a specific server\'s CPU usage) where possible — symptom-based alerting reduces the total number of alerts and ties each one directly to actual user impact, rather than paging on every underlying infrastructure fluctuation.',
      'Regularly reviewing and pruning alert rules (removing ones that consistently fire without leading to action, or that are frequently silenced) keeps the alerting system trustworthy — a stale alert configuration accumulates noise over time as systems and their normal operating ranges evolve.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Alert Rules',
    language: 'typescript',
    code: `# Prometheus alert rules — tiered severity, symptom-based

groups:
  - name: slo-alerts
    rules:
      # ── PAGE: critical SLO burn rate (wake someone up) ───────────
      - alert: ErrorBudgetBurningCritical
        expr: |
          # Short window (1h) AND long window (6h) both burning fast
          (
            sum(rate(http_requests_total{status_code=~"5.."}[1h])) /
            sum(rate(http_requests_total[1h]))
          ) > (14 * 0.001)  # 14x burn rate on 99.9% SLO
          AND
          (
            sum(rate(http_requests_total{status_code=~"5.."}[6h])) /
            sum(rate(http_requests_total[6h]))
          ) > (14 * 0.001)
        for: 2m
        labels:
          severity: critical
          team: platform
        annotations:
          summary: "SLO error budget burning at 14x — page on-call"
          description: "Error budget for {{ $labels.service }} will be exhausted in {{ $value | humanizeDuration }}"
          runbook: "https://wiki.internal/runbooks/slo-budget-burn"

      # ── TICKET: warning burn rate (next business day) ─────────────
      - alert: ErrorBudgetBurningWarning
        expr: |
          (
            sum(rate(http_requests_total{status_code=~"5.."}[6h])) /
            sum(rate(http_requests_total[6h]))
          ) > (3 * 0.001)
        for: 15m
        labels:
          severity: warning
          team: platform
        annotations:
          summary: "SLO error budget burning at 3x — create reliability ticket"
          runbook: "https://wiki.internal/runbooks/slo-budget-warning"

  - name: infrastructure-alerts
    rules:
      # ── PAGE: database unreachable ─────────────────────────────
      - alert: DatabaseDown
        expr: up{job="postgresql"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "PostgreSQL unreachable for 1 minute"
          runbook: "https://wiki.internal/runbooks/db-down"

      # ── DEAD MAN'S SWITCH ─────────────────────────────────────
      - alert: Watchdog
        expr: vector(1)   # always fires
        labels:
          severity: watchdog
        annotations:
          summary: "Alertmanager is running — heartbeat"
          # Alertmanager forwards this to a Dead Man's Snitch URL
          # If it stops arriving, DMS sends a page`,
  },
  {
    label: 'Alertmanager Config',
    language: 'typescript',
    code: `# alertmanager.yml — routing and contact points
global:
  resolve_timeout: 5m

route:
  receiver: default-receiver
  group_by: ['alertname', 'service']
  group_wait: 30s       # Wait for more alerts to group before sending
  group_interval: 5m    # Resend if group changes
  repeat_interval: 4h   # Repeat unresolved alerts every 4h
  routes:
    # Critical: wake someone up via PagerDuty
    - match:
        severity: critical
      receiver: pagerduty-receiver
      group_wait: 10s        # send faster for critical
      repeat_interval: 1h

    # Warning: Slack notification
    - match:
        severity: warning
      receiver: slack-warnings
      group_wait: 1m

    # Watchdog heartbeat: route to Dead Man's Snitch
    - match:
        severity: watchdog
      receiver: dead-mans-snitch
      repeat_interval: 5m    # must arrive at least every 5m

inhibit_rules:
  # If host is down, suppress all service-level alerts for that host
  - source_match:
      alertname: NodeDown
    target_match_re:
      alertname: ".*"         # suppress everything else
    equal: ['instance']       # same host

receivers:
  - name: pagerduty-receiver
    pagerduty_configs:
      - service_key: '<PAGERDUTY_KEY>'
        description: '{{ template "pagerduty.default.description" . }}'

  - name: slack-warnings
    slack_configs:
      - api_url: '<SLACK_WEBHOOK>'
        channel: '#incidents'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'

  - name: dead-mans-snitch
    webhook_configs:
      - url: 'https://nosnch.in/<SNITCH_ID>'`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Too many page alerts — alert fatigue kills on-call culture',
    wrong: `# 47 alert rules, all severity: critical, all fire to PagerDuty
# On-call receives 30 pages per week
# 25 are non-actionable or self-resolving
# Engineers stop responding promptly — alert fatigue
# Real incident: buried in noise, delayed response`,
    right: `# Tiered alerts: <5 pages/week/engineer is the target
# Page: imminent SLO breach, service completely down
# Ticket: degraded but not critical
# Review: track past 7 days — any alert firing > 3x non-actionably = delete or demote`,
    explanation: 'Alert fatigue is the most dangerous state for on-call reliability. When engineers receive too many non-actionable pages, they begin ignoring all pages — including real incidents. Target fewer than 5 pages per engineer per week. Conduct a weekly alert review to identify non-actionable alerts and either fix the underlying issue, raise the threshold, or delete the alert.',
  },
  {
    title: 'Alerting on causes (CPU > 80%) instead of symptoms (error rate > 1%)',
    wrong: `# Cause-based alerts — mostly noise
- alert: HighCPU
  expr: cpu_usage > 0.8
  # CPU at 85% during successful batch job → page fires
  # Users are completely unaffected
  # On-call checks: everything is fine, dismisses alert
  # Repeated 5 times per week → alert fatigue`,
    right: `# Symptom-based alerts — directly tied to user impact
- alert: UserFacingErrorRateHigh
  expr: |
    rate(http_requests_total{status=~"5.."}[5m])
    / rate(http_requests_total[5m]) > 0.01
  # Only fires when users are actually experiencing errors
  # CPU may be high or low — doesn't matter; user impact = actionable`,
    explanation: 'Cause-based alerts (CPU, memory, disk) fire frequently for benign reasons — batch jobs, GC runs, legitimate load spikes. They produce false positives that train engineers to ignore pages. Symptom-based alerts (error rate, latency, user-visible failures) only fire when something users experience is actually degraded. This makes every alert fire meaningful and reduces false positives dramatically.',
  },
  {
    title: 'No runbook link in alert annotations',
    wrong: `- alert: PaymentServiceDown
  expr: up{job="payment-service"} == 0
  annotations:
    summary: "Payment service is down"
    # No runbook — on-call at 3am guesses the fix
    # Is it a config issue? Deploy failure? Database? K8s eviction?
    # Takes 20 minutes of investigation to get context`,
    right: `- alert: PaymentServiceDown
  expr: up{job="payment-service"} == 0
  annotations:
    summary: "Payment service unreachable — users cannot complete purchases"
    description: "Prometheus cannot scrape payment-service for 2+ minutes"
    runbook: "https://wiki.internal/runbooks/payment-service-down"
    # Runbook covers: deployment check, DB connection, K8s pod status
    # First responder has a 5-minute recovery vs 20-minute investigation`,
    explanation: 'At 3am, the on-call engineer has no context about the service. A runbook link in the alert annotation provides the standard operating procedure: which dashboards to check, how to determine the root cause, and the steps to remediate. Missing runbooks turn every incident into an improvised investigation. Write the runbook when you write the alert rule — not after the first incident.',
  },
  {
    title: 'Not testing alert rules — silent failures in alerting',
    wrong: `# Alert rule has a typo in the metric name
- alert: OrderServiceDown
  expr: up{job="order_service"} == 0  # ← job label is "order-service" not "order_service"
# Alert never fires — service goes down but nobody is paged
# Discovered during a real incident when on-call wonders why no page came`,
    right: `# Use promtool to validate rules
promtool check rules alerts.yml

# Write unit tests for alert rules
# alerts_test.yml:
rule_files:
  - alerts.yml
tests:
  - interval: 1m
    input_series:
      - series: 'up{job="order-service"}'
        values: "1 1 0 0 0"  # down at minute 3
    alert_rule_test:
      - eval_time: 3m
        alertname: OrderServiceDown
        exp_alerts:
          - exp_labels: { severity: critical, job: "order-service" }`,
    explanation: 'Alert rules can have typos in metric names, wrong label selectors, or PromQL errors that silently prevent them from ever firing. Use `promtool check rules` to validate syntax, and write unit tests for alert rules using `promtool test rules`. Test that alerts DO fire for the conditions they are designed to detect. An untested alert is not a safety net — it is a false sense of security.',
  },
];

const challenge: Challenge = {
  title: 'Alert rule evaluator',
  language: 'typescript',
  description: `Implement evaluateAlert(rule: AlertRule, metrics: Record<string, number>): boolean
An alert rule has: metricName, operator ('>','<','>=','<=','=='), threshold.
Return true if the condition is met (alert should fire).
Return false if the metric doesn't exist.`,
  hints: ['Look up the metric value by name', 'Use a switch or if-else for operators'],
  starterCode: `interface AlertRule {
  metricName: string;
  operator: '>' | '<' | '>=' | '<=' | '==';
  threshold: number;
}

function evaluateAlert(
  rule: AlertRule,
  metrics: Record<string, number>
): boolean {
  return false;
}

const metrics = { error_rate: 0.05, latency_p99: 1200, cpu: 0.3 };
console.log(evaluateAlert({ metricName: 'error_rate', operator: '>', threshold: 0.01 }, metrics));   // true
console.log(evaluateAlert({ metricName: 'latency_p99', operator: '>=', threshold: 1000 }, metrics)); // true
console.log(evaluateAlert({ metricName: 'cpu', operator: '>', threshold: 0.9 }, metrics));           // false
console.log(evaluateAlert({ metricName: 'missing', operator: '>', threshold: 0 }, metrics));         // false`,
  solution: `interface AlertRule {
  metricName: string;
  operator: '>' | '<' | '>=' | '<=' | '==';
  threshold: number;
}

function evaluateAlert(
  rule: AlertRule,
  metrics: Record<string, number>
): boolean {
  const value = metrics[rule.metricName];
  if (value === undefined) return false;
  switch (rule.operator) {
    case '>':  return value > rule.threshold;
    case '<':  return value < rule.threshold;
    case '>=': return value >= rule.threshold;
    case '<=': return value <= rule.threshold;
    case '==': return value === rule.threshold;
  }
}

const metrics = { error_rate: 0.05, latency_p99: 1200, cpu: 0.3 };
console.log(evaluateAlert({ metricName: 'error_rate', operator: '>', threshold: 0.01 }, metrics));
console.log(evaluateAlert({ metricName: 'latency_p99', operator: '>=', threshold: 1000 }, metrics));
console.log(evaluateAlert({ metricName: 'cpu', operator: '>', threshold: 0.9 }, metrics));
console.log(evaluateAlert({ metricName: 'missing', operator: '>', threshold: 0 }, metrics));`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is an "inhibition rule" in Alertmanager and when should you use it?',
    options: [
      'A rule that prevents alerts from firing during scheduled maintenance windows',
      'A rule that suppresses child alerts when a higher-level alert is already active (e.g., suppress all service alerts when the host is down)',
      'A rule that limits how many times an alert can page per hour to prevent spam',
      'A rule that delays alert notifications until a confirmation from a second system',
    ],
    answer: 1,
    explanation: 'Inhibition rules prevent alert flooding when a root cause is already being signalled by a higher-level alert. Example: when "NodeDown" fires (the host is unreachable), all service-level alerts for services on that host are suppressed — because their root cause is already known (the host is down). Without inhibition rules, a downed host can trigger 50 service alerts, swamping the on-call engineer with redundant notifications. Configure inhibition using matching labels (e.g., same `instance`) to ensure the scope is correct.',
  },
  {
    q: 'What is a "dead man\'s switch" alert and what failure does it detect?',
    options: [
      'An alert that fires when all replicas of a service are healthy — confirming the service is fully operational',
      'An alert rule that always fires (expr: vector(1)), used as a heartbeat to detect when the alerting pipeline itself has stopped working',
      'An alert that fires when a service has been running for more than 30 days without a restart — detecting stale deployments',
      'An alert configured to fire when no traffic has been received in the last hour — detecting abandoned services',
    ],
    answer: 1,
    explanation: 'A dead man\'s switch (or watchdog) alert always fires (`expr: vector(1)`). Alertmanager forwards it to a Dead Man\'s Snitch service (e.g., healthchecks.io) every few minutes. If the snitch doesn\'t receive the heartbeat within the expected interval, it pages the on-call engineer. This detects: Prometheus crashing, Alertmanager crashing, network partition isolating the monitoring stack, or any failure that would silently prevent real alerts from reaching on-call.',
  },
  { q: 'What is alert fatigue and how is it prevented?', options: ['When alerts fire too rarely and engineers miss important events', 'When too many low-quality alerts fire causing engineers to ignore or suppress all alerts including real ones', 'When alert notification channels like Slack or PagerDuty become unavailable', 'When alert rules take too long to evaluate causing delayed notifications'], answer: 1, explanation: 'Alert fatigue: engineers receive so many low-quality alerts that they start ignoring all of them. The pager becomes noise. Prevention: alert only on user-facing symptoms not internal causes. Set meaningful thresholds (alert when users are impacted, not at 80% CPU). Use alert grouping to suppress downstream alerts when a root cause alert fires. Route low-urgency alerts to ticket queues not pagers. Regularly review alert noise — any alert that fires frequently without a human response should be improved or deleted. Golden rule: every alert must be immediately actionable.' },
  { q: 'What is the difference between symptom-based and cause-based alerting?', options: ['Symptom-based alerting only applies to database and storage errors', 'Symptoms describe user-facing impact (high error rate, slow requests) while causes describe internal state (high CPU, memory pressure); alerting on symptoms reduces noise and keeps focus on user impact', 'Cause-based alerting is always more actionable because it identifies the root problem faster', 'Symptoms and causes are synonymous in modern observability systems'], answer: 1, explanation: 'Symptom-based alerting: alert on what affects users directly. High error rate, slow response time, low availability are always actionable because users are being impacted. Cause-based alerting: alert on internal state like CPU above 90% or memory above 80%. Not all high-CPU situations affect users, and not all user problems manifest as high CPU. Best practice: alert on the four golden signals (latency, errors, traffic, saturation) as symptoms. Use cause-based metrics on dashboards for debugging after an alert fires, not as the alert trigger.' },
  { q: 'Why must a dead man\'s switch alert route through a genuinely SEPARATE external system rather than through the same Alertmanager/Prometheus stack it is monitoring?', options: ['A separate system is not actually required — routing within the same stack works equally well', 'If the dead man\'s switch and its notification path depend on the very same Prometheus/Alertmanager pipeline being monitored, a full failure of that pipeline (the exact failure mode it exists to catch) would silently disable the watchdog itself at the same time — an external heartbeat service (healthchecks.io, Cronitor) that pages when it stops RECEIVING the heartbeat, rather than one your own stack has to actively fire, cannot be taken down by the same outage', 'External services are only required for compliance reasons, not technical ones', 'Dead man\'s switches work identically whether internal or external'], answer: 1, explanation: 'The entire premise of a dead man\'s switch is catching "the monitoring system itself silently failed" — if the switch\'s own alerting path runs through that same monitoring system, then whatever takes down Prometheus/Alertmanager (a crash, a network partition, a full cluster outage) ALSO takes down the mechanism meant to detect that exact failure, defeating the purpose entirely. An external heartbeat service flips the failure direction: it expects to receive a ping periodically and pages when the ping stops arriving, so it keeps working (and can page) precisely when your internal stack goes dark, which is the scenario that matters most.' },
  { q: 'What determines whether an inhibition rule\'s source and target match correctly, and what happens if the label matching is too broad?', options: ['Inhibition always applies globally to every alert regardless of labels', 'Inhibition rules match on shared labels (like instance or region) between the source (parent) alert and target (child) alerts — if the match is defined too broadly (e.g. matching on a label present on unrelated alerts), it can accidentally suppress alerts for a DIFFERENT, unrelated incident that happens to share that label value, hiding a genuine second problem', 'Label matching only affects notification formatting, not suppression behavior', 'Inhibition rules require identical alert names between source and target to function'], answer: 1, explanation: 'Alertmanager inhibition works by matching specific label values between the firing "source" alert and candidate "target" alerts to suppress — if that label match is scoped too loosely (matching on something generic rather than something that uniquely ties the target alerts to the SAME root cause as the source), an unrelated alert that happens to share the matched label value gets silently suppressed too, potentially hiding a second, genuinely independent incident happening to overlap on that label during the same window. This is why inhibition rules should be scoped as narrowly as the actual causal relationship justifies (e.g. matching on the specific instance or service, not a broad label like environment or team).' },
];

const qna: QnaItem[] = [
  {
    q: 'How do I decide whether an alert should page or just create a ticket?',
    a: 'Apply the "3am test": if this alert fires at 3am, would waking an engineer to respond immediately make a meaningful difference to user experience? <br><br><strong>Page (immediate)</strong>: <ul><li>Users are currently experiencing failures (error rate > SLO threshold)</li><li>The error budget will be exhausted within 2 days at the current burn rate</li><li>A service required for revenue is completely unreachable</li><li>Data integrity is at risk (replication lag > threshold, write errors)</li></ul><strong>Ticket (next business day)</strong>: <ul><li>Degraded but still within SLO (burn rate 2-5×, not 14×)</li><li>Resource headroom declining but not critical (disk 75%, not 95%)</li><li>Performance regression that hasn\'t yet caused user-visible impact</li></ul><strong>Record/review</strong>: <ul><li>Trends worth monitoring but no action threshold reached yet</li><li>Metrics that are interesting context but not actionable</li></ul>When in doubt, start with a ticket and promote to page if the next incident shows it needed faster response.',
  },
  {
    q: 'How should I handle alert notifications during planned maintenance?',
    a: 'Two mechanisms: <ol><li><strong>Alertmanager silence</strong>: create a silence in Alertmanager/Grafana that matches labels of alerts you want to suppress during maintenance. Silences have a defined end time — they expire automatically. Accessible via the Alertmanager UI or API. Best for one-off maintenance windows.</li><li><strong>Mute timings</strong> (Grafana Unified Alerting): recurring time windows when notifications are suppressed — e.g., every Sunday 2am-4am for weekly maintenance. Defined in the notification policy, not created ad-hoc. Best for regularly scheduled maintenance.</li></ol>Important: silences suppress notifications but the alerts still evaluate. You can see in the Alertmanager UI which alerts would have fired during the silence — useful for post-maintenance review. Never delete alert rules for maintenance — you\'ll forget to recreate them. Use silences instead.',
  },
  { q: 'What are the four golden signals for alerting on service health?', a: 'Google SRE defined four golden signals: Latency: the time to serve a request. Alert when p99 request latency exceeds the SLO threshold. Distinguish successful request latency from error request latency (errors are fast but wrong). Traffic: the demand on the system measured in requests per second or queries per second. Useful for capacity planning and detecting unusual traffic spikes. Errors: the rate of requests that fail explicitly or implicitly. Alert when error rate burns through the error budget faster than expected. Saturation: how full the service is — CPU, memory, disk, queue depth. Alert when approaching capacity limits that degrade performance. Build alert rules covering all four signals for every service.' },
  { q: 'How do you design on-call alert routing and escalation policies?', a: 'Severity tiers: P1 (critical, pages on-call immediately any time), P2 (high, pages during business hours, on-call at night), P3 (medium, creates a ticket reviewed next business day), P4 (informational, logged with no notification). Routing: Alertmanager routes alerts by label values — alertname, service, team. Each team owns alerts for their services. Escalation: if primary on-call does not acknowledge within 15 minutes, escalate to secondary. If secondary does not respond in 10 minutes, escalate to the team lead. Use PagerDuty or Opsgenie for schedule management, escalation policies, and override rules. Track on-call load — too many interrupts per week indicates poor alert quality or an understaffed team.' },
  { q: 'What is alert deduplication and how does Alertmanager implement it?', a: 'Alert deduplication prevents the same firing condition from generating multiple notifications. Alertmanager grouping: alerts with the same label values (alertname, cluster, service) are grouped together. One notification is sent for the group, not one per alert. When more alerts join the group, a single update is sent. Key timing parameters: group_wait (30 seconds) — how long to wait for more alerts before sending the first notification. group_interval (5 minutes) — how long to wait before sending an update for an existing group. repeat_interval (1+ hours) — how long to wait before resending an unchanged alert. Prometheus deduplication: each unique combination of label values produces a distinct fingerprint; duplicate evaluations of the same firing condition are deduplicated before reaching Alertmanager.' },
  { q: 'What is the difference between static and dynamic alert thresholds?', a: 'Static thresholds: fixed values such as alert when error rate exceeds 5%. Simple to understand and implement. Problem: 5% may be normal during certain traffic patterns or time of day. Can produce false positives during expected traffic spikes or maintenance windows. Dynamic thresholds: learn baseline behavior over time and alert when a metric deviates significantly from the expected pattern. Example: alert when the current error rate is 3 standard deviations above the same hour from the previous week. Tools: Grafana Machine Learning, Datadog anomaly detection, AWS CloudWatch Anomaly Detection, and Prometheus recording rules for moving averages. When to use dynamic thresholds: seasonal traffic patterns, unknown correct threshold, after collecting at least 2-4 weeks of historical data. Static thresholds are simpler and sufficient for most services.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Alert on symptoms not causes. Page tier < 5/week. Every alert = runbook link. Inhibition suppresses child alerts. Dead man\'s switch detects alerting pipeline failure.',
  mustKnow: [
    'Symptom alerts (error rate, latency) over cause alerts (CPU, memory) — fewer false positives, more actionable',
    'Three tiers: Page (immediate, < 5/week), Ticket (next business day), Record (dashboard only)',
    'Runbook link in every alert annotation — first responder SOP at 3am, not improvisation',
    'Inhibition rules: suppress 50 service alerts when host is already paged as root cause',
    'Dead man\'s switch: always-firing watchdog heartbeat detects when Prometheus/Alertmanager itself breaks',
    'Test alert rules with promtool test rules — untested alert rules are false security',
  ],
  interviewFocus: [
    'What is alert fatigue and how do you prevent it?',
    'What is the difference between alerting on symptoms vs causes? Give an example.',
    'What is a dead man\'s switch and what failure mode does it detect?',
  ],
};

@Component({
  selector: 'app-obs-alerting',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './alerting-design.html',
  styleUrl: './alerting-design.scss',
})
export class ObsAlertingDesign {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
