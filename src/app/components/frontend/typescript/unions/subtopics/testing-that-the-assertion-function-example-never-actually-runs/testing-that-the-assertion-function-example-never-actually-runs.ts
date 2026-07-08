import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-assertion-function-not-runnable-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-the-assertion-function-example-never-actually-runs.html',
  styleUrl: './testing-that-the-assertion-function-example-never-actually-runs.scss',
})
export class TestingThatTheAssertionFunctionExampleNeverActuallyRunsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Assertion Function Example',
      points: [
        'The "Type Predicates & Extract/Exclude" code tab shows: <code>function assertIsString(val: unknown): asserts val is string { if (typeof val !== \'string\') throw new Error(\'Not a string!\'); } const raw: unknown = fetchData(); assertIsString(raw); raw.toUpperCase(); // ✅ raw is now string</code>.',
        '<code>fetchData()</code> is never defined anywhere in this code tab — it is a stand-in name implying "some function that fetches data." Copied and run exactly as shown, this snippet does not compile: TypeScript reports <code>Cannot find name \'fetchData\'</code>, and the interesting part of the example (the assertion function actually narrowing <code>raw</code>) never gets exercised at all.',
      ],
    },
    {
      heading: 'Completing the Example So It Actually Runs',
      points: [
        'The fix is small: replace <code>fetchData()</code> with a real expression of type <code>unknown</code> — even something as simple as a value coming from <code>JSON.parse()</code>, a function parameter typed <code>unknown</code>, or a literal cast to <code>unknown</code> for demonstration purposes. What matters for testing <code>assertIsString</code>\'s actual behavior is that <code>raw</code> starts as genuinely <code>unknown</code>, then gets narrowed by the assertion call.',
        'Once runnable, the example reveals the actual mechanics the main page\'s comment only asserts: before <code>assertIsString(raw)</code>, calling <code>raw.toUpperCase()</code> is a compile error (raw is <code>unknown</code>); immediately after the call, in the SAME scope, <code>raw.toUpperCase()</code> compiles — the assertion function narrows the variable for all subsequent code in that block, without needing an <code>if</code> statement or any other control-flow narrowing construct.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Assertion function — completing the runnable example</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `function assertIsString(val: unknown): asserts val is string {
  if (typeof val !== 'string') throw new Error('Not a string!');
}

// ── The main page's exact example, as written -- does not compile ──────────
// const raw: unknown = fetchData();
// assertIsString(raw);
// raw.toUpperCase();
// error TS2304: Cannot find name 'fetchData'.

// ── Completed with a genuinely runnable 'unknown' source ────────────────────
function getUnknownValue(): unknown {
  return JSON.parse('"hello world"');   // a real, runtime unknown value
}

const raw: unknown = getUnknownValue();

// raw.toUpperCase();  // uncomment: ERROR -- raw is 'unknown', no methods available

assertIsString(raw);
console.log(raw.toUpperCase());   // ✅ raw is now 'string' -- no cast, no if statement

// ── Testing the throwing path ─────────────────────────────────────────────
function getUnknownNumber(): unknown {
  return JSON.parse('42');
}
try {
  const notAString: unknown = getUnknownNumber();
  assertIsString(notAString);            // throws -- notAString is a number
  console.log((notAString as string).toUpperCase());  // never reached
} catch (e) {
  if (e instanceof Error) console.log('Caught:', e.message);  // "Caught: Not a string!"
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Uncomment the three-line block at the top of the playground that uses `fetchData()` exactly as the main page wrote it. Read the exact error. Then explain why this specific error has nothing to do with assertion functions, type predicates, or narrowing at all.',
    hint: 'Check what category of TypeScript error "Cannot find name" belongs to — is it about types being wrong, or about something more fundamental?',
    solution: `The error is "Cannot find name 'fetchData'" (TS2304) -- this is a
basic name-resolution error, not a type error. TypeScript cannot
find any declaration for fetchData anywhere in scope, because the
code tab never defines it. This has nothing to do with assertion
functions, unknown, or narrowing -- the file fails to compile before
the type checker ever gets to evaluate whether assertIsString
correctly narrows raw, since name resolution happens first.

This means the main page's example, exactly as published, cannot
actually demonstrate what it's trying to teach -- a reader who
pastes it directly into their own project (rather than a
StackBlitz-style playground that might auto-stub unknown names) gets
a compile error about a missing function, with no feedback at all
about whether they understand asserts val is string. Replacing
fetchData() with any real expression of type unknown -- as the
completed version in this playground does -- is what actually lets
the assertion function's behavior be observed.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a placeholder function name like `fetchData()` in a documentation code example is just illustrative shorthand — the reader is expected to mentally substitute their own implementation, and the example is still fully "correct" as written.',
      reality: 'illustrative shorthand for a FUNCTION\'S BEHAVIOR (e.g., "assume this fetches data from somewhere") is reasonable — but `fetchData` here is never declared at all, meaning the code doesn\'t just gloss over implementation details, it fails to compile outright if run as-is.',
    },
    {
      thought: 'if a code example compiles in some environments (like certain playgrounds that are lenient about undefined globals) it is safe to treat as correct, runnable TypeScript.',
      reality: 'a standard TypeScript compiler (tsc, or a strict playground like the one used here) will reject a reference to an undeclared name — relying on a specific tool\'s leniency is not the same as the code being genuinely correct or portable.',
    },
    {
      thought: 'the specific error from a missing function reference is hard to distinguish from a genuine type-narrowing problem without carefully reading the error text.',
      reality: '"Cannot find name" errors are a clearly distinct category from type-mismatch errors — recognizing the difference quickly (name resolution vs. type checking) helps you diagnose which part of an example actually needs fixing.',
    },
  ];
}
