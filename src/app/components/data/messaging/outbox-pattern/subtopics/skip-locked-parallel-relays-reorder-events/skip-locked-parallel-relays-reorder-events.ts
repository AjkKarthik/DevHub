import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-ob-skip-locked',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './skip-locked-parallel-relays-reorder-events.html',
  styleUrl: './skip-locked-parallel-relays-reorder-events.scss'
})
export class SkipLockedParallelRelaysReorderEventsSubtopic {
  topicLabel = 'Outbox Pattern';
  topicRoute = '/messaging/outbox-pattern';

  theory: TheoryPoint[] = [
    {
      heading: 'What SKIP LOCKED guarantees and what it does not',
      points: [
        'The main page says <code>FOR UPDATE SKIP LOCKED</code> enables safe parallel relay workers. It does prevent two workers from taking the same row, because a row locked by one worker is invisible to the others.',
        'It says nothing about order. Each worker takes whichever unlocked rows it finds first. If two events of the same aggregate are picked up by different workers, whichever worker publishes first wins.',
        'A slow worker (a garbage collection pause, a slow broker acknowledgement) can therefore publish <code>e1</code> after another worker has already published <code>e2</code>. Consumers see the aggregate\'s events reversed.'
      ]
    },
    {
      heading: 'Give each aggregate one owner',
      points: [
        'To keep per-aggregate order with parallel workers, route each aggregate to a single worker, for example by hashing <code>aggregate_id</code> and giving worker N the rows whose hash modulo the worker count is N.',
        'Within one worker, publish rows in insertion order and wait for each send to be acknowledged before the next for that aggregate.',
        'If order does not matter for the event type, plain SKIP LOCKED is fine and gives the best throughput. This is a choice per outbox, not a default to apply everywhere.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: two SKIP LOCKED workers',
      language: 'typescript',
      code: `// One aggregate, two events in order. SKIP LOCKED hands each worker a different row.
const rows = [{ id: 1, agg: 'order-1', ev: 'e1' }, { id: 2, agg: 'order-1', ev: 'e2' }];

async function worker(name: string, take: number, delayMs: number, out: string[]) {
  const mine = rows.filter(r => r.id === take);
  await new Promise(r => setTimeout(r, delayMs));   // worker A is slower
  mine.forEach(r => out.push(name + ':' + r.ev));
}

const out: string[] = [];
await Promise.all([worker('A', 1, 30, out), worker('B', 2, 5, out)]);
console.log('skip locked, 2 workers:', out);   // [ 'B:e2', 'A:e1' ]  e2 published first

// Fix: each aggregate has one owner, chosen by hash
const owner = (agg: string) => [...agg].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0) % 2;
const shard: typeof rows[] = [[], []];
rows.forEach(r => shard[owner(r.agg)].push(r));
const out2: string[] = [];
for (const s of shard) for (const r of s) out2.push(r.ev);
console.log('sharded publish order:', out2);   // [ 'e1', 'e2' ]`
    },
    {
      label: 'Worker query with an owner filter',
      language: 'typescript',
      code: `// Worker N of W only takes the aggregates it owns.
const { rows } = await client.query(
  \`SELECT id, aggregate_id, event_type, payload
     FROM outbox
    WHERE published_at IS NULL
      AND (hashtext(aggregate_id::text)::bigint & 2147483647) % $1 = $2
    ORDER BY created_at
    LIMIT 100
    FOR UPDATE SKIP LOCKED\`,
  [workerCount, workerIndex]);`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'Three relay workers use <code>FOR UPDATE SKIP LOCKED</code>. Order 7 produces <code>order.placed</code> then <code>order.paid</code> a few milliseconds apart. Can consumers see <code>order.paid</code> first, and what would you change?',
    hint: 'SKIP LOCKED avoids duplicates, not reordering.',
    solution: 'Yes. Two different workers can pick up the two rows, and if the one holding order.placed is slower it publishes after the other. Assign each aggregate to one worker, for example by hashing aggregate_id modulo the worker count, so its events are published in order by a single worker.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'SKIP LOCKED makes parallel relays safe in every respect.',
      reality: 'It prevents two workers taking the same row. It does not keep events of one aggregate in order across workers.'
    },
    {
      thought: 'Ordering the query by created_at keeps the published order.',
      reality: 'Each worker orders only its own batch. Between workers, publish order depends on which one finishes sending first.'
    },
    {
      thought: 'Keying the Kafka message by aggregate id fixes it.',
      reality: 'The key puts an aggregate in one partition, but the partition receives messages in the order they were sent. If the sends were out of order, the partition preserves that wrong order.'
    }
  ];
}
