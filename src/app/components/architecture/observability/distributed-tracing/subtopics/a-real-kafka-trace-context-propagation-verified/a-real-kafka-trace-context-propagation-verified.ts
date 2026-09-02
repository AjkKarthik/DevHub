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
    heading: 'Proving the Producer and Consumer Really Share One Trace',
    points: [
      'The main page’s own QnA on Kafka tracing describes the exact API calls needed — <code>propagation.inject()</code> on the producer side, <code>propagation.extract()</code> on the consumer side — but never runs them, so the reader has to trust the description on faith. Both calls, and the <code>SpanKind.CONSUMER</code>/<code>tracer.startSpan(name, options, context)</code> signature the QnA describes, were confirmed to be real, current <code>@opentelemetry/api</code> calls by executing them directly.',
      'The genuinely interesting verification isn’t just "does the code run without throwing" — it’s confirming the two spans, created in what are effectively two SEPARATE, unrelated function calls (simulating the producer process and the later, independent consumer process), actually end up sharing the same <code>traceId</code>, and that the consumer span’s parent is genuinely the producer span, purely because of the header-carrier round trip and nothing else.',
      'This matters because Kafka genuinely breaks the DEFAULT context propagation the rest of this page’s theory relies on — there’s no shared in-process call stack or automatic HTTP header forwarding once a message sits in a topic between being produced and consumed; the trace link has to be reconstructed EXPLICITLY from data carried inside the message itself.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Producer and Consumer, Verified to Share a Trace',
    language: 'typescript',
    code: `import * as api from '@opentelemetry/api';
import { NodeTracerProvider, InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';

const exporter = new InMemorySpanExporter();
const provider = new NodeTracerProvider({ spanProcessors: [new SimpleSpanProcessor(exporter)] });
provider.register();

const tracer = api.trace.getTracer('kafka-demo');

// ── PRODUCER SIDE ──────────────────────────────────────────────────
function publishOrderEvent(): Record<string, string> {
  return tracer.startActiveSpan('publish order.created', (span) => {
    const messageHeaders: Record<string, string> = {};
    api.propagation.inject(api.context.active(), messageHeaders);
    span.end();
    return messageHeaders; // these headers are what actually gets sent on the Kafka message
  });
}

// ── CONSUMER SIDE (runs later, in a completely separate function call --
// simulating a different process reading the message off the topic) ──
function consumeOrderEvent(messageHeaders: Record<string, string>) {
  const extractedContext = api.propagation.extract(api.ROOT_CONTEXT, messageHeaders);
  const span = tracer.startSpan('process.message', { kind: api.SpanKind.CONSUMER }, extractedContext);
  span.end();
  return span;
}

const headers = publishOrderEvent();
consumeOrderEvent(headers);

const spans = exporter.getFinishedSpans();
const producerSpan = spans.find(s => s.name === 'publish order.created')!;
const consumerSpan = spans.find(s => s.name === 'process.message')!;

console.log('producer traceId:', producerSpan.spanContext().traceId);
console.log('consumer traceId:', consumerSpan.spanContext().traceId);
console.log('traceIds match?', producerSpan.spanContext().traceId === consumerSpan.spanContext().traceId);
console.log('consumer\\'s parent === producer\\'s spanId?',
  consumerSpan.parentSpanContext?.spanId === producerSpan.spanContext().spanId);
// -> producer traceId: 499ed0af2065cf06597a7e612a8044a7
// -> consumer traceId: 499ed0af2065cf06597a7e612a8044a7
// -> traceIds match? true
// -> consumer's parent === producer's spanId? true`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The <code>messageHeaders</code> object returned by <code>publishOrderEvent()</code> is passed directly, in-process, straight to <code>consumeOrderEvent()</code> — no actual Kafka broker, no real network hop, no serialization to bytes and back. Does that mean this demo hasn’t really proven anything about how the pattern would behave against a real Kafka topic?',
  hint: 'Consider exactly what <code>propagation.inject()</code> and <code>propagation.extract()</code> actually operate on — plain string key-value pairs — and what a real Kafka client library needs to do with that same object to get it onto and off of a real message.',
  solution: `// It's proven the part that's genuinely easy to get wrong -- the
// propagation.inject()/extract() round trip correctly reconstructing
// the SAME trace ID and parent-child link across two independent
// function calls with no shared execution context between them. That's
// the actual mechanism the QnA describes, and it works exactly as
// claimed.
//
// What ISN'T proven here is the surrounding plumbing: a real Kafka
// client needs to take the plain string key-value pairs in
// messageHeaders and place them into the message's own headers field
// (most Kafka client libraries, like kafkajs, accept headers as a
// Record<string, Buffer | string> alongside the message value) --
// and the consumer needs to read those SAME headers back out of the
// received message before calling propagation.extract(). That
// serialization/transport step is real Kafka-client-library code this
// demo deliberately skips, since it varies by which client library is
// in use -- but it's a mechanical "move this object's data onto and off
// of a message," not a risk to the trace-linking logic itself, which is
// exactly the part this demo DID verify end-to-end.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since the consumer span correctly shows the producer span as its parent, this means the consumer span is a CHILD span of the same type as any other synchronous call — like a database query span nested under an HTTP request span.',
    reality: 'The main page’s own QnA is explicit about this distinction: crossing a queue boundary in time produces a LINKED trace via the parent-child relationship, not the same kind of nested, synchronous parent-child span you’d get from an in-process function call. Structurally the data (traceId, parentSpanId) looks identical either way — the meaningful difference is that a real gap of unknown, possibly large duration exists between when the producer span ended and when the consumer span started, which a tracing UI typically visualizes differently from two spans that overlap or immediately follow each other in the same request.',
  },
  {
    thought: 'The <code>SpanKind.CONSUMER</code> passed to <code>tracer.startSpan()</code> only affects how the span is LABELED or displayed in a UI — it has no functional effect on the trace-linking mechanism itself.',
    reality: 'That’s correct as far as this SPECIFIC demo’s trace-linking behavior goes (the <code>traceId</code>/parent-child link would work identically with any <code>SpanKind</code> value, or none at all) — but <code>SpanKind</code> is a real, standard part of the OTel data model precisely so tracing backends CAN treat producer/consumer spans specially in their own UI and analysis (for example, correctly rendering the "gap" between a producer and consumer span as message-queue latency rather than treating it as a timing anomaly) — it’s cosmetic to THIS verification, not to the system as a whole.',
  },
  {
    thought: 'Since both <code>publishOrderEvent()</code> and <code>consumeOrderEvent()</code> share the same <code>tracer</code> variable in this demo, that’s what actually links their spans into one trace — a real producer and consumer, running in genuinely separate services with their own separate tracer instances, wouldn’t be able to share a trace this way.',
    reality: 'The <code>tracer</code> variable being shared in this demo is purely a code-reuse convenience, not the actual linking mechanism — the trace link is established ENTIRELY through the <code>traceId</code>/<code>parentSpanId</code> data carried inside <code>messageHeaders</code> via <code>inject()</code>/<code>extract()</code>. Two completely separate services, each with their own independently-configured <code>TracerProvider</code> and <code>tracer</code> instance, link their spans into the same trace through exactly this same header-carrier mechanism — sharing a <code>traceId</code> value, not a <code>tracer</code> object.',
  },
];

@Component({
  selector: 'app-obs-distributed-tracing-kafka-propagation',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './a-real-kafka-trace-context-propagation-verified.html',
  styleUrl: './a-real-kafka-trace-context-propagation-verified.scss',
})
export class ARealKafkaTraceContextPropagationVerifiedSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
