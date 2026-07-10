import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-strictfunctiontypes-method-syntax-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-strictfunctiontypes-doesnt-apply-to-method-syntax.html',
  styleUrl: './testing-that-strictfunctiontypes-doesnt-apply-to-method-syntax.scss',
})
export class TestingThatStrictfunctiontypesDoesntApplyToMethodSyntaxSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Example Uses a Property, Not a Method',
      points: [
        'The Strict mode sub-flags tab demonstrates <code>strictFunctionTypes</code> with <code>type Handler = (event: MouseEvent) =&gt; void; const h: Handler = (e: Event) =&gt; {};  // Error</code> — <code>Handler</code> is a type ALIAS for a function, and <code>h</code> is declared using a PROPERTY-style function type.',
        'This subtopic tests the exact same substitutability violation, but written using METHOD SYNTAX inside an interface instead — <code>interface Foo { handle(event: MouseEvent): void }</code> versus <code>interface Foo { handle: (event: MouseEvent) =&gt; void }</code>. Does <code>strictFunctionTypes</code> catch the same mistake in both forms?',
      ],
    },
    {
      heading: 'Why Method Syntax Is Deliberately Exempt',
      points: [
        'This is a documented, intentional TypeScript design decision, not an oversight: <code>strictFunctionTypes</code> ONLY applies to function types written as PROPERTIES (<code>handle: (e: MouseEvent) =&gt; void</code>). Function types written using METHOD SYNTAX (<code>handle(e: MouseEvent): void</code>) remain BIVARIANT — checked leniently in both directions — even with <code>strict: true</code> fully enabled.',
        'The reasoning is compatibility with common, genuinely safe OOP patterns — many real-world class hierarchies have methods that widen or narrow parameter types in ways that are unsound in the strictest sense but rarely cause actual bugs in practice (this mirrors how most mainstream OOP languages, including Java and C#, also check method parameters bivariantly for overriding). Forcing full contravariance onto every method override would break a large amount of otherwise-reasonable code for little practical safety gain.',
        'This means the SAME unsound assignment the main page correctly flags as an error, when rewritten using method syntax instead of a property function type, compiles with ZERO error — a very easy trap when refactoring between interface styles, or when copying a pattern from a property-typed example into a method-typed one and assuming the same strictness applies.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'tsconfig.json',
      content: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "strict": true,
    "strictFunctionTypes": true
  }
}
`,
    },
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>strictFunctionTypes and method syntax</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The main page's own PROPERTY-style example -- correctly rejected
type Handler = (event: MouseEvent) => void;
const h: Handler = (e: Event) => {
  console.log('property-typed handler received:', e.type);
};
// TypeScript correctly errors here: MouseEvent extends Event, not the
// other way around -- a handler expecting only Event is not safely
// substitutable where a MouseEvent-specific handler is required.

// This subtopic's test: the SAME unsound substitution, using METHOD SYNTAX
interface ClickHandlerObj {
  handle(event: MouseEvent): void; // method syntax, not a property
}

const obj: ClickHandlerObj = {
  handle(e: Event) { // does TypeScript reject THIS the same way?
    console.log('method-typed handler received:', e.type);
  },
};

// Prove it actually gets called with a MouseEvent-shaped call site,
// even though its own parameter is only typed as the broader Event
function dispatch(handler: ClickHandlerObj, event: MouseEvent) {
  handler.handle(event);
}
dispatch(obj, new MouseEvent('click', { clientX: 100, clientY: 50 }));
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Compare the two error states in the editor: does line 5 (the Handler property assignment) show a red squiggle? Does the `handle(e: Event) { ... }` method inside `obj` show one? Explain the difference given both accept a narrower Event where MouseEvent was declared.',
    hint: 'TypeScript checks property-typed functions contravariantly (strict) but method-syntax functions bivariantly (lenient) -- this is a deliberate split in how the same-looking substitution is validated, not a bug.',
    solution: `Line 5 (const h: Handler = (e: Event) => {...}) shows a compile
error: "Types of parameters 'e' and 'event' are incompatible. Type
'Event' is not assignable to type 'MouseEvent'." -- exactly the main
page's own documented behavior.

The handle(e: Event) { ... } method inside obj compiles with ZERO
error, even though it is the identical kind of substitution --
accepting the broader Event where MouseEvent was specified. This is
strictFunctionTypes's well-known, deliberate carve-out: it never
applies to method-syntax function types, only to property-syntax
ones.

The practical lesson: if you need TRUE contravariant safety checking
on an interface member, declare it as a property with a function
type (handle: (event: MouseEvent) => void), not as a method
(handle(event: MouseEvent): void) -- the two look almost identical
in an interface but are checked by entirely different rules under
strictFunctionTypes.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '`strictFunctionTypes`, once enabled via `strict: true`, uniformly enforces contravariant parameter checking on every function-typed interface or class member, regardless of how it is written.',
      reality: 'the flag ONLY applies to function types declared with PROPERTY syntax (`handle: (e: MouseEvent) => void`) — the same substitution written with METHOD syntax (`handle(e: MouseEvent): void`) is deliberately checked bivariantly (leniently) instead.',
    },
    {
      thought: 'method syntax and property-function syntax in an interface are just two equivalent, interchangeable ways to write the same thing, differing only in style.',
      reality: 'they are checked by fundamentally different substitutability rules under `strictFunctionTypes` — choosing one over the other is a genuine correctness decision, not merely a stylistic one, whenever parameter-type safety on overriding/reassignment matters.',
    },
    {
      thought: 'this exemption for method syntax is an unintentional gap or oversight in TypeScript\'s type checker that will eventually be tightened.',
      reality: 'it is a deliberate, long-standing, documented design decision specifically to preserve compatibility with common, broadly-safe OOP method-overriding patterns — not a bug awaiting a fix.',
    },
  ];
}
