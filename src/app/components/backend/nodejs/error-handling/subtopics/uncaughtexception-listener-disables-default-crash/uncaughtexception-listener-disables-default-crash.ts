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
  templateUrl: './uncaughtexception-listener-disables-default-crash.html',
  styleUrl: './uncaughtexception-listener-disables-default-crash.scss'
})
export class UncaughtexceptionListenerDisablesDefaultCrashSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s mistake entry warns against NOT calling process.exit() inside an uncaughtException handler — worth understanding exactly WHY that omission is so dangerous: registering a handler at all switches off Node\'s own built-in safety net',
      points: [
        'Without any uncaughtException listener registered, Node.js has a documented DEFAULT behavior for an uncaught exception: print the stack trace to stderr and exit the process with a non-zero code, automatically. This default is Node\'s own built-in crash-and-stop safety net.',
        'Node\'s own documentation states directly: "Adding a handler for the \'uncaughtException\' event overrides this default behavior." The instant your code calls process.on(\'uncaughtException\', ...) — for ANY reason, even just to add extra logging before crashing — Node stops doing this automatically. Your handler is now fully responsible for deciding what happens next.',
        'The consequence the main page\'s mistake entry is specifically warning against: if your handler logs the error but never calls process.exit() itself, Node.js will NOT exit on its own — the process keeps running, in the exact "undefined state" the main page\'s own explanation warns is dangerous. Registering the listener didn\'t make things safer by itself; it transferred responsibility for exiting onto your own code.',
      ]
    },
    {
      heading: 'Two additional precision details worth knowing',
      points: [
        'process is a regular EventEmitter, so uncaughtException follows ordinary EventEmitter semantics: multiple listeners can be registered (by your own code, and potentially by a third-party library like an error-monitoring SDK that auto-installs its own listener), and Node runs ALL of them, synchronously, in the order they were registered. If your application has, say, a Sentry SDK that installs its own uncaughtException listener alongside your own, both run — but neither one exiting is enough if the other doesn\'t also decide to exit; the process only stays alive if NEITHER listener calls process.exit().',
        'A subtler trap: if the uncaughtException handler ITSELF throws an exception, that new exception is NOT caught by the same handler (or any other uncaughtException handling) — Node exits with a non-zero code in that case. This means a buggy handler (e.g., one that assumes a specific error shape and throws a TypeError trying to read a property that doesn\'t exist) still ultimately results in a crash — just via a different path than the one your handler code intended.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A handler that logs but never exits — the process survives',
      language: 'typescript',
      code: `// WITHOUT this listener registered at all, Node's default behavior
// (print stack trace, exit with non-zero code) would apply
// automatically for any uncaught exception.

process.on('uncaughtException', (err) => {
  console.error('Something went wrong:', err);
  // MISSING: no process.exit() call here.
  //
  // Per Node's own docs, registering this listener at all already
  // overrode the default crash-and-exit behavior — since this
  // handler doesn't explicitly exit, the process now keeps running
  // in an undefined state, silently, with no automatic safety net
  // left to catch this omission.
});

throw new Error('This should have crashed the process');
// Actual result: the error is logged, and the process KEEPS RUNNING,
// continuing to serve requests in a state Node's own documentation
// explicitly says is unsafe to resume normal operation in.`,
    },
    {
      label: 'Multiple listeners — every one runs, but exiting is still opt-in',
      language: 'typescript',
      code: `// A third-party monitoring SDK (hypothetical) auto-installs its
// own uncaughtException listener when initialized:
sentrySdk.init(); // internally calls process.on('uncaughtException', ...)

// Your OWN listener, registered separately, does NOT override or
// replace the SDK's listener — process is a regular EventEmitter,
// so BOTH listeners run, synchronously, in registration order.
process.on('uncaughtException', (err) => {
  logger.fatal(err);
  process.exit(1); // your handler explicitly exits
});

// If your handler runs FIRST and calls process.exit(1), the SDK's
// listener registered AFTER yours never gets a chance to run at all
// — process.exit() terminates immediately, mid-way through firing
// the remaining listeners for this event.
//
// If registration order were reversed (SDK's handler first, and it
// does NOT call process.exit() by itself), YOUR handler still runs
// next and still needs to be the one that actually exits — no
// listener can assume "someone else's handler probably exits for us."`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer removes their app\'s process.on(\'uncaughtException\', ...) handler entirely, reasoning "we weren\'t doing anything useful in it besides logging, and logging happens elsewhere too." After this change, does an uncaught exception in production now crash the process, or does it behave the same as before (silently continuing)?',
    hint: 'What is Node.js\'s documented DEFAULT behavior for an uncaught exception when there is NO uncaughtException listener registered at all — does removing the listener restore that default, or does something else happen?',
    solution: 'Removing the listener entirely actually makes the process MORE likely to crash appropriately, not less — this is the opposite of what the developer might intuitively expect from "removing a safety mechanism." With no uncaughtException listener registered at all, Node.js\'s documented DEFAULT behavior applies automatically: print the stack trace to stderr and exit the process with a non-zero exit code. This default is Node\'s own built-in crash-and-stop safety net, and it was only ever suppressed because a listener was registered — registering a handler is what OVERRODE the default, not what enabled it. So removing a listener that "wasn\'t doing anything useful besides logging" (and, critically, was NOT calling process.exit() itself) actually restores the correct, safe default behavior of exiting on uncaught exceptions — assuming the earlier concern about lost log output (see the previous subtopic on process.exit() truncating unflushed writes) is handled by whatever separate logging mechanism the developer mentioned already exists elsewhere in the pipeline, independent of this specific handler.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Registering a process.on(\'uncaughtException\', ...) handler is purely additive — it lets your code observe and log uncaught exceptions without changing what Node.js does afterward.',
      reality: 'This subtopic\'s theory and first code example both show the opposite — Node\'s own documentation states registering this listener OVERRIDES the default crash-and-exit behavior entirely, meaning the process will keep running afterward unless your handler explicitly calls process.exit() itself.'
    },
    {
      thought: 'If a third-party library (like an error-monitoring SDK) also registers an uncaughtException listener, it effectively takes over responsibility for exiting the process on your behalf, so your own handler doesn\'t need to worry about it.',
      reality: 'This subtopic\'s second code example shows the opposite — EVERY registered listener runs, but the process only exits if AT LEAST ONE of them actually calls process.exit(); assuming another library\'s handler already handles exiting is a real risk if that assumption turns out to be wrong.'
    },
    {
      thought: 'Removing an uncaughtException handler that "wasn\'t doing anything useful" makes a Node.js application less safe, since it removes a layer of error handling.',
      reality: 'This subtopic\'s exercise shows the opposite can be true — if the handler being removed was NOT calling process.exit() itself, removing it actually restores Node\'s own safer DEFAULT behavior (automatic crash-and-exit), which was only ever suppressed by that handler\'s presence in the first place.'
    }
  ];
}
