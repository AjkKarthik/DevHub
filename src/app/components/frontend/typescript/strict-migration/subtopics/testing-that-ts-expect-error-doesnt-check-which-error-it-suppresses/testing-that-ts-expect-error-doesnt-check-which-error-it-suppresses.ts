import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-ts-expect-error-doesnt-check-which-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-ts-expect-error-doesnt-check-which-error-it-suppresses.html',
  styleUrl: './testing-that-ts-expect-error-doesnt-check-which-error-it-suppresses.scss',
})
export class TestingThatTsExpectErrorDoesntCheckWhichErrorItSuppressesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page Frames @ts-expect-error as "Fixed = Detected"',
      points: [
        'The main page explains <code>@ts-expect-error</code> as strictly safer than <code>@ts-ignore</code> because "if you later fix the type to number, TypeScript tells you: \'Unused \'@ts-expect-error\' directive.\'" This framing implicitly suggests the directive is watching for the SPECIFIC original error to disappear.',
        'This subtopic tests a more precise question: does <code>@ts-expect-error</code> verify that the ORIGINAL error is gone, or does it only verify that SOME error (any error at all) still occurs on the next line? What happens if the original bug is fixed but a completely DIFFERENT, unrelated bug is introduced on the same line?',
      ],
    },
    {
      heading: 'Why @ts-expect-error Only Checks "An Error Occurred," Not Which One',
      points: [
        '<code>@ts-expect-error</code>\'s actual contract is narrow: it suppresses whatever diagnostic(s) TypeScript reports on the following line, and separately reports "Unused \'@ts-expect-error\' directive" ONLY when the following line produces ZERO diagnostics. It does not record, compare, or care about the specific error CODE or MESSAGE that was originally being suppressed.',
        'This means if a line originally had error A, and a later code change simultaneously fixes error A while introducing an entirely unrelated error B, <code>@ts-expect-error</code> is completely satisfied — TypeScript still sees an error on that line (just a different one), so no "unused directive" warning fires. The suppression silently continues to hide the NEW problem.',
        'This is a real, if narrow, gap in the "safety" story: <code>@ts-expect-error</code> genuinely does catch the specific, common case the main page describes (an error being fixed with NOTHING left to suppress) — but it provides zero protection against an error being SWAPPED for a different one on the same line.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>@ts-expect-error and swapped errors</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The main page's own example -- the ORIGINAL error being suppressed
// @ts-expect-error
const y: string = 42; // error: Type 'number' is not assignable to type 'string'.
console.log('y at runtime (still holds the wrong value):', y);

// Now simulate a later code change: the ORIGINAL type mismatch is
// "fixed" (42 is now a string), but a DIFFERENT, unrelated typo is
// introduced on the exact same line -- does @ts-expect-error notice
// the swap, or stay silent because SOME error is still present?
// @ts-expect-error
const z: string = '42'.toUperCase(); // typo: toUperCase (missing 'p') -- a DIFFERENT error now
console.log('If the build above succeeded, the swapped error went undetected.');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Read whether the build succeeds with the `toUperCase` typo present. Then fix the typo to `toUpperCase()` (a genuinely correct line) and see whether @ts-expect-error THEN reports "Unused directive".',
    hint: '@ts-expect-error only checks "is there at least one diagnostic on this line" -- it has no memory of what the original diagnostic was, so a different error satisfies it just as well as the original one did.',
    solution: `The build with the toUperCase typo compiles successfully -- no
"Unused '@ts-expect-error' directive" warning appears, even though
the ORIGINAL error (assigning a number to a string) is completely
gone. TypeScript still finds an error on that line -- just a
different one (Property 'toUperCase' does not exist) -- and that's
enough to satisfy the directive.

Only when you fix the typo to the CORRECT '42'.toUpperCase() (a
line with genuinely zero errors) does @ts-expect-error finally
report "Unused '@ts-expect-error' directive," prompting removal.

The practical lesson: @ts-expect-error protects against "this
suppression is now doing nothing" -- it does NOT protect against
"this suppression is now hiding a different bug than the one it was
written for." A code review catching an unexpected typo on an
already-suppressed line is still necessary; the directive alone
won't flag a swapped error.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '`@ts-expect-error` tracks the SPECIFIC error it was written to suppress, and reports "unused directive" only once THAT particular error is resolved.',
      reality: '`@ts-expect-error` only checks whether the following line produces ANY diagnostic at all — it has no memory of which specific error it originally suppressed, so a completely different, unrelated error satisfies it just as well.',
    },
    {
      thought: 'because `@ts-expect-error` is "strictly safer" than `@ts-ignore` (per the main page\'s own framing), it fully protects against a suppressed line silently accumulating new, different problems.',
      reality: 'it only protects against the ONE specific failure mode the main page describes — a suppression becoming entirely unnecessary — not against an error being swapped for a different one while the line remains suppressible.',
    },
    {
      thought: 'once a line is marked `@ts-expect-error`, any future change to that line is automatically flagged if it introduces a NEW kind of problem.',
      reality: 'the directive is indifferent to WHICH error is present, only THAT one is — a new, unrelated typo or type mismatch on the same line passes through completely unnoticed, exactly like the original suppressed error did.',
    },
  ];
}
