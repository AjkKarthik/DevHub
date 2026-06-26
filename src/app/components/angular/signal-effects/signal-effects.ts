import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';
import { BeforeAfterComponent, BeforeAfterExample } from '../../shared/before-after/before-after';
import { PrerequisitesComponent, Prerequisite } from '../../shared/prerequisites/prerequisites';

@Component({
  selector: 'app-signal-effects',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent, RevisionCardComponent,
    CommonMistakesComponent, BeforeAfterComponent, PrerequisitesComponent,
  ],
  templateUrl: './signal-effects.html',
  styleUrl: './signal-effects.scss',
})
export class SignalEffectsDemo {

  prerequisites: Prerequisite[] = [
    { label: 'Signals & State', route: '/angular/counter' },
    { label: 'Lifecycle Hooks',  route: '/angular/lifecycle' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'effect(fn)',             type: 'function', desc: 'Runs fn immediately and re-runs whenever any signal read inside fn changes', since: 'Angular 16' },
    { name: 'effect(fn, { allowSignalWrites: true })', type: 'function', desc: 'Opt-in to writing signals inside effects — use sparingly to avoid cycles', since: 'Angular 16' },
    { name: 'untracked(fn)',          type: 'function', desc: 'Read signals inside fn without creating a dependency — fn runs once, not on changes', since: 'Angular 16' },
    { name: 'onCleanup(fn)',          type: 'function', desc: 'Register cleanup that runs before the next effect execution or on destroy', since: 'Angular 16' },
    { name: 'effectRef.destroy()',    type: 'method',   desc: 'Manually stop an effect created outside a component context', since: 'Angular 16' },
    { name: 'runInInjectionContext', type: 'function',  desc: 'Create an effect (or inject) outside a component/service constructor', since: 'Angular 16' },
    { name: 'toObservable(signal)',   type: 'function', desc: 'Convert a signal to an Observable — useful when bridging signal and RxJS worlds', since: 'Angular 16' },
    { name: 'toSignal(observable)',   type: 'function', desc: 'Convert an Observable to a signal — runs in injection context', since: 'Angular 16' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What effect() is and when to use it',
      points: [
        '<code>effect()</code> is Angular\'s mechanism for <strong>reactive side effects</strong>: code that should run whenever signals it reads change. Think of it as <code>computed()</code> for side effects — computed returns a derived value; effect performs an action.',
        'Use effects for: syncing to <code>localStorage</code>, calling third-party imperative APIs (Canvas, Map, Chart.js), logging for debugging, bridging signals to RxJS, and updating DOM elements that cannot be driven declaratively by templates.',
        '<strong>Do NOT use effects</strong> for: deriving state (use <code>computed()</code>), updating signals from other signals (use <code>computed()</code> or <code>linkedSignal()</code>), initialising data on navigation (use a route resolver), or reacting to events (use event handlers).',
        'Effects must be created in an injection context: inside a component/directive constructor, inside a service, or inside <code>runInInjectionContext(injector, () =&gt; effect(...))</code>.',
      ],
    },
    {
      heading: 'Tracking mechanics — synchronous reads only',
      points: [
        'Angular tracks signal reads that occur <strong>synchronously during the effect body\'s first execution</strong>. A signal read inside an async callback, a Promise, or a setTimeout is NOT tracked.',
        'The effect re-runs after Angular\'s next microtask flush — not synchronously on every signal write. This means rapid successive writes to a signal trigger only one re-run (the last value wins), preventing thrashing.',
        'Every re-run re-collects its dependencies. If an effect reads signal A in one run and signal B in another (e.g. inside an if-branch), it tracks only the signals actually read in that run.',
        '<code>untracked(() =&gt; someSignal())</code> reads a signal without registering it as a dependency. Use this for "reading a configuration signal once" without re-running the effect on config changes.',
      ],
    },
    {
      heading: 'allowSignalWrites and avoiding circular effects',
      points: [
        'By default, writing to a signal inside an effect throws an error. This is intentional — writing signals inside effects easily creates cycles: effect reads A → effect writes B → something reads B → triggers another effect → ...',
        'Pass <code>{ allowSignalWrites: true }</code> to opt in. Use only when the write logically cannot create a cycle — e.g. the effect writes a different signal than the one(s) it reads, and those written signals have no path back to the read signals.',
        'A better pattern when you need a derived-then-synced value: use <code>computed()</code> for the derivation, then a single effect to sync the computed value to an external system.',
        'The most common legitimate use of allowSignalWrites: an effect that reads a "raw" external value (e.g., a DOM measurement) and writes it back as a signal. Even then, consider using <code>afterRenderEffect()</code> for DOM measurements.',
      ],
    },
    {
      heading: 'onCleanup() — managing subscriptions and resources',
      points: [
        '<code>onCleanup(fn)</code> registers a callback inside an effect body. The callback runs <strong>before the next execution</strong> of the effect (when it re-runs due to a signal change) and when the effect is destroyed (component destroyed or <code>effectRef.destroy()</code>).',
        'This is the correct way to manage resources in effects: open a WebSocket, store the close callback in onCleanup. Subscribe to a stream, unsubscribe in onCleanup. Start a timer, cancel it in onCleanup.',
        'Without onCleanup, re-running effects accumulate open connections, event listeners, and subscriptions on every signal change — a classic memory leak.',
        'Effects are automatically destroyed when their host component/directive/service is destroyed. For effects created with <code>runInInjectionContext</code>, you must call <code>effectRef.destroy()</code> yourself.',
      ],
    },
    {
      heading: 'effect() vs computed() — choosing the right tool',
      points: [
        '<strong>Use <code>computed()</code></strong> when: you derive a new value from existing signals, the result is used in the template, and you want memoisation (only recomputes when inputs change). <code>computed()</code> is lazy — it only runs when its value is read.',
        '<strong>Use <code>effect()</code></strong> when: you need to perform a side effect (call external API, write to DOM, update localStorage, log to analytics). Effects are eager — they run after each change regardless of whether the result is read.',
        '<code>computed()</code> cannot cause side effects safely. <code>effect()</code> cannot return a value. They are complementary — not alternatives. The mental model: computed = signal transformation; effect = reaction to signal changes.',
        'A pattern that works well: <code>computed()</code> derives the "what" (what state do I have?), <code>effect()</code> performs the "so what" (what should I do about it?). Keep effects thin — derive in computed, act in effect.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic effect patterns',
      language: 'typescript',
      code: `@Component({ ... })
export class ThemeComponent {
  theme = signal<'light' | 'dark'>('light');

  constructor() {
    // 1. Sync signal to localStorage — runs on every theme change
    effect(() => {
      localStorage.setItem('theme', this.theme());
    });

    // 2. Logging — runs when any tracked signal changes
    effect(() => {
      console.log('[theme changed]', this.theme());
    });

    // 3. Applying to DOM — imperative updates that don't fit templates
    effect(() => {
      document.body.className = this.theme() === 'dark' ? 'dark-mode' : '';
    });
  }
}

// Reading from localStorage on init, then syncing writes
@Component({ ... })
export class PreferencesComponent {
  fontSize = signal(parseInt(localStorage.getItem('fontSize') ?? '16', 10));

  constructor() {
    effect(() => {
      localStorage.setItem('fontSize', String(this.fontSize()));
      // runs once immediately (sets the initial value),
      // then on every fontSize() change
    });
  }
}`,
    },
    {
      label: 'untracked() and allowSignalWrites',
      language: 'typescript',
      code: `@Component({ ... })
export class SearchComponent {
  query     = signal('');
  pageSize  = signal(10);
  results   = signal<string[]>([]);
  logCount  = signal(0);

  constructor() {
    // untracked: re-run only when query changes, not pageSize
    effect(() => {
      const q = this.query();  // tracked — effect re-runs when query changes
      const size = untracked(() => this.pageSize());  // NOT tracked
      console.log(\`Searching "\${q}" with pageSize=\${size}\`);
    });

    // allowSignalWrites: write to a different signal inside the effect
    effect(() => {
      const q = this.query();
      const res = this.mockSearch(q);
      this.results.set(res);  // writing a signal — requires allowSignalWrites
    }, { allowSignalWrites: true });

    // WRONG: effect reads and writes the SAME signal → infinite loop
    // effect(() => {
    //   this.logCount.update(n => n + 1);  // reads logCount → triggers effect → reads logCount...
    // }, { allowSignalWrites: true });
  }

  private mockSearch(q: string): string[] {
    return q ? [\`Result for "\${q}"\`] : [];
  }
}`,
    },
    {
      label: 'onCleanup() — resources and subscriptions',
      language: 'typescript',
      code: `@Component({ ... })
export class LiveFeedComponent {
  roomId    = signal('general');
  messages  = signal<string[]>([]);

  constructor(private ws: WebSocketService) {
    effect((onCleanup) => {
      const room = this.roomId();
      const socket = this.ws.connect(room);

      socket.onmessage = (msg) => {
        this.messages.update(msgs => [...msgs, msg.data]);
      };

      // Runs before the next effect execution (room change) AND on destroy
      onCleanup(() => {
        socket.close();
        console.log(\`Disconnected from room: \${room}\`);
      });
    });
  }
}

// Timer example — interval cleaned up on each re-run
@Component({ ... })
export class PollingComponent {
  intervalMs = signal(5000);
  data       = signal<unknown>(null);

  constructor(private http: HttpClient) {
    effect((onCleanup) => {
      const interval = this.intervalMs();
      const timer = setInterval(() => {
        this.http.get('/api/data').subscribe(d => this.data.set(d));
      }, interval);

      onCleanup(() => clearInterval(timer));  // clears before each re-run
    });
  }
}`,
    },
    {
      label: 'Effects with RxJS bridging',
      language: 'typescript',
      code: `import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap, debounceTime } from 'rxjs/operators';

@Component({ ... })
export class SearchBoxComponent {
  query   = signal('');
  results = toSignal(
    // Bridge signal → Observable to use RxJS operators
    toObservable(inject(SearchService).query)
      .pipe(
        debounceTime(300),                    // RxJS debounce
        switchMap(q => inject(SearchService).search(q)),
      ),
    { initialValue: [] }
  );
}

// Manual bridging with effect + onCleanup
@Component({ ... })
export class ManualBridgeComponent {
  filter   = signal('');
  items    = signal<Item[]>([]);

  constructor(private itemService: ItemService) {
    effect((onCleanup) => {
      const f = this.filter();
      const sub = this.itemService.getItems(f).subscribe(items => {
        this.items.set(items);
      });
      onCleanup(() => sub.unsubscribe());
    });
  }
}

// runInInjectionContext — create effect outside constructor
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private injector = inject(Injector);
  theme = signal<'light' | 'dark'>('light');

  applyTheme(): void {
    runInInjectionContext(this.injector, () => {
      effect(() => {
        document.body.dataset['theme'] = this.theme();
      });
    });
  }
}`,
    },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'ngOnChanges + manual subscription vs effect()',
      language: 'typescript',
      before: `// Zone-based: watch an input, manually subscribe, manage subscription
@Component({ ... })
export class OldComponent implements OnChanges, OnDestroy {
  @Input() userId!: number;
  private sub?: Subscription;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['userId']) {
      this.sub?.unsubscribe();
      this.sub = this.userService.getUser(this.userId)
        .subscribe(user => this.currentUser = user);
    }
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }
}`,
      after: `// Signals: effect() handles re-runs and cleanup declaratively
@Component({ ... })
export class NewComponent {
  userId = input.required<number>();  // signal input

  constructor(private userService: UserService) {
    effect((onCleanup) => {
      const id = this.userId();   // tracked — re-runs when userId changes
      const sub = this.userService.getUser(id)
        .subscribe(user => this.currentUser.set(user));
      onCleanup(() => sub.unsubscribe());  // auto-cleanup on re-run
    });
  }
}`,
      note: 'effect() with onCleanup() eliminates the ngOnChanges/ngOnDestroy boilerplate. The subscription lifecycle is co-located with the effect logic.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Reading a signal inside an async callback — it is not tracked',
      wrong: `effect(() => {
  setTimeout(() => {
    console.log(this.count());  // NOT tracked — async, outside sync tracking window
  }, 1000);
});`,
      right: `effect(() => {
  const current = this.count();  // tracked — synchronous read
  setTimeout(() => {
    console.log(current);  // use the captured value
  }, 1000);
});`,
      explanation: 'Angular only tracks signal reads that happen synchronously during the effect body\'s execution. Reads inside setTimeout, Promise callbacks, or async/await are outside the tracking window and never create dependencies.',
    },
    {
      title: 'Using effect() to derive state instead of computed()',
      wrong: `// Anti-pattern: effect to keep fullName in sync with firstName/lastName
fullName = signal('');

constructor() {
  effect(() => {
    this.fullName.set(this.firstName() + ' ' + this.lastName());
  }, { allowSignalWrites: true });
}`,
      right: `// computed() is made for derived values — lazy, memoised, no effect needed
fullName = computed(() => \`\${this.firstName()} \${this.lastName()}\`);`,
      explanation: 'Deriving state with effect() + allowSignalWrites is an antipattern: it requires opting into signal writes, runs asynchronously (one tick late), and can cause subtle timing bugs. computed() is synchronous and memoised.',
    },
    {
      title: 'Forgetting onCleanup() — resources accumulate on every re-run',
      wrong: `effect(() => {
  const room = this.roomId();
  const socket = this.ws.connect(room);  // new socket on every room change
  socket.onmessage = msg => this.addMessage(msg);
  // Old socket never closed — connection leak!
});`,
      right: `effect((onCleanup) => {
  const room = this.roomId();
  const socket = this.ws.connect(room);
  socket.onmessage = msg => this.addMessage(msg);
  onCleanup(() => socket.close());  // closed before next re-run
});`,
      explanation: 'Without onCleanup, every signal change creates a new resource without releasing the old one. After 10 room changes, there are 10 open WebSockets. onCleanup is called before each re-run and on destruction.',
    },
    {
      title: 'Creating effects outside an injection context',
      wrong: `// In a regular method — throws ERROR: effect() can only be used within an injection context
ngAfterViewInit() {
  effect(() => { console.log(this.count()); });  // ❌ outside constructor
}`,
      right: `// Option 1: create in constructor (always injection context)
constructor() {
  effect(() => { console.log(this.count()); });
}

// Option 2: use runInInjectionContext with the component's injector
ngAfterViewInit() {
  runInInjectionContext(this.injector, () => {
    effect(() => { console.log(this.count()); });
  });
}`,
      explanation: 'effect() must be called in an injection context so Angular can tie its lifetime to the host component/service. The constructor is the safest location. Use runInInjectionContext for late-binding effects.',
    },
    {
      title: 'Creating a circular effect with allowSignalWrites',
      wrong: `// This loops infinitely — the effect reads and writes the same signal
count = signal(0);

constructor() {
  effect(() => {
    console.log('count:', this.count());
    this.count.update(n => n + 1);  // triggers effect again → count++ → triggers...
  }, { allowSignalWrites: true });
}`,
      right: `// Read one signal, write a different one — no cycle
rawInput = signal('');
processed = signal('');

constructor() {
  effect(() => {
    const raw = this.rawInput();      // reads rawInput
    this.processed.set(raw.trim());   // writes processed (different signal)
  }, { allowSignalWrites: true });
  // Note: computed() is still better here — this is just to illustrate the safe pattern
}`,
      explanation: 'allowSignalWrites lifts the guard against writing signals in effects but does not prevent cycles. If an effect writes a signal it also reads (directly or transitively), it will loop until Angular detects the cycle and throws.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a reactive theme + localStorage sync service',
    language: 'typescript',
    description: `Create a ThemeService using signals and effects that:
1. Loads the initial theme from localStorage (or defaults to 'light')
2. Exposes a theme signal and a toggleTheme() method
3. Uses effect() to sync theme changes to localStorage AND to document.body.className
4. Provides a computed() isDark signal

Then write a component that uses the service and shows the current theme with a toggle button.`,
    hints: [
      'Read localStorage in signal\'s initializer: signal(localStorage.getItem("theme") ?? "light")',
      'Use effect() in the service constructor for the sync — NOT in the component',
      'effect() runs once immediately — the initial localStorage sync is free',
      'document.body.className = theme === "dark" ? "dark-mode" : "" is the DOM sync',
      'computed() isDark = computed(() => this.theme() === "dark")',
    ],
    starterCode: `import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Component } from '@angular/core';

// TODO: implement ThemeService
@Injectable({ providedIn: 'root' })
export class ThemeService {
  // TODO: theme signal initialized from localStorage
  // TODO: computed isDark
  // TODO: effect in constructor to sync to localStorage and body class
  // TODO: toggleTheme() method
}

// TODO: implement ThemeToggleComponent
@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  template: \`<!-- TODO: show current theme and a toggle button -->\`,
})
export class ThemeToggleComponent {
  // TODO: inject ThemeService
}`,
    solution: `import { Injectable, signal, computed, effect } from '@angular/core';
import { Component, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<'light' | 'dark'>(
    (localStorage.getItem('theme') as 'light' | 'dark') ?? 'light'
  );
  readonly isDark = computed(() => this.theme() === 'dark');

  constructor() {
    effect(() => {
      const t = this.theme();
      localStorage.setItem('theme', t);
      document.body.className = t === 'dark' ? 'dark-mode' : '';
    });
  }

  toggleTheme(): void {
    this.theme.update(t => t === 'light' ? 'dark' : 'light');
  }
}

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  template: \`
    <div>
      <p>Current theme: <strong>{{ themeService.theme() }}</strong></p>
      <p>Is dark: {{ themeService.isDark() }}</p>
      <button (click)="themeService.toggleTheme()">Toggle Theme</button>
    </div>
  \`,
})
export class ThemeToggleComponent {
  themeService = inject(ThemeService);
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'When does Angular re-run an effect after a signal changes?',
      options: [
        'Synchronously and immediately when the signal is written',
        'Asynchronously, after the current microtask queue is flushed',
        'On the next change detection cycle (zone-driven)',
        'Only when the component re-renders',
      ],
      answer: 1,
      explanation: 'Effects are scheduled asynchronously. Multiple signal writes in the same synchronous block trigger only one re-run with the final values — preventing unnecessary thrashing. The effect runs after Angular\'s next microtask flush.',
    },
    {
      q: 'What does untracked() do inside an effect?',
      options: [
        'Prevents the effect from ever running again',
        'Reads a signal without registering it as a dependency',
        'Schedules the read for the next microtask',
        'Throws an error if the signal changes during the read',
      ],
      answer: 1,
      explanation: 'untracked(() => signal()) reads the signal\'s current value without creating a dependency. The effect will not re-run when that signal changes. Use it for "read once" configuration values you do not want to track.',
    },
    {
      q: 'When is the onCleanup callback called?',
      options: [
        'Only when the component is destroyed',
        'Before each re-run of the effect AND when the effect is destroyed',
        'Only before the first re-run (not on destroy)',
        'After each re-run completes',
      ],
      answer: 1,
      explanation: 'onCleanup runs in two cases: (1) before the effect re-runs due to a signal change (allowing cleanup of the previous run\'s resources), and (2) when the effect\'s host is destroyed. This makes it safe for managing subscriptions and connections.',
    },
    {
      q: 'Where must effect() be called?',
      options: [
        'Only in component constructors — services cannot use effects',
        'Inside an injection context: constructor, service, or runInInjectionContext()',
        'Inside ngOnInit() — not in the constructor',
        'Anywhere — effect() has no context requirement',
      ],
      answer: 1,
      explanation: 'effect() requires an injection context so Angular can tie its lifetime to a host injector. The component/service constructor is the natural place. Use runInInjectionContext(injector, () => effect(...)) for late creation.',
    },
    {
      q: 'You want to derive fullName from firstName and lastName signals. Which is correct?',
      options: [
        'effect(() => { this.fullName.set(firstName() + lastName()); }, { allowSignalWrites: true })',
        'computed(() => firstName() + " " + lastName())',
        'Both are correct — choose based on preference',
        'linkedSignal() with the firstName source',
      ],
      answer: 1,
      explanation: 'computed() is purpose-built for derived state: synchronous, memoised, and lazy. Using effect() with allowSignalWrites for derivation is an antipattern — it runs asynchronously (one tick late) and requires opting into a risky mode.',
    },
    {
      q: 'What happens when you read a signal inside a setTimeout inside an effect?',
      options: [
        'The signal is tracked normally — effect re-runs when it changes',
        'The signal is not tracked — async reads are outside the tracking window',
        'Angular throws a compile-time error',
        'The effect re-runs but only once per component lifecycle',
      ],
      answer: 1,
      explanation: 'Angular tracks only synchronous signal reads during the effect body. Reads inside async callbacks (setTimeout, Promise, async/await) occur after the tracking window closes and are not registered as dependencies.',
    },
    {
      q: 'What is the risk of allowSignalWrites if the effect reads and writes the same signal?',
      options: [
        'The signal value is reset to its initial value',
        'The effect loops infinitely — write triggers re-run, re-run triggers write',
        'Angular silently ignores the circular write',
        'The effect runs only twice regardless of signal writes',
      ],
      answer: 1,
      explanation: 'Reading and writing the same signal in an effect creates a cycle: write → triggers effect → read → effect runs → write again. Angular detects and throws after many iterations, but the pattern should be avoided entirely.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use effect() vs computed()?',
      a: 'computed() is for deriving values from signals — use it when you need a new signal whose value depends on other signals. It is lazy and memoised. effect() is for side effects — use it when a signal change should trigger an action (DOM update, localStorage write, API call, logging). The distinction: computed() = transform signals; effect() = react to signals. If you find yourself writing this.someSignal.set() inside an effect, you probably want computed().',
    },
    {
      q: 'How do I bridge RxJS Observables and signals?',
      a: 'Two directions: (1) Observable → signal: use toSignal(obs$, { initialValue: defaultValue }) in an injection context. It subscribes automatically and unsubscribes when the context is destroyed. (2) Signal → Observable: use toObservable(signal) which creates an Observable that emits whenever the signal changes. You can then pipe RxJS operators like debounceTime and switchMap on it. Both are in @angular/core/rxjs-interop.',
    },
    {
      q: 'Do I need to manually clean up effects when a component is destroyed?',
      a: 'No — effects created inside a component/service constructor are automatically destroyed when the host injector is destroyed (component destroyed, service gone). You only need to call effectRef.destroy() manually for effects created via runInInjectionContext() with a longer-lived injector, or when you want to stop an effect before the host is destroyed.',
    },
    {
      q: 'Can I create an effect inside ngOnInit instead of the constructor?',
      a: 'Yes, but with extra work. ngOnInit runs outside the injection context — you need inject(Injector) in the constructor and call runInInjectionContext(this.injector, () => effect(...)) inside ngOnInit. The constructor is simpler and preferred. The only reason to create effects in ngOnInit is if you need values that are not yet available in the constructor (e.g., input() values from the parent, which are available in ngOnInit).',
    },
    {
      q: 'What is the difference between effect() and afterRenderEffect()?',
      a: 'effect() runs in response to signal changes, scheduled in Angular\'s reactive graph. afterRenderEffect() runs after every Angular render cycle completes (after the DOM is updated). Use afterRenderEffect() for DOM measurements (getBoundingClientRect, scroll positions, focus management) that must read the actual DOM after Angular has rendered it. Use effect() for non-DOM side effects.',
    },
    {
      q: 'How do I create an effect that automatically stops after running once?',
      a: 'Inside the effect callback, call the cleanup ref\'s destroy() method: const ref = effect(() => { doWork(); ref.destroy(); }). The effect runs once synchronously on creation (tracking any signals read), executes the side effect, then immediately destroys itself. This is useful for one-time initialisation that needs signal values but should not re-run — though in most cases ngOnInit or a constructor-time call is cleaner.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: '<code>effect()</code> runs a side-effect function whenever its tracked signals change — it is the reactive counterpart to <code>computed()</code>, designed for actions (DOM, localStorage, APIs) not for deriving values.',
    mustKnow: [
      '<code>effect(fn)</code> runs synchronously <em>once</em> on creation, then asynchronously after each tracked signal change',
      'Only <strong>synchronous</strong> signal reads inside the effect body are tracked — async reads are not',
      '<code>untracked(() => signal())</code> — read without creating a dependency',
      '<code>onCleanup(fn)</code> — runs before next re-run AND on destroy. Essential for subscriptions, timers, sockets',
      '<code>allowSignalWrites: true</code> — opt-in to writing signals inside effects; never read and write the same signal',
      '<strong>Use computed() for derived state, effect() for side effects</strong> — they are not interchangeable',
    ],
    interviewFocus: [
      '<strong>effect() vs computed()?</strong> — computed = derived value (lazy, memoised); effect = reactive side effect (eager, async)',
      '<strong>What is tracked?</strong> — only synchronous signal reads during the effect body; async reads are not tracked',
      '<strong>onCleanup purpose?</strong> — prevent resource leaks (sockets, subscriptions, timers) by cleaning up before each re-run',
      '<strong>allowSignalWrites risk?</strong> — reading and writing the same signal creates an infinite loop',
    ],
  };
}
