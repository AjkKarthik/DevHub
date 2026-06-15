import { Component, signal, effect, viewChild, ElementRef, afterNextRender } from '@angular/core';
import { TrackedChildComponent } from './tracked-child/tracked-child';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';
import { PrerequisitesComponent, Prerequisite } from '../../shared/prerequisites/prerequisites';

@Component({
  selector: 'app-lifecycle',
  imports: [
    TrackedChildComponent, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent,
    CommonMistakesComponent, PageMetaComponent, PageCompleteComponent,
    RevisionCardComponent, PrerequisitesComponent,
  ],
  templateUrl: './lifecycle.html',
  styleUrl: './lifecycle.scss',
})
export class LifecycleDemo {
  inputText   = signal('Hello');
  inputNumber = signal(1);
  showChild   = signal(true);

  effectName  = signal('Angular');
  effectCount = signal(0);
  effectTheme = signal<'light' | 'dark'>('light');
  effectLog   = signal<string[]>([]);

  focusTarget = viewChild<ElementRef<HTMLInputElement>>('focusInput');
  boxEl       = viewChild<ElementRef<HTMLDivElement>>('measuredBox');
  boxSize     = signal({ width: 0, height: 0 });

  constructor() {
    effect(() => {
      const name  = this.effectName();
      const count = this.effectCount();
      const theme = this.effectTheme();
      this.effectLog.update(log =>
        [`name="${name}" count=${count} theme=${theme}`, ...log].slice(0, 7)
      );
    });

    afterNextRender(() => {
      const box = this.boxEl()?.nativeElement;
      if (box) {
        this.boxSize.set({ width: box.offsetWidth, height: box.offsetHeight });
      }
    });
  }

  doFocus() { this.focusTarget()?.nativeElement.focus(); }

