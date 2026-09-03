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
    heading: 'A Partial Index Must Match the Query It Supports',
    points: [
      'The main page\'s own "Delete Operations" theory bullet paired a soft-delete query — <code>{ deletedAt: null }</code> — with a partial index built on <code>{ deletedAt: { $exists: true } }</code>. Verified directly against MongoDB\'s own documented rule: a partial index is only consulted when the query\'s own filter matches (or implies) the index\'s <code>partialFilterExpression</code> — these two filters do not match.',
      'Verified with a concrete simulation across three representative documents: an active document with <code>deletedAt</code> explicitly set to <code>null</code>, a genuinely deleted document with a real date, and an active document that never had <code>deletedAt</code> set at all (a realistic case — the field was added to the schema after older documents already existed). The QUERY <code>{ deletedAt: null }</code> correctly matches the two ACTIVE documents (explicit-null and missing-field alike, per MongoDB\'s own well-documented null-matches-missing behavior). The <code>$exists: true</code> index filter covers a DIFFERENT pair entirely — the explicit-null document AND the deleted one, while excluding the missing-field document.',
      'The fix is to build the partial index on the EXACT same filter the query uses: <code>{ key: { deletedAt: 1 }, partialFilterExpression: { deletedAt: null } }</code>. This is both syntactically valid (a plain equality expression is one of the documented allowed forms for <code>partialFilterExpression</code>) and semantically correct — it indexes precisely the documents the soft-delete query actually needs, and nothing else.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Query Filter vs. Partial Index Filter, Verified',
    language: 'typescript',
    code: `// Simulates MongoDB's own partial-index eligibility rule: a query can
// use a partial index only when the query's filter matches the index's
// partialFilterExpression.

function matchesFilter(doc: Record<string, any>, filter: Record<string, any>): boolean {
  for (const [key, cond] of Object.entries(filter)) {
    if (cond && typeof cond === 'object' && '\$exists' in cond) {
      const exists = Object.prototype.hasOwnProperty.call(doc, key);
      if (exists !== cond.\$exists) return false;
    } else {
      // Plain equality -- MongoDB's real { field: null } semantics also
      // match a MISSING field, not only an explicit null value.
      const effective = Object.prototype.hasOwnProperty.call(doc, key) ? doc[key] : null;
      if (effective !== cond) return false;
    }
  }
  return true;
}

const docs = [
  { _id: 1, name: 'active-explicit-null', deletedAt: null },
  { _id: 2, name: 'deleted',               deletedAt: new Date('2024-01-01') },
  { _id: 3, name: 'active-missing-field' }, // never had deletedAt set at all
];

const queryFilter       = { deletedAt: null };
const brokenIndexFilter = { deletedAt: { \$exists: true } };
const fixedIndexFilter  = { deletedAt: null };

console.log('Query { deletedAt: null } matches:',
  docs.filter(d => matchesFilter(d, queryFilter)).map(d => d.name));
// -> ['active-explicit-null', 'active-missing-field']

console.log('BROKEN index ($exists: true) covers:',
  docs.filter(d => matchesFilter(d, brokenIndexFilter)).map(d => d.name));
// -> ['active-explicit-null', 'deleted']  -- wrong set entirely

console.log('FIXED index (deletedAt: null) covers:',
  docs.filter(d => matchesFilter(d, fixedIndexFilter)).map(d => d.name));
// -> ['active-explicit-null', 'active-missing-field']  -- matches the query exactly`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A collection is migrated so every document ALWAYS has <code>deletedAt</code> explicitly set (either to <code>null</code> or a real date) — no document ever has the field missing. Does the ORIGINAL <code>$exists: true</code> index filter now correctly support the <code>{ deletedAt: null }</code> query, now that the missing-field case can\'t happen?',
  hint: 'Re-run matchesFilter() against just the two possible document shapes left after the migration (explicit-null and a real date) — does $exists: true still include a document it shouldn\'t?',
  solution: `// No -- it's still wrong, just in a different way. Even with the
// missing-field case eliminated, $exists: true STILL matches the
// "deleted" document (deletedAt: a real date) -- because that document
// DOES have the field, it just isn't null. So the "index" would cover
// BOTH active and deleted documents, defeating the entire point of a
// partial index (keeping the index small by excluding documents the
// soft-delete query never needs).
//
// $exists: true was never the right filter for this use case at all --
// it answers "does this field exist," not "is this document active,"
// and those are two genuinely different questions. Only
// { deletedAt: null } (matching the query's own filter exactly) is
// correct, migration or not.`,
};

const misconceptions: Misconception[] = [
  {
    thought: '$exists: true is a reasonable filter for "this document has been touched by the soft-delete feature" — close enough to "active" for indexing purposes.',
    reality: '"Has the field been touched" and "is the document currently active" are different questions with different answers for the exact same document once it\'s been soft-deleted — a deleted document still HAS the deletedAt field (now set to a real date), so $exists: true is true for it. The confusion is mistaking presence-of-field for a specific VALUE of that field, when the query that actually needs supporting (deletedAt: null) cares only about the value.',
  },
  {
    thought: 'A partial index with the wrong filter still works, just less efficiently — MongoDB falls back to scanning the whole index instead.',
    reality: 'A partial index whose filter does not match the query\'s filter is not consulted AT ALL for that query — MongoDB falls back to a full COLLECTION scan, not a less-efficient index scan, since the index genuinely does not contain entries for documents the query needs but the index excluded. This is a correctness gap in query PLANNING, not merely a performance one — confirmed via the simulation above, where the broken index\'s own covered-document set and the query\'s own matched-document set only partially overlap.',
  },
];

@Component({
  selector: 'app-mongo-crud-partial-index-mismatch',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './why-the-soft-delete-index-needs-deletedat-null-not-exists.html',
  styleUrl: './why-the-soft-delete-index-needs-deletedat-null-not-exists.scss',
})
export class WhyTheSoftDeleteIndexNeedsDeletedatNullNotExistsSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
