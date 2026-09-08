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
    heading: 'Knowing WHY a Trace ID Looks the Way It Does',
    points: [
      'The main page’s own "Operational Log Hygiene" theory bullet states the rule precisely: "always extract from inbound request headers first; generate only if missing. Log the extraction source (header vs generated) to help debug propagation failures" — but no codeTab on this page ever builds this. The sibling Structured Logging topic’s own subtopic on the middleware’s `traceparent` header bug already built and verified the CORRECT extraction half (splitting a W3C `traceparent` header to get just its 32-hex trace-id segment) — this subtopic reuses that exact technique and adds the missing piece: recording which path was actually taken.',
      'Why the source matters operationally: a trace ID that was EXTRACTED from an inbound header means this request is genuinely part of a larger, already-started distributed trace — some upstream caller propagated it. A trace ID that was GENERATED means this service is the ENTRY POINT for this particular trace — no upstream caller sent one at all. Distinguishing the two after the fact (during an incident, reading logs) tells you whether "why doesn’t this trace ID show up in the upstream service’s logs" is even a sensible question to ask.',
      'This is a genuinely different problem from simply having a trace ID at all — a log line with a well-formed 32-hex `traceId` field looks identical whether it came from a real upstream trace or was freshly minted for a request that started right here, unless the extraction source is recorded as its own explicit field.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Extraction Source, Logged Explicitly',
    language: 'typescript',
    code: `interface TraceContext { traceId: string; source: 'header' | 'generated' }

function extractOrGenerateTraceId(headers: Record<string, string | undefined>): TraceContext {
  const traceparent = headers['traceparent'];
  if (traceparent) {
    // Reuse the fix from the Structured Logging topic's own subtopic --
    // split the compound W3C header, take just the trace-id segment.
    const traceId = traceparent.split('-')[1];
    return { traceId, source: 'header' };
  }
  return { traceId: crypto.randomUUID(), source: 'generated' };
}

// Case 1: an upstream service DID propagate a real W3C traceparent header
const ctx1 = extractOrGenerateTraceId({
  traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
});
console.log('Case 1 (header present):', ctx1);

// Case 2: no upstream caller propagated anything -- this service is the entry point
const ctx2 = extractOrGenerateTraceId({});
console.log('Case 2 (header missing):', { ...ctx2, traceId: ctx2.traceId.slice(0, 8) + '...' });

// Every log line for this request includes ctx.source alongside ctx.traceId:
logger.info({ traceId: ctx1.traceId, traceIdSource: ctx1.source }, 'Request started');
// -> Case 1 (header present): { traceId: '4bf92f3577b34da6a3ce929d0e0e4736', source: 'header' }
// -> Case 2 (header missing): { traceId: 'xxxxxxxx...', source: 'generated' }`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'During an incident, a log line shows <code>{ traceId: &#39;a1b2c3...&#39;, traceIdSource: &#39;generated&#39; }</code> for a request to <code>order-service</code>. A teammate spends 20 minutes searching <code>api-gateway</code>’s logs for that exact <code>traceId</code>, assuming it must be there since <code>order-service</code> is normally called through the gateway. What does the <code>traceIdSource</code> field already tell them, and how would checking it first have saved the search?',
  hint: 'What does <code>source: &#39;generated&#39;</code> mean about whether ANY upstream service — including <code>api-gateway</code> — ever saw or propagated this specific trace ID at all?',
  solution: `// "generated" means order-service itself minted this trace ID because
// NO inbound traceparent header was present on the request it received
// -- which means no upstream caller (api-gateway or otherwise)
// propagated a trace context for this request at all.
//
// If api-gateway HAD called order-service as part of a normal, traced
// request flow, the header would have been present and source would be
// 'header' instead. A 'generated' source is a direct signal that this
// specific trace ID is LOCAL to order-service and was never seen by any
// other service -- searching api-gateway's logs for it isn't just
// unlikely to succeed, it's GUARANTEED not to succeed, since api-gateway
// never had this identifier in the first place.
//
// The 20 minutes were spent searching for evidence that structurally
// cannot exist -- checking traceIdSource FIRST turns "search elsewhere
// and see if you get lucky" into "this trace ID never left this
// service, look here for the real cause instead" in one field read.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A <code>source: &#39;generated&#39;</code> trace ID always indicates a problem — either a missing header propagation bug somewhere upstream, or a client that isn’t implementing distributed tracing correctly.',
    reality: 'It’s expected and correct behavior for the FIRST service in any request chain — a public API gateway receiving a fresh request directly from an external client, a scheduled batch job with no "upstream caller" at all, or a webhook handler receiving a third-party callback all legitimately have no <code>traceparent</code> header to extract, because there genuinely is no upstream trace context yet. <code>source: &#39;generated&#39;</code> becomes suspicious specifically when it shows up on a service that SHOULD only ever be called internally, from another service in the same system that’s expected to already be propagating trace context.',
  },
  {
    thought: 'Since <code>extractOrGenerateTraceId()</code> already reuses the verified `.split(&#39;-&#39;)[1]` extraction from the Structured Logging topic, this function inherits full protection against a malformed or missing <code>traceparent</code> header automatically.',
    reality: 'It inherits protection against a MISSING header (the <code>if (traceparent)</code> check correctly falls through to generation) but not against a MALFORMED one — a header present but not shaped like a real W3C traceparent value (missing dashes, too few segments) would still take the <code>&#39;header&#39;</code> branch and produce a garbage or <code>undefined</code> <code>traceId</code> from <code>.split(&#39;-&#39;)[1]</code>, silently mislabeled as a legitimate extracted trace ID rather than falling back to generation.',
  },
  {
    thought: 'Recording <code>traceIdSource</code> on every log line roughly doubles the log volume dedicated to trace correlation, since it’s a whole extra field alongside <code>traceId</code> itself.',
    reality: '<code>traceIdSource</code> is a single-word enum value (<code>&#39;header&#39;</code> or <code>&#39;generated&#39;</code>, 6-9 characters) added once per log line, while <code>traceId</code> itself is already a 32-character hex string — the additional field is a small fraction of the existing trace-correlation overhead, not a doubling of it, and it’s exactly the kind of low-cardinality, cheap-to-add context this hub’s own Structured Logging topic already recommends including on every request log.',
  },
];

@Component({
  selector: 'app-obs-log-best-practices-correlation-source',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './logging-which-path-correlation-id-extraction-took.html',
  styleUrl: './logging-which-path-correlation-id-extraction-took.scss',
})
export class LoggingWhichPathCorrelationIdExtractionTookSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
