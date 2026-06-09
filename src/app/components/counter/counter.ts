import { Component, signal, computed, effect } from '@angular/core';
import { CommonModule, JsonPipe } from '@angular/common';
import { CodeBlockComponent, CodeTab } from '../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../shared/common-mistakes/common-mistakes';
import { VersionBadgeComponent, VersionInfo } from '../shared/version-badge/version-badge';
import { PageMetaComponent } from '../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../shared/page-complete/page-complete';

interface CartProduct { id: number; name: string; price: number; }
interface CartItem    { id: number; name: string; price: number; qty: number; }
interface AuthUser    { name: string; role: 'admin' | 'viewer'; }

@Component({
  selector: 'app-counter',
  imports: [CommonModule, JsonPipe, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
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

  // ── Cart demo ──────────────────────────────────────────────────────────────
  cartProducts = signal<CartProduct[]>([
    { id: 1, name: 'Angular Course',    price: 29.99 },
    { id: 2, name: 'TypeScript Book',   price: 14.99 },
    { id: 3, name: 'RxJS Deep Dive',    price: 19.99 },
    { id: 4, name: 'NgRx Workshop',     price: 24.99 },
  ]);

  cartItems    = signal<CartItem[]>([]);
  cartTotal    = computed(() => this.cartItems().reduce((s, i) => s + i.price * i.qty, 0));
  cartCount    = computed(() => this.cartItems().reduce((s, i) => s + i.qty, 0));
  cartIsEmpty  = computed(() => this.cartItems().length === 0);

  cartAdd(p: CartProduct) {
    this.cartItems.update(list => {
      const existing = list.find(i => i.id === p.id);
      if (existing) return list.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...list, { ...p, qty: 1 }];
    });
  }

  cartRemove(id: number) { this.cartItems.update(list => list.filter(i => i.id !== id)); }
  cartClear()             { this.cartItems.set([]); }

  // ── Auth readonly demo ──────────────────────────────────────────────────────
  private _authUser    = signal<AuthUser | null>(null);
  authUser             = this._authUser.asReadonly();
  authIsLoggedIn       = computed(() => this._authUser() !== null);
  authIsAdmin          = computed(() => this._authUser()?.role === 'admin');

  authLogin(role: 'admin' | 'viewer') {
    this._authUser.set({ name: role === 'admin' ? 'Karthik (Admin)' : 'Guest (Viewer)', role });
  }
  authLogout() { this._authUser.set(null); }

  // ── Code tabs for pattern demos ─────────────────────────────────────────────
  cartCodeTabs: CodeTab[] = [
    {
      label: 'Cart signals',
      language: 'typescript',
      code: `// All cart state as signals — computed() auto-recalculates
interface CartItem { id: number; name: string; price: number; qty: number; }

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
      code: `<!-- cartIsEmpty is computed — updates automatically -->
@if (cartIsEmpty()) {
  <p>Cart is empty</p>
} @else {
  @for (item of cartItems(); track item.id) {
    <div class="cart-row">
      {{ item.name }} × {{ item.qty }}
      = \${{ (item.price * item.qty).toFixed(2) }}
      <button (click)="remove(item.id)">✕</button>
    </div>
  }
  <!-- cartTotal auto-recalculates when any item changes -->
  <strong>Total: \${{ cartTotal().toFixed(2) }}</strong>
}`,
    },
  ];

  readonlyCodeTabs: CodeTab[] = [
    {
      label: 'asReadonly() pattern',
      language: 'typescript',
      code: `// Keep the writable signal private — expose read-only view
@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user    = signal<User | null>(null);

  // Consumers can READ but cannot call .set() on these
  readonly user        = this._user.asReadonly();
  readonly isLoggedIn  = computed(() => this._user() !== null);
  readonly isAdmin     = computed(() => this._user()?.role === 'admin');

  login(role: 'admin' | 'viewer') {
    this._user.set({ name: 'Karthik', role }); // only service can mutate
  }
  logout() { this._user.set(null); }
}

// In any component:
// auth = inject(AuthService);
// auth.user()       → User | null   (read-only signal)
// auth.isAdmin()    → boolean
// auth.user.set(x)  → ERROR at compile time! ✅`,
    },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'signal() — the reactive primitive',
      points: [
        'signal(initialValue) creates a writable reactive value. Read it by calling it like a function: count().',
        'signal.set(val) replaces the value; signal.update(fn) derives the new value from the current one.',
        'Signals are synchronous — there is no async scheduling. The new value is available immediately after set().',
        'Angular tracks which template expressions read which signals and re-renders only those expressions when they change.',
      ],
    },
    {
      heading: 'computed() — derived state',
      points: [
        'computed(() => expr) memoises the result — it only recalculates when a signal it read has changed.',
        'computed() is read-only — you cannot call .set() on it. Use signal() if you need a writable derived value.',
        'Computed signals are lazy — they only run when first read, not when their dependencies change.',
        'Nest computed() freely — Angular tracks the full dependency graph automatically.',
      ],
    },
    {
      heading: 'effect() — reactive side effects',
      points: [
        'effect(() => { ... }) re-runs whenever any signal it reads changes — like a computed() that has side effects.',
        'Must be called inside an injection context (constructor, field initialiser, or runInInjectionContext).',
        'effect() auto-cleans up when the component is destroyed — no manual unsubscribe needed.',
        'Do NOT write to signals inside effect() by default — it can cause infinite loops. Pass { allowSignalWrites: true } if needed.',
      ],
    },
    {
      heading: '@if / @for — built-in control flow',
      points: [
        '@if (condition) { ... } @else { ... } — replaces *ngIf directive. No import, no NgModule.',
        '@for (item of list; track item.id) { ... } — replaces *ngFor. track is required and prevents full re-renders.',
        '@for supports @empty { ... } for zero-item fallback — replaces the *ngIf on an empty message.',
        '@switch (expr) { @case (val) { } } — replaces ngSwitch. Cleaner than a chain of @if/@else if.',
      ],
    },
  ];

  qna: QnaItem[] = [
    { q: 'What is the difference between signal.set() and signal.update()?', a: '<code>set(val)</code> replaces the value directly. <code>update(fn)</code> derives the new value from the current one — e.g. <code>count.update(n => n + 1)</code>. Use <code>update()</code> when the new value depends on the old one.' },
    { q: 'Can a computed() signal be written to?', a: 'No — <code>computed()</code> is read-only. If you need a writable derived value, use <code>linkedSignal()</code> (Angular 19+) which resets to a computed default but can be overridden.' },
    { q: 'Why must effect() be called inside an injection context?', a: 'Angular\'s DI system ties the effect\'s lifecycle to the host component or service. Without an injection context, Angular cannot clean up the effect when the component is destroyed, causing memory leaks.' },
    { q: 'What is the track expression in @for and why is it required?', a: '<code>track</code> provides a unique identity for each item. Angular uses it to diff the list and update only changed DOM nodes. Without <code>track</code>, Angular re-creates all DOM nodes on every change — very inefficient.' },
    { q: 'How do signals differ from RxJS Observables?', a: 'Signals are <strong>synchronous</strong> and always hold a current value. Observables are lazy streams that can be async. Signals are simpler for state; use RxJS for complex async pipelines. Bridge with <code>toSignal()</code> and <code>toObservable()</code>.' },
    { q: 'Can you read a signal outside an injection context?', a: 'Yes — signals can be read anywhere (in event handlers, setTimeout, etc.). They only need injection context for <strong>creation</strong> (if using inject()) and for <code>effect()</code> registration.' },
  ];

  signalTabs: CodeTab[] = [
    {
      label: 'Shopping Cart (real-world)',
      language: 'typescript',
      code: `// Real-world pattern: shopping cart using signals
@Injectable({ providedIn: 'root' })
export class CartService {
  items = signal<CartItem[]>([]);

  // computed() automatically recalculates when items changes
  total    = computed(() => this.items().reduce((s, i) => s + i.price * i.qty, 0));
  itemCount = computed(() => this.items().reduce((s, i) => s + i.qty, 0));
  isEmpty   = computed(() => this.items().length === 0);

  add(product: Product) {
    this.items.update(list => {
      const existing = list.find(i => i.id === product.id);
      if (existing) return list.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...list, { ...product, qty: 1 }];
    });
  }

  remove(id: number) {
    this.items.update(list => list.filter(i => i.id !== id));
  }

  clear() { this.items.set([]); }
}

// In template:
// Total: {{ cart.total() | currency }}
// Items: {{ cart.itemCount() }}
// @if (cart.isEmpty()) { <p>Cart is empty</p> }`,
    },
    {
      label: 'Readonly signals + asReadonly()',
      language: 'typescript',
      code: `// Pattern: expose state read-only, force mutations through methods
@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<User | null>(null);
  private _loading = signal(false);

  // Expose as read-only — consumers can read but not write
  readonly user    = this._user.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);

  async login(email: string, password: string) {
    this._loading.set(true);
    try {
      const user = await this.api.login(email, password);
      this._user.set(user);            // only the service can call _user.set()
    } finally {
      this._loading.set(false);
    }
  }

  logout() { this._user.set(null); }
}

// ComponentA tries: auth.user.set(null); // ERROR at compile time!
// Must go through: auth.logout();`,
    },
    {
      label: 'signal() / computed() / effect()',
      language: 'typescript',
      code: `
import { signal, computed, effect } from '@angular/core';

export class Counter {
  // signal() — writable reactive value
  // Read by calling it like a function: count()
  count = signal(0);
  step  = signal(1);

  // computed() — derived value, auto-recalculates when deps change
  doubled    = computed(() => this.count() * 2);
  isNegative = computed(() => this.count() < 0);

  // effect() — side effect re-runs on every signal change it reads
  constructor() {
    effect(() => {
      console.log('count is now:', this.count()); // tracks count
    });
  }

  // .set() replaces the value; .update() derives from current
  increment() { this.count.update(n => n + this.step()); }
  reset()     { this.count.set(0); }
}`,
    },
    {
      label: '@if / @for template',
      language: 'html',
      code: `
<!-- @for with track — efficient DOM diffing -->
@for (entry of history(); track entry) {
  <li>{{ entry }}</li>
} @empty {
  <li>No changes yet.</li>
}

<!-- @if / @else if / @else — replaces *ngIf -->
@if (isNegative()) {
  <p>Count is negative</p>
} @else if (isZero()) {
  <p>Count is zero</p>
} @else {
  <p>Positive — doubled: {{ doubled() }}</p>
}

<!-- Property binding & event binding -->
<input [value]="step()" (input)="setStep($event)" />
<button (click)="increment()">+{{ step() }}</button>`,
    },
  ];

  // ── Quiz ────────────────────────────────────────────────────────────────────
  quiz: QuizQuestion[] = [
    {
      q: 'How do you read the current value of a signal?',
      options: ['signal.value', 'signal.get()', 'signal()', 'signal.read()'],
      answer: 2,
      explanation: 'Signals are functions — call them like signal() to read the current value.',
    },
    {
      q: 'Which function creates a read-only derived signal?',
      options: ['signal()', 'effect()', 'computed()', 'readonly()'],
      answer: 2,
      explanation: 'computed() creates a memoised, read-only signal whose value is derived from other signals.',
    },
    {
      q: 'What does signal.update(fn) do?',
      options: [
        'Replaces the value with fn',
        'Derives a new value from the current one using fn',
        'Schedules fn for the next change detection cycle',
        'Subscribes fn as a listener',
      ],
      answer: 1,
      explanation: 'update(fn) calls fn with the current value and sets the signal to whatever fn returns.',
    },
    {
      q: 'What happens when a signal read inside effect() changes?',
      options: [
        'Nothing — you must manually subscribe',
        'The effect re-runs automatically',
        'Angular triggers full change detection',
        'The computed() that wraps it re-evaluates',
      ],
      answer: 1,
      explanation: 'effect() tracks every signal read during its last run and re-executes when any of them change.',
    },
    {
      q: 'Which method makes a WritableSignal read-only before exposing it?',
      options: ['signal.freeze()', 'signal.lock()', 'signal.asReadonly()', 'signal.protect()'],
      answer: 2,
      explanation: 'asReadonly() returns a read-only view of the same signal — callers can read but not write.',
    },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'signal()', type: 'function', desc: 'Creates a writable reactive primitive; read it by calling it as a function, e.g. count().' , since: '16'},
    { name: 'computed()', type: 'function', desc: 'Creates a memoised, read-only derived signal that recalculates only when its signal dependencies change.' , since: '16'},
    { name: 'effect()', type: 'function', desc: 'Registers a side-effect callback that re-runs automatically whenever any signal it reads changes.' , since: '16'},
    { name: 'signal.set()', type: 'function', desc: 'Replaces the current signal value with a new value directly.' , since: '16'},
    { name: 'signal.update()', type: 'function', desc: 'Derives and sets the next signal value from the current value using a callback function.' , since: '16'},
    { name: 'signal.asReadonly()', type: 'function', desc: 'Returns a read-only view of a writable signal so consumers can read but not mutate it.' , since: '16'},
    { name: '@if', type: 'directive', desc: 'Built-in control flow block that replaces *ngIf; supports @else if and @else branches with no imports needed.' , since: '17'},
    { name: '@for', type: 'directive', desc: 'Built-in control flow block that replaces *ngFor; requires a track expression and supports an @empty fallback.' , since: '17'},
    { name: 'linkedSignal()', type: 'function', desc: 'Creates a writable signal whose default value is computed from other signals but can be overridden by the user.' , since: '19'},
    { name: 'toSignal()', type: 'function', desc: 'Bridges an RxJS Observable into a signal so it can be used in signal-based reactive contexts.' , since: '16'},
  ];

  beforeAfter: BeforeAfterExample[] = [
    { title: 'Template conditionals: *ngIf vs @if', before: `<!-- Angular < 17: requires CommonModule -->
<div *ngIf='isLoggedIn; else guestTpl'>
  Welcome back!
</div>
<ng-template #guestTpl>
  <p>Please log in.</p>
</ng-template>`, after: `<!-- Angular 17+: built-in, no import needed -->
@if (isLoggedIn()) {
  <p>Welcome back!</p>
} @else {
  <p>Please log in.</p>
}`,
      note: '@if is built into the template engine — no CommonModule or NgModule required.' },
    { title: 'List rendering: *ngFor vs @for', before: `<!-- Angular < 17 -->
<li *ngFor='let item of items; trackBy: trackById'>
  {{ item.name }}
</li>`, after: `<!-- Angular 17+: track is mandatory, @empty is built-in -->
@for (item of items(); track item.id) {
  <li>{{ item.name }}</li>
} @empty {
  <li>No items found.</li>
}`,
      note: 'track replaces trackBy and is required. @empty replaces a separate *ngIf empty-state guard.' },
    { title: 'Reactive state: RxJS BehaviorSubject vs signal()', before: `// Pre-signals pattern
count$ = new BehaviorSubject(0);
doubled$ = this.count$.pipe(map(n => n * 2));
increment() { this.count$.next(this.count$.getValue() + 1); }`, after: `// Angular 16+ signals
count   = signal(0);
doubled = computed(() => this.count() * 2);
increment() { this.count.update(n => n + 1); }`,
      note: 'Signals are synchronous, always hold a value, and need no subscription or async pipe in templates.' },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Writing to a signal inside effect() without the flag', wrong: `effect(() => {
  // this.count() read — then immediately written
  this.history.update(h => [this.count(), ...h]);
  this.count.set(0); // infinite loop risk!
});`, right: `effect(() => {
  const val = this.count(); // read
  this.history.update(h =>
    ['Count: ' + val, ...h].slice(0, 6)
  ); // write a DIFFERENT signal is fine
});`, explanation: 'Writing to a signal that the same effect reads creates an infinite loop. Write to unrelated signals, or pass { allowSignalWrites: true } only when you are sure no cycle exists.'  },
    { title: 'Forgetting to call the signal as a function in the template', wrong: `<!-- count is a signal, not a plain number -->
