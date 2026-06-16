import { Component, signal, computed, effect } from '@angular/core';
import { JsonPipe } from '@angular/common';
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

interface CartProduct { id: number; name: string; price: number; }
interface CartItem    { id: number; name: string; price: number; qty: number; }
interface AuthUser    { name: string; role: 'admin' | 'viewer'; }

@Component({
  selector: 'app-counter',
  imports: [
    JsonPipe, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent,
    ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent,
    PageMetaComponent, PageCompleteComponent, RevisionCardComponent,
  ],
  templateUrl: './counter.html',
  styleUrl: './counter.scss',
})
export class Counter {
  count = signal(0);
  step  = signal(1);

  doubled    = computed(() => this.count() * 2);
  isNegative = computed(() => this.count() < 0);
  isZero     = computed(() => this.count() === 0);

  history = signal<string[]>([]);

  constructor() {
    effect(() => {
      const val = this.count();
      this.history.update(h => [`Count changed to ${val}`, ...h].slice(0, 6));
    });
  }

  increment() { this.count.update(n => n + this.step()); }
  decrement() { this.count.update(n => n - this.step()); }
  reset()     { this.count.set(0); }

  setStep(event: Event) {
    const val = Number((event.target as HTMLInputElement).value);
    this.step.set(val || 1);
  }

  cartProducts = signal<CartProduct[]>([
    { id: 1, name: 'Angular Course',    price: 29.99 },
    { id: 2, name: 'TypeScript Book',   price: 14.99 },
    { id: 3, name: 'RxJS Deep Dive',    price: 19.99 },
    { id: 4, name: 'NgRx Workshop',     price: 24.99 },
  ]);

  cartItems   = signal<CartItem[]>([]);
  cartTotal   = computed(() => this.cartItems().reduce((s, i) => s + i.price * i.qty, 0));
  cartCount   = computed(() => this.cartItems().reduce((s, i) => s + i.qty, 0));
  cartIsEmpty = computed(() => this.cartItems().length === 0);

