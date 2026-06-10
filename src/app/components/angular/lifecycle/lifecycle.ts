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
import { VersionBadgeComponent, VersionInfo } from '../../shared/version-badge/version-badge';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';

@Component({
  selector: 'app-lifecycle',
  imports: [TrackedChildComponent, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './lifecycle.html',
  styleUrl: './lifecycle.scss',
})
export class LifecycleDemo {
  // ngOnChanges demo — control what we pass to child
  inputText   = signal('Hello');
  inputNumber = signal(1);
  showChild   = signal(true);

  // effect() demo
  effectName  = signal('Angular');
  effectCount = signal(0);
  effectTheme = signal<'light' | 'dark'>('light');
  effectLog   = signal<string[]>([]);

  // ViewChild demo
  focusTarget = viewChild<ElementRef<HTMLInputElement>>('focusInput');
  boxEl       = viewChild<ElementRef<HTMLDivElement>>('measuredBox');
  boxSize     = signal({ width: 0, height: 0 });

  constructor() {
    // effect() tracks all signals it reads — re-runs whenever any of them change
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
        this.boxSize.set({
          width: box.offsetWidth,
          height: box.offsetHeight,
        });
      }
    });
  }

  doFocus() {
    this.focusTarget()?.nativeElement.focus();
  }

  theory: TheoryPoint[] = [
  {
    heading: 'Component lifecycle order',
    points: [
      '<code>constructor</code> → <code>ngOnChanges</code> → <code>ngOnInit</code> → <code>ngDoCheck</code> → <code>ngAfterContentInit</code> → <code>ngAfterContentChecked</code> → <code>ngAfterViewInit</code> → <code>ngAfterViewChecked</code> → <code>ngOnDestroy</code>.',
      '<code>ngOnChanges</code> fires BEFORE <code>ngOnInit</code> and on every input change — receives a <code>SimpleChanges</code> map.',
      '<code>ngOnInit</code>: safe to use injected services and resolved inputs. Called once after the first <code>ngOnChanges</code>.',
      '<code>ngOnDestroy</code>: cleanup — unsubscribe observables, clear timers, cancel pending requests.',
    ],
  },
  {
    heading: 'View & content hooks',
    points: [
      '<code>ngAfterViewInit</code>: the component\'s own template is fully rendered — safe to use <code>viewChild()</code> references.',
      '<code>ngAfterContentInit</code>: projected content (<code>ng-content</code>) is initialised — safe to use <code>contentChild()</code>.',
      'The "Checked" variants (<code>ngAfterViewChecked</code>, <code>ngAfterContentChecked</code>) fire after every change detection cycle — avoid heavy work here.',
      '<code>afterNextRender()</code> (Angular 17+): runs once after the browser paints — ideal for third-party DOM libraries (Chart.js, maps).',
    ],
  },
  {
    heading: 'Modern signal-based equivalents',
    points: [
      '<code>viewChild(\'ref\')</code> returns a signal — read it directly in the template or in <code>effect()</code>, no <code>ngAfterViewInit</code> needed.',
      '<code>effect(() => { ... })</code>: runs whenever any signal it reads changes — a reactive replacement for <code>ngOnChanges</code> in many cases.',
      '<code>takeUntilDestroyed()</code>: a RxJS operator that auto-completes an observable when the component is destroyed.',
      'Prefer <code>DestroyRef.onDestroy()</code> over <code>ngOnDestroy</code> for cleanup in non-component injectables.',
    ],
  },
  {
    heading: 'Key points to remember',
    points: [
      'Never access <code>viewChild</code> in <code>ngOnInit</code> — the view is not yet initialised. Use <code>ngAfterViewInit</code> or an <code>effect()</code>.',
      '<code>ngOnChanges</code> does NOT fire for signal inputs (<code>input()</code>) — use <code>effect()</code> to react to signal input changes instead.',
      '<code>ngDoCheck</code> fires on every CD cycle — use sparingly; it can severely impact performance.',
      'In zoneless apps, <code>ngDoCheck</code> is triggered only by signal changes — its frequency drops dramatically.',
    ],
  },
];

  qna: QnaItem[] = [
    { q: 'What is the order of Angular lifecycle hooks?', a: 'constructor → ngOnChanges → ngOnInit → ngDoCheck → ngAfterContentInit → ngAfterContentChecked → ngAfterViewInit → ngAfterViewChecked → ngOnDestroy. For signal-based components, most post-init hooks are replaced by <code>effect()</code>.' },
    { q: 'Why is ngOnChanges called before ngOnInit?', a: '<code>ngOnChanges</code> fires whenever an <code>@Input()</code> changes — including the very first time before init. Angular calls it first so you have access to input values inside <code>ngOnInit</code>.' },
    { q: 'What replaced ngAfterViewInit for signal-based code?', a: '<code>afterNextRender()</code> fires once after the first browser paint — safe for DOM operations, canvas, and third-party DOM libraries. For ongoing after-render effects use <code>afterRender()</code>.' },
    { q: 'When should you use ngOnDestroy?', a: 'For cleanup: unsubscribing from Observables, clearing setInterval, detaching event listeners. With <code>DestroyRef.onDestroy()</code> or <code>takeUntilDestroyed()</code> you can skip implementing the interface entirely.' },
    { q: 'Does viewChild() require ngAfterViewInit?', a: 'No — <code>viewChild()</code> returns a Signal. Read it inside <code>effect()</code> or <code>computed()</code> and Angular handles the timing. The signal is <code>undefined</code> until the view initialises, then updates to the element reference.' },
    { q: 'What is ngDoCheck and when would you use it?', a: '<code>ngDoCheck</code> fires on every change detection cycle. Use it to detect changes Angular won\'t catch (e.g. mutations inside an array). Be very careful — it fires extremely frequently and can hurt performance.' },
  ];

  tabs: CodeTab[] = [
    {
      label: 'Lifecycle order',
      language: 'typescript',
      code: `// Angular calls these hooks in this exact order:

// 1. constructor()        — DI only, no DOM/inputs yet
// 2. ngOnChanges(changes) — BEFORE ngOnInit, then on every @Input() change
// 3. ngOnInit()           — once, after first ngOnChanges; safe to fetch data
// 4. ngDoCheck()          — every CD cycle (avoid heavy logic)
// 5. ngAfterContentInit() — once, after <ng-content> projected
// 6. ngAfterContentChecked()
// 7. ngAfterViewInit()    — once, after component's view + children rendered
// 8. ngAfterViewChecked()
// 9. ngOnDestroy()        — cleanup: unsubscribe, clearInterval, etc.

// Modern equivalents (no interface needed):
// afterRender(() => ...)       — runs after EVERY render
// afterNextRender(() => ...)   — runs after the NEXT render only`,
    },
    {
      label: 'ngOnChanges',
      language: 'typescript',
      code: `import { Component, input, OnChanges, SimpleChanges } from '@angular/core';

export class TrackedChild implements OnChanges {
  // input() signals do NOT trigger ngOnChanges
  // Use @Input() for ngOnChanges to fire:
  @Input() text   = '';
  @Input() count  = 0;

  changeLog: string[] = [];

  ngOnChanges(changes: SimpleChanges) {
    for (const [key, change] of Object.entries(changes)) {
      this.changeLog.unshift(
        \`\${key}: \${JSON.stringify(change.previousValue)} → \${JSON.stringify(change.currentValue)}\`
      );
    }
  }
}`,
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
    // ✅ Safe to set up subscriptions here (inputs are ready)
    this.sub = interval(1000).subscribe(() => this.count++);
  }

  ngOnDestroy() {
    // ✅ Always clean up to prevent memory leaks
    this.sub.unsubscribe();
    console.log('Component cleaned up');
  }
}

