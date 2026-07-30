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
  templateUrl: './choreography-never-handled-stock-failure.html',
  styleUrl: './choreography-never-handled-stock-failure.scss'
})
export class ChoreographyNeverHandledStockFailureSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A published event with no subscriber anywhere in the example',
      points: [
        'The "Choreography Pattern" codeTab\'s Inventory Service step publishes TWO possible outcomes: <code>stock.reserved</code> on success, or <code>stock.reservation.failed</code> on failure. The Payment Service subscribes to <code>stock.reserved</code>. But nothing in the entire codeTab ever subscribes to <code>stock.reservation.failed</code>.',
        'Compare this to the OTHER failure path shown in the same codeTab: <code>payment.failed</code> DOES have a subscriber (step 4) that releases the stock, cancels the order, and publishes <code>order.cancelled</code>. The stock-reservation-failure path was simply never given the same treatment.',
        'The practical consequence: if stock reservation fails, that event is published into the void — the order stays in whatever state <code>placeOrder()</code> left it in (created, but never confirmed or cancelled) forever, with no compensating action ever triggered.',
      ]
    },
    {
      heading: 'Why this is exactly the failure mode this page\'s own theory warns about',
      points: [
        'The page\'s "Debugging and Observability for Choreographed Sagas" theory section says: "A saga that fails partway through... can be genuinely difficult to detect in a purely choreographed design, since no single component has visibility into the full expected sequence of steps." The missing subscriber is a concrete, in-the-wild instance of exactly this — a saga stalling silently with no compensation and no alert.',
        'This is a self-contained catch: no external research needed, just checking that every event a choreography example PUBLISHES also has at least one SUBSCRIBER somewhere in the same example — the same "does every declared name have a matching use" discipline already applied elsewhere in this hub, here applied to event names instead of class members or types.',
        'The fix adds a subscriber for <code>stock.reservation.failed</code> that cancels the order (there\'s nothing to release, since the reservation never succeeded) — bringing the example\'s handling of BOTH possible Inventory Service outcomes to parity, matching how the Payment Service\'s failure path was already handled.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Both failure paths need a subscriber, not just one',
      language: 'typescript',
      code: `// Inventory Service can publish EITHER of two outcomes:
broker.subscribe('orders.placed', async (e) => {
  const reserved = await inventoryRepo.reserve(e.items);
  if (reserved) {
    await broker.publish('stock.reserved', { orderId: e.orderId, customerId: e.customerId });
  } else {
    await broker.publish('stock.reservation.failed', { orderId: e.orderId, reason: 'Insufficient stock' });
    // BEFORE THE FIX: nothing anywhere subscribes to this event.
    // The order stays "placed" forever -- no cancellation, no alert.
  }
});

// Payment Service's failure path WAS correctly handled:
broker.subscribe('payment.failed', async (e) => {
  await inventoryRepo.release(e.orderId);
  await orderRepo.cancel(e.orderId);
  await broker.publish('order.cancelled', { orderId: e.orderId, reason: 'Payment failed' });
});

// THE FIX -- give stock.reservation.failed the same treatment.
// No release needed here (the reservation never succeeded in the
// first place), but the order still needs to be cancelled and the
// customer/system still needs to know why:
broker.subscribe('stock.reservation.failed', async (e) => {
  await orderRepo.cancel(e.orderId);
  await broker.publish('order.cancelled', { orderId: e.orderId, reason: e.reason });
});`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate reviewing this choreography example says "it\'s fine -- Inventory Service correctly checks stock and publishes the right event either way, so the choreography is complete." Do you agree?',
    hint: 'Publishing the correct event is only half of choreography -- what\'s the other half that has to exist for EVERY event a saga step might publish?',
    solution: 'Not quite -- publishing the correct event is necessary but not sufficient. In a choreographed saga, EVERY event a step might publish needs at least one subscriber somewhere that reacts to it, or the saga has an unhandled path. Inventory Service correctly publishes stock.reservation.failed on failure, but before the fix, nothing in the system ever subscribed to it -- meaning the event was published correctly and then simply ignored. The saga would silently stall with the order left in limbo. "Publishes the right event" and "the saga actually handles that outcome" are two different claims, and only checking the publisher side (as the teammate did) misses exactly this gap.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If a service correctly checks a condition and publishes the appropriate event for each outcome, the choreography for that step is complete.',
      reality: 'Per this subtopic\'s theory, publishing the correct event is only the producer\'s half of choreography — every published event also needs a consumer somewhere that reacts to it, or that outcome is effectively unhandled by the saga.'
    },
    {
      thought: 'This kind of gap (a failure event with no subscriber) is rare, since a saga\'s failure paths usually get as much design attention as its happy path.',
      reality: 'Per this subtopic\'s theory, this exact page\'s own example demonstrates it happening in practice — one failure path (payment.failed) was fully handled while the other (stock.reservation.failed), published in the very next line of the same function, was not.'
    },
    {
      thought: 'A choreographed saga stalling because of a missing subscriber would be immediately obvious in production, so it\'s not a serious risk in practice.',
      reality: 'Per this subtopic\'s theory, this page\'s own "Debugging and Observability" section explains why the opposite is true — with no central coordinator tracking expected steps, a stalled saga can be genuinely difficult to detect until a customer complains or someone manually audits stuck orders.'
    }
  ];
}
