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
  templateUrl: './histogram-quantile-accuracy-depends-on-bucket-boundaries.html',
  styleUrl: './histogram-quantile-accuracy-depends-on-bucket-boundaries.scss'
})
export class HistogramQuantileAccuracyDependsOnBucketBoundariesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page recommends histogram_quantile() as the fix for averages hiding the tail — without saying histograms have their own precision caveat',
      points: [
        'The main page\'s own mistakes entry ("Measuring average latency instead of percentiles") frames `histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))` as the fix for averages hiding the tail, and the theory section adds "Prefer Histograms over Summaries: histograms can be aggregated across instances... Histograms are better for distributed systems." Both are accurate, but neither mentions that the histogram\'s OWN p99 number is itself an approximation, not an exact value.',
        'Prometheus\'s own documentation is direct about this: `histogram_quantile`\'s "Error is limited by the width of the bucket the quantile is located in." The function doesn\'t know the exact value of any individual observation inside a bucket — it only knows how many observations fell into each bucket boundary, and interpolates a quantile estimate assuming an even distribution within whichever bucket the target percentile falls into.',
      ]
    },
    {
      heading: 'A concrete case where the p99 number itself is wrong, not just imprecise',
      points: [
        'Prometheus\'s own docs walk through a real example: request durations that actually cluster around 220ms, scraped into a histogram whose buckets only include a boundary at 200ms and the next one at 300ms — no boundary anywhere near the true 220ms cluster. The interpolated 95th-percentile estimate comes out to 295ms, "far from the true ~220ms value," purely because the bucket the real data landed in was too wide for the interpolation to land anywhere close to reality.',
        'Prometheus\'s own docs also show the opposite, reassuring case: when a quantile happens to land exactly on a bucket boundary, the value IS accurate — "the calculated value would be accurate in this (contrived) case, as the value of the 95th percentile happens to coincide with one of the configured bucket boundaries." The accuracy of any specific `histogram_quantile()` result depends entirely on how the actual data distribution lines up against whatever bucket boundaries were configured — sometimes it\'s precise, sometimes it can be off by 30%+ (295ms reported vs. 220ms real), and the query itself gives no indication of which case you\'re in.',
        'This directly sharpens the main page\'s own "prefer histograms, they\'re better for distributed systems" advice: histograms are the right STRUCTURAL choice over summaries (aggregatable across instances, as the main page correctly states), but that structural advantage says nothing about whether the specific bucket boundaries chosen for a given metric are fine-grained enough near the values that actually matter — a histogram with poorly-chosen buckets can produce a p99 alert value that looks precise but is significantly wrong.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The exact failure mode from Prometheus\'s own documentation, applied to the main page\'s own SlowLatency alert',
      language: 'bash',
      code: `# The main page's own alert:
# - alert: SlowLatency
#   expr: |
#     histogram_quantile(0.99,
#       rate(http_request_duration_seconds_bucket[5m])
#     ) > 1.0
#   for: 5m

# Suppose the histogram's buckets (defined where the app instruments
# metrics, NOT visible in this alert rule at all) are coarse:
#   le="0.5", le="1.0", le="2.5", le="5.0", le="+Inf"

# Real request durations actually cluster tightly around 1.2s --
# just past the 1.0s boundary, well before the next one at 2.5s.

# Per Prometheus's own docs on histogram_quantile's interpolation:
# with no bucket boundary anywhere near the ACTUAL 1.2s cluster,
# the linear-interpolation estimate for p99 could land anywhere
# between 1.0s and 2.5s depending on how many observations fall in
# that wide bucket -- it might report something like 2.3s (far
# from the true ~1.2s), triggering (or failing to trigger) the
# "> 1.0" alert threshold based on an estimate that's off by nearly
# a full second, not the genuinely precise-looking number the
# query's own single decimal output implies.`,
    },
    {
      label: 'Why "prefer histograms over summaries" doesn\'t make this problem go away',
      language: 'bash',
      code: `# The main page's own theory bullet is correct as far as it goes:
# "histograms can be aggregated across instances with
# histogram_quantile(); summaries cannot."
#
# That's a genuine, real advantage -- summaries compute quantiles
# PER INSTANCE at scrape time and literally cannot be combined
# across instances afterward (you can't average two different
# instances' own p99 values and get a meaningful fleet-wide p99).
# Histograms solve exactly that aggregation problem.

# But per Prometheus's own docs, the bucket-boundary precision
# issue is a COMPLETELY SEPARATE concern from the
# aggregation-across-instances one -- switching from a Summary to
# a Histogram fixes the aggregation problem, but a Histogram with
# badly-chosen bucket boundaries can still produce an inaccurate
# quantile estimate, for the reasons shown in the first example.

# The actual, complete fix per Prometheus's own guidance: choose
# histogram bucket boundaries deliberately clustered AROUND the
# values that matter for your alerts and SLOs (e.g. buckets at
# 0.9, 1.0, 1.1, 1.2, 1.5s if your SLO threshold is right around
# 1.0-1.2s) -- not just "use a histogram instead of a summary" and
# stop there.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s Grafana dashboard shows `histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))` reporting a suspiciously round, suspiciously stable p99 value of exactly 2.5 seconds for weeks, even as they make performance improvements they can verify reduced real user-facing latency. Using this subtopic\'s theory, propose the most likely explanation, and what to check first.',
    hint: 'Per this subtopic\'s theory, what specifically determines the value histogram_quantile() interpolates within a bucket — and what would happen if the true p99 value sits well inside one particular wide bucket that never changes?',
    solution: 'The most likely explanation, per this subtopic\'s theory, is that the true p99 latency sits somewhere inside a single wide histogram bucket whose UPPER boundary is 2.5 seconds — and `histogram_quantile()`\'s interpolation, per Prometheus\'s own docs, has "error limited by the width of the bucket," meaning as long as the actual p99 stays within that same bucket, the interpolated estimate can stay artificially anchored near that bucket\'s boundary value even as the real underlying latency genuinely improves. The fix isn\'t something to investigate in the alert or dashboard query itself — it\'s in the bucket boundary configuration where the histogram is instrumented in the application code. The team should check whether there\'s a bucket boundary defined anywhere near their actual, expected p99 range (for example, boundaries at 0.5s, 1s, 1.5s, 2s, 2.5s instead of just a big jump straight to 2.5s) — without a boundary near the true value, `histogram_quantile()` has no way to report a number that actually reflects small, real improvements happening inside one wide bucket.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'histogram_quantile(0.99, ...) always returns the actual, exact 99th-percentile value from the underlying raw request durations, the same way computing a percentile directly from a sorted list of numbers would.',
      reality: 'Per this subtopic\'s theory, Prometheus\'s own docs describe the result as an INTERPOLATED ESTIMATE based on bucket boundaries, not the exact value — the function never sees individual raw observations, only counts per bucket, and "error is limited by the width of the bucket the quantile is located in."'
    },
    {
      thought: 'Since the main page\'s own theory recommends histograms over summaries for being "better for distributed systems," switching from a Summary metric to a Histogram automatically produces accurate percentile values.',
      reality: 'This subtopic\'s second code example shows these are two separate concerns — histograms genuinely solve the cross-instance AGGREGATION problem summaries can\'t, per the main page\'s own correct claim, but a histogram with poorly-chosen bucket boundaries can still produce an inaccurate quantile estimate, per Prometheus\'s own documented interpolation-error behavior.'
    },
    {
      thought: 'A histogram_quantile() result that looks stable and precise (e.g. consistently reporting a specific decimal value like 1.23s) is strong evidence that the underlying bucket boundaries are well-chosen and the number is trustworthy.',
      reality: 'Per this subtopic\'s exercise, a suspiciously stable, round-looking value can actually be a symptom of the OPPOSITE — the true value sitting inside one wide bucket whose boundary the interpolation keeps anchoring toward, meaning genuine underlying improvements or regressions can go invisible until they cross into a different bucket entirely.'
    }
  ];
}
