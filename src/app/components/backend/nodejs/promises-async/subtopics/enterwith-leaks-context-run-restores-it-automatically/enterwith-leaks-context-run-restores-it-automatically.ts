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
  templateUrl: './enterwith-leaks-context-run-restores-it-automatically.html',
  styleUrl: './enterwith-leaks-context-run-restores-it-automatically.scss'
})
export class EnterwithLeaksContextRunRestoresItAutomaticallySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own AsyncLocalStorage code sample uses requestStore.run({ requestId }, () => { ... }) — worth knowing that run() is not the only way to enter a context, and the alternative (enterWith()) has a real, documented leakage risk the main page never mentions',
      points: [
        'AsyncLocalStorage.run(store, callback) scopes the given store to the callback function and everything it asynchronously spawns — Node\'s own documentation states this store "is not accessible outside of the callback function." Once the callback (and its async descendants) finish, the PREVIOUS context is automatically restored. This is exactly what makes the main page\'s middleware pattern safe: each request gets its own run() call, and contexts never bleed between requests.',
        'AsyncLocalStorage.enterWith(store) works differently: instead of scoping the store to a specific callback, it mutates the CURRENT execution context for the rest of the current synchronous execution — and does NOT automatically restore the previous context afterward. Node\'s own documentation warns directly: "This transition will continue for the entire synchronous execution. This means that if, for example, the context is entered within an event handler, subsequent event handlers will also run within that context unless specifically bound to another context."',
        'Node\'s documentation states its own recommendation plainly, given this: "That is why run() should be preferred over enterWith() unless there are strong reasons to use the latter method." This is not a stylistic preference — it is a direct warning about a real correctness risk.',
      ]
    },
    {
      heading: 'Why this specific leakage risk is easy to introduce accidentally',
      points: [
        'Calling enterWith() at the top of an HTTP request handler, instead of wrapping the whole handler in run(), risks the request\'s context bleeding into whatever code runs AFTER that handler in the same synchronous execution turn — which, depending on the server framework\'s internals, can include code handling an entirely different, unrelated request or event.',
        'enterWith() is a genuinely useful tool for specific cases — e.g., entering a context partway through an already-running synchronous function where wrapping the REST of that function in a run() callback would require an awkward code restructure. The main page\'s own request-scoped pattern is exactly the case where run() is the correct, safe choice — a fresh, cleanly-scoped context per request that can never leak.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'run() — safe, auto-restoring, matches the main page\'s pattern',
      language: 'typescript',
      code: `const requestStore = new AsyncLocalStorage();

app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || randomUUID();
  // Context is scoped to THIS callback and its async descendants only.
  // Once it (and everything it spawns) finishes, the previous context
  // (undefined, in this case) is automatically restored.
  requestStore.run({ requestId }, () => {
    next();
  });
});

// Two overlapping requests never see each other's requestId — each
// run() call creates its own cleanly-scoped, non-leaking context.`,
    },
    {
      label: 'enterWith() — the documented leakage risk',
      language: 'typescript',
      code: `const requestStore = new AsyncLocalStorage();

app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || randomUUID();
  // enterWith() mutates the CURRENT context for the rest of this
  // synchronous execution — there is no callback scoping it, and no
  // automatic restoration afterward.
  requestStore.enterWith({ requestId });
  next();
});

// Per Node's own docs: "if the context is entered within an event
// handler, subsequent event handlers will also run within that
// context unless specifically bound to another context." Depending
// on the framework's internals, a LATER, unrelated event handler
// running in the same synchronous stretch could incorrectly see
// THIS request's requestId — a real, documented correctness risk
// run() does not have.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer refactors the main page\'s AsyncLocalStorage middleware from requestStore.run({ requestId }, () => { next(); }) to requestStore.enterWith({ requestId }); next(); — reasoning that it\'s simpler code with one less level of callback nesting. Using Node\'s own documented behavior for enterWith(), explain what risk this refactor introduces that the original run()-based version did not have.',
    hint: 'Does enterWith() scope the store to a specific callback the way run() does, or does it mutate the current context more broadly — and does Node\'s own documentation say anything about that context "continuing" into code that runs afterward?',
    solution: 'The refactor introduces a real context-leakage risk that the original run()-based version specifically avoided. run() scopes its store strictly to the callback passed to it (and whatever that callback asynchronously spawns) — once that scope ends, the previous context is automatically restored, guaranteeing no bleed into unrelated code. enterWith(), per Node\'s own documentation, instead "transitions" the current context "for the entire synchronous execution" going forward, with no automatic restoration — the documentation explicitly warns that if entered within an event handler, "subsequent event handlers will also run within that context unless specifically bound to another context." In an HTTP server, this means the requestId context set by enterWith() for one request could still be active when a later, logically-unrelated piece of code runs in that same synchronous stretch (depending on the framework\'s internal event-handling structure) — potentially attributing that other code\'s logs to the wrong request. This is precisely why Node\'s own documentation states run() should be preferred over enterWith() "unless there are strong reasons to use the latter" — the "one less level of callback nesting" the developer gained is a real, documented safety tradeoff, not a free simplification.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'AsyncLocalStorage.run() and AsyncLocalStorage.enterWith() are two equally-safe, interchangeable ways to set a context — the choice between them is purely a matter of code style and callback nesting preference.',
      reality: 'This subtopic\'s theory shows Node\'s own documentation explicitly recommends run() over enterWith() "unless there are strong reasons to use the latter," precisely because enterWith() carries a real, documented context-leakage risk that run() does not have.'
    },
    {
      thought: 'Since AsyncLocalStorage.enterWith() sets the store for "the current execution," that context automatically clears itself once the current function call (like the request handler) returns.',
      reality: 'This subtopic\'s theory and code example both show the opposite is documented — enterWith()\'s context continues for the entire ongoing synchronous execution, including subsequent, unrelated event handlers, with no automatic restoration of the previous context.'
    },
    {
      thought: 'The main page\'s own middleware code sample using requestStore.run({ requestId }, () => { next(); }) is just one stylistic way to write AsyncLocalStorage middleware — enterWith() would work exactly as safely with slightly different syntax.',
      reality: 'This subtopic\'s exercise shows this specific pattern (wrapping next() inside a run() callback) is not an arbitrary style choice — it is the safe, leak-proof approach specifically because run() auto-restores the previous context, a guarantee enterWith() does not provide.'
    }
  ];
}
