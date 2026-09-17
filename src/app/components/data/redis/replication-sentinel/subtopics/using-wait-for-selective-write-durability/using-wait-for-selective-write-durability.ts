import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-using-wait-for-selective-write-durability',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './using-wait-for-selective-write-durability.html',
  styleUrl: './using-wait-for-selective-write-durability.scss',
})
export class UsingWaitForSelectiveWriteDurabilitySubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'Named once in theory, never shown as code',
      points: [
        'The main page\'s own theory names WAIT precisely: "WAIT (blocking until a specified number of replicas acknowledge a write, up to a timeout) can be used selectively for genuinely critical writes needing stronger durability guarantees." No codeTab anywhere on the page actually calls it.',
        'WAIT is a per-CALL opt-in, not a global setting like <code>min-replicas-to-write</code> — the main page\'s own theory already distinguishes these two durability mechanisms elsewhere, but only WAIT lets an application choose durability strength on a write-by-write basis, paying the extra latency only where it is actually worth it.',
      ],
    },
    {
      heading: 'What WAIT actually returns, and what it does not guarantee',
      points: [
        '<code>WAIT numreplicas timeout</code> blocks until either <code>numreplicas</code> replicas have acknowledged all writes issued by that connection so far, or the timeout (in milliseconds) elapses — whichever comes first. It returns the ACTUAL number of replicas that acknowledged, which may be less than requested if the timeout was hit first.',
        'A returned count below the requested <code>numreplicas</code> does NOT mean the write failed or was rolled back — the write already happened on the master. It means the CALLER did not get the durability confirmation it asked for within the timeout, and must decide what to do with that information (retry, alert, accept the risk, or reject the operation at the application level).',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'WAIT for a critical write',
      language: 'typescript',
      code: `import Redis from 'ioredis';
const redis = new Redis();

interface WriteResult { written: boolean; durable: boolean; acked: number }

async function criticalWrite(
  key: string,
  value: string,
  requiredAcks: number,
  timeoutMs: number,
): Promise<WriteResult> {
  await redis.set(key, value);
  const acked = await redis.wait(requiredAcks, timeoutMs); // returns number of replicas that ACKed
  return { written: true, durable: acked >= requiredAcks, acked };
}

// A payment confirmation: worth the extra latency to confirm 2 replicas have it.
async function confirmPayment(orderId: string) {
  const result = await criticalWrite(\`order:\${orderId}:status\`, 'paid', 2, 100);
  if (!result.durable) {
    console.warn(\`Payment for \${orderId} written but only \${result.acked}/2 replicas confirmed within timeout\`);
    // Application decides: retry WAIT, alert on-call, or accept the risk for this specific order.
  }
  return result;
}

// Everyday cache-refresh write: no WAIT call at all -- the default async
// replication (used everywhere else on this page) is perfectly fine here.
async function refreshCachedProfile(userId: string, profile: object) {
  await redis.set(\`v1:user:\${userId}:profile\`, JSON.stringify(profile), 'EX', 300);
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team wraps EVERY write in the application with <code>WAIT 3 200</code> (require all 3 replicas, 200ms timeout), reasoning "more durability is always better." What does this do to the application under normal, healthy conditions — and does it actually make the risky writes safer than calling WAIT selectively would?',
    hint: 'Consider what WAIT costs even when everything is healthy and every replica acknowledges quickly, multiplied across every single write the application makes.',
    solution: `Calling WAIT on EVERY write adds real latency to every single write in the application -- even the ones that never needed strong durability at all, like the cache-refresh example above. Under normal conditions this might only add a few milliseconds per call, but multiplied across every write in a high-throughput service, it becomes a real, constant throughput cost paid on writes that would have been perfectly fine with Redis's default asynchronous replication.

It does NOT make the genuinely risky writes any safer than calling WAIT selectively would -- the payment-confirmation write in the codeTab above gets the exact same durability guarantee whether or not the cache-refresh write next to it also calls WAIT. Blanket WAIT usage doesn't add protection to the writes that need it; it only adds cost to the writes that didn't. This is exactly why the main page's own theory frames WAIT as something to use "selectively for genuinely critical writes" rather than as a global durability upgrade.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"WAIT and min-replicas-to-write accomplish the same thing — using one makes the other redundant."',
      reality: 'They operate at different scopes. min-replicas-to-write is a MASTER-WIDE config: the master refuses ALL writes once too few replicas are healthy, regardless of which write it is. WAIT is called PER-WRITE by the application, letting it choose durability strength write-by-write — a service could reasonably use min-replicas-to-write as a coarse safety net AND call WAIT selectively for its highest-value writes, since they answer different questions ("should the master accept writes at all right now" vs. "did THIS specific write reach enough replicas").',
    },
    {
      thought: '"If WAIT returns fewer acknowledgments than requested, the write must have failed or been rolled back."',
      reality: 'The write already succeeded on the master before WAIT was ever called — WAIT only reports on REPLICATION acknowledgment after the fact, verified above by the codeTab\'s own criticalWrite always setting written: true regardless of the acked count. A low acked count is a durability WARNING the caller must act on, not evidence the write itself failed.',
    },
  ];

  topicLabel = 'Replication & Sentinel';
  topicRoute = '/redis/replication-sentinel';
  prev: SubtopicLink | null = {
    label: 'Sentinel’s Replica-Selection Tiebreaker, Implemented',
    route: '/redis/replication-sentinel/sentinel-replica-selection-tiebreaker-implemented',
  };
  next: SubtopicLink | null = null;
}
