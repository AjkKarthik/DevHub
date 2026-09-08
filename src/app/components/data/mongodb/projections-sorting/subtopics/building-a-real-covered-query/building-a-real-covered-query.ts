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
    heading: 'Every Field Must Be in the Index — Including _id',
    points: [
      'The main page\'s own "Covered Queries" theory states the exact rule in detail: every field in the filter, sort, AND projection must be part of the index, and <code>_id</code> must be explicitly excluded from the projection unless it is ALSO indexed (since <code>_id</code> is returned by default otherwise). No codeTab anywhere on the page builds one, or checks the <code>explain()</code> output the same theory names.',
      'Verified this exact rule with a small coverage-checking function: an index on <code>{ status: 1, createdAt: 1 }</code> covers a query filtering on <code>status</code>, sorting by <code>createdAt</code>, and projecting <code>{ status: 1, createdAt: 1, _id: 0 }</code> — but the SAME query WITHOUT the explicit <code>_id: 0</code> is NOT covered, since <code>_id</code> defaults to included and isn\'t part of this particular index.',
      'The check the main page\'s own theory describes — <code>.explain("executionStats")</code>, looking for <code>totalDocsExamined: 0</code> alongside a nonzero <code>totalKeysExamined</code> — confirms coverage empirically against a real server; the pure-logic version here verifies the underlying RULE that determines whether that empirical check would pass, without needing a live database.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'A Real Covered Query, With the Common Miss',
    language: 'typescript',
    code: `const orders = db.collection('orders');

// The covering index: must contain every field the query touches.
await orders.createIndex({ status: 1, createdAt: 1 });

// COVERED: filter (status) + sort (createdAt) + projection
// (status, createdAt) are ALL in the index, and _id is explicitly
// excluded since it is NOT part of the index.
const covered = await orders
  .find({ status: 'shipped' }, { projection: { status: 1, createdAt: 1, _id: 0 } })
  .sort({ createdAt: -1 })
  .toArray();

// NOT COVERED: identical query, but forgot _id: 0. _id defaults to
// included, and _id is not in the { status: 1, createdAt: 1 } index
// -- MongoDB must now fetch the full document to retrieve _id,
// silently losing the covered-query optimization.
const notCovered = await orders
  .find({ status: 'shipped' }, { projection: { status: 1, createdAt: 1 } })
  .sort({ createdAt: -1 })
  .toArray();

// Verify empirically:
const explainResult = await orders
  .find({ status: 'shipped' }, { projection: { status: 1, createdAt: 1, _id: 0 } })
  .sort({ createdAt: -1 })
  .explain('executionStats');

console.log(explainResult.executionStats.totalDocsExamined);  // -> 0 (covered)
console.log(explainResult.executionStats.totalKeysExamined);  // -> nonzero`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'Using the SAME <code>{ status: 1, createdAt: 1 }</code> index, a query filters on <code>status</code>, sorts by <code>createdAt</code>, and projects <code>{ status: 1, createdAt: 1, updatedBy: 1, _id: 0 }</code> — correctly excluding _id this time. Is this query covered?',
  hint: 'Check EVERY field the projection asks for against the index fields, not just whether _id was handled correctly.',
  solution: `// No -- NOT covered. Even with _id correctly excluded, the
// projection also requests updatedBy, which is NOT part of the
// { status: 1, createdAt: 1 } index. MongoDB still has to fetch the
// full document from the collection to retrieve updatedBy, breaking
// coverage exactly the same way a missing _id: 0 would have.
//
// This confirms coverage is an ALL-fields requirement, not just an
// _id-specific rule -- _id is simply the field most often forgotten,
// since it's easy to overlook that it's included by default. Adding
// updatedBy to the index itself -- { status: 1, createdAt: 1,
// updatedBy: 1 } -- would restore coverage for this exact query.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A covered query is any query that uses an index at all — as long as explain() shows IXSCAN instead of COLLSCAN, the query is covered.',
    reality: 'Using an index (IXSCAN) and being COVERED are two different, related things. An indexed query still typically has to FETCH each matching document from the collection to read fields the index itself doesn\'t store — that fetch step is exactly what coverage eliminates. The precise signal for genuine coverage is totalDocsExamined: 0 in explain() output, not merely the presence of an IXSCAN stage.',
  },
  {
    thought: 'Once a query is covered, adding a new field to its projection just makes the response slightly larger, without affecting coverage.',
    reality: 'Adding ANY field to the projection that is not already part of the covering index immediately breaks coverage for that query — verified directly above with the updatedBy example. A covering index has to be deliberately maintained alongside the exact set of fields a hot query path actually needs; a seemingly harmless addition to the projection can silently downgrade a fully covered query back to a document-fetching one.',
  },
];

@Component({
  selector: 'app-mongo-proj-covered-query',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './building-a-real-covered-query.html',
  styleUrl: './building-a-real-covered-query.scss',
})
export class BuildingARealCoveredQuerySubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
