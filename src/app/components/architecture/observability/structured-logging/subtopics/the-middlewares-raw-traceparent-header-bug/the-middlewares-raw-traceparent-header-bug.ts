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
    heading: 'The Middleware Stores a Compound Header as a Single-Value Field',
    points: [
      'The main page’s own "Pino Setup" codeTab reads <code>req.headers[&#39;traceparent&#39;]</code> directly and stores it AS <code>traceId</code> — but a W3C traceparent header isn’t a bare trace ID at all. Its official format is <code>version-trace_id-parent_id-trace_flags</code>, and the SAME page’s own "Log Schema" codeTab example, <code>traceId: &#39;4bf92f3577b34da6a3ce929d0e0e4736&#39;</code>, is a bare 32-hex-character value with none of those other segments — this is, in fact, the EXACT trace-id segment from the W3C Trace Context specification’s own official example header, confirmed directly against the spec.',
      'The full official example header is <code>00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01</code> — 55 characters including three dashes and a parent-id/flags segment that have nothing to do with the trace identity itself. Storing this ENTIRE string as <code>traceId</code> means every log line would carry a 55-character compound value instead of the clean 32-hex-character ID the page’s own schema documents and the rest of the observability stack (traces, the Log Schema example, Loki queries filtering on <code>traceId</code>) expects.',
      'The fix is a one-line extraction: split the header on <code>-</code> and take the second segment (index 1) — the version is index 0, trace-id is index 1, parent-id is index 2, flags is index 3.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Reproduced Against the W3C Spec’s Own Example',
    language: 'typescript',
    code: `// The W3C Trace Context spec's own official example header --
// https://www.w3.org/TR/trace-context/#traceparent-header
const traceparentHeader = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';

// ── BROKEN: matches the main page's ORIGINAL middleware ─────────────
const brokenTraceId = traceparentHeader; // stores the WHOLE header
console.log('broken traceId:', brokenTraceId, '(length', brokenTraceId.length + ')');

// ── FIXED: extract just the trace-id segment ─────────────────────────
const fixedTraceId = traceparentHeader.split('-')[1];
console.log('fixed traceId: ', fixedTraceId, '(length', fixedTraceId.length + ')');

// Confirms the fixed value matches the page's OWN "Log Schema" codeTab
// example exactly:
console.log('matches page\\'s own Log Schema example?',
  fixedTraceId === '4bf92f3577b34da6a3ce929d0e0e4736');
// -> broken traceId: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01 (length 55)
// -> fixed traceId:  4bf92f3577b34da6a3ce929d0e0e4736 (length 32)
// -> matches page's own Log Schema example? true`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A request arrives with NO <code>traceparent</code> header at all (a client that doesn’t implement W3C Trace Context, or a direct internal call that skips it). Trace through the fixed line — <code>const traceId = traceparent?.split(&#39;-&#39;)[1] ?? crypto.randomUUID();</code> — what does <code>traceId</code> end up being?',
  hint: 'The optional-chaining operator <code>?.</code> short-circuits to <code>undefined</code> the moment <code>traceparent</code> itself is <code>undefined</code> — trace what happens to the rest of the expression from there.',
  solution: `// traceparent?.split('-')[1] evaluates to undefined when traceparent
// is undefined -- optional chaining short-circuits the ENTIRE chained
// expression (.split('-')[1] never actually runs) rather than throwing
// or producing some partial result.
//
// The nullish-coalescing fallback (?? crypto.randomUUID()) then kicks
// in, since undefined is exactly the kind of value ?? falls through on
// -- so traceId ends up being a freshly-generated UUID instead.
//
// This UUID is a 36-character string (32 hex digits + 4 hyphens from
// crypto.randomUUID()'s own format), which is NOT the same 32-hex-char
// shape as a real W3C trace-id -- but that's an acceptable, deliberate
// trade-off here: it's a synthetic fallback specifically for requests
// that never had real distributed-trace context to begin with, not a
// value meant to correlate with any actual trace elsewhere in the
// system.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'This bug would only matter for teams actually running distributed tracing — a service with no tracing backend configured at all wouldn’t be affected.',
    reality: 'The bug affects LOG queryability regardless of whether tracing is wired up: every log line emitted from a request carrying a traceparent header would have a 55-character compound value in its <code>traceId</code> field instead of the documented 32-hex format, breaking any Loki/Elasticsearch query written against the page’s own documented schema (<code>{service=&#39;order-service&#39;} | json | traceId=&#39;4bf92f3577b34da6a3ce929d0e0e4736&#39;</code> would never match), independent of whether a trace backend is present to correlate with.',
  },
  {
    thought: 'Since the middleware’s fallback path (<code>crypto.randomUUID()</code>) was always correct, the bug only affects requests that arrive WITH a real traceparent header — which might be rare in an internal-only service.',
    reality: 'The opposite is true: a service that genuinely propagates W3C trace context between services (the exact scenario the page’s own theory section describes — "traceId (W3C trace context or correlation ID)" as a required field) would have MOST inter-service requests carrying a real traceparent header, meaning the buggy path is the COMMON case, not the edge case, for any service actually participating in distributed tracing.',
  },
  {
    thought: 'Extracting the trace-id segment via <code>.split(&#39;-&#39;)[1]</code> is fragile — it would break if a future version of the traceparent spec changed the header’s format.',
    reality: 'The W3C Trace Context specification’s <code>version-trace_id-parent_id-trace_flags</code> structure is a stable, versioned wire format — the leading <code>version</code> segment exists specifically so a NEW format could be introduced under a different version number without breaking parsers written against the current one; a version-00 header will always have exactly this four-segment, dash-delimited shape by the spec’s own design.',
  },
];

@Component({
  selector: 'app-obs-structured-logging-traceparent-bug',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-middlewares-raw-traceparent-header-bug.html',
  styleUrl: './the-middlewares-raw-traceparent-header-bug.scss',
})
export class TheMiddlewaresRawTraceparentHeaderBugSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
