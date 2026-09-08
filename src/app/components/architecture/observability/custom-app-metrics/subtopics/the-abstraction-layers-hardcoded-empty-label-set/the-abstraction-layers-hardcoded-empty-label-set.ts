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
    heading: 'The Abstraction Layer’s Own Usage Example Throws at Runtime',
    points: [
      'The main page’s "Metric Abstraction Layer" codeTab exists specifically to let business code call <code>metrics.incrementCounter(...)</code>/<code>recordDuration(...)</code>/<code>setGauge(...)</code> without ever touching prom-client directly. Its own <code>recordDuration()</code> and <code>setGauge()</code> methods correctly derive each metric’s <code>labelNames</code> from <code>Object.keys(labels)</code> on the FIRST call — but <code>getOrCreateCounter()</code> hardcodes <code>labelNames: []</code> instead, ignoring whatever labels get passed in entirely.',
      'prom-client validates every <code>.inc(labels)</code> call against the labelNames the metric was REGISTERED with — calling it with a label key that was never registered throws immediately: <code>Added label "type" is not included in initial labelset: []</code>. Verified by running the class’s own <code>incrementCounter()</code> method directly against the real prom-client package.',
      'This isn’t a hypothetical edge case — it breaks the page’s OWN literal usage comment sitting right below the class: <code>metrics.incrementCounter(&#39;orders_placed_total&#39;, { type: &#39;subscription&#39; })</code> throws exactly this error, because <code>getOrCreateCounter()</code> never sees the <code>{ type: ... }</code> labels before locking in an empty label set.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Reproduced, Then Fixed — Verified via prom-client',
    language: 'typescript',
    code: `import { Counter, register } from 'prom-client';

// ── BROKEN: matches the main page's ORIGINAL getOrCreateCounter ────
class BrokenMetrics {
  private counters = new Map<string, Counter>();
  private getOrCreateCounter(name: string): Counter {
    if (!this.counters.has(name)) {
      this.counters.set(name, new Counter({ name, help: name, labelNames: [] }));
    }
    return this.counters.get(name)!;
  }
  incrementCounter(name: string, labels: Record<string, string> = {}): void {
    this.getOrCreateCounter(name).inc(labels);
  }
}

const broken = new BrokenMetrics();
try {
  broken.incrementCounter('orders_placed_total', { type: 'subscription' });
  console.log('broken: no error (unexpected)');
} catch (e) {
  console.log('broken:', (e as Error).message);
  // -> Added label "type" is not included in initial labelset: []
}

// ── FIXED: pass labels into getOrCreateCounter so it can register them ──
class FixedMetrics {
  private counters = new Map<string, Counter>();
  private getOrCreateCounter(name: string, labels: Record<string, string>): Counter {
    if (!this.counters.has(name)) {
      this.counters.set(name, new Counter({ name, help: name, labelNames: Object.keys(labels) }));
    }
    return this.counters.get(name)!;
  }
  incrementCounter(name: string, labels: Record<string, string> = {}): void {
    this.getOrCreateCounter(name, labels).inc(labels);
  }
}

const fixed = new FixedMetrics();
try {
  fixed.incrementCounter('orders_placed_total', { type: 'subscription' });
  console.log('fixed: no error, counter incremented correctly');
} catch (e) {
  console.log('fixed:', (e as Error).message);
}
// -> broken: Added label "type" is not included in initial labelset: []
// -> fixed: no error, counter incremented correctly`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'Even with the fix applied, the label set for a given metric name is still only ever registered on the FIRST call — <code>getOrCreateCounter()</code> only creates a NEW counter, it never re-registers an existing one. A second call to <code>incrementCounter(&#39;orders_placed_total&#39;, { type: &#39;one-time&#39;, channel: &#39;web&#39; })</code> — introducing a brand-new <code>channel</code> label key that the FIRST call never used — runs against the same <code>orders_placed_total</code> counter. Does this throw?',
  hint: 'The counter was already created (and its labelNames locked in) by the first call, which only had a <code>type</code> label — the fix only fires on metric CREATION, not on every call afterward.',
  solution: `// YES -- it throws, for the same underlying reason as the original bug,
// just triggered by the SECOND call instead of the first:
//
//   fixed.incrementCounter('orders_placed_total', { type: 'subscription' });
//   fixed.incrementCounter('orders_placed_total', { type: 'one-time', channel: 'web' });
//   -> Added label "channel" is not included in initial labelset: [ 'type' ]
//
// The fix makes the label set correct AS OF the first call to a given
// metric name -- it does not make the label set dynamic across calls.
// This is exactly why the main page's own theory bullet on "Label
// strategy" (Quick Reference) warns to "plan labels before
// instrumenting -- changing labels breaks dashboard queries": the
// abstraction layer's own constructor-time-of-first-call behavior is a
// real, concrete instance of that same warning, not just dashboard-side
// advice.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since <code>recordDuration()</code> and <code>setGauge()</code> already derive their label set correctly from <code>Object.keys(labels)</code>, the abstraction layer’s label handling is basically fine and this was a one-off typo.',
    reality: 'It’s a genuine, isolated inconsistency: <code>getOrCreateCounter()</code> is the ONLY one of the three private factory methods that hardcodes <code>labelNames: []</code> instead of deriving it from the labels actually passed in — copy-and-paste across the three methods diverged in exactly one spot, and it happens to be the one exercised by the page’s own literal usage example.',
  },
  {
    thought: 'This bug would have been caught immediately by TypeScript, since <code>labelNames</code> and the labels object are both typed.',
    reality: 'TypeScript happily compiles <code>new Counter({ name, help: name, labelNames: [] })</code> — an empty array is a perfectly valid <code>string[]</code>. The mismatch between the REGISTERED label set and the labels a later <code>.inc(labels)</code> call actually supplies is a prom-client RUNTIME validation, invisible to the type checker entirely.',
  },
  {
    thought: 'A thin metrics abstraction layer like this one is strictly safer than calling prom-client directly, since it centralises all the Prometheus-specific logic in one place.',
    reality: 'Centralising the logic in one place means a bug in that ONE place (like this hardcoded empty label set) silently breaks every single metric routed through it — calling prom-client directly per metric, as the page’s OWN first "Business Metrics" codeTab does, would have caught this exact mistake immediately on the first affected metric, not silently propagated it to every metric that ever needs a label.',
  },
];

@Component({
  selector: 'app-obs-custom-metrics-abstraction-label-bug',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-abstraction-layers-hardcoded-empty-label-set.html',
  styleUrl: './the-abstraction-layers-hardcoded-empty-label-set.scss',
})
export class TheAbstractionLayersHardcodedEmptyLabelSetSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
