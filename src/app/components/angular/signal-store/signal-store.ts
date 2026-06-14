import { Component, inject } from '@angular/core';
import { CartStore } from './cart.store';
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
  selector: 'app-signal-store',
  standalone: true,
  templateUrl: './signal-store.html',
  styleUrl: './signal-store.scss',
  providers: [CartStore],
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    BeforeAfterComponent, CommonMistakesComponent,
    PageMetaComponent, PageCompleteComponent,
    RevisionCardComponent, PrerequisitesComponent,
  ],
})
export class SignalStoreDemo {
  readonly store = inject(CartStore);

  prerequisites: Prerequisite[] = [
    { label: 'Signal Effects', route: '/angular/signal-effects' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'signal()',          type: 'function',  desc: 'Creates a writable reactive state container — call it with () to read, .set() to replace, and .update() to derive the next value.', since: '16' },
    { name: 'computed()',        type: 'function',  desc: 'Creates a read-only derived signal whose value is recalculated lazily whenever its signal dependencies change.', since: '16' },
    { name: '.asReadonly()',     type: 'method',    desc: 'Returns a read-only view of a writable signal so consumers can read state without being able to mutate it.', since: '16' },
    { name: '.update()',         type: 'method',    desc: 'Derives the next signal value from the current one via a pure function, replacing the previous value atomically.', since: '16' },
    { name: '.set()',            type: 'method',    desc: 'Directly replaces the current signal value with a new one, notifying all reactive consumers.', since: '16' },
    { name: '@Injectable()',     type: 'decorator', desc: 'Marks a class as an Angular service; omit providedIn to scope the store to a specific component tree via providers:[].', since: '2' },
    { name: 'inject()',          type: 'function',  desc: "Retrieves a dependency from the current injector context — the modern alternative to constructor injection.", since: '14' },
    { name: 'effect()',          type: 'function',  desc: 'Runs a side-effect callback whenever its signal dependencies change; useful for persistence or logging inside a store.', since: '16' },
    { name: 'toSignal()',        type: 'function',  desc: 'Bridges an Observable into a signal so RxJS-based data sources (e.g., HttpClient) can be consumed inside a signal store.', since: '16' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is a signal store and why use it?',
      points: [
        'A signal store is a plain <code>@Injectable</code> class that holds state as private signals and exposes derived state via <code>computed()</code> and mutations as methods. No NgRx, no reducers, no actions — just signals and plain methods.',
        'It solves the same problems as BehaviorSubject-based services but with less boilerplate: no <code>async</code> pipe in templates, no <code>pipe(map(...))</code> chains, and no subscription management.',
        '<code>providedIn: \'root\'</code> makes the store a singleton for global state (auth, cart, user preferences). For component-subtree-scoped state, declare the store in the component\'s <code>providers: []</code> array.',
        'The mental model: the store is the single source of truth for a slice of state. Components read from it (via signals) and write to it (via methods). The signal graph propagates changes automatically — no explicit notifications needed.',
        'Signal stores compose naturally: one store can inject and read from another. This replaces the NgRx selectors + facade pattern for most mid-size apps, with a fraction of the file count.',
      ],
    },
    {
      heading: 'State shape and encapsulation',
      points: [
        'Declare all mutable state as <strong>private signals</strong>. Expose them publicly via <code>asReadonly()</code> or <code>computed()</code> so consumers cannot bypass store methods to mutate state directly.',
        'Derived values (totals, counts, filtered lists) belong in <code>computed()</code> inside the store — they are always consistent with the source signals and are never stale.',
        'All mutations should be explicit methods on the store class: <code>add(item)</code>, <code>remove(id)</code>, <code>clear()</code>. This centralises state change logic, making it easy to trace, log, and test.',
        'Avoid returning complex mutable objects from computed() — keep derived values simple (number, string, plain array). If consumers need to filter or sort, let them do it on the read-only signal or add a dedicated computed().',
        'For entity collections, consider the pattern: private <code>items = signal&lt;Item[]&gt;([])</code>; expose <code>itemCount = computed(() =&gt; items().length)</code>; expose <code>itemMap = computed(() =&gt; Object.fromEntries(items().map(i =&gt; [i.id, i])))</code> for O(1) lookup.',
      ],
    },
    {
      heading: 'Async operations in the store',
      points: [
        'Use <code>async</code> methods on the store to load data: <code>async load() { this.loading.set(true); try { this.data.set(await this.http.get(...).toPromise()); } finally { this.loading.set(false); } }</code>. No actions or effects needed.',
        'Track loading and error state with dedicated signals: <code>loading = signal(false)</code> and <code>error = signal&lt;string | null&gt;(null)</code>. Components subscribe to these signals like any other state.',
        'The <code>finally</code> block is essential: it guarantees <code>loading</code> resets to <code>false</code> whether the async operation succeeds or throws. Forgetting <code>finally</code> leaves the UI stuck in a loading state.',
        'For Angular\'s HttpClient, inject it into the store and use <code>toPromise()</code> or <code>firstValueFrom()</code> to bridge from Observable: <code>this.data.set(await firstValueFrom(this.http.get(...)))</code>.',
        'For complex async flows (polling, retry, cancellation), use <code>rxMethod()</code> from <code>@ngrx/signals</code> — it integrates RxJS pipelines into a signal store without converting the whole codebase to NgRx.',
      ],
    },
    {
      heading: 'Signal store vs NgRx — choosing the right tool',
      points: [
        'Use a <strong>plain signal store</strong> for: small-to-medium apps, team-local feature state, straightforward CRUD operations, component-scoped state, and any scenario where you want less boilerplate.',
        'Use <strong>@ngrx/signals (<code>signalStore()</code>)</strong> for: structured entity collections (<code>withEntities()</code>), reusable store features (<code>withMethods()</code>), and apps that already use the NgRx ecosystem.',
        'Use <strong>@ngrx/store (classic)</strong> when: you need NgRx DevTools time-travel debugging, action replay, or large teams that benefit from the strict unidirectional data flow convention.',
        'Signal stores do not have built-in DevTools support. If debugging complex state transitions matters more than minimal boilerplate, @ngrx/signals or @ngrx/store provide that tooling.',
        'The good news: signal stores and NgRx can coexist. A team can use a plain signal store for local UI state and @ngrx/store for globally shared, debug-critical state in the same application.',
      ],
    },
    {
      heading: 'Testing and composition',
      points: [
        'Signal stores are just plain classes. To test one, instantiate it directly with <code>TestBed.inject(MyStore)</code> after configuring the TestBed, or create it with <code>new MyStore()</code> if it has no DI dependencies.',
        'Because state lives in signals, you can read state synchronously in tests: <code>expect(store.total()).toBe(30)</code> — no async, no subscriptions, no <code>detectChanges()</code> needed.',
        'To test async store methods, use <code>fakeAsync/tick</code> or <code>async/await</code>: <code>await store.load(); expect(store.data().length).toBeGreaterThan(0)</code>.',
        'Stores compose by injection: <code>constructor(private auth: AuthStore) {}</code>. A <code>CartStore</code> can read <code>auth.userId()</code> to associate cart items with the current user — no prop drilling or event buses needed.',
        'When composing stores, be careful about circular dependencies (A injects B, B injects A). Break cycles by extracting shared state to a third store C that both A and B can read from.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Store class',
      language: 'typescript',
      code: `// src/app/store/cart.store.ts
import { Injectable, signal, computed } from '@angular/core';

@Injectable()   // No providedIn:'root' — scoped to the component tree
export class CartStore {
  // Private writable signal — only the store mutates state
  private items = signal<CartItem[]>([]);

  // Public derived signals — components read these, never 'items' directly
  readonly cartItems = this.items.asReadonly();
  readonly itemCount = computed(() =>
    this.items().reduce((sum, i) => sum + i.qty, 0)
  );
  readonly total = computed(() =>
    this.items().reduce((sum, i) => sum + i.product.price * i.qty, 0)
  );
  readonly isEmpty = computed(() => this.items().length === 0);

  // All mutations go through methods — easy to trace & test
  add(product: Product) {
    this.items.update(cart => {
      const existing = cart.find(i => i.product.id === product.id);
      return existing
        ? cart.map(i => i.product.id === product.id
            ? { ...i, qty: i.qty + 1 } : i)
        : [...cart, { product, qty: 1 }];
    });
  }

  remove(id: number) { this.items.update(c => c.filter(i => i.product.id !== id)); }
  clear()            { this.items.set([]); }
}`,
    },
    {
      label: 'Using the store',
      language: 'typescript',
      code: `// Provide the store at component level — destroyed with the component
@Component({
  providers: [CartStore],  // <-- scoped lifetime, not singleton
  imports: [/* ... */],
})
export class CheckoutPage {
  readonly store = inject(CartStore);
}

// Template reads directly from signals — no async pipe needed:
// store.total()    → computed, always up-to-date
// store.isEmpty()  → computed, re-evaluates when items change
// store.add(p)     → mutation method
// store.cartItems() → read-only signal, returns CartItem[]

// When to use providedIn:'root' vs component providers:
// 'root' → singleton for entire app lifetime (auth, user prefs)
// providers:[] → scoped, destroyed with the component (cart, wizard)`,
    },
    {
      label: 'Async store',
      language: 'typescript',
      code: `import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface Post { id: number; title: string; }

@Injectable({ providedIn: 'root' })
export class PostStore {
  private http = inject(HttpClient);

  // State signals
  private posts  = signal<Post[]>([]);
  readonly loading = signal(false);
  readonly error   = signal<string | null>(null);

  // Derived
  readonly all    = this.posts.asReadonly();
  readonly count  = computed(() => this.posts().length);

  async load() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await firstValueFrom(
        this.http.get<Post[]>('https://jsonplaceholder.typicode.com/posts')
      );
      this.posts.set(data.slice(0, 10));
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Load failed');
    } finally {
      this.loading.set(false);  // ALWAYS resets, even on error
    }
  }
}`,
    },
    {
      label: 'Store vs Service vs Component',
      language: 'typescript',
      code: `// ── COMPONENT SIGNAL (local/UI state) ─────────────────────────────
// Use when: state is only needed in this component, not shared
export class CounterComponent {
  count = signal(0);  // lives and dies with the component
}

// ── ROOT SERVICE WITH SIGNALS (global shared state) ─────────────────
// Use when: state is shared across routes and many components
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private user = signal<User | null>(null);
  readonly currentUser = this.user.asReadonly();
  login(user: User)  { this.user.set(user); }
  logout()           { this.user.set(null); }
}

// ── COMPONENT-SCOPED STORE (subtree shared state) ───────────────────
// Use when: state is shared within a feature area but NOT globally
@Injectable()  // no providedIn — must be explicitly declared in providers:[]
export class WizardStore { ... }

@Component({
  providers: [WizardStore],  // scope = this component + children
})
export class WizardPage { store = inject(WizardStore); }`,
    },
    {
      label: 'Composing stores',
      language: 'typescript',
      code: `// ── Store A: AuthStore (root singleton) ──────────────────────────
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private _userId = signal<number | null>(null);
  readonly userId = this._userId.asReadonly();
  login(id: number) { this._userId.set(id); }
}

// ── Store B: CartStore (component-scoped, reads from AuthStore) ────
@Injectable()
export class CartStore {
  private auth   = inject(AuthStore);       // inject another store
  private http   = inject(HttpClient);

  private items  = signal<CartItem[]>([]);
  readonly total = computed(() =>
    this.items().reduce((s, i) => s + i.price, 0)
  );

  // Associated cart with the current user
  async loadCartForUser() {
    const uid = this.auth.userId();
    if (!uid) return;
    const cart = await firstValueFrom(
      this.http.get<CartItem[]>(\`/api/cart/\${uid}\`)
    );
    this.items.set(cart);
  }
}

// auth.userId() → CartStore reads it reactively via the injected store
// No prop drilling, no event bus — just inject and read`,
    },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Global state: BehaviorSubject service vs signal store',
      before: `@Injectable({ providedIn: 'root' })
export class CartService {
  private items$ = new BehaviorSubject<CartItem[]>([]);
  readonly items = this.items$.asObservable();
  add(item: CartItem) {
    this.items$.next([...this.items$.value, item]);
  }
}
// Template: {{ cartService.items | async }}`,
      after: `@Injectable({ providedIn: 'root' })
export class CartStore {
  private items = signal<CartItem[]>([]);
  readonly cartItems = this.items.asReadonly();
  readonly total = computed(() =>
    this.items().reduce((s, i) => s + i.product.price * i.qty, 0));
  add(item: CartItem) { this.items.update(c => [...c, item]); }
}
// Template: {{ cartStore.total() }}  — no async pipe needed`,
      note: 'No async pipe needed in templates; computed() replaces manual pipe chains.',
    },
    {
      title: 'Reading derived state: pipe(map()) vs computed()',
      before: `// Observable chain for derived state
readonly total$ = this.items$.pipe(
  map(items => items.reduce((s, i) => s + i.price, 0))
);
// Template: {{ total$ | async }}`,
      after: `// computed signal — synchronous, lazy, no async pipe
readonly total = computed(() =>
  this.items().reduce((s, i) => s + i.price, 0)
);
// Template: {{ store.total() }}`,
      note: 'computed() is lazy, synchronous, and requires no async pipe.',
    },
    {
      title: 'Scoped store: NgModule providers vs component providers',
      before: `// Old — module-scoped singleton (NgModule)
@NgModule({ providers: [CartService] })
export class CartModule {}`,
      after: `// New — component-scoped store (standalone)
@Component({
  providers: [CartStore],   // destroyed with this component
})
export class CheckoutPage {
  readonly store = inject(CartStore);
}`,
      note: 'Component-level providers scope the store lifetime to the component subtree.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Exposing writable signals publicly',
      wrong: `@Injectable()
export class CartStore {
  items = signal<CartItem[]>([]);  // public writable — anyone can .set()!
}`,
      right: `@Injectable()
export class CartStore {
  private items = signal<CartItem[]>([]);
  readonly cartItems = this.items.asReadonly();
  // Mutations only via: add(), remove(), clear()
}`,
      explanation: 'Exposing a writable signal lets any consumer call .set() or .update() directly, bypassing store logic and breaking encapsulation. Keep signals private and expose state only via asReadonly() or computed().',
    },
    {
      title: 'Forgetting to scope the store with providers:[]',
      wrong: `// Without providers:[] on the component,
// Angular resolves CartStore from a parent injector
// or throws NullInjectorError if no parent provides it
@Component({ imports: [FormsModule] })
export class CartPage {
  store = inject(CartStore);  // may resolve wrong instance!
}`,
      right: `@Component({
  providers: [CartStore],  // creates a new instance scoped to this component
  imports: [FormsModule],
})
export class CartPage {
  store = inject(CartStore);
}`,
      explanation: 'Without providers:[CartStore] on the component, Angular resolves CartStore from a parent injector. This may return an unexpected shared instance or throw NullInjectorError. Always declare providers:[] to explicitly own the store lifetime.',
    },
    {
      title: 'Reading signals without calling them (missing parentheses)',
      wrong: `// In template — renders "[object Object]" instead of the number
<p>Total: {{ store.total }}</p>

// In code — val is the Signal function, not the value
const val = store.total;`,
      right: `// In template — reads the current value
<p>Total: {{ store.total() }}</p>

// In code — val is the number
const val = store.total();`,
      explanation: 'A signal is a getter function. You must call it with () to read the current value. Omitting the parentheses returns the Signal object itself, not its value — resulting in "[object Object]" in templates.',
    },
    {
      title: 'Mutating signal state inside computed()',
      wrong: `readonly doubled = computed(() => {
  this.count.set(this.count() * 2);  // side effect in computed!
  return this.count();
});`,
      right: `readonly doubled = computed(() => this.count() * 2);

// Mutations belong in methods, not computed()
double() { this.count.update(v => v * 2); }`,
      explanation: 'computed() must be a pure derivation with no side effects. Calling .set() or .update() inside computed() causes infinite loops and runtime errors. Put all mutations in explicit methods.',
    },
    {
      title: 'Not resetting loading signal in the finally block',
      wrong: `async load() {
  this.loading.set(true);
  const data = await fetch('/api/data').then(r => r.json());
  this.items.set(data);
  this.loading.set(false);  // NOT called if fetch throws!
}`,
      right: `async load() {
  this.loading.set(true);
  try {
    const data = await fetch('/api/data').then(r => r.json());
    this.items.set(data);
  } catch (e: unknown) {
    this.error.set(e instanceof Error ? e.message : 'Failed');
  } finally {
    this.loading.set(false);  // always runs — even on error
  }
}`,
      explanation: "If the async operation throws and there is no finally block, loading stays true forever and the UI is stuck in a loading state. Always reset loading in finally. Also always catch errors and set an error signal so the UI can display a meaningful message.",
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: "In the CartStore pattern, why is the `items` signal declared as `private`?",
      options: [
        'Private signals cannot be read by computed() inside the class',
        'To prevent components from mutating state directly — all mutations go through store methods',
        'Angular requires signals to be private for change detection to work',
        'Private signals are faster than public ones at runtime',
      ],
      answer: 1,
      explanation: "Keeping `items` private ensures only the store's own methods can call .set() or .update(). Components access state through the public readonly signals (cartItems, total, etc.) and trigger changes only via methods like add(), remove(), and clear().",
    },
    {
      q: "What is the difference between providing CartStore in `providers: [CartStore]` on a component versus `@Injectable({ providedIn: 'root' })`?",
      options: [
        "There is no practical difference — both create a singleton",
        "Component-level providers cannot use inject(); root providers can",
        "Component-level providers scope the store instance to that component's subtree and destroy it with the component",
        "Root providers require NgModule; component-level providers work only in standalone components",
      ],
      answer: 2,
      explanation: "Listing CartStore in a component's providers:[] creates an instance scoped to that component tree — it is destroyed when the component is destroyed. A providedIn:'root' store is a global singleton that lives for the entire app lifetime.",
    },
    {
      q: "In the template, `store.itemCount()` is called with parentheses, but `store.catalogue` is accessed without them. What does this tell you?",
      options: [
        'itemCount is a regular method; catalogue is an input property',
        'itemCount is a computed signal (must be called to read); catalogue is a plain array property (not a signal)',
        'itemCount uses async pipe internally; catalogue is synchronous',
        'catalogue is a setter; itemCount is a getter',
      ],
      answer: 1,
      explanation: 'computed() returns a signal, which is a function — you call it with () to read the current value. A plain class property like catalogue is just a JavaScript array and is accessed without parentheses.',
    },
    {
      q: 'Which of the following correctly describes how to track loading state for an async operation inside a signal store?',
      options: [
        'Use a BehaviorSubject and pipe it through async pipe in the template',
        'Declare `loading = signal(false)`, set it to `true` before the fetch and back to `false` in a `finally` block',
        'Dispatch a LoadingStarted action and handle it in a NgRx reducer',
        'Use ChangeDetectorRef.markForCheck() after the fetch completes',
      ],
      answer: 1,
      explanation: 'The signal store pattern tracks loading with a dedicated signal: loading = signal(false). Set it to true before the async call and reset it to false inside a finally block so it resets even on error. No observables or actions needed.',
    },
    {
      q: "When multiple components inject the same `providedIn: 'root'` signal store and one component calls a store mutation method, what happens to the other components?",
      options: [
        "Nothing — each component gets its own copy of the store signals",
        "The other components need to call detectChanges() manually to update",
        "All components reading that signal are automatically updated because they share the same signal instance",
        "Only the component that called the method updates; others update on the next navigation event",
      ],
      answer: 2,
      explanation: 'All components injecting a root-provided store receive the same service instance and therefore the same signal objects. Signals propagate changes reactively — any component reading a mutated signal re-renders automatically without manual intervention.',
    },
    {
      q: "What is the purpose of calling `.asReadonly()` on a private signal before exposing it publicly from a store?",
      options: [
        'It makes the signal lazy — it only computes when actually read',
        'It returns a read-only Signal that consumers can read but cannot call .set() or .update() on',
        'It creates a snapshot of the signal value that does not update',
        'It converts the signal into an Observable for template compatibility',
      ],
      answer: 1,
      explanation: ".asReadonly() returns a Signal<T> (not a WritableSignal<T>). The type does not expose .set() or .update(), so TypeScript prevents external callers from bypassing store methods to mutate state. The underlying signal is still the same — only the type-level interface is narrowed.",
    },
    {
      q: 'Why is computed() preferred over a getter method that reads signals for deriving values in a store?',
      options: [
        'computed() is decorated with @memoize automatically; getter methods are not',
        'computed() is lazy and cached — it recalculates only when dependencies change. A getter method recalculates on every call.',
        'computed() works in templates; getter methods do not',
        'computed() can read from multiple stores; getter methods are restricted to the current class',
      ],
      answer: 1,
      explanation: 'computed() memoizes its result and only re-runs when one of its reactive signal dependencies changes. A plain getter method is re-evaluated on every access — which can be many times per change-detection cycle in a busy UI. Use computed() for any value derived from signals in a store.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is a signal store pattern?',
      a: "A signal store is an injectable service that holds state as private <code>signal()</code>s and exposes derived state via <code>computed()</code> and mutations as methods. No NgRx needed for most apps — you get reactive state management with far less boilerplate.",
    },
    {
      q: 'How do you expose read-only state from a signal store?',
      a: "Use <code>signal.asReadonly()</code> to expose a public read-only view, or expose derived state through <code>computed()</code>. Never expose the writable signal directly — TypeScript enforces this: <code>asReadonly()</code> returns <code>Signal&lt;T&gt;</code> which has no <code>.set()</code> or <code>.update()</code> methods.",
    },
    {
      q: 'How is a signal store different from @ngrx/signals?',
      a: "A plain signal store is a hand-crafted service with no framework overhead — ideal for smaller features. <code>@ngrx/signals</code> adds structure (<code>signalStore()</code>), entity management (<code>withEntities()</code>), reusable store features (<code>withMethods()</code>), and RxJS integration (<code>rxMethod()</code>). Use <code>@ngrx/signals</code> for larger apps with entity collections or when you want a structured convention across teams.",
    },
    {
      q: 'How do multiple components share the same store state?',
      a: "All components that inject a <code>providedIn: 'root'</code> service receive the same instance — and therefore the same signals. Any component that calls a store method triggers automatic updates in all other components reading that signal. No manual event broadcasting or change detection calls are needed.",
    },
    {
      q: 'How do you handle async operations in a signal store?',
      a: "Use async methods: <code>async load() { this.loading.set(true); try { this.data.set(await firstValueFrom(this.http.get(...))); } catch (e) { this.error.set('Failed'); } finally { this.loading.set(false); } }</code>. The <code>finally</code> block is critical — it ensures <code>loading</code> resets even if the request throws.",
    },
    {
      q: 'When should you lift state to a store vs keeping it local?',
      a: "Keep state <strong>local</strong> (component signal) if only one component uses it. Lift to a <strong>service store</strong> when multiple components share or react to the same state. Lift to <strong>@ngrx/signals</strong> when you need DevTools, entity normalisation, or cross-team conventions. The rule of thumb: local first, lift only when sharing is needed.",
    },
    {
      q: 'How do you test a signal store?',
      a: "Signal stores are plain classes — test them directly. In a <code>TestBed</code> test: <code>TestBed.configureTestingModule({ providers: [MyStore] }); const store = TestBed.inject(MyStore);</code>. Then call methods and assert synchronously on signal values: <code>store.add(item); expect(store.count()).toBe(1);</code>. No subscriptions, no async pipe — signals are synchronously readable, which makes unit tests fast and simple.",
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'A signal store is an @Injectable class with private signals, public computed() exposures, and mutation methods — it replaces BehaviorSubject services with synchronous, template-friendly reactive state management without NgRx.',
    mustKnow: [
      'Private signals + public <code>asReadonly()</code> or <code>computed()</code> exposures = encapsulation. Never expose writable signals directly.',
      'All mutations go through methods (<code>add()</code>, <code>remove()</code>, <code>clear()</code>) — never let components call <code>.set()</code> directly on store state',
      '<code>providedIn: \'root\'</code> = global singleton; <code>providers: [MyStore]</code> on a component = scoped instance, destroyed with the component',
      'Async stores: always use <code>try/catch/finally</code> — the <code>finally</code> block resets <code>loading</code> even when the request throws',
      'Stores compose: inject one store into another with <code>inject(OtherStore)</code> — replaces NgRx selectors + facade pattern for most use cases',
      '<code>computed()</code> is lazy and cached — preferred over getter methods for any value derived from signals (recalculates only when dependencies change)',
      'Signal stores are easily unit-testable: read signal values synchronously with <code>store.count()</code>, no async pipe or subscription needed',
    ],
    interviewFocus: [
      'What is the signal store pattern and how does it differ from a BehaviorSubject-based service?',
      'Why should signals in a store be private, and how do you expose state safely?',
      'How do you scope a signal store to a component subtree vs. the entire app?',
      'How do you handle loading and error state in an async signal store method?',
      'When would you choose @ngrx/signals or @ngrx/store over a plain signal store?',
    ],
  };

  challenge: Challenge = {
    title: 'Build a WishList Signal Store',
    language: 'typescript',
    description: 'Create a `WishListStore` — an `@Injectable()` class that manages a wish list of products using Angular signals. The store must hold private state as a signal, expose read-only derived signals, and provide mutation methods. Then wire it up in a minimal component.',
    hints: [
      'Declare `private items = signal<string[]>([])` as the single source of truth and never expose it directly.',
      'Use `computed(() => this.items().length)` for the item count and `computed(() => this.items().length === 0)` for isEmpty.',
      'The `add(name: string)` method should guard against duplicates using `items().includes(name)` before updating.',
      'Provide the store at component level with `providers: [WishListStore]` so it is scoped to the component lifetime.',
    ],
    starterCode: `import { Component, inject, signal, computed, Injectable } from '@angular/core';
import { FormsModule } from '@angular/forms';

// TODO 1: Create WishListStore
// - private items signal (string[])
// - readonly wishItems (asReadonly)
// - readonly itemCount (computed)
// - readonly isEmpty (computed)
// - add(name: string) method — no duplicates
// - remove(name: string) method
// - clear() method
@Injectable()
export class WishListStore {
  // your code here
}

@Component({
  selector: 'app-wish-list',
  providers: [WishListStore],
  imports: [FormsModule],
  template: \`
    <h2>Wish List ({{ store.itemCount() }} items)</h2>
    <!-- TODO 2: show 'List is empty' when store.isEmpty() is true -->
    <!-- TODO 3: render each wish item with a Remove button -->
    <div>
      <input [(ngModel)]="newItem" placeholder="Add a wish..." />
      <button (click)="addItem()" [disabled]="!newItem.trim()">Add</button>
    </div>
    <button (click)="store.clear()">Clear All</button>
  \`,
})
export class WishListComponent {
  readonly store = inject(WishListStore);
  newItem = '';
  addItem() {
    // TODO 4: call store.add() then reset newItem
  }
}`,
    solution: `import { Component, inject, signal, computed, Injectable } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Injectable()
export class WishListStore {
  private items = signal<string[]>([]);

  readonly wishItems = this.items.asReadonly();
  readonly itemCount = computed(() => this.items().length);
  readonly isEmpty   = computed(() => this.items().length === 0);

  add(name: string) {
    const trimmed = name.trim();
    if (!trimmed || this.items().includes(trimmed)) return;
    this.items.update(list => [...list, trimmed]);
  }

  remove(name: string) {
    this.items.update(list => list.filter(i => i !== name));
  }

  clear() { this.items.set([]); }
}

@Component({
  selector: 'app-wish-list',
  providers: [WishListStore],
  imports: [FormsModule],
  template: \`
    <h2>Wish List ({{ store.itemCount() }} items)</h2>
    @if (store.isEmpty()) {
      <p>List is empty — add some wishes!</p>
    } @else {
      <ul>
        @for (item of store.wishItems(); track item) {
          <li>{{ item }} <button (click)="store.remove(item)">✕</button></li>
        }
      </ul>
    }
    <div>
      <input [(ngModel)]="newItem" placeholder="Add a wish..." />
      <button (click)="addItem()" [disabled]="!newItem.trim()">Add</button>
    </div>
    <button (click)="store.clear()">Clear All</button>
  \`,
})
export class WishListComponent {
  readonly store = inject(WishListStore);
  newItem = '';

  addItem() {
    this.store.add(this.newItem);
    this.newItem = '';
  }
}`,
  };
}
