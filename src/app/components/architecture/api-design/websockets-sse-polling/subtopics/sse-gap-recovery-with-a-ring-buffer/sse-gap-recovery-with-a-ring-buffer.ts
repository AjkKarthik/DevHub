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
    heading: '"Store Recent Events in a Ring Buffer" — What That Actually Does',
    points: [
      'The main page’s own QnA on SSE reconnection describes gap recovery precisely: "store recent events in a ring buffer (e.g. last 60 seconds of events); on reconnection query events with ID greater than lastEventId and stream the missed events first." No codeTab on the page shows this event store actually implemented or queried.',
      'The main page’s own SSE codeTab already sends an <code>id:</code> field with every event and reads the browser’s auto-sent <code>Last-Event-ID</code> header on reconnect — this subtopic closes the gap between those two already-correct pieces by building the SERVER-SIDE store that makes the <code>id</code> field actually useful for resuming.',
      'A bounded buffer (fixed capacity, oldest events evicted first) is a deliberate trade-off: it bounds memory usage regardless of how long a client stays disconnected, at the cost of the store eventually losing events an EXTREMELY stale reconnection would need. The QnA’s own phrase "at-least-once delivery semantics" (not "guaranteed" delivery) already signals this limitation.',
      'A correct implementation has to distinguish two genuinely different outcomes on reconnect: "here are exactly the events you missed" (the client’s <code>Last-Event-ID</code> is still within the retained window) versus "some events you missed are gone forever" (the client was disconnected longer than the buffer’s retention window) — silently treating the second case as the first would make a client believe it caught up when it actually has a real, undetected gap in its data.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Ring Buffer with Gap Detection',
    language: 'typescript',
    code: `interface StoredEvent {
  id: number;
  payload: unknown;
}

class RingBufferEventStore {
  private events: StoredEvent[] = []; // ordered oldest -> newest
  private nextId = 1;

  constructor(private capacity: number) {}

  append(payload: unknown): StoredEvent {
    const event: StoredEvent = { id: this.nextId++, payload };
    this.events.push(event);
    if (this.events.length > this.capacity) {
      this.events.shift(); // evict the oldest retained event
    }
    return event;
  }

  // Returns everything strictly after lastEventId -- and flags "gap"
  // when the client's lastEventId is OLDER than anything still retained,
  // meaning some events in between are genuinely, permanently lost.
  eventsSince(lastEventId: number): { events: StoredEvent[]; gap: boolean } {
    if (this.events.length === 0) return { events: [], gap: false };

    const oldestRetainedId = this.events[0].id;
    if (lastEventId < oldestRetainedId - 1) {
      return { events: [...this.events], gap: true };
    }
    return { events: this.events.filter(e => e.id > lastEventId), gap: false };
  }
}

const store = new RingBufferEventStore(3); // keep only the last 3 events

store.append('e1');
store.append('e2');
store.append('e3');
store.append('e4'); // evicts e1
store.append('e5'); // evicts e2

console.log('reconnect at id=3 (within window):', store.eventsSince(3));
// { events: [ {id:4,...}, {id:5,...} ], gap: false } -- exactly the two missed events

console.log('reconnect at id=1 (outside window):', store.eventsSince(1));
// { events: [ {id:3,...}, {id:4,...}, {id:5,...} ], gap: true }
// -- e2 is genuinely gone; the client needs to know its data has a real gap

console.log('reconnect at id=5 (fully caught up):', store.eventsSince(5));
// { events: [], gap: false }`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'When <code>eventsSince()</code> returns <code>{ gap: true }</code>, the codeTab’s own SSE handler on the server would presumably still stream whatever events it DOES have (the ones inside <code>events</code>) to the reconnecting client. What should the server-side SSE handler ALSO do differently in this case, beyond just streaming those events, so the client actually knows a real gap occurred rather than silently believing it’s fully caught up?',
  hint: 'The main page’s own theory bullet on SSE already names one mechanism for the server to communicate structured, distinguishable information to the client beyond just raw <code>data:</code> payloads — what field, already shown in the page’s own SSE codeTab, could carry a distinct signal for this case?',
  solution: `// The server should send a distinctly-NAMED event (using SSE's own
// "event: <name>" field, which the main page's own SSE codeTab already
// demonstrates for regular events like "notification" and
// "orderUpdate") specifically signaling that a gap occurred -- for
// example:
//
//   res.write('event: gap-detected\\n');
//   res.write('data: {"message":"Some events were missed and cannot be recovered"}\\n\\n');
//
// followed by the events it DOES still have.

// This matters because a client-side listener registered only for the
// normal named events (via addEventListener('notification', ...)) would
// simply never fire for a plain, unlabeled "data:" message announcing
// the gap if the server didn't use a distinctly-named event -- the
// client-side code needs its OWN explicit
// source.addEventListener('gap-detected', ...) handler to actually
// surface this to the user (e.g. "refresh to see the latest data"),
// rather than the client silently assuming the stream it resumed
// receiving is a complete, gap-free continuation of what it had before.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A ring buffer sized to hold, say, "the last 60 seconds of events" guarantees a reconnecting client can always fully recover from any disconnection.',
    reality: 'The codeTab’s own second example (<code>reconnect at id=1</code>) demonstrates the opposite directly — the buffer explicitly evicts the oldest event once its capacity is exceeded, and a client whose <code>Last-Event-ID</code> predates everything still retained gets back a <code>gap: true</code> flag, not a complete recovery. The QnA’s own phrasing, "at-least-once delivery semantics," already signals this is a bounded best-effort mechanism, not an unconditional guarantee.',
  },
  {
    thought: 'The server needs to track, per CLIENT, which events that specific client has already received.',
    reality: 'The codeTab’s <code>RingBufferEventStore</code> tracks events GLOBALLY, with no per-client state at all — any client reconnecting with any <code>lastEventId</code> gets served from the SAME shared buffer. The client-provided <code>Last-Event-ID</code> header (sent automatically by the browser’s EventSource on reconnect) is what lets a single shared store correctly serve many different clients, each potentially resuming from a different point.',
  },
  {
    thought: 'Detecting a gap (<code>gap: true</code>) is purely an internal server-side concern with no need to communicate it to the client at all.',
    reality: 'The Try It above demonstrates the opposite is the more correct design — without an explicit, distinctly-named signal reaching the client, a reconnecting client has no way to distinguish "I received every event I ever missed" from "some events are permanently gone and I silently have incomplete data," which for many real applications (e.g. a running total, an audit log) is a meaningfully dangerous state to be in unknowingly.',
  },
];

@Component({
  selector: 'app-api-realtime-sse-gap-recovery',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './sse-gap-recovery-with-a-ring-buffer.html',
  styleUrl: './sse-gap-recovery-with-a-ring-buffer.scss',
})
export class SseGapRecoveryWithARingBufferSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
