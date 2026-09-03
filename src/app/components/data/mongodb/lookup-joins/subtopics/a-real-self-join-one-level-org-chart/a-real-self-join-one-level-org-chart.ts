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
    heading: 'Same Collection Name in "from", One Level of Depth',
    points: [
      'One of the main page\'s own QnAs names the self-join pattern directly: "you can join a collection with itself by using the same collection name in from... useful for graph queries before $graphLookup was available" — but no codeTab on the page actually builds one. A self-join is nothing more than a normal $lookup where <code>from</code> is the SAME collection the aggregation is already running against.',
      'A one-level self-join answers "who is this document\'s immediate parent/manager/referrer" — it embeds exactly one level of the relationship. It does NOT answer "who is this document\'s manager\'s manager" or walk an arbitrary-depth chain; that recursive traversal is specifically what the page\'s own $graphLookup topic covers instead, as the QnA already correctly points out.',
      'A document with no parent at all (the top of the chart, a null <code>managerId</code>) needs no special-case handling — verified directly that $lookup on a null localField value simply finds no match (since no real document has an <code>_id</code> of null), producing a correctly EMPTY array for the top-level document, exactly the same "no match, empty array" behavior every other $lookup in this hub already relies on.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'One-Level Self-Join: Employee → Manager',
    language: 'typescript',
    code: `const employees = db.collection('employees');
// employees: { _id, name, managerId }  -- managerId references employees._id
// managerId is null for whoever sits at the top of the org chart

const withManager = await employees.aggregate([
  { \$lookup: {
    from:         'employees',   // <- SAME collection name = self-join
    localField:   'managerId',
    foreignField: '_id',
    as:           'manager',
  }},
  { \$addFields: {
    manager: { \$arrayElemAt: ['\$manager', 0] }, // undefined if no manager
  }},
]).toArray();

// Pure-JS equivalent, verified against a 4-employee seed set (Alice at
// the top with managerId: null, Bob and Carol reporting to Alice, Dave
// reporting to Bob):
function selfJoinManager(docs) {
  const byId = new Map(docs.map(d => [d._id, d]));
  return docs.map(d => ({
    ...d,
    manager: d.managerId != null ? [byId.get(d.managerId)].filter(Boolean) : [],
  }));
}

const employeeSeed = [
  { _id: 1, name: 'Alice', managerId: null },
  { _id: 2, name: 'Bob', managerId: 1 },
  { _id: 3, name: 'Carol', managerId: 1 },
  { _id: 4, name: 'Dave', managerId: 2 },
];

for (const r of selfJoinManager(employeeSeed)) {
  console.log(r.name, '-> manager array:', r.manager.map(m => m.name));
}
// -> Alice -> manager array: []          (top of chart, correctly EMPTY)
// -> Bob   -> manager array: [ 'Alice' ]
// -> Carol -> manager array: [ 'Alice' ]
// -> Dave  -> manager array: [ 'Bob' ]`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'Extending the same 4-employee seed set: how would you find Dave\'s <em>manager\'s manager</em> (Alice) using ONLY this one-level self-join pattern, without chaining a second $lookup or reaching for $graphLookup? What does that answer reveal about when a one-level self-join genuinely stops being enough?',
  hint: 'The result field from the one-level $lookup already contains a full employee document for the manager — including that manager\'s OWN managerId field.',
  solution: `// You genuinely CAN'T reach Alice with a single one-level self-join
// alone -- Dave's own "manager" field only ever contains Bob's full
// document (which itself HAS a managerId: 1 pointing at Alice), but
// nothing in the one-level result automatically resolves that second
// hop for you. To get Alice, you would need to EITHER:
//   1. Add a SECOND $lookup stage, self-joining again on
//      manager.managerId -> employees._id (chaining two one-level
//      joins to cover exactly two levels), or
//   2. Switch to $graphLookup, which recursively walks the chain to
//      whatever maxDepth you specify, in a single stage.
//
// This is exactly the boundary the theory section names: a one-level
// self-join answers "who is my immediate parent," full stop -- it
// does not generalize to arbitrary depth without either manually
// chaining one $lookup per level (impractical for a chart of unknown
// depth) or switching to the tool actually built for that job.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A self-join is a special MongoDB feature — some distinct syntax or option that tells $lookup "join this collection against itself."',
    reality: 'There is no special self-join syntax at all — it is an ordinary $lookup where the from field simply names the SAME collection the aggregation pipeline is already running against. MongoDB has no concept of "self-join mode"; it is purely a consequence of what string you happen to pass as from.',
  },
  {
    thought: 'A document with a null managerId (the top of the org chart) will cause $lookup to throw an error, since there is no real manager document to find.',
    reality: 'Verified directly: $lookup on a null localField value simply looks for a document whose foreignField equals null — since no real employee document has an _id of null, it finds zero matches and produces a normal, empty array, exactly the same behavior $lookup already has for any other value with no match. No error, no special-case handling required.',
  },
];

@Component({
  selector: 'app-mongo-lookup-self-join',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './a-real-self-join-one-level-org-chart.html',
  styleUrl: './a-real-self-join-one-level-org-chart.scss',
})
export class ARealSelfJoinOneLevelOrgChartSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
