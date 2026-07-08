import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-fixed-example-still-any-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-the-fixed-any-vs-unknown-example-still-uses-as-any.html',
  styleUrl: './testing-that-the-fixed-any-vs-unknown-example-still-uses-as-any.scss',
})
export class TestingThatTheFixedAnyVsUnknownExampleStillUsesAsAnySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s "right" example, read closely',
      points: [
        'The "Using `any` instead of `unknown` for external data" mistake block shows a "wrong" version (a bare <code>any</code> parameter) and a "right" version meant to demonstrate the fix. But the "right" version\'s own narrowing logic reads: <code>typeof (raw as any).user?.name === \'string\'</code> — it casts to <code>any</code> in the middle of the very code that is supposed to show how to AVOID <code>any</code>.',
        'This is not a trick or a deliberate teaching device — the explanation immediately below the code says "unknown forces you to narrow before use, catching errors like null access that any silently allows," which is only fully true if the narrowing itself never falls back to <code>any</code>. As written, the "right" example partially defeats its own lesson at exactly the step that matters most.',
      ],
    },
    {
      heading: 'Why the `as any` there is unnecessary',
      points: [
        'The cast exists to get past the fact that after <code>\'user\' in raw</code>, TypeScript narrows <code>raw</code> to <code>object</code> — a type with no known properties — so <code>raw.user</code> is not directly accessible without an assertion. But the fix does not require reaching for <code>any</code>: a type-safe assertion to a narrower, still-unknown-friendly shape (or a small helper type guard) accomplishes the same narrowing without disabling type checking on that expression.',
        'The cleanest fix mirrors the same pattern the main page uses successfully elsewhere on the very same page, in its own "unknown — type-safe escape hatch" code tab: cast to a specific shape with unknown-typed fields, e.g. <code>(raw as { user?: { name?: unknown } })</code>, rather than <code>as any</code>. This keeps every subsequent property access subject to real type checking instead of opting out of it.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>any vs. unknown</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// ── The main page's exact "right" example ────────────────────────────────────
function parseWithAsAny(raw: unknown): string {
  if (
    typeof raw === 'object' && raw !== null &&
    'user' in raw && typeof (raw as any).user?.name === 'string'
  ) {
    return (raw as { user: { name: string } }).user.name;
  }
  throw new Error('Invalid');
}

// Because of "as any", TypeScript stops checking THIS expression entirely --
// a typo here would not be caught:
// typeof (raw as any).usr?.name === 'string'   <- 'usr' typo, NO ERROR

// ── A version with no 'any' anywhere ──────────────────────────────────────
interface WithUser { user?: { name?: unknown } }

function parseWithoutAny(raw: unknown): string {
  if (
    typeof raw === 'object' && raw !== null &&
    'user' in raw &&
    typeof (raw as WithUser).user?.name === 'string'
  ) {
    return (raw as WithUser).user!.name as string;
  }
  throw new Error('Invalid');
}
// (raw as WithUser).usr?.name  <- uncomment to see: 'usr' is now a REAL
// compile error, because 'usr' isn't a known property of WithUser --
// something the 'as any' version could never catch.

console.log(parseWithAsAny({ user: { name: 'Alice' } }));
console.log(parseWithoutAny({ user: { name: 'Alice' } }));
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'In the playground above, introduce the SAME typo — change \'name\' to \'nmae\' — inside both parseWithAsAny\'s narrowing check and parseWithoutAny\'s narrowing check. Does TypeScript catch the typo in both functions, or only one?',
    hint: 'Check what type `(raw as any).user?.nmae` has, versus what type `(raw as WithUser).user?.nmae` has — one of them is still type-checked, the other isn\'t.',
    solution: `TypeScript only catches the typo in parseWithoutAny. Because
(raw as any).user?.nmae casts to 'any', the entire expression --
including the '.nmae' property access -- is completely unchecked;
TypeScript has no way to know 'nmae' isn't a real property, so the
typo compiles silently and the function will incorrectly report
"Invalid" at runtime for every valid input (since it's actually
checking a property that never exists).

(raw as WithUser).user?.nmae, by contrast, IS checked against the
WithUser interface, which only declares 'name' -- TypeScript reports
"Property 'nmae' does not exist on type..." immediately. This is the
concrete, demonstrable cost of the main page's 'as any' in its own
"right" example: it silently disables exactly the kind of typo
protection the surrounding explanation claims unknown provides.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a code example labeled "right" or presented as the fix for a mistake is, by definition, free of the mistake it is illustrating.',
      reality: 'here the "right" example for "stop using any" still contains an `as any` cast in its own narrowing logic — the label describes the overall pattern being taught (validate before use), not a guarantee that every line inside is itself free of the exact thing being warned against.',
    },
    {
      thought: 'once code passes through an `unknown`-typed parameter and a runtime `typeof`/`in` check, every subsequent property access is automatically type-safe.',
      reality: 'a `typeof`/`in` check only narrows what TypeScript already knows about the declared type — reaching into a nested property like `.user.name` beyond what the check narrows still needs either further real narrowing or a type-safe assertion; falling back to `as any` at that point quietly reopens the exact gap `unknown` was meant to close.',
    },
    {
      thought: 'using `as any` briefly, just to get past one awkward property access, is harmless as long as the surrounding function still declares its parameter as `unknown`.',
      reality: 'the outer parameter type does not protect the specific expression cast to `any` — that expression, and everything chained off it, loses type checking regardless of how strictly the rest of the function is typed.',
    },
  ];
}
