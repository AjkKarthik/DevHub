import { Component, inject, computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
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

interface CartItem { id: number; name: string; price: number; qty: number; }
interface CartState { items: CartItem[]; discount: number; }

const CartStore = signalStore(
  { providedIn: 'root' },
  withState<CartState>({ items: [], discount: 0 }),
  withComputed(({ items, discount }) => ({
    itemCount: computed(() => items().reduce((s, i) => s + i.qty, 0)),
    subtotal:  computed(() => items().reduce((s, i) => s + i.price * i.qty, 0)),
    total:     computed(() => {
      const sub = items().reduce((s, i) => s + i.price * i.qty, 0);
      return sub - sub * (discount() / 100);
    }),
  })),
  withMethods(store => ({
    addItem(item: Omit<CartItem, 'qty'>) {
      const existing = store.items().find(i => i.id === item.id);
      if (existing) {
        patchState(store, { items: store.items().map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i) });
      } else {
        patchState(store, { items: [...store.items(), { ...item, qty: 1 }] });
      }
    },
    removeItem(id: number) { patchState(store, { items: store.items().filter(i => i.id !== id) }); },
    setDiscount(pct: number) { patchState(store, { discount: pct }); },
    clear() { patchState(store, { items: [], discount: 0 }); },
  })),
);

const PRODUCTS: Omit<CartItem, 'qty'>[] = [
  { id: 1, name: 'Angular Pro Course',   price: 49 },
  { id: 2, name: 'RxJS Mastery',         price: 29 },
  { id: 3, name: 'TypeScript Deep Dive', price: 39 },
  { id: 4, name: 'NgRx Signals Guide',   price: 19 },
];

@Component({
  selector: 'app-ngrx-signals',
  standalone: true,
  templateUrl: './ngrx-signals.html',
  styleUrl: './ngrx-signals.scss',
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    BeforeAfterComponent, CommonMistakesComponent,
    PageMetaComponent, PageCompleteComponent,
    RevisionCardComponent, PrerequisitesComponent,
  ],
})
export class NgrxSignalsDemo {
  store    = inject(CartStore);
  products = PRODUCTS;

