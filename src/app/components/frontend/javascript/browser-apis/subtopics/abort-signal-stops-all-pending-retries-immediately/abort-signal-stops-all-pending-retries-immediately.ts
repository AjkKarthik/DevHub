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
  selector: 'app-abort-stops-retries-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './abort-signal-stops-all-pending-retries-immediately.html',
  styleUrl: './abort-signal-stops-all-pending-retries-immediately.scss',
})
export class AbortSignalStopsAllPendingRetriesImmediatelySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Own Challenge Requirement, Verified Live',
      points: [
        'The main page\'s "Resilient Fetch with Retry" challenge explicitly requires: "Respects an AbortController signal — aborts ALL retries immediately." This subtopic builds a simplified retry loop, starts it, calls <code>controller.abort()</code> partway through, and confirms via a counter that NO further retry attempts occur afterward — not "eventually stops," but stops at the very next check.',
        'A single <code>AbortController</code> instance\'s <code>signal</code> can be passed into MULTIPLE separate <code>fetch()</code> calls across a retry loop\'s several attempts — calling <code>.abort()</code> ONCE cancels whichever attempt is currently in flight AND prevents any future attempt in that same loop from ever starting, all from that one call.',
      ],
    },
    {
      heading: 'Why This Works — the Signal Is Checked, Not Just the In-Flight Request',
      points: [
        'An <code>AbortSignal</code> has a persistent <code>.aborted</code> boolean property that flips to <code>true</code> the instant <code>.abort()</code> is called, and stays <code>true</code> forever afterward — a well-written retry loop should check <code>signal.aborted</code> (or catch the resulting <code>AbortError</code>) before EVERY new attempt, not just rely on the in-flight <code>fetch()</code> call itself rejecting.',
        'The main page\'s own solution code demonstrates this exact pattern: <code>if (e.name === \'AbortError\') throw e;</code> immediately re-throws and exits the retry loop entirely, rather than treating an abort as just another failure worth retrying — an abort is a deliberate signal to STOP, not a transient error to recover from.',
        'This differs from simply catching an error from ONE fetch call — the point of threading the SAME signal through every retry attempt is that a single <code>abort()</code> call cancels the ENTIRE operation, including attempts that haven\'t started yet, without needing to track or cancel each attempt individually.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>AbortController stops all pending retries demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `let attemptCount = 0;

// Simulates a flaky fetch that always "fails" with a 500-like error,
// so the retry loop keeps trying -- until the signal is aborted.
function simulateFailingFetch(signal: AbortSignal): Promise<never> {
  return new Promise((_, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(() => {
      reject(new Error('simulated HTTP 500'));
    }, 100);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}

async function retryLoop(signal: AbortSignal, maxAttempts = 10) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    attemptCount++;
    console.log('attempt #' + attempt + ' starting (total attempts so far: ' + attemptCount + ')');
    try {
      await simulateFailingFetch(signal);
    } catch (e) {
      if ((e as Error).name === 'AbortError') {
        console.log('  -> AbortError caught -- stopping the retry loop immediately, no more attempts will start');
        throw e;
      }
      console.log('  -> attempt #' + attempt + ' failed (simulated 500), will retry...');
    }
  }
}

const controller = new AbortController();

console.log('--- Starting the retry loop ---');
const retryPromise = retryLoop(controller.signal).catch(e => {
  console.log('retryLoop() ultimately threw:', (e as Error).name);
});

console.log('--- Aborting after 250ms (partway through, before all 10 attempts could run) ---');
setTimeout(() => {
  console.log('calling controller.abort() NOW...');
  controller.abort();
}, 250);

await new Promise(r => setTimeout(r, 800));
await retryPromise;
console.log('--- Final total attemptCount:', attemptCount, '-- well under the maxAttempts of 10, proving the loop genuinely stopped ---');`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The retry loop allows up to 10 attempts, each 100ms apart, but <code>controller.abort()</code> is called after only 250ms. Roughly how many attempts actually run before the loop stops?',
    hint: 'Ask what happens to an attempt that is currently PENDING (waiting on its setTimeout) at the exact moment abort() is called, versus an attempt that hasn\'t started yet -- does the signal affect both the same way?',
    solution: `Only about 2-3 attempts run (roughly 250ms / 100ms per attempt)
before the loop stops for good -- nowhere near the maxAttempts of
10. The exact count can vary slightly by a few milliseconds of
timing, but it is always dramatically less than 10.

Here's the mechanism: simulateFailingFetch() registers an 'abort'
listener on the signal for whichever attempt is currently pending.
When controller.abort() fires, that listener immediately rejects
the CURRENTLY in-flight attempt with an AbortError -- this is the
in-flight cancellation half of the behavior.

But the retry loop ALSO checks e.name === 'AbortError' in its catch
block and re-throws immediately instead of continuing to the next
iteration -- this is what stops FUTURE attempts from ever starting,
not just the current one. Without that check, the loop might catch
the AbortError as "just another failure" and keep retrying anyway,
defeating the whole point of aborting.

The final attemptCount log confirms the loop genuinely stopped
early -- if abort() had no effect on future iterations, attemptCount
would climb all the way to 10 over roughly 1000ms. Instead it stops
at whatever attempt was in flight (or about to start) when abort()
fired, exactly matching the main page's challenge requirement that
aborting "cancels ALL retries immediately," not just the current
network request.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'calling controller.abort() only cancels the ONE fetch request that happens to be in flight at that exact moment — any future retry attempts in the same loop will still run normally afterward.',
      reality: 'a well-written retry loop checks for an AbortError (or signal.aborted) on every iteration and re-throws/exits immediately when it sees one — a single abort() call is meant to stop the ENTIRE retry operation, not just whatever request happened to be active.',
    },
    {
      thought: 'if a retry loop\'s catch block doesn\'t specifically distinguish an AbortError from an ordinary network error, aborting will still eventually stop the loop once the maxAttempts limit is reached, just with some wasted extra attempts.',
      reality: 'if AbortError isn\'t re-thrown/checked specially, the loop can actively keep RETRYING after an abort — since every subsequent attempt\'s fetch call will ALSO immediately reject with the same AbortError (the signal stays aborted forever), producing a fast, pointless loop through all remaining attempts instead of stopping early.',
    },
    {
      thought: 'a single AbortController can only be meaningfully used for ONE fetch call — for a retry loop with multiple attempts, you need a fresh AbortController for each individual attempt.',
      reality: 'the exact opposite is true — using the SAME AbortController (and its one .signal) across every attempt in a retry loop is what makes a single .abort() call able to cancel the whole operation at once; creating a new controller per attempt would defeat that, since aborting one wouldn\'t affect the others.',
    },
  ];
}
