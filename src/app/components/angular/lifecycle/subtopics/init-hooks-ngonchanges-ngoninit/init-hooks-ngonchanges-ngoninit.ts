import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-init-hooks-ngonchanges-ngoninit-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './init-hooks-ngonchanges-ngoninit.html',
  styleUrl: './init-hooks-ngonchanges-ngoninit.scss',
})
export class InitHooksNgonchangesNgoninitSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'ngOnChanges — a map of what changed',
      points: [
        '<code>ngOnChanges(changes: SimpleChanges)</code> receives a map keyed by input NAME, each entry carrying <code>previousValue</code>, <code>currentValue</code>, and <code>firstChange: boolean</code>. It fires BEFORE <code>ngOnInit</code> — so decorator-based inputs are already available by the time <code>ngOnInit</code> runs.',
        'Guard expensive work inside <code>ngOnChanges</code> with <code>if (changes[\'myInput\'].firstChange)</code> when you only want it to run once, not on every subsequent parent re-render that happens to touch the same input value.',
      ],
    },
    {
      heading: 'The single biggest migration gotcha: signal inputs do NOT trigger ngOnChanges',
      points: [
        'Switching a property from <code>&#64;Input()</code> to signal <code>input()</code> means <code>ngOnChanges</code> STOPS firing for that property entirely — this is one of the most common surprises when migrating. The reactive replacement is <code>effect(() =&gt; { this.myInput(); })</code>, which re-runs whenever the signal changes, created in the constructor (an injection context).',
        'A component with BOTH <code>&#64;Input()</code> (decorator) and <code>input()</code> (signal) properties gets <code>ngOnChanges</code> calls ONLY for the decorator-based ones — this inconsistency is itself a real source of confusion during a gradual migration. The cleanest fix: migrate every input on a component together, and drop <code>ngOnChanges</code> entirely once none remain.',
      ],
    },
    {
      heading: 'ngOnInit — the right place for setup work',
      points: [
        '<code>ngOnInit</code> is where you fetch data, set up subscriptions, and run initialization logic that needs injected services and resolved inputs — it fires once, after the first <code>ngOnChanges</code> (if any). Avoid DOM operations here — the component\'s OWN view has not finished rendering yet at this point (that is what <code>ngAfterViewInit</code> is for, next subtopic).',
      ],
    },
    {
      heading: 'Required inputs remove the need for ngOnInit null-checks',
      points: [
        '<code>&#64;Input({ required: true })</code> (Angular 16+) and its signal equivalent <code>input.required&lt;T&gt;()</code> both cause a COMPILE-TIME error if the parent forgets to bind them — eliminating an entire category of defensive null-checking or non-null-assertion (<code>!.</code>) code that used to live inside <code>ngOnInit</code> "just in case" a required input was missing.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/child.ts',
      content: `import { Component, OnChanges, OnInit, SimpleChanges, Input, input, effect } from '@angular/core';

@Component({
  selector: 'app-child',
  standalone: true,
  template: \`<p>Decorator input: {{ decoratorInput }} | Signal input: {{ signalInput() }}</p>\`,
})
export class Child implements OnChanges, OnInit {
  // Old-style decorator input — DOES trigger ngOnChanges
  @Input() decoratorInput = '';

  // Signal input — does NOT trigger ngOnChanges at all
  signalInput = input('default');

  constructor() {
    // The reactive replacement for reacting to signal input changes
    effect(() => {
      console.log('effect() saw signalInput change to:', this.signalInput());
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    // Only fires for decoratorInput — signalInput changes never appear here
    console.log('ngOnChanges (decorator inputs only):', changes);
  }

  ngOnInit() {
    console.log('ngOnInit — both inputs are readable here:', this.decoratorInput, this.signalInput());
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';
import { Child } from './child';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Child],
  template: \`
    <button (click)="decoratorVal.set(decoratorVal() + '!')">Change decorator input</button>
    <button (click)="signalVal.set(signalVal() + '!')">Change signal input</button>
    <app-child [decoratorInput]="decoratorVal()" [signalInput]="signalVal()" />
  \`,
})
export class App {
  decoratorVal = signal('A');
  signalVal = signal('B');
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
  <head><title>ngOnChanges and ngOnInit</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a firstChange guard to ngOnChanges so it only logs on the FIRST change of decoratorInput, staying silent on subsequent changes.',
    hint: 'if (changes[\'decoratorInput\']?.firstChange) { console.log(...); } — check the firstChange boolean on the specific SimpleChange entry before logging, skipping the log entirely when it is false.',
    solution: `ngOnChanges(changes: SimpleChanges) {
  if (changes['decoratorInput']?.firstChange) {
    console.log('First change only:', changes['decoratorInput']);
  }
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'migrating a component\'s inputs from @Input() to input() is purely cosmetic — ngOnChanges keeps working the same way either way.',
      reality: 'signal inputs do NOT trigger ngOnChanges at all — this is a genuine behavioral change, not a cosmetic one. The reactive replacement is effect(), and forgetting this during migration is one of the most common real bugs teams hit.',
    },
    {
      thought: 'ngOnInit is a safe place to read element dimensions or call methods on child components.',
      reality: 'the component\'s own view has not finished rendering when ngOnInit fires — DOM/child-component access belongs in ngAfterViewInit instead, covered in the next subtopic.',
    },
    {
      thought: 'a component with both @Input() and input() properties gets ngOnChanges calls for all of its inputs.',
      reality: 'ngOnChanges fires ONLY for the decorator-based @Input() properties — signal input() properties are completely invisible to it, even on a component that has both kinds side by side.',
    },
  ];
}
