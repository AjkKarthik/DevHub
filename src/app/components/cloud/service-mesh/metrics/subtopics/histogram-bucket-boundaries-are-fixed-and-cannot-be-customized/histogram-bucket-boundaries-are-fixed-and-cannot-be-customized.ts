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
  templateUrl: './histogram-bucket-boundaries-are-fixed-and-cannot-be-customized.html',
  styleUrl: './histogram-bucket-boundaries-are-fixed-and-cannot-be-customized.scss'
})
export class HistogramBucketBoundariesAreFixedAndCannotBeCustomizedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A real gap: the main page discusses precise p99 SLO math without mentioning a hard constraint on precision',
      points: [
        'The main page devotes significant space to `histogram_quantile()` queries, burn-rate math down to specific percentages (2×, 6×, 14.4× multipliers), and tight SLO targets (99.9%). None of this discussion mentions that the underlying histogram\'s BUCKET BOUNDARIES — which directly determine how accurate any `histogram_quantile()` result can be — are fixed and cannot be customized at all in current Istio.',
      ]
    },
    {
      heading: 'The reality: in-proxy telemetry has no bucket-customization mechanism',
      points: [
        'Per Istio\'s own FAQ documentation: "No mechanism for configuring custom buckets for histogram metrics... Mixer-based telemetry supported customizing buckets for histogram type metrics like request duration and TCP byte sizes. In-proxy telemetry has no such available mechanism." Since Mixer was removed years ago, EVERY current Istio installation is stuck with the hardcoded default bucket boundaries.',
        'The default bucket boundaries for `istio_request_duration_milliseconds` span from 0.5ms up through 3,600,000ms (1 hour): approximately 0.5, 1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 30000, 60000, 300000, 600000, 1800000, 3600000.',
      ]
    },
    {
      heading: 'Why fixed, wide-ranging buckets matter for tight SLOs',
      points: [
        '`histogram_quantile()` LINEARLY INTERPOLATES within whichever bucket the target percentile falls into — it cannot know the true distribution of values inside that bucket, only the count of requests that fell within its boundaries. The wider the gap between two adjacent bucket boundaries, the less accurate the interpolated result is.',
        'Consider a service with a genuinely tight SLO target — p99 under 20ms. The relevant bucket boundaries nearby are 10ms and 25ms: EVERY request between 10ms and 25ms falls into the same bucket, so `histogram_quantile(0.99, ...)` can only ever report a linearly-interpolated value somewhere between those two boundaries — it cannot report, say, "18.3ms" with genuine precision; that figure is a mathematical interpolation guess, not a measured value.',
        'Practical implication: for services where sub-bucket precision genuinely matters (a p99 SLO tightly clustered near one of these fixed boundaries), teams need to be aware the reported number carries real interpolation uncertainty — and since Istio\'s in-proxy telemetry offers no way to add finer-grained buckets in that specific range, the only mitigation is understanding and communicating this uncertainty, not "just add more buckets."',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The fixed default bucket boundaries (istio_request_duration_milliseconds)',
      language: 'bash',
      code: `# These are HARDCODED in current (in-proxy) Istio telemetry --
# there is no Telemetry API field, no EnvoyFilter-based
# mechanism, no configuration option to change them:

0.5, 1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000,
10000, 30000, 60000, 300000, 600000, 1800000, 3600000
# (all in milliseconds -- so 3600000 = 1 hour)

# View them directly on a live proxy:
kubectl exec deploy/api -n production -c istio-proxy -- \\
  curl -s localhost:15000/stats/prometheus | \\
  grep 'istio_request_duration_milliseconds_bucket' | \\
  grep 'le="' | head -20`,
    },
    {
      label: 'Demonstrating the interpolation gap for a tight SLO',
      language: 'bash',
      code: `# A service targets p99 < 20ms. The two RELEVANT fixed
# buckets bracketing that target are le="10" and le="25".

# If histogram_quantile(0.99, ...) reports 18.4ms, that
# number is a LINEAR INTERPOLATION between the 10ms and
# 25ms bucket boundaries based on how many requests fell
# in each -- NOT a genuinely measured 18.4ms latency value.
# The true p99 could be anywhere between roughly 10ms and
# 25ms and still produce that same interpolated result,
# depending on the real (unknown-to-Prometheus) distribution
# of latencies within that bucket.

histogram_quantile(0.99,
  sum by (le) (
    rate(istio_request_duration_milliseconds_bucket{
      reporter="destination",
      destination_service_name="checkout"
    }[5m])
  )
)
# No amount of PromQL query tuning fixes this -- the
# precision ceiling is set by the FIXED bucket boundaries
# themselves, which cannot be changed in current Istio.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team with a strict p99 < 20ms SLO for a checkout service sees histogram_quantile(0.99, ...) consistently report values between 15ms and 19ms — comfortably under target. They conclude their SLO is solidly met and stop investigating further. Given Istio\'s fixed histogram bucket boundaries (which include 10ms and 25ms as adjacent boundaries near this range), how confident should they actually be in that specific reported number, and what should they consider doing?',
    hint: 'What does histogram_quantile() actually compute when the target percentile falls inside a bucket bounded by 10ms and 25ms, and what does Istio\'s in-proxy telemetry NOT let you do about those specific boundaries?',
    solution: 'The team should be less confident in the SPECIFIC reported number (e.g. "17ms") than they might assume — since 10ms and 25ms are the two fixed bucket boundaries bracketing their target range, any p99 value reported between them is a linear interpolation, not a directly measured value, and the true p99 could genuinely be anywhere within that 10-25ms range while still producing a similar interpolated result. Since Istio\'s in-proxy telemetry has no mechanism to add finer-grained buckets in this specific range (no Mixer-style bucket customization exists in current Istio), the team cannot simply request more precision from the metric itself. Reasonable next steps: treat the reported p99 as directionally correct but not precise to the millisecond, consider a complementary measurement approach (e.g. application-level histogram with custom buckets, or distributed tracing latency data) if genuinely sub-bucket precision matters for this SLO, and communicate the real uncertainty band (roughly 10-25ms, not a single precise number) rather than treating the interpolated figure as exact.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The Telemetry API can be used to configure custom histogram bucket boundaries for istio_request_duration_milliseconds, similar to how it can add custom labels or disable metrics.',
      reality: 'Per this subtopic\'s theory, Istio\'s own FAQ explicitly states current (in-proxy) telemetry has "no mechanism for configuring custom buckets" — this was only possible under the older, now-removed Mixer-based telemetry architecture.'
    },
    {
      thought: 'A histogram_quantile() result like "p99 = 17.2ms" is a precisely measured latency value, accurate to the fraction of a millisecond shown.',
      reality: 'Per this subtopic\'s theory, histogram_quantile() linearly interpolates within whichever fixed bucket boundaries bracket the target percentile — the apparent precision of the output number does not reflect genuine measurement precision when the true value falls between two widely-spaced bucket boundaries.'
    },
    {
      thought: 'Since Istio\'s default histogram buckets span from 0.5ms to an hour, they must be fine-grained enough to accurately measure any realistic latency SLO.',
      reality: 'Per this subtopic\'s theory, the buckets are unevenly and increasingly spaced (e.g. jumping from 10ms to 25ms to 50ms) — a genuinely tight SLO target that falls between two of these widely-separated boundaries gets a comparatively imprecise, interpolated result, regardless of how fine-grained the boundaries look in aggregate across the full range.'
    }
  ];
}
