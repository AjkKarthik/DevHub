import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-duplicate-let-switch-case-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './duplicate-let-across-switch-cases-real-syntaxerror.html',
  styleUrl: './duplicate-let-across-switch-cases-real-syntaxerror.scss',
})
export class DuplicateLetAcrossSwitchCasesRealSyntaxerrorSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The "Hoisting Order" Code Tab Shows the Broken Version ONLY as a Comment — Never Actually Run',
      points: [
        'The Hoisting Order code tab includes: <code>case false: // let x = 2; // SyntaxError: already declared!</code> — the broken line is commented OUT, so the reader has to trust the comment\'s claim rather than seeing the actual error message a real browser produces.',
        'This subtopic runs the ACTUAL broken version — using <code>new Function(...)</code> to compile a string of code at runtime, which lets a real <code>SyntaxError</code> be caught in a <code>try/catch</code>, rather than crashing the whole page (a genuine top-level SyntaxError in an actual script file can\'t be caught this way — it prevents the file from parsing at all).',
      ],
    },
    {
      heading: 'Why a switch Statement Is ONE Block, Not One Per Case',
      points: [
        'A <code>switch (x) &#123; case a: ... case b: ... &#125;</code> statement\'s braces create exactly ONE block scope for the ENTIRE switch — every <code>case</code> label inside it shares that same single scope, unless a case explicitly wraps its own body in its own <code>&#123; &#125;</code> braces.',
        'This means <code>let x = 1;</code> in one <code>case</code> and <code>let x = 2;</code> in a different <code>case</code> of the SAME switch are two <code>let</code> declarations of the SAME NAME in the SAME block scope — exactly the same "duplicate declaration" error you would get from writing <code>let x = 1; let x = 2;</code> back to back with no switch involved at all.',
        'Wrapping each <code>case</code>\'s body in its own <code>&#123; &#125;</code> braces creates a genuinely separate nested block scope per case — this is the fix the main page\'s own code tab shows, and it works precisely because it gives each case its own scope instead of sharing the switch\'s single outer one.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Duplicate let across switch cases</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// Using new Function(...) lets us compile a string of code at
// RUNTIME and catch a real SyntaxError in a try/catch -- a genuine
// top-level SyntaxError in this file itself would prevent the whole
// script from parsing, so we can't just write the broken code directly.

// ── The BROKEN version: no per-case blocks ──────────────────────
try {
  new Function(\`
    switch (true) {
      case true:
        let x = 1;
        break;
      case false:
        let x = 2;
        break;
    }
  \`);
  console.log('Broken version: no error thrown (unexpected!)');
} catch (err) {
  console.log('Broken version THREW:', (err as Error).message);
}

// ── The FIXED version: each case wrapped in its own block ───────
try {
  new Function(\`
    switch (true) {
      case true: {
        let x = 1;
        break;
      }
      case false: {
        let x = 2;
        break;
      }
    }
  \`);
  console.log('Fixed version: no error thrown, as expected');
} catch (err) {
  console.log('Fixed version THREW (unexpected!):', (err as Error).message);
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Open the console. Compare the "Broken version" and "Fixed version" results. Does each one throw, and if so, what does the actual error message say?',
    hint: 'A switch statement\'s braces create ONE block scope for every case inside it — ask whether wrapping each case body in its own {} braces changes how many scopes actually exist.',
    solution: `The broken version throws a real SyntaxError -- something like
"Identifier 'x' has already been declared". This is the exact error
the main page's commented-out line claims would happen, now
confirmed with the genuine browser-produced message. It happens
because both "let x = 1" (in the true case) and "let x = 2" (in the
false case) are declaring the SAME name, x, in the SAME single block
scope -- the switch statement's own outer braces -- regardless of
which case label each one sits under.

The fixed version throws no error at all -- wrapping each case's
body in its own { } braces creates two genuinely SEPARATE nested
block scopes, one per case. The two "let x" declarations no longer
collide, because they're no longer in the same scope; they just
happen to reuse the same variable NAME in two unrelated scopes,
which is completely legal (the same way two different functions can
both have a local variable named x with no conflict).

This confirms the underlying mechanism the main page's own comment
alludes to but doesn't demonstrate: the "SyntaxError: already
declared" isn't really about switch statements specifically -- it's
the ordinary "no duplicate let in the same block" rule, and the
switch statement's braces are just one single block shared by every
case unless you explicitly carve out sub-blocks per case.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'each case label in a switch statement automatically creates its own separate scope, similar to how each iteration of a for(let...) loop gets its own binding.',
      reality: 'a switch statement\'s braces create exactly ONE block scope for the entire statement — every case label shares that single scope unless it explicitly wraps its own body in additional { } braces.',
    },
    {
      thought: 'the "SyntaxError: already declared" error for duplicate let in switch cases is a special switch-specific rule, different from ordinary duplicate-declaration errors elsewhere.',
      reality: 'it is the exact same general rule that applies to any block — "let x = 1; let x = 2;" written back to back with no switch involved produces the identical error, for the identical reason (two let declarations of the same name in the same scope).',
    },
    {
      thought: 'a top-level SyntaxError like this one could be tested with a normal try/catch wrapped directly around the broken code in the same file.',
      reality: 'a genuine SyntaxError in a script\'s own top-level code prevents the ENTIRE file from being parsed at all — it can\'t be caught by a try/catch in that same file. Testing it live requires compiling the broken code at RUNTIME (e.g. via new Function(...)), which is a real, different parse pass a try/catch CAN wrap around.',
    },
  ];
}
