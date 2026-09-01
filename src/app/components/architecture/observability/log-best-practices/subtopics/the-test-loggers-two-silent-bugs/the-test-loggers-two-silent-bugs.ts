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
    heading: 'A Test Logger That Silently Drops Its Second Call',
    points: [
      'The main page’s own "Log Testing" codeTab exists to catch log-contract regressions before production — but its own <code>createTestLogger()</code> helper had a bug that would silently sabotage exactly that goal. Its <code>Writable</code> stream’s <code>write(chunk)</code> handler never calls the required <code>callback</code> parameter. Node’s Writable stream contract requires calling <code>callback()</code> to signal "ready for the next write" — without it, the stream stalls after the FIRST write, and any subsequent <code>logger.info()</code>/<code>logger.warn()</code> call within the same test silently never reaches <code>getLines()</code> at all.',
      'Verified against real pino: a test making two back-to-back logger calls (exactly the shape a real test verifying multiple log fields in one flow would naturally write) only ever captured the FIRST call’s output — the second call’s write was queued by Node internally and never processed, since the stream never signaled it was ready for more data.',
      'A second, independent bug in the same codeTab: its own assertions — <code>expect(orderLog![&#39;level&#39;]).toBe(&#39;info&#39;)</code> — expect a STRING. Verified against real pino output that its default <code>level</code> field is a NUMBER (<code>30</code> for info, <code>40</code> for warn), not a label string at all — the exact assertion this codeTab shows as the intended pattern would fail against real pino, every single time, with no configuration change.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Both Bugs, Reproduced and Fixed — Verified Against Real pino',
    language: 'typescript',
    code: `import pino from 'pino';
import { Writable } from 'stream';

// ── BROKEN: matches the main page's ORIGINAL createTestLogger() ──────
function createTestLoggerBroken() {
  const lines: Record<string, unknown>[] = [];
  const stream = new Writable({
    write(chunk) {
      lines.push(JSON.parse(chunk.toString()));
      // no callback() call -- stream stalls after the first write
    }
  });
  const logger = pino({ level: 'debug' }, stream);
  return { logger, getLines: () => lines };
}

const broken = createTestLoggerBroken();
broken.logger.info({ userId: 'u1' }, 'Order created');
broken.logger.warn({ orderId: 'o1' }, 'Payment declined');
console.log('broken: lines captured =', broken.getLines().length, '(expected 2)');
console.log('broken: level field type =', typeof broken.getLines()[0]?.['level'], '(expected string)');

// ── FIXED: call the callback, and configure level as a label string ──
function createTestLoggerFixed() {
  const lines: Record<string, unknown>[] = [];
  const stream = new Writable({
    write(chunk, encoding, callback) {
      lines.push(JSON.parse(chunk.toString()));
      callback(); // REQUIRED -- signals the stream is ready for the next write
    }
  });
  const logger = pino({
    level: 'debug',
    formatters: { level: (label) => ({ level: label }) }, // level as string, not number
  }, stream);
  return { logger, getLines: () => lines };
}

const fixed = createTestLoggerFixed();
fixed.logger.info({ userId: 'u1' }, 'Order created');
fixed.logger.warn({ orderId: 'o1' }, 'Payment declined');
console.log('fixed:  lines captured =', fixed.getLines().length, '(expected 2)');
console.log('fixed:  level field type =', typeof fixed.getLines()[0]?.['level'], '(expected string)');
console.log('fixed:  level value =', fixed.getLines()[0]?.['level']);
// -> broken: lines captured = 1 (expected 2)
// -> broken: level field type = number (expected string)
// -> fixed:  lines captured = 2 (expected 2)
// -> fixed:  level field type = string (expected string)
// -> fixed:  level value = info`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The main page’s own SECOND test, "logs payment decline at WARN not ERROR," only ever makes ONE logger call (<code>logger.warn(...)</code>). Would the missing-<code>callback()</code> bug actually cause THAT specific test to fail, given it only ever needed one captured line?',
  hint: 'The bug only breaks capturing the SECOND (and later) write within the same test instance — trace through what a single-call test actually needs from <code>getLines()</code>.',
  solution: `// No -- the second test, in isolation, would still pass even with the
// broken createTestLogger(), because it only ever makes ONE logger call
// per test instance. A single write() call still gets its callback...
// well, it still never CALLS callback(), but that only matters for
// whether a SUBSEQUENT write on the SAME stream gets processed -- the
// first write itself completes and pushes its line into the array
// synchronously, regardless of whether callback() is ever invoked
// afterward.
//
// This is exactly why the bug is dangerous rather than immediately
// obvious: the FIRST test in the page's own describe block (which only
// asserts against ONE captured line, even though the flow being tested
// might realistically log more than once) and the SECOND test (single
// call) both happen to pass. The bug only surfaces the moment a test
// needs to verify TWO OR MORE log lines emitted from the same
// createTestLogger() instance -- exactly the kind of test someone would
// naturally add later, when verifying a flow that logs at both start
// and completion, for example.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since the level-formatting bug makes <code>toBe(&#39;info&#39;)</code> fail loudly with a clear assertion error, it would be caught immediately the first time this test actually ran — it’s not really a "silent" bug.',
    reality: 'The ASSERTION failure itself is loud and immediate, yes — but that’s a different claim from the codeTab being trustworthy as WRITTEN. The main page presents this exact code as the correct pattern to copy into a real test suite; a reader copying it verbatim gets a test that fails on its very first run, for a reason (pino’s numeric level format) that has nothing to do with whether their OWN application code is actually logging correctly — a confusing false negative right out of the gate.',
  },
  {
    thought: 'The missing <code>callback()</code> bug and the numeric-level bug are related — fixing one would naturally surface or fix the other.',
    reality: 'They’re two entirely independent bugs, in different parts of the same function, with different causes and different fixes: one is a Node.js Writable-stream API-contract violation (a missing required parameter call), the other is a mismatch between pino’s own default output format and what the test assertions assume. Fixing the stream callback issue alone would let both test calls’ lines through, but the level assertion would still fail with a type mismatch — both fixes are independently required.',
  },
  {
    thought: 'The <code>formatters: { level: (label) =&gt; ({ level: label }) }</code> option changes pino’s behavior globally, including in production, so adding it just for tests risks changing what production log output looks like.',
    reality: '<code>createTestLogger()</code> constructs its own SEPARATE pino instance, entirely independent from whatever logger the application uses in production — the <code>formatters</code> option here only affects THIS specific test-only logger instance’s output. Nothing about fixing the test helper changes the format of logs a real, separately-configured production logger would emit.',
  },
];

@Component({
  selector: 'app-obs-log-best-practices-test-logger-bugs',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-test-loggers-two-silent-bugs.html',
  styleUrl: './the-test-loggers-two-silent-bugs.scss',
})
export class TheTestLoggersTwoSilentBugsSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
