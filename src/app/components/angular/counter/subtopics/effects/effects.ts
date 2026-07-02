import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-effects-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './effects.html',
  styleUrl: './effects.scss',
})
export class EffectsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'computed() gives you a value — effect() lets you DO something',
      points: [
        '<code>computed()</code> is for producing a new value from other signals. But sometimes you don\'t want a value — you want to run some code as a side effect: write to <code>localStorage</code>, call <code>console.log</code>, update the page title, send an analytics event.',
        '<code>effect(() => { ... })</code> runs its callback once immediately, then automatically re-runs it every time a signal read inside the callback changes — using the exact same dependency-tracking mechanism as <code>computed()</code>, just without producing a return value anyone reads.',
      ],
    },
    {
      heading: 'Where you\'re allowed to create an effect()',
      points: [
        'An effect must be created inside an <strong>injection context</strong> — in practice, this almost always means: as a field initialiser, or inside a constructor. <code>count = signal(0); constructor() { effect(() => console.log(this.count())); }</code> works; calling <code>effect(...)</code> from inside some other method later does not, and will throw at runtime.',
        'Why the restriction? Angular ties the effect\'s lifetime to whatever it was created in — usually a component or service. When that component/service is destroyed, Angular automatically stops the effect for you. Without an injection context, there\'s nothing to tie that lifetime to, and you\'d get effects that quietly keep running (and leaking) after the thing that created them is gone.',
      ],
    },
    {
      heading: 'The rule that trips almost everyone up at least once: don\'t write to what you read',
      points: [
        'If an effect reads signal <code>A</code> and then writes to signal <code>A</code>, that write causes the effect to re-run (because it changed a signal it depends on) — which reads <code>A</code> again, writes again, and so on: an infinite loop.',
        'Writing to a DIFFERENT signal than the one you read is fine and extremely common (e.g. reading <code>count</code>, writing to a <code>history</code> log signal). The danger is specifically reading-then-writing the SAME signal inside one effect.',
        'If you genuinely need to write back to a signal an effect also reads, Angular requires you to opt in explicitly with <code>effect(() => {...}, { allowSignalWrites: true })</code> — treat needing this option as a signal (no pun intended) to reconsider the design; it usually means the logic belongs in a plain method instead.',
      ],
    },
    {
      heading: 'Cleanup — for timers, subscriptions, and event listeners',
      points: [
        'An effect callback can optionally return a cleanup function: <code>effect(() => { const id = setInterval(...); return () => clearInterval(id); })</code>. Angular calls the cleanup function right before the effect runs again, AND when the effect is destroyed.',
        'This is the same mental model as a <code>useEffect</code> cleanup in React, if you\'ve used that — set something up, return a function that tears it down, and Angular calls it at the right time automatically.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal, effect } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h2>Count: {{ count() }}</h2>
    <button (click)="increment()">+1</button>
    <p>Check the browser console — every click logs a line.</p>
    <ul>
      @for (line of log(); track $index) {
        <li>{{ line }}</li>
      }
    </ul>
  \`,
})
export class App {
  count = signal(0);
  log = signal<string[]>([]);

  constructor() {
    // Runs once immediately, then again every time count() changes
    effect(() => {
      const val = this.count();
      console.log('count is now', val);

      // Writing to a DIFFERENT signal (log) is fine —
      // writing to count itself here would infinite-loop
      this.log.update(lines => [\`Changed to \${val}\`, ...lines].slice(0, 5));
    });
  }

  increment() {
    this.count.update(n => n + 1);
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
  <head><title>effect() basics</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a second effect() that updates document.title to show the current count, e.g. "Count: 3". Keep the existing effect untouched.',
    hint: 'document.title = `Count: ${this.count()}` inside its own effect(() => { ... }) — a component/service can have as many separate effects as you need.',
    solution: `constructor() {
  effect(() => {
    const val = this.count();
    console.log('count is now', val);
    this.log.update(lines => [\`Changed to \${val}\`, ...lines].slice(0, 5));
  });

  // A second, independent effect — reads the same signal, does something else
  effect(() => {
    document.title = \`Count: \${this.count()}\`;
  });
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'effect() runs synchronously, the instant the signal it reads changes.',
      reality: 'effect() re-runs are scheduled and batched — they happen in a microtask after the current change detection cycle finishes, not the exact instant <code>.set()</code>/<code>.update()</code> is called. If you need a value that\'s immediately, synchronously correct, use <code>computed()</code> instead — effect() is for side effects, not for producing values other code reads right away.',
    },
    {
      thought: 'you can create an effect() wherever you want, as long as you\'re inside some component method.',
      reality: 'effect() must be created in an injection context — a field initialiser or the constructor. Calling it from inside a regular method (e.g. a click handler, after the component has already been constructed) throws an error, because Angular needs to tie the effect\'s lifetime to something when it\'s created, not retroactively.',
    },
    {
      thought: 'writing to any signal inside effect() is dangerous and should be avoided.',
      reality: 'only writing to a signal the SAME effect also reads is dangerous (infinite loop risk). Writing to a completely different signal inside an effect — like updating a log, a "last saved" timestamp, or a derived cache — is a normal, common, and safe pattern.',
    },
  ];
}
