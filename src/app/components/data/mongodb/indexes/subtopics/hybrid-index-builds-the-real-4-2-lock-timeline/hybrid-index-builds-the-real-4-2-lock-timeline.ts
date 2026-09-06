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
    heading: 'Four Phases, Two Real Exclusive-Lock Windows',
    points: [
      'The main page\'s own theory originally attributed the "lock only at the beginning and end" behavior to MongoDB 4.4+, while separately (and correctly) saying index builds "no longer block reads/writes" since 4.2+ — a version mismatch. Verified against MongoDB\'s own documented hybrid index build protocol: the lock-only-at-start-and-end behavior IS the 4.2+ hybrid build itself, not a separate 4.4 improvement.',
      'The four documented phases: (1) an exclusive (X) lock briefly at the very start, to initialize the build; (2) an intent-exclusive (IX) lock during the main bulk-scan phase — reads AND writes are freely interleaved here, which is most of the build\'s total duration; (3) a shared (S) lock during a short "drain" phase that catches any writes that happened during the scan — this blocks NEW writes but still allows reads; (4) a final exclusive (X) lock to commit the index.',
      'Before MongoDB 4.2, the choice was binary: a "foreground" build (fast, but blocked ALL reads/writes on the parent database for the ENTIRE build) or a "background" build (slower, avoided blocking, but produced a less efficient index). MongoDB 4.2 replaced BOTH options with the single hybrid protocol described above — the foreground/background distinction itself was eliminated, and <code>{ background: true }</code> became a no-op kept only for compatibility.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The Four-Phase Lock Timeline',
    language: 'typescript',
    code: `// Since MongoDB 4.2+, every createIndex() call uses this SAME
// hybrid protocol -- there is no separate "background: true" build
// anymore; the option is accepted but has no effect.
await db.collection('users').createIndex({ status: 1, createdAt: -1 });

// Modeling the four documented phases and what's actually blocked
// during each one:
const phases = [
  { phase: 'Initialize', lock: 'X (exclusive)', readsAllowed: false, writesAllowed: false, typicalShare: 'brief' },
  { phase: 'Bulk scan',  lock: 'IX (intent-exclusive)', readsAllowed: true,  writesAllowed: true,  typicalShare: 'most of the build' },
  { phase: 'Drain',      lock: 'S (shared)', readsAllowed: true,  writesAllowed: false, typicalShare: 'short' },
  { phase: 'Commit',     lock: 'X (exclusive)', readsAllowed: false, writesAllowed: false, typicalShare: 'brief' },
];

for (const p of phases) {
  console.log(\`\${p.phase.padEnd(10)} lock=\${p.lock.padEnd(22)} reads=\${p.readsAllowed} writes=\${p.writesAllowed} (\${p.typicalShare})\`);
}
// -> Initialize lock=X (exclusive)           reads=false writes=false (brief)
// -> Bulk scan  lock=IX (intent-exclusive)   reads=true  writes=true  (most of the build)
// -> Drain      lock=S (shared)              reads=true  writes=false (short)
// -> Commit     lock=X (exclusive)           reads=false writes=false (brief)

// Confirms the app is only FULLY unavailable during the brief
// Initialize and Commit phases -- not for the whole build.
const fullyBlockedPhases = phases.filter(p => !p.readsAllowed && !p.writesAllowed);
console.log('Fully-blocked phases:', fullyBlockedPhases.map(p => p.phase));
// -> [ 'Initialize', 'Commit' ]  -- exactly 2 of the 4 phases, both brief`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A write arrives during the "Drain" phase specifically (S lock — reads allowed, writes NOT allowed). What happens to that write — does it fail outright, or does something else happen to it?',
  hint: 'The drain phase exists specifically to catch writes that happened DURING the earlier bulk-scan phase, before the index can be finalized. Think about what "drain" implies about pending work, not about rejecting new work outright.',
  solution: `// The write is not simply rejected with an error -- it is
// temporarily BLOCKED (queued) until the drain phase completes and
// the build moves into its final Commit phase, at which point normal
// write processing resumes. The S lock during Drain specifically
// prevents NEW writes from starting while MongoDB catches up on
// applying any writes that occurred during the earlier, much longer
// bulk-scan phase to the index structure being built.
//
// Since the Drain phase is documented as short (it only needs to
// catch up on writes from the scan phase, not redo the whole scan),
// this queuing is typically brief -- but it IS a real, if short,
// write-blocking window, distinct from the bulk-scan phase's own
// fully concurrent reads+writes.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'MongoDB 4.2 made index builds "background" by default, and MongoDB 4.4 then further improved this by adding the lock-only-at-start-and-end behavior on top.',
    reality: 'Verified against MongoDB\'s own documented version history: the lock-only-at-start-and-end hybrid protocol IS what MongoDB 4.2 introduced, replacing the OLD foreground/background distinction entirely — it was never a separate, later 4.4 improvement layered on top of a 4.2 "background" feature. There is no meaningful "background: true" behavior distinct from a plain createIndex() call since 4.2 — both go through the identical hybrid protocol.',
  },
  {
    thought: 'Since index builds "no longer block reads/writes," an application can safely assume zero availability impact from running createIndex() on a live, high-traffic collection.',
    reality: 'Verified via the four-phase model: two of the four phases (Initialize and Commit) DO take a full exclusive lock, blocking both reads and writes — just briefly, compared to the OLD foreground build\'s full-duration block. "No longer blocks reads/writes" describes the BULK SCAN phase specifically (correctly, the vast majority of a large build\'s time) — it is not an unconditional guarantee across literally every moment of the build.',
  },
];

@Component({
  selector: 'app-mongo-indexes-hybrid-build',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './hybrid-index-builds-the-real-4-2-lock-timeline.html',
  styleUrl: './hybrid-index-builds-the-real-4-2-lock-timeline.scss',
})
export class HybridIndexBuildsTheReal42LockTimelineSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
