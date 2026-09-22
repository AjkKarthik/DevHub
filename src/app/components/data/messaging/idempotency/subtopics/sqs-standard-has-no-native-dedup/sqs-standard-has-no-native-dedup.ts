import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-idem-sqs-dedup',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './sqs-standard-has-no-native-dedup.html',
  styleUrl: './sqs-standard-has-no-native-dedup.scss'
})
export class SqsStandardHasNoNativeDedupSubtopic {
  topicLabel = 'Idempotency & Dedup';
  topicRoute = '/messaging/idempotency';

  theory: TheoryPoint[] = [
    {
      heading: 'FIFO Gets Native Dedup; Standard Gets None At All',
      points: [
        'This hub\'s own AWS SQS page is explicit: FIFO queues deduplicate via MessageDeduplicationId within a 5-minute window (with an optional content-based hash). Standard queues have no equivalent mechanism whatsoever.',
        'Standard queues are documented to deliver "at-least-once" with "occasional duplicates... acceptable" -- and this is not limited to retry-after-failure scenarios. AWS\'s own distributed architecture for Standard queues means an ordinary, successful receive can still occasionally be delivered more than once, with no consumer error involved at all.',
        'Choosing Standard over FIFO for throughput therefore is not just a latency/ordering trade-off -- it is a decision to take on 100% of the deduplication responsibility yourself, since AWS provides none.'
      ]
    },
    {
      heading: 'The Same Idempotency-Key Technique, Applied to a Different Broker',
      points: [
        'The idempotency-key-table pattern this page already builds for Kafka consumers (INSERT ... ON CONFLICT DO NOTHING, checked inside the same transaction as the business write) applies to an SQS Standard consumer with zero changes to the pattern itself.',
        'The only thing that differs is where the idempotency key comes from: for a Kafka message it is typically a business-domain key or a generated UUID sent by the producer; for an SQS Standard message, MessageId is broker-generated per DELIVERY attempt and is not safe to use for this -- the same message redelivered can arrive with a different MessageId depending on the exact redelivery path.',
        'A safe SQS Standard idempotency key has to come from the MESSAGE BODY itself (a business identifier the producer included, like orderId or a producer-generated UUID) -- never from SQS\'s own delivery-level metadata.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Idempotent SQS Standard Consumer',
      language: 'typescript',
      code: `import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { Pool } from 'pg';

const sqs = new SQSClient({});
const db = new Pool({ connectionString: process.env.DATABASE_URL });
const QUEUE_URL = process.env.QUEUE_URL!;

// Reusing the SAME idempotency-key-table pattern from the Kafka examples
// on this page -- the pattern itself does not change per broker.
async function processMessageIdempotently(
  idempotencyKey: string,
  payload: { orderId: string; amount: number }
) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { rowCount } = await client.query(
      \`INSERT INTO processed_events (idempotency_key)
       VALUES ($1) ON CONFLICT (idempotency_key) DO NOTHING\`,
      [idempotencyKey]
    );
    if (rowCount === 0) {
      await client.query('ROLLBACK');
      return { status: 'skipped (duplicate)' };
    }
    await client.query(
      'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
      [payload.amount, payload.orderId]
    );
    await client.query('COMMIT');
    return { status: 'processed' };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function pollStandardQueue() {
  const { Messages } = await sqs.send(new ReceiveMessageCommand({
    QueueUrl: QUEUE_URL,
    MaxNumberOfMessages: 10,
    WaitTimeSeconds: 20,
  }));

  for (const message of Messages ?? []) {
    const body = JSON.parse(message.Body!) as { idempotencyKey: string; orderId: string; amount: number };

    // WRONG: message.MessageId is a delivery-level ID, not safe for dedup on Standard queues.
    // RIGHT: idempotencyKey comes from the message BODY, set by the producer.
    await processMessageIdempotently(body.idempotencyKey, body);

    await sqs.send(new DeleteMessageCommand({
      QueueUrl: QUEUE_URL,
      ReceiptHandle: message.ReceiptHandle!,
    }));
  }
}`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A consumer keys its idempotency-key table on message.MessageId (the field SQS returns on each ReceiveMessage call) instead of a business identifier from the message body. Under what circumstances does this silently fail to prevent a duplicate?',
    hint: 'Consider whether MessageId is guaranteed to be identical every time the SAME logical message is delivered.',
    solution: 'MessageId is assigned per delivery attempt by SQS -- it is not guaranteed to stay identical across every redelivery of the same logical message (this is explicitly true for Standard queues, which have no message-identity guarantee equivalent to FIFO\'s deduplication ID). If a message is redelivered with a different MessageId, the idempotency-key table sees it as a brand-new key, inserts it successfully, and reprocesses the payment -- the duplicate slips straight through, even though the check itself "worked" exactly as coded.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'SQS Standard queues occasionally deliver duplicates only when a consumer fails to delete a message in time.',
      reality: 'AWS documents Standard queue duplicates as possible even under completely normal operation, independent of consumer failures -- it is an inherent property of the distributed, at-least-once architecture, not just a redelivery-after-timeout artifact.'
    },
    {
      thought: '<code>message.MessageId</code> is a stable, unique identifier safe to use as an idempotency key.',
      reality: 'It is a delivery-level identifier, not a message-identity guarantee -- the same logical message redelivered is not guaranteed to keep the same MessageId, especially on Standard queues. A safe idempotency key must come from the message body itself.'
    },
    {
      thought: 'Switching from Kafka to SQS means building a completely different deduplication mechanism.',
      reality: 'The idempotency-key-table pattern itself (atomic INSERT ... ON CONFLICT DO NOTHING inside the same transaction as the work) is broker-agnostic -- only the SOURCE of the idempotency key changes per broker, not the pattern.'
    }
  ];
}
