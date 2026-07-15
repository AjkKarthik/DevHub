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
  templateUrl: './set-nx-lock-is-not-safe-across-a-redis-failover.html',
  styleUrl: './set-nx-lock-is-not-safe-across-a-redis-failover.scss'
})
export class SetNxLockIsNotSafeAcrossARedisFailoverSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'This batch\'s first subtopic covered a lock failing when work outlives its TTL — this subtopic covers a completely SEPARATE, documented way the same main-page lock pattern can fail: the Redis node holding the lock disappearing mid-flight, independent of timing or work duration entirely',
      points: [
        'The main page\'s own mutex-lock pattern targets a single Redis connection — in a production setup using replication for availability (a primary plus one or more replicas, common with managed Redis or Redis Sentinel/Cluster), Redis\'s own official distributed-locks documentation walks through the exact failure sequence: a client acquires the lock on the primary; the primary crashes BEFORE that SET has been replicated to any replica (replication is asynchronous by default); a replica gets promoted to the new primary, with NO knowledge the lock was ever set; a second client acquires what looks like a completely fresh, available lock on the new primary — Redis\'s own docs label this outcome plainly: "SAFETY VIOLATION!"',
        'This is a fundamentally different failure mode from the TTL-vs-work-duration mismatch — that one is about TIMING (work outlasting a fixed window); this one is about a NODE actually changing out from under the lock, and it can happen even for near-instantaneous work, immediately after acquisition, with no slow operation involved at all.',
        'This is explicitly the motivating problem behind Redis\'s own Redlock algorithm — acquiring the same lock across N independent Redis master instances and requiring a majority to agree, specifically so a single node\'s failure can\'t silently grant the "same" lock to two different clients the way a single-instance setup can.',
      ]
    },
    {
      heading: 'An honest caveat: this isn\'t settled, uncontroversial territory even among Redis\'s own maintainers',
      points: [
        'Worth knowing plainly: Redis\'s own current documentation page keeps a live "Disclaimer about consistency" and an "Analysis of Redlock" section directly linking to a well-known 2016 critique (arguing Redlock\'s own guarantees are weaker than claimed under certain clock and GC-pause assumptions) alongside a rebuttal from Redis\'s original creator — the debate is acknowledged, not resolved or dismissed, and Redis\'s current stance is closer to "use this, but understand the caveats" than "this is a fully solved problem."',
        'Redis\'s own docs\' practical recommendation, regardless of which side of that debate you find more persuasive, is FENCING TOKENS as an additional safeguard for genuinely critical operations — a monotonically increasing number issued with the lock that a downstream system (a database, a file store) can use to reject a write from a client that has, unbeknownst to itself, already lost the lock. For the main page\'s own cache-population use case specifically — where the worst case of a lock failure is a wasted, duplicate cache-refresh, not data corruption — this level of rigor is usually unnecessary; it matters far more for locks guarding genuinely destructive or irreversible operations.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The exact failure sequence, per Redis\'s own docs',
      language: 'typescript',
      code: `// Setup: a Redis primary with one replica (common in production —
// e.g. AWS ElastiCache, Redis Sentinel), using the main page's own
// single-instance lock pattern.

// 1. Client A acquires the lock on the PRIMARY:
await redis.set('lock:product:123', 'A', { NX: true, EX: 10 });
// Replication to the replica is ASYNCHRONOUS by default — there is
// a real (usually tiny, but nonzero) window before this write
// actually reaches the replica.

// 2. The primary crashes RIGHT AFTER this SET, before replicating
//    it to the replica. (A rare event, but not an impossible one —
//    this is precisely the scenario Redis's own docs walk through.)

// 3. The replica is promoted to the new primary. It has NO record
//    of Client A's lock — that write never arrived.

// 4. Client B, talking to what is now the new primary, tries to
//    acquire the SAME lock key:
await redis.set('lock:product:123', 'B', { NX: true, EX: 10 });
// This SUCCEEDS — the new primary has no idea a lock already
// "exists" from Client A's perspective. Both A and B now believe
// they hold the lock. Per Redis's own docs: "SAFETY VIOLATION!"`,
    },
    {
      label: 'Where this actually matters (and where it usually doesn\'t)',
      language: 'typescript',
      code: `// For the main page's OWN use case — a stampede-prevention lock
// guarding a cache REFRESH — this failure mode's worst realistic
// outcome is a wasted, duplicate fetchFn() call. Annoying, and a
// real inefficiency, but not data corruption: both A and B would
// just independently compute and write the SAME correct value.
//
// This level of severity does NOT usually justify adopting the full
// Redlock algorithm (N independent masters, majority quorum) for a
// cache-population lock specifically — the added operational
// complexity is disproportionate to the actual risk here.

// Where this DOES matter: a lock guarding something IRREVERSIBLE —
// e.g. "only one process should ever charge this payment" or "only
// one process should ever send this notification." For locks like
// that, Redis's own docs recommend a fencing token as the real
// safeguard:
const fencingToken = await redis.incr('fence:payment:456'); // e.g. 42
// The downstream system (payment processor, notification service)
// must be built to REJECT a request carrying a fencing token lower
// than the highest one it has already seen — this catches a
// stale, already-superseded lock-holder even if IT doesn't know
// it has already lost the lock.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team is deciding whether to adopt the full Redlock algorithm (5 independent Redis masters, majority quorum) for their cache-aside stampede-prevention lock, reasoning "our docs mention this failover safety gap, so we should use the most rigorous solution available." Using the distinction this subtopic draws between the cache-refresh use case and genuinely critical operations, is this the right call?',
    hint: 'What is the actual worst-case consequence if this specific lock fails and two processes both refresh the same cache entry concurrently? Does that consequence justify the operational complexity of running and coordinating 5 independent Redis instances?',
    solution: 'This is very likely NOT the right call for this specific use case, even though the underlying failover concern the team read about is real and accurately understood. The distinction that matters is what actually goes wrong if the lock fails: for a cache-aside stampede-prevention lock, the worst realistic outcome of two clients both believing they hold the lock is that BOTH independently fetch the same data and write the same correct value to the cache — a wasted, duplicate computation, but not data corruption, not a duplicate charge, not a duplicate notification. That severity does not justify the substantial added operational complexity of deploying, coordinating, and maintaining 5 independent Redis master instances just for Redlock\'s majority-quorum guarantee — complexity that itself introduces new failure modes to reason about. The team\'s "we should use the most rigorous solution available" reasoning treats rigor as free, when it has a real cost; the more proportionate response for THIS specific lock is either accepting the (rare, bounded) risk as-is, or adding a lightweight fencing-token check specifically at the point where fetchFn()\'s result gets written to the cache — reserving the full Redlock complexity for genuinely irreversible operations where a duplicate action would cause real harm, exactly the distinction this subtopic draws.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own single-instance SET NX EX lock pattern is safe from a "two clients both hold the lock" scenario as long as the TTL is chosen correctly and work finishes in time — that timing issue is the only real risk.',
      reality: 'This subtopic\'s theory shows a genuinely SEPARATE, documented failure mode exists — a Redis primary crashing before replicating the lock write to a promoted replica can grant the "same" lock to two clients regardless of timing or work duration, even for near-instantaneous operations.'
    },
    {
      thought: 'Since Redis\'s own documentation discusses this failover safety gap and presents Redlock as the solution, every application using a Redis-based lock should adopt the full Redlock algorithm to be safe.',
      reality: 'This subtopic\'s second code example and exercise both show the opposite is the more proportionate default — for a cache-population lock where the worst-case failure is a harmless duplicate refresh, the operational complexity of running N independent Redis masters is usually disproportionate to the actual risk; Redlock (or fencing tokens) matter far more for genuinely irreversible operations.'
    },
    {
      thought: 'The debate around Redlock\'s safety guarantees (the Kleppmann critique and the rebuttal) has been definitively settled one way or the other by Redis\'s own current documentation.',
      reality: 'This subtopic\'s theory clarifies Redis\'s own current docs keep both the critique and the rebuttal linked side by side, in an actively-maintained "Analysis of Redlock" section, and recommend fencing tokens as an additional hedge — the debate is acknowledged and hedged against, not resolved in either direction.'
    }
  ];
}