// Modern alternative — no interface needed:
// import { DestroyRef, inject } from '@angular/core';
// private destroyRef = inject(DestroyRef);
// this.destroyRef.onDestroy(() => this.sub.unsubscribe());`,
    },
    {
      label: 'DestroyRef + takeUntilDestroyed',
      language: 'typescript',
      code: `// Modern cleanup — replaces ngOnDestroy + Subject + takeUntil
import { Component, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

export class TimerComponent {
  private destroyRef = inject(DestroyRef);

  // ① takeUntilDestroyed() — subscribe that auto-cancels on destroy
  timer$ = interval(1000).pipe(takeUntilDestroyed());

  // ② destroyRef.onDestroy() — register any cleanup callback
  constructor() {
    const intervalId = setInterval(() => console.log('tick'), 500);
    this.destroyRef.onDestroy(() => clearInterval(intervalId));

    // No ngOnDestroy interface needed at all!
  }
}

// OLD WAY (still works but more boilerplate):
// private destroy$ = new Subject<void>();
// ngOnInit() { interval(1000).pipe(takeUntil(this.destroy$)).subscribe(); }
// ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }`,
    },
    {
      label: 'ResizeObserver (afterNextRender)',
      language: 'typescript',
      code: `// Use afterNextRender() to safely access DOM — works in SSR too
import { Component, viewChild, ElementRef, afterNextRender, signal, inject, DestroyRef } from '@angular/core';

export class ResponsiveBoxComponent {
  boxRef    = viewChild<ElementRef<HTMLDivElement>>('box');
  boxWidth  = signal(0);
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

      // Clean up when component is destroyed
      this.destroyRef.onDestroy(() => ro.disconnect());
    });
  }
}

// Template:
// <div #box class="resizable-box">Width: {{ boxWidth() }}px</div>`,
    },
    {
      label: 'ViewChild + afterNextRender',
      language: 'typescript',
      code: `import { Component, viewChild, ElementRef, afterNextRender } from '@angular/core';

export class MyComponent {
  // viewChild() — typed signal-based reference to a child element/component
  inputEl = viewChild<ElementRef<HTMLInputElement>>('myInput');
  childCmp = viewChild(ChildComponent);

  constructor() {
    // afterNextRender — runs once, AFTER the view is painted
    // Use for DOM measurements, focus, third-party libs
    afterNextRender(() => {
      const width = this.inputEl()?.nativeElement.offsetWidth;
      console.log('input width:', width);

      this.inputEl()?.nativeElement.focus();
    });
  }
}

// Template:
// <input #myInput type="text" />
// <app-child />`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'Which lifecycle hook fires before ngOnInit?',
      options: ['ngAfterViewInit', 'ngOnChanges', 'constructor', 'ngDoCheck'],
      answer: 1,
      explanation: 'ngOnChanges fires first (when inputs change), then ngOnInit. The constructor runs before Angular hooks.',
    },
    {
      q: 'When does ngOnDestroy run?',
      options: [
        'When the component\'s template is hidden with @if',
        'When the component is removed from the DOM',
        'When the component\'s input changes',
        'When change detection runs',
      ],
      answer: 1,
      explanation: 'ngOnDestroy runs just before Angular removes the component. Use it to clean up subscriptions and timers.',
    },
    {
      q: 'What is the modern replacement for ngAfterViewInit when you need DOM dimensions?',
      options: ['viewChild()', 'afterRender()', 'afterNextRender()', 'ngAfterViewChecked()'],
      answer: 2,
      explanation: 'afterNextRender() fires once after the first browser paint — safe for DOM measurements without SSR issues.',
    },
    {
      q: 'Which signal query replaces @ViewChild?',
      options: ['input()', 'output()', 'viewChild()', 'contentChild()'],
      answer: 2,
      explanation: 'viewChild() is a signal-based replacement for the @ViewChild decorator, returning a signal with the element/component reference.',
    },
  ];

  challenge: Challenge = {
    title: 'Cleanup with DestroyRef',
    description: 'Refactor a component that leaks a setInterval by using DestroyRef.onDestroy() to clear it automatically.',
    language: 'typescript',
    hints: [
      'Inject DestroyRef using inject(DestroyRef)',
      'Call destroyRef.onDestroy(() => clearInterval(id))',
      'This is equivalent to ngOnDestroy but works anywhere in the injection context',
    ],
    starterCode: `import { Component, signal, OnDestroy } from '@angular/core';

// This component has a memory leak — the interval never stops
@Component({ template: '{{ tick() }}' })
export class TickerComponent implements OnDestroy {
  tick = signal(0);
  private id = setInterval(() => this.tick.update(v => v + 1), 1000);

  ngOnDestroy() {
    // TODO: replace this class-based cleanup
    // with DestroyRef so we can remove OnDestroy
    clearInterval(this.id);
  }
}`,
    solution: `import { Component, signal, inject, DestroyRef } from '@angular/core';

@Component({ template: '{{ tick() }}' })
export class TickerComponent {
  tick = signal(0);

  constructor() {
    const id = setInterval(() => this.tick.update(v => v + 1), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }
}`,
  };

  quickRef: QuickRefItem[] = [
    { name: 'ngOnChanges', type: 'hook', desc: 'Fires before ngOnInit and on every @Input() change, receiving a SimpleChanges map of old and new values.' , since: '2'},
    { name: 'ngOnInit', type: 'hook', desc: 'Runs once after the first ngOnChanges; safe to access injected services and resolved @Input() values.' , since: '2'},
    { name: 'ngOnDestroy', type: 'hook', desc: 'Runs just before Angular removes the component; use it to unsubscribe observables, clear timers, and cancel requests.' , since: '2'},
    { name: 'ngDoCheck', type: 'hook', desc: 'Fires on every change-detection cycle, allowing custom dirty-checking; avoid heavy logic here as it runs very frequently.' , since: '2'},
    { name: 'ngAfterViewInit', type: 'hook', desc: 'Fires once after the component\'s own template and child views are fully rendered; safe to access @ViewChild references.' , since: '2'},
    { name: 'afterNextRender', type: 'function', desc: 'Runs a callback once after the next browser paint; ideal for DOM measurements and initialising third-party DOM libraries.' , since: '17'},
    { name: 'afterRender', type: 'function', desc: 'Runs a callback after every render cycle, unlike afterNextRender which fires only once.' , since: '17'},
    { name: 'DestroyRef', type: 'class', desc: 'An injectable token whose onDestroy() method registers cleanup callbacks without requiring the ngOnDestroy interface.' , since: '16'},
    { name: 'takeUntilDestroyed', type: 'operator', desc: 'An RxJS pipeable operator from @angular/core/rxjs-interop that auto-completes an observable when the host component is destroyed.' , since: '16'},
    { name: 'SimpleChanges', type: 'interface', desc: 'A map of changed @Input() properties passed to ngOnChanges, each entry holding previousValue, currentValue, and firstChange.' , since: '2'},
  ];

  beforeAfter: BeforeAfterExample[] = [
    { title: 'Cleanup: ngOnDestroy vs DestroyRef', before: '// Old: implement OnDestroy interface\nprivate sub!: Subscription;\nngOnInit() {\n  this.sub = interval(1000).subscribe();\n}\nngOnDestroy() { this.sub.unsubscribe(); }', after: '// New: inject DestroyRef, no interface needed\nconstructor() {\n  const sub = interval(1000)\n    .pipe(takeUntilDestroyed())\n    .subscribe();\n}',
      note: 'takeUntilDestroyed() and DestroyRef.onDestroy() both eliminate the need to implement OnDestroy.' },
    { title: 'DOM access: ngAfterViewInit vs afterNextRender', before: '// Old: ngAfterViewInit (breaks SSR)\n@ViewChild(\'box\') boxEl!: ElementRef;\nngAfterViewInit() {\n  const w = this.boxEl.nativeElement.offsetWidth;\n}', after: '// New: afterNextRender + viewChild signal (SSR-safe)\nboxEl = viewChild<ElementRef>(\'box\');\nconstructor() {\n  afterNextRender(() => {\n    const w = this.boxEl()?.nativeElement.offsetWidth;\n  });\n}',
      note: 'afterNextRender() is SSR-safe and pairs naturally with signal-based viewChild().' },
    { title: 'Reacting to input changes: ngOnChanges vs effect()', before: '// Old: @Input() + ngOnChanges\n@Input() theme = \'light\';\nngOnChanges(changes: SimpleChanges) {\n  if (changes[\'theme\']) { this.applyTheme(); }\n}', after: '// New: input() signal + effect()\ntheme = input(\'light\');\nconstructor() {\n  effect(() => { this.applyTheme(this.theme()); });\n}',
      note: 'signal input() does NOT trigger ngOnChanges — use effect() instead to react to signal input changes.' },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Accessing viewChild in ngOnInit', wrong: 'ngOnInit() {\n  // undefined — view not rendered yet\n  this.inputEl()?.nativeElement.focus();\n}', right: 'constructor() {\n  afterNextRender(() => {\n    this.inputEl()?.nativeElement.focus();\n  });\n}', explanation: 'viewChild() signals are undefined until after the view renders. Use afterNextRender() or ngAfterViewInit, not ngOnInit.'  },
    { title: 'Expecting ngOnChanges to fire for signal inputs', wrong: '// input() signal — ngOnChanges NEVER fires\nvalue = input(0);\nngOnChanges(c: SimpleChanges) { /* never runs */ }', right: 'value = input(0);\nconstructor() {\n  effect(() => { console.log(this.value()); });\n}', explanation: 'ngOnChanges only responds to @Input() decorator properties. Signal inputs (input()) require effect() for reactive side effects.'  },
    { title: 'Heavy logic inside ngDoCheck', wrong: 'ngDoCheck() {\n  // Fires on EVERY change-detection cycle!\n  this.expensiveRecalculation();\n}', right: '// Use a computed() signal or targeted effect() instead\nderived = computed(() => this.expensiveRecalculation(this.value()));', explanation: 'ngDoCheck fires extremely frequently — every CD cycle. Expensive work here tanks performance; use computed() or effect() which only run when dependencies change.'  },
    { title: 'Forgetting to clean up subscriptions', wrong: 'ngOnInit() {\n  // Leaks if component is destroyed!\n  interval(1000).subscribe(() => this.count++);\n}', right: 'constructor() {\n  interval(1000)\n    .pipe(takeUntilDestroyed())\n    .subscribe(() => this.count++);\n}', explanation: 'Subscriptions that outlive the component cause memory leaks. Use takeUntilDestroyed() or DestroyRef.onDestroy() to ensure cleanup.'  },
  ];

  versionItems: VersionInfo[] = [
    { version: 'Angular 16', label: 'DestroyRef and takeUntilDestroyed', features: ['DestroyRef injectable token — register cleanup callbacks via onDestroy() without implementing the OnDestroy interface', 'takeUntilDestroyed() RxJS operator from @angular/core/rxjs-interop auto-completes observables on component destruction', 'Works inside or outside components, making cleanup patterns composable in services and directives'] },
    { version: 'Angular 17', label: 'afterNextRender and afterRender', features: ['afterNextRender() runs a callback once after the next browser paint — ideal for third-party DOM libraries and measurements', 'afterRender() runs after every render cycle for continuous post-render effects', 'Both are SSR-safe and pair naturally with signal-based viewChild() queries'] },
  ];
}
