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
  templateUrl: './the-split-brain-risk-made-concrete.html',
  styleUrl: './the-split-brain-risk-made-concrete.scss'
})
export class TheSplitBrainRiskMadeConcreteSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The mistakes block names "split-brain" once, in a code comment, and moves on',
      points: [
        'This page\'s own mistakes block states the risk directly: "New service reads data from its own DB but legacy data is never moved — split-brain." The fix given is one line: "Dual-write during migration; backfill historical data; verify consistency before cutover." Neither the wrong example nor the right example shows what split-brain actually LOOKS like when it happens.',
        'The "Facade with Feature Flags" codeTab shows <code>placeOrder()</code> routing SOME requests to <code>newOrders</code> and others to <code>legacyOrders</code> based on a feature flag — but never shows where each system\'s data actually lives, or what happens when a later request needs to read data that was written by the OTHER system.',
        'This subtopic traces exactly that: what happens to a single customer\'s order history the moment the facade starts splitting traffic, before any data migration strategy is in place.',
      ]
    },
    {
      heading: 'Tracing the split, one request at a time',
      points: [
        'Say <code>\'new-order-placement\'</code> is enabled for 25% of users (Day 14 in the page\'s own rollout comment). A given customer places three orders across three separate requests, and the feature flag happens to route the first two to <code>legacyOrders</code> and the third to <code>newOrders</code> — plausible, since a flag rollout is not sticky per-customer unless it is specifically designed to be.',
        'The customer\'s first two orders now live ONLY in the legacy database. Their third order lives ONLY in the new system\'s own database. Neither database has a complete picture of this customer\'s order history — that is split-brain, concretely: the SAME customer\'s data, split across two systems with no synchronization between them.',
        'Now the customer calls <code>getOrder()</code> for order history — but per the codeTab\'s own comment, <code>getOrder()</code> is "already fully migrated, always uses new system." It queries ONLY <code>newOrders</code>, which only has the third order. The first two orders — real, successfully placed, sitting in the legacy database — are invisible to this customer through this endpoint.',
        'No error is thrown anywhere in this sequence. Every individual write succeeded. Every individual read succeeded. The customer just silently sees an incomplete order history, because nothing in the facade\'s routing logic accounts for a single customer\'s data existing in two disconnected places at once.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Tracing one customer through the split',
      language: 'typescript',
      code: `// Same OrderServiceFacade shown on the main page -- no changes to its
// own logic. The split-brain risk is entirely about WHERE each write
// actually lands, which the facade's routing decision determines.

// Request 1 (flag: legacy for this user this time)
await facade.placeOrder({ userId: 'cust-42', items: [...] });
// --> legacyOrders.placeOrder() -- order now lives ONLY in legacy DB

// Request 2 (flag: legacy again -- not sticky per-user)
await facade.placeOrder({ userId: 'cust-42', items: [...] });
// --> legacyOrders.placeOrder() -- second order, ALSO only in legacy DB

// Request 3 (flag: new this time)
await facade.placeOrder({ userId: 'cust-42', items: [...] });
// --> newOrders.placeOrder() -- third order lives ONLY in the new
//     system's own database. cust-42's data is now split across BOTH
//     systems, with nothing syncing them.

// Customer checks their order history:
const history = await facade.getOrder('cust-42');
// getOrder() ALWAYS calls newOrders (per the main page's own comment:
// "already fully migrated, always uses new system") -- it has no idea
// legacyOrders even exists. Returns ONLY the third order.
//
// The first two orders -- real, successfully placed, sitting in the
// legacy database right now -- are invisible through this endpoint.
// No error anywhere. Every write succeeded. Every read succeeded.
// The customer's order history is just silently incomplete.

// This is exactly why the page's own "right" fix -- dual-write,
// backfill, verify consistency BEFORE cutover -- has to be in place
// BEFORE a read-path method like getOrder() is allowed to point at
// only one system. Routing writes gradually while a read endpoint
// already assumes full migration is the split-brain trap.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate proposes a "quick fix": make the feature flag STICKY per customer (once a customer is routed to the new system, always route them there). Does this close the split-brain gap on its own?',
    hint: 'What happens to the FIRST two orders this customer already placed under the legacy system, before their flag became sticky?',
    solution: 'A sticky flag prevents the gap from getting WORSE going forward -- it stops a single customer\'s FUTURE writes from continuing to split across both systems. But it does nothing about data that is ALREADY split: this customer\'s first two orders are still sitting only in the legacy database, and a getOrder() that only reads from the new system still cannot see them. Stickiness is a genuinely useful complement to a migration (it reduces how much new inconsistency accumulates), but it is not a substitute for the page\'s own stated fix -- dual-write, backfill historical data, and verify consistency BEFORE cutover -- which is specifically about reconciling data that ALREADY exists on one side, not just preventing new splits from forming.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Split-brain during a Strangler Fig migration means something is throwing errors or failing loudly enough that it would be caught quickly.',
      reality: 'Per this subtopic\'s theory, every individual write and every individual read can succeed perfectly — the failure is that no single system has a complete picture of the data, which shows up as silently incomplete results, not errors.'
    },
    {
      thought: 'A feature flag routing traffic between systems is a routing concern only, separate from data consistency — the two are independent problems.',
      reality: 'Per this subtopic\'s theory, the routing decision IS what creates the data-consistency problem in the first place — every write the flag routes to a different system than a customer\'s previous writes is exactly what splits that customer\'s data across two disconnected databases.'
    },
    {
      thought: 'Making a feature flag sticky per customer (once migrated, always migrated) fully solves the split-brain risk.',
      reality: 'Per this subtopic\'s theory, stickiness only stops the gap from growing further — it does nothing to reconcile data that was already split across both systems before the flag became sticky, which still requires the page\'s own dual-write/backfill/verify strategy.'
    }
  ];
}
