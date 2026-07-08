import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-bigint-zero-falsy-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-bigint-zero-is-falsy-and-skipped-by-truthiness-narrowing.html',
  styleUrl: './testing-that-bigint-zero-is-falsy-and-skipped-by-truthiness-narrowing.scss',
})
export class TestingThatBigintZeroIsFalsyAndSkippedByTruthinessNarrowingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s List of Falsy Values',
      points: [
        'The "Narrowing Techniques" theory section lists exactly what truthiness narrowing removes: "<code>null</code>, <code>undefined</code>, <code>0</code>, <code>\"\"</code>, <code>false</code>, <code>NaN</code>." The quiz repeats the identical list. Both explicitly warn that <code>0</code> can be a valid value silently skipped by <code>if (value)</code>.',
        'JavaScript actually has one more falsy value neither list mentions: <code>0n</code> — the BigInt literal for zero. <code>Boolean(0n)</code> is <code>false</code>, exactly like <code>Boolean(0)</code>, and <code>if (0n)</code> behaves identically to <code>if (0)</code> — the branch is skipped.',
      ],
    },
    {
      heading: 'Why This Is Easy to Miss',
      points: [
        'BigInt is a relatively newer JavaScript primitive (ES2020), and most mental lists of "falsy values" were formed before it existed — the classic six (<code>false</code>, <code>0</code>, <code>""</code>, <code>null</code>, <code>undefined</code>, <code>NaN</code>) predate BigInt entirely, which is likely why even a page specifically warning about the <code>0</code> pitfall omits its BigInt equivalent.',
        'This matters for exactly the same reason the page already warns about plain <code>0</code>: any code accepting a <code>bigint | null</code> (or similar) value and using <code>if (value)</code> to check for presence will silently treat a genuinely valid zero balance, zero count, or zero ID (stored as a <code>bigint</code>, common for IDs beyond <code>Number.MAX_SAFE_INTEGER</code>) as if it were absent.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>BigInt zero is falsy too</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// Confirming the classic six falsy values, exactly as the main page lists them
console.log('false:', Boolean(false));
console.log('0:', Boolean(0));
console.log('"":', Boolean(''));
console.log('null:', Boolean(null));
console.log('undefined:', Boolean(undefined));
console.log('NaN:', Boolean(NaN));

// The one the main page's list omits
console.log('0n:', Boolean(0n));   // false -- exactly like 0

function printBalance(balance: bigint | null) {
  if (balance) {
    console.log(\`Balance: \${balance}\`);
  } else {
    console.log('No balance on record');   // <-- this branch ALSO fires for a genuine 0n balance
  }
}

printBalance(500n);   // "Balance: 500"
printBalance(null);   // "No balance on record" -- correct, genuinely absent
printBalance(0n);     // "No balance on record" -- WRONG, this is a real zero balance, not absence!

// The fix -- explicit null check, exactly the pattern the main page
// already recommends for plain numbers
function printBalanceFixed(balance: bigint | null) {
  if (balance !== null) {
    console.log(\`Balance: \${balance}\`);   // correctly includes 0n
  } else {
    console.log('No balance on record');
  }
}
printBalanceFixed(0n);   // "Balance: 0" -- correct now
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'In the playground above, change printBalance\'s parameter type from `bigint | null` to `number | null` and call it with a plain `0` instead of `0n`. Does the same bug reproduce? What does that tell you about whether this is really a "BigInt-specific" issue or something broader?',
    hint: 'Compare the behavior of `if (value)` for a bigint 0n against a number 0 — are they being skipped for the same underlying reason?',
    solution: `Yes — the identical bug reproduces with plain 0, exactly as the
main page's own warning already describes for numbers. This
confirms it's not a BigInt-specific quirk at all: 0n falls into the
exact same "falsy but often a valid, meaningful value" category as
0 itself. The main page already correctly warns about 0 — its list
of falsy values is just incomplete, missing 0n as one more concrete
example of the same underlying issue (any falsy value that can also
be a legitimate domain value needs an explicit comparison, not
truthiness, to check for "was this actually provided").

The practical takeaway is the same fix the main page recommends:
use an explicit !== null (or !== undefined) check instead of bare
truthiness whenever the value's type includes a "legitimate zero"
— now understood to include bigint zero, not just number zero.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the falsy values in JavaScript are exactly false, 0, "", null, undefined, and NaN — a fixed, complete list that predates and doesn\'t need updating for newer primitives.',
      reality: 'BigInt, added in ES2020, has its own falsy zero value, 0n — Boolean(0n) is false, behaving identically to Boolean(0). Any list of falsy values written without accounting for BigInt is missing this case.',
    },
    {
      thought: 'truthiness narrowing bugs involving 0 only matter for `number`-typed values, so switching a field to `bigint` (e.g., for large IDs) sidesteps the whole class of bug.',
      reality: 'bigint has the exact same falsy-zero pitfall as number — switching a type from number to bigint changes nothing about whether if (value) correctly distinguishes "genuinely absent" from "present and zero."',
    },
    {
      thought: 'this is a purely theoretical edge case unlikely to matter in real code.',
      reality: 'bigint is specifically used for values that can exceed Number.MAX_SAFE_INTEGER — large IDs, precise financial calculations, cryptographic values — domains where a genuine zero (an empty balance, an ID of 0) is a realistic, meaningful value to check for.',
    },
  ];
}
