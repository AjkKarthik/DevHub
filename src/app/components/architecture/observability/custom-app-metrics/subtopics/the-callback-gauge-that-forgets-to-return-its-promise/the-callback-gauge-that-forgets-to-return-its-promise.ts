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
    heading: 'A Scrape Only Waits for collect() If It Returns a Promise',
    points: [
      'The main page’s own "Business Metrics" codeTab presents <code>pendingOrdersGauge</code>’s callback <code>collect()</code> as the correct, general pattern for "poll Redis/DB at scrape time, not on a fixed interval." Reading prom-client’s own <code>Gauge.get()</code> source directly confirms exactly how it decides whether to WAIT for that poll: <code>const v = this.collect(); if (v instanceof Promise) await v;</code> — the scrape only awaits <code>collect()</code>’s result if that result IS a Promise.',
      'The page’s ORIGINAL <code>collect()</code> calls <code>this.reset()</code>, then starts <code>getPendingOrders().then(...)</code> — but never <code>return</code>s that chain. A method body with no <code>return</code> statement returns <code>undefined</code>, which fails the <code>instanceof Promise</code> check, so the scrape does NOT wait for the async work to finish.',
      'Verified by running the exact pattern against real prom-client’s own <code>register.metrics()</code>: the scrape serializes the gauge in its just-<code>reset()</code> (empty) state, and the freshly-polled values land moments too late to be included — a client scraping this gauge would see it read ZERO (or its previous, stale value) forever, even though the "poll at scrape time" comment implies it’s always current.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Reproduced, Then Fixed — Verified via prom-client',
    language: 'typescript',
    code: `import { Gauge, register } from 'prom-client';

function getPendingOrders(): Promise<Record<string, number>> {
  // simulates an async Redis/DB call
  return new Promise(resolve => {
    setTimeout(() => resolve({ stripe: 7, paypal: 3 }), 50);
  });
}

// ── BROKEN: matches the main page's ORIGINAL collect() ──────────────
const brokenGauge = new Gauge({
  name: 'orders_pending_broken',
  help: 'Orders awaiting payment confirmation',
  labelNames: ['payment_provider'],
  collect() {
    this.reset();
    getPendingOrders().then(orders => {
      for (const [provider, count] of Object.entries(orders)) {
        this.labels(provider).set(count);
      }
    });
    // no return -- collect() resolves to undefined
  },
});

// ── FIXED: return the promise chain so register.metrics() awaits it ──
const fixedGauge = new Gauge({
  name: 'orders_pending_fixed',
  help: 'Orders awaiting payment confirmation',
  labelNames: ['payment_provider'],
  collect() {
    this.reset();
    return getPendingOrders().then(orders => {
      for (const [provider, count] of Object.entries(orders)) {
        this.labels(provider).set(count);
      }
    });
  },
});

async function scrapeAndCheck(metricName: string) {
  const text = await register.metrics();
  const line = text.split('\\n').find(l => l.startsWith(metricName) && l.includes('stripe'));
  return line ?? '(no stripe series present -- update landed too late)';
}

(async () => {
  console.log('broken:', await scrapeAndCheck('orders_pending_broken'));
  console.log('fixed: ', await scrapeAndCheck('orders_pending_fixed'));
})();
// -> broken: (no stripe series present -- update landed too late)
// -> fixed:  orders_pending_fixed{payment_provider="stripe"} 7`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The <code>checkoutDuration</code> histogram on the main page is recorded directly inside <code>placeOrder()</code> via <code>startTimer()</code>/<code>end()</code> — it never uses a callback <code>collect()</code> function at all. Does the "must return the promise" bug shown above apply to <code>checkoutDuration</code> too?',
  hint: 'The bug is specifically about a <code>collect()</code> callback whose async work has to finish BEFORE a scrape reads the metric — ask what triggers <code>checkoutDuration</code>’s value to be set, and when that happens relative to a scrape.',
  solution: `// No -- checkoutDuration is set SYNCHRONOUSLY via end() at the moment
// checkout completes, not lazily polled when Prometheus happens to
// scrape. There is no collect() callback on it at all, so prom-client's
// "only await collect() if it returns a Promise" logic never comes into
// play -- by the time ANY scrape runs, the histogram already holds
// whatever values end() has recorded so far.
//
// The bug is specific to the "poll external state at scrape time"
// pattern -- a callback gauge querying Redis/a DB/another service for
// its current value ON DEMAND, right when Prometheus asks for it. A
// directly-recorded metric (a counter .inc()'d or a histogram
// .observe()'d/timed inline in business code, exactly like every OTHER
// metric on the main page) has no async gap between "the value changes"
// and "the value is available to a scrape" -- there's nothing to await.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since <code>getPendingOrders()</code> resolves in well under a second, the timing gap is negligible in practice — the gauge would still show roughly-correct values most of the time.',
    reality: 'The direct test above shows the opposite: the scrape reads the gauge in its just-<code>reset()</code> EMPTY state every single time, not a slightly-stale-but-close value. <code>register.metrics()</code> serializes the response the instant <code>collect()</code> returns — since the broken version returns <code>undefined</code> immediately (before the async work even starts resolving), the reset always wins the race, regardless of how fast <code>getPendingOrders()</code> actually is.',
  },
  {
    thought: 'Calling <code>this.reset()</code> is itself the mistake — a callback gauge shouldn’t need to reset before repopulating its values.',
    reality: 'Resetting first is correct and necessary: without it, a provider that had orders LAST scrape but has none THIS scrape would keep showing its old (now-stale) value forever, since nothing would ever explicitly zero it out. The bug isn’t the <code>reset()</code> call — it’s that the async repopulation after the reset never gets awaited by the scrape.',
  },
  {
    thought: 'A callback gauge’s <code>collect()</code> function must always be declared <code>async</code> to work correctly with prom-client.',
    reality: 'prom-client doesn’t care whether <code>collect()</code> is declared <code>async</code> — it only checks whether the VALUE the function returns is a Promise (<code>v instanceof Promise</code>). A plain (non-async) function that explicitly <code>return</code>s a Promise-returning call — exactly like the fixed version above, <code>return getPendingOrders().then(...)</code> — satisfies this just as well as an <code>async function collect() { await ...; }</code> would.',
  },
];

@Component({
  selector: 'app-obs-custom-metrics-gauge-promise-bug',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-callback-gauge-that-forgets-to-return-its-promise.html',
  styleUrl: './the-callback-gauge-that-forgets-to-return-its-promise.scss',
})
export class TheCallbackGaugeThatForgetsToReturnItsPromiseSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
