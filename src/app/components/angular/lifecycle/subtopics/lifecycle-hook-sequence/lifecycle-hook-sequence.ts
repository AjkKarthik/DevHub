import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-lifecycle-hook-sequence-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './lifecycle-hook-sequence.html',
  styleUrl: './lifecycle-hook-sequence.scss',
})
export class LifecycleHookSequenceSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The guaranteed order',
      points: [
        'Every Angular component follows this order: <code>constructor</code> → <code>ngOnChanges</code> (if inputs exist) → <code>ngOnInit</code> → <code>ngDoCheck</code> → <code>ngAfterContentInit</code> → <code>ngAfterContentChecked</code> → <code>ngAfterViewInit</code> → <code>ngAfterViewChecked</code> → (repeat the three "checked" hooks on each CD cycle) → <code>ngOnDestroy</code>. This order is a GUARANTEE, not an implementation detail — code that depends on it (like reading a child ref only after the view initializes) is relying on real, documented behavior.',
      ],
    },
    {
      heading: '"Init" hooks fire once; "Checked" hooks fire every cycle',
      points: [
        'The "init" hooks — <code>ngOnInit</code>, <code>ngAfterContentInit</code>, <code>ngAfterViewInit</code> — each fire EXACTLY ONCE, ever. The "checked" hooks — <code>ngDoCheck</code>, <code>ngAfterContentChecked</code>, <code>ngAfterViewChecked</code> — fire on EVERY change detection cycle, for the entire lifetime of the component. This distinction alone explains most of the performance advice for these hooks: anything expensive in a "checked" hook runs constantly, not once.',
        '<code>ngOnChanges</code> is different again — it fires once before init, and then AGAIN on every subsequent <code>&#64;Input()</code> change (not on every CD cycle, only on actual input changes).',
      ],
    },
    {
      heading: 'The constructor is NOT a lifecycle hook',
      points: [
        'The constructor runs BEFORE Angular has set up inputs or the view — it is plain JavaScript class construction, not an Angular-managed lifecycle stage. Use it ONLY for dependency injection (<code>inject()</code> or constructor parameters) and for registering <code>effect()</code>/<code>afterNextRender()</code> calls, which specifically require being created in an injection context. Move data fetching and subscription setup to <code>ngOnInit</code> — inputs are not yet reliably available in the constructor.',
      ],
    },
    {
      heading: 'Zoneless Angular changes the "checked" hooks\' cost profile',
      points: [
        'In zoneless Angular (18+), <code>ngDoCheck</code> runs far less frequently — only when a SIGNAL CHANGE triggers re-evaluation, not on every possible browser event the way Zone.js-based change detection used to trigger it. The "checked" hooks that were historically a real performance risk become much less of a concern under zoneless change detection, though the fire-once-vs-fire-every-cycle distinction above still holds.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/child.ts',
      content: `import { Component, OnInit, OnChanges, DoCheck, AfterViewInit, OnDestroy, SimpleChanges, input } from '@angular/core';

@Component({
  selector: 'app-child',
  standalone: true,
  template: \`<p>Child (check the console for the hook order)</p>\`,
})
export class Child implements OnInit, OnChanges, DoCheck, AfterViewInit, OnDestroy {
  label = input('default');

  constructor() {
    console.log('1. constructor');
  }
  ngOnChanges(changes: SimpleChanges) {
    console.log('2. ngOnChanges', changes);
  }
  ngOnInit() {
    console.log('3. ngOnInit');
  }
  ngDoCheck() {
    console.log('4. ngDoCheck (fires every CD cycle)');
  }
  ngAfterViewInit() {
    console.log('5. ngAfterViewInit');
  }
  ngOnDestroy() {
    console.log('6. ngOnDestroy');
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
    <button (click)="show.set(!show())">Toggle child (watch ngOnDestroy fire)</button>
    <button (click)="label.set(label() + '!')">Change label (watch ngOnChanges fire)</button>
    @if (show()) {
      <app-child [label]="label()" />
    }
  \`,
})
export class App {
  show = signal(true);
  label = signal('Hello');
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
  <head><title>Lifecycle hook sequence</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add ngAfterContentInit and ngAfterContentChecked to Child, logging their own numbered step, and figure out where they should sit in the numbering relative to the existing hooks based on the documented order.',
    hint: 'ngAfterContentInit fires once, right after ngDoCheck and before ngAfterViewInit — so it slots in as step "4.5" conceptually (between the current 4 and 5). ngAfterContentChecked fires on every cycle, alongside ngDoCheck/ngAfterViewChecked.',
    solution: `ngAfterContentInit() {
  console.log('4a. ngAfterContentInit (once, before ngAfterViewInit)');
}
ngAfterContentChecked() {
  console.log('4b. ngAfterContentChecked (every cycle)');
}

// Full order: constructor → ngOnChanges → ngOnInit → ngDoCheck →
// ngAfterContentInit → ngAfterContentChecked → ngAfterViewInit → ngAfterViewChecked`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the constructor is just an earlier-firing lifecycle hook, functionally similar to ngOnInit but sooner.',
      reality: 'the constructor is plain JavaScript class construction that happens BEFORE Angular has wired up inputs or the view — it is not an Angular-managed lifecycle stage at all. Only DI and effect()/afterNextRender() registration belong there.',
    },
    {
      thought: 'ngDoCheck and ngAfterViewChecked fire only when something actually visibly changed, similar to ngOnChanges.',
      reality: 'the "checked" hooks fire on EVERY change detection cycle regardless of whether anything actually changed — this is precisely why they carry real performance weight if given expensive implementations, unlike ngOnChanges which only fires on genuine input changes.',
    },
    {
      thought: 'ngOnChanges always fires for every component, on every lifecycle pass, the same as ngDoCheck.',
      reality: 'if a component has NO &#64;Input() properties at all, ngOnChanges is never called — not even once, not even on first render. ngOnInit becomes the first hook to fire after the constructor in that case.',
    },
  ];
}
