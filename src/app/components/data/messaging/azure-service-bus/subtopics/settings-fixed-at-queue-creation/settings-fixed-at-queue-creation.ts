import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-asb-creation-settings',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './settings-fixed-at-queue-creation.html',
  styleUrl: './settings-fixed-at-queue-creation.scss'
})
export class SettingsFixedAtQueueCreationSubtopic {
  topicLabel = 'Azure Service Bus';
  topicRoute = '/messaging/azure-service-bus';

  theory: TheoryPoint[] = [
    {
      heading: 'Three settings the code comments took for granted',
      points: [
        'The send code tab set <code>messageId</code> with the comment "deduplication key" and a 24 hour <code>timeToLive</code>. Neither does anything useful unless the queue was created with the right settings.',
        'Duplicate detection is off by default. The SDK type documentation says <code>requiresDuplicateDetection</code> is "settable only at queue creation time". When it is on, the history window defaults to 10 minutes (20 seconds to 7 days) and a duplicate send still succeeds but the message is dropped. Only the <code>messageId</code> is compared, and the Basic tier does not support it.',
        'When a message expires, it is dead-lettered only if <code>deadLetteringOnMessageExpiration</code> is enabled, which is also creation-time only. Otherwise the SDK type documentation says it is "permanently deleted".',
        '<code>requiresSession</code> is creation-time only as well. On a session-enabled entity every message needs a session id, and a message without one is dead-lettered with the reason "Session ID is null".'
      ]
    },
    {
      heading: 'What follows',
      points: [
        'These are decisions to make when the queue is provisioned, in infrastructure code, not something to switch on later when a problem shows up. Changing one means creating a new queue and moving traffic.',
        'A dedup messageId has to be reproducible from the business operation, for example the order id. A fresh GUID per send attempt makes every retry look unique and defeats the feature.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Creating the queue',
      language: 'typescript',
      code: `import { ServiceBusAdministrationClient } from '@azure/service-bus';

const admin = new ServiceBusAdministrationClient(process.env.SERVICEBUS_CONNECTION_STRING!);

await admin.createQueue('orders', {
  requiresDuplicateDetection: true,             // creation time only
  duplicateDetectionHistoryTimeWindow: 'PT10M', // default; 20 seconds to 7 days
  deadLetteringOnMessageExpiration: true,       // creation time only
  requiresSession: false,                       // creation time only
  lockDuration: 'PT1M',                         // default; 5 minutes at most
  maxDeliveryCount: 10,                         // default
  defaultMessageTimeToLive: 'P1D',
});`
    },
    {
      label: 'Model: duplicate detection',
      language: 'typescript',
      code: `function makeQueue({ requiresDuplicateDetection, windowMs = 10 * 60 * 1000 }: { requiresDuplicateDetection: boolean; windowMs?: number }) {
  const seen = new Map<string, number>(); const log: string[] = [];
  return { log, send(id: string, now: number, body: string) {
    if (requiresDuplicateDetection) {
      const t = seen.get(id);
      if (t !== undefined && now - t <= windowMs) return 'accepted, dropped';
      seen.set(id, now);
    }
    log.push(body); return 'accepted, stored';
  } };
}

const off = makeQueue({ requiresDuplicateDetection: false });
console.log(off.send('ORD-1', 0, 'a'), '|', off.send('ORD-1', 1000, 'a'), '| stored', off.log.length);
// accepted, stored | accepted, stored | stored 2

const on = makeQueue({ requiresDuplicateDetection: true });
console.log(on.send('ORD-1', 0, 'a'), '|', on.send('ORD-1', 1000, 'a'), '| stored', on.log.length);
// accepted, stored | accepted, dropped | stored 1
console.log(on.send('ORD-1', 11 * 60 * 1000, 'a'), '| stored', on.log.length);
// accepted, stored | stored 2   (outside the 10 minute window)

const guid = makeQueue({ requiresDuplicateDetection: true });
let n = 0;
console.log(guid.send('g' + n++, 0, 'a'), '|', guid.send('g' + n++, 1000, 'a'), '| stored', guid.log.length);
// accepted, stored | accepted, stored | stored 2   (fresh id per attempt)`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A team sets <code>messageId</code> to the order id on every send and assumes retries are deduplicated. Their queue was created by a script that did not set <code>requiresDuplicateDetection</code>. Can they fix it by calling an update on the existing queue?',
    hint: 'Read the SDK note on when the setting can be changed.',
    solution: 'No. The setting can only be applied when the queue is created, and without it every send is stored, so retried sends produce duplicates. They need to create a new queue with requiresDuplicateDetection enabled, move producers and consumers to it, and until then keep consumers idempotent.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Setting messageId gives you deduplication.',
      reality: 'It only does when duplicate detection is enabled on the entity, and the ID must repeat across retries. A fresh GUID per attempt is stored every time.'
    },
    {
      thought: 'Messages that pass their time to live end up in the dead-letter queue.',
      reality: 'Only if dead-lettering on message expiration is enabled. Otherwise they are deleted.'
    },
    {
      thought: 'You can turn sessions on for an existing queue when ordering becomes a problem.',
      reality: 'requiresSession is fixed at creation, and once it is on every message must carry a session id.'
    }
  ];
}
