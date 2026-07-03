import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-model-two-way-binding-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './model-two-way-binding.html',
  styleUrl: './model-two-way-binding.scss',
})
export class ModelTwoWayBindingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'model() — a signal the CHILD can write, that flows back to the parent',
      points: [
        '<code>count = model(0);</code> creates a <code>ModelSignal</code> — unlike <code>input()</code>, this one is genuinely WRITABLE from inside the child. The parent binds to it with the two-way syntax <code>[(count)]="qty"</code>, the same square-bracket-plus-parens "banana in a box" syntax as <code>[(ngModel)]</code>.',
      ],
    },
    {
      heading: 'What [(prop)] actually desugars to',
      points: [
        '<code>model()</code> generates an <code>input()</code> AND an auto-named <code>propChange</code> <code>output()</code> in one declaration. <code>[(count)]="qty"</code> is literally shorthand for <code>[count]="qty()" (countChange)="qty.set($event)"</code> — you can even write that expanded form explicitly if you only want one direction of the binding.',
      ],
    },
    {
      heading: 'The child writes normally — Angular handles the event emission',
      points: [
        'Inside the child, call <code>this.count.set(n)</code> or <code>this.count.update(n =&gt; n + 1)</code> exactly like any other writable signal. Angular automatically fires the <code>countChange</code> output behind the scenes — there is no manual <code>.emit()</code> call to remember.',
      ],
    },
    {
      heading: 'model.required() and multi-sibling sync',
      points: [
        '<code>model.required&lt;T&gt;()</code> mirrors <code>input.required()</code> — the parent MUST provide a <code>[(prop)]</code> binding, or Angular reports a compile error.',
        'Because the underlying value lives in the PARENT\'s signal, multiple sibling components can all bind to the SAME parent signal via their own <code>model()</code> — changing the value in one sibling flows through the parent and updates every other bound sibling reactively, with no manual synchronization code anywhere.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/qty-stepper.ts',
      content: `import { Component, model } from '@angular/core';

@Component({
  selector: 'app-qty-stepper',
  standalone: true,
  template: \`
    <button (click)="value.update(n => n - 1)">-</button>
    <span>{{ value() }}</span>
    <button (click)="value.update(n => n + 1)">+</button>
  \`,
})
export class QtyStepper {
  // Writable from inside this component AND bindable two-way by the parent
  value = model(0);
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';
import { QtyStepper } from './qty-stepper';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [QtyStepper],
  template: \`
    <h3>Two independent steppers bound to the SAME parent signal</h3>
    <app-qty-stepper [(value)]="orderQty" />
    <app-qty-stepper [(value)]="orderQty" />
    <p>Parent's orderQty signal: {{ orderQty() }}</p>
    <p><small>Change either stepper — both stay in sync through the shared parent signal.</small></p>
  \`,
})
export class App {
  orderQty = signal(3);
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
  <head><title>model() two-way binding</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Clamp QtyStepper\'s value so it can never go below 0 — update() should not decrement past zero.',
    hint: 'Change the decrement button\'s handler to: (click)="value.update(n => Math.max(0, n - 1))" — Math.max(0, ...) prevents the value from ever going negative, same clamping idea as any other signal update.',
    solution: `<button (click)="value.update(n => Math.max(0, n - 1))">-</button>`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'model() behaves like input() — the parent can read it, but the child cannot actually write back to it.',
      reality: 'model() is genuinely two-way — the child CAN write via .set()/.update(), and that change flows back to update the parent\'s bound signal. This is the entire point of model() as distinct from input(); input() alone is read-only from the child\'s side.',
    },
    {
      thought: 'the [(prop)] two-way binding syntax only works with built-in directives like ngModel, not with your own custom components.',
      reality: 'model() generates the matching input+output pair automatically, which is exactly what makes [(prop)] syntax work on ANY component that declares a model() — it is not special-cased to ngModel at all.',
    },
    {
      thought: 'supporting two-way binding on a custom component requires manually declaring a separate input() and a separate output() yourself.',
      reality: 'model() does both in ONE declaration — count = model(0); is the entire setup. Manually pairing an input() with a matching propChange output() would just be reimplementing what model() already provides for you.',
    },
  ];
}
