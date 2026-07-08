import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-throw-fail-expression-position-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-throw-fail-cannot-appear-in-an-expression-position.html',
  styleUrl: './testing-that-throw-fail-cannot-appear-in-an-expression-position.scss',
})
export class TestingThatThrowFailCannotAppearInAnExpressionPositionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Claim',
      points: [
        'The "never — the bottom type" theory section states: "never is assignable to every type, which is why throwing functions can appear in any position — throw fail(\'msg\') satisfies any expected type." No code tab accompanies this specific claim anywhere on the page.',
        'Read literally, "throw fail(\'msg\')... can appear in any position" suggests you could write something like <code>const x = condition ? throw fail("msg") : 5;</code> — using <code>throw</code> directly inside an expression. That is not valid JavaScript or TypeScript syntax: <code>throw</code> is a STATEMENT, not an expression, and statements cannot appear where an expression is expected.',
      ],
    },
    {
      heading: 'What Actually Makes never "Appear in Any Position"',
      points: [
        'The claim becomes true once the stray <code>throw</code> keyword is dropped: a function whose return type is inferred (or declared) as <code>never</code> — because its body always throws internally — can be CALLED as a plain expression, and that call expression\'s type (<code>never</code>) is assignable to any expected type. <code>fail("msg")</code> (the call, with no <code>throw</code> in front of it) is what actually "appears in any position."',
        'The distinction matters: <code>function fail(msg: string): never { throw new Error(msg); }</code> defines a function that throws INSIDE its own body — callers never write <code>throw</code> themselves. They just call <code>fail("msg")</code> as an ordinary expression, and the JavaScript runtime still throws (because fail\'s body does), while TypeScript is satisfied because the call\'s static type is <code>never</code>.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>never in expression position</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `function fail(msg: string): never {
  throw new Error(msg);
}

// ── Testing the main page's literal wording ─────────────────────────────────
// const bad = true ? throw fail("bad"): 5;
// uncomment above: SyntaxError -- 'throw' is a statement, it cannot
// appear inside a conditional (ternary) expression at all, regardless
// of any type-level reasoning about 'never'. This fails to even PARSE.

// ── What the claim actually means: the CALL, without 'throw', is the
// expression that can appear anywhere -- because fail() itself throws
// internally, and its return type is 'never' ──────────────────────────────
function getConfig(input: unknown): { port: number } {
  const cfg = typeof input === 'object' && input !== null
    ? (input as { port: number })
    : fail("Invalid config");   // <-- fail(...) alone, no 'throw' -- valid expression
  return cfg;
}

console.log(getConfig({ port: 3000 }));

// Another common position: a variable initializer. The condition
// below is always true, so fail() is never actually CALLED at
// runtime here -- this line exists to show that TypeScript accepts
// fail(...) in this position at the TYPE level (never is assignable
// to number), not to demonstrate it throwing.
const value: number = Math.random() >= 0
  ? 42
  : fail("unreachable, but TypeScript needs an else branch");
console.log(value);

try {
  getConfig(null);   // triggers fail("Invalid config") internally
} catch (e) {
  if (e instanceof Error) console.log('Caught:', e.message);
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Uncomment the `const bad = true ? throw fail("bad") : 5;` line in the playground above. What kind of error does it produce — and is it the SAME kind of error TypeScript normally reports for a type mismatch?',
    hint: 'Compare this to a normal TypeScript type error, like assigning a string to a number — does this fail the same way, or differently?',
    solution: `It produces a SYNTAX error, not a type error -- specifically
something like "Expression expected" pointing at the 'throw'
keyword. This is fundamentally different from a normal TypeScript
type-checking failure (like assigning a string where a number is
expected): the code doesn't even parse into a valid syntax tree,
because 'throw' is defined as a STATEMENT in the ECMAScript grammar,
and a ternary expression's branches must be expressions.

This confirms the main page's literal wording ("throw fail('msg')...
can appear in any position") describes something that isn't valid
syntax at all. The claim becomes true only once you drop the 'throw'
keyword and rely on fail() itself throwing internally -- fail("msg")
alone, as shown in getConfig() and the "value" example above, is a
completely ordinary expression that happens to have type never, and
THAT is what can appear in any position.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"a throwing function can appear in any position" means you can write `throw functionCall()` anywhere an expression is expected, similar to how you might write `functionCall()` alone.',
      reality: '`throw` is a JavaScript statement, not an expression — it cannot appear inside a ternary, an array literal, a function argument, or any other expression position, regardless of what the thrown/called expression\'s type is.',
    },
    {
      thought: 'a function that internally throws needs the CALLER to also write `throw` in front of the call, to make the error propagate.',
      reality: 'if a function\'s own body executes `throw new Error(...)`, calling that function (with no `throw` at the call site) is enough — the exception propagates from inside the function automatically; adding `throw` in front of the call site is both unnecessary and, inside most expression contexts, a syntax error.',
    },
    {
      thought: 'a prose claim on a reference page that isn\'t backed by its own code example is just as reliable as one that is.',
      reality: 'this specific claim has no accompanying code tab anywhere on the main page — testing it directly in a live environment is what reveals that the literal wording describes invalid syntax, something a code example would likely have caught before publishing.',
    },
  ];
}
