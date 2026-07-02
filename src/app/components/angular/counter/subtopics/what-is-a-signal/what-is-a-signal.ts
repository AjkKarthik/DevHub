import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-what-is-a-signal',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './what-is-a-signal.html',
  styleUrl: './what-is-a-signal.scss',
})
export class WhatIsASignal {

  theory: TheoryPoint[] = [
    {
      heading: 'The problem: plain properties don\'t tell Angular anything changed',
      points: [
        'Imagine a class with a normal property: <code>count = 0;</code>. If you write <code>this.count = 5;</code> somewhere, JavaScript happily updates the property — but nothing on screen knows to change. The template that shows <code>{{ count }}</code> has no way of finding out that the value is now different.',
        'Older Angular solved this with <strong>Zone.js</strong> — a library that patches almost every async browser API (click handlers, <code>setTimeout</code>, HTTP callbacks) so that after ANY of them run, Angular re-checks the entire component tree "just in case" something changed. It works, but it\'s a blunt instrument: Angular can\'t know exactly what changed, so it re-checks everything.',
        'A <strong>signal</strong> is a small wrapper around a value that Angular <em>can</em> ask "has anything read you, and did you change?" Because the signal itself is the thing being read (not a plain property), Angular can track precisely which parts of the template depend on which signal — and update only those parts.',
        'This is the whole reason signals exist: not to make writing code shorter, but to give Angular exact, cheap knowledge of what changed, so it can skip re-checking everything else.',
      ],
    },
    {
      heading: 'Creating a signal',
      points: [
        '<code>import { signal } from \'@angular/core\';</code> — then <code>count = signal(0);</code> creates a signal whose starting value is <code>0</code>. The argument to <code>signal(...)</code> is just the initial value; it can be a number, string, object, array — anything.',
        'What you get back, <code>count</code>, is not a number — it\'s a small function-like object. This is the single most important thing to understand before writing any signal code.',
        'A signal created this way is a <strong><code>WritableSignal</code></strong> — you\'re allowed to change its value later. (You\'ll meet read-only signals, created by <code>computed()</code>, in the next subtopic — they look similar but can\'t be written to.)',
      ],
    },
    {
      heading: 'Reading a signal — the part everyone forgets at first',
      points: [
        'To get the current value out of a signal, you <strong>call it like a function</strong>: <code>count()</code>. Not <code>count</code>, not <code>count.value</code> — <code>count()</code>, with parentheses.',
        'If you write <code>{{ count }}</code> in a template (forgetting the parentheses), Angular will render something like <code>"[object Object]"</code> or a function reference — not the number you expected. It will also silently NOT update when the value changes, because nothing actually asked the signal for its value.',
        'Calling <code>count()</code> does two things at once: it returns the current value, <em>and</em>, if you\'re inside a template, a <code>computed()</code>, or an <code>effect()</code>, it registers "this piece of code depends on <code>count</code>" — that\'s how Angular knows what to re-check later.',
        'Outside of those three places (template, computed, effect), calling <code>count()</code> is just a normal function call that returns a value — nothing special happens, no tracking occurs. You can safely call a signal inside a plain method, a <code>setTimeout</code> callback, or a click handler.',
      ],
    },
    {
      heading: 'Changing a signal\'s value',
      points: [
        '<code>count.set(5)</code> replaces the value outright. Use this when you already know the exact new value — for example, resetting to 0, or setting it from a value the user just typed.',
        '<code>count.update(n => n + 1)</code> derives the new value <em>from the current value</em>, using a callback. Use this whenever the new value depends on the old one — incrementing, toggling a boolean, appending to a list.',
        'Why not always use <code>set()</code> with something like <code>count.set(count() + 1)</code>? It works for simple cases, but <code>update()</code> is the more correct habit: it reads and writes atomically as one step, which matters once your code gets more complex (e.g. the same signal being updated from two different event handlers).',
        'Both <code>set()</code> and <code>update()</code> are <strong>synchronous</strong> — the moment the line finishes executing, <code>count()</code> immediately returns the new value. There is no delay, no promise, no subscription to wait on.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h2>{{ count() }}</h2>
    <button (click)="increment()">+1</button>
    <button (click)="reset()">Reset</button>
  \`,
})
export class App {
  // 1. Create the signal with an initial value
  count = signal(0);

  // 2. Call .update() when the new value depends on the old one
  increment() {
    this.count.update(n => n + 1);
  }

  // 3. Call .set() when you know the exact new value
  reset() {
    this.count.set(0);
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
  <head><title>Signal basics</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Starting from the counter above, add a decrement() method and a "-1" button that lowers the count by one — but never below zero.',
    hint: 'Use .update() with Math.max(0, n - 1) so the callback clamps the result instead of letting it go negative.',
    solution: `decrement() {
  this.count.update(n => Math.max(0, n - 1));
}

// Template:
// <button (click)="decrement()">-1</button>`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a signal is basically a variable with a different name.',
      reality: 'a signal is an object that <em>wraps</em> a value. The variable (<code>count</code>) never holds the number itself — it holds the signal, and you have to call it (<code>count()</code>) to get the number out. This indirection is exactly what lets Angular track reads.',
    },
    {
      thought: '<code>set()</code> and <code>update()</code> do the same thing, so it doesn\'t matter which one you use.',
      reality: '<code>set(val)</code> needs the finished value handed to it. <code>update(fn)</code> hands you the <em>current</em> value and expects the new one back. Using <code>set(count() + 1)</code> instead of <code>update(n => n + 1)</code> usually still works for simple UI code, but it reads the value and writes it as two separate steps instead of one atomic step — get in the habit of reaching for <code>update()</code> whenever the new value depends on the old one.',
    },
    {
      thought: 'signals are like Observables — you need to subscribe to get updates.',
      reality: 'Signals are synchronous and pull-based: you just call <code>count()</code> whenever you want the current value, right now. There\'s no subscription, no async pipe, no "waiting for an emission". Observables are still useful for actual asynchronous streams (HTTP, WebSockets) — signals are for values you already have.',
    },
  ];
}
