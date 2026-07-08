import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-head-empty-tuple-hides-undefined-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-head-of-an-empty-tuple-hides-undefined-behind-never.html',
  styleUrl: './testing-that-head-of-an-empty-tuple-hides-undefined-behind-never.scss',
})
export class TestingThatHeadOfAnEmptyTupleHidesUndefinedBehindNeverSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Own Type-Level Result',
      points: [
        'The infer tab defines <code>type Head&lt;T extends unknown[]&gt; = T extends [infer H, ...unknown[]] ? H : never</code> and states, correctly, <code>type H2 = Head&lt;[]&gt;; // never</code> — an empty tuple has no first element, so the match fails and the fallback <code>never</code> branch is used.',
        'This is entirely correct at the TYPE level. This subtopic tests what happens when a REAL, runnable function uses <code>Head&lt;T&gt;</code> as its return type and is actually called with an empty array — because <code>never</code> is not just "no useful type," it is TypeScript\'s BOTTOM type, assignable to anything.',
      ],
    },
    {
      heading: 'Why never Being a Bottom Type Creates a Silent Hole Here',
      points: [
        '<code>never</code> is a subtype of every other type in TypeScript — a value typed <code>never</code> is considered assignable to <code>string</code>, <code>number</code>, any object type, anything, without a cast. This is by design: since nothing CAN legitimately have type <code>never</code>, TypeScript reasons it is safe to accept it anywhere (the code is deemed unreachable).',
        'The problem: a generic function like <code>function head&lt;T extends unknown[]&gt;(arr: T): Head&lt;T&gt; { return arr[0] as Head&lt;T&gt;; }</code> is perfectly well-typed. But at the CALL SITE, <code>const x: string = head([] as [])</code> ALSO compiles cleanly — <code>Head&lt;[]&gt;</code> is <code>never</code>, and <code>never</code> is assignable to <code>string</code> with zero complaint.',
        'At runtime, <code>arr[0]</code> for an empty array is genuinely <code>undefined</code> — not a string, not anything resembling one. The variable <code>x</code>, fully typed as <code>string</code> by TypeScript with no error anywhere in the chain, actually holds <code>undefined</code> at runtime. Calling <code>x.toUpperCase()</code> then throws.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Head<[]> and the never bottom type</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The main page's own Head<T>, unchanged
type Head<T extends unknown[]> = T extends [infer H, ...unknown[]] ? H : never;

// A real, runnable function using Head<T> as its return type
function head<T extends unknown[]>(arr: T): Head<T> {
  return arr[0] as Head<T>;
}

// Non-empty tuple -- works exactly as expected
const first = head(['a', 'b', 'c'] as const);
console.log('head of non-empty tuple:', first); // 'a'

// Empty tuple -- Head<[]> is never, and never is assignable to ANY type
const emptyArr: [] = [];
const x: string = head(emptyArr); // does this compile? Head<[]> = never, assignable to string
console.log('typeof x:', typeof x, '-- actual value:', x);
// TypeScript's own type annotation says x: string -- but what does typeof actually report?

// x.toUpperCase();
// Uncomment above -- this compiles fine (x is typed string), but what
// happens when it actually RUNS?
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Uncomment `x.toUpperCase();`. Confirm it compiles with zero errors. Then predict, and confirm, what actually happens when the code runs.',
    hint: 'never being the bottom type means TypeScript will accept it as ANY other type at the assignment site — the type system has no way to flag this as unsafe, because Head<[]> = never IS technically correct at the type level.',
    solution: `x.toUpperCase() compiles with zero errors -- TypeScript fully
believes x is a string, all the way through Head<[]> = never being
silently accepted as string.

Running it throws: "TypeError: Cannot read properties of undefined
(reading 'toUpperCase')" -- because emptyArr[0] is genuinely
undefined at runtime, and the "as Head<T>" cast inside head() never
performed any real conversion, just a compile-time relabeling.

This is not a bug in Head<T> itself -- Head<[]> = never is the
technically correct type for "the first element of a tuple that has
no elements." The actual hole is in how a caller can silently
assign that never value to ANY other type (string, in this case)
without TypeScript raising a single warning, because never is a
subtype of everything by design. The general lesson: never at a
type-level dead end is only safe as long as the code path is
GENUINELY unreachable -- head(emptyArr) here is fully reachable and
gets called, defeating the assumption never relies on.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'since `Head<[]>` correctly evaluates to `never` (as the main page\'s own comment states), any code built around `Head<T>` is automatically safe for empty tuples.',
      reality: '`never` being technically correct at the type level does not stop it from being silently assignable to ANY other type at the call site — the type-correctness of `Head<[]> = never` and the runtime-safety of code that uses it are two separate questions.',
    },
    {
      thought: 'if TypeScript fully type-checks a program with no errors, a variable\'s declared type (like `string`) is a reliable guarantee of what it actually holds at runtime.',
      reality: '`never`\'s bottom-type status means a `never`-typed expression can be assigned to a variable of ANY declared type with no error — the declared type can silently diverge from the runtime value whenever `never` is involved in the chain.',
    },
    {
      thought: 'this kind of unsoundness only matters in unusual, contrived generic-utility code, not in ordinary application code.',
      reality: 'any code path that computes a conditional or `infer`-based return type for a generic function, and can be called with an edge-case input like an empty tuple or array, is potentially exposed to this exact pattern.',
    },
  ];
}
