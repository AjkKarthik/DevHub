import { Component, inject } from '@angular/core';
import { CartStore } from './cart.store';
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

@Component({
  selector: 'app-signal-store',
  templateUrl: './signal-store.html',
  styleUrl: './signal-store.scss',
  providers: [CartStore],
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
})
export class SignalStoreDemo {
  readonly store = inject(CartStore);

  theory: TheoryPoint[] = [
    {
      heading: 'What is a signal store?',
      points: [
        'A signal store is a plain @Injectable service that holds state as signals and exposes computed() and methods.',
        'No NgRx, no reducers, no actions — just signals, computed(), and plain methods that call .set()/.update().',
        'providedIn: \'root\' makes it a singleton across the entire app — perfect for global cart/auth state.',
        'For component-local state, provide the store in the component\'s providers: [] — each instance gets its own.',
      ],
    },
    {
      heading: 'State shape',
      points: [
        'Define state as private signals — expose them as readonly via computed() or asReadonly().',
        'Derived values (totals, counts, filtered lists) live as computed() — they never get stale.',
        'Mutations are methods on the store class — centralised, testable, and easy to trace.',
        'Avoid exposing writable signals directly — consumers should mutate only through methods.',
      ],
    },
    {
      heading: 'Async operations',
      points: [
        'Use async methods on the store: async loadData() { const d = await fetch(...); this.items.set(d); }',
        'Track loading state: loading = signal(false); set true before fetch, false after.',
        'Track errors: error = signal<string | null>(null); clear on success, set on catch.',
        'For complex async flows, use @ngrx/signals rxMethod() — but plain async/await covers most cases.',
      ],
    },
    {
      heading: 'Key points to remember',
      points: [
        'Signal stores are simpler than NgRx but have no DevTools or time-travel debugging out of the box.',
        'Multiple components injecting the same root store all share the same signal state.',
        'Use withComponentInputBinding() + toSignal() when bridging HTTP into a store.',
        'Signal stores compose well — inject one store into another for cross-feature state.',
      ],
    },
  ];

  qna: QnaItem[] = [
    { q: 'What is a signal store pattern?', a: 'A signal store is an injectable service that holds state as private <code>signal()</code>s and exposes derived state via <code>computed()</code> and mutations as methods. No NgRx needed for most apps.' },
    { q: 'How do you expose read-only state from a signal store?', a: 'Use <code>signal.asReadonly()</code> or expose state only through <code>computed()</code>. Never expose the writable signal directly — consumers should only mutate state through store methods.' },
    { q: 'How is a signal store different from @ngrx/signals?', a: 'A plain signal store is a hand-crafted service with no framework. <code>@ngrx/signals</code> adds structure (<code>signalStore()</code>, <code>withEntities()</code>), DevTools support, and rxMethod for async. Use <code>@ngrx/signals</code> for larger apps.' },
    { q: 'How do multiple components share the same store state?', a: 'All components that inject a <code>providedIn: \'root\'</code> service get the same instance — and therefore the same signals. Any component that calls a store method triggers change detection in all components reading that signal.' },
    { q: 'How do you handle async operations in a signal store?', a: 'Use async methods: <code>async load() { this.loading.set(true); try { this.data.set(await this.api.fetch()); } finally { this.loading.set(false); } }</code>. No actions or effects needed.' },
    { q: 'When should you lift state to a store vs keeping it local?', a: 'Keep state local (component signal) if only one component uses it. Lift to a service store when multiple components share or react to the same state. Lift to @ngrx/signals when you need DevTools, entity normalisation, or cross-team conventions.' },
  ];

