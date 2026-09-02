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
    heading: 'A Real Span Leak, Found by Comparing the Page’s Own Two Examples',
    points: [
      'The main page’s own "Advanced Manual Tracing" code sample wraps every single span in a <code>try/finally</code> block, with an explicit comment on the very first one — <code>// always end — startActiveSpan does NOT auto-end</code>. The "Kafka Context Propagation" sample right below it does not follow its own neighbor’s rule: the producer span calls <code>span.end()</code> as a bare, unconditional statement AFTER <code>await kafka.producer().send(...)</code>, with no <code>try/finally</code> at all.',
      'That single missing wrapper means a genuinely realistic failure — a broker that’s temporarily unreachable, a network partition, a producer-side timeout — throws an exception out of <code>send()</code> before <code>span.end()</code> is ever reached. The span is never ended: it never gets exported (most exporters only flush a span once it ends), and worse, in-process it stays registered as the "active" span for however long the surrounding async context lives, silently corrupting the parent-child chain for anything that runs afterward in that same context.',
      'This was verified directly, not just reasoned about: a minimal simulation reproducing the exact buggy shape (an unconditional <code>span.end()</code> after an awaited call, with no <code>try/finally</code>) shows <code>span.end()</code> is called ZERO times when the awaited call throws, and exactly once when it succeeds — the bug is real, not just a stylistic nitpick.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Reproducing the Leak (Then Fixing It)',
    language: 'typescript',
    code: `// A minimal stand-in for the page's own publishOrderEvent() shape --
// no real OTel SDK needed to demonstrate this specific bug, since it's
// purely about control flow, not anything OTel-specific.
let endCalls = 0;
function fakeSpan() {
  return { end: () => { endCalls++; }, setAttributes: () => {} };
}

// ── BUGGY: matches the page's ORIGINAL "Kafka Context Propagation" tab ──
async function publishOrderEvent_buggy(kafkaSend: () => Promise<void>) {
  const span = fakeSpan();
  span.setAttributes({});
  await kafkaSend();  // if this throws, the line below never runs
  span.end();
}

// ── FIXED: matches every OTHER span on the page's own first code tab ──
async function publishOrderEvent_fixed(kafkaSend: () => Promise<void>) {
  const span = fakeSpan();
  span.setAttributes({});
  try {
    await kafkaSend();
  } finally {
    span.end();  // runs whether send() succeeds, throws, or times out
  }
}

async function main() {
  const failingSend = async () => { throw new Error('broker unreachable'); };

  endCalls = 0;
  try { await publishOrderEvent_buggy(failingSend); } catch {}
  console.log('BUGGY,  send() throws -> span.end() calls:', endCalls);

  endCalls = 0;
  try { await publishOrderEvent_fixed(failingSend); } catch {}
  console.log('FIXED,  send() throws -> span.end() calls:', endCalls);

  const okSend = async () => {};
  endCalls = 0;
  await publishOrderEvent_buggy(okSend);
  console.log('BUGGY,  send() succeeds -> span.end() calls:', endCalls);
}
main();
// -> BUGGY,  send() throws -> span.end() calls: 0   (LEAK)
// -> FIXED,  send() throws -> span.end() calls: 1   (correct)
// -> BUGGY,  send() succeeds -> span.end() calls: 1  (happy path hides the bug)`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The verification above shows the BUGGY version calls <code>span.end()</code> exactly once when <code>send()</code> succeeds — the exact same outcome as the FIXED version. Given that, why is this bug realistically likely to reach production code review undetected, and what specific kind of test would actually catch it before it ships?',
  hint: 'Think about what a typical unit test for a "publish an event" function usually mocks — and whether that mock is set up to ever reject.',
  solution: `// A typical unit test for publishOrderEvent() mocks
// kafka.producer().send() to resolve successfully, because that's the
// behavior the test is actually there to verify (does the right topic
// get called, with the right payload). A mock that ALWAYS resolves
// never exercises the failure path at all -- so the buggy and fixed
// versions are completely indistinguishable to that test, and both
// pass.
//
// What actually catches it: a SEPARATE test case that mocks send() to
// REJECT (kafka.producer().send.mockRejectedValue(new
// Error('broker down'))), then asserts span.end() was called exactly
// once even though the function itself threw. That's precisely the
// scenario the try/finally exists for -- and it's the one branch a
// "does the happy path work" test suite never happens to reach on its
// own.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A span that never calls <code>end()</code> just doesn’t get exported — it’s wasted work, but otherwise harmless.',
    reality: 'Missing an export is the more visible half of the problem, but not the only one. <code>startActiveSpan()</code> registers the span as the ACTIVE span in the surrounding async context for the duration of its callback. If that callback throws past the point where <code>end()</code> should have run, and the surrounding code catches the error and continues doing work in what it thinks is a clean context, any further spans created there can still pick up the leaked span as their parent — corrupting the trace tree for operations that have nothing to do with the original Kafka publish at all.',
  },
  {
    thought: 'Since <code>send()</code> is <code>await</code>ed, wrapping it in <code>try/finally</code> is really just a defensive habit — most of the time the extra wrapper doesn’t change anything.',
    reality: 'It changes behavior on EXACTLY the input that matters most for a tracing span: a failure. The whole reason to instrument a Kafka publish with a span in the first place is to be able to see and diagnose failures in a tracing backend — a broker outage, a timeout, a serialization error. A version that only reliably ends the span on success silently fails to capture the very failures the instrumentation exists to surface.',
  },
  {
    thought: 'The consumer side of the same code tab (<code>handleOrderEvent</code>) has the identical risk, since it also creates a span around async work.',
    reality: 'It doesn’t — reading it carefully, the consumer’s <code>try/catch</code> block explicitly calls <code>span.end()</code> in BOTH the success path (inside <code>try</code>, right after the work completes) and the failure path (inside <code>catch</code>, right before re-throwing). It doesn’t use <code>finally</code>, but it doesn’t need to, since both branches already end the span themselves before returning or throwing — the producer’s bug is specifically that its one and only <code>span.end()</code> call sits AFTER the risky line with no branch covering the throw case at all.',
  },
];

@Component({
  selector: 'app-obs-otel-tracing-kafka-leak',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-kafka-producer-span-that-leaks-when-send-throws.html',
  styleUrl: './the-kafka-producer-span-that-leaks-when-send-throws.scss',
})
export class TheKafkaProducerSpanThatLeaksWhenSendThrowsSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
