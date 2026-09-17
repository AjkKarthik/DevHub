import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-xpending-summary-vs-extended-form',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './xpending-summary-vs-extended-form.html',
  styleUrl: './xpending-summary-vs-extended-form.scss',
})
export class XpendingSummaryVsExtendedFormSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'The Challenge solution called the wrong form of XPENDING',
      points: [
        'The main page\'s own Stream Metrics Aggregator Challenge called <code>redis.xpending(streamKey, groupName, \'-\', \'+\', 1)</code> — passing start/end/count arguments — and its own hint claimed this "returns summary with pending count." Verified directly against Redis\'s own official XPENDING docs: passing start/end/count is the EXTENDED form, not the summary form, and it never returns a total pending count at all.',
        'The summary form is <code>XPENDING key group</code> with NO start/end/count arguments — it returns <code>[totalPendingCount, minId, maxId, consumers[]]</code>. The extended form <code>XPENDING key group start end count</code> returns one 4-tuple PER pending entry: <code>[id, consumer, idleMs, deliveryCount]</code>, up to <code>count</code> entries.',
        'The Challenge solution\'s own <code>pending[0]?.[3]</code> was reading the FIRST entry\'s DELIVERY COUNT (how many times that one specific message was redelivered) and treating it as if it were the group\'s total pending count — two completely unrelated numbers.',
      ],
    },
    {
      heading: 'Why this bug is dangerous, not just cosmetic',
      points: [
        'Verified via direct execution with a realistic scenario: a group with 50 genuinely pending entries, where the first entry (in ID order) happened to have been delivered 3 times, produced a reported <code>pendingCount</code> of 3 — a 94% undercount of the real backlog.',
        'A monitoring dashboard built on this buggy function would silently under-report a serious PEL backlog as looking nearly healthy, exactly the scenario the main page\'s own theory warns about elsewhere ("XPENDING shows the PEL... Use this to detect stuck consumers") — the bug defeats the very purpose the function exists for.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The bug, reproduced',
      language: 'typescript',
      code: `// Models Redis's own documented XPENDING reply shapes exactly:
// Summary form  (XPENDING key group)             -> [totalCount, minId, maxId, consumers[]]
// Extended form (XPENDING key group start end n)  -> [id, consumer, idleMs, deliveryCount][]
function fakeXpendingSummary(totalPending: number) {
  return [totalPending, '1526984818136-0', '1526984818200-0', [['consumer-123', String(totalPending)]]] as const;
}
function fakeXpendingExtended(entries: { id: string; consumer: string; idleMs: number; deliveryCount: number }[]) {
  return entries.map(e => [e.id, e.consumer, e.idleMs, e.deliveryCount]);
}

// Realistic scenario: 50 pending entries in the group's PEL, but the FIRST
// entry (in ID order) happened to have been delivered/redelivered 3 times.
const totalRealPendingCount = 50;
const extendedReply = fakeXpendingExtended([
  { id: '1700-0', consumer: 'consumer-1', idleMs: 12000, deliveryCount: 3 },
]); // count=1, so only ONE entry comes back -- exactly what the buggy Challenge code did

const buggyPendingCount = Array.isArray(extendedReply) ? extendedReply[0]?.[3] ?? 0 : 0;
console.log('Buggy pendingCount (misreads extended form):', buggyPendingCount);
console.log('Real total pending count in the PEL:', totalRealPendingCount);

const summaryReply = fakeXpendingSummary(totalRealPendingCount);
const correctPendingCount = summaryReply[0];
console.log('Correct pendingCount (summary form):', correctPendingCount);
// Buggy pendingCount (misreads extended form): 3
// Real total pending count in the PEL: 50
// Correct pendingCount (summary form): 50`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A different, previously-correct-looking piece of code calls <code>redis.xpending(streamKey, groupName)</code> — no start/end/count — and reads <code>result[3]</code> expecting a count. What does that index ACTUALLY contain in the summary form\'s reply shape, and is treating it as a number safe?',
    hint: 'Re-read the exact summary-form reply shape named in the theory above — what is at INDEX 3 specifically, and what TYPE of value is it?',
    solution: `Index 3 of the summary form's reply is the CONSUMERS array -- [[consumerName, count], ...], one pair per consumer that has at least one pending message -- not a number at all. Treating result[3] as a number would be a different, but equally real, bug: it's an array of consumer-name/count pairs, and using it directly where a number is expected would produce something like NaN or a type error, not silently the wrong number the way the original Challenge bug did.

The correct index for the TOTAL pending count in the summary form is index 0, exactly as demonstrated in this subtopic's own fix. This is worth internalizing precisely: for the SAME command (XPENDING), the SAME numeric index can mean something completely different depending on whether the summary or extended form was called -- index [3] is "consumers list" in one form and "delivery count of one entry" in the other, neither of which is "total pending count."`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Passing a small count like 1 to the extended form of XPENDING is basically the same as the summary form — you just get fewer detailed entries back."',
      reality: 'Verified above: they return COMPLETELY DIFFERENT reply shapes, not a smaller version of the same shape. The summary form never includes per-entry detail at all, and the extended form never includes a total count at all — passing count=1 to the extended form doesn\'t approximate the summary, it returns one single entry\'s own 4-tuple.',
    },
    {
      thought: '"A code review would obviously catch a bug this significant — mixing up two return shapes of the same command is too basic a mistake to survive into a published Challenge solution."',
      reality: 'This exact bug survived in the main page\'s own reference solution until this batch\'s verification pass caught it — a plausible-looking function signature (redis.xpending with several string arguments) reads correctly on casual review; only tracing the ACTUAL documented reply shape against what the code assumes about it, as demonstrated above, reveals the mismatch.',
    },
  ];

  topicLabel = 'Redis Streams';
  topicRoute = '/redis/streams';
  prev: SubtopicLink | null = null;
  next: SubtopicLink | null = {
    label: 'XCLAIM vs. XAUTOCLAIM: Manual IDs vs. Scan-Based Reassignment',
    route: '/redis/streams/xclaim-vs-xautoclaim-manual-vs-scan',
  };
}
