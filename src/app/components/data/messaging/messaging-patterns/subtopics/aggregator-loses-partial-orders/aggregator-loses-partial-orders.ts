import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-mp-aggregator',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './aggregator-loses-partial-orders.html',
  styleUrl: './aggregator-loses-partial-orders.scss'
})
export class AggregatorLosesPartialOrdersSubtopic {
  topicLabel = 'Enterprise Messaging Patterns';
  topicRoute = '/messaging/messaging-patterns';

  theory: TheoryPoint[] = [
    {
      heading: 'Two ways the Aggregator challenge loses an order',
      points: [
        'The Message Aggregator challenge keeps partial orders in an in-memory <code>pending</code> Map and a timer emits an order once no item has arrived for five seconds. The consumer uses the default auto-commit, so kafkajs commits each item\'s offset as soon as the handler returns.',
        'That combination is the first hole. If the process crashes while an order is still in the Map, the items it was holding are already committed. On restart the consumer resumes after them, the Map is empty, and the order is never emitted.',
        'The second hole was in the flush loop. It called <code>pending.delete(orderId)</code> and then <code>await producer.send(...)</code>. If the send throws, the order is already gone from the Map, so it is lost with no retry.'
      ]
    },
    {
      heading: 'What the fixes are, and what they are not',
      points: [
        'Deleting only after a successful send means a failed send is retried on the next tick. The flush loop also skips a pass while the previous one is still sending, so one slow send is not started twice.',
        'The crash hole is a design limit of this demo, not something one line fixes. The real options are a state store that survives restarts (Kafka Streams keeps aggregation state in a changelog topic) or committing offsets only after the order has been emitted, so a restart replays the items.',
        'The demo also relies on every item of an order reaching the same consumer, which needs the <code>order-items</code> topic keyed by <code>orderId</code>. The example now says so in a comment.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: what a crash leaves behind',
      language: 'typescript',
      code: `const log = [{ order: 'A', item: 'i1' }, { order: 'A', item: 'i2' }];

// The consumer had read both items when it crashed, before the idle timer emitted order A.
function afterRestart(offsetsCommitted: number) {
  const rebuilt: Record<string, string[]> = {};
  for (const r of log.slice(offsetsCommitted)) (rebuilt[r.order] ||= []).push(r.item);
  return rebuilt;
}

console.log(JSON.stringify(afterRestart(2)));  // {}                          auto-commit: both items already committed, order A is lost
console.log(JSON.stringify(afterRestart(0)));  // {"A":["i1","i2"]}           commit only after emit: the items are replayed

// The flush loop: delete before send vs delete after send, when the send fails
const before = new Map([['A', ['i1']]]);
before.delete('A');        // ...then producer.send() throws
console.log([...before.keys()]);  // []      the order is gone, nothing will retry it

const after = new Map([['A', ['i1']]]);
// producer.send() throws here, so the delete never runs
console.log([...after.keys()]);   // ['A']   the next tick tries again`
    },
    {
      label: 'The fixed flush loop',
      language: 'typescript',
      code: `let flushing = false;               // do not start a new pass while the last one is still sending
setInterval(async () => {
  if (flushing) return;
  flushing = true;
  try {
    const now = Date.now();
    for (const [orderId, state] of [...pending.entries()]) {
      if (now - state.lastSeen >= IDLE_MS) {
        try {
          await producer.send({
            topic: 'completed-orders',
            messages: [{ key: orderId, value: JSON.stringify({ orderId, items: state.items }) }],
            acks: -1,
          });
          pending.delete(orderId);   // only after the send succeeded, so a failed send is retried next tick
        } catch (err) {
          console.error('Failed to emit order, will retry', orderId, err);
        }
      }
    }
  } finally {
    flushing = false;
  }
}, 1000);`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'The Aggregator consumes with auto-commit and keeps partial orders in memory. The process is killed while order A is still waiting for its idle timeout. Why is order A never emitted after the restart, and name two designs that would avoid the loss.',
    hint: 'What offset does the restarted consumer resume from, and what does the in-memory Map contain?',
    solution: 'Auto-commit already committed the offsets of A\'s items as they arrived, so the restarted consumer resumes after them, and the in-memory Map that held the items is gone. Order A is never completed. Avoid it by keeping aggregation state in something that survives a restart (a Kafka Streams state store backed by a changelog topic, or a database), or by committing offsets only after the order has been emitted so a restart replays the items.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Auto-commit only commits messages my handler has finished, so nothing can be lost.',
      reality: 'It commits offsets when the handler returns. An aggregator handler returns as soon as it stores the item in memory, so the offset is committed while the order is still incomplete.'
    },
    {
      thought: 'Deleting the entry first is harmless, because the loop will try again anyway.',
      reality: 'Once the entry is gone there is nothing left to try. Delete after the send succeeds, so a failure leaves the order in the Map for the next tick.'
    },
    {
      thought: 'An in-memory Map is fine for an aggregator as long as the timer is correct.',
      reality: 'It is fine for a demo. A real aggregator needs state that survives a restart, or offset commits tied to emission.'
    }
  ];
}
