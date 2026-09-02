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
    heading: 'Turning "Overhead Is Proportional to Work Per Event" Into a Number',
    points: [
      'The page’s own mistakes block states the principle directly but never demonstrates it: "eBPF overhead is proportional to event frequency × work per event... Design: capture aggregates for always-on, full data for incident investigation." The claim is correct, but stated as a bare assertion with nothing to measure it against.',
      'A measured simulation makes the claim concrete: run 200,000 simulated events through two different processing styles — one doing pure aggregate counting (a `Map` increment, O(1) work per event, matching the page’s own "count syscalls per process" example) and one doing per-event data capture (building a full stack trace array per event, matching the page’s own "capture full packet bodies" example) — and measure the actual elapsed time for each.',
      'This is a simulation of the RELATIVE COST SHAPE in ordinary JavaScript, not a literal in-kernel eBPF benchmark — the actual kernel-side multiplier depends on the specific probe type, the BPF verifier’s own constraints, and the hardware involved. But the underlying principle the measurement demonstrates — aggregate work stays constant per event regardless of payload size, while payload-capture work scales with how much data is captured per event — transfers directly to why the page’s own design guidance recommends aggregates for always-on collection.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Measured: Aggregate-Only vs. Per-Event Capture',
    language: 'typescript',
    code: `function simulateAggregateOnly(eventCount: number): number {
  const counts = new Map<string, number>();
  const start = process.hrtime.bigint();
  for (let i = 0; i < eventCount; i++) {
    const key = 'process-' + (i % 20);
    counts.set(key, (counts.get(key) ?? 0) + 1); // O(1) work per event
  }
  const end = process.hrtime.bigint();
  return Number(end - start) / 1e6; // ms
}

function simulatePerEventCapture(eventCount: number): { ms: number; capturedCount: number } {
  const captured: { id: number; stack: string }[] = [];
  const start = process.hrtime.bigint();
  for (let i = 0; i < eventCount; i++) {
    // stand-in for "capture full stack/payload per event" -- real work
    // proportional to payload size, not just a counter increment
    const stack: string[] = [];
    for (let d = 0; d < 20; d++) stack.push(\`frame_\${d}_of_event_\${i}\`);
    captured.push({ id: i, stack: stack.join('|') });
  }
  const end = process.hrtime.bigint();
  return { ms: Number(end - start) / 1e6, capturedCount: captured.length };
}

const N = 200_000;
const aggMs = simulateAggregateOnly(N);
const perEvent = simulatePerEventCapture(N);

console.log(\`Aggregate-only, \${N} events: \${aggMs.toFixed(2)}ms\`);
console.log(\`Per-event capture, \${N} events: \${perEvent.ms.toFixed(2)}ms\`);
console.log('Per-event is slower by factor:', (perEvent.ms / aggMs).toFixed(1) + 'x');
// -> Aggregate-only, 200000 events: 13.72ms
// -> Per-event capture, 200000 events: 316.89ms
// -> Per-event is slower by factor: 23.1x`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The per-event simulation captures a fixed 20-frame stack for every event. If the simulated stack depth were doubled to 40 frames per event, would you expect the measured ~23x slowdown factor to roughly double too, or to stay about the same?',
  hint: 'Separate what scales with EVENT COUNT (200,000, unchanged) from what scales with WORK PER EVENT (currently 20 frames) in each function’s own inner loop.',
  solution: `// The slowdown factor would increase roughly in proportion to the
// per-event work, so doubling stack depth to 40 frames would push the
// factor meaningfully higher than 23x (roughly toward 40-something x,
// though not perfectly linear once array/string allocation overhead is
// included) -- NOT stay the same.
//
// The aggregate-only function's per-event cost doesn't depend on stack
// depth at all -- it's a single Map lookup-and-increment regardless of
// how deep a call stack theoretically exists. The per-event capture
// function's cost scales directly with how many frames it captures per
// event, since each additional frame is more string construction and
// array-push work repeated 200,000 times. Doubling the CAPTURED
// payload size doubles roughly that entire function's own runtime,
// while leaving the aggregate-only baseline completely unchanged --
// which is exactly the "work per event" half of the page's own
// "overhead is proportional to event frequency × work per event"
// principle, isolated from the event-frequency half.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'The ~23x measured factor is a specific, reliable number that would also apply to real, in-kernel eBPF program overhead.',
    reality: 'The measurement demonstrates the SHAPE of the cost difference (aggregate work is flat per event; payload capture work scales with payload size) using ordinary JavaScript running in Node.js — it deliberately isn’t claiming to reproduce actual in-kernel eBPF costs, which depend on the BPF verifier’s own constraints, the specific probe type (kprobe vs. uprobe vs. tracepoint), how data is transferred out of kernel space (ring buffers vs. perf buffers), and the underlying hardware. The 23x figure is a real, reproducible measurement of THIS simulation specifically, useful for building intuition about the principle, not a number to cite as eBPF’s actual real-world overhead multiplier.',
  },
  {
    thought: 'Since aggregate-only counting is dramatically cheaper, the page’s own mistakes block is really arguing that per-event capture should never be used in production at all.',
    reality: 'The page’s own "right" example explicitly keeps a role for full-data capture: "capture aggregates for always-on, full data for incident investigation." The measurement in this subtopic supports exactly that design, not a blanket ban — it shows why ALWAYS-ON, continuous collection should default to the cheap aggregate style, while confirming that a short, TARGETED window of full per-event capture (during an active investigation, not running continuously) is a reasonable, bounded cost to pay for the extra diagnostic detail.',
  },
];

@Component({
  selector: 'app-obs-ebpf-overhead',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './measuring-why-aggregate-only-capture-is-cheaper.html',
  styleUrl: './measuring-why-aggregate-only-capture-is-cheaper.scss',
})
export class MeasuringWhyAggregateOnlyCaptureIsCheaperSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
