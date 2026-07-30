import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './save-then-publish-has-a-dual-write-bug.html',
  styleUrl: './save-then-publish-has-a-dual-write-bug.scss'
})
export class SaveThenPublishHasADualWriteBugSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The theory names the problem; the codeTab quietly commits it',
      points: [
        'This page\'s own theory section states it directly: "The outbox pattern is the standard mechanism for reliably publishing domain events alongside a database transaction, avoiding the dual-write problem where the aggregate\'s state change and its corresponding event publish could otherwise fall out of sync."',
        'The "Saving & Publishing Events" codeTab does exactly the thing that warning describes: <code>await this.orders.save(order);</code> followed by a SEPARATE <code>await this.events.publishAll(order.domainEvents);</code> — two independent operations against two independent systems (the database, then the message broker), with no shared transaction across them.',
        'The codeTab\'s own comment even labels this "RIGHT" — which is true about ORDERING (publish after commit, never before an uncommitted change) but says nothing about the durability gap that remains even with the ordering correct.',
      ]
    },
    {
      heading: 'What actually goes wrong, concretely',
      points: [
        'Trace the failure case: <code>orders.save(order)</code> succeeds and commits — the order now genuinely exists, placed, in the database. Then <code>events.publishAll(...)</code> throws, because the message broker was briefly unreachable.',
        'At this point the order is placed, correctly and permanently, but the <code>OrderPlacedEvent</code> was never delivered to anyone. Nothing in the handler retries the publish, and <code>order.clearDomainEvents()</code> is never reached (it comes after the throwing line), so the event is not just delayed — it is gone.',
        'Every downstream consumer that depended on that event (inventory reservation, loyalty points, order-confirmation emails — see this hub\'s own Event-Driven Architecture topic) simply never hears about this order. The failure is silent: the order-placement API call itself may even have already returned success to the caller before the publish step ran.',
        'This is not a rare, exotic failure — brief broker unavailability, a deploy-time restart of the message broker, or a network blip between the app and the broker are all common, expected conditions in production. A pattern that only works when neither database write nor broker publish ever fails is not durable.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Tracing exactly where the event gets lost',
      language: 'typescript',
      code: `async handle(cmd: PlaceOrderCommand): Promise<string> {
  const order = new Order(generateId(), cmd.customerId);
  // ... build the order ...
  order.place(); // raises OrderPlacedEvent internally, held in memory only

  await this.orders.save(order);
  // <-- AT THIS EXACT POINT: the order is permanently committed to the
  //     database. order.domainEvents still holds OrderPlacedEvent, but
  //     ONLY in this process's memory -- nothing durable has recorded
  //     that an event needs to be published yet.

  await this.events.publishAll(order.domainEvents);
  // <-- If THIS throws (broker down, timeout, network partition), the
  //     function exits here. The order stays placed. The event that
  //     was supposed to announce it is gone -- there is no outbox row,
  //     no retry queue, nothing durable holding a record of it.
  //     A caller who already got a 200 OK response has no idea
  //     anything went wrong.

  order.clearDomainEvents(); // never reached if publishAll() threw
  return order.id;
}

// The bug is structural, not a missing try/catch: even wrapping
// publishAll() in a retry loop only narrows the window -- it does not
// close it, because the event's ONLY record still lives in process
// memory, not in anything that survives a crash between the two awaits.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate proposes fixing this by wrapping <code>this.events.publishAll(order.domainEvents)</code> in a try/catch with 3 retries before giving up. Does this close the gap?',
    hint: 'If the process crashes (not just a slow broker) between the save() and the retries finishing, what happens to the event held only in memory?',
    solution: 'It narrows the window but does not close it. Retries help with the common case (a transient broker hiccup that resolves within a few attempts), but they do nothing for a harder failure: if the PROCESS ITSELF crashes or is killed (an out-of-memory kill, a deploy restart, the pod being rescheduled) at any point between the successful <code>orders.save(order)</code> and the retries completing, the in-memory <code>order.domainEvents</code> array is gone -- there was never anything DURABLE recording that this event needed to be sent. No amount of retrying inside the same process protects against the process not surviving long enough to retry. Closing the gap for real requires making the event\'s existence durable in the SAME transaction as the order save itself -- which is exactly what the Outbox Pattern subtopic covers next.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'As long as you publish the event AFTER the database commit (not before), the "dual-write problem" this page\'s theory names does not apply.',
      reality: 'Per this subtopic\'s theory, publishing after commit only fixes the ORDERING half of the problem (never announcing an uncommitted change) — it does nothing for the DURABILITY half, since the publish step can still fail independently and lose the event forever.'
    },
    {
      thought: 'Wrapping the publish call in a try/catch with retries is enough to make this pattern reliable.',
      reality: 'Per this subtopic\'s theory, retries only help with transient failures the SAME process survives long enough to recover from — a process crash between the save and a successful publish still loses the event, since it was only ever held in memory.'
    },
    {
      thought: 'This codeTab\'s own "RIGHT" comment means the pattern shown has no remaining correctness issues.',
      reality: 'Per this subtopic\'s theory, "RIGHT" there specifically means correct ordering relative to the transaction commit — it does not claim the pattern is durable against a failure between the two separate operations, which this page\'s own theory names as the dual-write problem one section later.'
    }
  ];
}
