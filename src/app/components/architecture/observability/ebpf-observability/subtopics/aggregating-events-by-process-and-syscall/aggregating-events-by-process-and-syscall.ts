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
    heading: 'The Challenge Aggregates Less Than the Page’s Own bpftrace Example',
    points: [
      'The page’s own "bpftrace one-liners" code tab opens with a real, two-dimensional aggregation: <code>@[comm, probe] = count();</code> — counting events keyed by BOTH the process name (<code>comm</code>) and the specific syscall (<code>probe</code>) together, in one pass.',
      'The page’s own Challenge, <code>aggregateEvents()</code>, only ever aggregates by <code>process</code> — it deliberately discards the <code>syscall</code> field entirely, folding every syscall type a process makes into one combined count. The Challenge’s own description confirms this is intentional ("counting total syscall events per process"), but it means the Challenge’s function can’t reproduce the richer breakdown the page’s own bpftrace example already shows working.',
      'Extended and verified directly: a two-level aggregation keeping BOTH dimensions, built the same way the single-level version is (a `Map`, incremented per event), correctly separates every distinct process-syscall combination in the same sample data the Challenge itself uses.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Two-Level Aggregation, Matching the bpftrace Example',
    language: 'typescript',
    code: `interface BpfEvent {
  process: string;
  syscall: string;
}

// The page's own single-level Challenge function, for comparison:
function aggregateEvents(events: BpfEvent[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const event of events) {
    counts.set(event.process, (counts.get(event.process) ?? 0) + 1);
  }
  return counts;
}

// Extended: matches the bpftrace example's own @[comm, probe] = count()
function aggregateEventsByProcessAndSyscall(events: BpfEvent[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const event of events) {
    const key = \`\${event.process}::\${event.syscall}\`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

const events: BpfEvent[] = [
  { process: 'node',  syscall: 'read' },
  { process: 'node',  syscall: 'write' },
  { process: 'nginx', syscall: 'accept' },
  { process: 'node',  syscall: 'read' },
  { process: 'nginx', syscall: 'read' },
];

console.log('Single-level (Challenge\\'s own function):');
console.log('  node:', aggregateEvents(events).get('node'));   // 3 -- all syscalls combined

console.log('Two-level (matching the bpftrace example):');
const detailed = aggregateEventsByProcessAndSyscall(events);
for (const [key, count] of detailed) console.log(' ', key, '->', count);
// -> node::read -> 2
// -> node::write -> 1
// -> nginx::accept -> 1
// -> nginx::read -> 1
// (node's total of 3 is still recoverable by summing its own two entries: 2 + 1)`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The two-level version uses <code>${event.process}::${event.syscall}</code> as its Map key, joining the two fields with a double colon. What would go wrong if a process were legitimately named something like <code>worker::backup</code> (using the SAME delimiter inside its own name), and the syscall were <code>read</code>?',
  hint: 'Work out exactly what the joined key string would look like for that process/syscall pair, and whether a DIFFERENT, unrelated process+syscall combination could produce the identical string.',
  solution: `// "worker::backup"'s key for a "read" syscall becomes
// "worker::backup::read" -- and that EXACT same string is also what
// you'd get from a genuinely different process named "worker" making
// a syscall literally called "backup::read" (however unlikely that
// specific syscall name is). More realistically and more dangerously:
// it's also indistinguishable from a process named "worker" with
// syscall "backup", immediately followed by ANOTHER process/syscall
// pair that happens to serialize to the same joined string through a
// different split -- the delimiter choice silently assumes neither
// field will ever contain "::" itself.
//
// The fix: either pick a delimiter genuinely impossible in both
// fields (process names and syscall names are both drawn from
// constrained character sets in practice, so a control character or
// null byte would work), or avoid string-joining entirely and use a
// NESTED Map (Map<string, Map<string, number>>, keyed first by
// process, then by syscall) -- which sidesteps the delimiter-collision
// risk completely, since there's no string concatenation involved at
// all.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since the two-level version tracks strictly MORE information than the Challenge’s own single-level function, it should always be preferred — there’s no real reason the Challenge only aggregates by process.',
    reality: 'The Challenge’s own narrower scope is a legitimate, deliberate simplification for what it’s actually testing — a straightforward single-key <code>Map</code> accumulation pattern, without also asking the reader to reason about composite keys or delimiter collisions in the same exercise. The two-level version is genuinely more USEFUL for real event analysis, but that doesn’t make the simpler version wrong for its own, narrower purpose.',
  },
  {
    thought: 'The two-level aggregation’s result can’t reconstruct the Challenge’s own single-level "total count per process" answer — you’d need to run both functions separately to get both views.',
    reality: 'The single-level total is always recoverable from the two-level result without re-running anything — as the code tab’s own comment shows, summing every entry whose key starts with a given process name (<code>node::read</code> + <code>node::write</code> = 3) reproduces exactly what <code>aggregateEvents()</code> would have returned for that process. The two-level breakdown is strictly a SUPERSET of the information the single-level version provides, not a different, incompatible view of the same data.',
  },
];

@Component({
  selector: 'app-obs-ebpf-aggregation',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './aggregating-events-by-process-and-syscall.html',
  styleUrl: './aggregating-events-by-process-and-syscall.scss',
})
export class AggregatingEventsByProcessAndSyscallSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
