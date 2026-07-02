import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-output-signals-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './output-signals.html',
  styleUrl: './output-signals.scss',
})
export class OutputSignalsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'output() — no EventEmitter or Subject required',
      points: [
        '<code>saved = output&lt;string&gt;();</code> declares a type-safe component output with no <code>new EventEmitter&lt;T&gt;()</code> instantiation and no RxJS <code>Subject</code> underneath it — the boilerplate is simply gone.',
        'Emitting is identical to the old API: <code>this.saved.emit(value)</code> — if you are migrating existing code, the emit call sites do not need to change at all.',
      ],
    },
    {
      heading: 'The parent-side binding syntax is unchanged',
      points: [
        'A parent listens with the exact same template syntax as the old <code>&#64;Output()</code>: <code>(saved)="onSaved($event)"</code>. This is a genuinely painless migration — swapping <code>&#64;Output() saved = new EventEmitter&lt;string&gt;();</code> for <code>saved = output&lt;string&gt;();</code> in the CHILD requires zero changes anywhere in the PARENT\'s template.',
      ],
    },
    {
      heading: 'Bridging from RxJS — outputFromObservable()',
      points: [
        '<code>outputFromObservable(observable$)</code> converts an existing RxJS Observable into an Angular <code>output()</code> — useful when a child component already has some Observable-based stream (say, from a WebSocket or a form\'s <code>valueChanges</code>) and you want to expose it to the parent using the modern output API instead of manually subscribing and calling <code>.emit()</code> yourself on every value.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/counter-widget.ts',
      content: `import { Component, output, signal } from '@angular/core';

@Component({
  selector: 'app-counter-widget',
  standalone: true,
  template: \`
    <button (click)="dec()">-</button>
    <span>{{ count() }}</span>
    <button (click)="inc()">+</button>
  \`,
})
export class CounterWidget {
  count = signal(0);

  // No EventEmitter, no Subject — just a typed output
  changed = output<number>();

  inc() {
    this.count.update(n => n + 1);
    this.changed.emit(this.count()); // identical call site to the old EventEmitter API
  }
  dec() {
    this.count.update(n => n - 1);
    this.changed.emit(this.count());
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';
import { CounterWidget } from './counter-widget';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CounterWidget],
  template: \`
    <!-- Same (event)="handler($event)" syntax as the old @Output() -->
    <app-counter-widget (changed)="onChanged($event)" />
    <p>Parent last saw: {{ lastValue() }}</p>
  \`,
})
export class App {
  lastValue = signal<number | null>(null);

  onChanged(value: number) {
    this.lastValue.set(value);
  }
}
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
  <head><title>output() signals</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a "reset" output to CounterWidget, emitted when the count returns to exactly zero (from either inc() or dec()), and log a message in the parent when it fires.',
    hint: 'reset = output<void>(); then inside both inc() and dec(), after updating count, check: if (this.count() === 0) this.reset.emit(); — parent listens the same way: (reset)="onReset()".',
    solution: `reset = output<void>();

inc() {
  this.count.update(n => n + 1);
  this.changed.emit(this.count());
  if (this.count() === 0) this.reset.emit();
}
dec() {
  this.count.update(n => n - 1);
  this.changed.emit(this.count());
  if (this.count() === 0) this.reset.emit();
}

// Parent template:
// <app-counter-widget (changed)="onChanged($event)" (reset)="onReset()" />`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'output() still requires you to create a new EventEmitter() instance underneath, just with different syntax.',
      reality: 'output() is a plain function call — changed = output<number>(); — with no EventEmitter or Subject instantiation involved at all. The old boilerplate is gone, not just hidden.',
    },
    {
      thought: 'migrating a child component from @Output() to output() requires updating every parent template that listens to it.',
      reality: 'the parent-side binding syntax — (eventName)="handler($event)" — is completely unchanged. Only the CHILD\'s own declaration and emit() call site are affected by the migration; parent templates need zero changes.',
    },
    {
      thought: 'an existing RxJS-based stream in a component cannot be exposed as a modern output() without manually subscribing and calling emit() on every value.',
      reality: 'outputFromObservable(stream$) converts an Observable directly into an output() — no manual subscription/emit loop needed for that specific bridging case.',
    },
  ];
}
