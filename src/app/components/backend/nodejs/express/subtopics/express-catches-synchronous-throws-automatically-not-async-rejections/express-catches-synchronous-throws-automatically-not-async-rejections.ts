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
  templateUrl: './express-catches-synchronous-throws-automatically-not-async-rejections.html',
  styleUrl: './express-catches-synchronous-throws-automatically-not-async-rejections.scss'
})
export class ExpressCatchesSynchronousThrowsAutomaticallyNotAsyncRejectionsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s mistake entry says async handlers need try/catch "or Express 4 does not catch async rejections automatically" — worth being precise that this ONLY applies to async code, not throws in general',
      points: [
        'Express\'s own documentation states plainly: "Errors that occur in synchronous code inside route handlers and middleware require no extra work" — if a plain, non-async route handler does throw new Error(...) directly, Express\'s own internal request-handling code (which wraps each handler invocation in a try/catch) genuinely catches it and routes it to the nearest error-handling middleware automatically. No manual try/catch, no express-async-errors, nothing extra needed for this case.',
        'This means the main page\'s guidance about needing try/catch or express-async-errors is specifically about ASYNC handlers — a synchronous handler that throws was never actually broken in the first place, and adding defensive try/catch to a synchronous handler that already works correctly is unnecessary code, not a fix for a real gap.',
      ]
    },
    {
      heading: 'The precise reason async is different: the throw doesn\'t happen while Express\'s catch is still listening',
      points: [
        'An async function that throws doesn\'t actually "throw" in the traditional synchronous sense from the caller\'s perspective — it returns a REJECTED PROMISE. Express calls the handler function, gets back a Promise (which async functions always return), and its synchronous try/catch around that call has ALREADY finished executing and returned by the time that Promise settles into a rejected state on a later microtask tick.',
        'By the time the rejection actually happens, Express\'s try/catch is no longer "listening" for it — nothing is watching that returned Promise for rejection, so the error surfaces instead as an unhandled promise rejection, invisible to Express\'s own error-handling pipeline entirely, unless the handler code itself explicitly catches it and calls next(err) — which is exactly the gap try/catch-plus-next(err) or express-async-errors closes.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Synchronous throw — caught automatically, no extra code needed',
      language: 'typescript',
      code: `app.get('/sync-error', (req, res) => {
  // This is a PLAIN synchronous function — not async.
  // Express's own internal try/catch around this handler call
  // genuinely catches this throw and routes it to the error
  // handler below — no try/catch or express-async-errors needed.
  throw new Error('Something broke synchronously');
});

app.use((err, req, res, next) => {
  console.error(err); // THIS RUNS — Express caught the throw above
  res.status(500).json({ error: err.message });
});`,
    },
    {
      label: 'Async throw — NOT caught automatically, needs explicit handling',
      language: 'typescript',
      code: `app.get('/async-error', async (req, res) => {
  // This IS an async function. Throwing here doesn't throw
  // synchronously from Express's perspective — it returns a
  // REJECTED PROMISE. Express's try/catch around the handler call
  // has already returned before that promise rejects on a later
  // microtask tick, so this error is NEVER routed to the error
  // handler below — it becomes an unhandled rejection instead.
  throw new Error('Something broke asynchronously');
});

// The fix: explicit try/catch + next(err), OR install
// express-async-errors, which patches route registration to wrap
// every handler in exactly this pattern automatically:
app.get('/async-error-fixed', async (req, res, next) => {
  try {
    throw new Error('Something broke asynchronously');
  } catch (err) {
    next(err); // NOW it reaches the error handler correctly
  }
});`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer adds a plain, non-async route handler that throws new Error(\'validation failed\') directly, without express-async-errors installed and without any try/catch. They test it and are surprised to find the error handler DOES correctly catch it and return a proper error response — no crash, no hanging request. A colleague insists "that can\'t be right, Express doesn\'t catch errors automatically, you always need express-async-errors or try/catch." Who is correct, and why does the specific handler in question work fine without either?',
    hint: 'Is the specific claim "Express doesn\'t catch errors automatically" actually true for EVERY kind of error, or does it specifically apply to one category (async/Promise-based) while a different category (synchronous throws) is handled differently?',
    solution: 'The developer\'s observation is correct, and the colleague\'s blanket claim is too broad. Express genuinely does catch synchronous throws automatically — its own documentation states this explicitly, and its internal handler-invocation code wraps each call in a try/catch that catches exactly this case. The colleague\'s advice about needing express-async-errors or manual try/catch is accurate, but ONLY for ASYNC handlers specifically — an async function that throws doesn\'t throw synchronously at all, it returns a rejected Promise, and Express\'s synchronous try/catch has already finished executing by the time that Promise actually rejects on a later microtask tick, so it never observes the error. Since the handler in this specific case is a PLAIN, non-async function, its throw genuinely happens synchronously, within the window Express\'s try/catch is actively watching — which is exactly why it worked correctly with no extra handling needed. The general advice about async error handling remains correct; it simply doesn\'t apply to this particular synchronous handler.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Express 4 never catches any errors automatically — every route handler, synchronous or async, requires manual try/catch and next(err), or a library like express-async-errors, to handle errors correctly.',
      reality: 'This subtopic\'s theory clarifies Express genuinely does catch SYNCHRONOUS throws automatically, per its own documentation — the manual-handling requirement is specifically scoped to async/Promise-based errors, not errors in general.'
    },
    {
      thought: 'Adding a defensive try/catch block to a plain, synchronous route handler is always a safe, harmless best practice, even if the handler would technically work fine without it.',
      reality: 'This subtopic\'s exercise shows this is unnecessary code for a synchronous handler specifically — Express\'s own automatic catching already covers this case completely, so the try/catch adds no functional benefit there, unlike its genuine necessity for async handlers.'
    },
    {
      thought: 'An async function throwing an error and a synchronous function throwing an error are fundamentally the same operation from Express\'s perspective, just happening at different times.',
      reality: 'This subtopic\'s theory shows these are genuinely different mechanisms — a synchronous throw is a real JavaScript exception Express\'s try/catch directly observes, while an async function "throwing" actually returns a rejected Promise that settles on a LATER microtask tick, after Express\'s try/catch has already stopped listening.'
    }
  ];
}
