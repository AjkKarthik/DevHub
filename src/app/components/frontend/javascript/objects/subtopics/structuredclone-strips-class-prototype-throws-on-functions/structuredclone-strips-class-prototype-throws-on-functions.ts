import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-structuredclone-limits-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './structuredclone-strips-class-prototype-throws-on-functions.html',
  styleUrl: './structuredclone-strips-class-prototype-throws-on-functions.scss',
})
export class StructuredcloneStripsClassPrototypeThrowsOnFunctionsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The QnA Lists structuredClone\'s Limits, But Only the Main Page\'s Success Cases Are Ever Actually Run',
      points: [
        'The Cloning code tab runs <code>structuredClone()</code> successfully on Dates, Maps, Sets, nested arrays, and circular references — a genuinely impressive list. The QnA separately states its LIMITS in prose: "cannot clone functions (throws), class instances lose their prototype (become plain objects)" — but neither limitation is ever actually demonstrated running.',
        'This subtopic runs both failure modes directly: cloning a class instance (checking whether <code>instanceof</code> still passes afterward) and cloning an object containing a function (catching the actual thrown error).',
      ],
    },
    {
      heading: 'Why These Two Cases Specifically Break',
      points: [
        '<code>structuredClone()</code> is built on the HTML Structured Clone Algorithm — a serialization format designed for the <code>postMessage()</code> API (sending data between browser windows, workers, and tabs). This algorithm has a FIXED, well-defined list of cloneable types: primitives, plain objects, arrays, Date, RegExp, Map, Set, ArrayBuffer, and a few others.',
        'Functions are NOT on that list at all — they cannot be serialized in ANY form the structured clone algorithm understands, so encountering one anywhere in the object graph throws a <code>DataCloneError</code> immediately, aborting the whole clone.',
        'A class instance CAN be cloned, but only its OWN, plain, serializable DATA properties survive — the algorithm has no concept of "what class was this," so the clone comes back as a genuinely plain object (its prototype is <code>Object.prototype</code>, not the original class), and any METHODS defined on the class\'s prototype (not copied as own data properties) are simply gone from the clone.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>structuredClone limits demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `class Point {
  x: number;
  y: number;
  constructor(x: number, y: number) { this.x = x; this.y = y; }
  distanceFromOrigin() { return Math.sqrt(this.x ** 2 + this.y ** 2); }
}

const original = new Point(3, 4);
console.log('original instanceof Point:', original instanceof Point);
console.log('original.distanceFromOrigin():', original.distanceFromOrigin());

const clonedPoint = structuredClone(original);
console.log('');
console.log('clonedPoint.x, clonedPoint.y:', clonedPoint.x, clonedPoint.y);
console.log('clonedPoint instanceof Point:', clonedPoint instanceof Point);
console.log('typeof clonedPoint.distanceFromOrigin:', typeof (clonedPoint as any).distanceFromOrigin);

console.log('');
console.log('--- Cloning an object containing a function ---');
try {
  const withFunction = { label: 'hi', fn: () => 42 };
  structuredClone(withFunction);
  console.log('No error thrown (unexpected!)');
} catch (err) {
  console.log('structuredClone THREW:', (err as Error).name, '-', (err as Error).message);
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Open the console. After cloning the Point instance, is clonedPoint still instanceof Point? Does it still have a working distanceFromOrigin method? What happens when structuredClone is given an object with a function inside it?',
    hint: 'Ask whether structuredClone knows anything about the ORIGINAL class the object came from, or only about its own, plain data properties.',
    solution: `clonedPoint.x and clonedPoint.y correctly show 3 and 4 -- the plain
DATA properties survived cloning fine.

clonedPoint instanceof Point is FALSE -- the clone lost its
connection to the Point class entirely; its prototype is now the
generic Object.prototype, not Point.prototype.

typeof clonedPoint.distanceFromOrigin is "undefined" -- the method,
which lived on Point.prototype (not as an own property of the
instance), is completely gone from the clone. There is no way to
call clonedPoint.distanceFromOrigin() anymore.

The function-cloning attempt throws a real error:
"structuredClone THREW: DataCloneError - could not be cloned"
(exact wording varies by browser) -- confirming functions are
entirely outside what the structured clone algorithm can represent,
aborting the clone immediately rather than silently dropping just
the function property.

This confirms both QnA claims precisely and makes the practical
consequence concrete: structuredClone() is excellent for cloning
plain DATA (which is its actual design purpose, inherited from
postMessage()'s serialization needs), but it is NOT a general-purpose
"deep clone this class instance and keep its behavior" tool -- for
that, a custom clone method or a library that understands your
specific class structure is still necessary.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'structuredClone(instance) produces a fully-functional deep copy of a class instance, including all its methods, since it "handles complex types" as the main page\'s own examples show.',
      reality: 'structuredClone only preserves OWN, plain DATA properties — it has no concept of the original class at all, so the clone comes back as a generic plain object with the class\'s prototype (and therefore all its methods) completely stripped away.',
    },
    {
      thought: 'if an object contains a function somewhere in its structure, structuredClone silently skips just that one property, similar to how JSON.stringify silently drops functions.',
      reality: 'structuredClone does NOT silently skip functions the way JSON.stringify does — it throws a real DataCloneError and aborts the ENTIRE clone operation the moment it encounters one, anywhere in the object graph.',
    },
    {
      thought: 'since structuredClone correctly handles Dates, Maps, Sets, and circular references, it must be a fully general "deep clone anything" utility comparable to a library like lodash.cloneDeep.',
      reality: 'structuredClone is deliberately scoped to the fixed, well-defined set of types the HTML Structured Clone Algorithm supports (built for postMessage serialization) — it is not a general-purpose deep-clone tool, and genuinely different from libraries designed to preserve class identity and behavior.',
    },
  ];
}