  storeTabs: CodeTab[] = [
    {
      label: 'Store class',
      language: 'typescript',
      code: `
// src/app/components/signal-store/cart.store.ts
@Injectable()   // NO providedIn:'root' — scoped to the component tree
export class CartStore {
  // Private writable signal — only the store mutates state
  private items = signal<CartItem[]>([]);

  // Public derived signals — components read these, never items directly
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
      code: `
// Provide the store at component level — destroyed with the component
@Component({
  providers: [CartStore],  // <-- scoped lifetime, not singleton
  imports: [CodeBlockComponent],
})
export class SignalStoreDemo {
  // inject() picks up the component-scoped CartStore
  readonly store = inject(CartStore);
}

// Template reads directly from signals — no async pipe needed
// store.total()    → computed, always up-to-date
// store.isEmpty()  → computed, re-evaluates when items change
// store.add(p)     → mutation method

// Why not NgRx?
// For most apps, this pattern is enough:
//   signal() + computed() + Injectable = a full reactive store
// NgRx adds value when you need: devtools, time-travel,
// effects pipeline, or a very large shared state surface.`,
    },
    {
      label: 'Store vs Service vs Component',
      language: 'typescript',
      code: `
// ── COMPONENT SIGNAL (local state) ────────────────────────
// Use when: state is UI-only and not shared
count = signal(0);  // lives and dies with the component

// ── SERVICE WITH SIGNALS (shared state) ───────────────────
// Use when: state is shared between routes / many components
@Injectable({ providedIn: 'root' })
export class TodoService {
  private todos = signal<Todo[]>([]);
  readonly all = this.todos.asReadonly();
  // ...mutations
}

// ── STORE (scoped shared state) ───────────────────────────
// Use when: state is shared within a subtree but NOT globally
@Injectable()   // no providedIn — must be explicitly provided
export class CartStore { ... }

@Component({
  providers: [CartStore],  // scope = this component + children
})
export class CheckoutPage { store = inject(CartStore); }`,
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'In the CartStore pattern shown, why is the `items` signal declared as `private`?', options: ['Private signals cannot be read by computed() inside the class', 'To prevent components from mutating state directly — all mutations go through store methods', 'Angular requires signals to be private for change detection to work', 'Private signals are faster than public ones at runtime'], answer: 1, explanation: 'Keeping `items` private ensures only the store\'s own methods can call `.set()` or `.update()`. Components access state through the public readonly signals (`cartItems`, `total`, etc.) and trigger changes only via methods like `add()`, `remove()`, and `clear()`.' },
    { q: 'What is the difference between providing CartStore in `providers: [CartStore]` on a component versus `@Injectable({ providedIn: \'root\' })`?', options: ['There is no practical difference — both create a singleton', 'Component-level providers cannot use inject(); root providers can', 'Component-level providers scope the store instance to that component\'s subtree and destroy it with the component', 'Root providers require NgModule; component-level providers work only in standalone components'], answer: 2, explanation: 'Listing CartStore in a component\'s `providers: []` creates an instance scoped to that component tree. It is destroyed when the component is destroyed. A `providedIn: \'root\'` store is a global singleton that lives for the entire app lifetime.' },
    { q: 'In the template, `store.itemCount()` is called with parentheses, but `store.catalogue` is accessed without them. What does this tell you?', options: ['itemCount is a regular method; catalogue is an input property', 'itemCount is a computed signal (must be called to read); catalogue is a plain array property (not a signal)', 'itemCount uses async pipe internally; catalogue is synchronous', 'catalogue is a setter; itemCount is a getter'], answer: 1, explanation: '`computed()` returns a signal, which is a function — you call it with `()` to read the current value. A plain class property like `catalogue` is just a JavaScript array and is accessed without parentheses.' },
    { q: 'Which of the following correctly describes how to track loading state for an async operation inside a signal store?', options: ['Use a BehaviorSubject and pipe it through async pipe in the template', 'Declare `loading = signal(false)`, set it to `true` before the fetch and back to `false` in a `finally` block', 'Dispatch a LoadingStarted action and handle it in a NgRx reducer', 'Use `ChangeDetectorRef.markForCheck()` after the fetch completes'], answer: 1, explanation: 'The signal store pattern tracks loading with a dedicated signal: `loading = signal(false)`. Set it to `true` before the async call and reset it to `false` inside a `finally` block so it resets even on error. No observables or actions needed.' },
    { q: 'When multiple components inject the same `providedIn: \'root\'` signal store and one component calls a store mutation method, what happens to the other components?', options: ['Nothing — each component gets its own copy of the store signals', 'The other components need to call detectChanges() manually to update', 'All components reading that signal are automatically updated because they share the same signal instance', 'Only the component that called the method updates; others update on the next navigation event'], answer: 2, explanation: 'All components injecting a root-provided store receive the same service instance and therefore the same signal objects. Signals propagate changes reactively — any component reading a mutated signal re-renders automatically without manual intervention.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'signal()', type: 'function', desc: 'Creates a writable reactive state container — call it with () to read, .set() to replace, and .update() to derive the next value.', since: '16'},
    { name: 'computed()', type: 'function', desc: 'Creates a read-only derived signal whose value is recalculated lazily whenever its signal dependencies change.', since: '16'},
    { name: 'signal.asReadonly()', type: 'function', desc: 'Returns a read-only view of a writable signal so consumers can read state without being able to mutate it.', since: '16'},
    { name: 'signal.update()', type: 'function', desc: 'Derives the next signal value from the current one via a pure function, replacing the previous value atomically.', since: '16'},
    { name: 'signal.set()', type: 'function', desc: 'Directly replaces the current signal value with a new one, notifying all reactive consumers.', since: '16'},
    { name: '@Injectable()', type: 'decorator', desc: 'Marks a class as an Angular service; omit providedIn to scope the store to a specific component tree via providers:[].', since: '2'},
    { name: 'inject()', type: 'function', desc: 'Retrieves a dependency from the current injector context — the modern alternative to constructor injection for signal-based services.', since: '14'},
    { name: 'effect()', type: 'function', desc: 'Runs a side-effect callback whenever its signal dependencies change; useful for persistence or logging inside a store.', since: '16'},
    { name: 'toSignal()', type: 'function', desc: 'Bridges an Observable into a signal so RxJS-based data sources (e.g., HttpClient) can be consumed inside a signal store.', since: '16'},
  ];

  beforeAfter: BeforeAfterExample[] = [
    { title: 'Global state: BehaviorSubject service vs signal store', before: `// Old pattern — BehaviorSubject service
@Injectable({ providedIn: 'root' })
export class CartService {
  private items$ = new BehaviorSubject<CartItem[]>([]);
  readonly items = this.items$.asObservable();
  add(item: CartItem) {
    this.items$.next([...this.items$.value, item]);
  }
}`, after: `// New pattern — signal store
@Injectable({ providedIn: 'root' })
export class CartStore {
  private items = signal<CartItem[]>([]);
  readonly cartItems = this.items.asReadonly();
  readonly total = computed(() =>
    this.items().reduce((s, i) => s + i.product.price * i.qty, 0));
  add(item: CartItem) { this.items.update(c => [...c, item]); }
}`,
      note: 'No async pipe needed in templates; computed() replaces manual pipe chains.' },
    { title: 'Reading derived state: pipe(map()) vs computed()', before: `// Old — Observable chain for derived state
readonly total$ = this.items$.pipe(
  map(items => items.reduce((s, i) => s + i.price, 0))
);
// Template: {{ total$ | async }}`, after: `// New — computed signal
readonly total = computed(() =>
  this.items().reduce((s, i) => s + i.price, 0)
);
// Template: {{ store.total() }}`,
      note: 'computed() is lazy, synchronous, and requires no async pipe.' },
    { title: 'Scoped store: NgModule providers vs component providers', before: `// Old — module-scoped singleton (NgModule)
@NgModule({
  providers: [CartService]
})
export class CartModule {}`, after: `// New — component-scoped store (standalone)
@Component({
  providers: [CartStore],   // destroyed with this component
})
export class CheckoutPage {
  readonly store = inject(CartStore);
}`,
      note: 'Component-level providers scope the store lifetime to the component subtree.' },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Exposing writable signals publicly', wrong: `@Injectable()
export class CartStore {
  items = signal<CartItem[]>([]);  // public writable!
}`, right: `@Injectable()
export class CartStore {
  private items = signal<CartItem[]>([]);
  readonly cartItems = this.items.asReadonly();
}`, explanation: 'Exposing a writable signal lets any consumer call .set() or .update() directly, bypassing store logic and breaking encapsulation. Keep signals private and expose state only via asReadonly() or computed().' },
    { title: 'Forgetting to scope the store with providers:[]', wrong: `// Omitting providers scopes nothing — store
// may be inherited from a parent or not found
@Component({ imports: [FormsModule] })
export class CartPage {
  store = inject(CartStore);  // may resolve wrong instance
}`, right: `@Component({
  providers: [CartStore],  // explicit scope
  imports: [FormsModule],
})
export class CartPage {
  store = inject(CartStore);
}`, explanation: 'Without providers:[CartStore] on the component, Angular resolves CartStore from a parent injector or throws if none exists. Declare providers:[] to explicitly scope and own the store lifetime.' },
    { title: 'Reading signals without calling them (missing parentheses)', wrong: `// Template or code reads the signal function reference
<p>Total: {{ store.total }}</p>    <!-- renders [object Object] -->
const val = store.total;            // val is the Signal, not the number`, right: `<p>Total: {{ store.total() }}</p>  <!-- reads current value -->
const val = store.total();          // val is the number`, explanation: 'A signal is a getter function. You must call it with () to read the current value. Omitting the parentheses passes the Signal object itself, not its value.' },
    { title: 'Mutating signal state directly inside computed()', wrong: `readonly doubled = computed(() => {
  this.count.set(this.count() * 2);  // side effect in computed!
  return this.count();
});`, right: `readonly doubled = computed(() => this.count() * 2);

// Mutations belong in methods, not computed()
double() { this.count.update(v => v * 2); }`, explanation: 'computed() must be a pure derivation with no side effects. Calling .set() or .update() inside computed() causes infinite loops and runtime errors. Put mutations in explicit methods.' },
  ];

  versionItems: VersionInfo[] = [
    { version: 'Angular 16', label: 'Signals introduced', features: ['signal(), computed(), and effect() added as developer preview APIs', 'Signal-based state management available without NgRx', 'asReadonly() and update() available on WritableSignal'] },
    { version: 'Angular 17', label: 'Signals stable + @ngrx/signals released', features: ['signal(), computed(), effect() promoted to stable', '@ngrx/signals package released with signalStore() and withEntities()', '@if / @for control flow enables clean signal-driven templates without async pipe'] },
  ];

  challenge: Challenge = {
    title: 'Build a WishList Signal Store',
    description: 'Create a `WishListStore` — an `@Injectable()` class that manages a wish list of products using Angular signals. The store must hold private state as a signal, expose read-only derived signals, and provide mutation methods. Then wire it up in a minimal component.',
    language: 'typescript',
    hints: [
      'Declare `private items = signal<string[]>([])` as the single source of truth and never expose it directly.',
      'Use `computed(() => this.items().length)` for the item count and `computed(() => this.items().length === 0)` for isEmpty.',
      'The `add(name: string)` method should guard against duplicates using `items().includes(name)` before updating.',
      'Provide the store at component level with `providers: [WishListStore]` so it is scoped to the component\'s lifetime.',
    ],
    starterCode: `import { Component, inject, signal, computed } from '@angular/core';
import { Injectable } from '@angular/core';
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
  providers: [WishListStore], // TODO 2: confirm this scopes the store
  imports: [FormsModule],
  template: \`
    <h2>Wish List ({{ store.itemCount() }} items)</h2>

    <!-- TODO 3: show 'List is empty' when store.isEmpty() is true -->

    <!-- TODO 4: render each wish item with a Remove button -->

    <div>
      <input [(ngModel)]="newItem" placeholder="Add a wish..." />
      <button (click)="addItem()">Add</button>
      <!-- TODO 5: disable Add button when newItem is blank -->
    </div>

    <button (click)="store.clear()">Clear All</button>
  \`,
})
export class WishListComponent {
  readonly store = inject(WishListStore);
  newItem = '';

  addItem() {
    // TODO 6: call store.add() then reset newItem
  }
}`,
    solution: `import { Component, inject, signal, computed } from '@angular/core';
import { Injectable } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Injectable()
export class WishListStore {
  private items = signal<string[]>([]);

  readonly wishItems = this.items.asReadonly();
  readonly itemCount = computed(() => this.items().length);
  readonly isEmpty = computed(() => this.items().length === 0);

  add(name: string) {
    const trimmed = name.trim();
    if (!trimmed || this.items().includes(trimmed)) return;
    this.items.update(list => [...list, trimmed]);
  }

  remove(name: string) {
    this.items.update(list => list.filter(i => i !== name));
  }

  clear() {
    this.items.set([]);
  }
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
          <li>
            {{ item }}
            <button (click)="store.remove(item)">Remove</button>
          </li>
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
