import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-input-signals-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './input-signals.html',
  styleUrl: './input-signals.scss',
})
export class InputSignalsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'input() — a signal, not a plain property',
      points: [
        '<code>title = input&lt;string&gt;(\'default\')</code> declares an OPTIONAL signal input with a default value. <code>title = input.required&lt;string&gt;()</code> makes it required — TypeScript raises a compile error if the parent forgets to bind it, catching the mistake before the app ever runs.',
        'Read the value by CALLING it as a signal: <code>this.title()</code> — not <code>this.title</code>. There is no <code>ngOnChanges</code> lifecycle hook to write and no risk of reading a stale cached value; the signal is always current.',
      ],
    },
    {
      heading: 'Inputs are read-only from the child\'s side',
      points: [
        '<code>InputSignal&lt;T&gt;</code> has NO <code>.set()</code> or <code>.update()</code> method — only the PARENT can change the value, by changing whatever expression it binds in the template. The child can read it, derive from it with <code>computed()</code>, or react to it with <code>effect()</code>, but never write to it directly. (For a signal the child CAN write back through, see the next subtopic — <code>model()</code>.)',
      ],
    },
    {
      heading: 'transform — converting attribute strings automatically',
      points: [
        '<code>input(0, { transform: numberAttribute })</code> automatically converts an incoming attribute STRING into a number — useful because HTML attributes are always strings, but you often want a typed value. Angular ships <code>numberAttribute</code> and <code>booleanAttribute</code> transform functions for the two most common cases; you can also pass any custom function of your own.',
      ],
    },
    {
      heading: 'Route params flow into input() automatically',
      points: [
        'With <code>withComponentInputBinding()</code> enabled on the router, a route param like <code>:id</code> is automatically mapped to an <code>input()</code> of the SAME NAME on the routed component — no <code>ActivatedRoute.snapshot.paramMap.get(\'id\')</code> boilerplate needed. Declare <code>id = input&lt;string&gt;();</code> on the component and the router populates it for you when the route activates.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/badge.ts',
      content: `import { Component, input, numberAttribute, computed } from '@angular/core';

@Component({
  selector: 'app-badge',
  standalone: true,
  template: \`
    <span class="badge" [class.high]="isHigh()">
      {{ label() }}: {{ count() }}
    </span>
  \`,
  styles: [\`
    .badge { padding: .3rem .6rem; border-radius: 6px; background: #eee; }
    .badge.high { background: #fecaca; }
  \`],
})
export class Badge {
  label = input.required<string>();               // required — compile error if parent forgets it
  count = input(0, { transform: numberAttribute }); // attribute string -> number automatically

  isHigh = computed(() => this.count() > 10);
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';
import { Badge } from './badge';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Badge],
  template: \`
    <button (click)="qty.update(n => n + 1)">Increment</button>
    <!-- [count] binds a real number signal; count="15" (no brackets) would pass the STRING "15",
         which numberAttribute converts for us either way -->
    <app-badge label="Items" [count]="qty()" />
  \`,
})
export class App {
  qty = signal(3);
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
  <head><title>input() signals</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a required "max" input to Badge and update isHigh() to compare count() against max() instead of the hardcoded 10.',
    hint: 'max = input.required<number>(); then change isHigh = computed(() => this.count() > this.max()); — the parent must now also bind [max]="someNumber" or Angular reports a compile error since it is required.',
    solution: `max = input.required<number>();
isHigh = computed(() => this.count() > this.max());

// Parent template:
// <app-badge label="Items" [count]="qty()" [max]="10" />`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'you read a signal input the same way as a plain @Input() property — this.title, no parentheses.',
      reality: 'a signal input must be CALLED like a function to read its current value — this.title(), not this.title. Forgetting the parentheses is a very common first mistake and does not error; it just silently gives you the signal function reference instead of its value.',
    },
    {
      thought: 'a child component can update its own input() value locally, the same way it could reassign a plain property.',
      reality: 'InputSignal has no .set() or .update() — it is READ-ONLY from the child\'s side. Only the parent can change it, by changing what it binds. A child that needs to both read AND write a value shared with its parent should use model() instead, covered in the next subtopic.',
    },
    {
      thought: 'transform functions like numberAttribute are only useful for unusual custom scenarios, not common in everyday code.',
      reality: 'numberAttribute/booleanAttribute solve a genuinely everyday problem — HTML attributes are always strings, so any numeric or boolean input bound via a plain (unbracketed) attribute needs conversion. These built-in transforms handle the two most common cases with zero custom code.',
    },
  ];
}
