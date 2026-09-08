import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'Alerting on the Absence of Logs, Not Their Content',
    points: [
      'The main page’s own QnA on log-based alerting names a distinct, third alert PATTERN alongside threshold and pattern-match alerts: "Alert when no logs are received from a service for 5 minutes (dead man switch)." Every other alerting example on the page — the "LogQL Queries" codeTab’s <code>LogErrorRateHigh</code> rule, the QnA’s own error-count examples — alerts on the PRESENCE of matching log content. A dead man’s switch is the opposite: it fires precisely when NOTHING matches at all.',
      'LogQL provides <code>absent_over_time()</code> specifically for this, mirroring PromQL’s function of the same name — confirmed directly against Loki’s own documentation: it "returns an empty vector if the range vector passed to it has any elements and a 1-element vector with the value 1 if the range vector passed to it has no elements."',
      'This inverts the usual alerting logic entirely: a normal alert fires when a metric/log-derived value CROSSES a threshold; a dead man’s switch fires when a query that should ALWAYS return something instead returns NOTHING — a silent service (crashed, network-partitioned, or simply never deployed) looks identical to a healthy, quiet one under every other alert type on the page, which is exactly the blind spot this pattern exists to close.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'A Dead Man’s Switch Alert, Matching the Page’s Own Alert-Rule Style',
    language: 'bash',
    code: `# Fires when the payment-service has produced ZERO log lines in the
# last 5 minutes -- distinct from every content-based alert on this
# page, which fires when SOMETHING matches, not when NOTHING does.
- alert: PaymentServiceSilent
  expr: |
    absent_over_time({service="payment-service"}[5m])
  for: 1m
  labels: { severity: critical }
  annotations:
    summary: "No logs received from payment-service in over 5 minutes -- possible outage"

# Contrast with the page's own existing content-based alert
# (fires on TOO MANY matching error lines, the opposite failure mode):
- alert: LogErrorRateHigh
  expr: |
    sum(rate({service="order-service"} | json | level="error"[5m])) > 10
  for: 2m
  labels: { severity: warning }`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The main page’s own error-rate alert, <code>LogErrorRateHigh</code>, would NEVER fire if <code>payment-service</code> crashed and stopped producing ANY logs at all — including error logs. Why not, and does <code>PaymentServiceSilent</code> catch that specific failure mode?',
  hint: 'Think about what <code>sum(rate(...))</code> evaluates to when the underlying query has ZERO matching log lines to work with, versus what <code>absent_over_time()</code> evaluates to under that exact same condition.',
  solution: `// LogErrorRateHigh's condition is "rate() > 10" -- if the service has
// produced ZERO logs of any kind (crashed, network-partitioned), the
// rate() of error logs is 0 (there's nothing to compute a rate from),
// and 0 > 10 is false. The alert simply never fires, no matter how long
// the service stays completely silent -- a total outage looks
// identical to "the service is running perfectly and has zero errors"
// from this specific query's point of view.
//
// PaymentServiceSilent DOES catch this failure mode, because it asks a
// completely different question: not "how many errors happened" but
// "did ANYTHING happen at all." absent_over_time() specifically returns
// a 1 when the underlying stream has produced NO log lines in the
// window -- exactly the condition a total service silence produces.
//
// This is the general reason a dead man's switch has to be a SEPARATE
// alert rule from any content-based threshold alert, not something a
// single, cleverer threshold query can express: "too many errors" and
// "zero logs of any kind" are genuinely different conditions that
// need genuinely different query logic to detect.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A dead man’s switch alert like <code>PaymentServiceSilent</code> makes the page’s own content-based alerts (like <code>LogErrorRateHigh</code>) redundant, since it would eventually catch any serious failure too.',
    reality: 'The two catch genuinely different failure modes, and neither one substitutes for the other: <code>LogErrorRateHigh</code> catches a service that’s STILL RUNNING and logging, but failing a growing fraction of its requests — exactly the case where <code>absent_over_time()</code> would never fire, since the service is still producing plenty of logs, just error-heavy ones. A service needs both alert types to be covered against both "running badly" and "not running at all."',
  },
  {
    thought: 'Since <code>absent_over_time()</code> mirrors PromQL’s function of the same name, it must work identically — computed from the same underlying time-series data Prometheus already has.',
    reality: 'LogQL’s <code>absent_over_time()</code> evaluates against LOKI’S log STREAMS (whether any log lines matching the given stream selector exist in the time window), a completely separate data source and query engine from Prometheus’s own metrics. The two functions share a name and a similar mental model — "did this thing that should exist actually show up" — but operate on entirely different underlying systems; having Prometheus metrics for a service says nothing about whether Loki has received any of its logs, and vice versa.',
  },
  {
    thought: 'The <code>for: 1m</code> clause on <code>PaymentServiceSilent</code> means the alert waits a FURTHER 5 minutes on top of the 5-minute window already inside <code>absent_over_time(...[5m])</code>, so the real detection delay is closer to 10 minutes.',
    reality: 'The <code>for: 1m</code> clause requires the alert CONDITION itself (already checking a trailing 5-minute window) to stay continuously true for 1 additional minute before firing — it does not restart or extend the 5-minute lookback window each time it re-evaluates. In practice this adds roughly 1 minute of confirmation delay on top of the initial 5-minute silence, for a total detection time closer to 6 minutes, not 10 — the two windows measure different things (how far back to look vs. how long the alert condition must persist) rather than stacking additively as separate 5-minute periods.',
  },
];

@Component({
  selector: 'app-obs-log-aggregation-dead-mans-switch',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-dead-mans-switch-query-the-qna-names-but-never-shows.html',
  styleUrl: './the-dead-mans-switch-query-the-qna-names-but-never-shows.scss',
})
export class TheDeadMansSwitchQueryTheQnaNamesButNeverShowsSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
