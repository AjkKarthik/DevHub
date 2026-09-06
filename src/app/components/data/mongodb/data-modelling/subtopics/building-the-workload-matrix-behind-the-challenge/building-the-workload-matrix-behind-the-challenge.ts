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
    heading: 'The Matrix the Main Page\'s Own Challenge Never Shows',
    points: [
      'The main page\'s own theory names the workload matrix as the FIRST step in schema design — "list your top 10 queries/operations, their frequency, and their latency requirement" — but the concept stays entirely abstract. No codeTab, and not even the Challenge itself, ever builds an actual matrix or shows it driving a real decision.',
      'This subtopic builds the matrix for the Challenge\'s own Social Media Feed scenario (<code>follow</code>, <code>createPost</code>, <code>getFeed</code>) and traces exactly which row justifies which specific choice already baked into the Challenge\'s own solution — the extended reference (<code>authorName</code> on each post) and the computed pattern (<code>likeCount</code>) were not arbitrary "best practices," they were the direct, derivable consequence of one specific row in the matrix being 100 to 1,000 times more frequent than every write operation combined.',
      'A workload matrix is only useful if the numbers are honest estimates of YOUR actual traffic, not copied from a tutorial — the whole point is that a DIFFERENT set of frequencies for the identical schema shape can point to a different design, which the Try It exercise below demonstrates directly.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The Workload Matrix Behind the Challenge\'s Own Design',
    language: 'typescript',
    code: `// The workload matrix for the main page's own Challenge scenario
// (Social Media Feed) -- estimated frequencies for a mid-size app.
const workloadMatrix = [
  { operation: 'getFeed (home feed view)', freqPerSec: 5000, type: 'read',  latencyReqMs: 100, docsTouched: '1 query, ~20 docs' },
  { operation: 'like a post ($inc likeCount)', freqPerSec: 500, type: 'write', latencyReqMs: 150, docsTouched: '1 doc, atomic $inc' },
  { operation: 'createPost',               freqPerSec: 50,   type: 'write', latencyReqMs: 200, docsTouched: '1 insert' },
  { operation: 'follow',                    freqPerSec: 5,    type: 'write', latencyReqMs: 200, docsTouched: '1 upsert' },
];

// The matrix immediately quantifies WHY the Challenge's own choices
// were the right ones -- not by intuition, but by the numbers:
const totalReads = workloadMatrix.filter(r => r.type === 'read').reduce((s, r) => s + r.freqPerSec, 0);
const totalWrites = workloadMatrix.filter(r => r.type === 'write').reduce((s, r) => s + r.freqPerSec, 0);
console.log('Total reads/sec:', totalReads, '| Total writes/sec:', totalWrites);
console.log('getFeed alone is', Math.round(5000 / totalWrites), 'x more frequent than ALL writes combined');
// -> Total reads/sec: 5000 | Total writes/sec: 555
// -> getFeed alone is 9 x more frequent than ALL writes combined

// This 9x (or, at higher real-world read/write skew, often 100x-1000x)
// ratio is EXACTLY what justifies the Challenge's own two denormalising
// choices, each accepting a small write-side cost to protect the
// dominant read path:
// 1. authorName stored on each post (extended reference) -- avoids a
//    $lookup to the users collection on EVERY one of those 5000
//    reads/sec, at the cost of a batch update only when a user renames
//    (a rare write, nowhere in this matrix at all).
// 2. likeCount pre-computed via $inc (computed pattern) -- avoids
//    counting embedded/related like-documents on every one of those
//    5000 reads/sec, at the cost of one atomic increment per like
//    (500/sec, already accounted for in the matrix as its own row).`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'Suppose this app is actually an internal admin dashboard, not a public feed: getFeed runs only 2 times per second (a handful of staff checking in occasionally), but createPost runs 200 times per second (an automated system posting frequent status updates) and each post\'s authorName changes constantly (a rotating shift-worker\'s display name updates hourly). Would the SAME extended-reference schema still be the right choice?',
  hint: 'Extended reference trades write-side propagation cost for read-side speed. Check the SAME core assumption from the theory section — is the dominant traffic direction (and does the denormalized field even change slowly) still true under these new numbers?',
  solution: `// No -- under these new numbers, extended reference is likely the
// WRONG choice, even though the SCHEMA SHAPE looks identical.
//
// The matrix flips both of its own justifying assumptions at once:
// (1) reads (2/sec) are now dwarfed by writes (200/sec) -- optimizing
// the read path at the write path's expense no longer makes sense,
// since writes are the overwhelmingly dominant operation now; and
// (2) the denormalized field itself (authorName) now changes hourly,
// not rarely -- extended reference explicitly assumes the copied
// field is "relatively stable" (per the sibling Schema Design
// Patterns topic's own Extended Reference theory), and a field that
// changes on the same timescale as new posts are created means the
// propagation-update job (rewriting every existing post's authorName
// whenever a shift-worker's name rotates) would itself become a
// significant, constant background write load -- on TOP of the
// createPost writes already dominating the matrix.
//
// The better choice here: reference the author by ID only, and
// resolve authorName at read time (a $lookup or batch fetch) --
// exactly because read volume is now low enough to easily absorb
// that join cost, while write volume is high enough that ANY extra
// per-write propagation cost should be avoided. This is the same
// workload-matrix reasoning, just pointing at the opposite
// conclusion once the actual numbers underneath it changed.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A workload matrix is a one-time exercise done at the start of a project — once the schema is designed around it, the matrix itself can be discarded.',
    reality: 'Verified by the Try It exercise above: the identical schema shape can be objectively RIGHT or WRONG depending on the actual read/write ratio and how fast a denormalized field changes — both of which can shift as an application\'s usage evolves (a feature that was read-heavy at launch can become write-heavy after a product pivot). The matrix is a living artifact worth revisiting whenever real traffic patterns diverge meaningfully from what it originally assumed, not a one-time design document.',
  },
  {
    thought: 'The "right" schema decision (embed vs. reference, extended reference vs. plain reference) is a property of the DATA\'S shape (cardinality, relationship type) alone — the workload matrix is just a nice-to-have justification added afterward.',
    reality: 'The main page\'s own theory states data cardinality (one-to-few vs. one-to-many) as ONE input to the decision — but this subtopic\'s own worked example shows the SAME cardinality and the SAME relationship (a post referencing its author) can justify opposite schema choices purely based on the workload matrix\'s read/write ratio and field-change frequency. The matrix isn\'t decoration on top of a data-shape-driven decision — for patterns like extended reference specifically, it\'s a co-equal, sometimes decisive input.',
  },
];

@Component({
  selector: 'app-mongo-modelling-workload-matrix',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './building-the-workload-matrix-behind-the-challenge.html',
  styleUrl: './building-the-workload-matrix-behind-the-challenge.scss',
})
export class BuildingTheWorkloadMatrixBehindTheChallengeSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