  cartAdd(p: CartProduct) {
    this.cartItems.update(list => {
      const existing = list.find(i => i.id === p.id);
      if (existing) return list.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...list, { ...p, qty: 1 }];
    });
  }

  cartRemove(id: number) { this.cartItems.update(list => list.filter(i => i.id !== id)); }
  cartClear()             { this.cartItems.set([]); }

  private _authUser  = signal<AuthUser | null>(null);
  authUser           = this._authUser.asReadonly();
  authIsLoggedIn     = computed(() => this._authUser() !== null);
  authIsAdmin        = computed(() => this._authUser()?.role === 'admin');

  authLogin(role: 'admin' | 'viewer') {
    this._authUser.set({ name: role === 'admin' ? 'Karthik (Admin)' : 'Guest (Viewer)', role });
  }
  authLogout() { this._authUser.set(null); }

  theory: TheoryPoint[] = [
    {
      heading: 'signal() — the synchronous reactive primitive',
      points: [
        '<code>signal(initialValue)</code> creates a <strong>writable reactive value</strong>. Read it by calling it like a function: <code>count()</code>. The <code>()</code> is essential — omitting it gives you the signal object itself, not its value, and disables reactive tracking.',
        '<code>signal.set(val)</code> replaces the current value. <code>signal.update(fn)</code> derives the next value from the current one: <code>count.update(n => n + step())</code>. Use <code>update()</code> whenever the new value depends on the old one to avoid race conditions.',
        'Signals are <strong>synchronous</strong> — the new value is available immediately after <code>set()</code> or <code>update()</code>. There is no async scheduling, no subscription, and no async pipe needed in templates.',
        'Angular tracks which template expressions read which signals at the time they last rendered. When a signal\'s value changes, Angular surgically re-renders only the expressions that depend on it — not the entire component.',
        'Signal <strong>equality checking</strong>: by default, Angular compares primitive values with <code>===</code> and object/array references by identity. Signal changes are only propagated when the new value is not equal to the previous one. Pass a custom <code>equal</code> function to <code>signal()</code> for deep equality on objects.',
      ],
    },
    {
      heading: 'computed() — memoised derived state',
      points: [
        '<code>computed(() => expr)</code> creates a <strong>read-only, memoised derived signal</strong>. It reads other signals inside the callback and returns a computed value. The result is cached and only recalculated when a signal it depends on changes.',
        'computed() is <strong>lazy</strong> — it does not run until the first time it is read. After that, it caches the result. A computed signal that is never read never executes its callback at all.',
        'computed() is <strong>read-only</strong> — you cannot call <code>.set()</code> on it. This enforces unidirectional data flow: derived state flows down from writable signals; it cannot be independently mutated.',
        'Computed signals track their dependencies <strong>dynamically</strong> — if a branch in the computation is not reached (e.g. <code>if (flag()) return a(); else return b()</code>), only the branch that ran is tracked. Changing an unread signal does not trigger recalculation.',
        'Nest computed() freely — Angular tracks the full dependency graph automatically: <code>const tax = computed(() => cart.total() * 0.2)</code>, <code>const grandTotal = computed(() => cart.total() + tax())</code>. Angular propagates changes through the chain without you managing subscriptions.',
      ],
    },
    {
      heading: 'effect() — reactive side effects',
      points: [
        '<code>effect(() => { ... })</code> re-runs whenever any signal it reads inside the callback changes — similar to a computed() but for side effects (logging, localStorage writes, DOM manipulations, analytics).',
        'Must be created inside an <strong>injection context</strong> — constructor, field initialiser in a class with DI, or via <code>runInInjectionContext(injector, () => effect(...))</code>. Angular ties the effect\'s lifetime to the host component/service and automatically cleans it up on destroy.',
        '<strong>Default rule: do not write to signals inside effect()</strong>. If the effect reads signal A and then writes signal A, it creates an infinite loop. Mutations to <em>unrelated</em> signals inside effect() are safe. Pass <code>{ allowSignalWrites: true }</code> only when you are certain no cycle exists.',
        'The effect callback returns a <strong>cleanup function</strong> optionally: <code>effect(() => { const sub = ...; return () => sub.unsubscribe(); })</code>. The cleanup runs before the next execution and on destroy — use it for timers, subscriptions, and event listeners.',
        'In Angular 17+, <code>effect()</code> runs in the <strong>microtask queue</strong> after change detection — not synchronously when the signal changes. This means you should never rely on effect() for immediate synchronous reactions; use computed() instead for derived values.',
      ],
    },
    {
      heading: '@if and @for — built-in block control flow',
      points: [
        '<code>@if (condition) { ... } @else if (...) { ... } @else { ... }</code> replaces <code>*ngIf</code> and <code>ng-template</code> with <code>#guestTpl</code> references. No import needed — it is built into the Angular template compiler in Angular 17+.',
        '<code>@for (item of list; track item.id) { ... }</code> replaces <code>*ngFor</code>. The <code>track</code> expression is <strong>mandatory</strong> — the compiler enforces it. It gives Angular a stable identity for each item so it can diff the list and update only changed DOM nodes instead of recreating all of them.',
        '<code>@for</code> supports an <code>@empty { ... }</code> block that renders when the list is empty — no separate <code>*ngIf</code> guard needed. Local variables available inside <code>@for</code>: <code>$index</code>, <code>$first</code>, <code>$last</code>, <code>$even</code>, <code>$odd</code>, <code>$count</code>.',
        '<code>@switch (expr) { @case (val) { } @default { } }</code> replaces <code>ngSwitch</code> and is cleaner than a long chain of <code>@if/@else if</code> when switching on an enum or union type.',
        '<code>@defer (on viewport) { ... } @placeholder { ... } @loading { ... } @error { ... }</code> enables declarative lazy loading of parts of the template — the deferred block only renders (and loads its dependencies) when the trigger condition is met.',
      ],
    },
    {
      heading: 'asReadonly(), service patterns, and linkedSignal()',
      points: [
        '<code>signal.asReadonly()</code> returns a <code>Signal&lt;T&gt;</code> (not a <code>WritableSignal&lt;T&gt;</code>) — a read-only view of the same underlying signal. Expose it from a service so consumers can read state but cannot call <code>.set()</code> — all mutations must go through the service\'s methods. TypeScript enforces this at compile time.',
        'The canonical service pattern: <code>private _user = signal&lt;User | null&gt;(null); readonly user = this._user.asReadonly();</code>. The service exposes <code>user</code> (read-only) and <code>login()/logout()</code> (mutation methods). Components cannot accidentally write <code>service.user.set(null)</code>.',
        '<code>linkedSignal()</code> (Angular 19+) creates a <strong>writable signal whose default is computed from other signals</strong>. Unlike <code>computed()</code>, it can be overridden: the signal resets to the computed value when its dependencies change, but can be temporarily set to a different value by user input. Perfect for form fields with server-driven defaults.',
        'Effects in services are a common pattern for persistence: <code>effect(() => localStorage.setItem(\'cart\', JSON.stringify(this.cartItems())))</code>. This runs whenever <code>cartItems</code> changes, automatically persisting state without explicit calls in every mutation method.',
        'Signal-based services with <code>providedIn: \'root\'</code> are singleton — all components share the same signal state. For component-scoped state, provide the service in the component\'s <code>providers</code> array instead, giving each instance its own isolated signal store.',
      ],
    },
    {
      heading: 'Signals and RxJS interoperability',
      points: [
        '<code>toSignal(observable$)</code> from <code>@angular/core/rxjs-interop</code> converts an RxJS Observable into a Signal. The signal holds the most recently emitted value. It must be called inside an injection context and automatically unsubscribes when the context is destroyed.',
        '<code>toObservable(signal)</code> converts a Signal back into an RxJS Observable — emits a new value whenever the signal changes. Useful for piping signal state through RxJS operators: <code>toObservable(searchTerm).pipe(debounceTime(300), switchMap(q => this.api.search(q)))</code>.',
        'The recommended migration path: keep RxJS for complex async operations (HTTP, WebSocket, debounce/throttle), and use signals for UI state (loading flags, form values, selected items). Bridge at the boundary with <code>toSignal()</code> and <code>toObservable()</code>.',
        '<code>toSignal(obs$, { initialValue: [] })</code> — provide an initial value when the observable has not yet emitted. Without it, the signal type becomes <code>Signal&lt;T | undefined&gt;</code> and you have to guard against <code>undefined</code> in the template.',
        'When using <code>HttpClient</code> with signals: <code>data = toSignal(this.http.get&lt;User[]&gt;(\'/api/users\'), { initialValue: [] })</code> — the HTTP request fires on service creation. For lazy requests (fire on user action), combine with <code>rxResource()</code> (Angular 19+) or manually set a loading signal inside a method and call <code>subscribe()</code>.',
      ],
    },
  ];

  signalTabs: CodeTab[] = [
    {
      label: 'signal / computed / effect',
      language: 'typescript',
      code: `import { signal, computed, effect } from '@angular/core';

export class Counter {
  // signal() — writable reactive value; read by calling it as a function
  count = signal(0);
  step  = signal(1);

  // computed() — read-only, memoised; recalculates only when deps change
  doubled    = computed(() => this.count() * 2);
  isNegative = computed(() => this.count() < 0);

  constructor() {
    // effect() — side effect that re-runs whenever a signal it reads changes
    // Must be in injection context (constructor, field, or runInInjectionContext)
    effect(() => {
      const val = this.count();                     // tracking this.count()
      console.log('count changed to', val);         // runs on every change
      localStorage.setItem('count', String(val));   // persist automatically
    });
  }

  // .set() replaces the value; .update() derives from current
  increment() { this.count.update(n => n + this.step()); }
  reset()     { this.count.set(0); }
}`,
    },
    {
      label: '@if / @for / @defer',
      language: 'html',
      code: `<!-- @if with @else if / @else — no *ngIf, no import needed -->
@if (isNegative()) {
  <p class="negative">Count is negative</p>
} @else if (isZero()) {
  <p class="zero">Count is zero</p>
} @else {
  <p class="positive">Doubled: {{ doubled() }}</p>
}

<!-- @for — track is MANDATORY (compiler enforces it) -->
<!-- Local variables: $index, $first, $last, $even, $odd, $count -->
@for (entry of history(); track entry; let i = $index) {
  <li [class.first]="i === 0">{{ entry }}</li>
} @empty {
  <li>No history yet.</li>
}

<!-- @switch — cleaner than @if/@else if chains on enum values -->
@switch (status()) {
  @case ('loading') { <app-spinner /> }
  @case ('error')   { <p>Error occurred.</p> }
  @default          { <app-content [data]="data()" /> }
}

<!-- @defer — lazy-load heavy components only when visible -->
@defer (on viewport) {
  <app-heavy-chart [data]="reportData()" />
} @placeholder {
  <div class="skeleton" style="height:400px"></div>
} @loading (minimum 300ms) {
  <p>Loading chart...</p>
}`,
    },
    {
      label: 'Cart signals',
      language: 'typescript',
      code: `// Real-world cart: all derived state as computed() signals
interface CartItem { id: number; name: string; price: number; qty: number; }

@Injectable({ providedIn: 'root' })
export class CartService {
  items    = signal<CartItem[]>([]);

  // All computed from items — auto-update when items changes
  total    = computed(() => this.items().reduce((s, i) => s + i.price * i.qty, 0));
  count    = computed(() => this.items().reduce((s, i) => s + i.qty, 0));
  isEmpty  = computed(() => this.items().length === 0);

  add(product: Product) {
    this.items.update(list => {
      const existing = list.find(i => i.id === product.id);
      // Always return a NEW array — never mutate in-place
      if (existing) return list.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...list, { ...product, qty: 1 }];
    });
  }

  remove(id: number) { this.items.update(l => l.filter(i => i.id !== id)); }
  clear()            { this.items.set([]); }
}

// In template:
// Total: {{ cart.total() | currency }}
// @if (cart.isEmpty()) { <p>Cart is empty</p> }`,
    },
    {
      label: 'asReadonly() pattern',
      language: 'typescript',
      code: `// Pattern: private WritableSignal, public read-only view
@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user    = signal<User | null>(null);
  private _loading = signal(false);

  // Consumers can READ but NOT call .set() — enforced by TypeScript
  readonly user       = this._user.asReadonly();
  readonly loading    = this._loading.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly isAdmin    = computed(() => this._user()?.role === 'admin');

  async login(email: string, password: string) {
    this._loading.set(true);
    try {
      const user = await this.api.login(email, password);
      this._user.set(user);        // only this service can mutate _user
    } finally {
      this._loading.set(false);
    }
  }

  logout() { this._user.set(null); }
}

// In a component — auth.user.set(null) → TypeScript error at compile time!
// Must call auth.logout() instead.`,
    },
    {
      label: 'RxJS interop',
      language: 'typescript',
      code: `import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, switchMap } from 'rxjs/operators';

@Component({ ... })
export class SearchComponent {
  // toSignal() — Observable → Signal (auto-unsubscribes on destroy)
  // initialValue avoids Signal<T | undefined> type
  products$ = this.http.get<Product[]>('/api/products');
  products  = toSignal(this.products$, { initialValue: [] });

  // toObservable() — Signal → Observable (pipe through RxJS operators)
  searchTerm = signal('');
  results = toSignal(
    toObservable(this.searchTerm).pipe(
      debounceTime(300),
      switchMap(q => this.http.get<Product[]>(\`/api/search?q=\${q}\`)),
    ),
    { initialValue: [] }
  );

  // Template: {{ results() }} — no async pipe needed
  // Products load on service creation; search debounces automatically
}`,
    },
  ];

  cartCodeTabs: CodeTab[] = [
    {
      label: 'Cart signals',
      language: 'typescript',
      code: `interface CartItem { id: number; name: string; price: number; qty: number; }

cartItems   = signal<CartItem[]>([]);
cartTotal   = computed(() => this.cartItems().reduce((s,i) => s + i.price * i.qty, 0));
cartCount   = computed(() => this.cartItems().reduce((s,i) => s + i.qty, 0));
cartIsEmpty = computed(() => this.cartItems().length === 0);

add(p: Product) {
  this.cartItems.update(list => {
    const found = list.find(i => i.id === p.id);
    if (found) return list.map(i => i.id === p.id ? {...i, qty: i.qty+1} : i);
    return [...list, { ...p, qty: 1 }];
  });
}
remove(id: number) { this.cartItems.update(l => l.filter(i => i.id !== id)); }`,
    },
    {
      label: 'Cart template',
      language: 'html',
      code: `@if (cartIsEmpty()) {
  <p>Cart is empty</p>
} @else {
  @for (item of cartItems(); track item.id) {
    <div class="cart-row">
      {{ item.name }} x {{ item.qty }}
      = \${{ (item.price * item.qty).toFixed(2) }}
      <button (click)="remove(item.id)">Remove</button>
    </div>
  }
  <strong>Total: \${{ cartTotal().toFixed(2) }}</strong>
}`,
    },
  ];

  readonlyCodeTabs: CodeTab[] = [
    {
      label: 'asReadonly() pattern',
      language: 'typescript',
      code: `@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user    = signal<User | null>(null);

  // Expose read-only — callers can read but cannot call .set()
  readonly user       = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly isAdmin    = computed(() => this._user()?.role === 'admin');

  login(role: 'admin' | 'viewer') {
    this._user.set({ name: 'Karthik', role }); // only service mutates
  }
  logout() { this._user.set(null); }
}

// In any component:
// auth = inject(AuthService);
// auth.user()       → User | null   (read-only)
// auth.user.set(x)  → TypeScript ERROR at compile time!`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'How do you read the current value of an Angular Signal?',
      options: [
        'signal.value',
        'signal.get()',
        'signal()',
        'signal.read()',
      ],
      answer: 2,
      explanation: 'Signals are getter functions — call them as signal() to read the current value. Omitting () gives you the signal object itself, not its value, and also disables reactive tracking so the template will not update when the signal changes.',
    },
    {
      q: 'What is the key difference between computed() and a regular class property?',
      options: [
        'computed() properties are asynchronous; regular properties are synchronous',
        'computed() re-runs its callback automatically when its signal dependencies change; a plain property must be updated manually',
        'computed() requires an injection context; a plain property does not',
        'computed() is writable; a plain property is read-only',
      ],
      answer: 1,
      explanation: 'A computed() signal tracks which other signals it reads and automatically recalculates when any of them change. A plain class property (e.g. doubled = this.count * 2) captures the value once at construction time and never updates automatically.',
    },
    {
      q: 'What does signal.update(fn) do that signal.set(val) cannot?',
      options: [
        'update() schedules the change for the next change detection cycle; set() is immediate',
        'update() derives the new value from the current value using a callback; set() requires you to know the value independently',
        'update() allows writing inside an effect(); set() does not',
        'update() triggers a full re-render; set() only re-renders the changed expression',
      ],
      answer: 1,
      explanation: 'update(fn) calls fn with the current signal value and sets the result as the new value — e.g. count.update(n => n + 1). This is safer than count.set(count() + 1) in concurrent scenarios because update() atomically reads and writes the signal.',
    },
    {
      q: 'What happens when a signal read inside effect() changes?',
      options: [
        'Nothing — you must manually subscribe to the signal to receive changes',
        'The effect re-runs automatically on the next microtask tick',
        'Angular triggers full component change detection',
        'The computed() that wraps the effect re-evaluates',
      ],
      answer: 1,
      explanation: 'effect() tracks every signal read during its last run. When any of those signals change, Angular schedules the effect to re-run in the microtask queue after the current change detection cycle. It does not trigger full CD — only the effect callback re-runs.',
    },
    {
      q: 'Why is the track expression in @for mandatory in Angular 17+?',
      options: [
        'To enable lazy loading of list items',
        'To tell Angular which property to use as the unique key for efficient DOM diffing and updates',
        'To sort the list before rendering',
        'To allow @empty to detect when the list becomes empty',
      ],
      answer: 1,
      explanation: 'track provides Angular with a stable identity per item. Angular uses it to diff old and new lists and move/update only the changed DOM nodes. Without track, Angular would destroy and recreate all DOM nodes on every list change — equivalent to trackBy in *ngFor, but now enforced by the compiler.',
    },
    {
      q: 'What does signal.asReadonly() return and why is it useful?',
      options: [
        'It returns null — the signal is deleted from the component',
        'It returns a read-only Signal<T> view that prevents callers from calling .set() or .update()',
        'It returns a frozen clone of the current signal value',
        'It returns an Observable that emits the signal\'s value on every change',
      ],
      answer: 1,
      explanation: 'asReadonly() returns a Signal<T> (not a WritableSignal<T>). TypeScript prevents calling .set() or .update() on the returned view at compile time. This enforces that all mutations go through the service\'s public methods — a key pattern for service-based state management with signals.',
    },
    {
      q: 'How do you convert an RxJS Observable into an Angular Signal?',
      options: [
        'observable$.asSignal()',
        'signal(observable$)',
        'toSignal(observable$) from @angular/core/rxjs-interop',
        'computed(() => observable$.pipe(take(1)))',
      ],
      answer: 2,
      explanation: 'toSignal(observable$) from @angular/core/rxjs-interop converts an Observable to a Signal and auto-unsubscribes when the injection context is destroyed. The inverse is toObservable(signal), which lets you pipe signal changes through RxJS operators like debounceTime and switchMap.',
    },
  ];

  qna: QnaItem[] = [
    { q: 'What is the difference between signal.set() and signal.update()?', a: '<code>set(val)</code> replaces the value directly — you provide the new value independently. <code>update(fn)</code> derives the new value from the current one atomically: <code>count.update(n => n + 1)</code>. Use <code>update()</code> whenever the new value depends on the old one to avoid reading a stale value.' },
    { q: 'Can a computed() signal be written to?', a: 'No — <code>computed()</code> is read-only. If you need a writable signal whose default is computed but can be user-overridden, use <code>linkedSignal()</code> (Angular 19+). It resets to the computed default when its dependencies change but can be temporarily set to a different value.' },
    { q: 'Why must effect() be called inside an injection context?', a: 'Angular\'s DI system ties the effect\'s lifecycle to the host component or service. Without an injection context, Angular cannot automatically clean up the effect when the component is destroyed, causing a memory leak. Use <code>runInInjectionContext(injector, () => effect(...))</code> for late registration.' },
    { q: 'What is the track expression in @for and why is it required?', a: '<code>track</code> provides a unique stable identity for each item in the list. Angular uses it to diff old and new lists and update only changed DOM nodes — equivalent to <code>trackBy</code> in <code>*ngFor</code> but now enforced by the compiler. Using <code>track $index</code> disables optimisation; prefer <code>track item.id</code>.' },
    { q: 'How do signals differ from RxJS Observables?', a: 'Signals are <strong>synchronous</strong> and always hold a current value — no subscription, no async pipe. Observables are lazy streams that can be async and may never emit. Signals are simpler for component state; use RxJS for complex async pipelines. Bridge with <code>toSignal(obs$)</code> and <code>toObservable(signal)</code>.' },
    { q: 'Can you read a signal outside an injection context?', a: 'Yes — signals can be read anywhere (event handlers, setTimeout callbacks, RxJS operators). The injection context restriction only applies to <strong>creating</strong> effects (<code>effect()</code>) and calling <code>inject()</code>. Reading a signal with <code>mySignal()</code> has no context requirement.' },
    { q: 'How do you bridge Angular Signals with HTTP requests?', a: 'Use <code>toSignal(this.http.get&lt;T&gt;(\'/api/data\'), { initialValue: [] })</code>. The HTTP request fires on injection, the signal holds the most recent emission, and it auto-unsubscribes on destroy. For lazy requests (user-triggered), call <code>subscribe()</code> manually and write the result into a writable signal. Angular 19+ <code>resource()</code> / <code>rxResource()</code> provides a built-in reactive HTTP loading primitive.' },
    { q: 'What is the purpose of the @defer block?', a: '<code>@defer (on viewport)</code> lazily loads a chunk of the template — and all its component/pipe dependencies — only when the trigger condition fires. The deferred block is compiled into a separate chunk by the Angular compiler. Other triggers: <code>on idle</code>, <code>on interaction</code>, <code>on timer(3s)</code>, <code>when condition()</code>. Use <code>@placeholder</code> and <code>@loading</code> sub-blocks for the pre-load experience.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'signal()', type: 'function', desc: 'Creates a writable reactive primitive. Read with signal(), write with .set(val) or .update(fn => newVal). Triggers reactive tracking in templates and computed/effect.', since: '16' },
    { name: 'computed()', type: 'function', desc: 'Creates a read-only, memoised derived signal. Recalculates only when signal dependencies change. Lazy — does not run until first read.', since: '16' },
    { name: 'effect()', type: 'function', desc: 'Runs a side-effect callback whenever any signal it reads changes. Must be in injection context. Auto-cleans up on destroy.', since: '16' },
    { name: 'signal.set()', type: 'method', desc: 'Replaces the signal value with a new value. Propagates changes to all dependents (computed, effect, template).', since: '16' },
    { name: 'signal.update()', type: 'method', desc: 'Derives the new signal value from the current value via a callback: count.update(n => n + 1). Atomic read-modify-write.', since: '16' },
    { name: 'signal.asReadonly()', type: 'method', desc: 'Returns a Signal<T> (not WritableSignal) — callers can read but TypeScript prevents .set() or .update() calls.', since: '16' },
    { name: '@if / @else', type: 'directive', desc: 'Built-in conditional control flow. Replaces *ngIf and ng-template with #else ref. No imports needed.', since: '17' },
    { name: '@for / @empty', type: 'directive', desc: 'Built-in loop control flow. track is mandatory. @empty renders when the list is empty. Local vars: $index, $first, $last.', since: '17' },
    { name: 'toSignal()', type: 'function', desc: 'Converts an Observable to a Signal. From @angular/core/rxjs-interop. Requires injection context, auto-unsubscribes on destroy.', since: '16' },
    { name: 'toObservable()', type: 'function', desc: 'Converts a Signal to an Observable that emits on every signal change. Pipe through RxJS operators like debounceTime and switchMap.', since: '16' },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Conditionals: *ngIf vs @if',
      before: `<!-- Angular < 17: requires CommonModule, verbose ng-template -->
<div *ngIf="isLoggedIn; else guestTpl">
  Welcome back!
</div>
<ng-template #guestTpl>
  <p>Please log in.</p>
</ng-template>`,
      after: `<!-- Angular 17+: built-in, no import, readable -->
@if (isLoggedIn()) {
  <p>Welcome back!</p>
} @else {
  <p>Please log in.</p>
}`,
      note: '@if is built into the template engine — no CommonModule import needed. Signals integrate naturally: isLoggedIn() is called without any async pipe.',
    },
    {
      title: 'List rendering: *ngFor vs @for',
      before: `<!-- Angular < 17: trackBy requires a separate method -->
<li *ngFor="let item of items; trackBy: trackById">
  {{ item.name }}
</li>
<li *ngIf="items.length === 0">No items</li>`,
      after: `<!-- Angular 17+: track is inline, @empty is built-in -->
@for (item of items(); track item.id) {
  <li>{{ item.name }}</li>
} @empty {
  <li>No items found.</li>
}`,
      note: 'track replaces the external trackBy method — it is mandatory and enforced by the compiler. @empty replaces the separate ngIf empty guard.',
    },
    {
      title: 'Reactive state: BehaviorSubject vs signal()',
      before: `// Pre-signals: RxJS BehaviorSubject for component state
count$   = new BehaviorSubject(0);
doubled$ = this.count$.pipe(map(n => n * 2));
increment() { this.count$.next(this.count$.getValue() + 1); }
// Template: {{ count$ | async }} — needs AsyncPipe import`,
      after: `// Angular 16+: Signal — synchronous, no subscription
count   = signal(0);
doubled = computed(() => this.count() * 2);
increment() { this.count.update(n => n + 1); }
// Template: {{ count() }} — no async pipe, no import`,
      note: 'Signals are synchronous and always hold a value. No subscription, no async pipe, no unsubscribe — the template reads the signal directly with ().',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting () when reading a signal in the template',
      wrong: `<!-- BUG: renders the Signal object, not its value; no reactive tracking -->
<p>{{ count }}</p>
<button [disabled]="isZero">Reset</button>`,
      right: `<!-- Correct: call the signal as a function -->
<p>{{ count() }}</p>
<button [disabled]="isZero()">Reset</button>`,
      explanation: 'Signals are getter functions. Omitting () renders "[object Object]" or similar in the template and disables reactive tracking — the template will not update when the signal changes.',
    },
    {
      title: 'Writing to a signal inside effect() creating an infinite loop',
      wrong: `effect(() => {
  const val = this.count();         // reads count
  this.count.set(val > 10 ? 10 : val); // writes count → infinite loop!
});`,
      right: `// Move the cap logic into the increment method instead:
increment() {
  this.count.update(n => Math.min(n + this.step(), 10));
}`,
      explanation: 'If an effect reads signal A and then writes to signal A, the write triggers the effect to re-run, which reads A again, writes again — infinite loop. Move clamping/constraint logic into the mutation method instead.',
    },
    {
      title: 'Omitting track in @for',
      wrong: `<!-- Compiler error in Angular 17+ — track is required -->
@for (item of items()) {
  <li>{{ item.name }}</li>
}`,
      right: `@for (item of items(); track item.id) {
  <li>{{ item.name }}</li>
} @empty {
  <li>No items.</li>
}`,
      explanation: 'track is mandatory in @for and the template compiler enforces it with an error. Using track $index disables DOM diffing optimisation — always prefer track item.id or another stable, unique property.',
    },
    {
      title: 'Calling effect() outside an injection context',
      wrong: `export class MyService {
  setupEffect() {
    // ERROR: No injection context here — called after constructor
    effect(() => console.log(this.count()));
  }
}`,
      right: `export class MyService {
  constructor() {
    // Constructor IS an injection context
    effect(() => console.log(this.count()));
  }
}`,
      explanation: 'effect() must run during construction so Angular can bind the effect\'s lifetime to the component/service and clean it up on destroy. Late creation requires runInInjectionContext(injector, () => effect(...)).',
    },
    {
      title: 'Mutating a signal array in-place instead of replacing the reference',
      wrong: `// BUG: push mutates the array — same reference, signal does not propagate
cartAdd(item: CartItem) {
  this.cartItems().push(item); // cartItems() returns the array, push mutates it
}`,
      right: `// Correct: always return a new array from update()
cartAdd(item: CartItem) {
  this.cartItems.update(list => [...list, item]);
}`,
      explanation: 'Angular Signals detect changes by reference equality. Mutating the existing array without replacing the signal\'s reference is a silent no-op — the signal considers the value unchanged and no re-render occurs.',
    },
  ];

  challenge: Challenge = {
    title: 'Temperature Converter with Signal Sync',
    description: 'Create a component with two writable signals (celsius and fahrenheit) that always stay in sync. When the user types in the Celsius input, the Fahrenheit signal updates automatically, and vice versa. Use a computed() signal to show a colour indicator (blue for below 0, green for 0–37, red for above 37). Formula: F = C × 9/5 + 32.',
    language: 'typescript',
    hints: [
      'Use two separate writable signals: celsius = signal(0) and fahrenheit = signal(32).',
      'When setCelsius(c) is called, set the celsius signal AND compute the fahrenheit value from it — do NOT use computed() for the fahrenheit signal because the user must also be able to type into the F input.',
      'Add a third computed() for the colour indicator: computed(() => this.celsius() < 0 ? "blue" : this.celsius() <= 37 ? "green" : "red").',
      'Bind each input with [value]="celsius()" and (input)="setCelsius(+$any($event.target).value)".',
    ],
    starterCode: `import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-temp-converter',
  template: \`
    <div>
      <h2>Temperature Converter</h2>

      <!-- TODO: bind to celsius signal -->
      <label>Celsius: <input type="number" /></label>

      <!-- TODO: bind to fahrenheit signal -->
      <label>Fahrenheit: <input type="number" /></label>

      <!-- TODO: show colour indicator based on celsius value -->
    </div>
  \`,
})
export class TempConverter {
  celsius    = signal(0);
  fahrenheit = signal(32);

  // TODO: computed for colour
  colour = computed(() => '');

  // TODO: update both signals when celsius changes
  setCelsius(c: number)    { /* ... */ }

  // TODO: update both signals when fahrenheit changes
  setFahrenheit(f: number) { /* ... */ }
}`,
    solution: `import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-temp-converter',
  template: \`
    <div>
      <h2>Temperature Converter</h2>
      <label>
        Celsius:
        <input type="number" [value]="celsius()"
               (input)="setCelsius(+$any($event.target).value)" />
      </label>
      <label>
        Fahrenheit:
        <input type="number" [value]="fahrenheit()"
               (input)="setFahrenheit(+$any($event.target).value)" />
      </label>
      <div [style.color]="colour()">
        {{ celsius() }}°C = {{ fahrenheit() }}°F
      </div>
    </div>
  \`,
})
export class TempConverter {
  celsius    = signal(0);
  fahrenheit = signal(32);

  colour = computed(() => {
    const c = this.celsius();
    if (c < 0)  return 'blue';
    if (c <= 37) return 'green';
    return 'red';
  });

  setCelsius(c: number) {
    this.celsius.set(c);
    this.fahrenheit.set(Math.round(c * 9 / 5 + 32));
  }

  setFahrenheit(f: number) {
    this.fahrenheit.set(f);
    this.celsius.set(Math.round((f - 32) * 5 / 9));
  }
}`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Angular Signals are synchronous reactive primitives — signal() holds a value, computed() derives it, effect() reacts to it; read all signals with () in templates, write with .set()/.update(), and use asReadonly() in services to enforce controlled mutation.',
    mustKnow: [
      'Read signals by calling them: <code>count()</code> — omitting <code>()</code> renders the Signal object, not its value, and disables reactive tracking',
      '<code>computed()</code> is read-only and lazy — it only recalculates when a dependency changes AND it is actually read; never use for writable derived state',
      '<code>effect()</code> must be created in an injection context (constructor/field); writing to a signal the effect also reads causes an infinite loop',
      '<code>track</code> is mandatory in <code>@for</code> — prefer <code>track item.id</code> over <code>track $index</code> for proper DOM diffing',
      '<code>signal.asReadonly()</code> returns a <code>Signal&lt;T&gt;</code> that TypeScript prevents <code>.set()</code> calls on — use in services to enforce unidirectional mutation',
      'Mutating an array in-place without replacing the reference is a silent no-op — always spread: <code>update(list => [...list, newItem])</code>',
      '<code>toSignal(obs$, { initialValue: [] })</code> bridges RxJS → Signal; <code>toObservable(signal)</code> goes the other way for debounce/switchMap pipelines',
    ],
    interviewFocus: [
      'What is the difference between signal.set() and signal.update()? When would you use each?',
      'Why is computed() lazy, and what does that mean for performance?',
      'Why can\'t you write to a signal inside effect() that the same effect reads?',
      'What does asReadonly() return and how does it enforce the service pattern at the type level?',
      'How do you bridge an RxJS HTTP observable with Angular Signals in a component?',
    ],
  };
}
