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
  selector: 'app-yield-delegation-two-way-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './yield-delegation-forwards-next-and-throw.html',
  styleUrl: './yield-delegation-forwards-next-and-throw.scss',
})
export class YieldDelegationForwardsNextValuesAndThrowIntoTheInnerGeneratorSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Theory, Verified Against a Manual Loop That Fails to Replicate It',
      points: [
        'The main page\'s theory states: "<code>yield*</code>... propagates any values passed back in via <code>.next(value)</code> or errors thrown via <code>.throw()</code> down into the inner generator — a plain manual loop over the inner generator would not replicate this two-way communication." This subtopic builds exactly that comparison: an outer generator using <code>yield*</code> against an outer generator using a hand-written <code>for...of</code> loop over the same inner generator, sending values and an error into both, and observing that only the <code>yield*</code> version actually delivers them.',
        '<code>yield*</code> is not just sugar for "loop over this and re-yield each value" — it establishes a full two-way pipe between whoever is driving the OUTER generator and the INNER generator being delegated to, for the entire duration of the delegation.',
      ],
    },
    {
      heading: 'Why a Manual for...of Loop Can\'t Replicate This',
      points: [
        'A <code>for...of</code> loop only ever calls the inner generator\'s <code>.next()</code> with NO ARGUMENT — the loop construct itself has no way to know what value the OUTER generator\'s caller passed into the outer generator\'s own <code>.next(value)</code>, so it can\'t forward it. Any value sent into the outer generator during a manual re-yield loop is simply delivered to the outer generator\'s own <code>yield</code> expression, never reaching the inner generator at all.',
        'Similarly, if someone calls <code>.throw(err)</code> on the OUTER generator while it\'s manually looping over the inner one, that error is thrown at the outer generator\'s own <code>yield</code> point inside the loop body — a manual loop has no built-in mechanism to catch that and forward it into the INNER generator\'s own currently-paused <code>yield</code>.',
        '<code>yield*</code> handles both of these automatically as part of the delegation contract: any value passed to the outer generator\'s <code>.next(value)</code> while paused inside a <code>yield*</code> expression is forwarded to become the INNER generator\'s current <code>yield</code> result, and any <code>.throw(err)</code> call on the outer generator is likewise forwarded into the inner generator (where it can be caught by the inner generator\'s own <code>try/catch</code>, if any).',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>yield* two-way delegation demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `function* inner() {
  try {
    const received1 = yield 'inner-ready';
    console.log('  [inner] received via .next():', received1);
    const received2 = yield 'inner-still-going';
    console.log('  [inner] received via .next():', received2);
  } catch (e) {
    console.log('  [inner] caught a forwarded error:', (e as Error).message);
    yield 'inner-recovered-after-catch';
  }
}

console.log('--- Outer generator using yield* delegation ---');
function* outerWithYieldStar() {
  yield* inner();
}
const g1 = outerWithYieldStar();
console.log('g1.next():', g1.next());              // starts inner, gets 'inner-ready'
console.log('g1.next("A"):', g1.next('A'));         // "A" IS forwarded into inner's first yield
console.log('g1.throw(new Error("boom")):', g1.throw(new Error('boom')));  // error IS forwarded into inner

console.log('--- Outer generator using a manual for...of re-yield loop ---');
function* outerWithManualLoop() {
  for (const v of inner()) {
    yield v; // just re-yields -- has no way to forward .next(value) or .throw() into inner
  }
}
const g2 = outerWithManualLoop();
console.log('g2.next():', g2.next());              // starts inner, gets 'inner-ready'
console.log('g2.next("B"):', g2.next('B'));         // "B" is NOT forwarded -- inner never sees it
try {
  console.log('g2.throw(new Error("boom2")):', g2.throw(new Error('boom2')));
} catch (e) {
  console.log('g2.throw() just threw straight out of outerWithManualLoop -- inner never got a chance to catch it:', (e as Error).message);
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Both <code>g1</code> (using <code>yield*</code>) and <code>g2</code> (using a manual <code>for...of</code> loop) wrap the exact same <code>inner()</code> generator. Does <code>inner()</code>\'s own <code>catch</code> block ever run in the <code>g2</code> scenario?',
    hint: 'Ask specifically what a plain for...of loop\'s body does with the value or error it receives when the OUTER generator itself is resumed with .next(value) or .throw(err) -- does that loop have any code forwarding those into the inner generator it\'s iterating?',
    solution: `inner()'s catch block runs for g1 (the yield* version), but NEVER
runs for g2 (the manual loop version) -- the thrown error simply
propagates straight out of outerWithManualLoop() instead.

For g1: yield* inner() establishes full two-way delegation. When
g1.next('A') is called, 'A' is forwarded to become the result of
inner()'s own currently-paused yield expression -- inner() logs
receiving it. When g1.throw(new Error('boom')) is called next, that
error is forwarded into inner() at its OWN current yield point,
where inner()'s try/catch catches it and yields
'inner-recovered-after-catch'.

For g2: the for...of loop inside outerWithManualLoop() only ever
calls inner().next() with no argument on each iteration -- it has
no code that inspects what was passed to outerWithManualLoop()'s
own .next('B') call, so 'B' just becomes the result of the loop's
own "yield v" expression instead, and inner() never sees it at all.
When g2.throw(new Error('boom2')) is called, that error is thrown
at outerWithManualLoop()'s own "yield v" line inside the loop body
-- a manual for...of loop has no mechanism to catch that and
forward it into inner(), so it just propagates straight out of
outerWithManualLoop() as an uncaught exception.

The lesson: yield* is not simply shorthand for "loop over this and
re-yield each value" -- it specifically wires up two-way
communication (.next(value) and .throw()) that a hand-written loop
would need considerable extra code to replicate manually, if it's
even possible to fully replicate at all.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'yield* inner() is just convenient shorthand for a for...of loop that re-yields each value from inner() — the two are functionally interchangeable, just with different amounts of typing.',
      reality: 'yield* additionally establishes two-way delegation — forwarding values passed via .next(value) and errors thrown via .throw() into the inner generator — behavior a manual for...of re-yield loop does NOT replicate at all.',
    },
    {
      thought: 'a manual for...of loop that re-yields each value from an inner generator will still correctly forward a value passed to the OUTER generator\'s own .next(value) call down into the inner generator, since the loop is just relaying values back and forth anyway.',
      reality: 'a for...of loop only ever calls the inner generator\'s .next() with no argument on each iteration — any value passed into the outer generator\'s own .next(value) call becomes the result of the loop\'s "yield v" expression instead, and never reaches the inner generator at all.',
    },
    {
      thought: 'calling .throw(err) on an outer generator that is manually looping over an inner one will still let the inner generator\'s own try/catch handle the error, since the error occurs while the inner generator is technically still being iterated.',
      reality: 'a manually thrown error on the outer generator surfaces at the outer generator\'s OWN currently-paused yield point inside the loop body — with no forwarding mechanism built into a plain loop, it propagates straight out of the outer generator as an uncaught exception, never reaching the inner generator\'s try/catch at all.',
    },
  ];
}
