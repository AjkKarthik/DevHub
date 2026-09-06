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
    heading: 'Still Maintained on Writes, Invisible to the Query Planner',
    points: [
      'One of the main page\'s own QnAs names <code>hideIndex()</code> (MongoDB 6.0+) in a single sentence with zero code — but it directly solves the exact problem the main page\'s own "removing unused indexes" advice raises: how do you find out whether dropping an index is actually safe, without the risk of dropping it and finding out the hard way?',
      'A hidden index is verified, per MongoDB\'s own documentation, to be fully MAINTAINED — every insert/update/delete still updates it, exactly as if it were visible. The ONLY thing that changes is that the query planner is not allowed to consider it as a candidate plan at all.',
      'The <code>_id</code> index is the one documented exception — it can never be hidden. Every other index can be hidden and unhidden freely, with unhiding taking effect immediately (no rebuild needed), since the index was never actually stopped or dropped in the first place.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'hideIndex Before Committing to a Real Drop',
    language: 'typescript',
    code: `const users = db.collection('users');

// Suspect this index is unused (per the main page's own $indexStats
// advice) but want to verify safely before permanently dropping it.
await users.hideIndex('status_1_createdAt_-1');

// The index is now invisible to the query planner -- run the queries
// that WOULD have used it and confirm nothing regresses:
const check = await users.find({ status: 'active' }).explain('executionStats');
console.log('Plan while hidden:', check.queryPlanner.winningPlan.stage);
// -> likely COLLSCAN, or a different, less optimal index, if this
//    was in fact the only index serving this query pattern

// If performance holds up (this really was unused), commit to it:
await users.dropIndex('status_1_createdAt_-1');

// If performance regresses, undo IMMEDIATELY -- no rebuild needed,
// since the index was maintained the whole time it was hidden:
await users.unhideIndex('status_1_createdAt_-1');

// Pure-JS model of the planner-visibility effect, verified against a
// simplified 3-index seed set:
function selectWinningPlan(query, availableIndexes) {
  const visible = availableIndexes.filter(i => !i.hidden);
  const match = visible.find(i => i.name.startsWith(Object.keys(query)[0]));
  return match ? match.name : 'COLLSCAN';
}

let indexes = [
  { name: '_id_', hidden: false },
  { name: 'status_1_createdAt_-1', hidden: false },
  { name: 'email_1', hidden: false },
];
console.log('Plan before hiding:', selectWinningPlan({ status: 'active' }, indexes));

indexes = indexes.map(i => i.name === 'status_1_createdAt_-1' ? { ...i, hidden: true } : i);
console.log('Plan after hiding:', selectWinningPlan({ status: 'active' }, indexes));

indexes = indexes.map(i => i.name === 'status_1_createdAt_-1' ? { ...i, hidden: false } : i);
console.log('Plan after unhiding:', selectWinningPlan({ status: 'active' }, indexes));
// -> Plan before hiding: status_1_createdAt_-1
// -> Plan after hiding: COLLSCAN
// -> Plan after unhiding: status_1_createdAt_-1`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A team wants to hide the <code>_id</code> index temporarily, to test whether any of their queries secretly rely on it. Does <code>db.collection.hideIndex("_id_")</code> succeed?',
  hint: 'MongoDB\'s own documentation names exactly one index this operation can never target.',
  solution: `// No -- this fails. MongoDB's own documentation states the _id
// index specifically CANNOT be hidden -- it is the one documented
// exception to hideIndex()'s otherwise-general applicability. Every
// other index (single-field, compound, text, 2dsphere, and so on)
// can be hidden and unhidden freely; the _id index is excluded
// entirely, the same way it can never be DROPPED either.
//
// This makes sense given _id's own special role -- it is the one
// index MongoDB guarantees always exists and is always usable for
// exact-match lookups by primary key, so allowing it to be hidden
// (even temporarily, even for testing) would undermine a guarantee
// the rest of the system is built to rely on.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'hideIndex() is functionally the same as dropIndex() with an "undo" option — the index stops being maintained while hidden, and rebuilding it on unhideIndex() takes as long as creating it fresh would.',
    reality: 'Verified against MongoDB\'s own documentation: a hidden index is FULLY maintained the entire time it is hidden — every write still updates it, exactly as if it were visible. unhideIndex() takes effect immediately with NO rebuild at all, since the index\'s own data structure was never touched or removed. This is precisely what makes hideIndex() safe to experiment with in production — dropIndex() offers no equivalent instant-undo at all.',
  },
  {
    thought: 'A hidden index disappears from getIndexes() output, the same way a dropped index would, until it is unhidden again.',
    reality: 'Per MongoDB\'s own documented explain() output format, a hidden index still appears in the full index listing, just with an added hidden: true property — it never disappears from getIndexes() or similar listing commands. Only its ELIGIBILITY for query-plan selection changes, not its visibility in index-management tooling.',
  },
];

@Component({
  selector: 'app-mongo-indexes-hideindex',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './hideindex-testing-a-drop-without-actually-dropping.html',
  styleUrl: './hideindex-testing-a-drop-without-actually-dropping.scss',
})
export class HideindexTestingADropWithoutActuallyDroppingSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
