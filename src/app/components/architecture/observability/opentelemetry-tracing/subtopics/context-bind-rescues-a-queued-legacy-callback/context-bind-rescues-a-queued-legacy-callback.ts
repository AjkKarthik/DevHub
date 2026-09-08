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
    heading: 'Proving context.bind() Actually Rescues a Lost Context',
    points: [
      'The page’s own QnA on instrumenting legacy callback-based code describes the fix in real technical detail — wrap the callback with <code>context.bind(context.active(), callbackFn)</code> before handing it to code that will invoke it later — and explains WHY it’s needed: <code>AsyncLocalStorage</code> propagates automatically across <code>await</code>/<code>Promise.then()</code>, "but NOT across plain callbacks unless you explicitly bind." No code on the page shows either the failure or the fix actually happening.',
      'Getting a genuine failure to reproduce takes more than just "any callback" — a callback registered synchronously and then invoked shortly after, even via <code>setImmediate</code>, still correctly inherits its context automatically in Node.js, because scheduling that async work happens WHILE the original context is still active. The failure the QnA is really describing needs the callback to be STORED and invoked LATER by a completely unrelated async chain — the realistic shape of a legacy connection-pool driver that queues callbacks and drains them from its own background timer, started independently of any request.',
      'Verified directly with a real OTel SDK: an unbound callback queued this way and invoked from that independent background timer comes back with NO parent span and a completely different, unrelated <code>traceId</code> — a genuinely new, disconnected root trace, not merely a span with a missing parent field. The <code>context.bind()</code>-wrapped version, queued and invoked exactly the same way, correctly reproduces the original <code>traceId</code> and the correct parent-child link.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'A Legacy Driver That Queues Callbacks, Bound and Unbound',
    language: 'typescript',
    code: `import * as api from '@opentelemetry/api';
import { NodeTracerProvider, InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';

const exporter = new InMemorySpanExporter();
const provider = new NodeTracerProvider({ spanProcessors: [new SimpleSpanProcessor(exporter)] });
provider.register();
const tracer = api.trace.getTracer('bind-demo');

// A stand-in for a legacy connection-pool driver: callbacks are pushed
// onto a queue, and a background interval -- started at MODULE LOAD,
// well before any request context exists -- drains the queue on its
// own, completely independent async chain.
const pendingCallbacks: Array<() => void> = [];
setInterval(() => { while (pendingCallbacks.length) pendingCallbacks.shift()!(); }, 10);
function legacyQuery(cb: () => void) { pendingCallbacks.push(cb); }

function runOrphan() {
  return new Promise<void>((resolve) => {
    tracer.startActiveSpan('handleRequest', (parentSpan) => {
      // NAIVE: the driver just stores this closure -- no context binding
      legacyQuery(() => {
        tracer.startActiveSpan('legacyQuery.callback', (child) => {
          child.end();
          parentSpan.end();
          resolve();
        });
      });
    });
  });
}

function runBound() {
  return new Promise<void>((resolve) => {
    tracer.startActiveSpan('handleRequest', (parentSpan) => {
      const boundCb = api.context.bind(api.context.active(), () => {
        tracer.startActiveSpan('legacyQuery.callback', (child) => {
          child.end();
          parentSpan.end();
          resolve();
        });
      });
      legacyQuery(boundCb);
    });
  });
}

async function main() {
  exporter.reset();
  await runOrphan();
  let spans = exporter.getFinishedSpans();
  let child = spans.find(s => s.name === 'legacyQuery.callback')!;
  let parent = spans.find(s => s.name === 'handleRequest')!;
  console.log('ORPHAN: parentSpanId =', child.parentSpanContext?.spanId ?? 'none');
  console.log('ORPHAN: traceId matches handleRequest?',
    child.spanContext().traceId === parent.spanContext().traceId);

  exporter.reset();
  await runBound();
  spans = exporter.getFinishedSpans();
  child = spans.find(s => s.name === 'legacyQuery.callback')!;
  parent = spans.find(s => s.name === 'handleRequest')!;
  console.log('BOUND:  parentSpanId =', child.parentSpanContext?.spanId);
  console.log('BOUND:  traceId matches handleRequest?',
    child.spanContext().traceId === parent.spanContext().traceId);
}
main();
// -> ORPHAN: parentSpanId = none
// -> ORPHAN: traceId matches handleRequest? false  (a brand-new, unrelated trace)
// -> BOUND:  parentSpanId = <handleRequest's real spanId>
// -> BOUND:  traceId matches handleRequest? true`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The demo above deliberately uses <code>setInterval</code> to simulate the legacy driver’s background drain loop, started once at module load. If the SAME <code>legacyQuery()</code> call were instead invoked from inside a plain <code>setTimeout(() => legacyQuery(cb), 0)</code> called DIRECTLY inside <code>handleRequest</code>’s own <code>startActiveSpan</code> callback (no queue, no separate interval at all), would the unbound version still lose its context?',
  hint: 'Context loss in this demo comes from the callback being invoked by an async chain that was set up BEFORE — and independently of — the active context. Compare that to a setTimeout scheduled WHILE the context is active.',
  solution: `// No -- that version would NOT lose context, even without
// context.bind(). Node's AsyncLocalStorage propagates context across
// async work SCHEDULED while a context is active, including
// setTimeout/setImmediate/Promise chains created synchronously inside
// startActiveSpan's own callback. The context loss in this demo comes
// specifically from a DIFFERENT mechanism: the callback is pushed into
// a plain array (pendingCallbacks), and the thing that eventually
// calls it -- the setInterval loop -- was created at module load, long
// before handleRequest's context.with() scope ever existed. That
// interval's own async_hooks continuation has nothing to do with any
// request context, so invoking a stored callback from inside it starts
// a fresh chain with no ties back to the original span.
//
// The practical rule: it's not "callbacks lose context, promises
// don't" -- it's "async work whose SCHEDULING itself happens outside
// any active context loses that context, regardless of whether it's a
// callback, a timer, or a promise." A callback STORED and invoked
// later by unrelated code is the realistic way that happens in
// practice.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since the demo needed a deliberately contrived background-interval driver to reproduce the bug, this is really an edge case that rarely happens with real Node.js libraries.',
    reality: 'The shape is deliberately realistic, not contrived — it’s exactly how many real connection-pool and message-broker client libraries work: a shared pool of workers or connections pulls queued work items off an internal queue on its own schedule, independent of whichever request originally enqueued the work. Any driver, cache client, or job queue library built around "submit work now, get called back whenever a worker is free" has this exact shape, and none of it is instrumented with OTel-aware context propagation unless the library specifically ships that support.',
  },
  {
    thought: '<code>context.bind()</code> permanently changes what "the active context" means globally — after binding a callback once, every OTHER span created anywhere in the app while that callback is pending will also use the bound context as its parent.',
    reality: 'The binding is scoped ENTIRELY to that one specific callback function — <code>context.bind(ctx, fn)</code> returns a NEW wrapped function that, when invoked, temporarily activates <code>ctx</code> for the duration of that single call and restores whatever context was active immediately afterward. It has no effect on any other code running concurrently, and no effect on the SAME callback if it were somehow invoked a second time through a different, unbound path.',
  },
  {
    thought: 'The <code>legacyQuery.callback</code> span in the ORPHAN case is missing information (no parent), but it’s still correctly attributed to the SAME trace as <code>handleRequest</code> — just without the parent-child edge.',
    reality: 'The verification output shows otherwise: the ORPHAN case’s <code>traceId</code> doesn’t match <code>handleRequest</code>’s <code>traceId</code> at all. Losing context this way doesn’t just drop the parent-child LINK — <code>startActiveSpan()</code> with no active parent context generates a brand-new, independent root trace, complete with its own fresh <code>traceId</code>. In a tracing backend, this callback’s work would show up as an entirely separate, unrelated trace with no visible connection back to the request that triggered it at all.',
  },
];

@Component({
  selector: 'app-obs-otel-tracing-context-bind',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './context-bind-rescues-a-queued-legacy-callback.html',
  styleUrl: './context-bind-rescues-a-queued-legacy-callback.scss',
})
export class ContextBindRescuesAQueuedLegacyCallbackSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
