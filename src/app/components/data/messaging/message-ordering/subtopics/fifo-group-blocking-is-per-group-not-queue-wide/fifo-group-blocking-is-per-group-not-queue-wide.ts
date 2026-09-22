import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-order-fifo-hol',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './fifo-group-blocking-is-per-group-not-queue-wide.html',
  styleUrl: './fifo-group-blocking-is-per-group-not-queue-wide.scss'
})
export class FifoGroupBlockingIsPerGroupNotQueueWideSubtopic {
  topicLabel = 'Message Ordering';
  topicRoute = '/messaging/message-ordering';

  theory: TheoryPoint[] = [
    {
      heading: 'A Stuck Message Blocks Its Own Group -- and Only Its Own Group',
      points: [
        'The main page\'s own quiz already states this precisely: a message that is in flight (received but not yet deleted, or still within its visibility timeout) blocks delivery of the NEXT message in the SAME MessageGroupId, but other groups continue delivering independently.',
        'This is exactly what makes MessageGroupId a genuine per-entity ordering mechanism rather than a queue-wide one -- an order that is one order ID gets its own private FIFO lane, and a slow or failing consumer for THAT order never blocks a completely different order from proceeding.',
        'This blocking is not an edge case or a failure mode -- it is the mechanism SQS FIFO relies on to guarantee strict per-group order at all. Without it, two consumers could pull two messages from the same group at once and process them out of order.'
      ]
    },
    {
      heading: 'The Practical Caveat: a Large Backlog in One Group Can Still Slow Others',
      points: [
        'AWS documents a real, practical limit behind the "independent groups" guarantee: FIFO queues scan a bounded window of the queue (the first available messages) to determine which groups currently have deliverable messages.',
        'If one MessageGroupId accumulates a very large backlog -- because its consumer is stuck, or its own producer is unusually fast -- messages belonging to OTHER groups that were sent later can end up starved of visibility in that scan window, even though the ordering GUARANTEE for those other groups is technically untouched.',
        'The practical fix AWS itself documents is the same one this hub\'s general architecture guidance already leans toward: keep each MessageGroupId\'s own backlog bounded, and alert on a stuck or slow consumer for any single group rather than assuming "other groups are unaffected" covers every real-world consequence.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: per-group blocking, independent delivery',
      language: 'typescript',
      code: `// Simplified model of SQS FIFO's per-group in-flight blocking.

interface QueuedMessage { id: string; body: string; }

class FifoQueue {
  private groups = new Map<string, QueuedMessage[]>();
  private inFlight = new Map<string, string | null>();

  send(groupId: string, id: string, body: string) {
    if (!this.groups.has(groupId)) this.groups.set(groupId, []);
    this.groups.get(groupId)!.push({ id, body });
  }

  // Delivers up to one message per group that has nothing currently in flight.
  receive(): Array<{ groupId: string } & QueuedMessage> {
    const delivered: Array<{ groupId: string } & QueuedMessage> = [];
    for (const [groupId, queue] of this.groups) {
      if (this.inFlight.get(groupId)) continue; // this group is blocked
      if (queue.length === 0) continue;
      const msg = queue.shift()!;
      this.inFlight.set(groupId, msg.id);
      delivered.push({ groupId, ...msg });
    }
    return delivered;
  }

  deleteMessage(groupId: string, id: string) {
    if (this.inFlight.get(groupId) === id) this.inFlight.set(groupId, null);
  }
}

const queue = new FifoQueue();
queue.send('ORD-A', 'a1', 'created');
queue.send('ORD-A', 'a2', 'paid');
queue.send('ORD-B', 'b1', 'created');
queue.send('ORD-B', 'b2', 'paid');

console.log('Poll 1:', queue.receive());
// Both groups deliver their first message -- independent, parallel.

console.log('Poll 2 (a1 never deleted -- simulating a stuck consumer):', queue.receive());
// ORD-A delivers NOTHING (a1 still in flight, blocking a2).
// ORD-B delivers b2 -- completely unaffected by ORD-A being stuck.

queue.deleteMessage('ORD-A', 'a1');
console.log('Poll 3 (a1 finally deleted):', queue.receive());
// NOW a2 delivers.`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A team assumes that because different MessageGroupIds are delivered independently, they can safely send tens of thousands of messages under ONE customer\'s MessageGroupId (batching all of that customer\'s activity into a single group for simplicity) without affecting any other customer\'s messages. Is that assumption fully safe?',
    hint: 'Consider the difference between the ORDERING guarantee (which really is per-group) and how SQS actually finds which groups have deliverable messages in the first place.',
    solution: 'The ordering guarantee itself is safe -- other customers\' groups are never blocked from delivering their own messages just because one group has a backlog. But it is not fully safe in practice: AWS documents that FIFO queues scan a bounded window of the queue to determine which groups currently have available messages, and a very large backlog concentrated in one group can push other groups\' later messages out of that scan window, delaying their visibility even though nothing about their own ordering guarantee changed. The safer design keeps each group\'s backlog bounded rather than relying on the "independent groups" guarantee to cover every consequence of an unbounded one.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If one MessageGroupId gets stuck, the entire FIFO queue stops delivering messages for every group.',
      reality: 'Only the STUCK group is blocked. Other MessageGroupIds continue delivering their own messages completely independently -- this per-group isolation is what makes MessageGroupId a usable per-entity ordering mechanism at all.'
    },
    {
      thought: 'A large backlog in one MessageGroupId can never affect delivery of messages in a different group, since the ordering guarantee is per-group.',
      reality: 'The ordering GUARANTEE is per-group and holds regardless. But AWS documents a practical caveat: a very large single-group backlog can push OTHER groups\' messages outside the bounded window FIFO scans to find deliverable messages, delaying (not reordering) their visibility.'
    },
    {
      thought: 'The fix for a stuck consumer blocking its own MessageGroupId is to increase MaxNumberOfMessages so more messages get pulled at once.',
      reality: 'Increasing the receive batch size does not unstick a group -- only deleting the in-flight message (or letting its visibility timeout expire and handling the redelivery) frees that group\'s single in-flight slot to deliver its next message.'
    }
  ];
}
