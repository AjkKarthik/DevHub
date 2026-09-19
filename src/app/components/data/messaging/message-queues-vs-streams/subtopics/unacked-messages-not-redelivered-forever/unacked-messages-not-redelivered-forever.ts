import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-mqs-unacked',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './unacked-messages-not-redelivered-forever.html',
  styleUrl: './unacked-messages-not-redelivered-forever.scss'
})
export class UnackedMessagesNotRedeliveredForeverSubtopic {
  topicLabel = 'Queues vs Event Streams';
  topicRoute = '/messaging/message-queues-vs-streams';

  theory: TheoryPoint[] = [
    {
      heading: 'When an unacked message really comes back',
      points: [
        'The main page said a consumer that never acks makes the message "redelivered forever" and that the broker re-queues it "after consumer timeout". For RabbitMQ neither is right. Per the RabbitMQ consumers guide, unacknowledged deliveries are requeued when the channel closes.',
        'A healthy, connected consumer that simply forgets to ack is not redelivered to. The message stays in the unacknowledged state and keeps occupying one of the consumer\'s prefetch slots.',
        'Since RabbitMQ 3.8.15 a delivery acknowledgement timeout (default 30 minutes) closes the channel with a <code>PRECONDITION_FAILED</code> error when a delivery stays unacked too long. Closing the channel is what requeues every unacked delivery on it, and they are then processed again.'
      ]
    },
    {
      heading: 'The real cost of a missing ack',
      points: [
        'With <code>prefetch(1)</code> a consumer that never acks receives exactly one message and then goes quiet: the broker will not send another until a slot frees up. The queue backs up while the worker looks alive.',
        'Duplicates appear later, when the channel finally closes (a deploy, a network blip, or the 30-minute timeout) and everything unacked is requeued at once.',
        'SQS works differently: there is no channel. A received message is hidden for the visibility timeout (default 30 seconds) and becomes visible again if it was not deleted in time, so an SQS consumer that forgets to delete does get redeliveries.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: who gets it back, and when',
      language: 'typescript',
      code: `interface Situation { connected: boolean; minutesUnacked: number; }

function rabbitFate(s: Situation, ackTimeoutMin = 30): string {
  if (!s.connected) return 'channel closed -> requeued and redelivered';
  if (s.minutesUnacked >= ackTimeoutMin)
    return 'ack timeout closes channel (PRECONDITION_FAILED) -> requeued and redelivered';
  return 'still unacknowledged -> NOT redelivered, holds a prefetch slot';
}

function sqsFate(secondsUnacked: number, visibilitySec = 30): string {
  return secondsUnacked >= visibilitySec
    ? 'visibility timeout elapsed -> visible again, redelivered'
    : 'hidden (in flight)';
}

console.log(rabbitFate({ connected: true,  minutesUnacked: 5 }));
// still unacknowledged -> NOT redelivered, holds a prefetch slot
console.log(rabbitFate({ connected: true,  minutesUnacked: 31 }));
// ack timeout closes channel (PRECONDITION_FAILED) -> requeued and redelivered
console.log(rabbitFate({ connected: false, minutesUnacked: 1 }));
// channel closed -> requeued and redelivered
console.log(sqsFate(45));
// visibility timeout elapsed -> visible again, redelivered`
    },
    {
      label: 'Model: the prefetch stall',
      language: 'typescript',
      code: `// How many of 10 messages does a consumer receive if it never acks?
function delivered(prefetch: number, neverAcks: boolean): number {
  let inflight = 0, count = 0;
  for (let i = 0; i < 10; i++) {
    if (inflight < prefetch) {
      inflight++;
      count++;
      if (!neverAcks) inflight--;   // an ack frees the slot
    }
  }
  return count;
}

console.log(delivered(1, true));   // 1  -> the consumer stalls after one message
console.log(delivered(1, false));  // 10 -> acking keeps the queue draining
console.log(delivered(3, true));   // 3  -> a bigger prefetch only delays the stall`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A RabbitMQ worker uses <code>prefetch(5)</code> and has a bug that forgets to ack messages for one particular order type. The queue depth slowly climbs, but no message is ever redelivered while the worker runs. Then the worker is restarted during a deploy. What happens, and why did nothing happen before the restart?',
    hint: 'What event requeues unacknowledged deliveries, and what does an unacked message do to the consumer prefetch limit?',
    solution: 'Each unacked message permanently occupies one of the five prefetch slots, so after five such messages the worker stops receiving anything and the queue depth climbs. Nothing is redelivered while the channel stays open. When the worker restarts, the channel closes and RabbitMQ requeues all the unacked deliveries, so those orders are processed again, possibly for a second time. Fix the missing ack and keep handlers idempotent.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If a RabbitMQ consumer never acks, the broker keeps redelivering the message to it.',
      reality: 'Not while the channel is open. The message stays unacknowledged and holds a prefetch slot. It is requeued only when the channel closes, including when the 30-minute delivery acknowledgement timeout closes it.'
    },
    {
      thought: 'RabbitMQ and SQS both redeliver after a timeout, so they behave the same.',
      reality: 'SQS hides a received message for the visibility timeout (default 30 seconds) and then redelivers it. RabbitMQ has no per-message timer: it requeues on channel close, and its acknowledgement timeout closes the whole channel after 30 minutes by default.'
    },
    {
      thought: 'A larger prefetch means a missing ack is harmless.',
      reality: 'It only delays the stall. Every unacked message still holds a slot permanently, so the consumer eventually runs out of slots.'
    }
  ];
}
