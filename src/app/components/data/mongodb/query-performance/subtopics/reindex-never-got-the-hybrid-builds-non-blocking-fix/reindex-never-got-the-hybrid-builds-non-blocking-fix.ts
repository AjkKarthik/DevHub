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
    heading: 'One Command Got the Non-Blocking Fix; the Other Never Did',
    points: [
      'The main page\'s own QnA on index fragmentation originally claimed "MongoDB 4.4+: background reindex supported (non-blocking)" for <code>reIndex()</code> — verified against MongoDB\'s own official documentation that this is false. <code>reIndex()</code> has NEVER supported a non-blocking mode in any version; it always takes a full exclusive lock for its entire duration, completely separate from the hybrid build protocol this hub\'s own sibling Indexes topic already covers for <code>createIndex()</code>.',
      'Two further, previously-unmentioned facts, also verified directly against MongoDB\'s own documentation: since MongoDB 5.0, <code>reIndex()</code> can ONLY be run on standalone instances at all — not on a replica set or sharded cluster, which covers the vast majority of real production deployments. It has also been deprecated since MongoDB 6.0, logging a warning on every use.',
      'The practical alternative the page now recommends: rebuild indexes individually with <code>dropIndex()</code> + <code>createIndex()</code> per index, which DOES get the non-blocking hybrid build protocol (and works fine on a replica set), instead of the single all-or-nothing <code>reIndex()</code> call.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'reIndex() vs. Rebuilding Individually',
    language: 'typescript',
    code: `const users = db.collection('users');

// AVOID: reIndex() -- fully blocking for its ENTIRE duration, on
// EVERY MongoDB version, with no non-blocking option at all. Also
// only runs on standalone instances since 5.0+, and deprecated since 6.0.
// await users.reIndex();

// PREFER: rebuild each index individually -- gets the non-blocking
// hybrid build protocol (createIndex()), and works on a replica set.
const existingIndexes = await users.getIndexes();
for (const idx of existingIndexes) {
  if (idx.name === '_id_') continue; // cannot be dropped/rebuilt
  await users.dropIndex(idx.name);
  await users.createIndex(idx.key, { name: idx.name });
}

// Modeling the blocking-time difference for the SAME total duration,
// verified against MongoDB's own documented locking behavior for
// each command:
function totalBlockedMs(phases) {
  return phases.filter(p => p.blocking).reduce((sum, p) => sum + p.durationMs, 0);
}

// createIndex() hybrid build: brief exclusive windows at start/end only
const createIndexPhases = [
  { phase: 'Initialize', blocking: true,  durationMs: 1000 },
  { phase: 'Bulk scan',  blocking: false, durationMs: 58000 },
  { phase: 'Drain',      blocking: false, durationMs: 900 },
  { phase: 'Commit',     blocking: true,  durationMs: 100 },
];
// reIndex(): ONE fully-blocking phase for the ENTIRE duration
const reIndexPhases = [
  { phase: 'Full rebuild', blocking: true, durationMs: 60000 },
];

console.log('createIndex() BLOCKED time:', totalBlockedMs(createIndexPhases), 'ms of 60000ms total');
console.log('reIndex() BLOCKED time:', totalBlockedMs(reIndexPhases), 'ms of 60000ms total');
console.log('reIndex() blocks', totalBlockedMs(reIndexPhases) / totalBlockedMs(createIndexPhases), 'x longer for the identical total duration');
// -> createIndex() BLOCKED time: 1100 ms of 60000ms total
// -> reIndex() BLOCKED time: 60000 ms of 60000ms total
// -> reIndex() blocks 54.545454545454545 x longer for the identical total duration`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A team running a 3-node replica set wants to reduce index fragmentation on a large collection. Per this subtopic\'s own verified findings, can they use <code>reIndex()</code> at all — and if not, what is the ONE structural fact (not the blocking behavior) that rules it out first?',
  hint: 'Think about what kind of MongoDB deployment reIndex() is restricted to running on, since MongoDB 5.0 — before even considering how long it would block anything.',
  solution: `// No -- and the disqualifying fact isn't the blocking behavior at
// all, it's the deployment-topology restriction: since MongoDB 5.0,
// reIndex() can ONLY be run on a STANDALONE instance. A 3-node
// replica set is definitionally not standalone, so the command is
// simply unavailable here, full stop -- the question of "how long
// would it block reads/writes" never even comes up, because the
// command cannot be issued against this deployment at all.
//
// This is worth keeping straight as two SEPARATE disqualifying facts,
// not one: (1) reIndex() is topology-restricted (standalone only,
// 5.0+), and (2) reIndex() is fully blocking with no non-blocking
// option (true on every version, standalone included). Even a team
// running a standalone MongoDB 5.0+ instance would still hit fact
// (2) and want to avoid reIndex() for that reason alone.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since MongoDB 4.2 introduced the hybrid (non-blocking) index build protocol for createIndex(), every index-related maintenance command from that point forward — including reIndex() — got the same non-blocking treatment.',
    reality: 'Verified directly against MongoDB\'s own documentation: the hybrid build protocol is specific to createIndex() (and the implicit index builds that happen alongside it) — reIndex() is a genuinely SEPARATE command with its own, unrelated locking behavior that the 4.2 hybrid-build improvement never touched at all. A command name evoking "rebuilding indexes" does not mean it shares implementation with the command that originally builds them.',
  },
  {
    thought: 'reIndex() being deprecated since MongoDB 6.0 just means it is discouraged stylistically — it still works exactly the same as before on any version that supports it.',
    reality: 'Deprecation here is layered on top of an ALREADY-restrictive command: even before considering the 6.0 deprecation warning, reIndex() was already topology-restricted to standalone instances only since 5.0, and was always fully blocking with no non-blocking mode on any version. The deprecation notice is one more reason to avoid it, not the only reason.',
  },
];

@Component({
  selector: 'app-mongo-qp-reindex',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './reindex-never-got-the-hybrid-builds-non-blocking-fix.html',
  styleUrl: './reindex-never-got-the-hybrid-builds-non-blocking-fix.scss',
})
export class ReindexNeverGotTheHybridBuildsNonBlockingFixSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
