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
  selector: 'app-trycatch-never-catches-settimeout-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './try-catch-never-catches-an-error-thrown-inside-settimeout.html',
  styleUrl: './try-catch-never-catches-an-error-thrown-inside-settimeout.scss',
})
export class TryCatchNeverCatchesAnErrorThrownInsideSetTimeoutSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page States This Plainly — Here It\'s Proven With a Global Handler',
      points: [
        'The main page\'s theory states: "<code>try/catch</code> does NOT catch errors in async callbacks... the error escapes." Its Mistake #2 shows the broken pattern directly. This subtopic proves the escape is real by catching the "escaped" error with a completely separate mechanism — a global <code>window.onerror</code> handler — showing the local <code>catch</code> block never even fires.',
        'A <code>try/catch</code> only protects the SYNCHRONOUS code that runs while the <code>try</code> block\'s call stack frame is still active. By the time a <code>setTimeout</code> callback actually runs, the original <code>try/catch</code>\'s call stack frame is long gone — it already finished executing and returned, with nothing left to catch anything.',
      ],
    },
    {
      heading: 'Why This Isn\'t a Bug — It\'s How the Call Stack Works',
      points: [
        'The <code>try</code> block\'s job is to watch for exceptions thrown WHILE its own code is on the call stack. <code>setTimeout(callback, ms)</code> doesn\'t run <code>callback</code> synchronously at all — it merely SCHEDULES it to run later, as a brand new macrotask with its own, completely separate call stack frame.',
        'By the time that scheduled macrotask actually executes, the <code>try/catch</code> that "wrapped" the <code>setTimeout()</code> call has already finished running and popped off the stack entirely — there is no active <code>catch</code> handler left anywhere in scope to intercept an exception thrown inside the callback.',
        'The only ways to actually catch an error from inside an async callback are: (1) put the <code>try/catch</code> INSIDE the callback itself, wrapping the risky code directly, or (2) use a global handler like <code>window.onerror</code> that catches ANY uncaught synchronous error, anywhere on the page, regardless of which function it escaped from.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>try/catch never catches a setTimeout error</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// A global handler that catches uncaught synchronous errors ANYWHERE on the page.
window.onerror = (message) => {
  console.log('[window.onerror] caught an error that escaped everything:', message);
  return true; // prevent the default "Uncaught Error" browser console noise
};

console.log('--- attempt 1: try/catch wraps the setTimeout() CALL, not its callback body ---');
try {
  setTimeout(() => {
    throw new Error('thrown inside the setTimeout callback');
  }, 0);
  console.log('the try block already finished normally -- no exception was thrown SYNCHRONOUSLY here');
} catch (e) {
  console.log('this catch block will NEVER run for the error above:', (e as Error).message);
}

console.log('--- attempt 2: the FIX -- put try/catch INSIDE the callback itself ---');
setTimeout(() => {
  try {
    throw new Error('thrown inside the setTimeout callback, but caught locally');
  } catch (e) {
    console.log('[local catch] successfully caught:', (e as Error).message);
  }
}, 10);

console.log('--- synchronous code finished -- watch which handler actually reports attempt 1\\'s error ---');`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'In "attempt 1", the <code>catch</code> block wraps the entire <code>setTimeout()</code> call. Does that <code>catch</code> block ever run for the error thrown inside the <code>setTimeout</code> callback?',
    hint: 'Ask when the try block\'s code actually finishes running relative to when the setTimeout callback itself executes -- is the try/catch\'s call stack frame even still around by then?',
    solution: `No -- the catch block in "attempt 1" never runs, and it never
logged anything for that error. Instead, the [window.onerror]
global handler is the ONLY thing that reports it, proving the
error genuinely escaped the local try/catch entirely rather than
being silently swallowed somewhere.

Here's why: the try block's code is just the single statement
"setTimeout(callback, 0)" -- calling setTimeout only SCHEDULES the
callback; it doesn't run it. Once that scheduling call returns, the
try block's code has completed normally with no exception, so
JavaScript moves on. The catch block was watching for an exception
during that brief synchronous window, and none occurred there.

Later, when the event loop actually runs the setTimeout callback as
its own separate macrotask, the original try/catch's call stack
frame is long gone -- it finished and returned well before this
moment. There is nothing left "on the stack" to catch the new
exception, so it propagates all the way up to become an uncaught
error, which is exactly what window.onerror exists to catch globally.

"Attempt 2" shows the actual fix: put the try/catch INSIDE the
callback function itself, so it's active and on the stack at the
exact moment the throw happens.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'wrapping a setTimeout(...) call in a try/catch protects any code that eventually runs inside that callback, the same way it would protect a normal function call made directly inside the try block.',
      reality: 'a try/catch only protects code that runs SYNCHRONOUSLY while its own block is still executing — setTimeout merely schedules the callback for later, on a completely separate call stack frame, by which point the original try/catch has already finished and is gone.',
    },
    {
      thought: 'an error thrown inside an uncaught setTimeout callback is silently swallowed and simply disappears, with no way to observe that it happened at all.',
      reality: 'the error is not silently swallowed — it becomes a genuine uncaught exception that the browser reports (visible in the console, and catchable via a global handler like <code>window.onerror</code>), it just cannot be caught by a try/catch that has already finished executing.',
    },
    {
      thought: 'this limitation is specific to setTimeout — other ways of scheduling callbacks, like DOM event listeners or fetch().then(), would behave differently and still be caught by an enclosing sync try/catch.',
      reality: 'this applies to EVERY callback-based async mechanism identically — DOM event listeners, setInterval, requestAnimationFrame, and raw callback-style APIs all run as separate call stack frames later, so a sync try/catch around the code that REGISTERS them never protects what happens inside them (Promise-based async code is the one major exception, since a rejected Promise\'s error propagates through the chain and CAN be caught by an enclosing try/catch around an await).',
    },
  ];
}
