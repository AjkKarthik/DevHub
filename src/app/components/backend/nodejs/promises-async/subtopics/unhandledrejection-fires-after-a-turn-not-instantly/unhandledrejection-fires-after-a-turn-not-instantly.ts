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
  templateUrl: './unhandledrejection-fires-after-a-turn-not-instantly.html',
  styleUrl: './unhandledrejection-fires-after-a-turn-not-instantly.scss'
})
export class UnhandledrejectionFiresAfterATurnNotInstantlySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s mistake entry says to always add process.on("unhandledRejection", ...) — accurate advice, but it treats "unhandled" as an instant, permanent label on a rejected promise, when Node actually gives a rejection a grace period before deciding that',
      points: [
        'Per Node.js\'s own documentation, the unhandledRejection event "is emitted whenever a Promise is rejected and no error handler is attached to the promise within a turn of the event loop." This means Node does not declare a rejection "unhandled" the instant it rejects — it waits to see whether a .catch() (or the second argument to .then(), or a surrounding try/catch around an await) gets attached before that turn of the event loop finishes.',
        'This grace period matters in practice: a promise that rejects and gets its .catch() attached in the very same synchronous stretch of code (the overwhelmingly common case — const p = doSomething(); p.catch(handle);) never triggers unhandledRejection at all, because the handler was attached within that same turn.',
        'If a handler genuinely is attached LATER than that — in a subsequent turn of the event loop, after unhandledRejection has already fired for that promise — Node emits a SEPARATE, companion event: rejectionHandled. This tells your process.on("unhandledRejection", ...) logging code "that rejection I told you about earlier? It actually got handled after all, just later than expected."',
      ]
    },
    {
      heading: 'Why this two-event pairing exists, and what it means for your unhandledRejection handler',
      points: [
        'This pairing exists because Node genuinely cannot know in advance whether a rejection will EVER get a handler — the only way to detect "nobody is handling this" is to wait a bit and see. rejectionHandled exists specifically to correct the record when that wait-and-see guess turns out to have been premature.',
        'A production unhandledRejection handler that immediately calls process.exit(1) (as the main page\'s own recommended pattern does) will still exit even for a rejection that would have eventually been handled late — this is a deliberate, accepted tradeoff (fail fast and loud rather than risk silently running in a possibly-inconsistent state), not a bug, but it explains why a codebase attaching .catch() handlers asynchronously/late (rather than synchronously alongside the promise\'s creation) can trigger unexpected process crashes even though "the rejection technically did get handled" a moment later.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A late .catch() triggers BOTH events, in order',
      language: 'typescript',
      code: `process.on('unhandledRejection', (reason, promise) => {
  console.log('unhandledRejection fired:', reason.message);
});

process.on('rejectionHandled', (promise) => {
  console.log('rejectionHandled fired — a handler arrived late');
});

const p = Promise.reject(new Error('boom'));

// Handler attached in a LATER turn of the event loop (via setTimeout)
// — too late to prevent unhandledRejection from firing first.
setTimeout(() => {
  p.catch(err => console.log('finally handled:', err.message));
}, 10);

// Actual output order:
// 1. "unhandledRejection fired: boom"       (fires almost immediately —
//    no handler was attached within that first turn)
// 2. "rejectionHandled fired — a handler arrived late"  (fires once
//    the setTimeout's .catch() finally attaches, ~10ms later)
// 3. "finally handled: boom"`,
    },
    {
      label: 'Attaching synchronously avoids unhandledRejection entirely',
      language: 'typescript',
      code: `process.on('unhandledRejection', (reason) => {
  console.log('unhandledRejection fired:', reason.message);
});

// .catch() attached in the SAME turn as the rejection — this NEVER
// triggers unhandledRejection at all, because Node sees the handler
// before that turn of the event loop finishes.
const p = Promise.reject(new Error('boom'));
p.catch(err => console.log('handled immediately:', err.message));

// Output: only "handled immediately: boom" — unhandledRejection
// never fires for this promise.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A codebase has a global process.on("unhandledRejection", (err) => { logger.fatal(err); process.exit(1); }) handler, following the main page\'s own recommended pattern. A developer notices their app occasionally crashes even for promises that DO eventually get a .catch() attached — just inside a setTimeout a few milliseconds later, for retry-queueing purposes. Explain why the crash happens despite the rejection technically being handled.',
    hint: 'Does Node.js wait indefinitely to see if ANY handler ever gets attached to a rejected promise, or does it only wait for "a turn of the event loop" before deciding the rejection is unhandled?',
    solution: 'The crash happens because Node.js only waits for "a turn of the event loop" before deciding a promise rejection is unhandled — it does not wait indefinitely to see if a handler eventually shows up. Since this codebase\'s retry-queueing logic attaches its .catch() handler inside a setTimeout (a later turn of the event loop, not the same turn as the rejection), Node fires unhandledRejection FIRST, before that delayed .catch() ever gets a chance to attach. The global handler then immediately calls process.exit(1), crashing the process — and it does so before the setTimeout\'s callback (and its .catch()) ever gets to run, since the process has already exited by then. Node would have emitted a rejectionHandled event once that late .catch() attached, correcting the record — but that correction never gets a chance to fire, because process.exit(1) already terminated everything. The fix is to attach any error handling for a promise SYNCHRONOUSLY, in the same turn the promise is created, rather than deferring it to a later timer or macrotask — if retry-queueing logic genuinely needs to run later, it should be triggered FROM inside an immediately-attached .catch() handler, not attached itself via a delayed timer.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Node.js decides a promise rejection is "unhandled" the instant it rejects, if no .catch() was already chained onto it at that exact moment.',
      reality: 'This subtopic\'s theory shows Node actually waits for "a turn of the event loop" before making that determination — a .catch() attached synchronously, even microseconds after the rejection but within the same turn, prevents unhandledRejection from firing at all.'
    },
    {
      thought: 'Once Node.js has fired unhandledRejection for a promise, that promise is permanently marked as unhandled with no way to correct the record even if a handler shows up later.',
      reality: 'This subtopic\'s code example shows the opposite — Node emits a separate, companion rejectionHandled event specifically to signal that a previously-reported-as-unhandled rejection has since received a handler, correcting the earlier signal.'
    },
    {
      thought: 'Attaching a .catch() handler to a promise at any point in a function\'s execution — synchronously or via a later timer/callback — has the same effect on whether unhandledRejection fires for that promise.',
      reality: 'This subtopic\'s exercise shows timing matters specifically: a .catch() attached in a LATER turn of the event loop (e.g., inside a setTimeout) does not prevent unhandledRejection from firing first — only a handler attached within the SAME turn as the rejection avoids triggering it.'
    }
  ];
}
