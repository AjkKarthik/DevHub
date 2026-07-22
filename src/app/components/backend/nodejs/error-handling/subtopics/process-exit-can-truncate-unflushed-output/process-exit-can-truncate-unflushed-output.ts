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
  templateUrl: './process-exit-can-truncate-unflushed-output.html',
  styleUrl: './process-exit-can-truncate-unflushed-output.scss'
})
export class ProcessExitCanTruncateUnflushedOutputSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own global-handler code sample calls process.exit(1) directly inside uncaughtException and unhandledRejection handlers — worth knowing Node\'s own documentation carries a specific warning about exactly this pattern',
      points: [
        'Node.js\'s official process documentation states directly: calling process.exit() "will force the process to exit as quickly as possible even if there are still asynchronous operations pending that have not yet completed fully, including I/O operations to process.stdout and process.stderr."',
        'This matters concretely because writes to stdout/stderr are not always synchronous — Node\'s own docs note they "are sometimes asynchronous and may occur over multiple ticks of the Node.js event loop." A console.error(err) call immediately followed by process.exit(1) can, in some environments (piped output, certain platforms), have its output truncated or lost entirely — the process terminates before that write has actually finished flushing.',
        'Node\'s documentation explicitly recommends the safer alternative for exactly this scenario: "the code should set the process.exitCode and allow the process to exit naturally by avoiding scheduling any additional work for the event loop." Setting process.exitCode = 1 tells Node what exit code to use WHEN it eventually exits on its own — once the event loop naturally has nothing left to do — rather than forcing immediate termination.',
      ]
    },
    {
      heading: 'Why the main page\'s own pattern isn\'t simply "wrong," and when the tradeoff matters',
      points: [
        'The main page\'s global-handler code correctly calls shutdown() first — which does await db.end(), await redis.quit(), and only calls process.exit() AFTER those async cleanup steps resolve inside server.close()\'s callback. This specific structure reduces (though doesn\'t eliminate) the truncation risk for the cleanup work itself, since most of the async work has already been awaited before exit() runs.',
        'The remaining risk is narrower but real: the very console.error()/logger call made immediately BEFORE calling shutdown()/process.exit() is exactly the kind of write that can still be caught mid-flight, especially under load or when stdout is piped to another process (a log collector, for example) rather than a plain terminal. For a crash-logging call specifically — the most important write to NOT lose — preferring process.exitCode plus letting the process exit naturally (or explicitly awaiting a flush mechanism) is the safer, doc-recommended pattern.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The risky pattern: log then immediately exit()',
      language: 'typescript',
      code: `process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  // Per Node's own docs, this can terminate the process before the
  // console.error() write above has actually finished flushing to
  // stdout/stderr — especially when output is piped (e.g. to a log
  // collector) rather than a plain interactive terminal.
  process.exit(1);
});`,
    },
    {
      label: 'The doc-recommended pattern: exitCode + natural exit',
      language: 'typescript',
      code: `process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  // Setting exitCode tells Node what code to use WHEN it eventually
  // exits on its own — it does NOT force immediate termination, so
  // the event loop gets a chance to actually finish flushing the
  // console.error() write above before the process ends.
  process.exitCode = 1;

  // Avoid scheduling any NEW work — per Node's own recommendation,
  // this lets the process "exit naturally" once nothing is left to
  // do, rather than being forced to exit while I/O is still pending.
});

// If cleanup work (closing DB connections, etc.) is also needed,
// await it explicitly, THEN let natural exit happen — rather than
// calling process.exit() immediately after starting that cleanup:
async function shutdown() {
  try {
    await db.end();
    await redis.quit();
  } finally {
    process.exitCode = 1; // let the process drain and exit on its own
  }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s production logs occasionally show a crash with NO error message at all — just the process disappearing — even though their code clearly calls console.error(err) immediately before process.exit(1) in their uncaughtException handler, and they\'ve confirmed via local testing that the same code always prints the error fine on their own machine. What environmental difference between production and local testing would make this exact pattern more likely to lose the log line in production, and what is the doc-recommended fix?',
    hint: 'Node\'s own docs describe stdout/stderr writes as "sometimes asynchronous." Does whether a write is synchronous or asynchronous depend on the destination — a plain interactive terminal versus something like a pipe to a log collector process?',
    solution: 'A key detail behind this pattern\'s inconsistency is that whether stdout/stderr writes behave synchronously or asynchronously in Node.js depends on the destination the process is writing to — writes to a piped destination (very common in production, where stdout is typically piped to a log collector, a container runtime\'s logging driver, or redirected to a file via a process manager) are more likely to be asynchronous than writes to a plain interactive terminal (the common case during local development). This exactly matches the team\'s symptom: locally, in a terminal, the console.error() write is more likely to complete synchronously before process.exit(1) runs; in production, piped through a log collector, that same write is more likely to still be in flight when process.exit(1) forces immediate termination, truncating or entirely losing the log line — precisely the failure mode Node\'s own documentation warns about. The doc-recommended fix is to replace the direct process.exit(1) call with process.exitCode = 1 and let the process exit naturally once the event loop has nothing left to do, giving the console.error() write time to actually finish flushing regardless of whether the destination happens to be synchronous or asynchronous in a given environment.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Calling console.error(err) followed immediately by process.exit(1) reliably prints the error message before the process terminates, since the two calls happen in the same synchronous line of code.',
      reality: 'This subtopic\'s theory and exercise both show Node\'s own documentation warns the opposite — stdout/stderr writes "are sometimes asynchronous," so process.exit()\'s immediate termination can truncate or lose that write entirely, especially when output is piped rather than going to a plain interactive terminal.'
    },
    {
      thought: 'process.exitCode = 1 and process.exit(1) do essentially the same thing — setting the exit code — just with slightly different syntax.',
      reality: 'This subtopic\'s code example shows a real behavioral difference — process.exit() forces IMMEDIATE termination regardless of pending async work, while process.exitCode only sets what code to use WHEN the process eventually exits naturally, giving the event loop a chance to finish pending I/O first.'
    },
    {
      thought: 'The main page\'s own graceful-shutdown code sample (which calls process.exit() after awaiting db.end() and redis.quit() inside server.close()) has fully eliminated any risk of truncated output, since the cleanup work is properly awaited first.',
      reality: 'This subtopic\'s theory notes the remaining risk is narrower but real — the console.error()/logger call made immediately BEFORE that shutdown sequence starts is still exactly the kind of write that Node\'s own docs warn can be truncated by a subsequent process.exit() call.'
    }
  ];
}
