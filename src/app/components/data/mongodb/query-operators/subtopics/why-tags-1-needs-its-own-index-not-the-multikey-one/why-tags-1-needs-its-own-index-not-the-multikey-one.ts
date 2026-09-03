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
    heading: 'One Index Per Value, a Different Index Per Position',
    points: [
      'The main page\'s own QnA on array-size queries claimed a position-based query like <code>{ "tags.1": { $exists: true } }</code> "can use a multikey index on tags." Verified directly against MongoDB\'s own documented indexing rules: creating an index on the bare array field (<code>createIndex({ tags: 1 })</code>) produces a <strong>multikey</strong> index — one index entry per array VALUE, with no notion of position at all.',
      'Creating an index on a specific dotted position path instead — <code>createIndex({ "tags.1": 1 })</code> — produces a completely different, <strong>non-multikey</strong> index: one entry per DOCUMENT, keyed by whatever value happens to sit at index 1 of that document\'s array. These are two genuinely different index structures, not the same index used two different ways.',
      'The practical consequence: a multikey index on <code>tags</code> efficiently supports value-based queries (<code>$in</code>, <code>$all</code>, exact-match on any element) but does nothing for <code>"tags.1": { $exists: true }</code> — that query needs its OWN dedicated index on the <code>tags.1</code> path specifically, and a SEPARATE index again for <code>tags.4</code>, and so on for every position checked.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Multikey vs. Position-Specific Indexes',
    language: 'bash',
    code: `# A multikey index on the bare array field -- supports VALUE queries
db.products.createIndex({ tags: 1 })
# Efficiently serves:
#   db.products.find({ tags: "sale" })          -- exact value match
#   db.products.find({ tags: { $in: ["sale", "new"] } })
#   db.products.find({ tags: { $all: ["sale", "new"] } })
# Does NOT efficiently serve position-based queries like "tags.1".

# A position-specific index -- supports queries at ONE exact position
db.products.createIndex({ "tags.1": 1 })
# Efficiently serves:
#   db.products.find({ "tags.1": { $exists: true } })   -- has >= 2 elements
#   db.products.find({ "tags.1": "featured" })            -- element 1 equals a value
# Does NOT help "tags.4" -- that needs createIndex({ "tags.4": 1 }) separately.

# explain() makes the distinction visible: run the position query with
# ONLY the multikey tags index present, and the winning plan is a
# COLLSCAN, not an IXSCAN -- confirming the multikey index was never
# a candidate for this particular query shape at all.
db.products.find({ "tags.1": { $exists: true } }).explain("executionStats")`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A collection has ONLY a multikey index on the bare <code>tags</code> field (no position-specific indexes exist). A query filters on <code>{ "tags.2": { $exists: true } }</code>. Does the query fail, or does it still run — just without using an index?',
  hint: 'MongoDB never REQUIRES a matching index to exist for a query to be valid -- think about what the query planner falls back to when no suitable index is available.',
  solution: `// The query still runs correctly -- it just falls back to a full
// COLLSCAN (collection scan), examining every document to evaluate
// "tags.2": { $exists: true } directly, rather than using any index
// entry to shortcut the search.
//
// This is the SAME fallback behavior MongoDB uses whenever no
// suitable index exists for a query shape -- an unindexed query is
// slower, not invalid. The multikey index on the bare "tags" field
// is simply never even considered a CANDIDATE plan for this specific
// query, the same way an index on a completely unrelated field
// wouldn't be considered either.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Once an array field has any index on it, every kind of query against that array benefits from it.',
    reality: 'A single index structure only ever supports the specific access pattern it was actually built for. A multikey index on <code>tags</code> is built around array VALUES and helps value-based queries; it has no data structure at all representing WHERE in the array a given value sits, so it simply cannot answer a position-based question like "does index 1 exist" any faster than scanning every document.',
  },
  {
    thought: 'A position-specific index like { "tags.1": 1 } is itself a multikey index, just a narrower one.',
    reality: 'It is explicitly documented as a NON-multikey index — because a fixed position within an array holds at most one value per document (whatever sits at index 1, or nothing if the array is shorter), the index has exactly one entry per document, the same shape as an ordinary index on a plain scalar field. "Multikey" specifically describes an index with potentially MULTIPLE entries per document (one per array element), which a single fixed position can never produce.',
  },
];

@Component({
  selector: 'app-mongo-query-position-index',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './why-tags-1-needs-its-own-index-not-the-multikey-one.html',
  styleUrl: './why-tags-1-needs-its-own-index-not-the-multikey-one.scss',
})
export class WhyTags1NeedsItsOwnIndexNotTheMultikeyOneSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
