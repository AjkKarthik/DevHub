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
  templateUrl: './fat-events-staleness-risk-made-concrete.html',
  styleUrl: './fat-events-staleness-risk-made-concrete.scss'
})
export class FatEventsStalenessRiskMadeConcreteSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The page names the staleness risk but never shows it happening',
      points: [
        'The page\'s "Event Notification vs. Event-Carried State Transfer" theory bullet says event-carried state transfer "risks... needing to handle potentially stale data if the source has since changed" — accurate, but abstract. No code sample on the page ever shows a consumer actually acting on stale embedded data.',
        'The concrete failure mode: a fat event carries a snapshot of the source entity AT THE MOMENT IT WAS PUBLISHED. If the source entity changes again before a consumer processes that event — which is entirely possible with any processing delay, a consumer restart, or a backlog — the consumer is working from data that no longer matches the source\'s current state, with no signal in the event itself that anything is wrong.',
        'This is fundamentally different from the page\'s own, already-covered idempotency problem (duplicate delivery of the SAME event) — staleness is about a consumer correctly processing a genuine, non-duplicate event whose EMBEDDED DATA has simply aged past validity by the time it\'s handled.',
      ]
    },
    {
      heading: 'A concrete scenario where this actually bites',
      points: [
        'Consider a fat <code>OrderPlacedEvent</code> that embeds the customer\'s shipping address at publish time. If the customer updates their address in the few seconds between the order being placed and a slow-to-catch-up Shipping Service consumer processing that event, the Shipping Service ships to the address embedded in the event — not the customer\'s current address.',
        'A thin event (just an order ID) would have forced the Shipping Service to fetch the CURRENT address at processing time via a callback — slower and creates the source-availability dependency the page\'s theory already names as thin events\' own tradeoff, but it would have gotten the right address.',
        'Neither choice is universally correct — this is exactly the "real design tradeoff" the page\'s own theory bullet names, illustrated concretely: fat events trade correctness-at-processing-time for availability and decoupling; thin events trade a runtime dependency for always reading current data.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The same staleness gap, shown two ways',
      language: 'typescript',
      code: `interface OrderPlacedFatEvent {
  id: string;
  data: {
    orderId: string;
    customerId: string;
    // Fat: shipping address embedded AT PUBLISH TIME
    shippingAddress: { street: string; city: string; zip: string };
  };
}

// If the customer updates their address AFTER this event is published but
// BEFORE a consumer processes it, the consumer never finds out --
// shippingAddress reflects a moment in the past, not "now."
async function shipOrderFat(event: OrderPlacedFatEvent) {
  await shippingProvider.createLabel(event.data.orderId, event.data.shippingAddress);
  // Ships to whatever address the event happened to capture at publish
  // time -- correct only if nothing changed in between.
}

// Thin equivalent -- fetches the CURRENT address at processing time
interface OrderPlacedThinEvent {
  id: string;
  data: { orderId: string; customerId: string };
}

async function shipOrderThin(event: OrderPlacedThinEvent) {
  const currentAddress = await customerService.getCurrentAddress(event.data.customerId);
  // Always reflects the customer's LATEST address, at the cost of a
  // runtime call back to Customer Service (which must be available).
  await shippingProvider.createLabel(event.data.orderId, currentAddress);
}

// A common middle ground: embed data that's genuinely IMMUTABLE once the
// order is placed (order total, line items -- these don't change after
// checkout), but fetch data that legitimately changes independently of
// the order (shipping address, payment method) at processing time.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team is deciding whether an OrderPlaced event should embed the customer\'s loyalty tier (Bronze/Silver/Gold) directly, or just the customerId with a callback to fetch it. The loyalty tier is looked up once, immediately, by a consumer that awards bonus points based on it -- and loyalty tiers only change at the START of each calendar month via a scheduled batch job. Which choice better fits this specific scenario, and why?',
    hint: 'How likely is a "stale" loyalty tier to actually cause a wrong outcome, given how rarely and predictably tier changes actually happen?',
    solution: 'Embedding the loyalty tier directly (a "fat" field) is the reasonable choice here, and it\'s a good illustration of why this is a real tradeoff, not a rule to always avoid fat events. The staleness window that matters is "time between publish and processing" versus "how often the embedded value actually changes" -- loyalty tiers change on a predictable monthly schedule, not continuously, so the odds of a consumer processing an event during the brief window where the tier is mid-transition are low, and the operational cost (an extra callback to Customer Service on every single order) buys protection against a risk that is both rare and low-consequence if it does happen. This is the opposite case from the shipping-address example, where the embedded data can legitimately change at any moment and getting it wrong has an immediate, visible consequence (a package sent to the wrong address).'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Fat events are a general anti-pattern that should be avoided in favor of thin events with callbacks, as a default rule.',
      reality: 'Per this subtopic\'s theory, the right choice depends on how often the embedded data actually changes and how costly a stale read would be — some data (order totals, line items) is genuinely immutable once published and safe to embed; other data (shipping addresses) changes independently and is riskier to embed.'
    },
    {
      thought: 'Event staleness and duplicate event delivery (the idempotency problem this page covers elsewhere) are the same underlying issue.',
      reality: 'Per this subtopic\'s theory, they are distinct problems — idempotency is about the SAME event arriving more than once; staleness is about a single, genuine, non-duplicate event carrying data that has since changed at the source by the time it\'s processed.'
    },
    {
      thought: 'A thin event with a callback always produces more "correct" behavior than a fat event, since it fetches current data.',
      reality: 'Per this subtopic\'s theory, a thin event\'s callback introduces its own tradeoff — a runtime dependency on the source service being available — and for data that rarely or predictably changes, that ongoing dependency cost may not be worth avoiding a staleness risk that\'s unlikely to matter in practice.'
    }
  ];
}
