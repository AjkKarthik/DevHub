import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-lrm-evicts-by-write-not-by-read',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './lrm-evicts-by-write-not-by-read.html',
  styleUrl: './lrm-evicts-by-write-not-by-read.scss',
})
export class LrmEvictsByWriteNotByReadSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'A fourth eviction family the main page never lists',
      points: [
        'Verified directly against Redis\'s own official Key Eviction docs: Redis 8.6 added <code>allkeys-lrm</code> and <code>volatile-lrm</code> — Least Recently Modified eviction — alongside the LRU/LFU/random families the main page\'s Quick Reference already covers.',
        'The mechanism, quoted directly from Redis\'s own docs: "LRM is similar to LRU but only updates the timestamp on write operations, not read operations." Every OTHER approximated-recency policy on the main page (allkeys-lru, volatile-lru) refreshes its recency timestamp on BOTH reads and writes.',
        'Like LRU, LRM is sampling-based and tunable via the SAME <code>maxmemory-samples</code> directive the main page\'s own "Sampling-Based LRU Approximation" section already covers — LRM adds a new eviction CRITERION, not a new sampling MECHANISM.',
      ],
    },
    {
      heading: 'Why "recently read" and "recently modified" can disagree about the same key',
      points: [
        'A key that is read constantly but never rewritten (a slowly-changing reference table, a cached config value) looks "hot" to LRU — its recency timestamp keeps refreshing on every read — but looks completely stale to LRM, since its write timestamp never moves.',
        'The reverse also holds: a key written recently but rarely read afterward (a freshly-ingested record awaiting later processing) looks "cold" to LRU almost immediately after its one read, but looks "hot" to LRM for as long as its write recency holds.',
        'This makes LRM the better choice specifically when the goal is evicting genuinely STALE DATA — content nobody has bothered to update — regardless of how often it is still being served to readers, which LRU has no way to express on its own.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'LRU and LRM disagree on the same access pattern',
      language: 'typescript',
      code: `// Two keys, tracked with independent read/write recency timestamps.
const keys: Record<string, { lastRead: number; lastWrite: number }> = {
  'hot-config':  { lastRead: 0, lastWrite: 0 }, // written once, read constantly
  'rare-write':  { lastRead: 0, lastWrite: 0 }, // written again mid-way, barely read after
};

let t = 0;
function read(key: string)  { keys[key].lastRead = t; }
function write(key: string) { keys[key].lastWrite = t; }

write('hot-config'); write('rare-write'); // t=0: both keys created

// 100 ticks: 'hot-config' is read on EVERY tick, never rewritten.
// 'rare-write' is rewritten once at tick 50, never read again after t=0.
for (t = 1; t <= 100; t++) {
  read('hot-config');
  if (t === 50) write('rare-write');
}

// LRU: recency = the LATER of lastRead / lastWrite -- evict the SMALLEST value.
function evictLRU(keys: typeof keys): string {
  let victim = '', oldest = Infinity;
  for (const [k, v] of Object.entries(keys)) {
    const recency = Math.max(v.lastRead, v.lastWrite);
    if (recency < oldest) { oldest = recency; victim = k; }
  }
  return victim;
}

// LRM: recency = lastWrite ONLY -- reads never count at all.
function evictLRM(keys: typeof keys): string {
  let victim = '', oldest = Infinity;
  for (const [k, v] of Object.entries(keys)) {
    if (v.lastWrite < oldest) { oldest = v.lastWrite; victim = k; }
  }
  return victim;
}

console.log('LRU would evict:', evictLRU(keys));
console.log('LRM would evict:', evictLRM(keys));
// LRU would evict: rare-write   (its one read, at t=0, is the oldest recorded access)
// LRM would evict: hot-config   (its write is stale at t=0 -- reads never refresh it)`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team caches product prices with <code>allkeys-lrm</code>, reasoning "prices rarely change, so LRM will correctly keep them evictable when nobody updates them." A promotional sale key gets read millions of times per hour during a flash sale, with its PRICE value never actually changing (no write). Under memory pressure, what does LRM do to this key, and is that the outcome the team wants?',
    hint: 'LRM only tracks the timestamp of the last WRITE — ask what its write recency looks like during the entire flash sale, regardless of read volume.',
    solution: `LRM would treat the flash-sale price key as increasingly STALE throughout the entire sale, since its last write happened before the sale started and never changes -- no matter how many millions of reads it serves. Under memory pressure, it becomes an eviction CANDIDATE precisely during the period it is most important to keep in cache, which is the opposite of what the team wants.

This is not a flaw in LRM -- it is doing exactly what its name promises: tracking modification recency, not access recency. The team's actual requirement ("keep the most ACCESSED data cached, even if unchanged") is precisely what LRU already provides. LRM is the right choice specifically for the opposite requirement -- evicting content nobody has bothered to update, regardless of read volume -- which does not describe a flash-sale price at all.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"LRM is just LRU with a different name for the same underlying recency tracking."',
      reality: 'They track fundamentally different signals. LRU\'s recency timestamp updates on every access (read OR write); LRM\'s updates ONLY on write. Verified above: the same 100-tick access pattern produces opposite eviction choices under the two policies.',
    },
    {
      thought: '"Since LRM is newer (Redis 8.6+), it must be a strict improvement over LRU and should generally be preferred."',
      reality: 'LRM is not an improvement over LRU — it is a DIFFERENT tool answering a different question (recently modified vs. recently accessed). The main page\'s own theory names allkeys-lru as "a safe default" for pure caching precisely because most caching workloads care about READ recency, which is exactly what LRM ignores.',
    },
  ];

  topicLabel = 'Eviction Policies';
  topicRoute = '/redis/eviction-policies';
  prev: SubtopicLink | null = null;
  next: SubtopicLink | null = {
    label: 'The LFU Morris Counter, Verified Against Real Redis Source',
    route: '/redis/eviction-policies/the-lfu-morris-counter-formula-verified',
  };
}
