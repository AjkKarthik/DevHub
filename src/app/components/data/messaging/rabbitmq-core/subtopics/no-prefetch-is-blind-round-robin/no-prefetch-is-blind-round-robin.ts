import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-rc-prefetch',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './no-prefetch-is-blind-round-robin.html',
  styleUrl: './no-prefetch-is-blind-round-robin.scss'
})
export class NoPrefetchIsBlindRoundRobinSubtopic {
  topicLabel = 'RabbitMQ Core Concepts';
  topicRoute = '/messaging/rabbitmq-core';

  theory: TheoryPoint[] = [
    {
      heading: 'What the broker actually does without prefetch',
      points: [
        'The main page said that without prefetch the broker "delivers all messages to the fastest consumer, starving others" and pushes everything to the first consumer. The RabbitMQ work queues tutorial describes something different: RabbitMQ sends each message to the next consumer in sequence, so on average every consumer gets the same number of messages.',
        'It does not check how many unacknowledged messages a consumer holds; it "just dispatches a message when the message enters the queue". A consumer that takes ten times longer per message is handed the same share as a fast one and falls steadily behind while the fast consumer goes idle.',
        'The "entire backlog to one consumer" picture is only true when there is a single consumer, which receives everything until other consumers connect.'
      ]
    },
    {
      heading: 'Why prefetch fixes it',
      points: [
        'Per the tutorial, <code>prefetch(1)</code> tells RabbitMQ not to dispatch a new message to a worker until it has processed and acknowledged the previous one, so messages go to whichever worker is free.',
        'The trade-off the tutorial leaves implicit: with a limit of 1 the consumer idles for a network round trip between finishing a message and receiving the next, so a higher prefetch (as the main page notes) suits fast, uniform tasks and a low prefetch suits slow or uneven ones.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: round-robin vs prefetch(1)',
      language: 'typescript',
      code: `// Two consumers: A needs 1 time unit per message, B needs 5.
const costs = [1, 5];

function roundRobin(n: number) {               // no prefetch: blind alternation
  const busy = costs.map(() => 0);
  const got = costs.map(() => 0);
  for (let i = 0; i < n; i++) {
    const c = i % costs.length;
    got[c]++;
    busy[c] += costs[c];
  }
  return { got, finishedAt: Math.max(...busy) };
}

function fair(n: number) {                     // prefetch(1): next message goes to whoever is free first
  const free = costs.map(() => 0);
  const got = costs.map(() => 0);
  for (let i = 0; i < n; i++) {
    let c = 0;
    for (let k = 1; k < costs.length; k++) if (free[k] < free[c]) c = k;
    got[c]++;
    free[c] += costs[c];
  }
  return { got, finishedAt: Math.max(...free) };
}

console.log(roundRobin(12));  // { got: [ 6, 6 ],  finishedAt: 30 }  <- slow B holds half the work
console.log(fair(12));        // { got: [ 10, 2 ], finishedAt: 10 }  <- fast A absorbs most of it`
    },
    {
      label: 'Setting it on the consumer',
      language: 'typescript',
      code: `import amqplib from 'amqplib';

const conn = await amqplib.connect('amqp://localhost');
const ch = await conn.createChannel();
await ch.assertQueue('tasks', { durable: true });

// Fair dispatch for slow, uneven tasks: at most one unacked message per consumer.
await ch.prefetch(1);

await ch.consume('tasks', async (msg) => {
  if (!msg) return;
  await slowTask(msg);
  ch.ack(msg);                // frees the slot; the broker can now send the next one
}, { noAck: false });`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'Two workers consume one queue with no prefetch. Worker A handles a message in 1 second and worker B takes 5 seconds. Twelve messages arrive at once. Roughly how many does each worker receive, and how does that change with <code>prefetch(1)</code>?',
    hint: 'Without prefetch the broker alternates blindly. With prefetch(1) the next message goes to whichever worker is free.',
    solution: 'Without prefetch the broker alternates, so each worker receives six messages. A finishes its six in 6 seconds and sits idle while B needs 30 seconds. With prefetch(1) the messages go to whichever worker is free: A takes about ten and B about two, and everything finishes in about 10 seconds.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Without prefetch, RabbitMQ sends everything to the fastest consumer.',
      reality: 'It alternates by message count and does not look at consumer speed, so on average every consumer receives the same number of messages. A single connected consumer is the case where one gets the whole backlog.'
    },
    {
      thought: 'Without prefetch a slow consumer starves the others of messages.',
      reality: 'The opposite happens: the slow consumer holds its full share, and the fast consumer runs out of work and idles while messages wait behind the slow one.'
    },
    {
      thought: 'prefetch(1) is always the best setting.',
      reality: 'It gives fair dispatch for slow, uneven tasks but adds an idle round trip per message. For fast, uniform tasks a larger prefetch usually gives better throughput.'
    }
  ];
}
