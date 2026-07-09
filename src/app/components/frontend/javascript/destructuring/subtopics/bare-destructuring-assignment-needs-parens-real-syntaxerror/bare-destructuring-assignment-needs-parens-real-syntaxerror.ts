import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-bare-destructuring-needs-parens-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './bare-destructuring-assignment-needs-parens-real-syntaxerror.html',
  styleUrl: './bare-destructuring-assignment-needs-parens-real-syntaxerror.scss',
})
export class BareDestructuringAssignmentNeedsParensRealSyntaxerrorSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The QnA\'s Last Answer Explains WHY — This Actually Runs the Broken Version to Prove It',
      points: [
        'The final QnA entry explains: "For object assignment you must wrap in parens (without const/let/var) because the parser sees { as a block otherwise." This is a genuinely surprising parser behavior — described accurately in prose, but never actually triggered to show the real error message.',
        'This subtopic runs the exact broken pattern — a bare object destructuring ASSIGNMENT to already-declared variables, without the wrapping parens — via <code>new Function(...)</code> so the real SyntaxError can be caught, then compares it against the correctly-parenthesized working version.',
      ],
    },
    {
      heading: 'Why a Leading { Is Ambiguous at Statement Position',
      points: [
        'JavaScript\'s grammar allows a curly-brace pair to mean two COMPLETELY different things depending on where it appears. At the START of a statement, <code>{</code> is grammatically a BLOCK statement opener — the same <code>{</code> that starts an <code>if</code> body or a bare code block. Inside an expression (like the right side of <code>=</code>, or wrapped in parens), <code>{</code> is an object literal or object destructuring pattern.',
        'When you write <code>{ x, y } = obj;</code> as a standalone statement, the parser commits to the BLOCK interpretation the moment it sees the leading <code>{</code> — by the time it reaches <code>x, y }</code>, it\'s already trying to parse a block\'s contents, not a destructuring pattern, and the mismatch produces a SyntaxError.',
        'Wrapping the whole thing in parens — <code>({ x, y } = obj);</code> — forces the parser into EXPRESSION context from the very first token, since a statement can never start with <code>(</code> being ambiguous with a block; there is no such thing as a "parenthesized block statement," so the parser correctly commits to parsing <code>{ x, y }</code> as an object pattern instead.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Bare destructuring assignment demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// Using new Function(...) to compile broken code at RUNTIME, so a
// real SyntaxError can be caught -- a genuine top-level SyntaxError
// in this file itself would prevent the whole script from parsing.

console.log('--- Bare destructuring assignment, no parens ---');
try {
  new Function(\`
    let x, y;
    { x, y } = { x: 1, y: 2 };
    return x + ',' + y;
  \`);
  console.log('No error (unexpected!)');
} catch (err) {
  console.log('THREW:', (err as Error).name, '-', (err as Error).message);
}

console.log('');
console.log('--- Same assignment, wrapped in parens ---');
try {
  const result = new Function(\`
    let x, y;
    ({ x, y } = { x: 1, y: 2 });
    return x + ',' + y;
  \`)();
  console.log('Result:', result);
} catch (err) {
  console.log('THREW (unexpected!):', (err as Error).message);
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Open the console. Does the bare (unparenthesized) destructuring assignment throw? What is the actual error type and message? Does wrapping it in parens fix it?',
    hint: 'Ask what the parser thinks a statement starting with a bare { could possibly mean, before it has seen anything else on that line.',
    solution: `The bare (unparenthesized) version throws a real SyntaxError --
something like "Unexpected token ','" (exact wording varies by
engine). This confirms the QnA's claim precisely: the parser
committed to interpreting the leading { as a BLOCK statement opener,
and choked when it encountered content ("x, y") that doesn't make
sense as block-statement syntax.

The parenthesized version works correctly, returning "1,2" -- the
same { x, y } = { x: 1, y: 2 } destructuring pattern, wrapped in
(...), is unambiguously parsed as an expression (specifically, an
assignment expression evaluating an object destructuring pattern),
which is exactly what was intended.

This is purely a PARSING quirk, unrelated to destructuring
DECLARATIONS (const { x, y } = obj) -- those are never ambiguous,
because the leading const/let/var keyword already tells the parser
"this is a variable declaration statement," ruling out the
block-statement interpretation before it ever reaches the {. The
ambiguity specifically exists for bare ASSIGNMENT to
already-declared variables, where nothing precedes the { to
disambiguate it.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'const { x, y } = obj and { x, y } = obj (assigning to already-declared variables) have the same parsing rules — if one works standalone, so does the other.',
      reality: 'they are parsed completely differently — const/let/var at the start of the statement removes the ambiguity immediately, while a bare { at statement position is always interpreted as a block statement opener first, requiring parens to force expression context.',
    },
    {
      thought: 'the parens-required rule for bare destructuring assignment is a rare style requirement, similar to a linter preference, not a hard parsing rule.',
      reality: 'omitting the parens produces a genuine SyntaxError that prevents the code from running at all — this is not a style preference, it is a mandatory requirement rooted in how the grammar resolves the ambiguity between block statements and object literals.',
    },
    {
      thought: 'array destructuring assignment ([a, b] = arr) has the same parens requirement as object destructuring assignment, for the same reason.',
      reality: 'array destructuring assignment does NOT need parens — a leading [ at statement position is unambiguous (there is no "array literal as a block statement" interpretation to compete with), so only the object-destructuring case (leading {) has this specific parsing trap.',
    },
  ];
}
