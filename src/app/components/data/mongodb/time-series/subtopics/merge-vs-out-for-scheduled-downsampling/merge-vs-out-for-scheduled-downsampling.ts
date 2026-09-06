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
    heading: '$out Replaces Everything; $merge Only Touches What It Produces',
    points: [
      'One of the main page\'s own QnAs explains, in real detail, exactly why <code>$merge</code> is preferred over <code>$out</code> for a scheduled (e.g. nightly) downsampling job — but no codeTab on the page ever runs the two side by side, or shows what actually happens across TWO separate scheduled runs.',
      '<code>$out</code> completely REPLACES the entire target collection with the current aggregation\'s output. A nightly downsampling job that only ever computes THAT day\'s own hourly rollups would silently wipe out every previously-computed day\'s rollup on every single run.',
      '<code>$merge</code> instead upserts — it inserts or updates only the specific documents THIS run produced, leaving every other document already in the target collection (including every prior day\'s rollup) completely untouched. This is what actually lets a scheduled job accumulate summary history over time instead of only ever showing the most recent run\'s output.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: '$merge vs. $out Across Two Scheduled Runs',
    language: 'typescript',
    code: `const metrics = db.collection('server_metrics');

// A nightly job that downsamples ONLY today's own raw measurements
// into hourly rollups -- run once per day, on a schedule.
async function downsampleToday(dayStart: Date, dayEnd: Date) {
  await metrics.aggregate([
    { \$match: { timestamp: { \$gte: dayStart, \$lt: dayEnd } } },
    { \$group: {
      _id: { \$dateToString: { format: '%Y-%m-%dT%H', date: '\$timestamp' } },
      avgCpu: { \$avg: '\$cpuPercent' },
    }},
    // BUGGY: \$out replaces the ENTIRE rollups collection with just
    // today's own output -- every earlier day's rollup vanishes.
    // { \$out: 'hourly_rollups' },

    // FIXED: \$merge upserts -- only today's own _id values are
    // touched; every previously-written rollup document survives.
    { \$merge: { into: 'hourly_rollups', whenMatched: 'replace', whenNotMatched: 'insert' } },
  ]).toArray();
}

// Pure-JS model of the two target-collection strategies, verified
// across two sequential scheduled runs (day 1, then day 2):
let rollupCollection = new Map();

function runWithOut(newRollupDocs) {
  rollupCollection = new Map(newRollupDocs.map(d => [d._id, d])); // full replace
}
function runWithMerge(newRollupDocs) {
  for (const d of newRollupDocs) rollupCollection.set(d._id, d); // upsert only
}

const day1Rollup = [{ _id: '2026-09-01', avgTemp: 21.5 }];
const day2Rollup = [{ _id: '2026-09-02', avgTemp: 22.1 }];

console.log('--- Using \$out ---');
runWithOut(day1Rollup);
console.log('After day 1:', [...rollupCollection.values()]);
runWithOut(day2Rollup);
console.log('After day 2 (\$out):', [...rollupCollection.values()]);
// -> day 1's rollup is GONE

console.log('--- Using \$merge ---');
rollupCollection = new Map();
runWithMerge(day1Rollup);
console.log('After day 1:', [...rollupCollection.values()]);
runWithMerge(day2Rollup);
console.log('After day 2 (\$merge):', [...rollupCollection.values()]);
// -> BOTH day 1 and day 2 rollups present`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The main page\'s own "Daily min/max/avg per sensor" codeTab computes daily stats but never persists them anywhere — it just returns the result. If a THIRD scheduled run recomputes the SAME day (e.g., a re-run after fixing a bug in yesterday\'s job), what happens with $merge\'s <code>whenMatched: "replace"</code> option specifically?',
  hint: 'whenMatched controls what happens when the aggregation\'s output document has an _id that ALREADY EXISTS in the target collection — that\'s exactly the case a same-day re-run produces.',
  solution: `// With whenMatched: 'replace', the re-run's freshly-computed rollup
// for that day completely REPLACES the existing document with that
// same _id -- exactly the desired "correct yesterday's numbers"
// behavior for a re-run, without touching any OTHER day's rollup
// (which the aggregation's own \$match stage never even selected in
// the first place, so \$merge never has a document to reconcile
// against for those days at all).
//
// This is the key distinction from \$out: \$merge's per-document
// upsert semantics mean "replace" only ever applies to documents
// whose _id the CURRENT run's own output actually produced -- it
// is a targeted, scoped replace, not the global wipe-and-replace
// \$out performs against the entire collection regardless of what
// the current run's output actually contains.`,
};

const misconceptions: Misconception[] = [
  {
    thought: '$merge and $out both write an aggregation\'s result to a collection, so the choice between them is purely about performance (which one is faster), not correctness.',
    reality: 'Verified directly across two sequential scheduled runs: $out silently destroys every previously-written document that the CURRENT run doesn\'t happen to reproduce, while $merge preserves them. For any RECURRING job that only ever computes a SLICE of the target collection\'s full history on each run (like "just today\'s rollup"), this is a correctness difference, not a performance one — $out is actively data-destroying in that scenario, regardless of how fast it runs.',
  },
  {
    thought: '$merge\'s whenMatched: "replace" option means it will silently overwrite ANY existing document in the target collection with unrelated data from the current run.',
    reality: 'Verified directly: whenMatched only applies to documents whose _id (or specified "on" fields) the CURRENT aggregation run\'s own output actually contains. A document for a day the current run never touched (because its own $match stage excluded it) is never compared against at all — it simply survives, untouched, exactly as if $merge had never run.',
  },
];

@Component({
  selector: 'app-mongo-timeseries-merge-vs-out',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './merge-vs-out-for-scheduled-downsampling.html',
  styleUrl: './merge-vs-out-for-scheduled-downsampling.scss',
})
export class MergeVsOutForScheduledDownsamplingSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
