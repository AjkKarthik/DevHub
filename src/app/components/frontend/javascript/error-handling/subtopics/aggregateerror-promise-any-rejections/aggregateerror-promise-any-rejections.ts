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
  selector: 'app-aggregateerror-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './aggregateerror-promise-any-rejections.html',
  styleUrl: './aggregateerror-promise-any-rejections.scss',
})
export class AggregateErrorFromPromiseAnyPackagesEveryRejectionNotJustTheFirstSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s QnA, Verified by Actually Inspecting the .errors Array',
      points: [
        'The main page\'s QnA states: "<code>AggregateError</code> wraps multiple errors into one, with an <code>errors</code> array. It is thrown by <code>Promise.any()</code> when ALL promises reject — it packages all the rejection reasons together so you can inspect every failure, not just the first." This subtopic actually inspects that <code>errors</code> array live, confirming every individual rejection reason survives inside it, in the original order the promises were passed in.',
        'This directly contrasts with <code>Promise.all()</code>, which rejects with only the FIRST rejection reason it encounters and discards all the others entirely — <code>Promise.any()</code>\'s failure mode is fundamentally different: it only fails when EVERYTHING fails, and when it does, it hands back every single reason, not just one.',
      ],
    },
    {
      heading: 'Why Promise.any() Needs a Different Kind of Error Entirely',
      points: [
        '<code>Promise.any()</code> resolves with the value of the FIRST promise to fulfill, and only rejects if EVERY promise in the array rejects — a fundamentally different combinator from <code>Promise.all()</code> (fails fast on the first rejection) or <code>Promise.race()</code> (settles on whichever promise finishes first, success or failure).',
        'Because <code>Promise.any()</code>\'s rejection case means ALL attempts failed, a single ordinary <code>Error</code> couldn\'t represent that outcome without losing information — which is exactly why the spec introduced <code>AggregateError</code> specifically for this combinator: one error object whose <code>.errors</code> array preserves every individual failure reason, in the same order the original promises were passed in.',
        'You can also construct and throw an <code>AggregateError</code> manually — <code>new AggregateError([err1, err2], \'summary message\')</code> — any time you want to report multiple independent validation or processing failures together as one error, rather than only reporting the first one found.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>AggregateError from Promise.any() demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `function failingCheck(label: string, delayMs: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(label + ' failed')), delayMs);
  });
}

console.log('--- Promise.any() with THREE checks, ALL of which fail ---');
try {
  await Promise.any([
    failingCheck('primary server', 30),
    failingCheck('backup server', 10),
    failingCheck('fallback cache', 20),
  ]);
} catch (err) {
  const aggErr = err as AggregateError;
  console.log('Caught error type:', aggErr.name);
  console.log('Top-level message:', aggErr.message);
  console.log('Number of individual failures preserved:', aggErr.errors.length);
  aggErr.errors.forEach((e, i) => {
    console.log('  errors[' + i + ']:', (e as Error).message);
  });
}

console.log('--- Contrast: Promise.all() with the SAME three failing checks ---');
try {
  await Promise.all([
    failingCheck('primary server', 30),
    failingCheck('backup server', 10),
    failingCheck('fallback cache', 20),
  ]);
} catch (err) {
  console.log('Promise.all() caught only:', (err as Error).message, '<-- the other 2 failure reasons are completely lost');
}

console.log('--- Manually constructing an AggregateError for multiple validation failures ---');
function validateUser(data: { name?: string; email?: string; age?: number }) {
  const errors: Error[] = [];
  if (!data.name) errors.push(new Error('name is required'));
  if (!data.email?.includes('@')) errors.push(new Error('email must be valid'));
  if (data.age !== undefined && data.age < 0) errors.push(new Error('age cannot be negative'));
  if (errors.length > 0) {
    throw new AggregateError(errors, 'Validation failed with ' + errors.length + ' error(s)');
  }
}

try {
  validateUser({ email: 'not-an-email', age: -5 });
} catch (err) {
  const aggErr = err as AggregateError;
  console.log(aggErr.message, '-- individual reasons:', aggErr.errors.map(e => (e as Error).message));
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Compare the <code>Promise.any()</code> output to the <code>Promise.all()</code> output for the exact same three failing promises. How many individual failure reasons does each one actually give you access to?',
    hint: 'Look specifically at how many entries end up in the caught error object in each case -- one combinator discards information the other one deliberately preserves.',
    solution: `Promise.any() gives you access to ALL THREE failure reasons, via
aggErr.errors -- an array containing every individual rejection
reason, in the original array order (primary server, backup server,
fallback cache), regardless of which one settled first or last.

Promise.all(), by contrast, only gives you access to ONE failure
reason -- whichever promise rejected FIRST (in this case "backup
server failed", since it had the shortest delay). The other two
rejection reasons (primary server, fallback cache) are completely
discarded the moment Promise.all() rejects -- there is no array, no
.errors property, nothing that preserves them.

This is exactly why AggregateError exists as its own distinct error
type: Promise.any()'s entire premise is "tell me if EVERYTHING
failed" -- a single ordinary Error object with one message couldn't
represent that outcome without losing which specific attempts
failed and why. The manual validateUser() example at the end shows
you can use this same pattern yourself any time you want to report
multiple independent failures as one error, instead of stopping at
the first one you find.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Promise.any() behaves like Promise.all() but for failure cases — it rejects as soon as the FIRST promise in the array rejects, just reporting that one failure.',
      reality: 'Promise.any() only rejects when EVERY SINGLE promise in the array has rejected — a single early rejection has no effect at all as long as at least one other promise is still pending or has fulfilled.',
    },
    {
      thought: 'when Promise.any() does reject, the AggregateError it throws only contains the LAST failure reason, or perhaps just a generic summary message with no way to inspect the individual causes.',
      reality: 'the thrown <code>AggregateError</code>\'s <code>.errors</code> property is an array containing EVERY individual rejection reason from every promise in the array, in their original order — none of the individual failure details are lost.',
    },
    {
      thought: 'AggregateError is a special browser-only or Promise.any()-only construct that can\'t be created or used directly in your own code.',
      reality: 'AggregateError is a regular, constructible built-in error type — <code>new AggregateError(errorsArray, message)</code> — usable anywhere you want to bundle multiple independent failures (like several validation errors) into a single throwable error object.',
    },
  ];
}
