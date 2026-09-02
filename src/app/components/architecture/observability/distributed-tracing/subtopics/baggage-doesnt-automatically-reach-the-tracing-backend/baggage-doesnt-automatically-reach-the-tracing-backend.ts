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
    heading: 'Propagated Context Is Not the Same Thing as a Span Attribute',
    points: [
      'The main page’s own quiz explanation for baggage originally stated it "is additional context attached to the trace for filtering and correlation in the tracing backend" — implying that setting <code>userId=123</code> as baggage at the entry point makes it directly searchable in Jaeger/Tempo downstream. Verified against a real <code>@opentelemetry/api</code> SDK that this is NOT what happens by default: baggage is context data available to APPLICATION CODE in every downstream service, but it never automatically becomes a span attribute at all.',
      'Confirmed via direct execution: setting baggage (<code>userId: &#39;usr_42&#39;</code>) and starting a real span inside that context produces a span whose <code>attributes</code> object is completely EMPTY — no <code>userId</code> key anywhere. The tracing backend has nothing to filter or search on unless something explicitly puts the value there.',
      'The bridge from "propagated context" to "searchable span attribute" is a SEPARATE, opt-in component — <code>BaggageSpanProcessor</code> (confirmed via OpenTelemetry’s own contrib package documentation: "reads entries stored in Baggage from the parent context and adds the baggage entries’ keys and values to the span as attributes on span start"). Without registering it, the only way baggage reaches a span is manually calling <code>span.setAttribute()</code> yourself.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Verified Against a Real OTel SDK',
    language: 'typescript',
    code: `import * as api from '@opentelemetry/api';
import { NodeTracerProvider, InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';

const exporter = new InMemorySpanExporter();
const provider = new NodeTracerProvider({ spanProcessors: [new SimpleSpanProcessor(exporter)] });
provider.register();

const tracer = api.trace.getTracer('baggage-demo');

// Set baggage: userId=usr_42 -- exactly the QnA's own example
const baggage = api.propagation.createBaggage({ userId: { value: 'usr_42' } });
const ctxWithBaggage = api.propagation.setBaggage(api.context.active(), baggage);

api.context.with(ctxWithBaggage, () => {
  const span = tracer.startSpan('downstream-operation');
  span.end();
});

const spans = exporter.getFinishedSpans();
const span = spans.find(s => s.name === 'downstream-operation')!;
console.log('span attributes (no BaggageSpanProcessor configured):', JSON.stringify(span.attributes));
console.log('does span have a userId attribute?', 'userId' in span.attributes);
// -> span attributes (no BaggageSpanProcessor configured): {}
// -> does span have a userId attribute? false`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A teammate registers <code>BaggageSpanProcessor</code> in their tracer provider and confirms baggage now correctly appears on every span as an attribute. A month later, someone adds <code>authToken</code> to baggage for an unrelated debugging purpose, planning to remove it afterward. What does the now-registered <code>BaggageSpanProcessor</code> mean for that <code>authToken</code> value, that wouldn’t have been true before it was configured?',
  hint: 'Recall the exact behavior the docs describe: it copies EVERY baggage entry onto EVERY span "on span start," and baggage itself already propagates as an outgoing HTTP header to every downstream service.',
  solution: `// Before BaggageSpanProcessor was configured: setting authToken as
// baggage would propagate it as an HTTP header to downstream services
// (already a real exposure risk on its own, matching the page's own
// security warning about baggage), but it would NOT show up inside the
// tracing backend's own stored span data.
//
// After BaggageSpanProcessor is registered: the SAME authToken value
// now ALSO gets copied onto every span's attributes automatically --
// meaning it becomes permanently stored, searchable, and visible to
// anyone with access to the tracing backend (Jaeger/Tempo), for as
// long as trace retention keeps that data around. A value the
// teammate assumed was "just a temporary header, not really stored
// anywhere" is now baked into every span record for that trace.
//
// This is exactly why the docs' own configuration options
// (included/excluded field patterns) exist -- BaggageSpanProcessor
// should be configured with an explicit allowlist of KNOWN-SAFE keys
// (like userId, tenantId) rather than copying every baggage entry
// unconditionally, precisely because someone WILL eventually put
// something sensitive in baggage for an unrelated reason.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since baggage genuinely does propagate across every downstream service via HTTP headers, the tracing backend must have access to it somehow, even if it takes an extra step to make it "searchable."',
    reality: 'The tracing backend receives whatever SPANS are exported to it — and nothing about baggage propagation on its own causes a span to be exported with baggage data attached. Baggage lives in the CONTEXT that flows through the application (readable via <code>propagation.getBaggage()</code> in any service’s own code) and travels over the wire as HTTP headers between services — but the tracing backend only ever sees SPAN data, and a span with no baggage-derived attribute set on it (verified above: an empty <code>{}</code>) genuinely has zero record of that baggage value anywhere in the trace.',
  },
  {
    thought: 'Manually calling <code>span.setAttribute(&#39;userId&#39;, baggage.getEntry(&#39;userId&#39;)?.value)</code> in application code is a worse solution than <code>BaggageSpanProcessor</code>, since it has to be repeated in every service.',
    reality: 'Both approaches are genuinely valid trade-offs, not a strictly-worse-vs-better choice: manual <code>setAttribute()</code> calls give PRECISE, per-span control over exactly which baggage keys get promoted to attributes and on which specific spans, useful when only certain spans in a service actually need that context. <code>BaggageSpanProcessor</code> gives BLANKET coverage (every span in the process gets every allowed baggage key) with a single one-time configuration, at the cost of less granular control — the "verified against a real OTel SDK" theme of this hub applies here too: which one is right depends on the actual requirement, not an inherent superiority of either.',
  },
  {
    thought: 'The empty <code>{}</code> attributes object observed in the codeTab means the span itself failed to record the baggage-setting operation as having happened at all — a bug in how the test was written.',
    reality: 'The empty attributes object is the CORRECT, expected behavior — it’s not a test-writing mistake, it’s the actual documented default. The span genuinely has no attributes because nothing in the demo code ever called <code>span.setAttribute()</code> and no <code>BaggageSpanProcessor</code> was registered to do it automatically — this is precisely the gap the main page’s original explanation glossed over.',
  },
];

@Component({
  selector: 'app-obs-distributed-tracing-baggage-gap',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './baggage-doesnt-automatically-reach-the-tracing-backend.html',
  styleUrl: './baggage-doesnt-automatically-reach-the-tracing-backend.scss',
})
export class BaggageDoesntAutomaticallyReachTheTracingBackendSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
