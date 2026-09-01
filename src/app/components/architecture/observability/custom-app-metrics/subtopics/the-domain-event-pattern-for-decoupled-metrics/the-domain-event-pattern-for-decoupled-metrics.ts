import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'From "Import the Metrics Module" to Business Code That Never Imports It At All',
    points: [
      'The main page names TWO different decoupling techniques in its "Instrumenting Without Framework Coupling" theory section: a metrics abstraction layer (business code imports a thin <code>IMetrics</code> module instead of prom-client directly) and a domain event pattern ("emit structured domain events (OrderPlaced, PaymentFailed) from business code, and convert them to metrics in an event listener. Keeps business logic clean and makes it easy to add new metrics later"). Both codeTabs on the page demonstrate only the FIRST — business code still calls <code>metrics.incrementCounter(...)</code> directly, one import away from Prometheus.',
      'The domain-event pattern goes one step further: business code doesn’t call anything metrics-related AT ALL. It emits a plain, named event describing WHAT HAPPENED (<code>OrderPlaced</code>, <code>PaymentFailed</code>) with whatever data is relevant to the business, and a completely separate listener module — the only file in the codebase that imports prom-client — decides how to turn that into a counter increment.',
      'Verified end-to-end via a real EventEmitter and real prom-client: emitting <code>OrderPlaced</code>/<code>PaymentFailed</code> events from a <code>placeOrder()</code> function that never references any metric object correctly increments the matching Prometheus counters, confirmed by scraping <code>register.metrics()</code> afterward.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Domain Events → Metrics, Verified',
    language: 'typescript',
    code: `import { EventEmitter } from 'events';
import { Counter, register } from 'prom-client';

// ── domain-events.ts -- shared by the whole app, knows NOTHING about metrics ──
export const domainEvents = new EventEmitter();

// ── order-service.ts -- business logic, ALSO knows nothing about metrics ──
async function placeOrder(cart: { type: string; channel: string; paymentWillFail?: boolean }) {
  // ... real order-creation logic would go here ...
  domainEvents.emit('OrderPlaced', { orderType: cart.type, channel: cart.channel });

  if (cart.paymentWillFail) {
    domainEvents.emit('PaymentFailed', { provider: 'stripe', reason: 'card_declined' });
    throw new Error('payment failed');
  }
  return { id: 'order-1' };
}

// ── metrics/domain-event-listener.ts -- the ONLY file that imports prom-client ──
const ordersPlaced = new Counter({
  name: 'orders_placed_total',
  help: 'Total orders placed',
  labelNames: ['order_type', 'channel'],
});
const paymentFailures = new Counter({
  name: 'payment_failures_total',
  help: 'Total payment failures',
  labelNames: ['provider', 'reason'],
});

domainEvents.on('OrderPlaced', evt => {
  ordersPlaced.inc({ order_type: evt.orderType, channel: evt.channel });
});
domainEvents.on('PaymentFailed', evt => {
  paymentFailures.inc({ provider: evt.provider, reason: evt.reason });
});

// ── run it ──
(async () => {
  try { await placeOrder({ type: 'subscription', channel: 'web' }); } catch {}
  try { await placeOrder({ type: 'one-time', channel: 'mobile', paymentWillFail: true }); } catch {}

  const text = await register.metrics();
  console.log(text.split('\\n').filter(l =>
    l.startsWith('orders_placed_total') || l.startsWith('payment_failures_total')
  ).join('\\n'));
})();
// -> orders_placed_total{order_type="subscription",channel="web"} 1
// -> orders_placed_total{order_type="one-time",channel="mobile"} 1
// -> payment_failures_total{provider="stripe",reason="card_declined"} 1`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'Business code has a typo: it emits <code>domainEvents.emit(&#39;OrderPlace&#39;, ...)</code> — missing the trailing "d" — instead of the correctly-spelled <code>&#39;OrderPlaced&#39;</code> the listener subscribes to with <code>domainEvents.on(&#39;OrderPlaced&#39;, ...)</code>. What happens when <code>placeOrder()</code> runs?',
  hint: 'EventEmitter dispatches purely by matching the string event NAME — there is no compile-time check anywhere that a listener actually exists for every event a caller emits.',
  solution: `// The function runs to completion with ZERO errors thrown anywhere.
// domainEvents.emit('OrderPlace', ...) simply finds no listeners
// registered for that exact string and silently does nothing --
// EventEmitter.emit() returns false (no listeners were called) rather
// than throwing.
//
// The counter that should have incremented (orders_placed_total)
// simply never does -- there is no error, no warning, no failed
// request. The only symptom is a metric that quietly stops moving,
// discoverable only by noticing the dashboard looks wrong.
//
// This is the real cost of the domain-event pattern's own decoupling:
// the metrics abstraction layer from the previous subtopic would have
// thrown a genuine TypeScript compile error for a typo'd METHOD name
// (metrics.incremenCounter(...) simply wouldn't exist on the IMetrics
// interface) -- but a typo'd STRING event name is invisible to the
// type checker entirely, since 'OrderPlace' and 'OrderPlaced' are both
// just valid strings as far as TypeScript is concerned.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'The domain-event pattern is strictly an upgrade over the metrics abstraction layer from the previous subtopic — it decouples business code from metrics even further, so it should be preferred everywhere.',
    reality: 'The Try It above demonstrates the real cost of that extra decoupling: a typo in an event NAME (a plain string) produces a silent, zero-error failure that a typo in an abstraction-layer METHOD name never could, since TypeScript checks method names on an interface but has no way to check that an emitted event string matches a listener’s subscribed string. Decoupling trades compile-time safety for looser coupling — which one is "better" depends on how much that trade is worth for a given codebase.',
  },
  {
    thought: 'Since the listener module is the only file that imports prom-client, moving from prom-client to OpenTelemetry metrics (as the main page’s own QnA recommends for new projects) would require rewriting the listener but nothing else in the codebase.',
    reality: 'That’s exactly right, and it’s the whole point of BOTH decoupling patterns on this page — but it’s worth confirming precisely: business code (<code>placeOrder()</code>, <code>domainEvents.emit(...)</code>) never imports prom-client at all, so a metrics-backend migration is scoped entirely to the listener file, with zero changes needed anywhere business logic lives.',
  },
  {
    thought: 'Since the listener subscribes with <code>domainEvents.on(...)</code>, multiple different listeners could all react to the same <code>OrderPlaced</code> event for different purposes (metrics, a downstream cache invalidation, an email notification) without any of them knowing about each other.',
    reality: 'This is correct and is a genuine additional benefit beyond metrics decoupling specifically — Node’s <code>EventEmitter</code> supports any number of independent listeners per event name out of the box, so a metrics listener, a logging listener, and a notification listener could all subscribe to the identical <code>OrderPlaced</code> event with zero coordination between them, each entirely unaware the others exist.',
  },
];

@Component({
  selector: 'app-obs-custom-metrics-domain-event-pattern',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-domain-event-pattern-for-decoupled-metrics.html',
  styleUrl: './the-domain-event-pattern-for-decoupled-metrics.scss',
})
export class TheDomainEventPatternForDecoupledMetricsSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
