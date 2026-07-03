import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-profiling-let-recompute-cost-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './profiling-let-recompute-cost.html',
  styleUrl: './profiling-let-recompute-cost.scss',
})
export class ProfilingLetRecomputeCostSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The claim is stated as fact — this subtopic proves it empirically',
      points: [
        'The main topic states that "@let recomputes on every change detection cycle" — true, but taken on faith by most readers rather than actually observed. A simple, temporary instrumentation technique makes this directly visible: wrap the expensive expression in an Immediately Invoked Function Expression (IIFE) that increments a counter each time it runs, and log that counter alongside the actual computed result.',
        'This is the same category of "measure it, don\'t just trust it" discipline applied earlier in this site to route preloading and LCP — the theoretical explanation is necessary but proving it with your own eyes on your own machine builds real confidence and catches cases where your intuition about "how often does this actually run" turns out to be wrong.',
      ],
    },
    {
      heading: 'The counter-tracking technique — a method call, not an inline block',
      points: [
        'Angular template expressions do not support arbitrary inline statement blocks or increment operators — so the instrumentation lives in an ordinary component METHOD that the <code>@let</code> expression calls: <code>@let filtered = filterWithTracking(items());</code> where <code>filterWithTracking(items)</code> increments a counter as a side effect and returns the actual filtered array. The <code>@let</code> variable ends up holding the method\'s RETURN VALUE, exactly as if the method had no instrumentation at all.',
        'Trigger a change detection cycle that has NOTHING to do with the <code>@let</code>\'s own dependencies — e.g. a totally unrelated signal write, or simply clicking ANY button that causes Angular to re-run change detection for the component — and watch the counter increment anyway, proving the recompute happens regardless of whether the relevant data actually changed.',
      ],
    },
    {
      heading: 'The same technique proves computed() does NOT have this cost',
      points: [
        'Apply the identical counter-tracking pattern inside a <code>computed()</code> in the component class instead of a <code>@let</code> in the template, trigger the same UNRELATED change detection cycles, and observe the counter does NOT increment — <code>computed()</code>\'s memoization means the wrapped function body only re-runs when a signal it actually reads changes value, exactly as claimed.',
        'This side-by-side comparison — same expensive logic, same triggering events, different counter behavior — is the concrete, hands-on version of the main topic\'s advice to "use computed() for expensive derivations." Seeing the counter numbers diverge is far more convincing than reading the advice alone.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/profiling-demo.ts',
      content: `import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-profiling-demo',
  standalone: true,
  template: \`
    @let sortedWithLet = sortWithLetTracking(items());

    <p>@let recompute count: {{ letRecomputeCount }}</p>
    <p>computed() recompute count: {{ computedRecomputeCount }}</p>

    <button (click)="triggerUnrelatedChange()">
      Trigger unrelated change detection (does not touch items())
    </button>
    <button (click)="addItem()">Add an item (DOES touch items())</button>

    <ul>
      @for (item of sortedWithLet; track item) { <li>{{ item }}</li> }
    </ul>
    <ul>
      @for (item of sortedWithComputed(); track item) { <li>{{ item }}</li> }
    </ul>
  \`,
})
export class ProfilingDemoComponent {
  items = signal(['banana', 'apple', 'cherry']);
  unrelated = signal(0);

  letRecomputeCount = 0;
  computedRecomputeCount = 0;

  // Called directly from the @let expression — increments the counter
  // as a side effect, then returns the actual computed value.
  sortWithLetTracking(items: string[]): string[] {
    this.letRecomputeCount++;
    console.log('[@let] sort ran, count:', this.letRecomputeCount);
    return [...items].sort();
  }

  sortedWithComputed = computed(() => {
    this.computedRecomputeCount++;
    console.log('[computed] sort ran, count:', this.computedRecomputeCount);
    return [...this.items()].sort();
  });

  triggerUnrelatedChange() {
    // Triggers a change detection cycle — @let re-runs regardless;
    // computed() does NOT, since 'unrelated' is not one of its dependencies.
    this.unrelated.update(n => n + 1);
  }

  addItem() {
    this.items.update(list => [...list, 'date']);
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { ProfilingDemoComponent } from './profiling-demo';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ProfilingDemoComponent],
  template: \`
    <h3>Profiling @let recompute cost</h3>
    <p>Open the console. Click "Trigger unrelated change" repeatedly — watch the
    @let recompute count climb every click, while the computed() count stays flat.
    Only "Add an item" bumps both counts.</p>
    <app-profiling-demo />
  \`,
})
export class App {}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';

bootstrapApplication(App);
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Profiling @let recompute cost</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a third counter that tracks how many times a signal.set() call happens (not related to computation at all), to visually contrast "how often does state change" against "how often does @let recompute."',
    hint: 'Add a stateChangeCount field, increment it inside both triggerUnrelatedChange() and addItem(), then display it in the template alongside the other two counters for comparison.',
    solution: `stateChangeCount = 0;

triggerUnrelatedChange() {
  this.stateChangeCount++;
  this.unrelated.update(n => n + 1);
}

addItem() {
  this.stateChangeCount++;
  this.items.update(list => [...list, 'date']);
}

// Template:
// <p>Total state changes: {{ stateChangeCount }}</p>
// Compare: stateChangeCount grows on EVERY click, but computedRecomputeCount
// only grows when addItem() specifically runs — proving computed() correctly
// ignores state changes it doesn't depend on.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"@let recomputes every change detection cycle" is a subtle implementation detail that rarely matters in practice.',
      reality: 'a simple counter-based tracking demo makes it directly observable — clicking a button that has NOTHING to do with the @let\'s data still increments its recompute counter, which can matter a great deal for expensive expressions in a frequently-re-rendering component.',
    },
    {
      thought: 'wrapping a @let expression\'s computation in a tracking method changes what the @let variable ends up holding.',
      reality: 'the method returns the actual computed value and the @let variable holds exactly that — the counter increment is a side effect inside the method, transparent to the returned result.',
    },
    {
      thought: 'comparing @let and computed() recompute counts requires complex profiling tools.',
      reality: 'a plain incrementing counter logged to the console, triggered by button clicks, is sufficient to see the divergence clearly — no specialized tooling needed for this specific comparison.',
    },
  ];
}