  prerequisites: Prerequisite[] = [
    { label: 'Signal Store Pattern', route: '/angular/signal-store' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'signalStore()',                        type: 'function', desc: 'Creates a composable, injectable NgRx signal store by composing feature functions.', since: '17' },
    { name: 'withState()',                          type: 'function', desc: 'Defines the initial state shape for a signalStore; each key becomes a reactive signal on the store.', since: '17' },
    { name: 'withComputed()',                       type: 'function', desc: 'Adds memoised derived signals to a signalStore using Angular computed(); only recomputes when dependencies change.', since: '17' },
    { name: 'withMethods()',                        type: 'function', desc: 'Attaches mutating methods to a signalStore; methods call patchState() to update state in a type-safe, reactive way.', since: '17' },
    { name: 'patchState()',                         type: 'function', desc: 'Merges a partial state object into the current store state, triggering reactive updates in any component that reads the changed signals.', since: '17' },
    { name: 'withEntities()',                       type: 'function', desc: 'Adds a normalised entity collection to a signalStore, exposing entities(), entityMap(), and ids() signals plus CRUD helpers.', since: '17' },
    { name: 'withHooks()',                          type: 'function', desc: 'Registers onInit and onDestroy lifecycle hooks on a signalStore for side effects when the store is created or destroyed.', since: '17' },
    { name: 'rxMethod()',                           type: 'function', desc: 'Creates a store method that accepts a value, signal, or Observable and pipes it through RxJS operators with automatic cleanup.', since: '17' },
    { name: 'signalStoreFeature()',                 type: 'function', desc: 'Creates a reusable, composable store feature that can be mixed into any signalStore — the primary extension point of the NgRx signal ecosystem.', since: '18' },
    { name: 'addEntity() / removeEntity() / updateEntity()', type: 'function', desc: 'Entity adapter helpers from @ngrx/signals/entities that produce partial state updaters for use with patchState().', since: '17' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is @ngrx/signals and why use it over a plain signal store?',
      points: [
        '<code>@ngrx/signals</code> is the official NgRx library built entirely on Angular signals — no RxJS or classic actions/reducers required. It ships a <code>signalStore()</code> function that composes features (<code>withState</code>, <code>withComputed</code>, <code>withMethods</code>, <code>withHooks</code>, <code>withEntities</code>) into a single injectable class.',
        'Compared to a plain signal store (@Injectable class), <code>@ngrx/signals</code> adds structure: a predictable composition pipeline, reusable store features via <code>signalStoreFeature()</code>, and built-in entity management via <code>withEntities()</code>.',
        'Stores are injectable services. Pass <code>{ providedIn: \'root\' }</code> to <code>signalStore()</code> for global singleton state, or omit it and add the store to a component\'s <code>providers:[]</code> for component-scoped instances.',
        'Unlike NgRx Store, there are no actions, reducers, or effects to wire up. State updates happen by calling <code>patchState(store, partial)</code> directly inside <code>withMethods</code> functions.',
        'When to choose <code>@ngrx/signals</code>: entity collections, reusable store features across features, or when you want the NgRx DevTools ecosystem and team conventions without the ceremony of classic NgRx reducers.',
      ],
    },
    {
      heading: 'Store composition: withState, withComputed, withMethods',
      points: [
        '<strong>withState&lt;T&gt;(initialState)</strong> — defines the state shape and initial values. Each key in the object automatically becomes a <code>Signal&lt;T[key]&gt;</code> on the store. Access them in templates and methods via <code>store.keyName()</code>.',
        '<strong>withComputed(({ signal }) =&gt; ({ derived: computed(() =&gt; …) }))</strong> — creates read-only derived signals. The factory function receives the store\'s current state signals; always call them with <code>()</code> inside <code>computed()</code> to register the dependency.',
        '<strong>withMethods(store =&gt; ({ action() { patchState(store, partial) } }))</strong> — attaches mutation methods. These are the only place where <code>patchState()</code> should be called — never mutate state signals directly.',
        '<strong>withHooks({ onInit(store) {} })</strong> — runs side effects when the store is created (<code>onInit</code>) or destroyed (<code>onDestroy</code>). Use <code>onInit</code> to trigger initial data loading instead of calling methods in the constructor.',
        'The features compose in order: each one can access state and methods from the features defined before it. For example, <code>withMethods</code> can read signals defined in <code>withState</code> and computed values from <code>withComputed</code>.',
      ],
    },
    {
      heading: 'patchState() and immutable state updates',
      points: [
        '<code>patchState(store, partialState)</code> is the only correct way to update store state. It merges a partial object into the current state — similar to <code>Object.assign</code> but type-safe and reactive. Each call triggers signal updates and notifies all consumers.',
        'Never mutate array or object signals directly (e.g., <code>store.items().push(x)</code>). Angular\'s signal system detects changes by reference equality — in-place mutations produce the same reference, so Angular sees no change and the UI does not update.',
        'For entity collections, use helpers from <code>@ngrx/signals/entities</code>: <code>patchState(store, addEntity(item))</code>, <code>patchState(store, removeEntity(id))</code>, <code>patchState(store, updateEntity({ id, changes: fn }))</code>.',
        '<code>withEntities&lt;T&gt;()</code> normalises entities into an id-keyed map internally. It exposes <code>entities()</code> (the array), <code>entityMap()</code> (a <code>Record&lt;id, T&gt;</code> for O(1) lookup), and <code>ids()</code>.',
        'Multiple <code>patchState()</code> calls in a single method are batched — Angular does not re-render after each individual call. The UI updates once after the method finishes, keeping performance efficient even for bulk updates.',
      ],
    },
    {
      heading: 'Async operations: rxMethod() and withHooks()',
      points: [
        '<code>rxMethod&lt;T&gt;(pipe(…))</code> from <code>@ngrx/signals/rxjs-interop</code> creates a method that accepts a plain value, a signal reference, or an Observable and pipes it through RxJS operators. Subscriptions are automatically cleaned up when the store is destroyed.',
        'The typical async pattern: <code>rxMethod&lt;void&gt;(pipe(tap(() =&gt; patchState(store, { loading: true })), switchMap(() =&gt; inject(Service).getAll()), tap(data =&gt; patchState(store, { data, loading: false }))))</code>.',
        'Use <code>withHooks({ onInit(store) { store.load(); } })</code> to trigger initial data loading when the store is created. This is the @ngrx/signals equivalent of <code>ngOnInit()</code> — it runs once and is automatically cleaned up.',
        'For simple async operations without RxJS complexity, use plain <code>async</code> methods inside <code>withMethods</code>: <code>async load() { patchState(store, { loading: true }); try { patchState(store, { data: await … }); } finally { patchState(store, { loading: false }); } }</code>.',
        'Do not mix <code>rxMethod()</code> and plain <code>async</code> methods carelessly. <code>rxMethod()</code> supports automatic cancellation via <code>switchMap</code>, which is critical for search-as-you-type or parameter-reactive fetches. Plain async methods do not cancel in-flight requests.',
      ],
    },
    {
      heading: 'signalStoreFeature() — reusable store building blocks',
      points: [
        '<code>signalStoreFeature()</code> lets you package a set of features (<code>withState</code>, <code>withComputed</code>, <code>withMethods</code>) into a reusable function that can be mixed into any <code>signalStore()</code>. It is the primary extension point of the @ngrx/signals ecosystem.',
        'Example use case: a <code>withLoadingState()</code> feature that adds <code>loading</code> and <code>error</code> signals + a <code>setLoading()</code> helper. Every data store can compose this feature instead of repeating the same boilerplate.',
        'Custom features can be shared across teams as npm packages. The NgRx community already publishes feature packages (e.g., <code>@ngrx/signals/entities</code> is itself a set of features and helpers).',
        'The <code>type()</code> helper from <code>@ngrx/signals</code> constrains what kinds of stores can use a feature: <code>signalStoreFeature(type&lt;{ items: Signal&lt;Item[]&gt; }&gt;(), withComputed(…))</code> ensures the target store has the required state before the feature can be applied.',
        'Composable features make signal stores scale: a large app can define 10–15 reusable features and compose them into specific stores rather than duplicating loading/error/pagination patterns across every feature area.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'signalStore() basics',
      language: 'typescript',
      code: `import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { computed } from '@angular/core';

const CounterStore = signalStore(
  { providedIn: 'root' },
  withState({ count: 0, step: 1 }),
  withComputed(({ count, step }) => ({
    doubled:  computed(() => count() * 2),
    canReset: computed(() => count() !== 0),
  })),
  withMethods(store => ({
    increment() { patchState(store, { count: store.count() + store.step() }); },
    decrement() { patchState(store, { count: store.count() - store.step() }); },
    reset()     { patchState(store, { count: 0 }); },
    setStep(s: number) { patchState(store, { step: s }); },
  })),
);

// Usage in component:
// store = inject(CounterStore);
// store.count()     → read signal
// store.doubled()   → computed signal
// store.increment() → mutation method`,
    },
    {
      label: 'withEntities()',
      language: 'typescript',
      code: `import { signalStore, withMethods, patchState } from '@ngrx/signals';
import { withEntities, setAllEntities, addEntity, removeEntity, updateEntity } from '@ngrx/signals/entities';

interface Todo { id: number; title: string; done: boolean; }

const TodoStore = signalStore(
  withEntities<Todo>(),
  withMethods(store => ({
    load(todos: Todo[])   { patchState(store, setAllEntities(todos)); },
    add(todo: Todo)       { patchState(store, addEntity(todo)); },
    remove(id: number)    { patchState(store, removeEntity(id)); },
    toggle(id: number) {
      patchState(store, updateEntity({ id, changes: t => ({ done: !t.done }) }));
    },
  })),
);

// store.entities()   → Todo[]             (reactive array)
// store.entityMap()  → Record<id, Todo>   (O(1) lookup)
// store.ids()        → number[]`,
    },
    {
      label: 'withHooks + rxMethod',
      language: 'typescript',
      code: `import { inject } from '@angular/core';
import { signalStore, withState, withMethods, withHooks, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap } from 'rxjs';
import { tap } from 'rxjs/operators';

const DataStore = signalStore(
  withState({ data: [] as Item[], loading: false, error: '' }),
  withMethods(store => ({
    // rxMethod bridges RxJS into the signal store — subscriptions auto-cleaned on destroy
    load: rxMethod<void>(pipe(
      tap(() => patchState(store, { loading: true, error: '' })),
      switchMap(() => inject(DataService).getAll()),
      tap({
        next:  data  => patchState(store, { data, loading: false }),
        error: err   => patchState(store, { error: err.message, loading: false }),
      }),
    )),
  })),
  withHooks({
    onInit(store)    { store.load(); },       // runs once on store creation
    onDestroy(store) { console.log('done'); },
  }),
);`,
    },
    {
      label: 'signalStoreFeature()',
      language: 'typescript',
      code: `import { signalStore, signalStoreFeature, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { computed } from '@angular/core';

// ── Reusable loading/error feature ─────────────────────────────────
function withLoadingState() {
  return signalStoreFeature(
    withState({ loading: false, error: '' }),
    withComputed(({ loading, error }) => ({
      hasError: computed(() => error().length > 0),
    })),
    withMethods(store => ({
      setLoading(v: boolean) { patchState(store, { loading: v }); },
      setError(msg: string)  { patchState(store, { error: msg, loading: false }); },
    })),
  );
}

// ── Compose into any store ──────────────────────────────────────────
const UserStore = signalStore(
  { providedIn: 'root' },
  withState({ users: [] as User[] }),
  withLoadingState(),   // <-- mix in the reusable feature
  withMethods(store => ({
    async loadUsers() {
      store.setLoading(true);
      try {
        const users = await fetch('/api/users').then(r => r.json());
        patchState(store, { users });
      } catch (e: unknown) {
        store.setError(e instanceof Error ? e.message : 'Failed');
      } finally {
        store.setLoading(false);
      }
    },
  })),
);
// store.loading(), store.error(), store.hasError() all available via withLoadingState()`,
    },
    {
      label: 'Component-scoped store',
      language: 'typescript',
      code: `import { Component, inject, computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';

// No { providedIn: 'root' } → must be declared in component providers
const WizardStore = signalStore(
  withState({ step: 1, name: '', email: '' }),
  withComputed(({ step }) => ({
    isLastStep: computed(() => step() === 3),
    progress:   computed(() => \`Step \${step()} of 3\`),
  })),
  withMethods(store => ({
    next()          { patchState(store, { step: Math.min(store.step() + 1, 3) }); },
    back()          { patchState(store, { step: Math.max(store.step() - 1, 1) }); },
    setName(n: string)  { patchState(store, { name: n }); },
    setEmail(e: string) { patchState(store, { email: e }); },
  })),
);

@Component({
  selector: 'app-wizard',
  standalone: true,
  providers: [WizardStore],   // each wizard instance gets its own store
  template: \`
    <p>{{ wizard.progress() }}</p>
    @if (wizard.step() === 1) { <input placeholder="Name" /> }
    @if (wizard.step() === 2) { <input placeholder="Email" /> }
    @if (wizard.isLastStep()) { <p>Review & Submit</p> }
    <button (click)="wizard.back()" [disabled]="wizard.step() === 1">Back</button>
    <button (click)="wizard.next()">Next</button>
  \`,
})
export class WizardComponent {
  wizard = inject(WizardStore);
}`,
    },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Global state: NgRx Store (actions/reducers) vs signalStore()',
      before: `// NgRx classic — actions, reducer, effects required
export const increment = createAction('[Counter] Increment');
export const reducer = createReducer(
  { count: 0 },
  on(increment, s => ({ ...s, count: s.count + 1 }))
);`,
      after: `// NgRx Signals — no actions, no reducer
const CounterStore = signalStore(
  { providedIn: 'root' },
  withState({ count: 0 }),
  withMethods(store => ({
    increment() { patchState(store, { count: store.count() + 1 }); },
  }))
);`,
      note: 'signalStore() replaces actions + reducers with direct method calls and patchState().',
    },
    {
      title: 'Derived state: createSelector() vs withComputed()',
      before: `// Classic NgRx selector
export const selectDoubled = createSelector(
  selectCount,
  count => count * 2
);
// component: this.doubled$ = store.select(selectDoubled);
// Template: {{ doubled$ | async }}`,
      after: `// signalStore withComputed
withComputed(({ count }) => ({
  doubled: computed(() => count() * 2),
}))
// component: store.doubled()  — plain signal call, no subscribe
// Template: {{ store.doubled() }}`,
      note: 'withComputed() replaces createSelector(); the result is a memoised signal, not an Observable.',
    },
    {
      title: 'Async ops: NgRx Effects vs rxMethod()',
      before: `// NgRx Effects — actions, ofType, dispatch required
loadData$ = createEffect(() =>
  this.actions$.pipe(
    ofType(loadData),
    switchMap(() => this.api.getAll()),
    map(data => loadDataSuccess({ data }))
  )
);`,
      after: `// signalStore rxMethod — no actions or dispatch
load: rxMethod<void>(pipe(
  tap(() => patchState(store, { loading: true })),
  switchMap(() => inject(DataService).getAll()),
  tap(data => patchState(store, { data, loading: false }))
))`,
      note: 'rxMethod() from @ngrx/signals/rxjs-interop bridges RxJS into signal stores and auto-cleans on destroy.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Mutating state directly instead of using patchState()',
      wrong: `withMethods(store => ({
  addItem(item: Item) {
    store.items().push(item); // direct mutation — NOT reactive!
  }
}))`,
      right: `withMethods(store => ({
  addItem(item: Item) {
    patchState(store, { items: [...store.items(), item] });
  }
}))`,
      explanation: 'Store state is immutable. Angular detects changes by reference equality — in-place mutations produce the same reference, so the UI does not update. Always use patchState() to produce a new state reference.',
    },
    {
      title: 'Forgetting to call signal values with () inside computed()',
      wrong: `withComputed(({ count }) => ({
  // count is a Signal — must be called with ()
  doubled: computed(() => count * 2),  // always NaN/[object Function]
}))`,
      right: `withComputed(({ count }) => ({
  doubled: computed(() => count() * 2),  // correct: read signal value
}))`,
      explanation: 'Destructured store slices are signals (functions). You must invoke them with () inside computed() to register the reactive dependency and get the current value. Without (), computed receives the signal function itself, not its value.',
    },
    {
      title: 'Providing the store globally when component-scoped state is needed',
      wrong: `// All components share the SAME instance — state bleeds between instances
const FormStore = signalStore(
  { providedIn: 'root' }, // global singleton
  withState({ value: '' })
);`,
      right: `// Omit providedIn — scope via component providers
const FormStore = signalStore(withState({ value: '' }));

@Component({ providers: [FormStore] }) // each instance is isolated
export class FormComponent { store = inject(FormStore); }`,
      explanation: "Using providedIn: 'root' creates a singleton shared by all components. For per-instance state (forms, dialogs, wizards), omit it and add the store to the component's providers array so each instance gets its own isolated store.",
    },
    {
      title: 'Importing entity helpers from the wrong path',
      wrong: `// WRONG — these do NOT exist in '@ngrx/signals'
import { withEntities, addEntity } from '@ngrx/signals';`,
      right: `// Correct — entity helpers are in the /entities sub-entry point
import { withEntities, addEntity, removeEntity, updateEntity } from '@ngrx/signals/entities';`,
      explanation: "Entity adapter utilities live in the @ngrx/signals/entities sub-entry point, not the main @ngrx/signals package. Importing from @ngrx/signals will fail with a missing export error at runtime.",
    },
    {
      title: 'Calling patchState() outside of withMethods',
      wrong: `// Called directly in the component — bypasses store encapsulation
@Component({ ... })
export class MyComponent {
  store = inject(MyStore);
  update() {
    patchState(this.store, { count: 99 }); // direct mutation from outside
  }
}`,
      right: `// Define a method in withMethods — encapsulates the mutation
const MyStore = signalStore(
  withState({ count: 0 }),
  withMethods(store => ({
    setCount(v: number) { patchState(store, { count: v }); },
  })),
);
// Component calls: this.store.setCount(99);`,
      explanation: 'While patchState() can technically be called anywhere that has the store reference, doing so from outside withMethods defeats the purpose of the store pattern — state changes become scattered and untraceable. Encapsulate all mutations inside withMethods.',
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What function is used to update state inside a signalStore() method?',
      options: [
        'setState(store, partial)',
        'patchState(store, partial)',
        'updateState(store, partial)',
        'store.set(partial)',
      ],
      answer: 1,
      explanation: 'patchState(store, partialState) is the correct function. It merges a partial state object into the existing store state in a type-safe, reactive way — similar to Object.assign but designed for NgRx signal stores.',
    },
    {
      q: 'Which import path provides withEntities(), addEntity(), and removeEntity()?',
      options: [
        '@ngrx/signals',
        '@ngrx/store/entities',
        '@ngrx/signals/entities',
        '@ngrx/signals/rxjs-interop',
      ],
      answer: 2,
      explanation: "Entity adapter helpers like withEntities(), setAllEntities(), addEntity(), removeEntity(), and updateEntity() all come from '@ngrx/signals/entities', a separate sub-entry point of the @ngrx/signals package.",
    },
    {
      q: 'What signals does withEntities<Todo>() automatically expose on the store?',
      options: [
        'todos(), todosMap(), and todosCount()',
        'entities(), entityMap(), and ids()',
        'all(), byId(), and keys()',
        'selectAll(), selectMap(), and selectIds()',
      ],
      answer: 1,
      explanation: 'withEntities<T>() adds three signals: entities() which returns T[], entityMap() which returns a Record<id, T> for O(1) lookups, and ids() which returns the array of ids.',
    },
    {
      q: 'What is the key advantage of using rxMethod() from @ngrx/signals/rxjs-interop?',
      options: [
        'It converts signals into Observables for backward compatibility',
        'It creates a store method that accepts a value, signal, or Observable and auto-cleans subscriptions on store destroy',
        'It replaces withHooks() for async initialization',
        'It enables NgRx Effects to work inside a signalStore',
      ],
      answer: 1,
      explanation: 'rxMethod<T>(pipe(...)) creates a method that bridges RxJS into the signal world. It accepts a raw value, a signal reference, or an Observable as input and automatically unsubscribes when the store is destroyed, preventing memory leaks.',
    },
    {
      q: 'How do you scope a signalStore to a single component instance instead of providing it globally?',
      options: [
        "Pass { providedIn: 'component' } to signalStore()",
        "Use @Injectable({ scope: 'component' }) on the store class",
        "Omit { providedIn: 'root' } from signalStore() and add the store class to the component's providers array",
        "Call store.scoped() inside the component constructor",
      ],
      answer: 2,
      explanation: "To scope a store to a component, omit { providedIn: 'root' } from signalStore() and list the store class in the component decorator's providers: [MyStore]. Each component instance then gets its own store that is destroyed alongside the component.",
    },
    {
      q: 'What is the purpose of withHooks() in a signalStore?',
      options: [
        'It attaches lifecycle hooks to individual signals so they can react when their value changes',
        'It registers onInit and onDestroy callbacks that run when the store is created or destroyed — useful for initial data loading and cleanup',
        'It enables the store to hook into Angular\'s change detection cycle for manual re-render triggers',
        'It provides lifecycle methods equivalent to ngOnChanges() for tracking state transitions',
      ],
      answer: 1,
      explanation: 'withHooks({ onInit(store) {}, onDestroy(store) {} }) runs side effects at store creation and destruction. onInit is commonly used to trigger initial data loading (e.g., store.load()) without needing the component to call it explicitly after injection.',
    },
    {
      q: 'What does signalStoreFeature() enable in @ngrx/signals?',
      options: [
        'It allows a signal store to extend another store class using TypeScript inheritance',
        'It creates a reusable, composable building block that packages withState/withComputed/withMethods into a function that can be mixed into any signalStore()',
        'It enables a store to subscribe to another store\'s state changes as an Observable',
        'It is an alias for withHooks() with onInit and onDestroy combined',
      ],
      answer: 1,
      explanation: 'signalStoreFeature() is the primary extension point of @ngrx/signals. It lets you package a set of withState/withComputed/withMethods into a reusable function. Examples: withLoadingState(), withPagination(), withSelection() — shared across multiple stores without code duplication.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is signalStore() and how is it different from a plain service with signals?',
      a: '<code>signalStore()</code> composes feature functions (<code>withState</code>, <code>withComputed</code>, <code>withMethods</code>, <code>withHooks</code>) in a declarative pipeline. A plain service is imperative. The pipeline enforces a structure where each feature can only access the previous features — preventing the entanglement that grows in large hand-crafted services. signalStore() also adds entity management and reusable features via <code>signalStoreFeature()</code>.',
    },
    {
      q: 'How does patchState() work?',
      a: '<code>patchState(store, partialState)</code> merges a partial object into the current store state — like <code>Object.assign</code> but type-safe and reactive. Each changed key triggers an immediate signal update, which propagates to all computed signals and components reading that signal. Multiple calls within a single method are batched — Angular re-renders once after the method completes.',
    },
    {
      q: "How do you provide a signalStore at component level (not root)?",
      a: "Remove <code>{ providedIn: 'root' }</code> from the store definition. Then add the store class to the component's <code>providers: [MyStore]</code>. Each component instance gets its own store that is created when the component is created and destroyed when the component is destroyed. This is ideal for per-instance state like forms, wizards, or dialogs.",
    },
    {
      q: 'What is withEntities() and when should you use it?',
      a: "<code>withEntities&lt;T&gt;()</code> adds a normalised entity collection to the store. It provides <code>entities()</code> (reactive array), <code>entityMap()</code> (Record&lt;id, T&gt; for O(1) lookup), and <code>ids()</code>. Use it for any collection where you need fast lookups by ID, bulk CRUD operations (<code>setAllEntities</code>, <code>addEntity</code>, <code>removeEntity</code>, <code>updateEntity</code>), or when you want to avoid scanning full arrays on every update.",
    },
    {
      q: 'What is rxMethod() and why would you use it?',
      a: "<code>rxMethod&lt;T&gt;(pipe(…))</code> creates a store method that accepts a plain value, a signal reference, or an Observable and pipes it through RxJS operators. Used for async operations like API calls with <code>switchMap</code> (automatically cancels in-flight requests when called again). Subscriptions are automatically cleaned up when the store is destroyed — no manual <code>takeUntilDestroyed()</code> needed.",
    },
    {
      q: 'How do you read derived state in a signalStore template?',
      a: 'Derived signals from <code>withComputed()</code> are accessible directly on the injected store: <code>store.itemCount()</code>, <code>store.total()</code>. They are memoised computed signals — Angular only re-renders when their signal dependencies change. Call them with <code>()</code> in templates, just like any signal.',
    },
    {
      q: 'What is signalStoreFeature() and when do you use it?',
      a: '<code>signalStoreFeature()</code> packages a group of <code>withState</code> / <code>withComputed</code> / <code>withMethods</code> calls into a reusable function that can be composed into any <code>signalStore()</code>. Use it to avoid repeating loading/error state patterns, pagination logic, or selection behaviour across multiple stores. For example: <code>function withLoadingState() { return signalStoreFeature(withState({ loading: false, error: \'\' }), withMethods(…)); }</code> — then compose it as <code>signalStore(withState(…), withLoadingState())</code>.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: '@ngrx/signals replaces NgRx actions/reducers/effects with signalStore() — a composable pipeline of withState/withComputed/withMethods/withHooks that produces an injectable class whose state is all signals, updated exclusively via patchState().',
    mustKnow: [
      '<code>signalStore()</code> composes features in order: <code>withState → withComputed → withMethods → withHooks</code>; each can access what was defined before it',
      '<code>patchState(store, partial)</code> is the ONLY correct way to update state — never mutate signal values directly',
      'Always call signal values with <code>()</code> inside <code>withComputed()</code> — forgetting the parentheses registers no dependency and returns the signal function, not its value',
      'Entity management lives in <code>@ngrx/signals/entities</code>; RxJS bridge (<code>rxMethod()</code>) lives in <code>@ngrx/signals/rxjs-interop</code> — both are separate import paths',
      'Global store: <code>{ providedIn: \'root\' }</code> in <code>signalStore()</code>. Component-scoped store: omit it and add the class to <code>providers:[]</code>',
      '<code>withHooks({ onInit })</code> is the idiomatic place to trigger initial data loading — not the component constructor',
      '<code>signalStoreFeature()</code> is the primary extension point: packages reusable <code>withState/withComputed/withMethods</code> combinations for sharing across stores',
    ],
    interviewFocus: [
      'How does signalStore() differ from classic NgRx Store (actions/reducers/effects)?',
      'Why must you use patchState() instead of mutating signal values directly?',
      'What is the difference between withEntities() and plain withState() for collections?',
      'When would you use rxMethod() vs a plain async method in withMethods?',
      'What is signalStoreFeature() and what problem does it solve?',
    ],
  };

  challenge: Challenge = {
    title: 'Build a Todo Signal Store with Entity Adapter',
    language: 'typescript',
    description: 'Create a NgRx signal store for a todo list using withEntities(). The store should support adding todos, toggling their completion status, and removing them. Wire it up to a minimal template that renders the list and shows a count of remaining incomplete todos.',
    hints: [
      "Import withEntities, addEntity, removeEntity, and updateEntity from '@ngrx/signals/entities'. Your Todo interface needs an id field.",
      'Use patchState(store, addEntity(todo)) to add an item. The entity adapter automatically normalises it into the internal id-keyed map.',
      'For toggling, use updateEntity({ id, changes: t => ({ done: !t.done }) }) as the second argument to patchState.',
      'In withComputed(), derive a remaining signal: computed(() => store.entities().filter(t => !t.done).length).',
    ],
    starterCode: `import { Component, inject, computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { withEntities, addEntity, removeEntity, updateEntity } from '@ngrx/signals/entities';
import { FormsModule } from '@angular/forms';

interface Todo { id: number; title: string; done: boolean; }

// TODO: Create TodoStore using signalStore()
// - Use withEntities<Todo>()
// - Add withComputed() that exposes a 'remaining' count (todos where done === false)
// - Add withMethods() with: add(title: string), toggle(id: number), remove(id: number)
const TodoStore = signalStore(
  { providedIn: 'root' },
  // your code here
);

@Component({
  selector: 'app-todo',
  standalone: true,
  imports: [FormsModule],
  template: \`
    <h2>Todos ({{ store.remaining() }} remaining)</h2>
    <div>
      <input [(ngModel)]="newTitle" placeholder="New todo" />
      <button (click)="addTodo()">Add</button>
    </div>
    <ul>
      @for (todo of store.entities(); track todo.id) {
        <li>
          <input type="checkbox" [checked]="todo.done" (change)="store.toggle(todo.id)" />
          <span [style.text-decoration]="todo.done ? 'line-through' : 'none'">{{ todo.title }}</span>
          <button (click)="store.remove(todo.id)">Remove</button>
        </li>
      }
    </ul>
  \`,
})
export class TodoComponent {
  store = inject(TodoStore);
  newTitle = '';
  addTodo() {
    if (this.newTitle.trim()) { this.store.add(this.newTitle.trim()); this.newTitle = ''; }
  }
}`,
    solution: `import { Component, inject, computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { withEntities, addEntity, removeEntity, updateEntity } from '@ngrx/signals/entities';
import { FormsModule } from '@angular/forms';

interface Todo { id: number; title: string; done: boolean; }
let _nextId = 1;

const TodoStore = signalStore(
  { providedIn: 'root' },
  withEntities<Todo>(),
  withComputed((store) => ({
    remaining: computed(() => store.entities().filter(t => !t.done).length),
  })),
  withMethods((store) => ({
    add(title: string) {
      patchState(store, addEntity({ id: _nextId++, title, done: false }));
    },
    toggle(id: number) {
      patchState(store, updateEntity({ id, changes: t => ({ done: !t.done }) }));
    },
    remove(id: number) { patchState(store, removeEntity(id)); },
  })),
);

@Component({
  selector: 'app-todo',
  standalone: true,
  imports: [FormsModule],
  template: \`
    <h2>Todos ({{ store.remaining() }} remaining)</h2>
    <div>
      <input [(ngModel)]="newTitle" placeholder="New todo" />
      <button (click)="addTodo()">Add</button>
    </div>
    <ul>
      @for (todo of store.entities(); track todo.id) {
        <li>
          <input type="checkbox" [checked]="todo.done" (change)="store.toggle(todo.id)" />
          <span [style.text-decoration]="todo.done ? 'line-through' : 'none'">{{ todo.title }}</span>
          <button (click)="store.remove(todo.id)">Remove</button>
        </li>
      }
    </ul>
  \`,
})
export class TodoComponent {
  store = inject(TodoStore);
  newTitle = '';
  addTodo() {
    if (this.newTitle.trim()) { this.store.add(this.newTitle.trim()); this.newTitle = ''; }
  }
}`,
  };
}
