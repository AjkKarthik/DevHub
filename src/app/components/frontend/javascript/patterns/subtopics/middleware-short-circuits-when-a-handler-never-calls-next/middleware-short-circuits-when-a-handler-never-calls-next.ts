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
  selector: 'app-middleware-short-circuit-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './middleware-short-circuits-when-a-handler-never-calls-next.html',
  styleUrl: './middleware-short-circuits-when-a-handler-never-calls-next.scss',
})
export class MiddlewareShortCircuitsWhenAHandlerNeverCallsNextSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Own authMiddleware Example, Proven to Actually Halt the Chain',
      points: [
        'The main page\'s "Middleware pipeline" code tab includes an <code>authMiddleware</code> that returns early WITHOUT calling <code>next()</code> when <code>ctx.user</code> is missing: <code>if (!ctx.user) { ctx.error = \'Unauthorized\'; return; }</code>. This subtopic runs that exact pipeline with and without a user, and proves the LATER middlewares (<code>logMiddleware</code>, <code>handlerMiddleware</code>) genuinely never execute at all when <code>authMiddleware</code> short-circuits — not just that they produce no visible output, but that their code never runs.',
        'The <code>next()</code> function passed to each middleware isn\'t automatically invoked between handlers by the pipeline itself — calling <code>next()</code> is entirely the CURRENT middleware\'s own responsibility. A middleware that returns without calling it has, by omission, decided the pipeline stops right there.',
      ],
    },
    {
      heading: 'Why This Pattern Powers Auth Guards, Not Just Logging',
      points: [
        'This exact mechanism — an early <code>return</code> without calling <code>next()</code> — is precisely how authentication/authorization guards work in Express.js middleware, Redux middleware, and Angular HTTP interceptors: a guard middleware checks a condition, and if it fails, it simply never calls <code>next()</code>, which means every middleware and the actual route handler registered AFTER it in the chain never runs at all.',
        'This is fundamentally different from a middleware that calls <code>next()</code> and then ALSO does more work afterward (common in logging middlewares that want to log both before and after the rest of the chain runs) — calling <code>next()</code> hands control forward synchronously, and code written after that call resumes once the REST of the chain has fully finished.',
        'A middleware that forgets to call <code>next()</code> by ACCIDENT (rather than deliberately, as a guard) is a common, hard-to-diagnose bug — the request appears to silently "hang" or produce an incomplete response, since every middleware registered after the forgetful one simply never executes, with no error thrown anywhere to explain why.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Middleware short-circuit demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `type Ctx = { method: string; url: string; user?: string; error?: string; response?: unknown };

function createPipeline(...middlewares: Array<(ctx: Ctx, next: () => void) => void>) {
  return function runPipeline(ctx: Ctx) {
    let idx = 0;
    function next() {
      const mw = middlewares[idx++];
      if (mw) mw(ctx, next);
    }
    next();
    return ctx;
  };
}

const authMiddleware = (ctx: Ctx, next: () => void) => {
  console.log('  [authMiddleware] running, ctx.user =', ctx.user);
  if (!ctx.user) {
    console.log('  [authMiddleware] no user -- setting error and NOT calling next()');
    ctx.error = 'Unauthorized';
    return; // <-- the pipeline stops here. logMiddleware and handlerMiddleware never run.
  }
  console.log('  [authMiddleware] user present -- calling next()');
  next();
};

const logMiddleware = (ctx: Ctx, next: () => void) => {
  console.log('  [logMiddleware] RUNNING -- this only prints if authMiddleware called next()');
  next();
};

const handlerMiddleware = (ctx: Ctx, next: () => void) => {
  console.log('  [handlerMiddleware] RUNNING -- this only prints if the whole chain reached here');
  ctx.response = { data: 'Hello ' + ctx.user };
  next();
};

const handle = createPipeline(authMiddleware, logMiddleware, handlerMiddleware);

console.log('--- Scenario 1: request WITH a user ---');
const result1 = handle({ method: 'GET', url: '/api', user: 'Alice' });
console.log('final ctx:', result1);

console.log('--- Scenario 2: request WITHOUT a user ---');
const result2 = handle({ method: 'GET', url: '/api' });
console.log('final ctx:', result2, '<-- no "response" field -- handlerMiddleware genuinely never ran');`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'In Scenario 2, the request has no <code>user</code>. Do the <code>[logMiddleware]</code> and <code>[handlerMiddleware]</code> console logs appear at all?',
    hint: 'Ask what actually triggers the NEXT middleware in the chain to run -- is it the pipeline automatically advancing after some fixed amount of time, or something the CURRENT middleware has to explicitly do?',
    solution: `No -- neither "[logMiddleware] RUNNING" nor "[handlerMiddleware]
RUNNING" appears anywhere in Scenario 2's output. Only "[authMiddleware]
running" and "[authMiddleware] no user -- setting error and NOT
calling next()" print, and then the pipeline produces its final ctx
with error: 'Unauthorized' and no response field at all.

Here's the mechanism: createPipeline()'s next() function only calls
the NEXT middleware in the array when explicitly invoked BY the
current middleware. authMiddleware checks ctx.user, finds it missing,
sets ctx.error, and returns WITHOUT calling next(). Since nothing
else in the pipeline machinery automatically advances to the next
middleware on its own, the chain simply stops -- logMiddleware and
handlerMiddleware are never even reached, let alone executed.

Scenario 1 (WITH a user) shows the contrast: authMiddleware calls
next(), which triggers logMiddleware, which itself calls next(),
which triggers handlerMiddleware, which sets ctx.response and calls
its own next() (which does nothing further, since there's no 4th
middleware) -- all three middlewares' logs appear, in order, and the
final ctx correctly includes a response field.

This is exactly the mechanism the main page's authMiddleware example
demonstrates, and it's the same pattern real auth guards use in
Express, Angular interceptors, and Redux middleware: a guard doesn't
need to throw an error or explicitly "stop" anything special -- simply
not calling next() IS the stop.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a middleware pipeline automatically advances to the next handler once the current one finishes running, similar to how a for loop automatically moves to its next iteration.',
      reality: 'a middleware pipeline only advances when the CURRENT middleware explicitly calls the next() function it was given — a middleware that returns without calling next() halts the entire chain, with every remaining middleware simply never executing.',
    },
    {
      thought: 'a middleware that wants to block the rest of the chain from running (like an auth guard) needs to throw an error or call some special "stop" or "abort" function to prevent the remaining middlewares from executing.',
      reality: 'there is no special stop/abort mechanism needed — simply NOT calling next() is itself sufficient to halt the pipeline; this is precisely how authentication guards work in real middleware systems like Express.js and Angular interceptors.',
    },
    {
      thought: 'if a middleware forgets to call next() by accident (a genuine bug, not an intentional guard), the pipeline would throw an error or hang with a visible failure that\'s easy to notice and debug.',
      reality: 'a forgotten next() call produces no error or exception of any kind — the request appears to silently stop partway through, producing an incomplete response with no indication anywhere of WHICH middleware failed to call next(), making this a genuinely hard-to-diagnose class of bug.',
    },
  ];
}
