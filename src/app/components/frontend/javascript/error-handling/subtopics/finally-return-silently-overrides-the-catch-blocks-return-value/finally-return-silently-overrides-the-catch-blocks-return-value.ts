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
  selector: 'app-finally-overrides-return-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './finally-return-silently-overrides-the-catch-blocks-return-value.html',
  styleUrl: './finally-return-silently-overrides-the-catch-blocks-return-value.scss',
})
export class FinallyReturnSilentlyOverridesTheCatchBlocksReturnValueSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Mistake #4, Verified With a Live Return Value',
      points: [
        'The main page\'s "Using finally with a return that overrides catch" mistake shows a single example — this subtopic runs BOTH the broken and fixed versions side by side and logs the actual returned value each one produces, so the override is directly observable rather than just described.',
        'A <code>return</code> statement inside <code>finally</code> does not just run alongside whatever <code>try</code> or <code>catch</code> already decided to return — it completely REPLACES that decision. The <code>try</code>/<code>catch</code> block\'s own <code>return</code> value is computed and then silently discarded the instant <code>finally</code> also returns something.',
      ],
    },
    {
      heading: 'Why finally Has This Unusual Override Power',
      points: [
        'By spec, <code>finally</code> always runs to completion before a function actually returns — if <code>finally</code> itself completes abruptly with its own <code>return</code> (or <code>throw</code>, or <code>break</code>/<code>continue</code>), that abrupt completion takes over and replaces whatever completion <code>try</code> or <code>catch</code> already produced.',
        'This applies not just to <code>return</code> — a <code>throw</code> inside <code>finally</code> just as silently REPLACES an error that was already being thrown from <code>catch</code>, swallowing the original error entirely with no trace of it in the new one.',
        'This is exactly why the main page\'s guidance is unconditional: use <code>finally</code> only for side-effect cleanup (closing connections, clearing timers) — never for a <code>return</code> or <code>throw</code> statement, since either one silently overrides whatever <code>try</code>/<code>catch</code> already decided.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>finally return overrides catch demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// BROKEN: finally has its own return statement.
function brokenVersion(): string {
  try {
    throw new Error('something failed');
  } catch (e) {
    return 'caught';   // this decision gets silently thrown away
  } finally {
    return 'finally';  // this OVERRIDES the catch's return, no warning
  }
}

// FIXED: finally only does cleanup, no return.
function fixedVersion(): string {
  let cleanupRan = false;
  try {
    throw new Error('something failed');
  } catch (e) {
    return 'caught';   // this decision survives
  } finally {
    cleanupRan = true;  // side effect only -- no return here
    console.log('  [cleanup] cleanupRan =', cleanupRan);
  }
}

console.log('brokenVersion() returned:', brokenVersion(), '<-- "caught" was silently discarded');
console.log('fixedVersion() returned:', fixedVersion(), '<-- correctly preserves the catch value');

// The same override also applies to a thrown error, not just a returned value.
function brokenThrowVersion(): string {
  try {
    throw new Error('original error');
  } catch (e) {
    throw new Error('re-thrown from catch: ' + (e as Error).message);
  } finally {
    throw new Error('finally error -- REPLACES the catch error above completely');
  }
}

try {
  brokenThrowVersion();
} catch (e) {
  console.log('Caller only ever sees:', (e as Error).message, '<-- the original and re-thrown errors are both gone without a trace');
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Both <code>brokenVersion()</code> and <code>fixedVersion()</code> throw the exact same error inside their <code>try</code> block and return <code>\'caught\'</code> from their <code>catch</code> block. Why do they return different values?',
    hint: 'Only one of the two functions has a return statement inside its finally block — think about what "finally always runs, and its own completion wins" actually means for a return value that already looked decided.',
    solution: `brokenVersion() returns "finally", not "caught" -- even though its
catch block clearly executed and decided to return 'caught'. The
reason: brokenVersion()'s finally block ALSO has a return statement
("finally"), and by spec, a return inside finally completely
REPLACES whatever try or catch already decided to return. The
'caught' value is computed, then silently thrown away the instant
finally's own return runs.

fixedVersion() correctly returns "caught" -- its finally block only
performs a side effect (setting cleanupRan and logging it), with NO
return statement of its own, so the catch block's decision survives
untouched.

The brokenThrowVersion() example shows this isn't limited to
returned values -- it applies to thrown errors too. The caller's
catch only ever sees "finally error", with zero trace that an
original error and a re-thrown error from catch both existed and
were silently discarded by finally's own throw.

The lesson: never put a return, throw, break, or continue inside a
finally block unless you specifically intend to override whatever
try or catch already decided -- finally exists for cleanup side
effects, not for control flow.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a return statement inside finally runs in addition to whatever try or catch already decided to return, with the final result being whichever one happens to execute last in some kind of combined way.',
      reality: 'a return inside <code>finally</code> doesn\'t combine with or run alongside try/catch\'s own return — it completely REPLACES it, silently discarding the try/catch value with absolutely no warning or trace.',
    },
    {
      thought: 'this override behavior is specific to return statements — a throw statement inside finally behaves differently, perhaps by combining with or wrapping an error that catch already threw.',
      reality: 'a <code>throw</code> inside <code>finally</code> behaves identically to a <code>return</code> — it completely replaces whatever error <code>catch</code> was in the middle of throwing, and the original error is gone with no trace in the new one, not even as a <code>.cause</code>.',
    },
    {
      thought: 'this override only matters in contrived examples — real-world finally blocks are almost always written correctly, so this is mostly a theoretical concern.',
      reality: 'this is easy to trigger by accident in real code — for example, a finally block that calls an async cleanup function written as <code>return cleanup()</code> instead of <code>await cleanup()</code>, or a finally block with an early-exit guard clause that happens to include a return, both silently swallow whatever try/catch had already decided.',
    },
  ];
}
