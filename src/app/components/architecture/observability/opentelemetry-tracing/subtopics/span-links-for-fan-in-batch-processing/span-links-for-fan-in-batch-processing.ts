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
    heading: 'Links: The Span Field the Page Names but Never Uses',
    points: [
      'One of the page’s own quiz explanations lists <code>links (references to other traces)</code> as part of what a span captures, right alongside attributes and events — but neither code tab, neither mistake block, nor either QnA answer ever creates one. Links are OTel’s answer to a shape the rest of the page’s content (all built around parent-child spans) can’t express: a single span that genuinely doesn’t have exactly one parent.',
      'The canonical case is fan-in batch processing — a worker that dequeues several messages, each one belonging to a DIFFERENT, unrelated trace (a different customer request, a different producer call), and processes them together in one batch span. That batch span cannot correctly be a "child" of all three origin traces — a span has at most one parent — so instead it Links to each origin trace’s span context, preserving the connection without pretending there’s a single parent-child relationship.',
      'Confirmed directly with a real OTel SDK and an in-memory exporter: a span created via <code>tracer.startSpan(name, { links: [...] })</code>, given three unrelated origin span contexts, exports with <code>parentSpanContext</code> genuinely absent (no single parent, correctly) while its own <code>links</code> array carries all three origin trace IDs intact.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'A Batch Span Linked to Three Unrelated Traces',
    language: 'typescript',
    code: `import * as api from '@opentelemetry/api';
import { NodeTracerProvider, InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';

const exporter = new InMemorySpanExporter();
const provider = new NodeTracerProvider({ spanProcessors: [new SimpleSpanProcessor(exporter)] });
provider.register();
const tracer = api.trace.getTracer('batch-worker');

async function main() {
  // Simulate 3 unrelated producer traces -- each one a separate,
  // independent request/publish that happened to land in the same queue
  const originSpanContexts: api.SpanContext[] = [];
  for (let i = 0; i < 3; i++) {
    await tracer.startActiveSpan(\`producer.publish.\${i}\`, (span) => {
      originSpanContexts.push(span.spanContext());
      span.end();
    });
  }

  exporter.reset();

  // A batch span with NO single parent -- linked to all 3 origins instead
  const batchSpan = tracer.startSpan('batch.process', {
    links: originSpanContexts.map(sc => ({ context: sc })),
  });
  batchSpan.end();

  const [exported] = exporter.getFinishedSpans();
  console.log('batch span parent:', exported.parentSpanContext?.spanId ?? 'none (correct — no single parent)');
  console.log('links attached:', exported.links.length);
  console.log('link traceIds match origins:',
    exported.links.every((l, i) => l.context.traceId === originSpanContexts[i].traceId));
}
main();
// -> batch span parent: none (correct — no single parent)
// -> links attached: 3
// -> link traceIds match origins: true`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'Given that <code>startSpan({ links: [...] })</code> takes an ARRAY of link entries, what would need to change to add ONE MORE link to a batch span that was created 30 seconds ago and is still open — say, a 4th message that arrived just before the batch was flushed?',
  hint: 'Check whether the OTel Span interface has a method for adding a link after span creation, the same way it has <code>addEvent()</code> for adding events after the fact.',
  solution: `// Nothing to change on the ALREADY-CREATED span object -- because
// there isn't a method for it. Span has addEvent() for adding events
// after creation, but no equivalent addLink(). Links are set ONLY at
// startSpan()'s own creation-time options and are immutable for the
// rest of that span's life.
//
// The practical consequence: a batch-processing design that wants to
// link to messages as they arrive (rather than link to a
// fixed, known-up-front set) has to collect every origin span context
// BEFORE calling startSpan() -- e.g. buffer messages for a short
// window, gather their span contexts, then create the batch span once
// with the full links array already assembled -- rather than opening
// the batch span first and trying to attach links to it as messages
// trickle in.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A Link is basically the same thing as a parent-child relationship, just with a different name — the batch span is still functionally a "child" of all three origin spans.',
    reality: 'Structurally and semantically they’re different. A parent-child relationship is exactly one edge, stored directly on the span (<code>parentSpanContext</code>), and most tracing UIs render it as a single connected waterfall. A Link is a separate array of references that can hold any number of entries (including zero) and doesn’t participate in that same waterfall rendering the same way — most backends show links as a distinct, separately-navigable "related traces" list rather than nesting the batch span visually under three different traces at once.',
  },
  {
    thought: 'Since the demo’s <code>InMemorySpanExporter</code> confirms the link traceIds are correct, that’s proof the batch span and its three origin spans are now part of ONE combined trace.',
    reality: 'They aren’t, and that’s the whole point of using Links instead of trying to force a parent-child edge. The batch span keeps its OWN, independently-generated <code>traceId</code> (confirmed by the same export data — the batch span’s <code>spanContext().traceId</code> is different from all three origin traceIds). What Links provide is a reference FROM the batch span’s trace back to each origin trace — enough for a tracing backend to offer "jump to related trace" navigation, without merging four genuinely separate traces into one.',
  },
];

@Component({
  selector: 'app-obs-otel-tracing-span-links',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './span-links-for-fan-in-batch-processing.html',
  styleUrl: './span-links-for-fan-in-batch-processing.scss',
})
export class SpanLinksForFanInBatchProcessingSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
