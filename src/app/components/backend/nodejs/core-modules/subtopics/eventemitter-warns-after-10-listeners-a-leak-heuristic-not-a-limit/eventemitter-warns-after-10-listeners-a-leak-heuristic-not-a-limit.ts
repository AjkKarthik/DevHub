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
  templateUrl: './eventemitter-warns-after-10-listeners-a-leak-heuristic-not-a-limit.html',
  styleUrl: './eventemitter-warns-after-10-listeners-a-leak-heuristic-not-a-limit.scss'
})
export class EventemitterWarnsAfter10ListenersALeakHeuristicNotALimitSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page already warns "forgotten listeners are a common source of memory leaks" — Node.js has a built-in early-warning mechanism for exactly this, not covered on the main page at all',
      points: [
        'Every EventEmitter instance has a default maximum of 10 listeners per individual event name. Adding an 11th listener for the SAME event on the SAME instance triggers a MaxListenersExceededWarning, printed to stderr via process.emitWarning — but critically, this is only a WARNING, not an error or a functional restriction.',
        'The 11th (and 12th, 13th, ...) listener is still registered normally and still fires normally when the event is emitted — nothing is rejected, blocked, or silently dropped. The warning exists purely as a heuristic signal that "an unusually large number of listeners have accumulated on this event," which is often (though not always) a sign that listeners are being added repeatedly without ever being removed.',
      ]
    },
    {
      heading: 'Why 10 is a heuristic default, not a real architectural limit — and when raising it is the correct fix, not a workaround',
      points: [
        'Node\'s own documentation is explicit that 10 is not a meaningful limit for every use case — a legitimately large fan-out (many independent subsystems all listening to one shared event bus, for instance) can validly need more than 10 listeners with zero leak involved. The fix in that case is emitter.setMaxListeners(n) on that specific instance, or EventEmitter.defaultMaxListeners = n globally (setting it to 0 or Infinity disables the check entirely).',
        'The distinction that actually matters: raising the limit is correct when listener COUNT is intentional and stable (a known, fixed set of subsystems); it is the WRONG fix when listeners are being added inside a loop, inside a repeatedly-invoked function, or on every incoming request without ever being removed — in that case, the warning is correctly flagging a genuine, unbounded leak, and raising the limit just delays the point at which the real problem (unbounded memory growth) becomes visible.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The warning — 10 listeners is a signal, not a hard stop',
      language: 'typescript',
      code: `import { EventEmitter } from 'node:events';

const bus = new EventEmitter();

for (let i = 0; i < 12; i++) {
  bus.on('tick', () => {}); // adding the 11th listener triggers:
}
// (node:12345) MaxListenersExceededWarning: Possible EventEmitter
// memory leak detected. 11 tick listeners added to [EventEmitter].
// Use emitter.setMaxListeners() to increase limit

// The warning printed — but ALL 12 listeners are registered and
// will ALL fire normally on the next bus.emit('tick'). Nothing
// was blocked, dropped, or rejected.`,
    },
    {
      label: 'Two different fixes for two different root causes',
      language: 'typescript',
      code: `import { EventEmitter } from 'node:events';

// CASE 1: Legitimate, intentional fan-out — raise the limit
const metricsHub = new EventEmitter();
metricsHub.setMaxListeners(50); // 50 independent subsystems
                                  // genuinely all listen here —
                                  // this is correct, not a leak.

// CASE 2: A real leak — listeners added per-request, never removed
function handleRequest(req, sharedEmitter) {
  // BUG: a NEW listener is added on every single request, and
  // never cleaned up — this is exactly what the warning is meant
  // to catch. Raising the limit here just hides a genuine leak.
  sharedEmitter.on('data', () => processRequest(req));
}

// CORRECT fix for case 2: remove the listener when done, or use
// once() if it should only ever fire a single time.
function handleRequestFixed(req, sharedEmitter) {
  const listener = () => processRequest(req);
  sharedEmitter.once('data', listener); // auto-removed after firing
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer sees MaxListenersExceededWarning in their production logs for a shared "cache:invalidate" EventEmitter. Their first instinct is to add cacheEmitter.setMaxListeners(100) to make the warning go away. Before doing that, what should they check, and why might raising the limit be exactly the wrong fix depending on the answer?',
    hint: 'Does the warning tell you WHY there are more than 10 listeners — whether it\'s a fixed, intentional set of subsystems, or an unbounded number being added repeatedly without cleanup? Does raising the limit change whether listeners are actually being cleaned up?',
    solution: 'Before raising the limit, the developer should determine WHY there are more than 10 listeners: is it a fixed, known, intentional set of subsystems that all need to react to cache invalidation (in which case raising the limit is the correct, permanent fix) — or are listeners being added repeatedly in a loop, inside a function called on every request, or somewhere else without a matching removal (in which case raising the limit does NOT fix anything, it just raises the threshold at which the SAME underlying leak becomes visible again, now with more memory already wasted before the next warning fires). The warning itself cannot distinguish between these two cases — it only counts listeners, with no awareness of whether that count is stable/intentional or unboundedly growing. Silently raising setMaxListeners() without first checking which scenario applies risks masking a genuine memory leak rather than fixing it, since the underlying accumulation (if it exists) continues unchanged, just past a higher, less visible threshold.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'MaxListenersExceededWarning means the 11th and later listeners were rejected or silently ignored — only the first 10 registered listeners actually fire.',
      reality: 'This subtopic\'s theory clarifies EVERY listener still gets registered and fires normally, including the 11th and beyond — the warning is purely informational, printed to stderr, with zero effect on which listeners actually run.'
    },
    {
      thought: 'The correct response to seeing MaxListenersExceededWarning in production logs is always to call setMaxListeners() with a higher number to silence it.',
      reality: 'This subtopic\'s exercise shows this is only correct when the listener count is genuinely intentional and stable — if listeners are actually being added without ever being removed, raising the limit hides a real leak rather than fixing it.'
    },
    {
      thought: 'A default limit of exactly 10 listeners must reflect some genuine technical constraint or performance concern in EventEmitter\'s internal implementation.',
      reality: 'This subtopic\'s theory shows 10 is purely an arbitrary, documented heuristic default chosen as a reasonable trigger point for leak detection — Node\'s own docs explicitly state "not all events should be limited to just 10 listeners," confirming there is no hard technical reason behind that specific number.'
    }
  ];
}
