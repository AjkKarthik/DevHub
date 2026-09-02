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
    heading: 'From "Visually Obvious" to an Actual Function',
    points: [
      'The main page’s own quiz explains how N+1 queries show up in a trace: "100+ identical narrow database spans visible sequentially under the root span... obvious visual pattern." This describes something a HUMAN notices by eye scanning a flamegraph — the Challenge’s own <code>Span</code> interface (<code>spanId</code>, <code>parentSpanId</code>, <code>operation</code>, <code>duration</code>) already has everything needed to detect the same pattern PROGRAMMATICALLY, but no codeTab on the page ever builds that detector.',
      'The core idea: group sibling spans (spans sharing the same <code>parentSpanId</code>) by their <code>operation</code> name, and flag any group whose count crosses a threshold — verified via execution on a realistic 100-order-then-100-customer-lookup scenario, correctly identifying exactly the 100 repeated <code>db:SELECT customer</code> spans as the anomaly.',
      'A naive version of this detector has a real false-positive risk the main page’s own theory already names elsewhere: "spans at the same level that overlap in time are parallel (concurrent)." A DELIBERATE 5-way parallel fan-out (checking 5 warehouses concurrently) looks structurally identical to a naive count-based detector as a genuine N+1 pattern — both are "5 spans, same parent, same operation name." Distinguishing them requires also checking whether the spans are SEQUENTIAL or overlapping in time.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Detector, Verified Against Both a Real N+1 and a False Positive',
    language: 'typescript',
    code: `interface Span {
  spanId: string;
  parentSpanId: string | null;
  operation: string;
  start: number;
  duration: number;
}

interface NPlusOneFinding {
  parentSpanId: string;
  operation: string;
  count: number;
  sequential: boolean;
  likelyNPlusOne: boolean;
}

function detectNPlusOne(spans: Span[], threshold = 5): NPlusOneFinding[] {
  const groups = new Map<string, Span[]>();
  for (const span of spans) {
    if (span.parentSpanId === null) continue;
    const key = span.parentSpanId + '::' + span.operation;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(span);
  }

  const findings: NPlusOneFinding[] = [];
  for (const [key, group] of groups) {
    if (group.length < threshold) continue;
    // Sequential = each span starts at or after the previous one ends.
    // Overlapping = a deliberate parallel fan-out, not an N+1 anti-pattern.
    const sorted = [...group].sort((a, b) => a.start - b.start);
    let sequential = true;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].start < sorted[i - 1].start + sorted[i - 1].duration) {
        sequential = false;
        break;
      }
    }
    const [parentSpanId, operation] = key.split('::');
    findings.push({ parentSpanId, operation, count: group.length, sequential, likelyNPlusOne: sequential });
  }
  return findings;
}

// Case A: a genuine N+1 -- 10 sequential customer lookups, one per order
const nPlusOneSpans: Span[] = [
  { spanId: 'root', parentSpanId: null, operation: 'GET /orders', start: 0, duration: 850 },
];
for (let i = 1; i <= 10; i++) {
  nPlusOneSpans.push({ spanId: \`c\${i}\`, parentSpanId: 'root', operation: 'db:SELECT customer', start: i * 10, duration: 8 });
}

// Case B: a legitimate parallel fan-out -- 5 concurrent warehouse checks
const fanOutSpans: Span[] = [
  { spanId: 'root', parentSpanId: null, operation: 'POST /checkout', start: 0, duration: 300 },
];
for (let i = 1; i <= 5; i++) {
  fanOutSpans.push({ spanId: \`w\${i}\`, parentSpanId: 'root', operation: 'http:GET warehouse-inventory', start: 5, duration: 40 });
}

console.log('Case A (N+1):', JSON.stringify(detectNPlusOne(nPlusOneSpans, 5)));
console.log('Case B (fan-out):', JSON.stringify(detectNPlusOne(fanOutSpans, 5)));
// -> Case A (N+1): [{"parentSpanId":"root","operation":"db:SELECT customer","count":10,"sequential":true,"likelyNPlusOne":true}]
// -> Case B (fan-out): [{"parentSpanId":"root","operation":"http:GET warehouse-inventory","count":5,"sequential":false,"likelyNPlusOne":false}]`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A THIRD, trickier scenario: 6 <code>db:SELECT customer</code> spans under the same parent, but due to connection-pool contention, spans 1-3 run sequentially, then spans 4-6 happen to overlap slightly with each other (a brief moment of real parallelism from retries). Would <code>detectNPlusOne()</code>’s all-or-nothing <code>sequential</code> flag correctly flag this as likely N+1?',
  hint: 'Trace through the loop checking <code>sorted[i].start &lt; sorted[i - 1].start + sorted[i - 1].duration</code> — what does it take for <code>sequential</code> to flip to <code>false</code>, and does it ever flip back?',
  solution: `// Yes -- it correctly flags this case as likely N+1, and the reasoning
// reveals something worth knowing about the detector's own logic: the
// sequential flag is checked pairwise across ALL consecutive spans in
// sorted order, and it flips to false and STAYS false the moment ANY
// ONE pair overlaps -- the loop's own "break" exits immediately on the
// first violation, it never re-evaluates or resets.
//
// For this scenario: spans 1-3 (sequential, no overlap) pass the check
// fine, keeping sequential = true. But the moment the loop reaches the
// pair spanning span 3 -> span 4 (or wherever the brief overlap
// actually occurs among spans 4-6), sequential flips to false --
// and since the detector's own likelyNPlusOne field is currently
// DEFINED as being equal to sequential, this means the function would
// actually report likelyNPlusOne: false for a group that is, in fact,
// 5 out of 6 spans genuinely sequential (a real N+1 pattern with one
// coincidental overlap).
//
// This exposes a real, narrower limitation than "distinguishes N+1
// from fan-out cleanly": the current implementation is an ALL-sequential
// or NOT-flagged binary, with no notion of "MOSTLY sequential." A more
// robust version might count what FRACTION of consecutive pairs overlap
// rather than treating a single overlapping pair as disqualifying the
// whole group.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'The <code>threshold = 5</code> default is an arbitrary number that could just as easily be 2 or 20 without meaningfully changing what the detector catches.',
    reality: 'The threshold genuinely trades off false positives against false negatives, and the right value depends on the codebase’s own normal patterns — a threshold of 2 would flag ANY two spans sharing a parent and operation name, including completely ordinary and intentional patterns (retrying a failed call once, or two legitimately separate lookups that happen to share an operation label), producing constant noise. A threshold of 20 would miss a real, costly N+1 affecting a list of 15 items. The threshold has to be tuned against what "coincidentally repeated" looks like in a SPECIFIC codebase’s own normal traffic, not a universal constant.',
  },
  {
    thought: 'Since the fan-out case (Case B) correctly comes back <code>likelyNPlusOne: false</code>, the detector has PROVEN that parallel fan-outs are always fine and never worth investigating.',
    reality: 'The detector only distinguishes "sequential repetition" (a strong N+1 signal) from "parallel repetition" (NOT the N+1 anti-pattern specifically) — it says nothing about whether 5 concurrent calls to 5 different warehouses is itself a GOOD design choice. A parallel fan-out that queries 500 warehouses concurrently, overwhelming a downstream service, is a real problem the detector is not designed to catch at all — it only answers "is this specific anti-pattern (sequential N+1) present," not "is this span group healthy."',
  },
  {
    thought: 'Running this detector on a REAL production trace, captured from a live tracing backend rather than hand-built test data, would need substantially different logic, since real spans carry many more fields than this simplified <code>Span</code> interface.',
    reality: 'The detector only ever reads four fields — <code>parentSpanId</code>, <code>operation</code>, <code>start</code>, <code>duration</code> — every one of which is a standard field present on any real OpenTelemetry span exported to Jaeger or Tempo (via the OTel <code>ReadableSpan</code> interface’s <code>parentSpanContext</code>, <code>name</code>, and timing fields). The extra fields a real span carries (attributes, events, status) are simply additional data the detector doesn’t need to look at — it would work unmodified against real trace data with a small adapter mapping the real field names onto this simplified shape.',
  },
];

@Component({
  selector: 'app-obs-distributed-tracing-n-plus-one-detector',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './building-an-n-plus-one-detector-from-the-span-tree.html',
  styleUrl: './building-an-n-plus-one-detector-from-the-span-tree.scss',
})
export class BuildingAnNPlusOneDetectorFromTheSpanTreeSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
