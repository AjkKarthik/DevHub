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
    heading: 'A Wrong Claim, and the Bug It Was Hiding in Plain Sight',
    points: [
      'The main page’s own "Forgetting to call span.end()" mistake block originally claimed: "prefer startActiveSpan() with a callback — it automatically calls span.end() when the callback returns or throws." Confirmed via two independent sources on OpenTelemetry’s own JS API guidance: this is FALSE — neither <code>startSpan()</code> nor <code>startActiveSpan()</code> ever auto-ends a span in the JS/Node.js SDK. The developer is always responsible for calling <code>span.end()</code> themselves, in both cases, typically inside a <code>finally</code> block.',
      'The SAME page’s own "Manual Spans" codeTab quietly proves this the hard way: the OUTER span (<code>span</code>) is correctly wrapped in <code>try/catch/finally</code> with <code>span.end()</code> in the <code>finally</code> block — but the INNER span (<code>paySpan</code>), created via the exact same <code>startActiveSpan()</code> call, only ever calls <code>paySpan.end()</code> on the happy-path line, with no protection at all.',
      'Simulated directly: if <code>chargeCard(orderId)</code> throws (a genuinely common outcome — a declined card, a timeout, a provider error), the callback’s execution jumps straight past the never-reached <code>paySpan.end()</code> line and out of the function. The OUTER span correctly ends (via its own <code>finally</code>); the INNER <code>paySpan</code> never does — a real, reproducible span leak, in the exact function the mistake block right above it exists to warn against.',
      'This has now been fixed on the main page: <code>paySpan</code>’s body is wrapped in its own <code>try/finally</code>, matching the outer span’s pattern exactly, and the mistake block’s explanation now states the corrected, source-verified fact — every span, whether created via <code>startSpan()</code> or <code>startActiveSpan()</code>, needs its own explicit <code>try/finally</code>.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Reproducing the Leak, and the Fix',
    language: 'typescript',
    code: `// A minimal fake Span/tracer, tracking exactly which spans got .end()
// called, used to verify the bug and fix without needing a real OTel SDK.
class FakeSpan {
  ended = false;
  attrs: Record<string, unknown> = {};
  setAttribute(k: string, v: unknown) { this.attrs[k] = v; }
  setAttributes(o: Record<string, unknown>) { Object.assign(this.attrs, o); }
  end() { this.ended = true; }
  recordException(e: Error) {}
  setStatus(s: unknown) {}
}

const endedSpans: string[] = [];
function startActiveSpan<T>(name: string, fn: (span: FakeSpan) => T): T {
  const span = new FakeSpan();
  const originalEnd = span.end.bind(span);
  span.end = () => { originalEnd(); endedSpans.push(name); };
  return fn(span);
}

async function chargeCard_throws(): Promise<never> {
  throw new Error('card declined');
}

// The ORIGINAL, buggy version -- paySpan has no try/finally.
async function processOrder_buggy() {
  return startActiveSpan('order.process', async (span) => {
    try {
      const payment = await startActiveSpan('order.payment', async (paySpan) => {
        paySpan.setAttribute('payment.provider', 'stripe');
        const result: any = await chargeCard_throws(); // throws here
        paySpan.setAttribute('payment.charge_id', result.chargeId); // never reached
        paySpan.end(); // never reached -- LEAK
        return result;
      });
      return { payment };
    } finally {
      span.end(); // outer span correctly always ends
    }
  });
}

processOrder_buggy().catch(() => {
  console.log('BUGGY -- spans ended:', endedSpans);
  console.log('order.payment ended:', endedSpans.includes('order.payment'));
});
// -> spans ended: [ 'order.process' ]
// -> order.payment ended: false -- confirmed leaked

// The FIXED version -- paySpan gets the same try/finally protection.
async function processOrder_fixed() {
  endedSpans.length = 0;
  return startActiveSpan('order.process', async (span) => {
    try {
      const payment = await startActiveSpan('order.payment', async (paySpan) => {
        try {
          paySpan.setAttribute('payment.provider', 'stripe');
          const result: any = await chargeCard_throws();
          paySpan.setAttribute('payment.charge_id', result.chargeId);
          return result;
        } finally {
          paySpan.end();
        }
      });
      return { payment };
    } finally {
      span.end();
    }
  });
}

processOrder_fixed().catch(() => {
  console.log('FIXED -- spans ended:', endedSpans);
  console.log('order.payment ended:', endedSpans.includes('order.payment'));
});
// -> spans ended: [ 'order.payment', 'order.process' ]
// -> order.payment ended: true -- fixed`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A third, even MORE deeply nested span (<code>tracer.startActiveSpan(\'payment.fraud_check\', ...)</code>) is added inside <code>paySpan</code>’s own callback, BEFORE the call to <code>chargeCard()</code>, and it also lacks a try/finally. If <code>chargeCard()</code> throws, does the fraud-check span leak too, even though it isn’t the span whose code directly threw?',
  hint: 'The fraud-check span’s own callback would need to run to completion (or throw internally) BEFORE <code>chargeCard()</code> is ever called — trace whether the fraud-check span’s own <code>.end()</code> line is reached before execution ever gets to the line that throws.',
  solution: `// If the fraud-check span's own callback completes NORMALLY (its own code
// doesn't throw) before chargeCard() is called, its own .end() line DOES
// get reached -- the fraud-check span's lifecycle is independent of what
// happens LATER in the outer function, as long as its own callback already
// returned by the time the later throw happens.
//
// The leak is specifically about a span whose OWN callback is still
// executing (hasn't reached its .end() line yet) when something inside
// that same callback throws -- not about "is anything nested inside this
// span going to throw eventually." Each startActiveSpan() callback's own
// lifecycle is independent: what matters for whether A SPECIFIC span leaks
// is whether THAT span's own .end() call is unconditionally reached (or
// protected by try/finally) within its OWN callback's execution, not
// whether some unrelated LATER code in the surrounding function throws.
//
// This is exactly why the fix targets paySpan's OWN callback body
// specifically -- the try/finally has to wrap the code that can throw
// WHILE that span's .end() call hasn't happened yet, not just "wrap
// everything in the whole function somewhere."`,
};

const misconceptions: Misconception[] = [
  {
    thought: '<code>startActiveSpan()</code> is a more convenient, safer alternative to <code>startSpan()</code> specifically because it manages the span’s ending for you.',
    reality: 'Verified against OpenTelemetry’s own JS API guidance: <code>startActiveSpan()</code>’s only difference from <code>startSpan()</code> is that it also sets the span as the CURRENT active context for the duration of its callback (useful for auto-instrumentation and nested spans to find their parent automatically) — it provides zero automatic lifecycle management. The developer is equally responsible for calling <code>.end()</code> with either API.',
  },
  {
    thought: 'Since the main page’s own "Manual Spans" codeTab correctly wraps its OUTER span in try/finally, the whole function is protected — a lower-level span inside it doesn’t need its own separate protection.',
    reality: 'The bug demonstrates the opposite: the outer span’s <code>finally</code> block only ever calls <code>span.end()</code> on the OUTER span — it has no effect on any INNER span created inside the callback. Every individually-created span needs its own explicit lifecycle protection; wrapping the outer function does nothing for spans nested inside it.',
  },
  {
    thought: 'A leaked span (one whose <code>.end()</code> is never called) simply doesn’t appear in the trace backend — a purely cosmetic gap in an otherwise-complete trace.',
    reality: 'The main page’s own mistake-block explanation states the real cost precisely: an un-ended span "leaks memory and is never exported to the backend" — in a long-running Node.js process handling many requests, span objects that are never ended and never garbage-collected (since the SDK may still be tracking them as open) accumulate over time, a genuine, growing memory leak, not just a missing trace segment.',
  },
];

@Component({
  selector: 'app-obs-opentelemetry-payspan-leak',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-payspan-leak-startactivespan-never-auto-ends.html',
  styleUrl: './the-payspan-leak-startactivespan-never-auto-ends.scss',
})
export class ThePayspanLeakStartactivespanNeverAutoEndsSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
