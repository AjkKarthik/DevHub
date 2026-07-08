import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-myreturntype-rejects-constructor-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-myreturntype-rejects-a-class-constructor.html',
  styleUrl: './testing-that-myreturntype-rejects-a-class-constructor.scss',
})
export class TestingThatMyreturntypeRejectsAClassConstructorSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s R6 Example, One Step Further',
      points: [
        'The infer tab defines <code>type MyReturnType&lt;T&gt; = T extends (...args: any[]) =&gt; infer R ? R : never</code> and shows <code>type R6 = MyReturnType&lt;string&gt;; // never — not a function</code>. A plain non-function type is correctly rejected.',
        'This subtopic tests a DIFFERENT kind of non-match: a class, referenced as <code>typeof SomeClass</code>. A class is technically "callable" in the sense that <code>new SomeClass()</code> invokes it — but does <code>MyReturnType&lt;typeof SomeClass&gt;</code> treat it as a function the way <code>R6</code> rejects a string, or does it somehow pick up the instance type?',
      ],
    },
    {
      heading: 'Why a Constructor Type Doesn\'t Match a Plain Call Signature',
      points: [
        'TypeScript distinguishes two different kinds of callable types: a CONSTRUCT signature, <code>new (...args: A) =&gt; T</code> (invoked with <code>new</code>), and a CALL signature, <code>(...args: A) =&gt; T</code> (invoked directly). <code>typeof SomeClass</code> — the type of the class itself, not an instance — has a construct signature, not a call signature.',
        'A type with only a construct signature is NOT structurally assignable to a plain call-signature function type by default. <code>typeof SomeClass extends (...args: any[]) =&gt; any</code> is <code>false</code> — the same as <code>string extends (...args: any[]) =&gt; any</code> being false. Both fail the check for the same structural reason, even though a class superficially "looks callable."',
        'This means <code>MyReturnType&lt;typeof SomeClass&gt;</code> resolves to <code>never</code>, exactly like <code>R6</code>. To get the actual instance type of a class from its constructor reference, TypeScript provides a DIFFERENT, purpose-built utility: <code>InstanceType&lt;typeof SomeClass&gt;</code>.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>MyReturnType and class constructors</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The main page's own MyReturnType, unchanged
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

// The main page's own R6 example, for reference
type R6 = MyReturnType<string>; // never -- not a function, per the main page

class Widget {
  constructor(public label: string) {}
}

// Does a class constructor type match the plain call-signature check?
type WidgetReturn = MyReturnType<typeof Widget>;
// Is this the Widget instance type, or never (rejected, like R6)?

function assertNever<T extends never>(): void {}
function assertWidget<T extends Widget>(): void {}

// assertNever<WidgetReturn>();
// Uncomment above -- does WidgetReturn behave like R6 (never)?

// assertWidget<WidgetReturn>();
// Uncomment above -- does WidgetReturn actually contain the Widget instance type?

// The purpose-built utility for this exact situation
type WidgetInstance = InstanceType<typeof Widget>;
const w: WidgetInstance = new Widget('save-button');
console.log('InstanceType correctly gives the real instance type:', w.label);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Uncomment `assertNever<WidgetReturn>();` and confirm it compiles. Then uncomment `assertWidget<WidgetReturn>();` and confirm it does NOT compile — proving WidgetReturn really is never, not the Widget instance type.',
    hint: 'A class constructor type has a construct signature (new (...args) => T), not a call signature ((...args) => T) — the two are structurally different, so typeof Widget fails the same extends check that a plain string fails.',
    solution: `assertNever<WidgetReturn>() compiles -- confirming WidgetReturn is
exactly never, the same result MyReturnType gives for a plain
non-function like string in the main page's own R6 example.

assertWidget<WidgetReturn>() fails to compile: "Type 'never' does
not satisfy the constraint 'Widget'." (never technically satisfies
almost any constraint as the bottom type in most contexts, but
here it's explicitly proving WidgetReturn resolved to never, not
Widget -- there is no meaningful instance type hiding inside it).

The correct tool for extracting a class's instance type from its
constructor reference is InstanceType<typeof Widget>, demonstrated
working correctly at the bottom of the file -- a genuinely different
utility built for genuinely different callable shape (construct
signatures) than MyReturnType (call signatures) handles.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'because a class is "callable" via `new SomeClass()`, `MyReturnType<typeof SomeClass>` should correctly extract the class\'s instance type, the same way it extracts a plain function\'s return type.',
      reality: 'a class constructor type has a CONSTRUCT signature (`new (...args) => T`), structurally different from the CALL signature (`(...args) => T`) that `MyReturnType` checks for — `typeof SomeClass` fails that check exactly like a non-function value does, resolving to `never`.',
    },
    {
      thought: 'the main page\'s R6 example ("MyReturnType<string> // never — not a function") only demonstrates rejecting completely unrelated, non-callable types.',
      reality: 'the same rejection applies to genuinely callable-looking types with the WRONG kind of call signature — a class constructor is a real, well-known case of this, not just an edge case involving unrelated primitives.',
    },
    {
      thought: 'if you need a class\'s instance type from its constructor reference, you would need to write a custom conditional type using infer, similar to MyReturnType.',
      reality: 'TypeScript already provides a purpose-built utility for exactly this — `InstanceType<typeof SomeClass>` — precisely because construct signatures need their own dedicated extraction logic, different from `ReturnType`/`MyReturnType`\'s call-signature logic.',
    },
  ];
}
