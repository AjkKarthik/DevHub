import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-debugging-unexpected-linkedsignal-resets-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './debugging-unexpected-linkedsignal-resets.html',
  styleUrl: './debugging-unexpected-linkedsignal-resets.scss',
})
export class DebuggingUnexpectedLinkedsignalResetsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two symptoms, two opposite root causes',
      points: [
        'Symptom A — "my linkedSignal resets when I did not expect it to": almost always caused by the <code>source</code> function producing a NEW object reference every time it runs, even when the logically-relevant data has not changed (the classic <code>source: () =&gt; ({ a: sigA(), b: sigB() })</code> new-object-every-read trap) — fixed with a custom <code>equal</code> function.',
        'Symptom B — "my linkedSignal does NOT reset when I expected it to": almost always caused by a signal being read inside <code>computation</code> instead of <code>source</code> — since only <code>source</code> reads are tracked as reset triggers. Fixed by moving that signal read into <code>source</code>.',
        'These are opposite bugs with opposite fixes, but from the OUTSIDE they can look confusingly similar ("the linkedSignal isn\'t doing what I expect") — the console-logging technique below distinguishes them immediately.',
      ],
    },
    {
      heading: 'A logging wrapper around source and computation',
      points: [
        'Temporarily instrument BOTH functions with console logs to see exactly when each one runs: <code>source: () =&gt; { const v = this.myDependency(); console.log(\'[source] ran, produced:\', v); return v; }</code> and similarly inside <code>computation</code>. If you see "[source] ran" logged far MORE often than expected (e.g. on every render), that confirms Symptom A — a reference-inequality issue. If a dependency change does NOT produce a "[source] ran" log at all, that confirms Symptom B — the signal is not actually inside <code>source</code>.',
        'This is a TEMPORARY debugging technique — remove the console.log calls once the bug is understood and fixed. It is not something to leave in production code (unlike, say, an intentional structured logging call).',
      ],
    },
    {
      heading: 'Using effect() as a read-only observation tool (never to fix the bug itself)',
      points: [
        'A separate <code>effect(() =&gt; console.log(\'linkedSignal value is now:\', this.myLinkedSignal()))</code> placed alongside the linkedSignal shows you every value it actually settles on, in order — useful for confirming whether a suspected reset actually happened or whether the VALUE happened to compute to something coincidentally similar to the previous one (making it look like "no reset happened" when one actually did).',
        'This diagnostic effect must remain purely observational (a <code>console.log</code>, nothing more) — using it to call <code>.set()</code> on a DIFFERENT signal would recreate exactly the effect-based anti-pattern that <code>linkedSignal()</code> exists to eliminate in the first place.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/debug-demo.ts',
      content: `import { Component, signal, linkedSignal, effect } from '@angular/core';

@Component({
  selector: 'app-debug-demo',
  standalone: true,
  template: \`
    <button (click)="a.update(n => n + 1)">Change A (a: {{ a() }})</button>
    <button (click)="b.update(n => n + 1)">Change B (b: {{ b() }})</button>
    <p>Linked value: {{ linked() }}</p>
    <p>Open the console to see [source] and [computation] logs, plus the effect trace.</p>
  \`,
})
export class DebugDemoComponent {
  a = signal(0);
  b = signal(0);

  // BUGGY VERSION (Symptom A): source returns a new object every read,
  // even though only 'a' logically matters for the reset decision here.
  linked = linkedSignal<{ a: number; b: number }, string>({
    source: () => {
      const v = { a: this.a(), b: this.b() };
      console.log('[source] ran, produced:', v);
      return v;
    },
    computation: (src) => {
      console.log('[computation] ran with:', src);
      return \`snapshot-\${src.a}\`;
    },
  });

  constructor() {
    // Read-only observation — logs every settled value, never mutates another signal
    effect(() => console.log('[effect trace] linked value is now:', this.linked()));
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { DebugDemoComponent } from './debug-demo';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DebugDemoComponent],
  template: \`
    <h3>Debugging unexpected linkedSignal resets</h3>
    <p>Click "Change B" — watch [source] fire on EVERY click (even though computation
    only cares about 'a'), while [computation] and the effect trace only show a NEW
    value when 'a' itself actually changes the resulting string.</p>
    <app-debug-demo />
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
  <head><title>Debugging unexpected linkedSignal resets</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Fix the demo\'s Symptom A bug by adding a custom equal function so changing B alone does not cause computation to re-run.',
    hint: 'Add equal: (x, y) => x.a === y.a to the linkedSignal options — this tells Angular the source is unchanged (for reset purposes) whenever "a" is the same, regardless of "b".',
    solution: `linked = linkedSignal<{ a: number; b: number }, string>({
  source: () => {
    const v = { a: this.a(), b: this.b() };
    console.log('[source] ran, produced:', v);
    return v;
  },
  computation: (src) => {
    console.log('[computation] ran with:', src);
    return \`snapshot-\${src.a}\`;
  },
  equal: (x, y) => x.a === y.a, // ignore 'b' entirely for reset purposes
});`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"resets too often" and "does not reset when expected" are the same underlying bug with the same fix.',
      reality: 'they are opposite root causes — resetting too often is usually a reference-inequality issue in source (fixed with equal), while not resetting enough is usually a signal read inside computation instead of source (fixed by moving the read).',
    },
    {
      thought: 'if the effect trace shows the same value logged twice in a row, no reset happened.',
      reality: 'a reset can happen and still produce a value that is coincidentally IDENTICAL to the previous one — the effect trace confirms the final VALUE, not whether source/computation actually re-ran; pair it with source/computation logging to distinguish the two.',
    },
    {
      thought: 'a diagnostic effect() used to trace linkedSignal values is fine to leave calling .set() on related signals for convenience.',
      reality: 'a debugging effect must stay purely observational (console.log only) — using it to set another signal recreates the exact effect-based anti-pattern linkedSignal exists to replace.',
    },
  ];
}