  prerequisites: Prerequisite[] = [
    { label: 'Template Syntax', route: '/angular/template-syntax' },
    { label: 'Signals & Reactivity', route: '/angular/signals' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'ngOnChanges', type: 'hook', desc: 'Fires before ngOnInit and on every @Input() change, receiving a SimpleChanges map of old and new values.', since: '2' },
    { name: 'ngOnInit', type: 'hook', desc: 'Runs once after the first ngOnChanges; safe to access injected services and resolved @Input() values.', since: '2' },
    { name: 'ngOnDestroy', type: 'hook', desc: 'Runs just before Angular removes the component; use it to unsubscribe observables, clear timers, and cancel requests.', since: '2' },
    { name: 'ngDoCheck', type: 'hook', desc: 'Fires on every change-detection cycle, allowing custom dirty-checking; avoid heavy logic here as it runs very frequently.', since: '2' },
    { name: 'ngAfterViewInit', type: 'hook', desc: 'Fires once after the component\'s own template and child views are fully rendered; safe to access @ViewChild references.', since: '2' },
    { name: 'ngAfterContentInit', type: 'hook', desc: 'Fires once after projected content (<ng-content>) is initialised; safe to access @ContentChild references.', since: '2' },
    { name: 'afterNextRender', type: 'function', desc: 'Runs a callback once after the next browser paint; ideal for DOM measurements and initialising third-party DOM libraries.', since: '17' },
    { name: 'afterRender', type: 'function', desc: 'Runs a callback after every render cycle; use when you need to react to every DOM repaint, not just the first.', since: '17' },
    { name: 'DestroyRef', type: 'class', desc: 'Injectable token whose onDestroy() registers cleanup callbacks without requiring the ngOnDestroy interface.', since: '16' },
    { name: 'takeUntilDestroyed', type: 'operator', desc: 'RxJS pipeable operator from @angular/core/rxjs-interop that auto-completes an Observable when the host is destroyed.', since: '16' },
    { name: 'SimpleChanges', type: 'interface', desc: 'Map of changed @Input() properties passed to ngOnChanges; each entry holds previousValue, currentValue, and firstChange.', since: '2' },
    { name: 'viewChild()', type: 'function', desc: 'Signal-based replacement for @ViewChild; returns a signal that holds the child element or component reference.', since: '17.2' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The complete lifecycle hook sequence',
      points: [
        'Every Angular component follows this guaranteed order: <code>constructor</code> → <code>ngOnChanges</code> (if inputs exist) → <code>ngOnInit</code> → <code>ngDoCheck</code> → <code>ngAfterContentInit</code> → <code>ngAfterContentChecked</code> → <code>ngAfterViewInit</code> → <code>ngAfterViewChecked</code> → (repeat: <code>ngDoCheck</code> / <code>ngAfterContentChecked</code> / <code>ngAfterViewChecked</code> on each CD cycle) → <code>ngOnDestroy</code>.',
        'The "init" hooks (<code>ngOnInit</code>, <code>ngAfterContentInit</code>, <code>ngAfterViewInit</code>) each fire exactly <strong>once</strong>. The "checked" hooks (<code>ngDoCheck</code>, <code>ngAfterContentChecked</code>, <code>ngAfterViewChecked</code>) fire on <strong>every change detection cycle</strong>. <code>ngOnChanges</code> fires once before init and then again on every <code>@Input()</code> change.',
        'To implement a hook, your class should implement the corresponding interface (<code>implements OnInit, OnDestroy</code>) — this is not required at runtime but enables compile-time checking and IDE support to catch missing method implementations.',
        'The <code>constructor</code> is not a lifecycle hook. It runs before Angular has set up inputs or the view. Only use the constructor for dependency injection (via <code>inject()</code> or constructor parameters) and setting up <code>effect()</code> / <code>afterNextRender()</code> calls. Move data fetching and subscription setup to <code>ngOnInit</code>.',
        'In <strong>zoneless Angular</strong> (Angular 18+), <code>ngDoCheck</code> runs far less frequently — only when a signal change triggers re-evaluation — so "checked" hooks that were previously performance risks become much less of a concern.',
      ],
    },
    {
      heading: 'Initialization hooks — constructor, ngOnChanges, ngOnInit',
      points: [
        '<code>ngOnChanges(changes: SimpleChanges)</code> receives a map of every <code>@Input()</code> that changed. Each entry has <code>previousValue</code>, <code>currentValue</code>, and <code>firstChange: boolean</code>. It fires <em>before</em> <code>ngOnInit</code> — so inputs are available inside init.',
        '<strong>Signal inputs (<code>input()</code>) do NOT trigger ngOnChanges.</strong> Use <code>effect(() => { this.myInput(); })</code> to react to signal input changes instead. This is one of the most common gotchas when migrating from <code>@Input()</code> to <code>input()</code>.',
        '<code>ngOnInit</code> is the right place to fetch data, set up subscriptions, and run initialization logic that needs access to injected services and resolved inputs. It fires once after the first <code>ngOnChanges</code>. Avoid DOM operations here — the view is not yet rendered.',
        'If a component has no <code>@Input()</code> properties, <code>ngOnChanges</code> is never called at all — not even on first render. In this case, <code>ngOnInit</code> is the first hook to fire after the constructor.',
        '<code>@Input({ required: true })</code> (Angular 16+) causes a compile-time error if the parent doesn\'t bind the input, eliminating the need for <code>ngOnInit</code> null-checks or runtime <code>!.</code> assertions. Signal-equivalent: <code>input.required&lt;string&gt;()</code>.',
      ],
    },
    {
      heading: 'View and content projection hooks',
      points: [
        '<code>ngAfterViewInit</code> fires once after Angular has fully rendered the component\'s <em>own</em> template and its child component trees. This is the earliest safe point to read <code>@ViewChild</code> / <code>viewChild()</code> element dimensions, call methods on child components, or integrate third-party libraries that need a real DOM node.',
        '<code>ngAfterContentInit</code> fires once after <code>ng-content</code> projected content has been initialised. Use it to access <code>@ContentChild</code> / <code>contentChild()</code> references. It fires <em>before</em> <code>ngAfterViewInit</code> in the sequence.',
        'The "Checked" variants (<code>ngAfterViewChecked</code>, <code>ngAfterContentChecked</code>) fire after every change detection cycle — including cycles triggered by child components. Keep them <strong>side-effect free</strong>. Writing to any signal or data property in these hooks risks an <code>ExpressionChangedAfterChecked</code> error, because Angular has already snapshotted the values for the current cycle.',
        '<code>afterNextRender(callback)</code> (Angular 17+) is the SSR-safe replacement for DOM access in <code>ngAfterViewInit</code>. It runs exactly once after the browser paints the first frame. <code>afterRender(callback)</code> runs after every paint — use it for animations or continuous DOM synchronization.',
        '<code>afterNextRender</code> accepts a phase: <code>{ earlyRead, read, mixedReadWrite, write }</code> — specify the phase to allow Angular to batch DOM reads and writes efficiently and avoid layout thrashing. Default is <code>mixedReadWrite</code>.',
      ],
    },
    {
      heading: 'Cleanup — ngOnDestroy, DestroyRef, takeUntilDestroyed',
      points: [
        '<code>ngOnDestroy</code> fires once just before Angular removes the component from the DOM. It is the last chance to cancel pending operations: unsubscribe Observables, clear <code>setInterval</code>/<code>setTimeout</code>, detach native event listeners, and abort any in-flight HTTP requests.',
        '<code>DestroyRef</code> (Angular 16+) is an injectable token that lets you register cleanup callbacks <em>anywhere</em> in the injection context — not just in a component class. Call <code>inject(DestroyRef).onDestroy(() => cleanup())</code>. This enables cleanup logic in services, composable functions, and standalone injection contexts without implementing <code>OnDestroy</code>.',
        '<code>takeUntilDestroyed()</code> from <code>@angular/core/rxjs-interop</code> is a RxJS pipeable operator that auto-completes an Observable when the injection context (component/directive) is destroyed: <code>interval(1000).pipe(takeUntilDestroyed()).subscribe()</code>. No <code>Subject + takeUntil + complete</code> boilerplate.',
        'If you call <code>takeUntilDestroyed()</code> outside the constructor (e.g., inside <code>ngOnInit</code>), pass <code>destroyRef</code> explicitly: <code>takeUntilDestroyed(this.destroyRef)</code> where <code>private destroyRef = inject(DestroyRef)</code>. Angular enforces this because injection context is only guaranteed in the constructor.',
        'Multiple cleanup approaches can coexist. In practice: use <code>takeUntilDestroyed()</code> for RxJS subscriptions; use <code>DestroyRef.onDestroy()</code> for native cleanup (<code>ResizeObserver</code>, <code>setInterval</code>, custom event listeners); fall back to <code>ngOnDestroy</code> only when working with class-based patterns or third-party code that expects the interface.',
      ],
    },
    {
      heading: 'Modern signal-based lifecycle — viewChild, effect, afterNextRender',
      points: [
        '<code>viewChild(\'ref\')</code> (Angular 17.2+) returns a <code>Signal&lt;ElementRef&gt;</code> rather than a decorated property. Read it inside <code>effect()</code> or <code>computed()</code> — Angular automatically handles the timing (it will be <code>undefined</code> until the view is rendered, then update to the real element). No <code>ngAfterViewInit</code> needed for reactive patterns.',
        '<code>effect(() => { this.theme(); })</code> runs synchronously after creation and re-runs whenever any signal it reads changes. It replaces <code>ngOnChanges</code> for signal inputs and replaces <code>ngOnInit</code> data-loading patterns — set up the reactive chain in the constructor, and Angular drives re-evaluation.',
        'Effects created in the constructor are automatically cleaned up when the component is destroyed — no explicit cleanup needed. Effects created outside an injection context (e.g., inside a callback) must be manually destroyed by calling the <code>EffectRef</code> returned by <code>effect()</code>.',
        'Avoid writing to signals inside <code>effect()</code> that are also read by the same effect — this creates a potential infinite loop. Angular detects and throws an error for direct write-then-read cycles. For derivations, use <code>computed()</code> instead of an <code>effect()</code> that writes to another signal.',
        'The modern lifecycle for a typical signal-based component: <strong>constructor</strong> (DI + set up effects and afterNextRender) → <strong>template renders reactively</strong> (signals drive re-render; no ngOnChanges/ngOnInit) → <strong>DestroyRef.onDestroy</strong> or takeUntilDestroyed (cleanup). Most lifecycle interfaces become unnecessary.',
      ],
    },
    {
      heading: 'Gotchas and performance patterns',
      points: [
        '<code>ngDoCheck</code> fires on <em>every</em> change detection cycle — including cycles triggered by parent or sibling components. Even an empty implementation adds function call overhead on every cycle. Only use it when you need to detect deeply mutated data that Angular can\'t track with reference comparison. Prefer <code>computed()</code> signals.',
        'Never trigger a new CD cycle from inside a "Checked" hook (<code>ngAfterViewChecked</code> or <code>ngAfterContentChecked</code>). Calling <code>markForCheck()</code>, emitting an EventEmitter, or mutating a signal inside these hooks causes Angular to loop and eventually throw <code>ExpressionChangedAfterCheckedError</code> in dev mode.',
        '<code>ngOnChanges</code> fires synchronously before <code>ngOnInit</code>. If you call an expensive operation in <code>ngOnChanges</code> (e.g., HTTP request, complex derivation), consider debouncing or guarding with <code>if (changes[\'myInput\'].firstChange)</code> to skip re-running on every parent re-render.',
        'Avoid using the <code>constructor</code> for anything other than DI setup and registering <code>effect</code>/<code>afterNextRender</code> calls. In particular, never make HTTP calls or access injected services\' state in the constructor — those services may not be fully initialised and the component may be instantiated in contexts (SSR, test) where the DOM doesn\'t exist.',
        'When a component has both <code>@Input()</code> (decorator) and <code>input()</code> (signal) properties, <code>ngOnChanges</code> fires only for the <code>@Input()</code> ones. This inconsistency is a common source of bugs during migration. The cleanest approach: migrate all inputs to the signal API and drop <code>ngOnChanges</code> entirely in favour of <code>effect()</code>.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Lifecycle order',
      language: 'typescript',
      code: `// Angular calls these hooks in this exact order:
// 1. constructor()             — DI only, no DOM/inputs yet
// 2. ngOnChanges(changes)      — BEFORE ngOnInit, then on every @Input() change
//                                NOTE: does NOT fire for input() signals
// 3. ngOnInit()                — once, after first ngOnChanges
// 4. ngDoCheck()               — every CD cycle (avoid heavy logic)
// 5. ngAfterContentInit()      — once, after ng-content is projected
// 6. ngAfterContentChecked()   — every CD cycle
// 7. ngAfterViewInit()         — once, after view + child views rendered
// 8. ngAfterViewChecked()      — every CD cycle
// 9. ngOnDestroy()             — cleanup just before removal

// Modern one-time equivalents:
// afterNextRender(() => ...)   — runs once after the browser paints
// afterRender(() => ...)       — runs after EVERY paint`,
    },
    {
      label: 'ngOnChanges',
      language: 'typescript',
      code: `import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

export class TrackedChild implements OnChanges {
  // @Input() triggers ngOnChanges; input() signal does NOT
  @Input() text   = '';
  @Input() count  = 0;

  changeLog: string[] = [];

  ngOnChanges(changes: SimpleChanges) {
    for (const [key, change] of Object.entries(changes)) {
      this.changeLog.unshift(
        \`[\${key}] \${JSON.stringify(change.previousValue)}
           → \${JSON.stringify(change.currentValue)}\` +
        (change.firstChange ? ' (first)' : '')
      );
    }
  }
}

// For signal inputs — use effect() instead:
// name = input('');
// constructor() {
//   effect(() => { console.log('name changed:', this.name()); });
// }`,
    },
    {
      label: 'ngOnInit + ngOnDestroy',
      language: 'typescript',
      code: `import { Component, OnInit, OnDestroy } from '@angular/core';
import { interval, Subscription } from 'rxjs';

export class TimerComponent implements OnInit, OnDestroy {
  count = 0;
  private sub!: Subscription;

  ngOnInit() {
    // ✅ Inputs are ready, DI is set up — safe to subscribe
    this.sub = interval(1000).subscribe(() => this.count++);
  }

  ngOnDestroy() {
    // ✅ Always clean up to prevent memory leaks
    this.sub.unsubscribe();
  }
}

// Modern alternative — no interface needed:
import { inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export class ModernTimerComponent {
  count = 0;
  constructor() {
    interval(1000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.count++);
  }
}`,
    },
    {
      label: 'DestroyRef + takeUntilDestroyed',
      language: 'typescript',
      code: `// Modern cleanup — replaces ngOnDestroy + Subject + takeUntil pattern
import { Component, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

export class TimerComponent {
  private destroyRef = inject(DestroyRef);

  constructor() {
    // ① takeUntilDestroyed() — subscription auto-cancels on destroy
    interval(1000)
      .pipe(takeUntilDestroyed())
      .subscribe(n => console.log(n));

    // ② destroyRef.onDestroy() — any imperative cleanup
    const id = setInterval(() => console.log('tick'), 500);
    this.destroyRef.onDestroy(() => clearInterval(id));

    // No ngOnDestroy interface needed!
  }
}

// If subscribing outside the constructor, pass destroyRef explicitly:
// ngOnInit() {
//   obs$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
// }`,
    },
    {
      label: 'afterNextRender + viewChild',
      language: 'typescript',
      code: `// afterNextRender() — SSR-safe DOM access after first paint
import {
  Component, viewChild, ElementRef,
  afterNextRender, signal, inject, DestroyRef
} from '@angular/core';

export class ResponsiveBoxComponent {
  boxRef     = viewChild<ElementRef<HTMLDivElement>>('box');
  boxWidth   = signal(0);
  private destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      const el = this.boxRef()?.nativeElement;
      if (!el) return;

      // Native ResizeObserver — reacts to element size changes
      const ro = new ResizeObserver(entries => {
        this.boxWidth.set(entries[0].contentRect.width);
      });
      ro.observe(el);
      this.destroyRef.onDestroy(() => ro.disconnect());
    });
  }
}
// Template: <div #box>Width: {{ boxWidth() }}px</div>`,
    },
    {
      label: 'effect() reactive tracking',
      language: 'typescript',
      code: `// effect() — replaces ngOnChanges for signal inputs
import { Component, input, signal, effect } from '@angular/core';

export class ThemeComponent {
  // Signal input — ngOnChanges does NOT fire for these
  theme = input<'light' | 'dark'>('light');
  count = signal(0);
  log   = signal<string[]>([]);

  constructor() {
    // effect() tracks every signal read inside it
    // Re-runs whenever theme() or count() changes
    effect(() => {
      const t = this.theme();
      const c = this.count();
      this.log.update(l =>
        [\`theme=\${t} count=\${c}\`, ...l].slice(0, 5)
      );
    });

    // ⚠️ Do NOT write to a signal that the effect also reads:
    // effect(() => { this.count.set(this.count() + 1); }); // ← infinite loop!
  }
}`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'Which lifecycle hook fires before ngOnInit?',
      options: ['ngAfterViewInit', 'ngOnChanges', 'constructor', 'ngDoCheck'],
      answer: 1,
      explanation: 'ngOnChanges fires first (when inputs change), then ngOnInit. The constructor runs before any Angular hooks, but it is not itself a hook — it has no access to resolved inputs.',
    },
    {
      q: 'When does ngOnDestroy run?',
      options: [
        'When the component template is hidden with @if',
        'Just before Angular removes the component from the DOM',
        'When the component\'s @Input() changes',
        'When change detection runs for the parent',
      ],
      answer: 1,
      explanation: 'ngOnDestroy runs just before Angular removes the component. Note that @if hiding and showing a component causes destroy and re-create — ngOnDestroy fires on the hide, ngOnInit fires on the show.',
    },
    {
      q: 'What is the modern replacement for ngAfterViewInit when you need DOM dimensions?',
      options: ['viewChild()', 'afterRender()', 'afterNextRender()', 'ngAfterViewChecked()'],
      answer: 2,
      explanation: 'afterNextRender() fires once after the first browser paint — safe for DOM measurements and third-party DOM lib integration. It is also SSR-safe (does not run on the server), unlike ngAfterViewInit which runs in SSR contexts.',
    },
    {
      q: 'Which signal query replaces @ViewChild?',
      options: ['input()', 'output()', 'viewChild()', 'contentChild()'],
      answer: 2,
      explanation: 'viewChild() is the signal-based replacement for @ViewChild, returning a Signal<ElementRef | ComponentRef>. It is undefined until after the view renders, then holds the live reference.',
    },
    {
      q: 'Does ngOnChanges fire when a signal input (input()) changes?',
      options: [
        'Yes — ngOnChanges fires for all input types',
        'No — ngOnChanges only fires for @Input() decorator properties; use effect() for signal inputs',
        'Only on the first change (firstChange: true)',
        'Yes, but only in OnPush components',
      ],
      answer: 1,
      explanation: 'ngOnChanges only responds to @Input() decorator properties. Signal inputs (created with input()) do not trigger ngOnChanges. React to signal input changes using effect(() => { this.myInput(); }) in the constructor.',
    },
    {
      q: 'What does takeUntilDestroyed() do?',
      options: [
        'Prevents the component from being destroyed while a subscription is active',
        'Converts an Observable to a signal that stops emitting on component destroy',
        'Auto-completes an RxJS Observable when the injection context (component) is destroyed',
        'Destroys the component after the Observable completes',
      ],
      answer: 2,
      explanation: 'takeUntilDestroyed() from @angular/core/rxjs-interop is a pipeable RxJS operator. It completes (unsubscribes from) the Observable when the host component is destroyed, replacing the ngOnDestroy + takeUntil(destroy$) boilerplate.',
    },
    {
      q: 'What is the risk of performing heavy work in ngAfterViewChecked?',
      options: [
        'Angular throws an error if the method takes more than 16ms',
        'It runs after every change detection cycle, and any state mutation in it can cause ExpressionChangedAfterChecked errors or infinite CD loops',
        'It only runs once, so heavy logic is wasted on the first render',
        'It blocks the main thread and delays ngOnDestroy',
      ],
      answer: 1,
      explanation: 'ngAfterViewChecked fires after every change detection cycle. Mutating state or signals inside it can cause Angular to detect a change it already snapshotted, triggering ExpressionChangedAfterCheckedError in dev mode or an infinite CD loop in production.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the order of Angular lifecycle hooks?',
      a: 'constructor → ngOnChanges → ngOnInit → ngDoCheck → ngAfterContentInit → ngAfterContentChecked → ngAfterViewInit → ngAfterViewChecked → ngOnDestroy. The "init" hooks fire once; the "checked" hooks fire every CD cycle. For signal-based components, most post-init hooks are replaced by <code>effect()</code> and <code>afterNextRender()</code>.',
    },
    {
      q: 'Why is ngOnChanges called before ngOnInit?',
      a: '<code>ngOnChanges</code> fires whenever an <code>@Input()</code> changes — including the very first time inputs are set. Angular calls it before <code>ngOnInit</code> so that inside <code>ngOnInit</code>, you already have access to the initial input values via the <code>SimpleChanges</code> map from the previous call.',
    },
    {
      q: 'What replaced ngAfterViewInit for signal-based code?',
      a: '<code>afterNextRender()</code> fires once after the first browser paint — safe for DOM operations, canvas setup, and third-party DOM libraries. It is also SSR-safe (it does not run on the server). For ongoing after-render effects, use <code>afterRender()</code>. <code>viewChild()</code> signals combined with <code>effect()</code> also eliminate most <code>ngAfterViewInit</code> patterns entirely.',
    },
    {
      q: 'When should you use ngOnDestroy?',
      a: 'For cleanup: unsubscribing from Observables, clearing <code>setInterval</code>, detaching native event listeners, aborting fetch requests. With <code>DestroyRef.onDestroy()</code> or <code>takeUntilDestroyed()</code> you can skip implementing the interface and spread cleanup logic closer to where the resource is created — especially useful in composable functions and services.',
    },
    {
      q: 'Does viewChild() require ngAfterViewInit?',
      a: 'No — <code>viewChild()</code> returns a Signal that starts as <code>undefined</code> then updates to the element reference after the view renders. Read it inside <code>effect()</code> and Angular handles the timing automatically. If you need to access it imperatively (e.g., for a one-time DOM measurement), use <code>afterNextRender()</code>.',
    },
    {
      q: 'What is ngDoCheck and when would you use it?',
      a: '<code>ngDoCheck</code> fires on every change detection cycle. Use it to detect changes Angular won\'t catch — such as mutations inside an array (same reference, changed contents). Be very careful: even an empty <code>ngDoCheck</code> adds overhead on every cycle. In zoneless Angular, it fires much less frequently. Prefer <code>computed()</code> signals for derived state.',
    },
    {
      q: 'What is the difference between afterNextRender() and afterRender()?',
      a: '<code>afterNextRender(callback)</code> fires the callback exactly <strong>once</strong> — after the next browser paint. Use it for one-time setup: measuring an element, focusing an input, initialising a chart library. <code>afterRender(callback)</code> fires after <strong>every</strong> render cycle. Use it for continuous synchronization — for example, reading a DOM property and writing it back to a signal on every repaint. Both are SSR-safe and run only in the browser.',
    },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Cleanup: ngOnDestroy vs DestroyRef',
      before: `// Old: implement OnDestroy interface
private sub!: Subscription;
ngOnInit() {
  this.sub = interval(1000).subscribe();
}
ngOnDestroy() { this.sub.unsubscribe(); }`,
      after: `// New: inject DestroyRef, no interface needed
constructor() {
  const sub = interval(1000)
    .pipe(takeUntilDestroyed())
    .subscribe();
}`,
      note: 'takeUntilDestroyed() and DestroyRef.onDestroy() both eliminate the need to implement OnDestroy and decouple cleanup from the class lifecycle.',
    },
    {
      title: 'DOM access: ngAfterViewInit vs afterNextRender',
      before: `// Old: @ViewChild + ngAfterViewInit (breaks SSR)
@ViewChild('box') boxEl!: ElementRef;
ngAfterViewInit() {
  const w = this.boxEl.nativeElement.offsetWidth;
}`,
      after: `// New: viewChild signal + afterNextRender (SSR-safe)
boxEl = viewChild<ElementRef>('box');
constructor() {
  afterNextRender(() => {
    const w = this.boxEl()?.nativeElement.offsetWidth;
  });
}`,
      note: 'afterNextRender() is SSR-safe and pairs naturally with signal-based viewChild().',
    },
    {
      title: 'Reacting to input changes: ngOnChanges vs effect()',
      before: `// Old: @Input() + ngOnChanges
@Input() theme = 'light';
ngOnChanges(changes: SimpleChanges) {
  if (changes['theme']) { this.applyTheme(); }
}`,
      after: `// New: input() signal + effect()
theme = input('light');
constructor() {
  effect(() => { this.applyTheme(this.theme()); });
}`,
      note: 'signal input() does NOT trigger ngOnChanges — use effect() instead. The effect() re-runs whenever theme() changes.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Accessing viewChild in ngOnInit',
      wrong: `ngOnInit() {
  // undefined — view not rendered yet
  this.inputEl()?.nativeElement.focus();
}`,
      right: `constructor() {
  afterNextRender(() => {
    this.inputEl()?.nativeElement.focus();
  });
}`,
      explanation: 'viewChild() signals are undefined until after the view renders — which happens after ngOnInit. Use afterNextRender() for one-time DOM access or effect() to react reactively.',
    },
    {
      title: 'Expecting ngOnChanges to fire for signal inputs',
      wrong: `// input() signal — ngOnChanges NEVER fires for these
value = input(0);
ngOnChanges(c: SimpleChanges) { /* never runs */ }`,
      right: `value = input(0);
constructor() {
  effect(() => { console.log('value changed:', this.value()); });
}`,
      explanation: 'ngOnChanges only responds to @Input() decorator properties. Signal inputs (input()) require effect() for reactive side effects. This is the most common migration gotcha when moving from @Input() to input().',
    },
    {
      title: 'Heavy logic inside ngDoCheck',
      wrong: `ngDoCheck() {
  // Fires on EVERY CD cycle — this is catastrophic for performance
  this.items = this.allItems.filter(i => i.active && i.matches(this.query));
}`,
      right: `// Use computed() — only recalculates when dependencies change
filteredItems = computed(() =>
  this.allItems().filter(i => i.active && i.matches(this.query()))
);`,
      explanation: 'ngDoCheck fires extremely frequently — every CD cycle triggered by any signal or event anywhere in the app. Even cheap logic adds up. Use computed() signals which memoize and only re-run when their signal dependencies change.',
    },
    {
      title: 'Forgetting to clean up subscriptions',
      wrong: `ngOnInit() {
  // Leaks — interval continues running after component is destroyed
  interval(1000).subscribe(() => this.count++);
}`,
      right: `constructor() {
  interval(1000)
    .pipe(takeUntilDestroyed())
    .subscribe(() => this.count++);
}`,
      explanation: 'Subscriptions that outlive the component cause memory leaks and unexpected background execution. Use takeUntilDestroyed() (call in constructor) or DestroyRef.onDestroy() to ensure cleanup.',
    },
    {
      title: 'Mutating state inside ngAfterViewChecked',
      wrong: `ngAfterViewChecked() {
  // Writing to a signal here causes ExpressionChangedAfterChecked!
  this.title.set('Updated: ' + this.data.name);
}`,
      right: `// Derive with computed() — no hook needed
title = computed(() => 'Updated: ' + this.data.name());

// Or if truly imperative, wrap in a microtask (last resort):
// ngAfterViewChecked() { Promise.resolve().then(() => this.title.set(...)); }`,
      explanation: 'Angular snapshots template expressions before "Checked" hooks run. Mutating state in ngAfterViewChecked triggers another CD cycle immediately, causing ExpressionChangedAfterCheckedError in dev mode. Always use computed() for derived values.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Angular calls lifecycle hooks in a guaranteed order (constructor → ngOnChanges → ngOnInit → ... → ngOnDestroy); modern APIs — signal <code>input()</code> with <code>effect()</code>, <code>viewChild()</code>, <code>DestroyRef</code>, and <code>afterNextRender()</code> — replace most hook-based patterns with less boilerplate.',
    mustKnow: [
      'Hook order: constructor → ngOnChanges → ngOnInit → ngDoCheck → ngAfterContentInit → ngAfterContentChecked → ngAfterViewInit → ngAfterViewChecked → ngOnDestroy',
      '<code>ngOnChanges</code> does NOT fire for <code>input()</code> signal inputs — use <code>effect()</code> instead',
      'Never access <code>viewChild()</code> in <code>ngOnInit</code> — the view is not yet rendered; use <code>afterNextRender()</code>',
      '<code>takeUntilDestroyed()</code> and <code>DestroyRef.onDestroy()</code> replace the boilerplate <code>ngOnDestroy + unsubscribe()</code> pattern',
      '<code>ngDoCheck</code> fires on every CD cycle — avoid heavy work; use <code>computed()</code> for derived state',
      'Mutating state in <code>ngAfterViewChecked</code> causes <code>ExpressionChangedAfterCheckedError</code> — use <code>computed()</code>',
      '<code>afterNextRender()</code> is SSR-safe; <code>ngAfterViewInit</code> runs in SSR contexts and should not access DOM APIs',
    ],
    interviewFocus: [
      'What is the complete order of lifecycle hooks, and which ones fire only once vs every CD cycle?',
      'Why doesn\'t ngOnChanges fire for signal inputs, and what should you use instead?',
      'What is the difference between afterNextRender() and afterRender()?',
      'How does takeUntilDestroyed() improve on the ngOnDestroy + takeUntil(destroy$) pattern?',
      'What causes ExpressionChangedAfterCheckedError and how do you prevent it?',
    ],
  };

  challenge: Challenge = {
    title: 'Cleanup with DestroyRef',
    description: 'Refactor a component that leaks a setInterval by using DestroyRef.onDestroy() to clear it automatically — then also convert its subscription to use takeUntilDestroyed().',
    language: 'typescript',
    hints: [
      'Inject DestroyRef using inject(DestroyRef) in the constructor',
      'Call destroyRef.onDestroy(() => clearInterval(id)) to clean up the timer',
      'Import takeUntilDestroyed from @angular/core/rxjs-interop',
      'Pipe the Observable: obs$.pipe(takeUntilDestroyed()).subscribe()',
    ],
    starterCode: `import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { interval, Subscription } from 'rxjs';

// This component has two memory leaks!
@Component({ template: '{{ tick() }} | {{ timer$ | async }}' })
export class TickerComponent implements OnInit, OnDestroy {
  tick = signal(0);
  private id!: ReturnType<typeof setInterval>;
  private sub!: Subscription;
  timer$ = interval(500);

  ngOnInit() {
    this.id  = setInterval(() => this.tick.update(v => v + 1), 1000);
    this.sub = this.timer$.subscribe();
  }

  ngOnDestroy() {
    // TODO: eliminate this method entirely
    clearInterval(this.id);
    this.sub.unsubscribe();
  }
}`,
    solution: `import { Component, signal, inject, DestroyRef } from '@angular/core';
import { interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({ template: '{{ tick() }} | {{ timer$ | async }}' })
export class TickerComponent {
  tick   = signal(0);
  // async pipe handles its own subscription — no manual sub needed
  timer$ = interval(500);

  constructor() {
    const destroyRef = inject(DestroyRef);

    // setInterval cleaned up via DestroyRef
    const id = setInterval(() => this.tick.update(v => v + 1), 1000);
    destroyRef.onDestroy(() => clearInterval(id));

    // Observable auto-completes when component is destroyed
    interval(1000)
      .pipe(takeUntilDestroyed())
      .subscribe(n => console.log('tick', n));
  }
}`,
  };
}
