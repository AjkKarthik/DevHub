import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-export-type-strips-class-value-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-export-type-strips-the-value-even-for-a-class.html',
  styleUrl: './testing-that-export-type-strips-the-value-even-for-a-class.scss',
})
export class TestingThatExportTypeStripsTheValueEvenForAClassSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s export type Examples Are All Plain Types',
      points: [
        'Every <code>export type { X }</code> example on the main page — <code>export type { DateOptions } from \'./dates\'</code>, <code>export type { DateRange } from \'./dates\'</code>, <code>export type { Point } from \'./point\'</code> — re-exports something that was ALREADY a pure type (an interface or type alias) with no runtime existence at all.',
        'This subtopic tests something the page never shows: what happens when you write <code>export type { X }</code> for a NAME THAT IS ALSO A VALUE — specifically, a <code>class</code>, which exists simultaneously as both a type (the instance shape) and a value (the constructor you call with <code>new</code>). Does the re-export still let a consumer construct instances through it?',
      ],
    },
    {
      heading: 'Why export type Strips the Value Facet Even From a Class',
      points: [
        '<code>export type { Foo }</code> is a TYPE-ONLY re-export, regardless of what <code>Foo</code> actually is in the original module. For a plain interface, this distinction is invisible — interfaces have no value facet to strip in the first place. For a class, which genuinely has BOTH a type facet (the instance shape) and a value facet (the callable constructor), <code>export type</code> deliberately keeps ONLY the type facet.',
        'A consumer who does <code>import { Foo } from \'./barrel\'</code> where the barrel only did <code>export type { Foo }</code> gets a binding that TypeScript treats as type-only — using <code>Foo</code> as a type annotation works fine, but writing <code>new Foo()</code> through that specific import is a compile error, because the VALUE was never actually re-exported, only the TYPE.',
        'This is easy to miss because the class still works perfectly well through its ORIGINAL module (<code>import { Foo } from \'./original-file\'</code>, without going through the type-only barrel re-export) — the restriction is specific to the PATH the class was re-exported through, not to the class itself.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>export type and class value stripping</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'original.ts',
      content: `// A class -- exists as BOTH a type (instance shape) and a value (constructor)
export class Vector {
  constructor(public x: number, public y: number) {}
  length(): number { return Math.sqrt(this.x ** 2 + this.y ** 2); }
}
`,
    },
    {
      path: 'barrel.ts',
      content: `// The main page's own export type pattern, applied to a CLASS instead
// of a plain interface/type alias
export type { Vector } from './original';
`,
    },
    {
      path: 'index.ts',
      content: `// Importing directly from the ORIGINAL module -- both type and value work
import { Vector as VectorDirect } from './original';
const direct = new VectorDirect(3, 4);
console.log('constructed via direct import:', direct.length()); // 5

// Importing the SAME class through the type-only barrel re-export
import type { Vector as VectorViaBarrel } from './barrel';

// Using it as a TYPE works fine:
function magnitude(v: VectorViaBarrel): number {
  return Math.sqrt(v.x ** 2 + v.y ** 2);
}
console.log('used as a type annotation:', magnitude(direct)); // 5 -- fine, it's just a type

// const viaBarrel = new VectorViaBarrel(3, 4);
// Uncomment above -- does constructing an instance through the
// type-only barrel import compile?
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Uncomment `const viaBarrel = new VectorViaBarrel(3, 4);`. Read the exact compiler error. Then explain why constructing through VectorDirect (imported without `type`, directly from original.ts) works fine.',
    hint: 'The restriction lives on the IMPORT PATH, not on the class itself -- the same class remains fully constructible through any import that was never routed through a type-only re-export.',
    solution: `Uncommenting gives: "'VectorViaBarrel' cannot be used as a value
because it was imported using 'import type'." -- confirming the
value facet of Vector was genuinely stripped by the barrel's
export type { Vector } re-export, even though Vector is a class with
a real, callable constructor.

VectorDirect works fine because it was imported directly from
original.ts with an ordinary import (no type keyword anywhere in
that chain) -- the SAME class, reached through a DIFFERENT path,
keeps its full value facet.

The practical lesson: export type { X } strips the value from that
SPECIFIC re-export, not from X globally. If a barrel needs to
re-export a class (or anything else with a value facet) such that
consumers can both type-annotate with it AND construct new
instances through the barrel, use an ordinary export { X } from
'./original', not export type { X } from './original'.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '`export type { X }` and `export { X }` behave identically for anything that happens to also be usable as a type, like a class — the `type` keyword is just a hint for the compiler with no real runtime effect.',
      reality: '`export type { X }` genuinely strips the VALUE facet from that specific re-export — for a class (which has both a type and a value facet), consumers importing through a type-only re-export can use it as a type annotation but cannot construct instances through that import path.',
    },
    {
      thought: 'since a class only has ONE name (`Vector`), re-exporting it with `export type` or `export` produces the same thing, just packaged differently.',
      reality: 'a class name simultaneously refers to two DIFFERENT things — a type (the instance shape) and a value (the constructor) — and `export type` deliberately keeps only one of them, which is invisible for plain interfaces (which only ever had the type facet) but very real for classes.',
    },
    {
      thought: 'if a class is stripped of its value facet through one import path (a type-only barrel re-export), it loses that value facet everywhere in the program.',
      reality: 'the restriction is scoped entirely to the specific import statement that used `import type` (or came through an `export type` re-export) — the exact same class remains fully constructible through any other, ordinary import of it.',
    },
  ];
}
