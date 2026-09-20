import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-asb-unmatched',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './unmatched-filter-is-not-dead-lettered.html',
  styleUrl: './unmatched-filter-is-not-dead-lettered.scss'
})
export class UnmatchedFilterIsNotDeadLetteredSubtopic {
  topicLabel = 'Azure Service Bus';
  topicRoute = '/messaging/azure-service-bus';

  theory: TheoryPoint[] = [
    {
      heading: 'What actually reaches the dead-letter queue',
      points: [
        'The quick reference said the dead-letter queue receives messages that "exceed max delivery count or fail filter". The Microsoft Learn dead-letter article lists the system reasons: <code>MaxDeliveryCountExceeded</code>, <code>TTLExpiredException</code> (when dead-lettering on expiration is on), <code>HeaderSizeExceeded</code>, <code>Session ID is null</code> and <code>MaxTransferHopCountExceeded</code>, plus anything your code dead-letters explicitly.',
        'A message that simply does not match a subscription\'s filter is not in that list. The subscription does not receive a copy, and nothing is dead-lettered for it.',
        'The filter-related case is an exception thrown while a rule runs. Only when <code>deadLetteringOnFilterEvaluationExceptions</code> is enabled is that message captured in the DLQ, and Learn warns against enabling it in production where some messages have no subscribers, because it can flood the DLQ.'
      ]
    },
    {
      heading: 'Operating the DLQ',
      points: [
        'Each queue and each subscription has its own dead-letter sub-queue. There is no automatic cleanup, and time to live is not applied inside it, so messages stay until someone receives and completes them.',
        'Read them with a receiver on the dead-letter sub-queue and look at <code>deadLetterReason</code> and <code>deadLetterErrorDescription</code> to see why each one landed there.',
        'A message published to a topic with no matching subscription leaves no copy anywhere. If that would be a problem, make sure every message type has at least one subscription.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: where a published message goes',
      language: 'typescript',
      code: `function publish(msg: { subject: string }, subs: { name: string; rule: (m: any) => boolean }[],
                 { dlqOnFilterError = false } = {}) {
  const copies: string[] = []; const dlq: string[] = [];
  for (const s of subs) {
    let match: boolean;
    try { match = s.rule(msg); } catch { if (dlqOnFilterError) dlq.push(s.name); continue; }
    if (match) copies.push(s.name);
  }
  return { copies, dlq, stored: copies.length + dlq.length > 0 };
}

const subs = [
  { name: 'analytics', rule: (m: any) => m.subject === 'order.placed' },
  { name: 'shipping',  rule: (m: any) => m.subject === 'order.shipped' },
];
console.log(publish({ subject: 'order.placed' }, subs));
// { copies: [ 'analytics' ], dlq: [], stored: true }
console.log(publish({ subject: 'order.refunded' }, subs));
// { copies: [], dlq: [], stored: false }   matches nothing: no copy, nothing dead-lettered
console.log(publish({ subject: 'x' }, [{ name: 'bad', rule: () => { throw new Error('filter'); } }], { dlqOnFilterError: true }));
// { copies: [], dlq: [ 'bad' ], stored: true }   only a rule that throws, with the option on`
    },
    {
      label: 'Reading the dead-letter queue',
      language: 'typescript',
      code: `import { ServiceBusClient } from '@azure/service-bus';

const client = new ServiceBusClient(process.env.SERVICEBUS_CONNECTION_STRING!);

// A queue: pass subQueueType. For a subscription: createReceiver(topic, subscription, { subQueueType })
const dlq = client.createReceiver('orders', { subQueueType: 'deadLetter' });

const messages = await dlq.receiveMessages(10, { maxWaitTimeInMs: 5000 });
for (const m of messages) {
  console.log(m.deadLetterReason, '-', m.deadLetterErrorDescription);
  // MaxDeliveryCountExceeded, TTLExpiredException, HeaderSizeExceeded, Session ID is null, ...
  await dlq.completeMessage(m);   // there is no automatic cleanup of the DLQ
}`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A subscription filter is <code>subject = \'order.placed\'</code>. A publisher sends messages with subject <code>order.refunded</code> and none of the topic\'s subscriptions match. Where do those messages end up, and how would you find out they are being lost?',
    hint: 'A non-matching message is not an error, so it is not dead-lettered.',
    solution: 'They are not stored anywhere: no subscription gets a copy and nothing is dead-lettered, because not matching is not a failure. To notice, add a catch-all subscription (or one for the missing subject) and monitor it, or check message counts and subscription rules whenever a new subject is introduced.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Messages that do not match a filter go to the dead-letter queue.',
      reality: 'They are just not copied to that subscription. Only a rule that throws while evaluating, with dead-lettering on filter evaluation exceptions enabled, produces a dead-lettered message.'
    },
    {
      thought: 'Expired messages always end up in the DLQ.',
      reality: 'Only with dead-lettering on message expiration enabled. Time to live is not applied to messages already in the DLQ.'
    },
    {
      thought: 'The dead-letter queue empties itself.',
      reality: 'There is no automatic cleanup. Messages remain until you receive and complete them.'
    }
  ];
}
