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
    heading: 'Four Places Said 32 MB, One Place Said 100 MB',
    points: [
      'The main page stated the in-memory sort memory limit as "32 MB" in FOUR separate places — a theory bullet, a dedicated QnA (titled "What is the 32 MB sort memory limit?"), a mustKnow bullet, and an interviewFocus bullet. A FIFTH place on the same page — a different QnA on sort performance without an index — correctly stated "the in-memory sort limit is 100MB per query."',
      'Verified via WebSearch against MongoDB\'s own documented error behavior: the <code>QueryExceededMemoryLimitNoDiskUseAllowed</code> error message itself reports the exact limit as <strong>104857600 bytes</strong> — precisely 100 MiB (100 × 1024 × 1024). The correct figure is 100 MB, confirming the single QnA that already had it right, not the four sections that said 32 MB.',
      'This is worth noticing as a pattern: a specific-sounding number repeated in MULTIPLE places on the same page can still be wrong in all of them — repetition is not the same as verification. The one place with the CORRECT figure was outnumbered four-to-one by the wrong one, which is exactly why cross-checking a page\'s own sections against each other (not just trusting the majority) matters.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Confirming the Limit From the Error Itself',
    language: 'typescript',
    code: `// A sort with no supporting index, over more data than fits the
// in-memory sort buffer, produces an error whose OWN message states
// the exact limit -- no documentation lookup required to confirm it.
try {
  await db.collection('logs').find({}).sort({ message: 1 }).toArray();
} catch (err: any) {
  console.error(err.message);
  // -> "Sort exceeded memory limit of 104857600 bytes, but did not
  //     opt in to external sorting. Add an index, or specify a
  //     smaller limit, or use allowDiskUse."
}

// 104857600 bytes = 100 * 1024 * 1024 -- exactly 100 MiB, confirming
// the QnA that already had the correct figure.
console.log(104857600 / (1024 * 1024)); // -> 100

// The two real fixes named in the error message itself:
// 1. An index matching the sort -- indexed sorts never buffer in memory at all.
await db.collection('logs').createIndex({ message: 1 });

// 2. allowDiskUse -- only available in the AGGREGATION pipeline, not
// plain find().sort() -- spills to disk instead of failing outright.
await db.collection('logs').aggregate([
  { \$sort: { message: 1 } },
], { allowDiskUse: true }).toArray();`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A collection\'s documents average 2 KB each. Using the VERIFIED correct limit (104857600 bytes), roughly how many documents could an unindexed sort process before hitting <code>QueryExceededMemoryLimitNoDiskUseAllowed</code>?',
  hint: 'Divide the exact byte limit by the average document size in bytes (2 KB = 2048 bytes).',
  solution: `// 104857600 / 2048 = 51200 documents.
//
// Using the page's own original (wrong) 32 MB figure instead would
// have given a very different, also-wrong answer: 33554432 / 2048 =
// 16384 documents -- roughly a third of the real capacity. Getting
// this number right matters for capacity planning: a team sizing
// "how many documents can we safely sort without an index" against
// the wrong 32 MB figure would be needlessly conservative, possibly
// adding indexes or restructuring queries for a constraint that's
// actually about 3x more generous than they assumed.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since the main page stated "32 MB" in four separate sections and only one section said "100 MB," the 32 MB figure is more likely to be the correct one — repetition suggests reliability.',
    reality: 'The number of times a claim is repeated within one document says nothing about its accuracy — all four "32 MB" mentions plausibly trace back to the same single mistake, copied or paraphrased into different sections while authoring the page, rather than four independently-verified facts. Verifying against an external, authoritative source (in this case, the exact byte count reported by the real error message) settles it regardless of how the count breaks down on the page itself.',
  },
  {
    thought: 'allowDiskUse: true is a general MongoDB setting that fixes this memory limit for any kind of sort, including a plain find().sort() call.',
    reality: 'allowDiskUse is specifically an AGGREGATION PIPELINE option — it has no equivalent for plain find().sort(). Hitting this memory limit on a find().sort() query has exactly one real fix: add an index matching the sort. The only way to get allowDiskUse\'s disk-spilling behavior for the same sort is to rewrite the query as an aggregation pipeline using a $sort stage instead of find().sort().',
  },
];

@Component({
  selector: 'app-mongo-proj-sort-memory-limit',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-real-sort-memory-limit-is-100mb-not-32.html',
  styleUrl: './the-real-sort-memory-limit-is-100mb-not-32.scss',
})
export class TheRealSortMemoryLimitIs100mbNot32Subtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
