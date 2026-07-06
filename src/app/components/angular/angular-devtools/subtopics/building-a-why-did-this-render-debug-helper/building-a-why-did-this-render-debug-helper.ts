import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-building-a-why-did-this-render-debug-helper-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './building-a-why-did-this-render-debug-helper.html',
  styleUrl: './building-a-why-did-this-render-debug-helper.scss',
})
export class BuildingAWhyDidThisRenderDebugHelperSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The "why" tooltip is powerful, but it lives only inside the extension',
      points: [
        'The main topic\'s "why did this component check?" tooltip is the single most actionable piece of profiler data — but it only exists WHILE the DevTools panel is open, requires manually recording a trace, and cannot be shared as a persistent log or attached to a bug report. A lightweight, CODE-BASED equivalent — an <code>effect()</code> that logs exactly which of a component\'s tracked signals changed value between runs — gives you similar diagnostic value directly in the console, works in any environment (including CI logs or a teammate\'s machine without the extension installed), and can be left in temporarily during a debugging session without needing DevTools open at all.',
        'This is not a REPLACEMENT for the Profiler\'s flame chart (which shows TIMING across many components at once, something a single component\'s log cannot replicate) — it is a COMPLEMENT, useful specifically for the "why does THIS ONE component keep re-rendering" question once the flame chart has already told you WHICH component to investigate.',
      ],
    },
    {
      heading: 'Building the helper — comparing previous vs current signal snapshots',
      points: [
        'The core technique: an <code>effect()</code> that reads every signal of interest (creating tracked dependencies) and, on each run, compares the CURRENT values against a snapshot saved from the PREVIOUS run, logging exactly which ones changed: <code>effect(() =&gt; { const curr = { a: sigA(), b: sigB() }; const changed = Object.keys(curr).filter(k =&gt; curr[k] !== prev[k]); console.log(\'re-ran because:\', changed); prev = curr; });</code>.',
        'Because this is a genuine <code>effect()</code>, it participates in Angular\'s real reactive graph — it re-runs EXACTLY when the component\'s own template would re-render due to those specific signals, giving you a 1:1 correspondence between the log output and actual change detection activity, unlike a generic <code>console.log</code> sprinkled in <code>ngDoCheck</code> which fires on EVERY CD cycle regardless of whether anything relevant actually changed.',
      ],
    },
    {
      heading: 'Making it reusable — a small injectable debug utility',
      points: [
        'Wrap the pattern into a reusable function so it is not hand-rolled per component: <code>function logWhyChanged(label: string, signals: Record&lt;string, () =&gt; unknown&gt;) { let prev: Record&lt;string, unknown&gt; = {}; effect(() =&gt; { const curr = Object.fromEntries(Object.entries(signals).map(([k, fn]) =&gt; [k, fn()])); const changed = Object.keys(curr).filter(k =&gt; curr[k] !== prev[k]); if (changed.length) console.log(\`[\${label}] changed:\`, changed); prev = curr; }); }</code> — call it once in any component\'s constructor with a label and a map of signal getters.',
        'Guard this utility behind an environment flag (<code>if (!environment.production) logWhyChanged(...)</code>) so it is tree-shaken out of real production builds — exactly the same discipline the main topic applies to <code>enableDebugTools()</code>, since this is fundamentally the same category of tool: development-only diagnostic instrumentation that should never ship to real users.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/log-why-changed.ts',
      content: `import { effect } from '@angular/core';

// A portable, code-based complement to DevTools' "why did this check?" tooltip.
// Call once in a component's constructor (or field initializer) with a label
// and a map of signal getters to watch.
export function logWhyChanged(label: string, signals: Record<string, () => unknown>): void {
  let prev: Record<string, unknown> = {};

  effect(() => {
    const curr: Record<string, unknown> = {};
    for (const key of Object.keys(signals)) {
      curr[key] = signals[key](); // reading here creates the tracked dependency
    }

    const changed = Object.keys(curr).filter(k => curr[k] !== prev[k]);
    if (changed.length > 0) {
      console.log(\`[\${label}] re-ran because these changed:\`, changed, curr);
    }

    prev = curr;
  });
}
`,
    },
    {
      path: 'src/app/product-list.ts',
      content: `import { Component, signal, computed } from '@angular/core';
import { logWhyChanged } from './log-why-changed';

@Component({
  selector: 'app-product-list',
  standalone: true,
  template: \`
    <input [value]="filter()" (input)="filter.set($any($event.target).value)" />
    <button (click)="sortAsc.set(!sortAsc())">Toggle sort</button>
    @for (p of filtered(); track p.id) { <p>{{ p.name }}</p> }
  \`,
})
export class ProductListComponent {
  products = signal([
    { id: 1, name: 'Widget A' },
    { id: 2, name: 'Widget B' },
  ]);
  filter = signal('');
  sortAsc = signal(true);

  filtered = computed(() => {
    const list = this.products().filter(p => p.name.includes(this.filter()));
    return this.sortAsc() ? list : [...list].reverse();
  });

  constructor() {
    // Open the console — typing in the filter logs "filter" changed;
    // clicking the sort button logs "sortAsc" changed. Neither triggers
    // the other, and 'products' never appears unless it actually changes.
    logWhyChanged('ProductListComponent', {
      filter: this.filter,
      sortAsc: this.sortAsc,
      products: this.products,
    });
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { ProductListComponent } from './product-list';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ProductListComponent],
  template: \`
    <h3>Building a "why did this render?" debug helper</h3>
    <p>Open the console. Type in the filter box or click "Toggle sort" — the log tells
    you EXACTLY which signal changed, a code-based complement to DevTools' "why" tooltip
    that works without the extension installed.</p>
    <app-product-list />
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
  <head><title>Building a "why did this render?" debug helper</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Wrap the logWhyChanged() call in a production-safety check, similar to how enableDebugTools() should be guarded — only call it when NOT in production.',
    hint: 'Import an `environment` object with a `production: boolean` flag, then wrap the constructor\'s logWhyChanged() call in `if (!environment.production) { ... }`.',
    solution: `import { environment } from '../environments/environment';

constructor() {
  if (!environment.production) {
    logWhyChanged('ProductListComponent', {
      filter: this.filter,
      sortAsc: this.sortAsc,
      products: this.products,
    });
  }
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a code-based "why did this render" logger is meant to replace the DevTools Profiler flame chart entirely.',
      reality: 'it complements the flame chart — the flame chart shows TIMING across many components to find WHICH one is slow; the code-based logger explains WHY one specific, already-identified component keeps re-running.',
    },
    {
      thought: 'a console.log placed inside ngDoCheck gives the same diagnostic value as an effect()-based change logger.',
      reality: 'ngDoCheck fires on EVERY change detection cycle regardless of whether anything relevant changed, while an effect() only re-runs when one of its ACTUAL tracked signal dependencies changes — giving a precise 1:1 correspondence with real reactive updates.',
    },
    {
      thought: 'a debug helper like logWhyChanged() is harmless to leave enabled in a real production build since it just logs to the console.',
      reality: 'it should be guarded behind an environment flag exactly like enableDebugTools() — leaving diagnostic instrumentation active in production exposes internal component state and wastes runtime cycles for zero user benefit.',
    },
  ];
}
