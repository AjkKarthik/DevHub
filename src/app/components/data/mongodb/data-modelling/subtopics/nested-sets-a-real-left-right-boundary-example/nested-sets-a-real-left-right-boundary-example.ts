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
    heading: 'Every Node Gets Two Numbers That Encode the Whole Subtree',
    points: [
      'The main page\'s own theory names Nested Sets in real detail — "each node stores left/right boundary values that encode the subtree... expensive to maintain" — but no codeTab on the page ever builds one, unlike Parent Reference and Materialised Path, which both get real codeTabs.',
      'Verified against MongoDB\'s own official Nested Sets tutorial: each document stores <code>left</code> and <code>right</code> integers such that a node\'s own range always fully CONTAINS every descendant\'s range. Descendants of a node are found with <code>{ left: { $gt: N.left }, right: { $lt: N.right } }</code> — every descendant\'s numbers fall strictly INSIDE the ancestor\'s own pair.',
      'Verified directly with a concrete insert: adding one new leaf node under an existing node requires shifting the left/right values of every ANCESTOR of the insertion point (and every sibling to its right) — for a 6-node tree, inserting one new leaf under "Databases" required updating exactly 3 existing documents (every ancestor from the insertion point up to the root), confirming the main page\'s own "expensive to maintain" claim with a real number, not just the abstract warning.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Nested Sets: Descendants, Ancestors, and the Insert Cost',
    language: 'typescript',
    code: `const categories = db.collection('categories');

await categories.insertMany([
  { _id: 'Books',       parent: 0,             left: 1, right: 12 },
  { _id: 'Programming', parent: 'Books',       left: 2, right: 11 },
  { _id: 'Languages',   parent: 'Programming', left: 3, right: 4 },
  { _id: 'Databases',   parent: 'Programming', left: 5, right: 10 },
  { _id: 'MongoDB',     parent: 'Databases',   left: 6, right: 7 },
  { _id: 'dbm',         parent: 'Databases',   left: 8, right: 9 },
]);

// DESCENDANTS of Databases (left=5, right=10): every node whose own
// range falls STRICTLY INSIDE Databases' own range.
const databases = await categories.findOne({ _id: 'Databases' });
const descendants = await categories.find({
  left: { \$gt: databases.left }, right: { \$lt: databases.right },
}).toArray();
// -> MongoDB, dbm

// ANCESTORS of Databases: every node whose range strictly CONTAINS it.
const ancestors = await categories.find({
  left: { \$lt: databases.left }, right: { \$gt: databases.right },
}).toArray();
// -> Books, Programming

// Pure-JS equivalent, verified against MongoDB's own documented
// example dataset:
function findDescendants(nodeId, docs) {
  const node = docs.find(d => d._id === nodeId);
  return docs.filter(d => d.left > node.left && d.right < node.right).map(d => d._id);
}
function findAncestors(nodeId, docs) {
  const node = docs.find(d => d._id === nodeId);
  return docs.filter(d => d.left < node.left && d.right > node.right).map(d => d._id);
}

const seed = [
  { _id: 'Books', left: 1, right: 12 },
  { _id: 'Programming', left: 2, right: 11 },
  { _id: 'Languages', left: 3, right: 4 },
  { _id: 'Databases', left: 5, right: 10 },
  { _id: 'MongoDB', left: 6, right: 7 },
  { _id: 'dbm', left: 8, right: 9 },
];
console.log('Descendants of Databases:', findDescendants('Databases', seed));
console.log('Ancestors of Databases:', findAncestors('Databases', seed));

// THE INSERT COST -- adding "PostgreSQL" as a new child of Databases:
// every node whose left/right is >= the insertion point must shift by 2
// (one new node needs exactly 2 new boundary numbers).
function insertChild(docs, parentId, newId) {
  const parent = docs.find(d => d._id === parentId);
  const insertPoint = parent.right;
  const shifted = docs.map(d => ({
    ...d,
    left: d.left >= insertPoint ? d.left + 2 : d.left,
    right: d.right >= insertPoint ? d.right + 2 : d.right,
  }));
  shifted.push({ _id: newId, parent: parentId, left: insertPoint, right: insertPoint + 1 });
  return shifted;
}

const afterInsert = insertChild(seed, 'Databases', 'PostgreSQL');
const changed = afterInsert.filter(d => {
  const orig = seed.find(s => s._id === d._id);
  return orig && (orig.left !== d.left || orig.right !== d.right);
}).map(d => d._id);
console.log('Nodes whose left/right actually changed (write cost):', changed);
// -> [ 'Books', 'Programming', 'Databases' ]  -- exactly the 3 ANCESTORS
//    of the insertion point; MongoDB and dbm (siblings, but with LOWER
//    boundary numbers than the insertion point) are untouched.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'If a new child is instead inserted under "Languages" (left=3, right=4) instead of "Databases", which existing nodes would need their left/right values updated — and specifically, would "Databases" (currently left=5, right=10) be one of them?',
  hint: 'The insertion point becomes Languages\' own right value (4). Any node whose left or right is >= 4 gets shifted -- check each existing node\'s numbers against that threshold.',
  solution: `// Yes, Databases WOULD be updated too -- along with MongoDB, dbm,
// Programming, and Books. The insertion point is Languages' own
// right value (4). Every node with left >= 4 OR right >= 4 shifts by
// 2: Databases (5,10 -> 7,12), MongoDB (6,7 -> 8,9), dbm (8,9 ->
// 10,11), Programming (2,11 -> 2,13), Books (1,12 -> 1,14). Only
// Languages itself (3,4) and its own new child are exempt from the
// shift on their OWN pre-insert values (Languages' own right value
// becomes 6 -- it grows to include its new child).
//
// This demonstrates something stronger than the codeTab's own
// example: inserting near the LEFT edge of a tree touches almost
// EVERY other node, since nested sets encode position via a single,
// globally ordered number line across the entire tree -- not just
// the direct ancestor chain. The codeTab's own insert (under
// Databases, near the middle) happened to only touch 3 ancestors;
// this insert (under Languages, near the start) touches 5 nodes,
// nearly the whole tree.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Inserting a new node into a Nested Sets tree only requires updating the DIRECT ancestors of the insertion point (parent, grandparent, and so on up to the root) — sibling subtrees elsewhere in the tree are untouched.',
    reality: 'Verified directly with a second insertion scenario: inserting under a node near the START of the tree (Languages, left=3) required updating not just its own ancestors (Programming, Books) but ALSO an entirely separate sibling subtree (Databases and its own children, MongoDB and dbm) — because ALL of those nodes happen to have boundary numbers greater than or equal to the insertion point on the tree\'s single shared number line. The "only ancestors change" pattern from the main codeTab\'s own example was a coincidence of WHERE in the tree that particular insertion happened to occur, not a general rule.',
  },
  {
    thought: 'The descendants query { left: { $gt: N.left }, right: { $lt: N.right } } and the ancestors query are just the same query with the comparison operators flipped, so they cost the same to run.',
    reality: 'Structurally the queries do look like mirror images, but they answer genuinely different-shaped questions from an indexing perspective: descendants of a node in a real tree can be MANY documents (an unbounded range scan), while ancestors of any node are bounded by the tree\'s own DEPTH (rarely more than a handful of levels) — the ancestors query is intrinsically cheap regardless of tree size, while the descendants query\'s cost scales with how large that specific subtree actually is.',
  },
];

@Component({
  selector: 'app-mongo-modelling-nested-sets',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './nested-sets-a-real-left-right-boundary-example.html',
  styleUrl: './nested-sets-a-real-left-right-boundary-example.scss',
})
export class NestedSetsARealLeftRightBoundaryExampleSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
