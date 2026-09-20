import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-asb-subscribe-auto',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './subscribe-auto-completes-and-renews.html',
  styleUrl: './subscribe-auto-completes-and-renews.scss'
})
export class SubscribeAutoCompletesAndRenewsSubtopic {
  topicLabel = 'Azure Service Bus';
  topicRoute = '/messaging/azure-service-bus';

  theory: TheoryPoint[] = [
    {
      heading: 'What subscribe() does for you',
      points: [
        'The two mistake blocks on the main page both used <code>receiver.subscribe({ processMessage })</code> and said the message would be redelivered if you forgot <code>completeMessage()</code>, or if processing outlasted the 60 second lock. With the default options neither happens.',
        'In the <code>@azure/service-bus</code> 7.9.5 source, the receiver calls your <code>processMessage</code> and then, if <code>autoCompleteMessages</code> is on (the default is <code>true</code>) and the message is not already settled, completes it. If the handler throws, it abandons the message, so <code>maxDeliveryCount</code> applies as usual.',
        'It also renews the message lock for you. <code>maxAutoLockRenewalDurationInMs</code> defaults to 5 minutes in the source, and setting it to <code>0</code> turns renewal off.'
      ]
    },
    {
      heading: 'Where the mistakes still apply',
      points: [
        'When you pull messages yourself with <code>receiveMessages()</code>, nothing is completed and nothing is renewed. Forgetting <code>completeMessage()</code> means the lock expires and the message comes back, and processing that outlasts the lock fails at <code>completeMessage()</code> with a lock-lost error.',
        'The same is true inside <code>subscribe()</code> if you set <code>autoCompleteMessages: false</code>, and for work that outlasts <code>maxAutoLockRenewalDurationInMs</code>.',
        'Microsoft Learn gives the limits: the lock duration defaults to 1 minute and can be set up to 5 minutes at most. It also says the lock can be lost for reasons outside your code, such as a lost connection or a service update, in which case the client sees a lock-lost error.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: settlement around processMessage',
      language: 'typescript',
      code: `// Mirrors what the SDK does around your handler (7.9.5 source).
async function subscribeOnce(handler: (m: any, r: any) => Promise<void>, { autoCompleteMessages = true } = {}) {
  const msg: any = { settled: null };
  const receiver = {
    completeMessage: async (m: any) => { if (m.settled) throw new Error('already settled'); m.settled = 'completed'; },
    abandonMessage:  async (m: any) => { m.settled = 'abandoned'; },
  };
  try { await handler(msg, receiver); }
  catch { if (!msg.settled) await receiver.abandonMessage(msg); return msg.settled; }
  if (autoCompleteMessages && !msg.settled) await receiver.completeMessage(msg);
  return msg.settled;
}

console.log('handler returns             :', await subscribeOnce(async () => {}));                       // completed
console.log('handler throws              :', await subscribeOnce(async () => { throw new Error('x'); })); // abandoned
console.log('handler completes itself    :', await subscribeOnce(async (m, r) => r.completeMessage(m)));  // completed
console.log('autoComplete false, no call :', await subscribeOnce(async () => {}, { autoCompleteMessages: false })); // null`
    },
    {
      label: 'Model: lock over a long task',
      language: 'typescript',
      code: `// lockDuration 60s. Renewal happens when half the lock has elapsed, up to autoRenewMaxMs.
function lockTimeline({ lockMs, workMs, autoRenewMaxMs }: { lockMs: number; workMs: number; autoRenewMaxMs: number }) {
  let lockedUntil = lockMs; let t = 0; let lost = false;
  while (t < workMs) {
    t += 1000;
    if (autoRenewMaxMs > 0 && t <= autoRenewMaxMs && lockedUntil - t <= lockMs / 2) lockedUntil = t + lockMs;
    if (t > lockedUntil) { lost = true; break; }
  }
  return lost ? 'lock lost at ' + (lockedUntil / 1000) + 's' : 'complete succeeds at ' + (workMs / 1000) + 's';
}

console.log(lockTimeline({ lockMs: 60000, workMs: 120000, autoRenewMaxMs: 0 }));       // receiveMessages, no renew: lock lost at 60s
console.log(lockTimeline({ lockMs: 60000, workMs: 120000, autoRenewMaxMs: 300000 }));  // subscribe, 2 min of work: complete succeeds at 120s
console.log(lockTimeline({ lockMs: 60000, workMs: 480000, autoRenewMaxMs: 300000 }));  // subscribe, 8 min of work: lock lost at 360s`
    },
    {
      label: 'Options that matter',
      language: 'typescript',
      code: `const subscription = receiver.subscribe(
  {
    processMessage: async (msg) => { await processOrder(msg.body); },   // completed for you
    processError:   async (args) => console.error(args.error),
  },
  {
    autoCompleteMessages: true,             // default
    maxAutoLockRenewalDurationInMs: 10 * 60 * 1000,   // default is 5 minutes; 0 turns renewal off
  }
);`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A handler passed to <code>subscribe()</code> with default options takes 3 minutes per message and never calls <code>completeMessage()</code>. The lock duration is 1 minute. What happens to each message?',
    hint: 'Auto-renewal covers up to 5 minutes by default, and the message is completed when the handler returns.',
    solution: 'Each message is completed. The SDK renews the lock while the handler runs, because 3 minutes is inside the default 5 minute renewal limit, and completes the message when the handler returns. If the handler took 8 minutes the lock would stop being renewed after 5 and the message would come back.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Without an explicit completeMessage() the message is always redelivered.',
      reality: 'Only when you settle messages yourself. subscribe() with the default autoCompleteMessages completes the message after the handler returns.'
    },
    {
      thought: 'A message lock lasts the 60 second default no matter what.',
      reality: 'A subscribe() handler has its lock renewed for up to 5 minutes by default. A receiveMessages() caller has to renew it by hand.'
    },
    {
      thought: 'Catching the error and calling abandonMessage() is required for retries.',
      reality: 'If the handler throws, the SDK abandons the message itself. Catching the error and returning normally instead completes the message.'
    }
  ];
}
