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
    heading: 'Two Separate codeTabs, Never Actually Assembled Into One App',
    points: [
      'The main page’s own "Problem Details Middleware" codeTab defines a complete <code>errorHandler</code> (a 4-parameter Express error middleware, commented "last middleware"). A SEPARATE "Validation Error Response" codeTab defines a route that calls <code>next(new ApiError(...))</code>, relying on that error handler to catch it. Neither codeTab ever shows <code>app.use(errorHandler)</code> actually being registered, or WHERE in the app it needs to go.',
      'This connects directly to the API Versioning topic’s own middleware-ordering lesson: Express walks middleware/routes in registration order. An error-handling middleware (recognized specifically by having 4 parameters — <code>(err, req, res, next)</code>) only gets invoked when something calls <code>next(err)</code> — but it can only CATCH errors from routes registered BEFORE it in the stack.',
      'This subtopic builds the missing assembly: the correct order is routes first, error handler LAST — the exact opposite intuition from a "setup" middleware like auth or logging, which typically needs to run FIRST, before the routes it protects.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The Full App, Correctly Assembled',
    language: 'typescript',
    code: `const app = express();
app.use(express.json());

// ── 1. Routes go FIRST ──────────────────────────────────────────────────────
app.post('/orders', async (req, res, next) => {
  const result = CreateOrderSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.issues.map(issue => ({
      field: issue.path.join('.'), message: issue.message, code: issue.code,
    }));
    return next(new ApiError(422, 'https://api.example.com/errors/validation',
      'Validation Error', \`\${errors.length} field(s) failed validation\`, errors));
  }
  const order = await db.orders.create(result.data);
  res.status(201).header('Location', \`/orders/\${order.id}\`).json(order);
});

app.get('/orders/:id', async (req, res, next) => {
  const order = await db.orders.findById(req.params.id);
  if (!order) return next(new ApiError(404, 'https://api.example.com/errors/not-found',
    'Resource Not Found', \`No order with id \${req.params.id}\`));
  res.json(order);
});

// ── 2. Error handler goes LAST -- after every route that might call next(err) ──
app.use(errorHandler);

// If errorHandler were registered BEFORE the routes above, Express
// would never reach it via next(err) for THEIR errors -- a 4-param
// error handler only intercepts errors that occur in middleware/
// routes registered EARLIER in the stack than itself, the same
// registration-order rule from the API Versioning topic, just
// applied to the specific case of error-handling middleware.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A teammate accidentally registers <code>app.use(errorHandler)</code> BETWEEN the two routes above — after <code>POST /orders</code>, but before <code>GET /orders/:id</code>. What breaks, specifically?',
  hint: 'The errorHandler is a 4-parameter function — does it match a NORMAL (non-error) request the way a 3-parameter middleware would, and does registration order still apply the same way?',
  solution: `// POST /orders is unaffected -- its own next(err) calls happen
// BEFORE the misplaced errorHandler in the stack, so it still gets
// caught correctly.

// GET /orders/:id is broken, but not in the way a naive guess might
// expect. Express specifically recognizes a 4-parameter function as
// ERROR-HANDLING middleware -- it is SKIPPED during normal (non-error)
// request dispatch, regardless of where it sits in the stack. So the
// misplaced errorHandler does NOT intercept or block the normal GET
// /orders/:id request from reaching its own handler.

// The actual breakage: when GET /orders/:id calls next(new
// ApiError(404, ...)), Express looks for the NEXT error-handling
// middleware AFTER the current position in the stack -- but the only
// one that exists (errorHandler) was already passed BEFORE this
// route was even reached. There is no error handler left downstream
// to catch it, so Express falls back to its own built-in default
// error handler instead of the custom Problem Details response --
// the client gets a generic, un-formatted error instead of the
// intended RFC 9457 response, with no obvious signal about why.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since errorHandler is only ever invoked via next(err), its position in the middleware stack relative to normal routes doesn’t matter.',
    reality: 'Position matters just as much for error-handling middleware as for any other — Express only considers error handlers that are registered AFTER the point where <code>next(err)</code> was called. A route\'s errors can only be caught by an error handler registered LATER in the stack than that route itself, exactly the registration-order rule the API Versioning topic already established for ordinary middleware.',
  },
  {
    thought: 'A 4-parameter error-handling middleware behaves like a normal 3-parameter middleware during regular (non-error) requests — it will intercept and potentially block them if placed in the wrong spot.',
    reality: 'Express specifically recognizes the 4-parameter signature and SKIPS an error handler entirely during normal request dispatch — it can never accidentally intercept a non-error request no matter where it sits in the stack. The risk of misplacement is the opposite problem: routes registered AFTER a misplaced error handler have no error handler left to catch their own errors.',
  },
  {
    thought: 'If an error handler is missing or misplaced, Express simply crashes or hangs the request.',
    reality: 'Express has its OWN built-in default error handler that catches anything no custom handler reaches — the practical failure mode is a generic, unformatted error response reaching the client instead of the custom RFC 9457 Problem Details shape, not a crash or a hung connection.',
  },
];

@Component({
  selector: 'app-api-error-response-wiring',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './wiring-the-error-handler-why-it-must-be-last.html',
  styleUrl: './wiring-the-error-handler-why-it-must-be-last.scss',
})
export class WiringTheErrorHandlerWhyItMustBeLastSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
