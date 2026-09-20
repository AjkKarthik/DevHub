import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-ob-cdc-delete',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './cdc-outbox-rows-are-deleted-not-marked.html',
  styleUrl: './cdc-outbox-rows-are-deleted-not-marked.scss'
})
export class CdcOutboxRowsAreDeletedNotMarkedSubtopic {
  topicLabel = 'Outbox Pattern';
  topicRoute = '/messaging/outbox-pattern';

  theory: TheoryPoint[] = [
    {
      heading: 'Two relays, two ways of tracking what is done',
      points: [
        'The main page described one lifecycle for the outbox: set <code>published_at</code> when the relay publishes, then prune old rows later. That is the lifecycle of a <strong>polling</strong> relay, which has to query the table and needs a marker to know which rows it has already sent.',
        'A Debezium relay never queries the table. Debezium\'s own write-up says log-based CDC "doesn\'t examine the actual contents of the table" and instead tails the append-only transaction log. It has no use for a <code>published_at</code> column.',
        'Because only the log matters, the application can insert the outbox row and delete it inside the same transaction. The commit writes an INSERT and a DELETE to the log; Debezium emits a message for the INSERT and ignores the DELETE, which it describes as "a mere technicality".'
      ]
    },
    {
      heading: 'What that changes',
      points: [
        'With a CDC relay the outbox table is always empty, so it needs no purge job and takes no disk space. The "outbox grows unbounded" mistake is a polling-relay problem.',
        'Delivery is still at-least-once. Debezium puts the event id in a message header so consumers can drop duplicates without parsing the payload, and the aggregate id becomes the message key so events for one aggregate stay in order on one partition.',
        'Keep <code>published_at</code> only if you run a polling relay, or if you want rows to stay as an audit trail. Then you are back to needing a pruning job.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Polling relay: mark, then prune',
      language: 'typescript',
      code: `// Polling relay reads the table, so it needs a marker and a cleanup job.
await client.query('UPDATE outbox SET published_at = now() WHERE id = $1', [row.id]);

// Later, on a schedule:
await client.query(
  "DELETE FROM outbox WHERE published_at IS NOT NULL AND published_at < now() - INTERVAL '7 days'"
);`
    },
    {
      label: 'CDC relay: insert and delete together',
      language: 'typescript',
      code: `// Debezium tails the transaction log, so the row only has to exist long enough to be logged.
async function placeOrder(client: PoolClient, userId: string, total: number) {
  await client.query('BEGIN');
  const { rows } = await client.query(
    'INSERT INTO orders (user_id, total) VALUES ($1, $2) RETURNING id', [userId, total]);
  const orderId = rows[0].id;

  const outbox = await client.query(
    'INSERT INTO outbox (aggregate_id, event_type, payload) VALUES ($1, $2, $3) RETURNING id',
    [orderId, 'order.placed', JSON.stringify({ orderId, userId, total })]);

  // Written to the log as an INSERT (captured) and a DELETE (ignored).
  await client.query('DELETE FROM outbox WHERE id = $1', [outbox.rows[0].id]);
  await client.query('COMMIT');
}
// SELECT count(*) FROM outbox;  -- 0, always`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A team runs the Debezium Outbox Event Router and a nightly job that deletes outbox rows where <code>published_at</code> is older than 7 days. The job never deletes anything. Is something broken?',
    hint: 'Ask what sets published_at when the relay is a log reader.',
    solution: 'Nothing sets it. Debezium does not update the table, so published_at stays NULL and the job matches no rows. The job is dead code. The team should either delete each row in the same transaction that inserts it, or drop the column and the job.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A CDC relay marks rows as published like a polling relay does.',
      reality: 'It reads the transaction log and never touches the table, so nothing updates a published marker.'
    },
    {
      thought: 'Deleting the outbox row in the same transaction loses the event.',
      reality: 'The INSERT is already in the transaction log when the transaction commits. Debezium captures it from there and ignores the DELETE.'
    },
    {
      thought: 'CDC removes the need for idempotent consumers.',
      reality: 'Debezium is at-least-once. The event id header exists so consumers can detect and skip duplicates.'
    }
  ];
}
