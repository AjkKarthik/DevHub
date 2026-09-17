import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-debug-sleep-vs-save-two-different-commands',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './debug-sleep-vs-save-two-different-commands.html',
  styleUrl: './debug-sleep-vs-save-two-different-commands.scss',
})
export class DebugSleepVsSaveTwoDifferentCommandsSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'The quick reference had these two commands mixed up',
      points: [
        'The main page\'s own Quick Reference originally listed <code>DEBUG SLEEP 0</code> with the description "Used in testing; SAVE forces synchronous RDB write" — a description that names a completely different command (SAVE) and never actually explains what DEBUG SLEEP does at all.',
        'Verified directly: <code>DEBUG SLEEP seconds</code> blocks the ENTIRE Redis server for the given duration (fractional seconds accepted, e.g. <code>DEBUG SLEEP 0.5</code>) — it has nothing to do with RDB, AOF, or persistence at all. It is a pure testing/chaos-engineering tool for simulating server unresponsiveness.',
        'SAVE (already covered correctly in the page\'s own mistakes block) is the ACTUAL synchronous, blocking RDB write the original quickRef description was describing — it just had the wrong command name attached to it.',
      ],
    },
    {
      heading: 'Where DEBUG SLEEP is genuinely useful — including for persistence testing',
      points: [
        'Per its documented purpose: DEBUG SLEEP enables testing client timeout handling, connection retry logic, and monitoring alert pipelines — verifying clients correctly time out, monitoring systems correctly fire alerts, and retry logic correctly engages when the server appears frozen.',
        'This connects directly back to the main page\'s own BGSAVE theory point about fork() latency spikes: DEBUG SLEEP is the standard way to SIMULATE that kind of multi-millisecond-to-multi-second freeze in a controlled test, without needing an actual multi-GB dataset to trigger a real fork() delay.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What each command actually does',
      language: 'typescript',
      code: `import Redis from 'ioredis';
const redis = new Redis();

// SAVE -- the command the original quickRef entry was actually describing.
// Synchronous, blocking RDB write. Never call this in a request path.
async function synchronousSnapshot() {
  const start = Date.now();
  await redis.save(); // BLOCKS the entire server until the RDB write completes
  return { command: 'SAVE', durationMs: Date.now() - start, blocksServer: true };
}

// DEBUG SLEEP -- a completely different, unrelated command. Blocks the server
// for an ARBITRARY, CALLER-SPECIFIED duration, regardless of any real I/O work.
async function simulateFreeze(seconds: number) {
  const start = Date.now();
  await redis.call('DEBUG', 'SLEEP', String(seconds));
  return { command: 'DEBUG SLEEP', durationMs: Date.now() - start, blocksServer: true };
}`,
    },
    {
      label: 'Using DEBUG SLEEP to test a client\'s timeout handling',
      language: 'typescript',
      code: `import Redis from 'ioredis';

// A test verifying the application's OWN client correctly times out and
// retries when Redis appears frozen -- simulating exactly the kind of
// multi-second freeze a large BGSAVE's fork() could cause in production.
async function testClientTimeoutHandling() {
  const redis = new Redis({ commandTimeout: 1000 }); // 1s client-side timeout

  // Kick off a 3-second server freeze (fire-and-forget from a SEPARATE
  // admin connection, since the sleeping connection itself can't respond).
  const admin = redis.duplicate();
  admin.call('DEBUG', 'SLEEP', '3').catch(() => {}); // this connection will also block

  try {
    await redis.get('some-key'); // should time out after 1s, well before the 3s freeze ends
    return { timedOutAsExpected: false };
  } catch (err) {
    return { timedOutAsExpected: true, errorMessage: (err as Error).message };
  } finally {
    admin.disconnect();
    redis.disconnect();
  }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A monitoring dashboard alerts on Redis command latency exceeding 500ms. A team wants to verify the alert actually fires correctly BEFORE relying on it in production. Which command from this page — SAVE or DEBUG SLEEP — is the safer choice to deliberately trigger that alert in a staging environment, and why?',
    hint: 'One of the two commands\' duration depends entirely on real dataset size and disk I/O (unpredictable, hard to control precisely); the other lets you specify the EXACT duration directly as an argument.',
    solution: `DEBUG SLEEP is the safer, more precise choice. Its duration is a direct argument you control exactly (DEBUG SLEEP 0.6 reliably blocks for 600ms, comfortably past the 500ms alert threshold, every single time) -- SAVE's blocking duration depends entirely on the real dataset's size and the disk's actual write speed, which varies run to run and environment to environment, making it a poor tool for reliably triggering a SPECIFIC latency threshold on demand.

This is exactly why DEBUG SLEEP exists as a distinct, dedicated testing command rather than something you'd improvise by triggering a large real SAVE -- it decouples "test a specific latency scenario" from "actually perform the real, unpredictable operation that might normally cause one."`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"DEBUG SLEEP must be persistence-related, since it appeared in the Persistence topic\'s own Quick Reference next to SAVE, BGSAVE, and LASTSAVE."',
      reality: 'It has no connection to persistence at all — verified directly, it is a general-purpose server-freeze simulator used for testing timeout/retry/alerting logic. Its original placement in this page\'s Quick Reference was itself the mistake being corrected here.',
    },
    {
      thought: '"Since DEBUG SLEEP blocks the server, it must be dangerous to ever use, even in a controlled test."',
      reality: 'It is genuinely dangerous in PRODUCTION (verified: even a few seconds can cause client timeouts, replication lag, and potential failovers) — but that is exactly what makes it valuable in a STAGING environment specifically to verify your own systems correctly detect and handle that exact failure mode before it happens for real.',
    },
  ];

  topicLabel = 'Persistence: RDB & AOF';
  topicRoute = '/redis/persistence';
  prev: SubtopicLink | null = {
    label: 'aof-use-rdb-preamble Has Defaulted to Yes Since Redis 5.0',
    route: '/redis/persistence/aof-use-rdb-preamble-default-since-redis-5-0',
  };
  next: SubtopicLink | null = {
    label: 'Monitoring BGSAVE\'s Copy-on-Write Memory Growth',
    route: '/redis/persistence/monitoring-bgsave-cow-memory-growth',
  };
}
