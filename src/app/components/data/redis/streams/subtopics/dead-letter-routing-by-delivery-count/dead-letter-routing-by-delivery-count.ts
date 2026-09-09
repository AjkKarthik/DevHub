import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dead-letter-routing-by-delivery-count',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './dead-letter-routing-by-delivery-count.html',
  styleUrl: './dead-letter-routing-by-delivery-count.scss',
})
export class DeadLetterRoutingByDeliveryCountSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'What happens to a message that keeps failing, forever?',
      points: [
        'The main page\'s own "Not acknowledging messages on processing failure" mistake block correctly says failed messages should be "left in PEL; XAUTOCLAIM will re-deliver after idle timeout" — but neither that mistake block nor any codeTab addresses what happens when a message fails EVERY time it\'s redelivered, forever, endlessly cycling through claim → fail → re-claim.',
        'The DELIVERY COUNT field — the exact field the sibling XPENDING subtopic traced a real bug around — is precisely the signal needed to detect this: it increments every time XCLAIM or XAUTOCLAIM reassigns an entry, so a message with an unusually high delivery count has been retried repeatedly without ever succeeding.',
      ],
    },
    {
      heading: 'The dead-letter pattern',
      points: [
        'Rather than reclaiming a message forever, a recovery worker checks each reclaimed entry\'s delivery count against a threshold. Below the threshold: retry normally. At or above it: move the entry to a SEPARATE "dead letter" stream (via XADD) and XACK the original, removing it permanently from the main group\'s PEL.',
        'This keeps a small number of permanently-broken messages from silently occupying the recovery worker\'s attention forever, while preserving them (in the dead-letter stream) for manual inspection rather than discarding them outright.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Dead-letter routing, verified',
      language: 'typescript',
      code: `// Models routing a reclaimed entry to a dead-letter stream once its
// delivery count exceeds a threshold, using the exact field this hub's
// own sibling subtopic traced a real bug around.
const MAX_DELIVERY_ATTEMPTS = 3;

interface ReclaimResult { retried: string[]; deadLettered: string[] }

class DeadLetterRouter {
  deadLetterEntries: { id: string; reason: string }[] = [];

  processReclaimed(entries: [string, string, number, number][]): ReclaimResult {
    const results: ReclaimResult = { retried: [], deadLettered: [] };
    for (const [id, , , deliveryCount] of entries) {
      if (deliveryCount > MAX_DELIVERY_ATTEMPTS) {
        this.deadLetterEntries.push({ id, reason: \`exceeded \${MAX_DELIVERY_ATTEMPTS} delivery attempts (\${deliveryCount})\` });
        results.deadLettered.push(id);
      } else {
        results.retried.push(id);
      }
    }
    return results;
  }
}

const router = new DeadLetterRouter();
const reclaimedEntries: [string, string, number, number][] = [
  ['1700-0', 'worker-1', 45000, 1], // first failure, retry normally
  ['1700-1', 'worker-1', 90000, 4], // failed 4 times already -- exceeds threshold
  ['1701-0', 'worker-2', 30000, 2], // second failure, still under threshold
];

const result = router.processReclaimed(reclaimedEntries);
console.log('Retried normally:', result.retried);
console.log('Routed to dead-letter stream:', result.deadLettered);
console.log('Dead-letter stream contents:', router.deadLetterEntries);
// Retried normally: [ '1700-0', '1701-0' ]
// Routed to dead-letter stream: [ '1700-1' ]
// Dead-letter stream contents: [ { id: '1700-1', reason: 'exceeded 3 delivery attempts (4)' } ]`,
    },
    {
      label: 'Real dead-letter routing with XAUTOCLAIM',
      language: 'typescript',
      code: `import Redis from 'ioredis';
const redis = new Redis();

const MAX_DELIVERY_ATTEMPTS = 3;

async function reclaimWithDeadLetterRouting(streamKey: string, group: string, consumer: string) {
  const [, claimed] = await redis.xautoclaim(
    streamKey, group, consumer, '30000', '0-0', 'COUNT', '50',
  ) as [string, [string, string[]][]];

  for (const [id] of claimed) {
    // Extended XPENDING for this ONE id gives us its current delivery count.
    const [[, , , deliveryCount]] = await redis.xpending(
      streamKey, group, id, id, 1,
    ) as [string, string, number, number][];

    if (deliveryCount > MAX_DELIVERY_ATTEMPTS) {
      const original = await redis.xrange(streamKey, id, id);
      await redis.xadd(\`\${streamKey}:dead-letter\`, '*', 'originalId', id, 'entry', JSON.stringify(original));
      await redis.xack(streamKey, group, id); // permanently remove from the main PEL
    }
    // else: leave unacknowledged -- a future XAUTOCLAIM sweep will retry it normally
  }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team sets <code>MAX_DELIVERY_ATTEMPTS</code> to 1 instead of a higher number like 3, reasoning "if it fails even once, something is clearly wrong with it." What real risk does this introduce for a message that failed due to a genuinely TRANSIENT problem (a brief downstream outage, a momentary network blip)?',
    hint: 'Re-read what dead-lettering actually does to a message once it\'s routed there — does it still get processed by the normal worker loop afterward?',
    solution: `Setting the threshold to 1 dead-letters a message on its VERY FIRST failure, with zero tolerance for a genuinely transient problem that would have succeeded on a normal retry. Since dead-lettering XACKs the original entry (permanently removing it from the main group's PEL), a message dead-lettered this aggressively is now OUT of the normal processing pipeline entirely -- it will never be retried automatically again, even though the underlying downstream service might have recovered moments later.

A threshold of 1 effectively turns "at-least-once delivery with automatic retry" into "at-most-one-retry, then manual intervention required" for every single transient failure, not just genuinely broken messages. The threshold needs to be high enough to absorb ordinary transient failures (a value like 3-5, tuned to how flaky the actual downstream dependency is) while still catching messages that are GENUINELY stuck rather than just unlucky once.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Dead-lettering a message discards it — the data is gone once it\'s routed there."',
      reality: 'Verified above: the dead-letter pattern explicitly PRESERVES the original entry (via XADD into a separate stream) before XACKing the original — it is a deliberate quarantine for manual inspection, not a deletion. The data remains fully available in the dead-letter stream.',
    },
    {
      thought: '"The delivery count field this pattern relies on is something you have to track yourself in application code."',
      reality: 'It is maintained automatically by Redis itself as part of the PEL\'s own per-entry metadata — verified via the extended XPENDING form\'s own documented reply shape, which is exactly what the sibling XPENDING subtopic traced. No separate application-level counter is needed.',
    },
  ];

  topicLabel = 'Redis Streams';
  topicRoute = '/redis/streams';
  prev: SubtopicLink | null = {
    label: 'XCLAIM vs. XAUTOCLAIM: Manual IDs vs. Scan-Based Reassignment',
    route: '/redis/streams/xclaim-vs-xautoclaim-manual-vs-scan',
  };
  next: SubtopicLink | null = null;
}
