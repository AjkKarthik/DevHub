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
  templateUrl: './monitoreventloopdelay-is-a-purpose-built-lag-histogram.html',
  styleUrl: './monitoreventloopdelay-is-a-purpose-built-lag-histogram.scss'
})
export class MonitoreventloopdelayIsAPurposeBuiltLagHistogramSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own EventLoopMonitor challenge builds event loop lag measurement by hand, comparing expected vs. actual setInterval fire times — a completely valid teaching exercise, but worth knowing Node.js ships a purpose-built API that does the same job with richer, more precise output, with zero custom bookkeeping code required',
      points: [
        'node:perf_hooks exports monitorEventLoopDelay([options]), which returns a Histogram object tracking event loop delay automatically once you call its .enable() method. Instead of one number, it exposes .mean, .min, .max, .stddev, and .percentile(n) for any percentile you ask for — the same p99-style statistic the main page\'s own challenge asks you to compute by hand from a rolling sample buffer, provided natively.',
        'Per Node\'s own documentation, by default the histogram "is updated by a timer using the configured resolution" (a configurable sampling interval, default 10ms) — a purpose-built internal mechanism, distinct from a general-purpose application-level setInterval callback competing with the rest of your app\'s code for the event loop\'s attention. An optional samplePerIteration: true setting switches to per-iteration sampling using libuv\'s own prepare/check hooks for even finer-grained measurement.',
        'This is not framed in Node\'s own docs as an explicit "use this instead of a manual setInterval-based measurement" recommendation — that specific comparison isn\'t something the documentation states outright. But it IS Node\'s own purpose-built, first-class API for exactly this measurement, requiring no custom rolling-buffer bookkeeping, percentile-sorting logic, or manual timer drift math — all of which the main page\'s own challenge asks you to hand-write.',
      ]
    },
    {
      heading: 'How this maps onto the main page\'s own EventLoopMonitor challenge',
      points: [
        'Every piece of custom state the challenge\'s solution manually maintains — this._samples (a rolling array), the sort-and-index math for p99, this._lag (the current value) — has a direct, built-in equivalent: histogram.percentile(99), histogram.mean, histogram.max, and histogram.min are computed for you, continuously, without manually managing a buffer size or eviction.',
        'A genuinely useful pattern for a health-check endpoint (matching the main page\'s own "expose as a health metric" mistake-fix): call histogram.reset() periodically (e.g., once per health-check window) to get fresh statistics for just that window, rather than an ever-growing all-time average — giving a rolling picture similar in spirit to the challenge\'s own 60-sample rolling buffer, but without maintaining that buffer by hand.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own approach, reimplemented with monitorEventLoopDelay()',
      language: 'typescript',
      code: `import { monitorEventLoopDelay } from 'node:perf_hooks';

// One line replaces the challenge's entire custom rolling-buffer
// class — enable() starts continuous background measurement.
const histogram = monitorEventLoopDelay({ resolution: 20 }); // ms
histogram.enable();

app.get('/health', (req, res) => {
  res.json({
    ok: histogram.mean / 1e6 < 500, // nanoseconds -> ms
    eventLoopLagMs: {
      mean: (histogram.mean / 1e6).toFixed(1),
      max:  (histogram.max  / 1e6).toFixed(1),
      p99:  (histogram.percentile(99) / 1e6).toFixed(1),
    },
  });
  // Note: all histogram values are reported in NANOSECONDS —
  // divide by 1e6 to get milliseconds, an easy detail to miss.
});

// Reset periodically for a fresh "recent window" view, similar in
// spirit to the main page's own 60-sample rolling buffer:
setInterval(() => histogram.reset(), 60_000);`,
    },
    {
      label: 'Side by side: what each approach requires you to build',
      language: 'typescript',
      code: `// The main page's own hand-rolled approach requires maintaining:
// - a rolling array of samples (with manual eviction past 60 entries)
// - manual sort-and-index math for percentile calculation
// - a setInterval callback that IS ITSELF part of the application
//   code competing for event loop time, rather than an internal,
//   dedicated Node.js measurement mechanism
class EventLoopMonitor extends EventEmitter {
  // ~30 lines of custom bookkeeping (see the main page's own
  // challenge solution) to reproduce roughly what histogram gives
  // for free below.
}

// monitorEventLoopDelay() requires none of that bookkeeping:
const histogram = monitorEventLoopDelay();
histogram.enable();
// .mean, .min, .max, .stddev, .percentile(n) — all maintained
// internally by Node itself, updated on a dedicated sampling
// mechanism (a configurable-resolution timer by default, or
// libuv prepare/check-hook-based per-iteration sampling with
// samplePerIteration: true) — no manual buffer, no manual math.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer implements the main page\'s own EventLoopMonitor challenge exactly as specified, ships it to production, and later discovers a teammate independently added node:perf_hooks\'s monitorEventLoopDelay() to a different service, exposing nearly the same { mean, max, p99 } shape on ITS health endpoint. The developer argues their hand-rolled version should be kept because "it\'s already built and tested." What is a concrete, technical reason to prefer consolidating on monitorEventLoopDelay() instead, beyond just "less code to maintain"?',
    hint: 'Where does the hand-rolled version\'s OWN measurement callback (the setInterval in the challenge\'s solution) run — is it exempt from the very event loop congestion it\'s trying to measure, or does it compete for the same event loop time as everything else in the app?',
    solution: 'A concrete, technical reason beyond "less code": the hand-rolled EventLoopMonitor\'s own measurement mechanism is itself an application-level setInterval callback — meaning it is subject to the EXACT SAME event loop contention it is trying to measure, competing for the same event loop time as every other piece of application code. Under sufficiently severe event loop blocking, the measurement callback itself could be delayed in ways that distort its own readings, an inherent limitation of measuring the event loop FROM WITHIN ordinary application-scheduled code. monitorEventLoopDelay(), by contrast, is updated through Node\'s own internal, purpose-built sampling mechanism (a dedicated timer at a configurable resolution by default, or an even more precise libuv prepare/check-hook-based per-iteration mode) — separate machinery from ordinary application `setInterval`/`setTimeout` scheduling, giving it a more architecturally sound measurement path for exactly this purpose. This isn\'t about the hand-rolled version being "wrong" or badly built — it genuinely does teach the underlying concept the main page\'s challenge is designed to convey — but for a PRODUCTION health-check metric specifically, consolidating on Node\'s own purpose-built API removes both the measurement-quality question and the ongoing maintenance burden of custom percentile/rolling-buffer logic.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Node.js has no built-in API for measuring event loop lag/delay — the main page\'s own EventLoopMonitor challenge, hand-rolling this with setInterval and a rolling sample buffer, represents the standard way to do this in Node.js.',
      reality: 'This subtopic\'s theory and code example both show the opposite — node:perf_hooks ships monitorEventLoopDelay(), a purpose-built histogram API providing .mean, .min, .max, .stddev, and .percentile(n) natively, requiring no custom rolling-buffer or percentile-calculation code.'
    },
    {
      thought: 'monitorEventLoopDelay()\'s histogram values (.mean, .max, .percentile()) are reported in milliseconds, the same unit the main page\'s own hand-rolled lag calculations use.',
      reality: 'This subtopic\'s code example shows the opposite — Node\'s API reports these values in NANOSECONDS, requiring division by 1e6 to get milliseconds, an easy-to-miss unit mismatch when porting code from a millisecond-based manual implementation.'
    },
    {
      thought: 'Node\'s own documentation explicitly recommends using monitorEventLoopDelay() instead of a manual setInterval-based lag measurement, positioning the hand-rolled approach as deprecated or discouraged.',
      reality: 'This subtopic\'s theory is careful to note the opposite — Node\'s docs do not make this explicit comparison or recommendation anywhere; monitorEventLoopDelay() is simply Node\'s own purpose-built API for the job, which is a good reason to prefer it, but not because the documentation says so directly.'
    }
  ];
}
