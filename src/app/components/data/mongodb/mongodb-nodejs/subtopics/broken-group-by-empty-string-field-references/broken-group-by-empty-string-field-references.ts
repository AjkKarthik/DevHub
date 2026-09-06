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
    heading: 'A "Total Spent Per Customer" Pipeline That Groups By Nothing',
    points: [
      'The main page\'s own QnA on the aggregation framework showed <code>{ $group: { _id: "", totalSpent: { $sum: "" }, orderCount: { $sum: 1 } } }</code> — both <code>_id</code> and the <code>$sum</code> expression were bare, empty string LITERALS, not the <code>$fieldName</code> references the surrounding text (and the pipeline\'s own name, "total spent") clearly intended.',
      'In MongoDB\'s aggregation syntax, a bare string like <code>""</code> or <code>"completed"</code> is a CONSTANT — every document is treated as having that exact same value. A field REFERENCE needs a leading <code>$</code>, like <code>"$customerId"</code> or <code>"$total"</code>. Without it, <code>_id: ""</code> groups every single document into ONE group (since they all share the same constant "value"), and <code>$sum: ""</code> sums a non-numeric constant, contributing nothing meaningful per document.',
      'Fixed to <code>_id: "$customerId"</code> and <code>$sum: "$total"</code> — now the pipeline actually groups by customer and sums each customer\'s real order total, matching what the QnA\'s own surrounding prose describes.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Constant vs. Field Reference in $group',
    language: 'typescript',
    code: `// Pure-JS model of MongoDB's own $group semantics, applied to a
// small dataset, comparing the BROKEN pipeline against the FIXED one.
interface Order { customerId: string; status: string; total: number; }

const orders: Order[] = [
  { customerId: 'alice', status: 'completed', total: 50 },
  { customerId: 'alice', status: 'completed', total: 30 },
  { customerId: 'bob',   status: 'completed', total: 20 },
  { customerId: 'carol', status: 'pending',   total: 999 }, // filtered out by $match
];

function runGroupBroken(docs: Order[]) {
  // _id: "" is a CONSTANT, not a field reference -- every document
  // falls into the SAME single group. $sum: "" sums a non-numeric
  // constant, contributing nothing meaningful per document.
  const matched = docs.filter(d => d.status === 'completed');
  return [{ _id: '', totalSpent: 0, orderCount: matched.length }];
}

function runGroupFixed(docs: Order[]) {
  const matched = docs.filter(d => d.status === 'completed');
  const groups: Record<string, { _id: string; totalSpent: number; orderCount: number }> = {};
  for (const doc of matched) {
    const key = doc.customerId;
    groups[key] ??= { _id: key, totalSpent: 0, orderCount: 0 };
    groups[key].totalSpent += doc.total;
    groups[key].orderCount += 1;
  }
  return Object.values(groups).sort((a, b) => b.totalSpent - a.totalSpent);
}

console.log('BROKEN pipeline result:', JSON.stringify(runGroupBroken(orders)));
// -> [{ "_id": "", "totalSpent": 0, "orderCount": 3 }] -- everything
// collapsed into one meaningless group.

console.log('FIXED pipeline result:', JSON.stringify(runGroupFixed(orders)));
// -> [{ "_id": "alice", "totalSpent": 80, "orderCount": 2 },
//     { "_id": "bob", "totalSpent": 20, "orderCount": 1 }]
// -- correctly grouped per customer with real totals, sorted highest first.

// The corrected pipeline, per MongoDB's own aggregation syntax:
const pipeline = [
  { \$match: { status: 'completed' } },
  { \$group: { _id: '\$customerId', totalSpent: { \$sum: '\$total' }, orderCount: { \$sum: 1 } } },
  { \$sort: { totalSpent: -1 } },
  { \$limit: 10 },
];`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A teammate "fixes" the broken pipeline by changing only <code>_id: ""</code> to <code>_id: "$customerId"</code>, but leaves <code>$sum: ""</code> untouched. Using the model above, does <code>totalSpent</code> now report the correct per-customer total?',
  hint: 'Grouping and summing are two INDEPENDENT parts of the same $group stage — fixing one does not automatically fix the other.',
  solution: `// No -- totalSpent would STILL be wrong (0 for every customer),
// even though the grouping itself is now correct (Alice and Bob would
// correctly appear as SEPARATE groups).
//
// _id (the grouping key) and $sum's own expression are two
// INDEPENDENT parts of the $group stage -- fixing the field reference
// in one has no effect on the other. Both "$customerId" AND "$total"
// need the leading "$" for the pipeline to both group correctly AND
// sum a real, meaningful value.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A bare string like "customerId" (no leading $) inside a $group stage is just a slightly informal way of referencing that field — MongoDB should still understand it as "group by the customerId field."',
    reality: 'A bare string is a CONSTANT to MongoDB\'s aggregation engine, not a field reference — every document is treated as if it had that exact literal value. The leading $ is not optional syntax sugar, it is what distinguishes "the literal text customerId" from "whatever value the customerId field holds on this document."',
  },
  {
    thought: 'If a $group stage produces a build-passing, syntactically valid pipeline, the RESULTS it produces are automatically meaningful.',
    reality: 'A pipeline with $group: { _id: "", totalSpent: { $sum: "" } } is perfectly valid MongoDB syntax that runs without any error at all — it just silently produces one meaningless group with a totalSpent of 0, rather than throwing anything that would call attention to the mistake. Syntactic validity and semantic correctness are two separate questions.',
  },
];

@Component({
  selector: 'app-mongo-node-broken-group',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './broken-group-by-empty-string-field-references.html',
  styleUrl: './broken-group-by-empty-string-field-references.scss',
})
export class BrokenGroupByEmptyStringFieldReferencesSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
