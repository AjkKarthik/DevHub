import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-xclaim-vs-xautoclaim-manual-vs-scan',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './xclaim-vs-xautoclaim-manual-vs-scan.html',
  styleUrl: './xclaim-vs-xautoclaim-manual-vs-scan.scss',
})
export class XclaimVsXautoclaimManualVsScanSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'Two commands named together, only one ever shown in code',
      points: [
        'The main page\'s own quickRef and theory both name XCLAIM alongside XAUTOCLAIM ("XCLAIM / XAUTOCLAIM re-assigns idle pending entries") — but every codeTab on the page only ever calls XAUTOCLAIM. Classic XCLAIM never appears in any working example.',
        'Verified via research: XCLAIM requires manually specifying the EXACT entry IDs to claim — you must already know which messages are stuck. XAUTOCLAIM (Redis 6.2+) combines "scan the PEL for idle entries" and "reassign them" into one atomic, cursor-based call, closer to how SCAN works for the keyspace.',
        'This is exactly the legitimate use case for XPENDING\'s EXTENDED form (the one this hub\'s own sibling subtopic just fixed a bug around) — find specific stuck IDs via a targeted <code>XPENDING key group IDLE ms start end count</code> query, then hand those exact IDs to XCLAIM.',
      ],
    },
    {
      heading: 'When manual XCLAIM is still the right tool, despite XAUTOCLAIM being the modern default',
      points: [
        'XAUTOCLAIM is the right default for a generic "recovery worker" loop that periodically sweeps the whole PEL for anything idle beyond a threshold — it needs no prior knowledge of specific message IDs.',
        'Manual XCLAIM is still the right tool when you already have specific IDs from SOME OTHER source — for example, a monitoring alert that names a specific stuck entry ID, or a targeted re-processing of one particular failed message a support ticket references — reaching for a full PEL scan (XAUTOCLAIM) would be needless extra work when you already know exactly what you want to claim.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Targeted XPENDING, then manual XCLAIM',
      language: 'typescript',
      code: `// Models the legitimate use of XPENDING's EXTENDED form: find specific stuck
// entry IDs, then manually XCLAIM exactly those IDs -- the workflow XCLAIM
// is actually designed for.
interface PelEntry { id: string; consumer: string; idleMs: number; deliveryCount: number }

class FakeStreamPEL {
  private pel: PelEntry[] = [
    { id: '1700-0', consumer: 'worker-1', idleMs: 45000, deliveryCount: 1 },
    { id: '1700-1', consumer: 'worker-1', idleMs: 12000, deliveryCount: 1 },
    { id: '1701-0', consumer: 'worker-2', idleMs: 60000, deliveryCount: 2 },
  ];

  xpendingExtended(minIdleMs: number): [string, string, number, number][] {
    return this.pel
      .filter(e => e.idleMs >= minIdleMs)
      .map(e => [e.id, e.consumer, e.idleMs, e.deliveryCount]);
  }

  xclaim(ids: string[], newConsumer: string): string[] {
    const claimed: string[] = [];
    for (const entry of this.pel) {
      if (ids.includes(entry.id)) {
        entry.consumer = newConsumer;
        entry.deliveryCount++;
        claimed.push(entry.id);
      }
    }
    return claimed;
  }
}

const stream = new FakeStreamPEL();

// Step 1: find specific stuck entries idle > 30s -- the extended XPENDING form's real use case.
const stuck = stream.xpendingExtended(30000);
console.log('Stuck entries (idle > 30s):', stuck.map(e => e[0]));

// Step 2: manually claim EXACTLY those IDs -- this is what XCLAIM requires.
const idsToClaim = stuck.map(e => e[0]);
const claimed = stream.xclaim(idsToClaim, 'recovery-worker');
console.log('Claimed by recovery-worker:', claimed);
// Stuck entries (idle > 30s): [ '1700-0', '1701-0' ]
// Claimed by recovery-worker: [ '1700-0', '1701-0' ]`,
    },
    {
      label: 'Real XCLAIM against a specific alert',
      language: 'typescript',
      code: `import Redis from 'ioredis';
const redis = new Redis();

// A monitoring alert names one specific stuck entry ID directly -- reaching
// for a full XAUTOCLAIM sweep here would scan the whole PEL unnecessarily
// when we already know exactly which entry needs reassigning.
async function reclaimSpecificEntry(streamKey: string, group: string, entryId: string, newConsumer: string) {
  const claimed = await redis.xclaim(
    streamKey, group, newConsumer,
    '0', // min-idle-ms: 0 forces the claim regardless of current idle time
    entryId,
  );
  return claimed;
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team builds a generic recovery worker that runs every 60 seconds, reclaiming any entry idle longer than 30 seconds, with no prior knowledge of which specific entries might be stuck. Should this worker use XCLAIM or XAUTOCLAIM?',
    hint: 'Does the worker know specific entry IDs in advance, or does it need to discover them by scanning the whole PEL each run?',
    solution: `XAUTOCLAIM. A generic, periodic recovery sweep with no prior knowledge of specific stuck IDs is exactly the scan-based use case XAUTOCLAIM exists for -- it combines "find entries idle beyond a threshold" and "reassign them" in one atomic call, using cursor-based iteration so a very large PEL can be swept across multiple calls without holding the server for one enormous operation.

Using XCLAIM here would require a SEPARATE XPENDING call first to discover the stuck IDs, then XCLAIM to claim them -- functionally similar, but two round trips instead of one, and losing XAUTOCLAIM's built-in cursor mechanism for safely sweeping a large PEL in bounded chunks. XCLAIM remains the better choice only when the caller ALREADY has specific IDs from some other source (an alert, a support ticket) and wants to claim exactly those, nothing more.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"XAUTOCLAIM made XCLAIM entirely obsolete since Redis 6.2 — there\'s no reason to ever call XCLAIM directly anymore."',
      reality: 'XCLAIM remains the right tool specifically when you already know the exact entry IDs to reclaim from some other source (an alert naming a specific ID, a support ticket) — reaching for XAUTOCLAIM\'s full PEL scan in that case does unnecessary extra work to rediscover something you already know.',
    },
    {
      thought: '"XCLAIM and XAUTOCLAIM are just two names for the same underlying operation, differing only in how many entries they process per call."',
      reality: 'They differ in HOW they select what to claim, not just how many at once — verified above: XCLAIM claims EXACTLY the IDs you name (you must already know them); XAUTOCLAIM discovers eligible IDs itself by scanning the PEL for anything idle beyond a threshold, needing no prior ID knowledge at all.',
    },
  ];

  topicLabel = 'Redis Streams';
  topicRoute = '/redis/streams';
  prev: SubtopicLink | null = {
    label: 'XPENDING\'s Summary vs. Extended Form',
    route: '/redis/streams/xpending-summary-vs-extended-form',
  };
  next: SubtopicLink | null = {
    label: 'Dead-Letter Routing by Delivery Count',
    route: '/redis/streams/dead-letter-routing-by-delivery-count',
  };
}
