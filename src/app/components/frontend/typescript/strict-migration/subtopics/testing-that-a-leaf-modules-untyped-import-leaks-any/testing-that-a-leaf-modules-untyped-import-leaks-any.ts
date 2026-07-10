import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-leaf-module-untyped-import-leaks-any-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-a-leaf-modules-untyped-import-leaks-any.html',
  styleUrl: './testing-that-a-leaf-modules-untyped-import-leaks-any.scss',
})
export class TestingThatALeafModulesUntypedImportLeaksAnySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s "Leaf Module" Only Considers Internal Dependencies',
      points: [
        'Common Mistake\'s bottom-up migration advice says: "start with leaf modules (files that have no internal dependencies)... each migration step builds on clean foundations." The example (<code>src/utils/dates.ts</code>) is described as having "no dependencies on internal modules."',
        '"No INTERNAL dependencies" is a narrower claim than "no dependencies at all." This subtopic tests what happens when that same leaf module imports from an EXTERNAL, untyped third-party package — during the interim phase the page\'s own migration tsconfig recommends, where <code>strict</code> (and therefore <code>noImplicitAny</code>) is deliberately left off.',
      ],
    },
    {
      heading: 'Why an Untyped External Import Can Undermine the "Clean Foundation" Claim',
      points: [
        'The page\'s own Incremental migration tsconfig example explicitly sets <code>"strict": false</code> for the interim phase — start lenient, tighten flag by flag later. Under THAT tsconfig, importing from a package with no types available (no bundled <code>.d.ts</code>, no <code>@types</code> package) silently resolves to <code>any</code>, with zero warning, because <code>noImplicitAny</code> is off.',
        'A "leaf" module in the internal-dependency sense can still call functions from that untyped import and RETURN their results directly from its own exported functions. Since the untyped import is <code>any</code>, everything derived from it inside the leaf module is ALSO silently <code>any</code> — including the leaf module\'s own EXPORTED return types.',
        'This means every file that later imports THIS supposedly-already-migrated "clean foundation" leaf module inherits that same silent <code>any</code>, exactly the "cascading any types" failure mode the page\'s own Common Mistake #6 warns about for skipping the bottom-up order entirely — except here it happens even while FOLLOWING the bottom-up order correctly, because the leak\'s source is external, not internal.',
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
    "strict": false,
    "noImplicitAny": false,
    "allowJs": true
  }
}
`,
    },
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Leaf modules and untyped imports</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'untyped-lib.js',
      content: `// A genuinely untyped third-party-style JS module -- no .d.ts anywhere,
// simulating a package with no types and no @types package available
export function formatLegacyDate(input) {
  return String(input).slice(0, 10);
}
`,
    },
    {
      path: 'utils/dates.ts',
      content: `// A "leaf module" exactly like the main page's own utils/dates.ts
// example -- genuinely zero INTERNAL dependencies. But it imports
// from the untyped library above.
// @ts-ignore -- suppressing the "could not find declaration file" note for this demo
import { formatLegacyDate } from '../untyped-lib.js';

// This function's return type is inferred, not annotated --
// what does TypeScript actually infer it as?
export function formatDate(d: Date) {
  return formatLegacyDate(d.toISOString());
}
`,
    },
    {
      path: 'index.ts',
      content: `import { formatDate } from './utils/dates';

// This "leaf module" was migrated first, per the main page's own
// recommended order -- it should be a clean, fully-typed foundation.
const result = formatDate(new Date());
console.log('formatDate result:', result);

// Does TypeScript know result is a string? Try calling a string-only
// method that would fail on a real 'any':
console.log(result.toUpperCase());

// The real test: does a DELIBERATE typo on the result get caught?
console.log(result.toUpperCasee()); // typo -- does this compile?
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Look for a red squiggle on `result.toUpperCasee()` (the typo). Does TypeScript catch it? What does that tell you about what type `result` actually ended up as, despite `formatDate` being in the first, supposedly "clean" migrated file?',
    hint: 'formatLegacyDate has no type information at all, so its return type is any -- and any propagates through formatDate\'s inferred return type without needing a single explicit "any" to appear anywhere in dates.ts.',
    solution: `The typo result.toUpperCasee() compiles with ZERO error -- confirming
result is typed any, not string, despite formatDate living in the
"leaf module" migrated first specifically to be a clean foundation.

The root cause: formatLegacyDate (from the untyped JS library) has
no type information, so its return type is any. formatDate's own
return type was never explicitly annotated, so TypeScript infers it
FROM the function body -- inheriting that same any, silently, with
no "implicitly has an any type" error anywhere, because
noImplicitAny is off during this interim migration phase (exactly
as the main page's own recommended tsconfig sets it).

The practical lesson: "no internal dependencies" is not the same
guarantee as "produces a clean, fully-typed foundation." A leaf
module's own EXTERNAL dependencies -- untyped libraries, JS files
without JSDoc, packages missing @types -- can silently leak any
through the leaf module's own inferred return types, defeating the
exact benefit the bottom-up migration order is meant to provide.
The fix: explicitly annotate return types for functions that call
into untyped external code, even in "obviously simple" leaf
modules.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s "leaf module" advice (migrate files with no internal dependencies first) guarantees that module becomes a genuinely clean, fully-typed foundation for everything that imports it later.',
      reality: '"no internal dependencies" only rules out cascading `any` from OTHER project files — a leaf module that imports an untyped EXTERNAL library can still silently leak `any` through its own inferred return types, with the exact same cascading effect.',
    },
    {
      thought: 'during the interim, lenient phase of migration (the page\'s own recommended `"strict": false` starting tsconfig), any `any` types introduced are harmless because they\'ll be caught once `noImplicitAny` is turned on later.',
      reality: '`noImplicitAny` only flags MISSING annotations — a function whose return type is silently INFERRED as `any` (because it calls into untyped code) has no missing annotation to flag; the leak stays invisible even after `noImplicitAny` is enabled, unless the return type is explicitly annotated.',
    },
    {
      thought: 'this kind of `any` leak is the same "cascading any" problem the main page\'s own Common Mistake #6 already warns about (migrating in the wrong order) — so following the correct bottom-up order already prevents it.',
      reality: 'Common Mistake #6\'s cascading-any problem is specifically about INTERNAL migration order; this is a DIFFERENT source (an external, untyped dependency) that the bottom-up order does nothing to prevent, since the leak never depended on which internal file was migrated when.',
    },
  ];
}