<p>{{ count }}</p>
<button [disabled]='isZero'>Reset</button>`, right: `<p>{{ count() }}</p>
<button [disabled]='isZero()'>Reset</button>`, explanation: 'Signals are functions. Omitting () renders the signal object reference, not its value, and disables reactive tracking.'  },
    { title: 'Omitting track in @for', wrong: `@for (item of items()) {
  <li>{{ item.name }}</li>
}`, right: `@for (item of items(); track item.id) {
  <li>{{ item.name }}</li>
}`, explanation: 'track is mandatory in @for. Without it the compiler errors; with a poor key (e.g. track $index) Angular recreates all DOM nodes on every list change.'  },
    { title: 'Calling effect() outside an injection context', wrong: `export class MyService {
  setupEffect() {
    effect(() => console.log(this.count()));
  }
}`, right: `export class MyService {
  constructor() {
    // constructor IS an injection context
    effect(() => console.log(this.count()));
  }
}`, explanation: 'effect() must be called during construction (or via runInInjectionContext) so Angular can tie the effect lifecycle to the component/service and clean it up on destroy.'  },
  ];

  versionItems: VersionInfo[] = [
    { version: 'Angular 16', label: 'Signals introduced (Developer Preview)', features: ['signal(), computed(), and effect() available as developer preview APIs', 'signal.set(), signal.update(), signal.asReadonly() all land in this release', 'toSignal() / toObservable() bridge RxJS and signals'] },
    { version: 'Angular 17', label: 'Built-in control flow & signals stable', features: ['@if, @for, @switch, @defer replace structural directives (*ngIf, *ngFor)', 'Signals graduate from developer preview to stable API', '@for requires track — compiler enforces it, enabling fine-grained DOM diffing'] },
  ];

  // ── Challenge ───────────────────────────────────────────────────────────────
  challenge: Challenge = {
    title: 'Temperature Converter',
    description: 'Create two signals (celsius, fahrenheit) that stay in sync — changing one updates the other using computed signals.',
    language: 'typescript',
    hints: [
      'Use two separate writable signals for celsius and fahrenheit',
      'Add two computed() signals: one converting C→F, one converting F→C',
      'Formula: F = C × 9/5 + 32',
    ],
    starterCode: `import { signal, computed } from '@angular/core';

export class TempConverter {
  celsius    = signal(0);
  fahrenheit = signal(32);

  // TODO: add computed signals so that changing celsius
  // reflects in fahrenheit and vice versa

  setCelsius(c: number)    { /* ... */ }
  setFahrenheit(f: number) { /* ... */ }
}`,
    solution: `import { signal, computed } from '@angular/core';

export class TempConverter {
  celsius    = signal(0);
  fahrenheit = signal(32);

  celsiusDisplay    = computed(() => this.celsius());
  fahrenheitDisplay = computed(() => this.celsius() * 9 / 5 + 32);

  setCelsius(c: number) {
    this.celsius.set(c);
    this.fahrenheit.set(c * 9 / 5 + 32);
  }

  setFahrenheit(f: number) {
    this.fahrenheit.set(f);
    this.celsius.set((f - 32) * 5 / 9);
  }
}`,
  };
}
