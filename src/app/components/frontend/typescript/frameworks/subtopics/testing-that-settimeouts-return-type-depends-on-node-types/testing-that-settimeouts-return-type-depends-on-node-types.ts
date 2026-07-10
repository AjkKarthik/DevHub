import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-settimeout-return-type-node-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-settimeouts-return-type-depends-on-node-types.html',
  styleUrl: './testing-that-settimeouts-return-type-depends-on-node-types.scss',
})
export class TestingThatSettimeoutsReturnTypeDependsOnNodeTypesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page Uses ReturnType<typeof setTimeout> to Sidestep This',
      points: [
        'The React hooks tab types a timer ref as <code>useRef&lt;ReturnType&lt;typeof setTimeout&gt;&gt;(undefined)</code> instead of writing a concrete type directly. This subtopic tests WHY that indirection is used — what <code>ReturnType&lt;typeof setTimeout&gt;</code> actually resolves to, and whether it is the same thing in every project.',
        '<code>setTimeout</code> is a genuinely different function in two different global type contexts: the DOM/browser <code>lib.dom.d.ts</code> declares it returning <code>number</code>; Node.js\'s <code>@types/node</code> declares a DIFFERENT, incompatible global <code>setTimeout</code> returning a <code>NodeJS.Timeout</code> OBJECT. A full-stack TypeScript project (React app built with a tool that also pulls in <code>@types/node</code> for tooling config files) can end up with the Node.js version winning, even for code that will only ever run in a browser.',
      ],
    },
    {
      heading: 'Why the Same Component\'s Code Can Resolve Differently in Different Projects',
      points: [
        'Whichever <code>setTimeout</code> declaration TypeScript sees LAST (or considers more specific) becomes the one used for <code>typeof setTimeout</code> everywhere in that compilation — this is determined by the project\'s <code>lib</code> and <code>types</code> tsconfig settings, not by anything in the component\'s own source code.',
        'If <code>@types/node</code> is present (common even in browser-only React apps, pulled in for tooling like Vite config files or test setup), <code>ReturnType&lt;typeof setTimeout&gt;</code> resolves to <code>NodeJS.Timeout</code> — an object, NOT a number — even though the actual browser runtime returns a plain number at runtime.',
        'This is exactly why the main page writes <code>ReturnType&lt;typeof setTimeout&gt;</code> instead of hardcoding <code>number</code> — using the indirection makes the ref\'s type automatically correct for WHICHEVER environment\'s <code>setTimeout</code> the current project resolves to, rather than assuming one specific runtime.',
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
    "lib": ["ES2022", "DOM"],
    "types": ["node"]
  }
}
`,
    },
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>setTimeout return type ambiguity</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// This playground's active tsconfig.json includes "types": ["node"] --
// simulating a full-stack project where @types/node is present even
// though this specific file only ever runs in a browser.

type TimerReturnType = ReturnType<typeof setTimeout>;

// Does TimerReturnType behave like a number (the real browser runtime
// type) or like an object (Node.js's NodeJS.Timeout)?
const id: TimerReturnType = setTimeout(() => {}, 1000);

// const asNumber: number = id;
// Uncomment above -- does the browser-runtime "number" assumption
// still type-check with @types/node present?

console.log('typeof id at actual runtime (always a browser number):', typeof id);
clearTimeout(id);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Uncomment `const asNumber: number = id;`. Does it compile? Then check what `typeof id` actually logs at runtime (this playground genuinely runs in a browser). Explain the mismatch.',
    hint: 'The compiler resolves ReturnType<typeof setTimeout> using whichever global setTimeout declaration wins in this tsconfig (types: ["node"]) -- that has nothing to do with what the browser\'s actual JavaScript engine returns when the code runs.',
    solution: `With "types": ["node"] active, const asNumber: number = id; fails
to compile: "Type 'Timeout' is not assignable to type 'number'." --
TypeScript resolved setTimeout to Node.js's version, whose return
type is a NodeJS.Timeout object, not a number.

But typeof id at actual runtime logs "number" -- because this code
is genuinely executing in a real browser (the StackBlitz preview),
where the browser's native setTimeout always returns a plain number,
completely independent of which TYPE definition TypeScript happened
to pick during compilation.

This is the core of the gotcha: TypeScript's static type for id
(NodeJS.Timeout) and its actual runtime value (a number) have
diverged entirely, purely because of which @types packages happen
to be present in the project -- not because of anything in this
file's own code. This is exactly why the main page reaches for
ReturnType<typeof setTimeout> instead of a hardcoded type: it at
least stays SELF-CONSISTENT with whichever environment TypeScript
resolves to, even though that resolution itself can silently be
wrong for a browser-only file in a full-stack project.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s use of `ReturnType<typeof setTimeout>` instead of a hardcoded type guarantees the timer ref\'s type is always correct for the environment the code actually runs in.',
      reality: 'it only guarantees the type is self-consistent with whatever global `setTimeout` declaration TypeScript happens to resolve to in that project\'s tsconfig — if `@types/node` is present in a browser-only project, that resolution itself can be wrong for the actual runtime, even though the pattern LOOKS environment-agnostic.',
    },
    {
      thought: '`setTimeout` is one universal, unambiguous global function whose type is the same in every TypeScript project.',
      reality: 'the DOM and Node.js type libraries declare two DIFFERENT, incompatible global `setTimeout` functions with different return types — which one TypeScript resolves depends entirely on the project\'s `lib` and `types` tsconfig settings, not on where the code will actually run.',
    },
    {
      thought: 'a full-stack project that includes `@types/node` for build tooling (Vite config, test setup) only affects files that are genuinely Node.js code — browser-facing application code is unaffected.',
      reality: 'once `@types/node` is included anywhere in a project\'s type-checking scope, its global declarations (including `setTimeout`) can apply project-wide, silently changing the resolved type of code that will only ever execute in a browser.',
    },
  ];
}
