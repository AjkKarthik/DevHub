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
    heading: 'A Gauge That Only Ever Goes Up for Some Requests',
    points: [
      'The main page’s own "Node.js prom-client" codeTab describes its <code>metricsMiddleware</code> as instrumenting "every request" — but the original code only listened for the response’s <code>\'finish\'</code> event to decrement <code>activeConnections</code>. Confirmed via research into Node.js’s own HTTP response lifecycle: a client that disconnects or aborts a request mid-flight never fires <code>\'finish\'</code> at all — only <code>\'close\'</code> fires in that case.',
      'The practical consequence: every aborted request permanently leaves <code>activeConnections</code> one higher than it should be, forever. A service under any real-world load — flaky mobile clients, users navigating away, load balancer health-check timeouts — accumulates this drift continuously, until the gauge no longer reflects reality at all.',
      'The fix isn’t simply "also decrement on <code>\'close\'</code>", though — on modern Node.js, <code>\'close\'</code> ALSO fires after a normal, successfully-completed response (after <code>\'finish\'</code> has already run). A naive unconditional decrement on <code>\'close\'</code> would double-decrement every single normal request, immediately making the gauge go negative under regular traffic.',
      'This has now been fixed on the main page with a small idempotency guard: a boolean flag records whether <code>\'finish\'</code> already ran; the <code>\'close\'</code> handler only decrements if it hasn’t. This correctly handles both the normal-completion case (decrement once, via <code>\'finish\'</code>) and the aborted-request case (decrement once, via the <code>\'close\'</code> fallback), verified against both scenarios directly.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Reproducing the Leak, and the Fix',
    language: 'typescript',
    code: `import { EventEmitter } from 'events';

// A minimal stand-in for Express's response object, just enough to
// simulate the 'finish' and 'close' event sequence for both a normal
// completed request and an aborted one.
let activeConnections = 0;

// BUGGY -- matches the ORIGINAL codeTab exactly.
function attachBuggyMiddleware(res: EventEmitter) {
  activeConnections++;
  res.on('finish', () => { activeConnections--; });
}

// FIXED -- adds a 'close' fallback with an idempotency guard.
function attachFixedMiddleware(res: EventEmitter) {
  activeConnections++;
  let requestFinished = false;
  res.on('finish', () => { requestFinished = true; activeConnections--; });
  res.on('close', () => { if (!requestFinished) activeConnections--; });
}

console.log('--- BUGGY: aborted request ---');
activeConnections = 0;
const buggyRes = new EventEmitter();
attachBuggyMiddleware(buggyRes);
console.log('after increment:', activeConnections); // 1
buggyRes.emit('close'); // client disconnected -- 'finish' never fires
console.log('after close, finish never fired:', activeConnections);
// -> still 1: LEAKED, permanently stuck incremented

console.log('--- FIXED: aborted request ---');
activeConnections = 0;
const fixedRes1 = new EventEmitter();
attachFixedMiddleware(fixedRes1);
fixedRes1.emit('close'); // aborted -- only 'close' fires
console.log('after close, finish never fired:', activeConnections);
// -> 0: correctly decremented via the fallback

console.log('--- FIXED: normal completed request ---');
activeConnections = 0;
const fixedRes2 = new EventEmitter();
attachFixedMiddleware(fixedRes2);
fixedRes2.emit('finish');           // normal completion
fixedRes2.emit('close');            // 'close' ALSO fires after 'finish' on modern Node
console.log('after finish then close:', activeConnections);
// -> 0, NOT -1: the guard correctly prevents double-decrementing`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A THIRD scenario: the client sends the request, the server starts processing, but a proxy in front of the server (not the client itself) terminates the connection due to its own timeout — before the app’s response is fully written. Using the fixed middleware’s own logic, does <code>activeConnections</code> get correctly decremented in this case too?',
  hint: 'From the response object’s own perspective, does it matter WHO terminated the underlying connection (the client vs. an intermediate proxy) — which event does Node.js fire either way?',
  solution: `// From the response object's perspective, a connection terminating
// before 'finish' fires -- regardless of WHETHER the client, an
// intermediate proxy, a load balancer, or a network failure caused it --
// is exactly the scenario Node.js represents with the 'close' event
// firing without a preceding 'finish'. The fixed middleware's logic
// doesn't distinguish WHY the connection closed early, only WHETHER
// 'finish' already ran.
//
// So yes: a proxy-terminated connection is handled identically to a
// client-aborted one -- 'close' fires, 'finish' never did, the guard's
// requestFinished flag is still false, and activeConnections correctly
// decrements exactly once via the fallback.
//
// This is precisely why the fix is framed around the GENERAL question
// "did the response settle via 'finish' or not" rather than trying to
// special-case every possible cause of an early disconnect -- there
// are many different real-world causes (client abort, proxy timeout,
// network partition, server process signal), but they all reduce to
// the same two Node.js events, which the fix already handles correctly.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since the original codeTab’s comment says the middleware "instruments every request," it must have been handling every possible way a request can end, including client disconnects.',
    reality: 'The comment described the INTENT accurately but the implementation didn’t fully deliver on it — <code>res.on(\'finish\')</code> alone only covers requests that complete NORMALLY. This is a common, easy-to-miss gap: the code looks complete because it handles the common, "happy path" case correctly, and the failure only shows up under real-world conditions (flaky clients, timeouts) that a quick manual test rarely exercises.',
  },
  {
    thought: 'Fixing a gauge leak like this is just a matter of adding a decrement call to whatever OTHER event might also signal request completion.',
    reality: 'The codeTab’s own verified example shows why this is riskier than it sounds: naively decrementing on EVERY <code>\'close\'</code> event would have introduced a NEW bug (double-decrementing, sending the gauge negative) for the vastly more common normal-completion case, since <code>\'close\'</code> fires after <code>\'finish\'</code> too. The fix needed an explicit idempotency guard, not just an additional listener.',
  },
  {
    thought: 'A gauge that occasionally drifts by 1 due to a rare edge case like this isn’t a serious enough bug to be worth fixing — the numbers will still be roughly right.',
    reality: 'The drift is monotonic and cumulative — every single aborted request adds +1 that never comes back down, with no mechanism to self-correct. Under sustained real-world traffic (a mobile app with flaky connectivity, for instance), this isn’t a rare, bounded error; it’s a gauge that trends toward infinity over the service’s uptime, eventually becoming completely disconnected from the actual number of in-flight requests.',
  },
];

@Component({
  selector: 'app-obs-prometheus-active-connections-leak',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-activeconnections-gauge-leak-on-client-disconnect.html',
  styleUrl: './the-activeconnections-gauge-leak-on-client-disconnect.scss',
})
export class TheActiveconnectionsGaugeLeakOnClientDisconnectSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
