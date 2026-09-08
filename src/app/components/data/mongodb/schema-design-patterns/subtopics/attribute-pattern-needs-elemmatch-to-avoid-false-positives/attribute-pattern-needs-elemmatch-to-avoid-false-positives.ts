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
    heading: 'One Compound Index Covers Every Attribute — With a Real Query Trap',
    points: [
      'One of the main page\'s own quiz questions explains the Attribute Pattern in real depth (turning sparse, per-type fields like <code>director</code>/<code>isbn</code>/<code>voltage</code> into a uniform <code>specs: [{ k, v }]</code> array, covered by ONE compound index on <code>specs.k</code> + <code>specs.v</code>) — but no codeTab on the page ever builds one.',
      'The quiz names the query pattern as <code>{ specs: { $elemMatch: { k: "director", v: "Nolan" } } }</code> — the <code>$elemMatch</code> is not decorative. Verified directly: a PLAIN query, <code>{ "specs.k": "director", "specs.v": "Nolan" }</code> (no $elemMatch), matches a document if SOME array element has <code>k: "director"</code> AND SOME (possibly DIFFERENT) element has <code>v: "Nolan"</code> — it does not require both to be true on the SAME element.',
      'This produces genuine false positives: a movie whose specs array contains <code>{ k: "director", v: "Villeneuve" }</code> and, separately, <code>{ k: "producer", v: "Nolan" }</code> would incorrectly match a plain query for director=Nolan, even though Nolan is the PRODUCER, not the director. <code>$elemMatch</code> requires one single array element to satisfy both conditions together, correctly excluding this case.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Attribute Pattern: specs Array + $elemMatch',
    language: 'typescript',
    code: `const products = db.collection('products');

// One compound index covers searches on ANY attribute name, regardless
// of how many different attribute types the catalog ends up needing.
await products.createIndex({ 'specs.k': 1, 'specs.v': 1 });

// Movies, books, and electronics all live in the SAME collection, each
// with completely different searchable attributes -- no sparse
// top-level fields, no per-type index needed.
await products.insertMany([
  {
    title: 'Inception', type: 'movie',
    specs: [
      { k: 'director', v: 'Nolan' },
      { k: 'language', v: 'English' },
    ],
  },
  {
    title: 'Some Other Movie', type: 'movie',
    // A decoy: 'director' and 'Nolan' both appear in specs, but on
    // TWO DIFFERENT elements -- Nolan is the PRODUCER, not the director.
    specs: [
      { k: 'director', v: 'Villeneuve' },
      { k: 'producer', v: 'Nolan' },
    ],
  },
]);

// CORRECT: $elemMatch requires BOTH k and v on the SAME array element
const correctResults = await products.find({
  specs: { \$elemMatch: { k: 'director', v: 'Nolan' } },
}).toArray();
// -> only 'Inception' -- the decoy movie is correctly excluded

// WRONG: no $elemMatch -- matches if 'director' appears ANYWHERE and
// 'Nolan' appears ANYWHERE, even on different elements
const wrongResults = await products.find({
  'specs.k': 'director', 'specs.v': 'Nolan',
}).toArray();
// -> BOTH movies match -- a false positive for 'Some Other Movie'

// Pure-JS equivalent, verified against the exact decoy scenario above:
function matchesPlainQuery(doc, k, v) {
  const hasK = doc.specs.some(s => s.k === k);
  const hasV = doc.specs.some(s => s.v === v);
  return hasK && hasV;
}
function matchesElemMatch(doc, k, v) {
  return doc.specs.some(s => s.k === k && s.v === v);
}

const movie = { title: 'Inception', specs: [{ k: 'director', v: 'Nolan' }, { k: 'language', v: 'English' }] };
const decoyMovie = { title: 'Some Other Movie', specs: [{ k: 'director', v: 'Villeneuve' }, { k: 'producer', v: 'Nolan' }] };

for (const [label, doc] of [['Inception', movie], ['Some Other Movie (decoy)', decoyMovie]]) {
  console.log(label, '-> plain query:', matchesPlainQuery(doc, 'director', 'Nolan'),
    '| $elemMatch:', matchesElemMatch(doc, 'director', 'Nolan'));
}
// -> Inception -> plain query: true | $elemMatch: true
// -> Some Other Movie (decoy) -> plain query: true (FALSE POSITIVE) | $elemMatch: false (correct)`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A THIRD product has <code>specs: [{ k: "director", v: "Nolan" }, { k: "director", v: "Villeneuve" }]</code> — genuinely TWO different values for the SAME key (perhaps a co-directed film, modeled awkwardly). Does <code>{ specs: { $elemMatch: { k: "director", v: "Nolan" } } }</code> correctly match this document?',
  hint: '$elemMatch only requires ONE array element to satisfy both conditions — it does not require EVERY element with that k to also have that v.',
  solution: `// Yes, it correctly matches. $elemMatch asks "does AT LEAST ONE
// element in the array satisfy both conditions together" -- it does
// not require every element sharing the same k to also share the
// same v. The first element, { k: 'director', v: 'Nolan' }, already
// satisfies both k === 'director' AND v === 'Nolan' on its own, so
// the document matches regardless of what the SECOND element
// ({ k: 'director', v: 'Villeneuve' }) contains.
//
// This is worth confirming explicitly, since it's easy to
// (incorrectly) assume $elemMatch means "this is the ONLY value for
// this key" -- it doesn't. It only asserts that a qualifying element
// EXISTS somewhere in the array, same as the standard $elemMatch
// semantics on any array of documents.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A plain query like { "specs.k": "director", "specs.v": "Nolan" } is just a more verbose way of writing $elemMatch — both check that the SAME array element has k="director" and v="Nolan".',
    reality: 'Verified directly with a decoy document: the plain (no-$elemMatch) form checks EACH condition independently against the WHOLE array — it matches as long as k="director" appears SOMEWHERE and v="Nolan" appears SOMEWHERE, even on two completely different elements. $elemMatch is the only form that actually requires both conditions to hold on ONE single element together.',
  },
  {
    thought: 'The Attribute Pattern\'s compound index on specs.k + specs.v only speeds up $elemMatch queries — a plain (non-$elemMatch) query on the same fields cannot use it.',
    reality: 'The SAME compound index on specs.k and specs.v can be used by both query forms — the index just locates candidate documents efficiently; whether the QUERY itself then applies the stricter $elemMatch same-element requirement or the looser independent-condition check is a separate matter from which index gets used. The index choice affects performance; $elemMatch vs. plain fields affects CORRECTNESS.',
  },
];

@Component({
  selector: 'app-mongo-schema-attribute-pattern',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './attribute-pattern-needs-elemmatch-to-avoid-false-positives.html',
  styleUrl: './attribute-pattern-needs-elemmatch-to-avoid-false-positives.scss',
})
export class AttributePatternNeedsElemmatchToAvoidFalsePositivesSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
