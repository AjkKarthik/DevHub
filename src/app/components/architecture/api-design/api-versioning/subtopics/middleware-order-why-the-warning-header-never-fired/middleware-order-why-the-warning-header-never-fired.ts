import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'The Warning Middleware Was Registered After the Route That Never Calls next()',
    points: [
      'The main page’s own "Header Versioning" codeTab originally registered <code>app.get(\'/users\', ...)</code> FIRST, and a separate <code>app.use(...)</code> middleware meant to set a <code>Warning</code> header on requests missing <code>api-version</code> SECOND, right after it.',
      'Express walks middleware and route handlers in the exact order they were registered. The <code>/users</code> route handler never calls <code>next()</code> — it always responds directly via <code>handleV1Users</code>/<code>handleV2Users</code> — so the request/response cycle for <code>/users</code> ends right there, and anything registered AFTER it in the stack, including the warning middleware, is never reached for that route at all.',
      'This has been fixed on the main page by moving the warning middleware BEFORE the route handler — this subtopic traces the exact execution order both before and after, confirmed via a direct simulation of Express’s own middleware-chain-walking behavior.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'A Minimal Simulation of Express’s Own Middleware Order',
    language: 'typescript',
    code: `// A minimal stand-in for Express's own middleware-stack walking
// logic -- registration order determines execution order, and a
// handler that never calls next() ends the chain right there.
type Handler = (req: any, res: any, next: () => void) => void;
interface Layer { path: string | null; method?: string; fn: Handler; }

function createApp() {
  const stack: Layer[] = [];
  return {
    use: (fn: Handler) => stack.push({ path: null, fn }),
    get: (path: string, fn: Handler) => stack.push({ path, method: 'GET', fn }),
    handle: (method: string, path: string, headers: Record<string, string>, log: string[]) => {
      let i = 0;
      const res = { header: (k: string, v: string) => log.push(\`SET HEADER \${k}=\${v}\`) };
      function next() {
        if (i >= stack.length) return;
        const layer = stack[i++];
        if (layer.path && layer.path !== path) return next();
        if (layer.method && layer.method !== method) return next();
        layer.fn({ headers, path }, res, next);
      }
      next();
    },
  };
}

// ── BEFORE: route registered first, warning middleware after ───────────────
const brokenLog: string[] = [];
const brokenApp = createApp();
brokenApp.get('/users', (req, res, next) => {
  brokenLog.push('ROUTE HANDLER RAN');
  // never calls next() -- response already sent here
});
brokenApp.use((req, res, next) => {
  brokenLog.push('WARNING MIDDLEWARE RAN');
  if (!req.headers['api-version']) res.header('Warning', '299');
  next();
});
brokenApp.handle('GET', '/users', {}, brokenLog);
console.log(brokenLog);
// [ 'ROUTE HANDLER RAN' ] -- the warning middleware never runs at all.

// ── AFTER: warning middleware registered BEFORE the route ───────────────────
const fixedLog: string[] = [];
const fixedApp = createApp();
fixedApp.use((req, res, next) => {
  fixedLog.push('WARNING MIDDLEWARE RAN');
  if (!req.headers['api-version']) res.header('Warning', '299');
  next();
});
fixedApp.get('/users', (req, res, next) => {
  fixedLog.push('ROUTE HANDLER RAN');
});
fixedApp.handle('GET', '/users', {}, fixedLog);
console.log(fixedLog);
// [ 'WARNING MIDDLEWARE RAN', 'SET HEADER Warning=299', 'ROUTE HANDLER RAN' ]`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A teammate proposes fixing this a different way — keep the registration order unchanged, but have the <code>/users</code> route handler itself call <code>next()</code> after sending its response. Would that actually fix the bug, and is it a good idea?',
  hint: 'What does calling <code>next()</code> AFTER a response has already been sent (via <code>handleV1Users</code>/<code>handleV2Users</code>) actually do to a client that already received that response?',
  solution: `// This "fix" is worse than the original bug, not a real fix. Once
// handleV1Users/handleV2Users has already sent a response to the
// client, the HTTP request/response cycle for that request is OVER
// from the client's perspective -- calling next() afterward doesn't
// "un-send" anything or give the warning middleware a chance to
// retroactively add a header the client will ever see.

// Worse: calling next() after a response was already sent would let
// the warning middleware (and anything registered after it) run and
// attempt to call res.header(...) or otherwise touch a response
// object that's already been finalized -- in a real Express app,
// this typically produces a runtime error ("Cannot set headers after
// they are sent to the client"), turning a silent missing-warning
// bug into an actual crash.

// The middleware ONLY has a chance to affect the response if it runs
// BEFORE the response is sent -- which is exactly why reordering the
// registration (warning middleware first) is the correct fix, not a
// change to whether/when next() gets called inside the route handler
// itself.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Express middleware and route handlers all run for every matching request, regardless of the order they were registered in.',
    reality: 'Execution follows registration order exactly, and a handler that does not call <code>next()</code> stops the chain right there — anything registered AFTER a non-<code>next()</code>-calling handler simply never runs for requests that match that earlier handler, confirmed by the simulation above.',
  },
  {
    thought: 'A middleware registered with <code>app.use(...)</code> and no path always runs for every request, no matter where it is placed in the file.',
    reality: 'A path-less <code>app.use(...)</code> DOES match every path, but "runs for every request" only holds if it is actually REACHED in the stack — the codeTab above demonstrates that its POSITION relative to a response-terminating route handler determines whether it ever executes at all for a given route.',
  },
  {
    thought: 'This bug only affects whether a client sees a Warning header — a minor, cosmetic issue.',
    reality: 'For THIS specific codeTab it is cosmetic, since the warning is advisory — but the exact same ordering mistake applied to a middleware doing something functionally important (authentication, rate limiting, request validation) would mean that middleware silently never runs at all for any route registered before it, a genuinely serious class of bug the ordering issue here is a mild instance of.',
  },
];

@Component({
  selector: 'app-api-versioning-middleware-order',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './middleware-order-why-the-warning-header-never-fired.html',
  styleUrl: './middleware-order-why-the-warning-header-never-fired.scss',
})
export class MiddlewareOrderWhyTheWarningHeaderNeverFiredSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
