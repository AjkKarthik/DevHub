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
    heading: 'The Main Page\'s Own Quick Reference Was Missing a Real, Documented Pattern',
    points: [
      'The main page\'s own Quick Reference originally listed "Parent Reference" AND a separate "Adjacency List" entry, both describing the exact same mechanism — "each node stores its parent ID." Verified against MongoDB\'s own official tree-structure documentation, which names exactly FIVE patterns (Parent References, Child References, Array of Ancestors, Materialized Paths, Nested Sets) and never uses the term "Adjacency List" at all — it\'s an informal, general computer-science synonym for Parent Reference, matching what the page\'s own theory section already correctly says ("Parent Reference (Adjacency List)").',
      'Meanwhile, the page\'s own QnA fully explains a genuinely DIFFERENT, real MongoDB-documented pattern under the name "Ancestor Array" — each node stores an array of ALL its ancestor IDs (not just its immediate parent) — but that pattern never appeared in the Quick Reference at all. The Quick Reference has been corrected to replace the redundant "Adjacency List" entry with the real, previously-missing "Array of Ancestors" pattern.',
      'Verified against MongoDB\'s own official tutorial: the document shape stores BOTH a <code>parent</code> field (the immediate parent, same as Parent Reference) AND an <code>ancestors</code> array (every ancestor from root to immediate parent) — the two fields serve different queries, and neither one alone replaces the other.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Array of Ancestors: Descendants, Ancestors, Children',
    language: 'typescript',
    code: `const categories = db.collection('categories');

await categories.insertMany([
  { _id: 'Books',       ancestors: [],                                    parent: null },
  { _id: 'Programming', ancestors: ['Books'],                              parent: 'Books' },
  { _id: 'Databases',   ancestors: ['Books', 'Programming'],               parent: 'Programming' },
  { _id: 'MongoDB',     ancestors: ['Books', 'Programming', 'Databases'],  parent: 'Databases' },
  { _id: 'PostgreSQL',  ancestors: ['Books', 'Programming', 'Databases'],  parent: 'Databases' },
  { _id: 'Fiction',     ancestors: ['Books'],                              parent: 'Books' },
]);
await categories.createIndex({ ancestors: 1 });

// DESCENDANTS of Programming: implicit array-contains equality match --
// MongoDB matches if 'Programming' is ANYWHERE in the ancestors array.
const descendants = await categories.find({ ancestors: 'Programming' }).toArray();
// -> Databases, MongoDB, PostgreSQL  (NOT Programming itself -- a node
//    never appears in its OWN ancestors array)

// ANCESTORS of MongoDB: trivially just READ the field directly -- no
// query logic needed at all, unlike Materialised Path's own
// prefix-computation approach (see the sibling Schema Design Patterns
// subtopic on Materialised Path for that contrast).
const mongoNode = await categories.findOne({ _id: 'MongoDB' });
const ancestors = mongoNode.ancestors; // -> ['Books', 'Programming', 'Databases'], already in order

// DIRECT CHILDREN of Databases: query the parent field
const directChildren = await categories.find({ parent: 'Databases' }).toArray();
// -> MongoDB, PostgreSQL

// Pure-JS equivalent, verified against the same 6-node seed set:
function findDescendants(nodeId, docs) {
  return docs.filter(d => d.ancestors.includes(nodeId)).map(d => d._id);
}
function findAncestors(nodeId, docs) {
  return docs.find(d => d._id === nodeId).ancestors;
}

const seed = [
  { _id: 'Books', ancestors: [] },
  { _id: 'Programming', ancestors: ['Books'] },
  { _id: 'Databases', ancestors: ['Books', 'Programming'] },
  { _id: 'MongoDB', ancestors: ['Books', 'Programming', 'Databases'] },
  { _id: 'PostgreSQL', ancestors: ['Books', 'Programming', 'Databases'] },
  { _id: 'Fiction', ancestors: ['Books'] },
];
console.log('Descendants of Programming:', findDescendants('Programming', seed));
console.log('Ancestors of MongoDB:', findAncestors('MongoDB', seed));
console.log('Fiction is NOT a descendant of Programming:', !findDescendants('Programming', seed).includes('Fiction'));
// -> Descendants of Programming: [ 'Databases', 'MongoDB', 'PostgreSQL' ]
// -> Ancestors of MongoDB: [ 'Books', 'Programming', 'Databases' ]
// -> Fiction is NOT a descendant of Programming: true`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The Materialised Path subtopic\'s own descendants query (<code>{ path: /,Programming,/ }</code>) matched Programming\'s OWN document too, since its own path string contains ",Programming,". Does the Array of Ancestors descendants query (<code>{ ancestors: "Programming" }</code>) have the same behavior?',
  hint: 'Ask: does a node\'s OWN _id ever appear inside its OWN ancestors array?',
  solution: `// No -- this is a genuine, verified DIFFERENCE between the two
// patterns' descendants queries, not just a stylistic detail. A node
// is never its own ancestor, so 'Programming' never appears inside
// Programming's OWN ancestors array (['Books']) -- the query
// { ancestors: 'Programming' } correctly excludes Programming itself,
// returning only its TRUE descendants (Databases, MongoDB,
// PostgreSQL).
//
// Materialised Path's regex-based query includes the node itself
// because the SAME comma-bounded segment (",Programming,") that
// identifies descendants also appears in the node's OWN path string.
// Array of Ancestors has no equivalent self-inclusion, since the
// ancestors array by definition never lists the node itself.
//
// Practical consequence: if you want "this node AND its descendants"
// with Array of Ancestors, you need an explicit
// { $or: [{ _id: nodeId }, { ancestors: nodeId }] } -- Materialised
// Path's regex gets that for free, Array of Ancestors does not.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Array of Ancestors and Parent Reference are the same pattern under two different names, the same way "Parent Reference" and "Adjacency List" turned out to be — so storing an ancestors array is redundant if you already store parent.',
    reality: 'These are genuinely different, verified via MongoDB\'s own tutorial: Parent Reference alone answers "who is my immediate parent" in O(1), but finding ALL ancestors (or all descendants) still needs a recursive query or $graphLookup. Array of Ancestors additionally stores every ancestor ID directly, making both "find all my ancestors" (read one field) and "find all descendants of X" (one indexed equality query) fast, at the cost of updating every descendant\'s ancestors array whenever a subtree is moved.',
  },
  {
    thought: 'Since the ancestors array is just a plain array field, a query like { ancestors: "Programming" } would need $elemMatch or $in to search it correctly, the same way the Attribute Pattern needs $elemMatch for its specs array.',
    reality: 'A plain equality query against an array field ({ ancestors: "Programming" }) already performs an implicit "does this value appear anywhere in the array" match in MongoDB — no $elemMatch or $in needed. $elemMatch is specifically needed when checking that MULTIPLE conditions hold on the SAME array element (as with the Attribute Pattern\'s {k,v} object array) — a single scalar-value array like ancestors has no such multi-condition-per-element concern.',
  },
];

@Component({
  selector: 'app-mongo-modelling-ancestors-array',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './array-of-ancestors-the-real-fifth-tree-pattern.html',
  styleUrl: './array-of-ancestors-the-real-fifth-tree-pattern.scss',
})
export class ArrayOfAncestorsTheRealFifthTreePatternSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
