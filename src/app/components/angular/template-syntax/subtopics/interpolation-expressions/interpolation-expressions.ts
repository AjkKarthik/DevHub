import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-interpolation-expressions-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './interpolation-expressions.html',
  styleUrl: './interpolation-expressions.scss',
})
export class InterpolationExpressionsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'What {{ }} actually evaluates',
      points: [
        'Interpolation <code>{{ expr }}</code> evaluates any TypeScript expression between the double curly braces and inserts the STRING result into the DOM — variables, arithmetic, ternaries, method calls, and pipe transforms are all valid; assignments, <code>new</code>, <code>++</code>, and multi-statement expressions are NOT.',
        'Expressions run in the context of the COMPONENT INSTANCE — no <code>this.</code> prefix needed. <code>{{ count() }}</code> reads the component\'s <code>count</code> signal directly, and it re-evaluates on every change detection cycle that touches the component.',
      ],
    },
    {
      heading: 'The single most common beginner mistake — forgetting the parentheses',
      points: [
        '<code>{{ count() }}</code> reads the signal\'s current value. <code>{{ count }}</code> — with NO parentheses — evaluates to the signal FUNCTION ITSELF, which stringifies to something like <code>[object Object]</code> in the DOM. This is a silent bug, not a compile error: the template renders successfully, just with the wrong text.',
      ],
    },
    {
      heading: 'Expressions must be pure — no side effects',
      points: [
        'Angular may evaluate a template expression MULTIPLE TIMES per change detection cycle — this is not a bug, it is how the framework decides whether re-rendering is needed. A method that mutates state, fires an HTTP request, or has any other observable side effect will run that side effect an unpredictable number of times if called directly from a template. Use <code>computed()</code> signals or plain class fields for anything that needs to happen exactly once per actual change.',
      ],
    },
    {
      heading: 'A specific OnPush trap: methods returning a new reference every call',
      points: [
        '<code>[items]="filterItems()"</code> — if <code>filterItems()</code> builds and returns a NEW array on every single call, a child component using <code>OnPush</code> change detection sees a "changed" input on EVERY parent change-detection cycle, even when the actual filtered data is identical to last time. The fix is the same one covered elsewhere on this site: wrap the derivation in <code>computed()</code>, which MEMOIZES its result and only produces a new reference when a dependency genuinely changes.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, computed, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>Correct — signal called with ()</h3>
    <p>{{ count() }}</p>

    <h3>Broken — signal called WITHOUT () (a real, silent bug)</h3>
    <p>{{ count }}</p>

    <button (click)="count.update(n => n + 1)">Increment</button>

    <h3>computed() — memoized, safe to bind repeatedly</h3>
    <p>Doubled: {{ doubled() }}</p>
  \`,
})
export class App {
  count = signal(0);

  // Memoized — only recomputes when count() actually changes, safe for OnPush children
  doubled = computed(() => this.count() * 2);
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
  <head><title>Interpolation and expressions</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a triple computed signal (count * 3) and display it, following the same memoized pattern as doubled.',
    hint: 'tripled = computed(() => this.count() * 3); then {{ tripled() }} in the template — same shape as the existing doubled computed, just a different multiplier.',
    solution: `tripled = computed(() => this.count() * 3);

// Template:
// <p>Tripled: {{ tripled() }}</p>`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'writing {{ count }} instead of {{ count() }} for a signal either shows an error or just silently shows nothing.',
      reality: 'it silently renders the signal\'s stringified function reference — typically "[object Object]" — with no error at all. The template compiles and runs fine; only the DISPLAYED VALUE is wrong, making this an easy mistake to miss during a quick glance.',
    },
    {
      thought: 'calling a method directly in a template binding, like [items]="filterItems()", is always safe as long as the method itself has no bugs.',
      reality: 'if the method returns a NEW array/object reference on every call (even with identical contents), an OnPush child component treats every parent change-detection cycle as an input change — a real, specific performance trap. Wrapping the derivation in computed() fixes it by memoizing the result.',
    },
    {
      thought: 'a template expression that fires an HTTP request or logs to the console is fine as long as it does not throw an error.',
      reality: 'Angular can evaluate a template expression multiple times per change-detection cycle — a side effect inside that expression can fire an unpredictable number of times, not just once per actual visible change. Side effects belong in computed()/effect() or explicit event handlers, never directly in a template expression.',
    },
  ];
}
