import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { DefaultCdComponent } from './default-cd/default-cd';
import { OnpushCdComponent } from './onpush-cd/onpush-cd';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';
import { PrerequisitesComponent, Prerequisite } from '../../shared/prerequisites/prerequisites';

@Component({
  selector: 'app-change-detection',
  imports: [
    CodeBlockComponent, TheoryBlockComponent, DefaultCdComponent, OnpushCdComponent,
    QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent,
    QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent,
    PageMetaComponent, PageCompleteComponent,
    RevisionCardComponent, PrerequisitesComponent,
  ],
  templateUrl: './change-detection.html',
  styleUrl: './change-detection.scss',
})
export class ChangeDetectionDemo {
  sharedCount = signal(0);
  mutableObj  = { value: 0 };
  renderLog   = signal<string[]>([]);

  private log(msg: string) {
    this.renderLog.update(l => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...l].slice(0, 10));
  }

  mutateObject() {
    this.mutableObj.value++;
    this.log('Mutated object (same reference) — OnPush WON\'T re-render');
  }

  replaceObject() {
    this.mutableObj = { value: this.mutableObj.value + 1 };
    this.log('Replaced object (new reference) — OnPush WILL re-render');
  }

  prerequisites: Prerequisite[] = [
    { label: 'Signal Effects', route: '/angular/signal-effects' },
    { label: 'Component Lifecycle', route: '/angular/lifecycle' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'ChangeDetectionStrategy.OnPush', type: 'class', desc: 'Tells Angular to skip change detection for a component unless an input reference changes, an internal event fires, or a signal updates.', since: '2' },
    { name: 'ChangeDetectionStrategy.Default', type: 'class', desc: 'Checks the component on every change detection cycle triggered by any async event anywhere in the app.', since: '2' },
    { name: 'ChangeDetectorRef', type: 'class', desc: 'Injectable reference that lets you manually control a component\'s position in the change detection tree via markForCheck(), detectChanges(), detach(), and reattach().', since: '2' },
    { name: 'markForCheck()', type: 'method', desc: 'Schedules an OnPush component for re-check on the next change detection cycle; needed when state changes outside Angular\'s zone.', since: '2' },
    { name: 'detectChanges()', type: 'method', desc: 'Synchronously runs change detection for a component and its subtree right now, bypassing the normal scheduler.', since: '2' },
    { name: 'detach()', type: 'method', desc: 'Removes a component from the change detection tree entirely so it is never automatically checked; you must call detectChanges() manually.', since: '2' },
    { name: 'reattach()', type: 'method', desc: 'Reinserts a previously detached component back into the change detection tree.', since: '2' },
    { name: 'signal()', type: 'function', desc: 'Creates a reactive primitive that notifies Angular\'s scheduler when its value changes, triggering surgical re-renders of only the components that read it.', since: '16' },
    { name: 'input()', type: 'function', desc: 'Signal-based replacement for @Input() that exposes a read-only signal, works perfectly with OnPush, and eliminates the need for ngOnChanges.', since: '17' },
    { name: 'provideZonelessChangeDetection()', type: 'function', desc: 'Removes zone.js entirely and relies solely on signals and explicit scheduler notifications. Stable in Angular 18+.', since: '18' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'How Angular\'s change detection tree works',
      points: [
        'Angular\'s change detection (CD) is a <strong>top-down tree walk</strong> that compares each component\'s bound template expressions with their last-known values. If anything changed, Angular re-renders that component\'s DOM. This walk starts at the root component and visits every component in depth-first order.',
        'What triggers a CD cycle? Zone.js patches all async APIs (setTimeout, Promise, XHR, click events) and calls <code>ApplicationRef.tick()</code> after each one completes. That tick starts the tree walk from the root. Without zone.js (zoneless mode), Angular only runs CD when signals or explicit scheduler calls request it.',
        'There are two strategies: <code>Default</code> (check this component on every CD cycle) and <code>OnPush</code> (skip this component unless one of its specific triggers fires). Both strategies exist per-component and do not inherit to children.',
        'A component that is marked "clean" (no inputs changed, no events, no signals changed) under <code>OnPush</code> is skipped entirely — Angular does not even evaluate its template expressions. This is the performance win: large subtrees can be completely bypassed in a single cycle.',
        'The CD tree is separate from the component tree. <code>cdRef.detach()</code> removes a component\'s subtree from CD entirely — it will never be checked until reattached. This is the escape hatch for manual rendering, e.g. canvas or WebGL scenes that manage their own repaint loop.',
      ],
    },
    {
      heading: 'OnPush re-render triggers — the complete list',
      points: [
        '<strong>Input reference changes</strong>: when a parent passes a new object or array reference to an <code>@Input()</code> or <code>input()</code>, OnPush marks the component dirty. Mutating the same object/array (push, splice, property assignment) keeps the reference identical — OnPush never sees it.',
        '<strong>Events inside the component</strong>: any DOM event (click, input, keydown) that originates from inside the component\'s own template causes Angular to mark that component and its ancestors dirty, triggering a CD cycle for that branch.',
        '<strong>Signal changes</strong>: when a <code>signal()</code> or <code>computed()</code> that a template reads changes its value, Angular\'s reactive graph marks only the affected components dirty — this is the most surgical trigger available. No event, no zone notification, no tree walk needed.',
        '<strong>async pipe emissions</strong>: when an Observable bound via <code>| async</code> emits a new value, the async pipe internally calls <code>markForCheck()</code>, scheduling the component for re-check on the next cycle.',
        '<strong>Explicit <code>markForCheck()</code> / <code>detectChanges()</code></strong>: injecting <code>ChangeDetectorRef</code> and calling these methods manually lets you schedule or force a re-check. Use this when receiving data from third-party callbacks, WebSockets, or any API that runs outside Angular\'s zone and does not use signals.',
      ],
    },
    {
      heading: 'Signals and OnPush — surgical re-rendering',
      points: [
        'Signals integrate with Angular\'s <strong>reactive graph</strong>. When a template reads <code>count()</code>, Angular records that this component depends on <code>count</code>. When <code>count</code> changes, only components that directly read it are scheduled for re-check — siblings, parents, and unrelated subtrees are untouched.',
        'Combining signals with <code>OnPush</code> is the recommended production pattern: <code>OnPush</code> prevents unnecessary top-down CD passes triggered by unrelated events, while signals ensure the component still updates exactly when its data changes.',
        '<code>input()</code> (signal input, Angular 17+) replaces <code>@Input()</code> and eliminates the need for <code>ngOnChanges</code>. The parent writes to it; the child reads the signal. Under OnPush, Angular automatically schedules a re-render when the parent passes a new value.',
        '<code>computed()</code> signals are lazy: the derived value is not recalculated until something reads it. This means computed signals in OnPush components do not trigger re-renders unless the template actually reads the computed signal and the underlying dependency changed.',
        'Migration recipe: add <code>changeDetection: ChangeDetectionStrategy.OnPush</code> to the component decorator, convert all mutable state fields to <code>signal()</code>, and replace <code>@Input()</code> with <code>input()</code>. In most cases zero additional code is needed — no <code>markForCheck()</code>, no <code>ngOnChanges</code>.',
      ],
    },
    {
      heading: 'ChangeDetectorRef — manual control patterns',
      points: [
        '<code>inject(ChangeDetectorRef)</code> gives access to four key methods: <code>markForCheck()</code> (schedule re-check next cycle), <code>detectChanges()</code> (run right now synchronously), <code>detach()</code> (remove from CD tree), and <code>reattach()</code> (return to CD tree). Each serves a distinct scenario.',
        '<code>markForCheck()</code> is the standard tool for OnPush components that receive updates from outside Angular\'s zone — WebSocket handlers, third-party library callbacks, or <code>setInterval</code> running outside <code>NgZone</code>. It schedules a re-check on the next CD tick rather than running synchronously.',
        '<code>detectChanges()</code> runs the CD cycle for this component and its entire subtree <strong>immediately and synchronously</strong>. Use it when you need an instant DOM update and cannot wait for the next CD cycle — e.g., before measuring DOM dimensions for a layout calculation.',
        '<code>detach()</code> is the extreme escape hatch. After detaching, the component is completely invisible to the CD tree. You take full responsibility for calling <code>detectChanges()</code> when you want the DOM to update. This is appropriate for charts or animation loops with their own requestAnimationFrame cycle.',
        'In modern Angular with signals, direct use of <code>ChangeDetectorRef</code> is increasingly rare. Signal-based state makes <code>markForCheck()</code> unnecessary; <code>detach()</code>/<code>detectChanges()</code> remain relevant for very specialised performance scenarios.',
      ],
    },
    {
      heading: 'Zoneless change detection — removing Zone.js',
      points: [
        'Zone.js is a monkey-patch library that wraps all browser async APIs (setTimeout, Promise, XHR, addEventListener) to detect when async work completes and then trigger a CD cycle. The cost: every async operation — even ones that have nothing to do with Angular state — causes a full CD pass from the root.',
        'Zoneless mode (<code>provideZonelessChangeDetection()</code>, stable in Angular 18) removes zone.js entirely. Angular then relies exclusively on signals and explicit scheduler notifications (<code>markForCheck()</code>) to know when to run CD. This eliminates thousands of unnecessary CD cycles in apps heavy with third-party timers or WebSocket messages.',
        'In zoneless apps, every state update must be observable by Angular. That means: use signals for all mutable state, use <code>httpResource()</code> or <code>async</code> pipe for HTTP, and call <code>markForCheck()</code> in any native callback that changes state. Failing to do this means the DOM simply does not update.',
        'The Angular team recommends the migration path: first move to <code>OnPush</code> everywhere + signals, then enable zoneless. This staged approach reveals any remaining zone-dependent code before zone.js is removed entirely.',
        'Zoneless mode is the foundation for better SSR hydration, smaller bundle size (zone.js is ~30KB), and predictable CD performance. New Angular apps should start zoneless from day one; existing apps should budget 1–3 sprints for the migration depending on third-party library usage.',
      ],
    },
    {
      heading: 'Common performance patterns and gotchas',
      points: [
        'Object <strong>mutation</strong> (push to array, set a property directly) is invisible to OnPush — always create new references: <code>this.items = [...this.items, newItem]</code>, <code>this.obj = { ...this.obj, value: 42 }</code>. Signals solve this by design: <code>.update()</code> always notifies Angular.',
        'The <code>| async</code> pipe in templates automatically subscribes, unsubscribes, and calls <code>markForCheck()</code> when the Observable emits. It is safe with OnPush. Without it (manual subscribe), you must call <code>markForCheck()</code> yourself and manage unsubscription with <code>takeUntilDestroyed</code>.',
        'OnPush does NOT inherit to children. If a parent is OnPush but a child uses Default, the child is checked every time the parent is checked. The benefit is lost unless every component in the subtree uses OnPush. The Angular CLI schematics (<code>ng generate --change-detection OnPush</code>) default to OnPush for this reason.',
        '<code>ngOnChanges</code> is never called for <code>input()</code> signal inputs — it only fires for <code>@Input()</code> decorator inputs. If you use signal inputs and need to react to changes, use <code>effect(() => this.title())</code> instead.',
        'The <code>ExpressionChangedAfterItHasBeenCheckedError</code> in development is Angular catching a violation of CD contract: a template expression changed its value after CD completed for that component. The fix is usually to move the mutation inside <code>ngAfterViewInit</code> or schedule it with <code>setTimeout()</code>.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Default vs OnPush',
      language: 'typescript',
      code: `// Default: checks EVERY component on EVERY async event (click, timer, HTTP...)
@Component({ changeDetection: ChangeDetectionStrategy.Default })
export class DefaultComponent { count = 0; }

// OnPush: only re-renders when one of 5 triggers fires:
//  1. An @Input()/@input() receives a new reference (not mutation)
//  2. An event fires INSIDE this component's template
//  3. An Observable via | async emits
//  4. markForCheck() / detectChanges() called manually
//  5. A signal() it reads changes  ← Angular 17+, recommended
@Component({ changeDetection: ChangeDetectionStrategy.OnPush })
export class FastComponent {
  // Signals: the template reads count() — Angular auto-tracks the dependency
  count = signal(0);
  double = computed(() => this.count() * 2);
  increment() { this.count.update(n => n + 1); } // notifies Angular immediately
}

// Best practice: OnPush + signals on every component
// → Angular only re-renders the exact components that need it`,
    },
    {
      label: 'ChangeDetectorRef patterns',
      language: 'typescript',
      code: `import { ChangeDetectorRef, inject } from '@angular/core';

@Component({ changeDetection: ChangeDetectionStrategy.OnPush })
export class MyComponent {
  private cdr = inject(ChangeDetectorRef);
  messages = signal<string[]>([]);

  // ── markForCheck() — schedule re-check next CD cycle ───────────
  // Use when updating state from outside Angular's zone (WebSocket, setInterval)
  onSocketMessage(msg: string) {
    this.messages.update(m => [...m, msg]);  // signal — no markForCheck needed!
  }

  // Without signals: push + manual markForCheck
  messagesArr: string[] = [];
  onSocketMessageLegacy(msg: string) {
    this.messagesArr = [...this.messagesArr, msg];
    this.cdr.markForCheck(); // tell Angular to check this component next cycle
  }

  // ── detectChanges() — synchronous, immediate ─────────────────────
  // Use when you need DOM updated before measuring layout
  updateAndMeasure() {
    this.cdr.detectChanges();
    const h = this.el.nativeElement.offsetHeight; // safe: DOM is up to date
  }

  // ── detach() / reattach() — remove from tree entirely ───────────
  // Canvas/WebGL component that renders at 60fps via rAF
  ngOnInit() { this.cdr.detach(); }
  renderFrame() {
    // ... update internal state ...
    this.cdr.detectChanges(); // manual repaint
    requestAnimationFrame(() => this.renderFrame());
  }
}`,
    },
    {
      label: 'Signals + input() migration',
      language: 'typescript',
      code: `// ── BEFORE: @Input() + ngOnChanges ──────────────────────────────
@Component({ changeDetection: ChangeDetectionStrategy.OnPush })
export class OldCardComponent implements OnChanges {
  @Input() title: string = '';
  @Input() count: number = 0;
  renderCount = 0;

  ngOnChanges() {
    this.renderCount++;          // fires when EITHER input changes
  }
}

// ── AFTER: input() signals + effect() ───────────────────────────
@Component({ changeDetection: ChangeDetectionStrategy.OnPush })
export class CardComponent {
  title = input('');            // read-only signal, OnPush-aware
  count = input(0);             // parent writes, child reads
  renderCount = signal(0);

  constructor() {
    // effect() runs whenever title() OR count() changes
    effect(() => {
      this.title(); this.count(); // track dependencies
      this.renderCount.update(n => n + 1);
    });
  }
  // Template: {{ title() }} ({{ count() }} items) — rendered {{ renderCount() }}x
}

// Key differences:
// - No ngOnChanges needed — effect() replaces it
// - renderCount is a signal → template re-renders surgically
// - input() works perfectly with OnPush by design`,
    },
    {
      label: 'Zoneless setup',
      language: 'typescript',
      code: `// ── app.config.ts — remove zone.js, rely on signals ─────────────
import { provideZonelessChangeDetection } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(), // Angular 18+ stable
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
  ],
};

// ── angular.json — remove zone.js polyfill ──────────────────────
// In polyfills array, remove "zone.js"
// { "polyfills": [] }    ← empty or remove the array

// ── What breaks and how to fix it ────────────────────────────────
// Problem: setTimeout / setInterval outside zone no longer triggers CD
// Fix: use signals for state that changes in these callbacks
setTimeout(() => {
  this.count.update(n => n + 1); // signal → Angular knows to re-render
}, 1000);

// Problem: third-party library callbacks don't trigger CD
// Fix: call markForCheck() or wrap in NgZone.run()
someLib.onUpdate((data) => {
  this.data.set(data);        // signal covers this
  // OR:
  this.cdr.markForCheck();    // if not using signals for this piece of state
});

// Problem: TestBed needs to use provideZonelessChangeDetection() too
// Fix: add it to TestBed.configureTestingModule providers`,
    },
    {
      label: 'ExpressionChangedAfterChecked fix',
      language: 'typescript',
      code: `// This error ONLY appears in dev mode. It means Angular detected
// that a template binding changed value AFTER the CD cycle for
// that component completed — violating the "one-pass" contract.

// ── Common cause: AfterViewInit setting a value that the template reads ──
@Component({ template: '{{ height }}px' })
export class BadComponent implements AfterViewInit {
  height = 0;
  el = inject(ElementRef);

  ngAfterViewInit() {
    this.height = this.el.nativeElement.offsetHeight; // ERROR: template already checked
  }
}

// ── Fix 1: defer the update to the next cycle ────────────────────
ngAfterViewInit() {
  // setTimeout(fn, 0) pushes the update past the current CD cycle
  setTimeout(() => {
    this.height = this.el.nativeElement.offsetHeight;
  }, 0);
}

// ── Fix 2: use a signal (Angular schedules updates correctly) ─────
@Component({ template: '{{ height() }}px', changeDetection: ChangeDetectionStrategy.OnPush })
export class GoodComponent implements AfterViewInit {
  height = signal(0);
  el = inject(ElementRef);

  ngAfterViewInit() {
    // Signals are safe here — Angular schedules the re-render properly
    this.height.set(this.el.nativeElement.offsetHeight);
  }
}`,
    },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: '@Input() with ngOnChanges vs input() signal',
      before: `@Component({ selector: 'app-card' })
export class CardComponent implements OnChanges {
  @Input() title: string = '';
  @Input() count: number = 0;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['title']) { this.onTitleChange(); }
    if (changes['count']) { this.onCountChange(); }
  }
}`,
      after: `@Component({ selector: 'app-card',
  changeDetection: ChangeDetectionStrategy.OnPush })
export class CardComponent {
  title = input('');
  count = input(0);

  constructor() {
    effect(() => { this.title(); this.onTitleChange(); });
    effect(() => { this.count(); this.onCountChange(); });
  }
}`,
      note: 'input() signals are OnPush-native: no ngOnChanges, no SimpleChanges parsing. Each effect tracks exactly one dependency.',
    },
    {
      title: 'Manual markForCheck() vs signals for async updates',
      before: `// WebSocket messages: manual markForCheck() required
@Component({ changeDetection: ChangeDetectionStrategy.OnPush })
export class FeedComponent {
  private cdr = inject(ChangeDetectorRef);
  messages: string[] = [];

  ngOnInit() {
    ws.onmessage = (e) => {
      this.messages = [...this.messages, e.data];
      this.cdr.markForCheck(); // must not forget this
    };
  }
}`,
      after: `// Signal: no markForCheck() needed
@Component({ changeDetection: ChangeDetectionStrategy.OnPush })
export class FeedComponent {
  messages = signal<string[]>([]);

  ngOnInit() {
    ws.onmessage = (e) => {
      this.messages.update(m => [...m, e.data]);
      // Angular detects the signal change automatically
    };
  }
}`,
      note: 'Signals are zone-agnostic — they notify Angular\'s scheduler regardless of whether the update happens inside or outside NgZone.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Mutating an object/array instead of replacing it',
      wrong: `// OnPush will NOT re-render — same array/object reference
this.items.push(newItem);
this.obj.value = 42;`,
      right: `// OnPush sees a new reference → re-renders correctly
this.items = [...this.items, newItem];
this.obj = { ...this.obj, value: 42 };
// Or: use signal() which handles this automatically`,
      explanation: 'OnPush uses reference equality for inputs. Mutating an existing object keeps the same reference — Angular skips the check. Always create new references, or use signals to eliminate this class of bug entirely.',
    },
    {
      title: 'Forgetting markForCheck() for out-of-zone updates',
      wrong: `// WebSocket is outside Angular's zone — OnPush won't see this
this.ws.onmessage = (e) => {
  this.messages.push(e.data); // mutation + no notification = silent update
};`,
      right: `// Option 1: use a signal (preferred)
this.ws.onmessage = (e) => {
  this.messages.update(m => [...m, e.data]);
};
// Option 2: manual markForCheck()
this.ws.onmessage = (e) => {
  this.messages = [...this.messages, e.data];
  this.cdr.markForCheck();
};`,
      explanation: 'Callbacks from native WebSocket, setInterval, or third-party libraries run outside NgZone and do not trigger Angular\'s CD. Use signals (zone-agnostic) or explicitly call markForCheck() to schedule a re-check.',
    },
    {
      title: 'Assuming OnPush strategy propagates to child components',
      wrong: `// Parent is OnPush — does NOT make children OnPush
@Component({ changeDetection: ChangeDetectionStrategy.OnPush })
export class ParentComponent { }
// ChildComponent still uses Default strategy — checked on every cycle`,
      right: `// Each component must declare its own strategy
@Component({ changeDetection: ChangeDetectionStrategy.OnPush })
export class ParentComponent { }

@Component({ changeDetection: ChangeDetectionStrategy.OnPush })
export class ChildComponent { }`,
      explanation: 'Change detection strategy is per-component and does not inherit. A Default child inside an OnPush parent is still checked every time the parent\'s subtree is visited. Set OnPush explicitly on every component in the subtree.',
    },
    {
      title: 'Using ngOnChanges with signal inputs',
      wrong: `export class MyComponent implements OnChanges {
  title = input('');             // signal input
  ngOnChanges(changes: SimpleChanges) {
    // NEVER called for input() — only for @Input() decorator inputs
  }
}`,
      right: `export class MyComponent {
  title = input('');

  constructor() {
    // effect() fires whenever title() changes
    effect(() => { console.log('title changed:', this.title()); });
  }
}`,
      explanation: 'ngOnChanges is part of the @Input() decorator lifecycle. Signal inputs (input()) use the reactive graph instead — use effect() or computed() to react to their changes.',
    },
    {
      title: 'Calling detectChanges() in AfterViewInit causing ExpressionChangedError',
      wrong: `ngAfterViewInit() {
  // ERROR in dev: expression checked after CD already ran for this cycle
  this.height = this.el.nativeElement.offsetHeight;
}`,
      right: `// Fix 1: defer to next tick
ngAfterViewInit() {
  setTimeout(() => { this.height = this.el.nativeElement.offsetHeight; }, 0);
}
// Fix 2: use a signal (Angular handles scheduling correctly)
height = signal(0);
ngAfterViewInit() { this.height.set(this.el.nativeElement.offsetHeight); }`,
      explanation: 'ExpressionChangedAfterItHasBeenCheckedError means a template binding changed after Angular\'s CD pass completed. AfterViewInit runs after CD, so DOM measurements that feed back into the template need deferral or signal-based state.',
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'When does an OnPush component re-render?',
      options: [
        'On every browser event anywhere in the app',
        'Only when an input reference changes, an internal event fires, a signal updates, or markForCheck() is called',
        'Never automatically — you must always call markForCheck()',
        'Only when detectChanges() is called directly',
      ],
      answer: 1,
      explanation: 'OnPush components are skipped in most CD cycles. The five triggers are: (1) input reference change, (2) internal event, (3) signal change, (4) async pipe emission, (5) explicit markForCheck() or detectChanges(). All other cycles are skipped.',
    },
    {
      q: 'Does array.push() trigger re-render in an OnPush component?',
      options: [
        'Yes — Angular tracks array contents deeply',
        'No — same array reference, OnPush skips the check',
        'Only if the array is wrapped in a signal',
        'Yes, but only after the next setTimeout',
      ],
      answer: 1,
      explanation: 'OnPush compares input references, not contents. Array.push() mutates the existing array — the reference stays the same, so Angular skips the component. Always replace: <code>this.items = [...this.items, newItem]</code>. With signals, <code>update()</code> handles this correctly.',
    },
    {
      q: 'Do signals trigger re-renders in OnPush components automatically?',
      options: [
        'No — you must call markForCheck() after every signal update',
        'Yes — Angular\'s reactive graph tracks signal reads in templates and schedules re-renders automatically',
        'Only with the async pipe',
        'Only in Angular 22+',
      ],
      answer: 1,
      explanation: 'Signals integrate with Angular\'s reactive graph. When a signal changes, Angular knows exactly which component templates read it and marks only those components dirty — regardless of their CD strategy. No markForCheck() needed.',
    },
    {
      q: 'What does cdRef.detach() do?',
      options: [
        'Destroys the component and removes it from the DOM',
        'Removes the component from the CD tree entirely — no automatic checks until reattach()',
        'Pauses CD for one cycle then automatically resumes',
        'Switches the component to OnPush strategy',
      ],
      answer: 1,
      explanation: 'detach() completely opts a component subtree out of automatic CD. You take responsibility for calling detectChanges() whenever you want the DOM to update. Used for canvas/WebGL components or other scenarios with a custom render loop.',
    },
    {
      q: 'A component reads a signal in its template but never calls markForCheck(). Does it still re-render on OnPush when the signal changes?',
      options: [
        'No — OnPush always requires an explicit markForCheck() call regardless of what changed',
        'Yes — Angular\'s reactive graph marks the component dirty directly when a signal it reads changes, bypassing the need for markForCheck() entirely',
        'Only if the signal is also passed as an @Input()',
        'Only in zoneless applications, not in standard zone.js-based apps',
      ],
      answer: 1,
      explanation: 'Signals are deeply integrated with Angular\'s change detection — when a template reads count(), Angular records that dependency, and calling count.set()/update() marks exactly the components that read it as dirty, with no zone event or markForCheck() call needed. This is what makes signals "surgical" compared to markForCheck(), which manually schedules a full recheck of the component regardless of what actually changed inside it.',
    },
    {
      q: 'What happens if a child component uses Default strategy inside an OnPush parent?',
      options: [
        'The child inherits OnPush from the parent',
        'The child is never checked — OnPush blocks all CD below it',
        'The child uses Default and is checked every time the parent\'s subtree is visited',
        'Angular throws an error — you cannot mix strategies in the same tree',
      ],
      answer: 2,
      explanation: 'CD strategy is per-component and does not inherit. A Default child inside an OnPush parent is still checked on every cycle that visits the parent\'s subtree. To get the full performance benefit, every component in the tree must explicitly use OnPush.',
    },
    {
      q: 'What does provideZonelessChangeDetection() change about Angular\'s CD behaviour?',
      options: [
        'It removes the need for the OnPush strategy',
        'It removes zone.js, so Angular no longer runs CD after every async event — only signal changes and explicit markForCheck() trigger re-renders',
        'It makes Angular check components less frequently but still uses zone.js',
        'It enables server-side rendering with no client-side CD',
      ],
      answer: 1,
      explanation: 'Without zone.js, Angular no longer intercepts setTimeout, Promise, or XHR completions to trigger CD. Instead, only signals (which notify the reactive graph directly) and explicit markForCheck() calls schedule re-renders. This eliminates thousands of wasted CD cycles in event-heavy apps.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between Default and OnPush change detection?',
      a: '<strong>Default:</strong> Angular checks the component on every CD cycle triggered by any async event anywhere in the app — even events completely unrelated to this component\'s data. <strong>OnPush:</strong> Angular skips a component unless one of its five specific triggers fires: input reference change, internal event, signal change, async pipe emission, or explicit <code>markForCheck()</code>. OnPush is the recommended strategy for all components because it prevents unnecessary re-renders.',
    },
    {
      q: 'Why does mutating an array not trigger OnPush re-render?',
      a: 'OnPush compares input references using <code>===</code>. Calling <code>push()</code> on an existing array mutates the array in place — the reference (the memory address) stays identical. Angular sees the same reference as before and concludes nothing changed, so it skips the re-render. <br><br>Fix: always replace: <code>this.items = [...this.items, newItem]</code>. With signals, <code>this.items.update(arr => [...arr, newItem])</code> handles this correctly because the signal itself notifies Angular even when the underlying content changes.',
    },
    {
      q: 'A signal is read inside a component\'s TypeScript class (e.g. in ngOnInit, logged to console) but never actually referenced in the template. Does updating that signal still mark the component dirty for re-render on OnPush?',
      a: 'No — Angular\'s signal-to-CD integration specifically tracks signal reads that occur during TEMPLATE rendering (inside the component\'s generated template function), not arbitrary reads anywhere in the class. A signal read once in ngOnInit and never touched again during template evaluation creates no lasting dependency, so later updates to that signal do not mark the component dirty — the component will not re-render even though the signal changed, unless the template itself also reads the signal somewhere (directly or via a computed/effect that itself is read in the template). This is a common point of confusion: reading a signal anywhere in code does not itself create a reactive dependency — only reading it from within the render tree does.',
    },
    {
      q: 'What is markForCheck() and when do you need it?',
      a: '<code>inject(ChangeDetectorRef).markForCheck()</code> schedules an OnPush component for re-check on the next CD cycle. You need it when:<br><ul><li>Data arrives from a native WebSocket (not using signals or async pipe)</li><li>State changes inside a third-party library callback that runs outside NgZone</li><li>You are maintaining legacy code that uses plain class fields instead of signals</li></ul>Modern recommendation: convert state to <code>signal()</code> and eliminate <code>markForCheck()</code> calls entirely — signals are zone-agnostic and notify Angular automatically.',
    },
    {
      q: 'Can you mix Default and OnPush components in the same tree?',
      a: 'Yes, and it is common during migration. OnPush components act as barriers: they skip re-checking unless their triggers fire. <strong>Important:</strong> a Default child inside an OnPush parent is still checked every time the parent\'s subtree is visited — it does not inherit OnPush. For maximum performance benefit, every component in the subtree must explicitly declare <code>changeDetection: ChangeDetectionStrategy.OnPush</code>.',
    },
    {
      q: 'What is the difference between markForCheck() and detectChanges()?',
      a: '<code>markForCheck()</code> is <strong>asynchronous</strong> — it queues a re-check for the component on the next scheduled CD cycle. The DOM is not updated immediately. <br><br><code>detectChanges()</code> is <strong>synchronous</strong> — it immediately walks the component subtree and updates the DOM before returning. Use it when you need the DOM in its updated state before measuring layout (e.g., <code>offsetHeight</code> after injecting content). Note: in most cases, signals eliminate the need for both.',
    },
    {
      q: 'What is ExpressionChangedAfterItHasBeenCheckedError and how do you fix it?',
      a: 'This dev-mode error means a template binding changed its value <strong>after</strong> Angular finished the CD pass for that component. It violates Angular\'s single-pass guarantee. Common cause: setting component state in <code>ngAfterViewInit</code> (which runs post-CD) and reading that state in the template. <br><br>Fixes:<ul><li>Wrap the mutation in <code>setTimeout(() =&gt; ..., 0)</code> to defer it past the current cycle</li><li>Use a <code>signal()</code> — Angular handles scheduling correctly and this error does not occur</li><li>Move initialization to <code>ngOnInit</code> if the DOM measurement is not actually needed</li></ul>',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Angular\'s change detection (CD) is a top-down tree walk that checks template bindings for changes. OnPush skips a component unless one of five specific triggers fires; signals make those triggers automatic and surgical, re-rendering only the exact components that read changed data.',
    mustKnow: [
      '<code>OnPush</code> skips a component unless: input reference changes, internal event fires, signal changes, async pipe emits, or <code>markForCheck()</code> is called',
      'Object/array <strong>mutation</strong> (push, property assignment) is invisible to OnPush — always replace with new references or use signals',
      'Signals notify Angular\'s reactive graph directly — no zone event needed, no <code>markForCheck()</code> needed, surgical re-render of only the reading component',
      '<code>input()</code> (Angular 17+) is a signal input that replaces <code>@Input()</code> — <code>ngOnChanges</code> is not called for signal inputs; use <code>effect()</code> instead',
      '<code>markForCheck()</code> = schedule next cycle; <code>detectChanges()</code> = synchronous immediate update; <code>detach()</code> = remove from tree entirely',
      'OnPush strategy does NOT inherit to child components — each must declare it explicitly',
      '<code>provideZonelessChangeDetection()</code> (Angular 18+) removes zone.js — only signals and <code>markForCheck()</code> drive CD, eliminating wasted cycles',
    ],
    interviewFocus: [
      'Why does array.push() break OnPush and what is the correct pattern? (reference equality)',
      'What are all five triggers that cause an OnPush component to re-render?',
      'How do signals differ from markForCheck() — and why do signals make manual CD calls unnecessary?',
      'What is the difference between markForCheck() and detectChanges()?',
      'What does provideZonelessChangeDetection() change and what breaks without zone.js?',
    ],
  };

  challenge: Challenge = {
    title: 'Migrate to OnPush + Signals',
    language: 'typescript',
    description: 'Convert this Default component to use OnPush change detection and replace @Input() with input() signal. The render counter should increment only when the title input actually changes — not on every CD cycle.',
    hints: [
      'Add changeDetection: ChangeDetectionStrategy.OnPush to the @Component decorator',
      'Replace "@Input() title: string" with "title = input(\'\')" — a signal input',
      'Replace ngOnChanges with effect(() => { this.title(); this.renders.update(...) }) in the constructor',
      'Make renders a signal so the template re-renders surgically when it changes',
    ],
    starterCode: `import { Component, Input, OnChanges, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  // TODO: add OnPush
  template: \`<div>{{ title }} — rendered {{ renders }} times</div>\`,
})
export class CardComponent implements OnChanges {
  @Input() title: string = '';
  renders = 0;

  ngOnChanges() { this.renders++; }
}`,
    solution: `import { Component, input, effect, signal, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`<div>{{ title() }} — rendered {{ renders() }} times</div>\`,
})
export class CardComponent {
  title = input('');          // signal input — no @Input decorator
  renders = signal(0);

  constructor() {
    // effect() tracks title() — runs whenever title() changes
    effect(() => {
      this.title();           // read the signal to establish dependency
      this.renders.update(n => n + 1);
    });
  }
  // No ngOnChanges needed: effect() is the signal-era replacement
}`,
  };
}
