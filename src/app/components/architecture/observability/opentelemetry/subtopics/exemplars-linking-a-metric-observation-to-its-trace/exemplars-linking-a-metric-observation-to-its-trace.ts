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
    heading: 'The Bridge Between Aggregated Metrics and One Concrete Trace',
    points: [
      'The QnA on how OTel correlates the three signals describes exemplars precisely: "when a histogram observation is made during a traced request, the exemplar carries the trace ID. Grafana displays exemplars on histogram panels. Click an exemplar to jump to the trace." No codeTab anywhere on the page shows a histogram actually recording one.',
      'The core idea is narrow but powerful: a metric like a latency histogram is, by design, AGGREGATED — it tells you "how many requests fell into the 800-1000ms bucket," but nothing about WHICH specific requests. An exemplar attaches a sampled, representative trace ID to one specific observation within a bucket, giving a reader a concrete "click here to see an ACTUAL slow request" starting point instead of only an aggregate count.',
      'This only works because of context propagation (already covered by this hub’s own theory): the histogram’s <code>record()</code> call happens WHILE a span is active for the current request — the SDK can read the currently-active span’s trace ID at the exact moment the measurement is taken and attach it as the exemplar.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'A Histogram With Exemplars',
    language: 'typescript',
    code: `interface Exemplar { value: number; traceId: string; timestamp: number; }

class HistogramWithExemplars {
  private buckets = new Map<number, number>();
  private exemplars: Exemplar[] = [];

  // bucketWidthMs groups observations into fixed-width latency buckets,
  // matching how a real Prometheus/OTel histogram bucketizes values.
  constructor(private bucketWidthMs: number) {}

  record(valueMs: number, activeTraceId: string | null) {
    const bucketKey = Math.ceil(valueMs / this.bucketWidthMs) * this.bucketWidthMs;
    this.buckets.set(bucketKey, (this.buckets.get(bucketKey) ?? 0) + 1);

    // Exemplar: attach the CURRENTLY ACTIVE trace's ID to this one
    // observation -- only possible because record() runs while a span
    // for the current request is active (context propagation).
    if (activeTraceId) {
      this.exemplars.push({ value: valueMs, traceId: activeTraceId, timestamp: Date.now() });
    }
  }

  exemplarsInBucket(bucketKey: number): Exemplar[] {
    return this.exemplars.filter(e => Math.ceil(e.value / this.bucketWidthMs) * this.bucketWidthMs === bucketKey);
  }
}

const requestLatency = new HistogramWithExemplars(100); // 100ms-wide buckets

// Four requests recorded during real traced calls (a background job with
// no active trace records a value too, correctly getting no exemplar).
requestLatency.record(120, 'trace-abc');
requestLatency.record(150, 'trace-def');
requestLatency.record(980, 'trace-slow-1');  // a genuinely slow request
requestLatency.record(110, null);            // background job, no active trace

console.log('buckets:', Object.fromEntries((requestLatency as any).buckets));
console.log('exemplars in the 1000ms bucket:', requestLatency.exemplarsInBucket(1000));
// -> buckets: { 200: 3, 1000: 1 }
// -> exemplars in 1000ms bucket: [ { value: 980, traceId: 'trace-slow-1', ... } ]
//
// A Grafana panel showing "3 requests in the 100-200ms bucket, 1 in the
// 900-1000ms bucket" can now offer a clickable exemplar dot on the slow
// bucket -- clicking it opens trace 'trace-slow-1' directly, instead of
// leaving the reader to guess which of possibly thousands of requests in
// that time window was the one worth investigating.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A histogram with 100ms buckets records 5 requests, all in the SAME bucket (150ms, 160ms, 140ms, 155ms, 145ms — all rounding to the 200ms bucket), each with a DIFFERENT trace ID. Does <code>exemplarsInBucket(200)</code> return all 5, or does the bucket only ever get one exemplar?',
  hint: 'Look at what <code>record()</code> actually does with <code>this.exemplars.push(...)</code> — does it ever check whether the bucket already has an exemplar before adding another?',
  solution: `// record() unconditionally pushes a new exemplar entry every time it's
// called with a non-null traceId -- there's no check for "does this
// bucket already have one." All 5 requests land in the same bucket AND
// all 5 get their own exemplar entry.
//
// exemplarsInBucket(200) returns all 5 entries.
//
// This matches how real exemplar storage actually behaves too -- a real
// OTel/Prometheus exemplar store keeps a small, BOUNDED number of recent
// exemplars per bucket (often just the single most recent one, or a
// small rotating set), not because of a per-bucket uniqueness rule, but
// because of a storage cap that evicts older exemplars as new ones
// arrive. This simplified version has no such cap -- a real production
// implementation would need one to avoid unbounded memory growth on a
// hot bucket, the same category of concern already covered by this
// hub's own token-bucket and sliding-window rate-limiter subtopics
// elsewhere in this project.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'An exemplar is essentially the same thing as logging the trace ID alongside every metric data point.',
    reality: 'Metrics are AGGREGATED by design (a histogram bucket is a count, not a list of individual values) — attaching a trace ID to every single contributing observation would defeat the whole point of aggregation (bounded storage regardless of request volume). An exemplar deliberately samples a SMALL, bounded number of representative trace IDs per bucket, not every one.',
  },
  {
    thought: 'A request with no currently-active trace (a background job, a scheduled task) simply can’t be measured by a histogram with exemplar support at all.',
    reality: 'The codeTab’s own <code>record()</code> call accepts <code>activeTraceId: string | null</code> specifically to handle this case — the observation is still recorded and still counts toward the correct bucket; it simply doesn’t get an exemplar attached, since there’s no trace to link to. Metric recording and exemplar attachment are two independent steps.',
  },
  {
    thought: 'Since exemplars link a metric to a trace, they must always point to a SLOW or ERRORING request — the "interesting" ones worth investigating.',
    reality: 'The codeTab’s own bucket layout demonstrates the opposite: the 200ms bucket (fast, unremarkable requests) got exemplars too. An exemplar is a representative sample of a BUCKET, not a flag for "this was slow" — a fast-request bucket’s own exemplar is just as legitimate a click-through target as a slow one, useful for comparing what a typical request in that bucket actually looked like.',
  },
];

@Component({
  selector: 'app-obs-opentelemetry-exemplars',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './exemplars-linking-a-metric-observation-to-its-trace.html',
  styleUrl: './exemplars-linking-a-metric-observation-to-its-trace.scss',
})
export class ExemplarsLinkingAMetricObservationToItsTraceSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
