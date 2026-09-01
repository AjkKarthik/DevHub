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
    heading: 'Three Named Policies, Never Shown Deciding Anything',
    points: [
      'The main page’s own "Collector Config" codeTab configures a <code>tail_sampling</code> processor with three named policies — <code>errors-policy</code> (keep every trace containing an ERROR status), <code>slow-policy</code> (keep every trace exceeding a 1000ms latency threshold), <code>probabilistic</code> (keep a 10% sample of everything else) — but no codeTab anywhere on the page shows the actual DECISION LOGIC a Collector runs to apply these policies.',
      'The QnA on head vs. tail sampling explains precisely why this decision can only happen AFTER a trace is complete: "the decision is made after the trace is complete, when the Collector has seen all spans and knows the outcome (success/error/slow)... Requires the Collector to buffer all spans for a trace before deciding." A tail-sampling engine is fundamentally a BUFFER (spans accumulate per trace ID) plus a DECISION FUNCTION that only runs once the buffer signals the trace is done.',
      'Policy order matters, and the main page’s own config lists them in a specific sequence for a reason: checking <code>errors-policy</code> and <code>slow-policy</code> BEFORE falling back to <code>probabilistic</code> is what guarantees the two "must never miss" categories are checked unconditionally, with the random sample only ever applying to whatever’s left over — the exact opposite of checking probabilistic first and only escalating to the other two on a miss.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'A Working Tail-Sampling Buffer',
    language: 'typescript',
    code: `interface SpanRecord {
  isRoot: boolean;
  ended: boolean;
  status: 'OK' | 'ERROR';
  startTime: number;
  endTime: number;
}

class TailSamplingBuffer {
  private traces = new Map<string, { spans: SpanRecord[]; rootEnded: boolean }>();

  constructor(private latencyThresholdMs: number, private samplePercent: number) {}

  addSpan(traceId: string, span: SpanRecord) {
    if (!this.traces.has(traceId)) this.traces.set(traceId, { spans: [], rootEnded: false });
    const t = this.traces.get(traceId)!;
    t.spans.push(span);
    if (span.isRoot && span.ended) t.rootEnded = true; // trace is "complete" once its root span ends
  }

  // Matches the main page's own three policies exactly, checked in the
  // SAME order the Collector Config codeTab lists them: errors first,
  // then slow, then probabilistic as the fallback for everything else.
  decide(traceId: string, randomFn: () => number = Math.random): { keep: boolean; reason: string } | null {
    const t = this.traces.get(traceId);
    if (!t || !t.rootEnded) return null; // not ready to decide yet -- still buffering

    const hasError = t.spans.some(s => s.status === 'ERROR');
    if (hasError) return { keep: true, reason: 'errors-policy' };

    const totalDuration = Math.max(...t.spans.map(s => s.endTime)) - Math.min(...t.spans.map(s => s.startTime));
    if (totalDuration >= this.latencyThresholdMs) return { keep: true, reason: 'slow-policy' };

    return { keep: randomFn() < this.samplePercent, reason: 'probabilistic' };
  }
}

// Matches the Collector Config's own values: 1000ms threshold, 10% sample.
const buffer = new TailSamplingBuffer(1000, 0.10);

buffer.addSpan('trace-1', { isRoot: true, ended: true, status: 'OK', startTime: 0, endTime: 150 });    // fast, ok
buffer.addSpan('trace-2', { isRoot: true, ended: true, status: 'ERROR', startTime: 0, endTime: 80 });  // error
buffer.addSpan('trace-3', { isRoot: true, ended: true, status: 'OK', startTime: 0, endTime: 1500 });   // slow

console.log(buffer.decide('trace-2'));                       // error always wins
console.log(buffer.decide('trace-3'));                       // slow always wins
console.log(buffer.decide('trace-1', () => 0.5));             // 0.5 > 0.10 -> dropped
console.log(buffer.decide('trace-1', () => 0.05));            // 0.05 < 0.10 -> kept
// -> { keep: true, reason: 'errors-policy' }
// -> { keep: true, reason: 'slow-policy' }
// -> { keep: false, reason: 'probabilistic' }
// -> { keep: true, reason: 'probabilistic' }`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A trace has TWO spans: the root span completes fast (150ms) with status OK, but a CHILD span (not the root) has status ERROR. Does <code>decide()</code> correctly apply <code>errors-policy</code> and keep this trace?',
  hint: 'Look at exactly what <code>hasError</code> checks — does it only look at the root span’s own status, or every span added for that trace ID?',
  solution: `// hasError checks t.spans.some(s => s.status === 'ERROR') -- ALL spans
// added under that traceId, not just the root. A child span with status
// ERROR is included in that check regardless of the root span's own
// (OK) status.
//
// buffer.addSpan('trace-4', { isRoot: true, ended: true, status: 'OK', startTime: 0, endTime: 150 });
// buffer.addSpan('trace-4', { isRoot: false, ended: true, status: 'ERROR', startTime: 20, endTime: 60 });
// buffer.decide('trace-4') -> { keep: true, reason: 'errors-policy' }
//
// This correctly matches real-world tail sampling intent: a request
// where the ROOT handler returns 200 OK but an internal call to a
// downstream service failed (and was perhaps retried successfully) is
// exactly the kind of trace an SRE wants to inspect -- the root status
// alone would have hidden a real, if recovered-from, failure.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Tail sampling decides whether to keep a trace the moment the FIRST span for that trace arrives, the same way head sampling does.',
    reality: 'The whole point of tail sampling, per the page’s own QnA, is that the decision waits until the trace is COMPLETE — the buffer’s <code>rootEnded</code> flag is exactly this gate. Calling <code>decide()</code> before the root span has ended correctly returns <code>null</code> ("not ready to decide yet"), since the outcome (error? how slow?) genuinely isn’t knowable until then.',
  },
  {
    thought: 'The order the three policies are checked in doesn’t matter — as long as all three conditions are eventually evaluated, the trace ends up with the same keep/drop outcome regardless of sequence.',
    reality: 'The Try It above demonstrates why order matters directly: <code>hasError</code> is checked FIRST and returns immediately if true, guaranteeing every error trace is kept regardless of speed. If <code>probabilistic</code> were checked first instead, a 10%-sampled-out error trace would be dropped before the errors-policy check ever ran — exactly the "never miss an error trace" guarantee the page’s own QnA promises tail sampling can provide.',
  },
  {
    thought: 'A tail-sampling Collector needs to buffer EVERY span for EVERY trace indefinitely, since it can never know in advance which traces will turn out to be errors or slow.',
    reality: 'The buffer only needs to hold a trace’s spans until its root span ends (the <code>rootEnded</code> signal) — at that point a decision is made and the buffered spans can be forwarded (kept) or discarded (dropped) and removed from memory. This is exactly why the page’s own QnA calls out "higher memory usage" as tail sampling’s real cost, not "unbounded memory usage" — the buffering window is bounded by how long a single trace takes to complete, not by the whole system’s uptime.',
  },
];

@Component({
  selector: 'app-obs-opentelemetry-tail-sampling',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './a-tail-sampling-decision-engine.html',
  styleUrl: './a-tail-sampling-decision-engine.scss',
})
export class ATailSamplingDecisionEngineSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
