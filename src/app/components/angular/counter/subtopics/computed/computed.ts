import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-computed-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './computed.html',
  styleUrl: './computed.scss',
})
export class ComputedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The problem: keeping two values in sync by hand',
      points: [
        'Say you have <code>count = signal(0)</code> and you also want to show double that value somewhere. The naive approach: a second signal, <code>doubled = signal(0)</code>, updated manually every time <code>count</code> changes. Now you have two sources of truth, and it\'s only a matter of time before they drift out of sync (you update one and forget the other).',
        '<code>computed()</code> exists to remove that second source of truth entirely. Instead of a signal you update by hand, you write a small function that derives the value FROM other signals — and Angular keeps it correct for you, automatically, forever.',
      ],
    },
    {
      heading: 'Creating a computed signal',
      points: [
        '<code>doubled = computed(() => this.count() * 2);</code> — the argument is a callback. Inside it, you read whatever signals the derived value depends on. Angular watches which signals get read during that callback and remembers them as dependencies.',
        'You read a <code>computed()</code> exactly like a regular signal — by calling it: <code>doubled()</code>. That consistency is deliberate: code that reads a value doesn\'t need to know or care whether it\'s a plain <code>signal()</code> or a derived <code>computed()</code>.',
        'The callback re-runs automatically whenever one of its dependencies changes — you never call anything to "trigger" a recalculation. It just happens.',
      ],
    },
    {
      heading: 'Two things that make computed() cheap to use everywhere',
      points: [
        '<strong>It\'s lazy.</strong> The callback does not run when you create the computed signal — it only runs the first time something actually reads it. If a <code>computed()</code> is never read, its callback never executes at all.',
        '<strong>It\'s memoised (cached).</strong> After the first read, Angular stores the result. If you read <code>doubled()</code> five times in a row without <code>count</code> changing in between, the callback only actually runs once — the other four reads just return the cached value.',
        'Together, this means you can define as many <code>computed()</code> values as make your code readable, without worrying about performance — unused ones cost nothing, and repeatedly-read ones aren\'t repeatedly recalculated.',
      ],
    },
    {
      heading: 'You cannot write to a computed signal — and that\'s the point',
      points: [
        'There is no <code>.set()</code> or <code>.update()</code> on a <code>computed()</code> signal — TypeScript will give you a compile error if you try. This is intentional: a <code>computed()</code> value should always be a pure reflection of its dependencies, never something a caller can override.',
        'This gives you a one-directional flow: writable signals hold the "real" state, and any number of <code>computed()</code> values flow OUT of them. Nothing flows back in except through the original writable signal\'s own <code>.set()</code>/<code>.update()</code>.',
        'If you ever find yourself wanting to write to a computed value, that\'s usually a sign you actually want <code>linkedSignal()</code> instead (covered in a later subtopic) — a writable signal whose default happens to be computed, but that a user can override.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h2>Count: {{ count() }}</h2>
    <p>Doubled: {{ doubled() }}</p>
    <p>Is even: {{ isEven() }}</p>
    <button (click)="increment()">+1</button>
  \`,
})
export class App {
  count = signal(0);

  // Derived from count — recalculates only when count changes,
  // and only if something actually reads doubled()
  doubled = computed(() => this.count() * 2);

  // You can read other signals AND other computed() values inside one
  isEven = computed(() => this.count() % 2 === 0);

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
  <head><title>computed() basics</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a third computed() signal, "status", that returns the string "negative", "zero", or "positive" based on the current count value.',
    hint: 'A computed() callback can contain a normal if/else chain — it just needs to return a value at the end. Read count() once at the top and branch on it.',
    solution: `status = computed(() => {
  const c = this.count();
  if (c < 0) return 'negative';
  if (c === 0) return 'zero';
  return 'positive';
});

// Template: <p>Status: {{ status() }}</p>`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'computed() runs every time you read it, like calling a normal function.',
      reality: 'the FIRST read runs the callback and caches the result. Every subsequent read returns the cached value — until a dependency actually changes, at which point the cache is invalidated and the next read recalculates. It behaves like a function call from the outside, but it\'s not doing the work every time.',
    },
    {
      thought: 'you need to list the signals a computed() depends on somewhere, like a dependency array.',
      reality: 'there is no dependency array to write. Angular automatically tracks whichever signals your callback happens to call during its last run. Reading <code>this.count()</code> and <code>this.step()</code> inside the callback is enough — Angular figures out the rest.',
    },
    {
      thought: 'if a computed() is defined, it\'s doing work in the background, using resources even when nothing reads it.',
      reality: '<code>computed()</code> is lazy — an unread computed signal\'s callback has literally never executed. Defining ten computed values you only sometimes use costs nothing for the ones that go unread.',
    },
  ];
}
