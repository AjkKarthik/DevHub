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
    heading: 'The Real Ceiling Isn’t an Operation Count — It’s the WiredTiger Cache',
    points: [
      'The main page\'s own QnA used to state "maximum 1000 write operations per transaction" as a hard limit. Verified directly against MongoDB\'s own Production Considerations page: it names no such fixed operation count anywhere. The "1000" figure is a performance BEST-PRACTICE recommendation from a MongoDB blog post, not an enforced technical cap.',
      'The REAL, documented hard limit: "if a transaction is too large to ever fit in the WiredTiger cache, the transaction aborts and returns a <code>TransactionTooLargeForCache</code> error." By default, the WiredTiger cache is sized at roughly 50% of (RAM − 1 GB), with a 256 MB minimum — a transaction\'s own uncommitted data has to fit within that, not within any fixed document or operation count.',
      'This is a genuinely DIFFERENT failure from ordinary cache pressure: a transaction that COULD fit but is competing with other concurrent work for cache space instead gets a transient <code>WriteConflict</code> error (retryable, per the dual-retry-loop sibling subtopic) — <code>TransactionTooLargeForCache</code> specifically means the transaction can never succeed no matter how many times it\'s retried, since its own data alone exceeds the cache\'s total capacity.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Modeling the Real Cache Ceiling',
    language: 'typescript',
    code: `// MongoDB's default WiredTiger cache size, verified: ~50% of (RAM - 1GB), 256MB floor.
function wiredTigerCacheBytes(totalRamGB: number): number {
  const ramBytes = totalRamGB * 1024 ** 3;
  const half = Math.max(ramBytes - 1024 ** 3, 0) * 0.5;
  return Math.max(half, 256 * 1024 ** 2);
}

function wouldExceedCacheOutright(transactionBytes: number, cacheBytes: number): boolean {
  return transactionBytes > cacheBytes;
}

const cache = wiredTigerCacheBytes(8); // 8GB RAM host -> ~3.5GB cache
console.log('Cache size:', (cache / 1024 ** 3).toFixed(2), 'GB');

// Scenario A -- the "1000 writes" case the main page's own (now-corrected)
// QnA warned about: 25,000 SMALL documents (<1KB each) in one transaction.
const smallDocBytes = 900;
const smallDocCount = 25000;
console.log('25,000 small docs total:', ((smallDocBytes * smallDocCount) / 1024 ** 2).toFixed(1), 'MB');
console.log('Exceeds cache outright?', wouldExceedCacheOutright(smallDocBytes * smallDocCount, cache));
// -> ~21.5MB, nowhere near the 3.5GB cache -- this is NOT what
// TransactionTooLargeForCache actually protects against, despite being
// exactly the scenario the "1000 operations" figure warns about.

// Scenario B -- the transaction that GENUINELY cannot ever fit: 300
// documents near the 16MB BSON size limit each.
const largeDocBytes = 15 * 1024 * 1024;
const largeDocCount = 300;
console.log('300 large docs total:', ((largeDocBytes * largeDocCount) / 1024 ** 3).toFixed(2), 'GB');
console.log('Exceeds cache outright?', wouldExceedCacheOutright(largeDocBytes * largeDocCount, cache));
// -> ~4.39GB > 3.5GB cache -- THIS is what actually triggers
// TransactionTooLargeForCache, regardless of how few operations it is (300).

// The real fix -- split into batches that individually fit the cache,
// not batches capped at an arbitrary operation count:
const batchSize = 60;
const perBatch = largeDocBytes * batchSize;
console.log('One batch of 60 large docs:', (perBatch / 1024 ** 3).toFixed(2), 'GB -- fits?',
  !wouldExceedCacheOutright(perBatch, cache));`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A transaction updates exactly 50 documents (well under the old "1000 writes" rule of thumb), but each document is a 15MB embedded-array document, on a host with 4GB of RAM. Using the cache formula above, does this transaction risk <code>TransactionTooLargeForCache</code>?',
  hint: 'Compute the cache size for 4GB RAM first, then compare it against 50 documents × 15MB each — the operation COUNT (50, well under 1000) is not the number that matters here.',
  solution: `// Cache size for 4GB RAM: 50% of (4GB - 1GB) = 1.5GB.
// Total transaction data: 50 * 15MB = 750MB.
// 750MB is LESS than the 1.5GB cache -- this transaction fits, despite
// each individual document being large.
//
// The point: an operation-count rule of thumb ("stay under 1000
// writes") can be simultaneously too LOOSE (it would have waved this
// 50-operation transaction through even if the documents were bigger,
// say 40MB each -> 2GB, which WOULD exceed the 1.5GB cache) and too
// STRICT (a transaction with 5,000 tiny 200-byte documents is only
// 1MB total and poses no real cache risk at all, despite blowing past
// "1000 operations" five times over). The real limit tracks total
// DATA SIZE against the cache, not how many operations produced it.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'MongoDB enforces a hard limit of 1000 write operations per transaction — stay under that count and a transaction is always safe.',
    reality: 'Verified directly against MongoDB\'s own Production Considerations page: no such operation-count limit is documented anywhere. "1000" is a performance best-practice figure from a MongoDB blog post. The real, enforced hard limit is <code>TransactionTooLargeForCache</code> — the transaction\'s total DATA SIZE, not its operation count, exceeding what the WiredTiger cache can ever hold.',
  },
  {
    thought: 'TransactionTooLargeForCache and an ordinary transient WriteConflict error under cache pressure are the same underlying problem, just reported differently.',
    reality: 'They are genuinely different. A transaction under ordinary cache PRESSURE (competing with other concurrent work for space) gets a transient, RETRYABLE WriteConflict — the exact same transaction might succeed moments later once contention eases. TransactionTooLargeForCache specifically means the transaction\'s own data could never fit the cache\'s total capacity, no matter how many times it\'s retried or how quiet the server is.',
  },
];

@Component({
  selector: 'app-mongo-txn-too-large-for-cache',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './transactiontoolargeforcache-the-real-limit.html',
  styleUrl: './transactiontoolargeforcache-the-real-limit.scss',
})
export class TransactiontoolargeforcacheTheRealLimitSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
