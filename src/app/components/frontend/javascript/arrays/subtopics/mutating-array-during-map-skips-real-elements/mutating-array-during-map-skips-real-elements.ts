import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-mutating-array-during-map-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './mutating-array-during-map-skips-real-elements.html',
  styleUrl: './mutating-array-during-map-skips-real-elements.scss',
})
export class MutatingArrayDuringMapSkipsRealElementsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Mistake #4 Calls This "Undefined Behaviour" — Which Sounds Scarier and Vaguer Than It Actually Is',
      points: [
        'Mistake #4\'s wrong example comment says "undefined behaviour" — a phrase that sounds like the result could be ANYTHING, unpredictable from run to run. In reality, <code>map</code>\'s exact algorithm is fully specified; the RESULT of splicing during iteration is completely deterministic, just not what a reader would intuitively expect.',
        'This subtopic runs the exact scenario from Mistake #4 (mapping over an array while <code>splice</code>-ing elements out of it inside the callback) and compares the ACTUAL result against what a naive, non-mutating version of the same transformation produces — to show precisely which elements get skipped, not just that "something goes wrong."',
      ],
    },
    {
      heading: 'Why Splicing During map() Specifically Skips Elements',
      points: [
        '<code>Array.prototype.map</code> is specified to read the array\'s <code>.length</code> ONCE at the start, then iterate index <code>0</code>, <code>1</code>, <code>2</code>, ... up to that original length, reading <code>arr[i]</code> at EACH index as it goes — it does not "remember" what element was originally at each position; it reads whatever is CURRENTLY there when it reaches that index.',
        '<code>arr.splice(i, 1)</code> removes one element and shifts every element AFTER it DOWN by one index. If this happens inside the callback for index <code>i</code>, then by the time <code>map</code> advances to index <code>i + 1</code>, the element that WAS originally at <code>i + 2</code> has shifted down to occupy index <code>i + 1</code> — so <code>map</code> reads that shifted element there, and the element that was ACTUALLY meant to be at <code>i + 1</code> (the one that got shifted down to <code>i</code>, which map already passed) is never visited by the callback at all.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Mutating array during map demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The correct, expected result: every element doubled, nothing skipped.
const correct = [1, 2, 3, 4, 5];
const expected = correct.map(x => x * 2);
console.log('Expected (no mutation):', expected);

// The exact Mistake #4 scenario: splice INSIDE the map callback.
const buggy = [1, 2, 3, 4, 5];
const visitedIndices: number[] = [];
const buggyResult = buggy.map((x, i) => {
  visitedIndices.push(i);
  buggy.splice(i, 1);   // mutates the array map is currently iterating!
  return x * 2;
});

console.log('');
console.log('Buggy result (spliced during map):', buggyResult);
console.log('Indices map actually visited:', visitedIndices);
console.log('Array left over after the buggy map:', buggy);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Open the console. Compare "Expected" and "Buggy result" — how many elements does the buggy version actually process, and which specific values get skipped?',
    hint: 'Check "Indices map actually visited" — map only ever visits indices up to the array\'s ORIGINAL length, but the array itself is shrinking with every splice call.',
    solution: `Expected (no mutation): [2, 4, 6, 8, 10] -- all 5 elements
correctly doubled, as intended.

Buggy result (spliced during map): [2, 4, 6] -- only 3 values,
not 5. The array shrank as splice removed elements, and map's own
loop condition (bounded by the ORIGINAL length, 5) kept trying
indices 3 and 4 -- but by then the array had already shrunk below
those indices, so map simply stopped (reading past the end of a
now-shorter array returns nothing further to process).

Indices map actually visited: [0, 1, 2] -- only three callback
invocations happened at all, not five, because after each splice
the array had one fewer element, and by index 3, the array (now
length 2) no longer had anything there.

Array left over after the buggy map: [4, 5] -- the two elements
that were NEVER visited by the callback, because they kept getting
shifted into already-passed index positions.

This confirms Mistake #4's warning is accurate but understates how
CONCRETE and predictable the actual damage is: it isn't random or
unpredictable -- it deterministically skips exactly the elements
that get shifted into indices map has already moved past, and stops
early once the shrinking array runs out of indices within its
original bound.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"undefined behaviour" from mutating an array during map means the result is unpredictable or could vary between runs, similar to memory-unsafe behavior in lower-level languages.',
      reality: 'the result is completely deterministic and reproducible every single time — map\'s exact iteration algorithm is fully specified, so splicing during iteration produces the EXACT same (wrong) result on every run, not random behavior.',
    },
    {
      thought: 'the bug from mutating during map() causes the wrong VALUES to appear in the result — like doubling the wrong numbers.',
      reality: 'the values that DO get processed are transformed completely correctly (x * 2 is applied correctly to whatever map actually visits) — the bug is specifically that some elements are SKIPPED entirely, and the callback never even runs for them.',
    },
    {
      thought: 'this bug only matters for splice specifically — other array-mutating methods like push or pop inside a map callback would be equally safe.',
      reality: 'any mutation that changes the array\'s length or shifts element positions during iteration (splice, shift, unshift, and to a lesser extent push affecting a growing bound) can produce similar skipped-or-duplicated-element bugs — the general rule (never mutate the array map/filter/forEach is currently iterating) applies broadly, not just to splice.',
    },
  ];
}
