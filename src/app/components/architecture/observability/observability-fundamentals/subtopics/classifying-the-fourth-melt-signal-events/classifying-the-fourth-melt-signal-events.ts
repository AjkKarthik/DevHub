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
    heading: 'A Fourth Signal Named in Prose, Never Classified in Code',
    points: [
      'The page’s own QnA on the MELT acronym describes Events as a signal type genuinely DISTINCT from logs: "discrete occurrences with rich attributes at a specific point in time... high cardinality — each event has unique identifiers... not aggregated in advance." The Challenge’s own <code>classifySignal()</code>, though, only ever recognizes three categories plus a fallback: <code>\'metric\' | \'log\' | \'trace\' | \'unknown\'</code> — an event with no <code>level</code> field (the thing that actually marks a record as a LOG in this page’s own scheme) falls straight through to <code>\'unknown\'</code>.',
      'The QnA’s own distinguishing detail is the key: a log entry in this page’s data model always carries a severity <code>level</code> (info, warn, error) — the codeTab’s own "The Three Signals" example shows exactly this shape. An event, by contrast, is a NAMED occurrence with structured attributes but genuinely has no severity concept at all — "order placed" isn’t more or less severe than "order cancelled," it just happened.',
      'This distinction matters practically, not just taxonomically: a log-aggregation pipeline built to expect every record to carry a <code>level</code> field (for filtering "show me only errors") would silently mis-handle a stream of business events that were never meant to carry severity in the first place.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Extending classifySignal for Events',
    language: 'typescript',
    code: `type SignalInput = Record<string, any>;

// The ORIGINAL Challenge solution, unmodified.
function classifySignal(signal: SignalInput): 'metric' | 'log' | 'trace' | 'unknown' {
  if (typeof signal.value === 'number' && typeof signal.labels === 'object') return 'metric';
  if (typeof signal.message === 'string' && typeof signal.level === 'string') return 'log';
  if (typeof signal.traceId === 'string' && typeof signal.spanId === 'string' && typeof signal.duration === 'number') return 'trace';
  return 'unknown';
}

// A genuine business event -- no 'level', no 'message', no metric/trace shape.
const orderPlacedEvent = {
  name: 'order.placed',
  attributes: { orderId: 'ord_42', amount: 99.5, currency: 'USD' },
  timestamp: 1705316400,
};

console.log(classifySignal(orderPlacedEvent)); // 'unknown' -- the original Challenge misses it

// Extended version -- adds the 4th MELT category. An event is a named,
// attributed occurrence WITHOUT a severity level (the field that marks a
// record as a log in this page's own data model).
type SignalType = 'metric' | 'log' | 'trace' | 'event' | 'unknown';

function classifySignalV2(signal: SignalInput): SignalType {
  if (typeof signal.value === 'number' && typeof signal.labels === 'object') return 'metric';
  if (typeof signal.message === 'string' && typeof signal.level === 'string') return 'log';
  if (typeof signal.traceId === 'string' && typeof signal.spanId === 'string' && typeof signal.duration === 'number') return 'trace';
  if (typeof signal.name === 'string' && typeof signal.attributes === 'object' && signal.level === undefined) return 'event';
  return 'unknown';
}

// Verified against all five cases (the original four, plus the event):
console.log(classifySignalV2({ value: 42, labels: { method: 'GET' } }));                  // 'metric'
console.log(classifySignalV2({ message: 'order placed', level: 'info' }));                // 'log'
console.log(classifySignalV2({ traceId: 'abc', spanId: 'def', duration: 45 }));           // 'trace'
console.log(classifySignalV2(orderPlacedEvent));                                          // 'event' -- FIXED
console.log(classifySignalV2({ foo: 'bar' }));                                            // 'unknown'`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A team decides to add an OPTIONAL severity field to their business events too, for consistency with their logging pipeline — <code>{ name: \'payment.declined\', attributes: {...}, level: \'warn\' }</code>. What does <code>classifySignalV2()</code> classify this as, and does that match the page’s own MELT description of what makes an event distinct from a log?',
  hint: 'Walk through the function’s checks IN ORDER — the log check runs BEFORE the event check, and it only requires <code>message</code> and <code>level</code> to both be strings, not that the record was originally intended as a log.',
  solution: `// The log check requires BOTH signal.message (string) AND signal.level
// (string). This event has 'level' but NOT 'message' -- so the log check
// still fails, and execution falls through to the event check, which
// passes (name + attributes + no level check... wait, the event check
// explicitly requires level === undefined, and this record HAS a level).
//
// classifySignalV2({ name: 'payment.declined', attributes: {...}, level: 'warn' })
//   -> 'unknown'
//
// Neither the log check (missing 'message') nor the event check (level is
// defined) matches -- this hybrid record falls through both categories.
//
// This is a real, honest limitation worth naming rather than hiding: the
// page's own MELT description treats "has a severity level" as the
// defining trait that separates a log from an event, but a real team
// might reasonably want an event that ALSO carries an optional severity
// hint without becoming "a log." classifySignalV2()'s binary level-based
// rule can't express that -- a more complete classifier would need an
// explicit 'kind' or 'signalType' field on the record itself rather than
// trying to INFER the type purely from which other fields happen to be
// present, the same structural inference-limits many of this hub's
// sibling subtopics run into elsewhere.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since the Challenge’s own description explicitly scopes classifySignal() to exactly three categories plus \'unknown\', the fact that it returns \'unknown\' for a genuine business event is expected, correct behavior — not a gap worth closing.',
    reality: 'The Challenge is correctly scoped for what it claims to do — but the SAME page’s own QnA describes a fourth, genuinely distinct signal category (Events, per MELT) that the Challenge never gets extended to cover, leaving a real gap between what the page TEACHES about signal types and what its own runnable code can actually classify.',
  },
  {
    thought: 'An "event" (per MELT) and a "log" are really the same underlying concept — just different names different tools use for the same kind of record.',
    reality: 'The page’s own QnA draws a specific, meaningful distinction: logs "may be structured (JSON) or unstructured (text)" and are typically emitted continuously as a side effect of request processing, while events are described as discrete, individually-significant occurrences with "high cardinality" identifying attributes — a business-meaningful happening (an order placed, a payment declined) rather than a diagnostic trace of code execution.',
  },
  {
    thought: 'A signal classifier that infers the type purely from which fields happen to be present will always correctly categorize any real-world record, given enough field checks.',
    reality: 'The Try It above demonstrates a genuine, honest limit to this approach: a record deliberately combining traits from two categories (an event WITH an optional severity level) falls through every check and lands on \'unknown\' — no amount of additional field-presence rules fully closes this gap without an explicit, authoritative type tag on the record itself.',
  },
];

@Component({
  selector: 'app-obs-fundamentals-melt-events',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './classifying-the-fourth-melt-signal-events.html',
  styleUrl: './classifying-the-fourth-melt-signal-events.scss',
})
export class ClassifyingTheFourthMeltSignalEventsSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
