import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-coordinating-multiple-stacked-host-directives-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './coordinating-multiple-stacked-host-directives.html',
  styleUrl: './coordinating-multiple-stacked-host-directives.scss',
})
export class CoordinatingMultipleStackedHostDirectivesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Relying on constructor/lifecycle order alone is fragile',
      points: [
        'The main topic notes host directives instantiate and run lifecycle hooks in ARRAY ORDER, and that a later directive can safely <code>inject()</code> an earlier one. This works for a ONE-WAY dependency (B depends on A, B is listed after A) — but it breaks down the moment two host directives need to react to EACH OTHER\'s state changes over time, not just read a snapshot at construction.',
        'Example: a <code>DragDirective</code> and a <code>SnapToGridDirective</code> stacked together — SnapToGrid needs to know whenever Drag\'s position changes, continuously, not just once at construction. Injecting Drag in SnapToGrid\'s constructor only gives you the INITIAL state; ordering alone does not give you ongoing reactivity.',
      ],
    },
    {
      heading: 'Signal-based coordination — the correct pattern for ongoing cross-directive reactivity',
      points: [
        'Expose state as a SIGNAL from the directive that owns it: <code>DragDirective</code> has <code>readonly position = signal({ x: 0, y: 0 })</code> (read-only publicly, mutated internally). The DEPENDENT directive (listed AFTER it in the array so it can inject it) reads that signal inside its OWN <code>effect()</code>: <code>constructor() { const drag = inject(DragDirective); effect(() =&gt; { const pos = drag.position(); this.snapToNearestGridPoint(pos); }); }</code>.',
        'This works regardless of array order for the READING side (signals are reactive independent of when they are read) — order still matters for the INJECTION itself to succeed (the injected directive must already be instantiated), which is exactly what the array-order rule guarantees.',
      ],
    },
    {
      heading: 'A third coordinating directive is often cleaner than direct A-depends-on-B injection',
      points: [
        'For two directives that need BIDIRECTIONAL awareness of each other (not just one depending on the other), injecting each other directly creates a circular dependency Angular cannot resolve. The clean fix: introduce a THIRD, small "coordinator" directive that is listed FIRST in the array, injects nothing, and exposes a shared signal or small service-like API that BOTH other directives inject and read/write — turning a circular two-way dependency into two one-way dependencies on a shared source of truth.',
        'This mirrors the "prefer one host directive that internally composes its own sub-behaviour" advice from the main topic\'s theory — a coordinator directive IS that composing directive, just scoped specifically to solving cross-directive communication rather than bundling unrelated behaviors.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/drag.directive.ts',
      content: `import { Directive, signal } from '@angular/core';

@Directive({
  selector: '[appDrag]',
  standalone: true,
  host: {
    '(mousedown)': 'startDrag($event)',
  },
})
export class DragDirective {
  // Publicly readable signal — other directives can react to it continuously
  readonly position = signal({ x: 0, y: 0 });

  startDrag(event: MouseEvent) {
    // Simplified — a real implementation would track mousemove/mouseup
    this.position.set({ x: event.clientX, y: event.clientY });
  }
}
`,
    },
    {
      path: 'src/app/snap-to-grid.directive.ts',
      content: `import { Directive, inject, effect, signal } from '@angular/core';
import { DragDirective } from './drag.directive';

const GRID_SIZE = 20;

@Directive({
  selector: '[appSnapToGrid]',
  standalone: true,
})
export class SnapToGridDirective {
  // Depends on DragDirective being listed BEFORE this one in hostDirectives —
  // that ordering guarantees DragDirective is already instantiated here.
  private drag = inject(DragDirective);

  snappedPosition = signal({ x: 0, y: 0 });

  constructor() {
    // Reacts continuously to drag.position() changes — not just a one-time read
    effect(() => {
      const pos = this.drag.position();
      this.snappedPosition.set({
        x: Math.round(pos.x / GRID_SIZE) * GRID_SIZE,
        y: Math.round(pos.y / GRID_SIZE) * GRID_SIZE,
      });
    });
  }
}
`,
    },
    {
      path: 'src/app/draggable-tile.ts',
      content: `import { Component, inject } from '@angular/core';
import { DragDirective } from './drag.directive';
import { SnapToGridDirective } from './snap-to-grid.directive';

@Component({
  selector: 'app-draggable-tile',
  standalone: true,
  template: \`Drag me\`,
  // Order matters: DragDirective FIRST so SnapToGridDirective can inject it.
  hostDirectives: [DragDirective, SnapToGridDirective],
})
export class DraggableTileComponent {
  private snap = inject(SnapToGridDirective);

  get snappedPosition() {
    return this.snap.snappedPosition();
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { DraggableTileComponent } from './draggable-tile';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DraggableTileComponent],
  template: \`
    <h3>Coordinating stacked host directives via signals</h3>
    <p>Click anywhere on the tile — DragDirective updates its position signal,
    SnapToGridDirective's effect() reacts continuously and snaps it to the nearest
    grid point. This works because of signal reactivity, not lifecycle timing.</p>
    <app-draggable-tile style="display:block; padding:2rem; border:1px solid #ccc; cursor:move;" />
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
  <head><title>Coordinating multiple stacked host directives</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Swap the array order to [SnapToGridDirective, DragDirective] and observe the runtime injection error, confirming why order matters.',
    hint: 'Change hostDirectives: [DragDirective, SnapToGridDirective] to hostDirectives: [SnapToGridDirective, DragDirective] — SnapToGridDirective\'s constructor now tries to inject DragDirective before it exists.',
    solution: `// draggable-tile.ts
hostDirectives: [SnapToGridDirective, DragDirective], // WRONG ORDER

// Result: NullInjectorError or similar — SnapToGridDirective's constructor
// runs first and tries to inject(DragDirective), which has not been
// instantiated yet in this array position.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'injecting one host directive from another in the constructor gives you ongoing awareness of that directive\'s state changes.',
      reality: 'a constructor-time inject() only captures a REFERENCE to the directive instance, not a live subscription — reacting to CONTINUOUS state changes requires reading a signal (or subscribing to an Observable) inside an effect(), not just injecting once.',
    },
    {
      thought: 'two host directives that need mutual awareness of each other should inject each other directly.',
      reality: 'directly injecting each other creates a circular dependency Angular cannot resolve — the clean fix is a third coordinator directive, listed first, that both directives depend on one-way instead of on each other.',
    },
    {
      thought: 'the order of directives in the hostDirectives array is just a stylistic convention with no functional effect.',
      reality: 'array order determines instantiation order — a directive that injects an EARLIER directive in the array works, but injecting a LATER one throws, since it does not exist yet at that point in construction.',
    },
  ];
}
