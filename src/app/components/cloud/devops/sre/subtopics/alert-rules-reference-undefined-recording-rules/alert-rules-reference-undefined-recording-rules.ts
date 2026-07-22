import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './alert-rules-reference-undefined-recording-rules.html',
  styleUrl: './alert-rules-reference-undefined-recording-rules.scss'
})
export class AlertRulesReferenceUndefinedRecordingRulesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own SLO recording rules and its own burn-rate alerts are in the same code tab — and name different metrics',
      points: [
        'The main page\'s "SLO Prometheus Recording Rules" code tab has two sections back to back: recording rules, then burn-rate alerting rules. Reading it top to bottom feels continuous, as if the alerts consume exactly what the recording rules just computed.',
        'The recording rules section defines exactly two time-windowed rules: `job:http_requests_success:rate5m` and `job:http_requests_success:rate28d` — both named around a SUCCESS ratio, using the windows 5 minutes and 28 days.',
        'The alerting rules section, a few lines further down in the SAME tab, references FOUR different series: `job:slo_error_rate:rate1h`, `job:slo_error_rate:rate5m`, `job:slo_error_rate:rate6h`, and `job:slo_error_rate:rate30m` — a different metric name entirely (`slo_error_rate`, not `http_requests_success`) across four windows, only one of which (5m) even shares a window with what the recording rules actually computed.',
      ]
    },
    {
      heading: 'Why this is a real problem if the main page\'s own two code blocks were pasted into a live Prometheus config as-is, and what Prometheus\'s own naming convention reveals about it',
      points: [
        'Prometheus\'s own documented recording-rule naming convention is `level:metric:operations` — the name itself is meant to describe exactly what PromQL expression computed it, so that anyone referencing the rule later knows precisely what it represents. Per Prometheus\'s own docs, a rule must be DEFINED with its own expression before anything else can reference it — a rule name appearing in an alert\'s `expr:` with no matching `record:` anywhere in the loaded rule files simply does not exist as queryable data.',
        'None of the four `job:slo_error_rate:rateXX` series the alert rules reference have a corresponding `record:` block anywhere in the main page\'s own recording-rules section. Loading both blocks into a real Prometheus instance exactly as shown would not error at load time (PromQL doesn\'t validate that referenced metric names exist when rules are parsed) — the alert rules would simply evaluate against non-existent time series, meaning the `SLOBurnRateCritical` and `SLOBurnRateHigh` alerts as written would never fire, no matter how bad the real error rate got, because the data they query for was never produced.',
        'A correct version needs FOUR additional recording rules computing an error-rate expression (not the success-ratio expression already shown) across FOUR windows (1h, 5m, 6h, 30m) — the existing `job:http_requests_success:rate5m` rule is close in spirit to one of the four needed windows, but even that one is named and framed as a success ratio, not the error rate the alert expressions actually compare against a threshold like `14.4 * 0.001`.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What the main page\'s own two sections actually define vs. reference',
      language: 'bash',
      code: `# ── What the recording-rules section DEFINES (the main page's own example) ──
#   job:http_requests_success:rate5m    (5-minute window, SUCCESS ratio)
#   job:http_requests_success:rate28d   (28-day window,   SUCCESS ratio)
#   job:slo_budget_remaining            (derived from rate28d above)

# ── What the alerting-rules section REFERENCES (same tab, a few lines down) ──
#   job:slo_error_rate:rate1h    -- expr: SLOBurnRateCritical
#   job:slo_error_rate:rate5m    -- expr: SLOBurnRateCritical
#   job:slo_error_rate:rate6h    -- expr: SLOBurnRateHigh
#   job:slo_error_rate:rate30m   -- expr: SLOBurnRateHigh

# Cross-check: is EITHER alert's metric name defined above?  NO.
# Cross-check: does EITHER alert's window (1h, 6h, 30m) match a
#              window that was actually computed above?         NO.
# The only overlap at all is the "5m" TEXT in the window suffix --
# but job:slo_error_rate:rate5m and job:http_requests_success:rate5m
# are still two entirely different metric names. Prometheus treats
# them as completely unrelated time series.`,
    },
    {
      label: 'The missing recording rules a real deployment would need to add',
      language: 'bash',
      code: `# To make the main page's own burn-rate alerts actually queryable,
# four MORE recording rules are needed -- computing an ERROR rate
# (not success ratio) across the four specific windows the alerts
# reference:
#
# groups:
#   - name: slo_api_error_rate
#     interval: 30s
#     rules:
#       - record: job:slo_error_rate:rate5m
#         expr: |
#           sum(rate(http_requests_total{job="api",status=~"5.."}[5m]))
#           /
#           sum(rate(http_requests_total{job="api"}[5m]))
#
#       - record: job:slo_error_rate:rate1h
#         expr: |
#           sum(rate(http_requests_total{job="api",status=~"5.."}[1h]))
#           /
#           sum(rate(http_requests_total{job="api"}[1h]))
#
#       - record: job:slo_error_rate:rate30m
#         expr: |
#           sum(rate(http_requests_total{job="api",status=~"5.."}[30m]))
#           /
#           sum(rate(http_requests_total{job="api"}[30m]))
#
#       - record: job:slo_error_rate:rate6h
#         expr: |
#           sum(rate(http_requests_total{job="api",status=~"5.."}[6h]))
#           /
#           sum(rate(http_requests_total{job="api"}[6h]))
#
# Only once ALL FOUR of these exist do the main page's own
# SLOBurnRateCritical / SLOBurnRateHigh alert expressions have real
# data to evaluate against.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team copies the main page\'s own two Prometheus code blocks verbatim into their prometheus/rules/ directory, deploys them, and moves on — `promtool check rules` reports no errors, and Prometheus loads the config successfully with no startup warnings. Six months later, a real, severe incident burns through 90% of the month\'s error budget in under an hour, and no page ever fires. Using this subtopic\'s theory, explain why the silent failure happened, and why neither promtool nor Prometheus\'s own startup ever caught it.',
    hint: 'Per this subtopic\'s theory, does Prometheus validate at rule-load time that every metric name referenced inside an alert expr: actually has a corresponding record: rule defined somewhere?',
    solution: 'Per this subtopic\'s theory, the silent failure happened because SLOBurnRateCritical and SLOBurnRateHigh, exactly as copied from the main page, query for `job:slo_error_rate:rate1h`, `rate5m`, `rate6h`, and `rate30m` — none of which the same copied recording-rules block ever actually computes (it only computes `job:http_requests_success:rate5m` and `rate28d`, a differently-named success-ratio metric on different windows). During the real incident, the alert expressions evaluated against time series that simply do not exist in Prometheus\'s data — a query against a non-existent series returns an empty result, not an error, and an alert rule whose expression returns no data never fires, no matter how catastrophic the real underlying error rate is. Neither `promtool check rules` nor Prometheus\'s own startup validation catches this because PromQL syntax is valid either way — `job:slo_error_rate:rate1h` is a perfectly well-formed metric name reference, and nothing in rule-file parsing cross-checks that every metric name mentioned in an alert expr: has a matching record: rule defined somewhere in the loaded configuration. The gap is only visible by manually cross-referencing what each section actually names, exactly as this subtopic\'s first code example does — which is precisely the kind of silent, no-error-anywhere failure this subtopic exists to flag before it reaches a real deployment.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since the main page\'s own recording-rules and burn-rate-alerting sections sit in the same code tab, one right after the other, the alerts must be querying exactly what the recording rules compute.',
      reality: 'Per this subtopic\'s theory, close comparison shows the alert rules reference `job:slo_error_rate:rateXX` across four windows (1h, 5m, 6h, 30m), while the recording rules only ever define `job:http_requests_success:rateXX` across two different windows (5m, 28d) — different metric names, mostly different windows, with no actual data-dependency link between the two sections as written.'
    },
    {
      thought: 'If Prometheus starts up cleanly and promtool reports no errors after loading a set of recording and alerting rules, every alert expression is guaranteed to have real data to evaluate against.',
      reality: 'Per this subtopic\'s exercise, PromQL syntax validation and metric-existence are two separate concerns — a syntactically valid alert expr: referencing a metric name with no corresponding record: rule anywhere loads and starts without error, but silently never fires, since it always evaluates against an empty result.'
    },
    {
      thought: 'The overlapping "5m" window between job:http_requests_success:rate5m (recording rules) and job:slo_error_rate:rate5m (alert rules) means at least that one metric is correctly wired.',
      reality: 'Per this subtopic\'s theory, Prometheus treats metric names as opaque, exact-match identifiers — sharing a window suffix like "rate5m" does not make two differently-named series (http_requests_success vs. slo_error_rate) the same underlying data; the alert still queries a series that was never defined.'
    }
  ];
}
