import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-function-decl-wins-hoisting-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './function-declaration-wins-hoisting-var-overwrites-after.html',
  styleUrl: './function-declaration-wins-hoisting-var-overwrites-after.scss',
})
export class FunctionDeclarationWinsHoistingVarOverwritesAfterSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The "Hoisting Order" Code Tab Shows the Final State, But Not the Moment It Flips',
      points: [
        'The Hoisting Order code tab shows <code>var double = "I\'m a string"; function double(x) &#123; return x * 2; &#125;</code> followed by a SINGLE <code>console.log(double)</code> — printed AFTER both statements have already run. The comment explains "the function wins" at hoisting time, but the reader never actually SEES that intermediate state, only the final result.',
        'This subtopic adds a SECOND <code>console.log</code> — placed at the very top of the script, before the <code>var</code> assignment line runs — to directly observe what <code>double</code> actually IS at that earlier moment, then compares it to what it becomes after the <code>var</code> assignment executes.',
      ],
    },
    {
      heading: 'Two Separate Effects, Happening at Two Separate Times',
      points: [
        'At HOISTING time (before any code runs line-by-line), both <code>var double</code> and <code>function double(x) &#123;...&#125;</code> register a binding named <code>double</code> in the same scope. The QnA states plainly: "Function declarations win over var declarations at hoisting time." So immediately as execution begins, <code>double</code> already holds the FUNCTION, not <code>undefined</code>.',
        'THEN, as the code executes top-to-bottom, the line <code>var double = "I\'m a string";</code> runs its ASSIGNMENT part (the declaration itself was already hoisted and resolved) — this is an ordinary reassignment that overwrites whatever <code>double</code> currently holds, in this case replacing the function with the string.',
        'The end result (a string) can look, at a glance, like "the var just won" — but that\'s not what actually happened. The function won the HOISTING phase; the var\'s own assignment statement won the RUNTIME OVERWRITE that came after. These are two different mechanisms operating at two different times, and the first console.log call is what makes the function\'s brief "win" actually observable.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Function declaration vs var hoisting order</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// This is the exact same "var double / function double" collision
// from the main page's own Hoisting Order code tab -- but with an
// EXTRA console.log inserted right at the top, before the var
// assignment's line has actually executed.

console.log('At the very top, before the var assignment runs:');
console.log('typeof double:', typeof double);
console.log('double itself:', double);

var double = "I'm a string";

function double(x: number) { return x * 2; }

console.log('');
console.log('After the var assignment line has run:');
console.log('typeof double:', typeof double);
console.log('double itself:', double);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Open the console. Compare typeof double and its actual value at the TOP of the script (before the var assignment line executes) versus AFTER that line has run.',
    hint: 'The var assignment and the function declaration both target the same name, double — ask which one wins during the HOISTING phase versus which one wins once execution actually reaches that line.',
    solution: `At the very top: typeof double is "function", and logging
double itself prints the actual function double(x) { return x * 2; }
-- confirming that at the moment execution begins (before the var
assignment's own line has run), double is ALREADY the function, not
undefined. This is the function declaration's hoisting win, made
directly observable rather than just described.

After the var assignment runs: typeof double is "string", and
double itself is "I'm a string" -- the var double = "I'm a string";
line executed its assignment as an ordinary runtime statement,
overwriting whatever double held at that point (the function) with
the string.

This confirms the QnA's claim precisely, but reveals the TWO-STEP
nature the main page's single, later console.log call couldn't show:
the function wins the HOISTING phase (proven by the first log call
showing "function" before the var line even runs), and the var's
OWN assignment statement is what later overwrites it at its normal
position in the code -- not because "var beats function" in some
general sense, but because assignment statements always run in
their original source order, regardless of what hoisting already
set up.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'when a var declaration and a function declaration share the same name, the var declaration always "wins" — the main page\'s own example proves this, since the final logged value is the string.',
      reality: 'the function declaration wins the HOISTING phase — double is already the function before the var\'s assignment line runs. The var only overwrites it afterward because assignment statements execute in their normal source-order position, which happens to come after the hoisting phase for both.',
    },
    {
      thought: 'if the var assignment came BEFORE the function declaration in the source code, the function would lose the hoisting race too, not just the final value.',
      reality: 'hoisting resolves declarations before ANY line-by-line execution happens — the function declaration wins the hoisting phase regardless of which one is written first in the source, because hoisting isn\'t about source order, it\'s about a pre-execution registration pass where function declarations take precedence over var declarations.',
    },
    {
      thought: 'this "collision" only matters as a curiosity — no real code would deliberately declare a var and a function with the same identifier.',
      reality: 'while a deliberate collision like this specific example is contrived, the underlying mechanism (function declarations winning hoisting, subsequent assignments overwriting afterward) is exactly the same rule that governs less obvious real-world bugs, like an accidentally reused variable name shadowing a helper function defined nearby.',
    },
  ];
}
