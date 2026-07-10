import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-missing-return-pipe-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './missing-return-in-a-pipe-stage-passes-undefined-downstream.html',
  styleUrl: './missing-return-in-a-pipe-stage-passes-undefined-downstream.scss',
})
export class MissingReturnInPipeComposeChainVoidFunctionsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Mistake #4, Proven With the Real Undefined Propagating',
      points: [
        'The main page\'s Mistake #4 warns: "Each stage in a pipe must return the value for the next stage... Void functions break the pipeline by passing undefined to the next step." This subtopic builds a THREE-stage pipeline where the FIRST stage forgets its <code>return</code>, and traces <code>undefined</code> as it propagates through every remaining stage, not just the immediately next one.',
        '<code>pipe(...fns)</code> is implemented as <code>fns.reduce((v, fn) => fn(v), x)</code> — each stage\'s return value becomes the ACCUMULATOR passed as input to the NEXT stage. If any single stage\'s arrow function body uses curly braces without an explicit <code>return</code>, that stage implicitly returns <code>undefined</code> — and <code>undefined</code> then becomes the input to every subsequent stage, all the way to the end of the pipeline.',
      ],
    },
    {
      heading: 'Why This Failure Doesn\'t Stop at "The Next Step"',
      points: [
        'Once a pipe stage returns <code>undefined</code>, that <code>undefined</code> doesn\'t just affect the IMMEDIATELY next function — <code>reduce</code> keeps threading whatever the PREVIOUS stage returned into the NEXT one, so unless a later stage specifically checks for and recovers from <code>undefined</code>, every remaining stage in the pipeline silently operates on <code>undefined</code> too, compounding the original mistake.',
        'This is exactly why the fix the main page shows is so minimal and easy to overlook in review: <code>data => { validate(data); }</code> (broken) versus <code>data => { validate(data); return data; }</code> (fixed) — the ENTIRE difference is one added <code>return data;</code> statement, with the rest of the stage\'s logic completely unchanged. A missing return is a one-token bug with a pipeline-wide, cascading consequence.',
        'Single-expression arrow functions without curly braces (<code>x => x * 2</code>) never have this problem — the expression\'s value is automatically the return value, with no explicit <code>return</code> keyword needed at all. The bug is specific to MULTI-STATEMENT stages that use curly braces, since those require an explicit <code>return</code> the single-expression form doesn\'t.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Missing return in pipe demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const pipe = (...fns: Array<(v: any) => any>) => (x: any) => fns.reduce((v, fn) => fn(v), x);

function validate(data: { name: string }) {
  console.log('  [validate] checking:', data);
}

function transform(data: { name: string } | undefined) {
  console.log('  [transform] received:', data);
  if (!data) {
    console.log('  [transform] cannot transform undefined -- returning undefined too');
    return undefined;
  }
  return { name: data.name.toUpperCase() };
}

function summarize(data: { name: string } | undefined) {
  console.log('  [summarize] received:', data);
  if (!data) {
    console.log('  [summarize] cannot summarize undefined -- returning a fallback message');
    return 'No data to summarize';
  }
  return 'Summary: ' + data.name;
}

console.log('--- BROKEN pipeline: validate stage forgets to return ---');
const brokenProcess = pipe(
  (data: { name: string }) => { validate(data); }, // forgot return! implicitly returns undefined
  transform,
  summarize,
);
const brokenResult = brokenProcess({ name: 'alice' });
console.log('Final brokenResult:', brokenResult, '<-- transform AND summarize both operated on undefined, not the real data');

console.log('--- FIXED pipeline: validate stage explicitly returns data ---');
const fixedProcess = pipe(
  (data: { name: string }) => { validate(data); return data; }, // fixed
  transform,
  summarize,
);
const fixedResult = fixedProcess({ name: 'alice' });
console.log('Final fixedResult:', fixedResult, '<-- the real data flowed through every stage correctly');`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The FIRST stage of <code>brokenProcess</code> forgets its <code>return</code>. Does only the SECOND stage (<code>transform</code>) receive <code>undefined</code>, or does the THIRD stage (<code>summarize</code>) also receive it?',
    hint: 'Ask what pipe\'s reduce((v, fn) => fn(v), x) actually threads from one stage to the next -- does each stage get the ORIGINAL input x, or specifically whatever the PREVIOUS stage returned?',
    solution: `Both transform AND summarize receive undefined -- the failure isn't
contained to just the immediately next stage. "[transform] received:
undefined" and "[summarize] received: undefined" both appear in the
console output, and the final brokenResult is "No data to summarize",
not a real summary of Alice's data.

Here's why it cascades: pipe's reduce((v, fn) => fn(v), x) always
feeds each stage whatever the PREVIOUS stage returned as v, then uses
THAT stage's own return value as v for the NEXT iteration. Once the
first stage (data => { validate(data); }) implicitly returns
undefined (no explicit return statement), reduce dutifully passes
that undefined into transform. transform, in this example, defensively
checks for undefined and returns undefined again rather than crashing
-- which means summarize ALSO receives undefined, continuing the
cascade to the very end of the pipeline.

The fixedProcess pipeline shows the complete fix is a single added
return data; statement in the first stage -- nothing else about
transform or summarize needs to change at all. With the real data
correctly threaded through from the very first stage, transform
receives the actual { name: 'alice' } object, correctly uppercases
it, and summarize produces a real, correct summary.

The lesson: a missing return in an EARLY pipe stage doesn't just
break the very next step -- it silently propagates through every
remaining stage in the pipeline, unless something later specifically
detects and recovers from the undefined, which most stages won't be
written to expect.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a missing return in a pipe/compose stage only affects the very next function in the chain — later stages further down the pipeline are unaffected and receive the correct original data.',
      reality: 'the undefined produced by a missing return propagates through EVERY remaining stage in the pipeline, not just the immediately next one — each stage feeds its own return value forward, so once undefined enters the chain, it keeps being threaded through until something specifically detects and recovers from it.',
    },
    {
      thought: 'every arrow function used as a pipe/compose stage needs an explicit return statement, since arrow functions never implicitly return their last expression\'s value.',
      reality: 'this bug is specific to MULTI-STATEMENT arrow functions using curly braces — a single-expression arrow function like x => x * 2 automatically returns the expression\'s value with no return keyword needed; only the curly-brace form requires an explicit return.',
    },
    {
      thought: 'if a pipe stage silently returns undefined due to a missing return, the pipeline would throw a clear error or crash, making the bug easy to spot and fix immediately.',
      reality: 'depending on how later stages are written, a missing return can produce no error at all — later stages may simply operate on undefined silently (or, if written defensively like this subtopic\'s transform/summarize, return a plausible-looking fallback value), making the bug easy to miss without specifically tracing what each stage actually received.',
    },
  ];
}
