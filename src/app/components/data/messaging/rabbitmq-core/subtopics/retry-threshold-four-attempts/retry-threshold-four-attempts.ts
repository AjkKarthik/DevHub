import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-rc-retry',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './retry-threshold-four-attempts.html',
  styleUrl: './retry-threshold-four-attempts.scss'
})
export class RetryThresholdFourAttemptsSubtopic {
  topicLabel = 'RabbitMQ Core Concepts';
  topicRoute = '/messaging/rabbitmq-core';

  theory: TheoryPoint[] = [
    {
      heading: 'Counting attempts in the Challenge',
      points: [
        'The Challenge description said to nack without requeue when <code>retryCount &gt; 3</code>, while its own title and the reference solution use a threshold of 3 (<code>retryCount &gt;= 3</code>). The two differ by one full attempt.',
        'The retry count starts at 0 and is incremented on each republish. With <code>&gt;= 3</code> the message is processed at retryCount 0, 1, 2 and 3, then dead-lettered: three retries, four attempts in total. With <code>&gt; 3</code> it would get a fifth attempt.',
        'Say which one you mean: "3 retries" and "3 attempts" are different requirements, and the code comparison operator is where the difference hides.'
      ]
    },
    {
      heading: 'The republish-then-ack window',
      points: [
        'The retry branch calls <code>sendToQueue</code> to republish with an incremented header, then <code>ack</code> on the original. Those are two separate operations.',
        'On an ordinary channel <code>sendToQueue</code> gives no acknowledgement that the broker accepted the republished copy. If the broker did not accept it, acking the original right after loses the message; if the consumer dies between the two calls, the original is redelivered as well, so the task can run twice.',
        'A confirm channel (<code>createConfirmChannel</code>) accepts a callback on the publish that fires when the broker confirms or rejects it. Acking the original only inside that callback closes the loss window; the duplicate window remains, so the handler still needs to be idempotent.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: how many attempts?',
      language: 'typescript',
      code: `// processTask always fails, so we only count attempts.
function attempts(threshold: number, cmp: '>=' | '>') {
  let retryCount = 0;
  let tries = 0;
  for (;;) {
    tries++;                                    // one processing attempt
    const dead = cmp === '>=' ? retryCount >= threshold : retryCount > threshold;
    if (dead) return { tries, retries: retryCount, outcome: 'dead-lettered' };
    retryCount++;                               // republish with x-retry + 1
  }
}

console.log(attempts(3, '>='));  // { tries: 4, retries: 3, outcome: 'dead-lettered' }
console.log(attempts(3, '>'));   // { tries: 5, retries: 4, outcome: 'dead-lettered' }`
    },
    {
      label: 'Ack only after the republish is confirmed',
      language: 'typescript',
      code: `import amqplib from 'amqplib';

const conn = await amqplib.connect('amqp://localhost');
const ch = await conn.createConfirmChannel();   // publish callbacks fire on broker confirm

ch.consume('tasks', async (msg) => {
  if (!msg) return;
  const retryCount = (msg.properties.headers?.['x-retry'] ?? 0) as number;
  try {
    await processTask(JSON.parse(msg.content.toString()));
    ch.ack(msg);
  } catch {
    if (retryCount >= 3) {
      ch.nack(msg, false, false);               // dead-lettered if the queue has a DLX
      return;
    }
    ch.sendToQueue(
      'tasks',
      msg.content,
      { persistent: true, headers: { 'x-retry': retryCount + 1 } },
      (err) => {
        if (err) ch.nack(msg, false, true);     // broker did not accept the copy: keep the original
        else ch.ack(msg);                       // copy is safe: now the original can go
      }
    );
  }
});`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate changes the Challenge solution from <code>retryCount &gt;= 3</code> to <code>retryCount &gt; 3</code> "to be safe". How many retries and how many total processing attempts does a permanently failing message now get before it reaches the dead-letter queue?',
    hint: 'Trace retryCount from 0. The message is dead-lettered on the first attempt where the condition is true.',
    solution: 'Four retries and five attempts in total. The message fails at retryCount 0, 1, 2, 3 and is republished each time; at retryCount 4 the condition (retryCount greater than 3) is finally true and it is dead-lettered. The original threshold of 3 with the greater-or-equal comparison gives three retries and four attempts.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A retry limit of 3 in the code always means the message is tried three times.',
      reality: 'It depends on the comparison. Starting the count at 0, <code>&gt;= 3</code> allows three retries and four attempts; <code>&gt; 3</code> allows four retries and five attempts. Define whether the limit counts retries or attempts.'
    },
    {
      thought: 'Republishing the message and then acking the original is a safe, atomic retry.',
      reality: 'They are two operations. A crash between them duplicates the task, and without publisher confirms an unaccepted republish followed by an ack loses it.'
    },
    {
      thought: 'A confirm channel removes the need for idempotent handlers.',
      reality: 'Confirms close the loss window only. If the consumer dies after the confirm but before the ack, the original is redelivered, so the handler can still run twice.'
    }
  ];
}
