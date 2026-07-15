import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './next-err-from-an-error-handler-chains-to-the-next-error-handler.html',
  styleUrl: './next-err-from-an-error-handler-chains-to-the-next-error-handler.scss'
})
export class NextErrFromAnErrorHandlerChainsToTheNextErrorHandlerSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page shows exactly ONE centralized error handler — worth knowing Express explicitly supports MULTIPLE, chained error handlers as a real, documented pattern',
      points: [
        'Express\'s own documentation states that passing anything to next() (other than the string \'route\') makes Express treat the current request as an error and SKIP any remaining non-error-handling routing and middleware functions — but this skip rule applies specifically to REGULAR middleware, not to other error handlers. Calling next(err) from inside an error-handling middleware genuinely continues on to the NEXT error-handling middleware registered after it.',
        'This means error handlers can be composed the same way regular middleware is: several specialized handlers registered in sequence, each checking whether the error is something IT specifically knows how to handle, and calling next(err) to pass it along if not — falling through to a final, generic catch-all registered last.',
      ]
    },
    {
      heading: 'Why this is a genuinely useful pattern, not just a curiosity',
      points: [
        'Express\'s own error-handling guide demonstrates exactly this shape: a logging handler that records every error and calls next(err) unconditionally, followed by a handler that formats a specific response for API/AJAX clients, followed by a final generic handler for everything else — each one focused on a single concern rather than one giant handler with a long if/else chain checking every possible error type and client type inline.',
        'A practical use: a validation-error handler that specifically formats Zod/Joi validation errors into a structured field-by-field response, calling next(err) for anything that ISN\'T a validation error, followed by an auth-error handler for 401/403-specific formatting, followed by the main page\'s own generic operational-vs-programmer-error handler as the final fallback — composing several focused handlers instead of one handler with a growing chain of type checks.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'One giant handler — works, but grows unwieldy',
      language: 'typescript',
      code: `app.use((err, req, res, next) => {
  // Everything crammed into one handler, checking error type
  // inline — works fine today, but every new error category
  // means another branch added to this same growing function.
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: 'Validation failed', issues: err.issues });
  }
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  console.error('Unexpected error:', err);
  res.status(500).json({ error: 'Internal server error' });
});`,
    },
    {
      label: 'Chained handlers — each calls next(err) to defer, matching Express\'s own documented pattern',
      language: 'typescript',
      code: `// Handler 1: log every error, then defer to the next handler
function logErrors(err, req, res, next) {
  console.error(err.stack);
  next(err); // passes to the NEXT error handler below
}

// Handler 2: only handles validation errors specifically
function validationErrorHandler(err, req, res, next) {
  if (err.name !== 'ZodError') return next(err); // not mine — defer
  res.status(400).json({ error: 'Validation failed', issues: err.issues });
}

// Handler 3: only handles auth errors specifically
function authErrorHandler(err, req, res, next) {
  if (err.name !== 'UnauthorizedError') return next(err); // defer
  res.status(401).json({ error: 'Not authenticated' });
}

// Handler 4: final catch-all for anything none of the above handled
function genericErrorHandler(err, req, res, next) {
  res.status(500).json({ error: 'Internal server error' });
}

// Registration order matters — same as regular middleware
app.use(logErrors);
app.use(validationErrorHandler);
app.use(authErrorHandler);
app.use(genericErrorHandler);`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team has a single, large error-handling middleware with a long if/else chain checking err.name for every error category the app might produce. They want to split it into several smaller, focused handlers registered in sequence instead — one for validation errors, one for auth errors, one generic fallback — without changing the app\'s overall error-handling behavior. A developer worries: "if the validation handler doesn\'t match, won\'t the request just hang, since a 4-argument error handler doesn\'t automatically fall through to the next middleware the way regular middleware does?" Is this concern valid, and what makes the refactor safe?',
    hint: 'Does calling next(err) — as opposed to calling next() with no arguments, or not calling next at all — from WITHIN an error-handling middleware behave the same way it does in regular middleware, continuing on to whatever comes next in the chain?',
    solution: 'The developer\'s concern isn\'t valid, as long as each handler explicitly calls next(err) when the error doesn\'t match its specific condition. Express\'s documented behavior is that passing anything to next() makes Express treat the request as an error state and skip remaining REGULAR (non-error) middleware — but it does NOT skip subsequent ERROR-handling middleware. Calling next(err) from inside an error handler continues the chain to the next 4-argument handler registered after it, exactly the same conceptual mechanism as calling next() in regular middleware continues to the next regular handler. The refactor is safe specifically because each specialized handler (validation, auth) is written to call next(err) — not just return or do nothing — whenever the error doesn\'t match what it\'s designed to handle, ensuring the error keeps propagating down the chain until either a handler matches it or the final generic catch-all handles it. The risk isn\'t in the chaining mechanism itself, which Express supports natively — it would only be a real problem if one of the specialized handlers forgot to call next(err) in its non-matching branch, silently swallowing the error and genuinely leaving the request hanging.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Express only supports registering a single error-handling middleware — if you register more than one, only the first one registered will ever run.',
      reality: 'This subtopic\'s theory clarifies Express explicitly supports and documents CHAINING multiple error handlers — calling next(err) from within one error handler passes control to the next error-handling middleware registered after it, the same way next() chains regular middleware.'
    },
    {
      thought: 'Calling next(err) from inside an error-handling middleware behaves differently than calling next() in regular middleware — specifically, it does NOT continue to "the next thing," since error handling is a fundamentally separate mechanism.',
      reality: 'This subtopic\'s exercise shows the chaining mechanism is conceptually identical — next(err) from an error handler continues to the next ERROR handler in registration order, just as next() in regular middleware continues to the next regular handler; the only difference is which category of handler gets skipped versus continued to.'
    },
    {
      thought: 'Splitting one large error-handling middleware into several smaller, chained handlers is a purely cosmetic refactor with no behavioral risk, regardless of how each new handler is written.',
      reality: 'This subtopic\'s theory shows this refactor requires deliberate care — each specialized handler must explicitly call next(err) in its non-matching branch, or the error silently stops propagating and the request hangs, a real behavioral risk introduced specifically by the refactor, not present in the original single-handler version.'
    }
  ];
}
