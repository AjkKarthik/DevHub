import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-sort-genuinely-stable-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './sort-is-genuinely-stable-ties-keep-insertion-order.html',
  styleUrl: './sort-is-genuinely-stable-ties-keep-insertion-order.scss',
})
export class SortIsGenuinelyStableTiesKeepInsertionOrderSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The QnA States a Historical Fact — This Verifies It Holds in the Actual Runtime',
      points: [
        'The QnA section says: "Since V8 10.0 (Chrome 90 / Node.js 16) and all modern engines, Array.prototype.sort() is guaranteed to be stable... Today you can rely on sort() stability for tie-breaking." This is presented as settled fact about modern engines, but the reader never sees a concrete tie-breaking scenario actually run to confirm it.',
        'This subtopic builds a realistic tie-breaking scenario — sorting people by <code>age</code> where several share the exact same age — and checks whether their ORIGINAL relative order (before sorting) survives among the tied entries after sorting.',
      ],
    },
    {
      heading: 'What "Stable" Actually Guarantees, Precisely',
      points: [
        'A stable sort guarantees: if two elements compare as EQUAL (the comparator returns <code>0</code>), their relative order in the OUTPUT matches their relative order in the INPUT. It says nothing about elements that compare as unequal — those are ordered strictly according to the comparator, as always.',
        'This matters specifically for MULTI-CRITERIA sorting: sort by a secondary criterion FIRST (e.g., alphabetically by name), then sort the RESULT by a primary criterion (e.g., by age) — a stable sort guarantees that among people with the SAME age, the earlier alphabetical-by-name order survives the second sort untouched, giving you a correct "sort by age, then by name as tiebreaker" result without writing a two-key comparator.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Array sort stability demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `interface Person { name: string; age: number; }

// Multiple people share the SAME age (30) -- these are the ties to watch.
const people: Person[] = [
  { name: 'Zoe',   age: 30 },
  { name: 'Alice', age: 25 },
  { name: 'Bob',   age: 30 },
  { name: 'Carol', age: 22 },
  { name: 'Dave',  age: 30 },
];

console.log('Original order:', people.map(p => p.name + '(' + p.age + ')'));

const sorted = [...people].sort((a, b) => a.age - b.age);

console.log('Sorted by age:', sorted.map(p => p.name + '(' + p.age + ')'));

const age30Names = sorted.filter(p => p.age === 30).map(p => p.name);
console.log('Order of the three age-30 people, AFTER sorting:', age30Names);
console.log('Their ORIGINAL relative order was: Zoe, Bob, Dave');
console.log('Stable sort preserved that order?', JSON.stringify(age30Names) === JSON.stringify(['Zoe', 'Bob', 'Dave']));
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Open the console. In the original array, the three age-30 people appear in the order Zoe, Bob, Dave. After sorting by age, do they still appear in that exact same relative order?',
    hint: 'A stable sort only makes a promise about elements that compare as EQUAL to each other — check whether that promise held for the three tied entries specifically.',
    solution: `The sorted output correctly orders everyone by age: Carol(22),
Alice(25), then the three age-30 people, in this exact order: Zoe,
Bob, Dave.

The three age-30 people appear in EXACTLY their original relative
order (Zoe, Bob, Dave) -- the same order they had in the unsorted
input array, even though the sort touched and reordered the whole
array around them. The final boolean check confirms this explicitly:
true.

This directly verifies the QnA's claim: Array.prototype.sort() in
this (modern) runtime IS genuinely stable. The practical value this
demonstrates: if you first stable-sorted this array alphabetically
by name (which would put Bob before Dave before Zoe), and THEN
stable-sorted the result by age, the age-30 group would end up
ordered Bob, Dave, Zoe -- a correct compound "by age, then
alphabetically" sort achieved with two SEPARATE single-key sorts,
relying entirely on stability to make the second sort respect the
first one's ordering among ties.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'sort() stability is a nice-to-have implementation detail that might vary between browsers or Node.js versions — code shouldn\'t rely on it for correctness.',
      reality: 'stability is a guaranteed, specified behavior of Array.prototype.sort() in the ECMAScript spec since ES2019, and has been implemented in all major engines (V8, SpiderMonkey, JavaScriptCore) for years — it is safe and idiomatic to rely on it.',
    },
    {
      thought: 'a stable sort guarantees the ENTIRE output array matches some predictable order beyond what the comparator specifies — like alphabetical as a universal tiebreaker.',
      reality: 'stability only guarantees that elements comparing as EQUAL keep their relative INPUT order — it says nothing about a universal tiebreaker; the "tiebreaker" is whatever order those specific elements happened to already have before this particular sort call.',
    },
    {
      thought: 'you need a custom multi-key comparator function (comparing age, then falling back to name) to correctly sort by two criteria — stability alone can\'t achieve this.',
      reality: 'a genuinely simpler alternative works because of stability specifically — sort by the secondary key first, then stable-sort the result by the primary key; the secondary order survives among primary-key ties, without ever writing a combined comparator.',
    },
  ];
}
