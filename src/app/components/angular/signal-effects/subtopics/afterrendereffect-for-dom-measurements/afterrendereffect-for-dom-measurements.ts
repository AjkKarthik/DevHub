import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-afterrendereffect-for-dom-measurements-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './afterrendereffect-for-dom-measurements.html',
  styleUrl: './afterrendereffect-for-dom-measurements.scss',
})
export class AfterrendereffectForDomMeasurementsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Why plain effect() is unsafe for reading layout',
      points: [
        'A regular <code>effect()</code> re-runs after Angular\'s next microtask flush — which is NOT guaranteed to be after the browser has actually painted the updated DOM. Reading <code>element.getBoundingClientRect()</code> inside a plain <code>effect()</code> can read STALE layout from before the template update took effect, producing subtly wrong measurements that are hard to reproduce consistently.',
        '<code>afterRenderEffect()</code> is signal-aware (like <code>effect()</code> — it tracks synchronous signal reads and re-runs when they change) but is specifically scheduled to run at defined points in Angular\'s RENDER cycle, after the DOM has actually been updated — making it the correct tool for the same "reactive to signals, but also needs real DOM state" niche that plain <code>effect()</code> cannot safely fill.',
      ],
    },
    {
      heading: 'Read/write phases prevent layout thrashing',
      points: [
        '<code>afterRenderEffect({ read: (onCleanup) =&gt; {...}, write: (onCleanup) =&gt; {...} })</code> lets you register a callback for the <code>read</code> phase (measuring — <code>getBoundingClientRect</code>, <code>scrollHeight</code>) SEPARATELY from the <code>write</code> phase (applying styles, setting properties based on the measurement). Angular batches ALL registered <code>read</code> callbacks across the whole app before running ANY <code>write</code> callbacks — this prevents the classic "layout thrashing" bug where interleaved reads and writes force the browser to recalculate layout repeatedly within a single frame.',
        'The <code>read</code> phase callback\'s RETURN VALUE is passed as the argument to the corresponding <code>write</code> phase callback — this is the mechanism for passing a measurement from read to write without any extra signal or shared mutable state: <code>afterRenderEffect({ read: () =&gt; el.getBoundingClientRect().width, write: (width) =&gt; { this.measuredWidth.set(width); } })</code>.',
      ],
    },
    {
      heading: 'Signal-driven re-measurement — re-runs when a tracked signal changes',
      points: [
        'Because <code>afterRenderEffect()</code> tracks signals just like <code>effect()</code>, a resize-triggering signal change (e.g. a <code>columns</code> count that affects layout) causes the read/write pair to re-run automatically after the NEXT render completes — no manual `ResizeObserver` wiring needed for changes driven by your own signal-based state (though a real `ResizeObserver` is still needed for layout changes caused by things OUTSIDE Angular\'s control, like the user resizing the browser window).',
        'Like plain <code>effect()</code>, each phase callback receives an <code>onCleanup</code> function — use it exactly the same way, to tear down anything the callback set up before its next run (e.g. disconnecting a temporary observer created inside the write phase).',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/measured-box.ts',
      content: `import { Component, signal, afterRenderEffect, viewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-measured-box',
  standalone: true,
  template: \`
    <button (click)="columns.update(c => c === 1 ? 3 : 1)">
      Toggle columns ({{ columns() }})
    </button>
    <div #box [style.display]="'grid'" [style.gridTemplateColumns]="'repeat(' + columns() + ', 1fr)'">
      <div style="border:1px solid #ccc; padding:1rem;">Item A</div>
      <div style="border:1px solid #ccc; padding:1rem;">Item B</div>
      <div style="border:1px solid #ccc; padding:1rem;">Item C</div>
    </div>
    <p>Measured width after layout settled: {{ measuredWidth() }}px</p>
  \`,
})
export class MeasuredBoxComponent {
  columns = signal(1);
  measuredWidth = signal(0);

  private box = viewChild.required<ElementRef<HTMLElement>>('box');

  constructor() {
    afterRenderEffect({
      // READ phase — runs after the DOM has actually updated, safe to measure
      read: () => {
        this.columns(); // tracked — re-runs the read/write pair when columns changes
        return this.box().nativeElement.getBoundingClientRect().width;
      },
      // WRITE phase — receives the read phase's return value
      write: (width) => {
        this.measuredWidth.set(Math.round(width));
      },
    });
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { MeasuredBoxComponent } from './measured-box';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MeasuredBoxComponent],
  template: \`
    <h3>afterRenderEffect for DOM measurements</h3>
    <p>Toggle columns — the read phase re-measures the box's actual rendered width AFTER
    the grid layout has updated, and the write phase stores it in a signal.</p>
    <app-measured-box />
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
  <head><title>afterRenderEffect for DOM measurements</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a second read/write pair that measures the box\'s height instead of width, into a separate heightPx signal.',
    hint: 'Call afterRenderEffect() a second time in the constructor with its own read (returning getBoundingClientRect().height) and write (setting a new heightPx signal) — afterRenderEffect() calls can be registered multiple times independently.',
    solution: `heightPx = signal(0);

constructor() {
  afterRenderEffect({
    read: () => {
      this.columns();
      return this.box().nativeElement.getBoundingClientRect().width;
    },
    write: (width) => this.measuredWidth.set(Math.round(width)),
  });

  afterRenderEffect({
    read: () => {
      this.columns();
      return this.box().nativeElement.getBoundingClientRect().height;
    },
    write: (height) => this.heightPx.set(Math.round(height)),
  });
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a plain effect() can safely read element.getBoundingClientRect() as long as it reads a tracked signal too.',
      reality: 'plain effect() is not guaranteed to run after the browser has painted the DOM update — it can read stale layout; afterRenderEffect() is specifically scheduled after the render cycle for this reason.',
    },
    {
      thought: 'reading and writing DOM state in the same afterRenderEffect callback is fine as long as it works.',
      reality: 'separating read and write into their own phases lets Angular batch all reads before all writes across the WHOLE app, preventing layout thrashing — mixing them in one callback loses that batching benefit.',
    },
    {
      thought: 'afterRenderEffect() replaces the need for a real ResizeObserver entirely.',
      reality: 'it only automatically re-runs for layout changes driven by YOUR OWN signal state — layout changes caused by things outside Angular\'s control (like the user resizing the browser window) still need a real ResizeObserver.',
    },
  ];
}
